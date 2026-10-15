// Opt-in browser diagnostic: real candidate routes/AI, isolated DB transaction, no production records.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import pg from 'pg';
import { Hono } from 'hono';
import { initializeWritingDatabase, registerWritingRoutes } from './writing.js';
import { CodexRegistry } from './codex.js';
import { describeAiFailure } from './ai-errors.js';

const send = (value) => process.stdout.write(JSON.stringify(value) + '\n');
console.error = () => undefined;
const schema = `enpra_browser_${randomUUID().replaceAll('-', '')}`;
const user = {
  id: `preview:${randomUUID()}`,
  displayName: '로컬 라이팅 테스트',
};
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 8000,
});
let ai,
  timer,
  connected = false,
  stopping = false,
  queue = Promise.resolve(),
  calls = 0;
async function cleanup() {
  if (stopping) return;
  stopping = true;
  clearTimeout(timer);
  ai?.child.kill('SIGTERM');
  const force = setTimeout(() => {
    ai?.child.kill('SIGKILL');
    process.exit(1);
  }, 8000);
  try {
    if (connected) {
      await db.query('ROLLBACK');
      const check = await db.query(
        'SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname=$1) AS present',
        [schema],
      );
      assert.equal(check.rows[0].present, false);
      await db.end();
    }
    send({ event: 'closed', rollbackVerified: true });
  } catch {
    send({ event: 'closed', rollbackVerified: false });
  }
  if (ai?.child && ai.child.exitCode === null && ai.child.signalCode === null) {
    await new Promise((resolve) => {
      const kill = setTimeout(() => ai.child.kill('SIGKILL'), 5000);
      ai.child.once('exit', () => {
        clearTimeout(kill);
        resolve();
      });
    });
  }
  clearTimeout(force);
  process.exit(0);
}
try {
  assert.equal(process.env.ENPRA_WRITING_BROWSER_PREVIEW, '1');
  assert(process.env.DATABASE_URL);
  let home = process.env.ENPRA_CODEX_SHARED_HOME;
  if (!home) {
    const base = join(process.env.ENPRA_DATA_DIR, 'codex');
    const homes = readdirSync(base).filter((name) =>
      existsSync(join(base, name, 'auth.json')),
    );
    assert.equal(homes.length, 1);
    home = join(base, homes[0]);
  }
  home = realpathSync(home);
  assert.equal(basename(dirname(home)), 'codex');
  ai = new CodexRegistry(dirname(dirname(home))).get(basename(home));
  assert.equal((await ai.readAccount())?.type, 'chatgpt');
  await db.connect();
  connected = true;
  await db.query('BEGIN');
  await db.query(`CREATE SCHEMA ${schema}`);
  await db.query(`SET LOCAL search_path TO ${schema}`);
  await db.query("SET LOCAL statement_timeout='20s'");
  await db.query("SET LOCAL lock_timeout='5s'");
  await db.query("SET LOCAL idle_in_transaction_session_timeout='60min'");
  await db.query('CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT)');
  await db.query('INSERT INTO users(id,display_name) VALUES($1,$2)', [
    user.id,
    user.displayName,
  ]);
  let counter = 0;
  const savepoints = [];
  const pool = {
    async query(sql, params) {
      if (sql === 'BEGIN') {
        const point = `route_${++counter}`;
        savepoints.push(point);
        return db.query(`SAVEPOINT ${point}`);
      }
      if (sql === 'COMMIT') {
        const point = savepoints.pop();
        assert(point);
        return db.query(`RELEASE SAVEPOINT ${point}`);
      }
      if (sql === 'ROLLBACK') {
        const point = savepoints.pop();
        assert(point);
        await db.query(`ROLLBACK TO SAVEPOINT ${point}`);
        return db.query(`RELEASE SAVEPOINT ${point}`);
      }
      return db.query(sql, params);
    },
    async connect() {
      return { query: pool.query, release() {} };
    },
  };
  await initializeWritingDatabase(pool);
  if (process.env.ENPRA_WRITING_PREVIEW_STAGE) {
    assert.equal(process.env.ENPRA_WRITING_PREVIEW_STAGE, '5.0A');
    const rule = (
      await db.query(
        "SELECT public_level,level_group FROM writing_level_rules WHERE internal_stage='5.0A' AND rule_version='v3' AND is_active=TRUE ORDER BY id DESC LIMIT 1",
      )
    ).rows[0];
    await db.query(
      "INSERT INTO user_writing_profiles(user_id,onboarding_status,current_public_level,current_level_group,current_internal_stage,metrics_refreshed_for_date,metrics_refreshed_at) VALUES($1,'active',$2,$3,'5.0A',CURRENT_DATE,NOW())",
      [user.id, rule.public_level, rule.level_group],
    );
  }
  const codex = {
    get(userId) {
      assert.equal(userId, user.id);
      return {
        readAccount: () => ai.readAccount(),
        async runLearningPrompt(prompt, outputSchema) {
          assert(++calls <= 100, 'Preview AI call limit reached');
          send({
            event: 'ai_call',
            call: calls,
            kind: prompt.startsWith('EnPra IELTS Writing 답안')
              ? 'grading'
              : prompt.startsWith('EnPra IELTS Writing 문제')
                ? 'question'
                : prompt.startsWith('EnPra Writing 학습 문제용 힌트')
                  ? 'hints'
                  : 'other',
          });
          return ai.runLearningPrompt(prompt, outputSchema);
        },
      };
    },
  };
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('user', user);
    await next();
  });
  app.onError((error, c) => {
    const failure = describeAiFailure(error);
    return c.json({ error: failure.message }, failure.status);
  });
  registerWritingRoutes(app, pool, codex);
  const input = createInterface({ input: process.stdin });
  input.on('line', (line) => {
    queue = queue.then(async () => {
      let request;
      try {
        request = JSON.parse(line);
        assert(Number.isSafeInteger(request.id));
        assert(/^\/api\/writing(?:\/|$)/.test(request.path));
        const response = await app.request(`http://preview${request.path}`, {
          method: request.method,
          ...(request.body
            ? {
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(request.body),
              }
            : {}),
        });
        send({
          id: request.id,
          status: response.status,
          data: await response.json(),
        });
      } catch {
        send({
          id: request?.id,
          status: 500,
          data: {
            error:
              '임시 테스트 요청을 처리하지 못했습니다. 다시 시도해 주세요.',
          },
        });
      }
    });
  });
  input.on('close', () => queue.finally(cleanup));
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => {
      ai?.child.kill('SIGTERM');
      void queue.finally(cleanup);
    });
  // This is a disposable review session, not a long-running service.
  timer = setTimeout(() => {
    ai?.child.kill('SIGTERM');
    void queue.finally(cleanup);
  }, 3_600_000);
  send({
    event: 'ready',
    realAi: true,
    isolatedDatabase: true,
    expiresMinutes: 60,
  });
} catch {
  send({ event: 'startup_failed' });
  await cleanup();
}
