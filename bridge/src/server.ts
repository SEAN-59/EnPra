import { serve } from '@hono/node-server';
import { timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Pool } from 'pg';

import { CodexRegistry } from './codex.js';

type UserContext = { id: string; displayName: string };
type Variables = { user: UserContext };
type LearningRequest = { input?: unknown; context?: unknown };

const port = Number(process.env.PORT ?? 8787);
const dataDir = process.env.ENPRA_DATA_DIR ?? join(process.cwd(), '.enpra-data');
const databaseUrl = process.env.DATABASE_URL;
const serviceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;
const corsOrigins = (process.env.ENPRA_CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!databaseUrl) throw new Error('Set DATABASE_URL before starting the EnPra bridge.');
if (!serviceToken || serviceToken.length < 32) throw new Error('Set a long ENPRA_BRIDGE_SERVICE_TOKEN before starting the EnPra bridge.');

mkdirSync(dataDir, { recursive: true });

const pool = new Pool({ connectionString: databaseUrl });
const codex = new CodexRegistry(dataDir);
const expectedServiceToken = Buffer.from(serviceToken);

function isExpectedToken(value: string | undefined) {
  if (!value) return false;
  const received = Buffer.from(value);
  return received.length === expectedServiceToken.length && timingSafeEqual(received, expectedServiceToken);
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL CHECK (provider = 'openai_codex'),
      status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'disconnected', 'error')),
      credential_ref TEXT NOT NULL,
      plan_type TEXT,
      connected_at TIMESTAMPTZ,
      last_verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, provider)
    );
  `);
}

async function upsertUser(user: UserContext) {
  await pool.query(
    `INSERT INTO users (id, display_name)
     VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE
     SET display_name = EXCLUDED.display_name, updated_at = NOW()`,
    [user.id, user.displayName],
  );
}

async function markConnection(userId: string, status: 'pending' | 'active' | 'disconnected' | 'error', planType?: string | null) {
  const connectionId = `codex:${userId}`;
  await pool.query(
    `INSERT INTO connections (id, user_id, provider, status, credential_ref, plan_type, connected_at, last_verified_at)
     VALUES ($1, $2, 'openai_codex', $3, $4, $5,
       CASE WHEN $3 = 'active' THEN NOW() ELSE NULL END,
       CASE WHEN $3 = 'active' THEN NOW() ELSE NULL END)
     ON CONFLICT (user_id, provider) DO UPDATE
     SET status = EXCLUDED.status,
         plan_type = COALESCE(EXCLUDED.plan_type, connections.plan_type),
         connected_at = CASE WHEN EXCLUDED.status = 'active' THEN COALESCE(connections.connected_at, NOW()) ELSE connections.connected_at END,
         last_verified_at = CASE WHEN EXCLUDED.status = 'active' THEN NOW() ELSE connections.last_verified_at END,
         updated_at = NOW()`,
    [connectionId, userId, status, `codex/${userId}`, planType ?? null],
  );
}

function learningPrompt(input: string, context?: string) {
  return [
    '다음은 EnPra 영어 학습 요청입니다.',
    '학습자가 이해하기 쉽게 답하고, 필요한 경우 영어 예문과 한국어 설명을 함께 제공하세요.',
    context ? `학습 맥락:\n${context}` : null,
    `학습자 요청:\n${input}`,
  ].filter(Boolean).join('\n\n');
}

function decodeDisplayName(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

const app = new Hono<{ Variables: Variables }>();

app.use('*', cors({
  origin: (origin) => (!origin || corsOrigins.includes(origin) ? origin ?? corsOrigins[0] : null),
  allowHeaders: ['Authorization', 'Content-Type', 'X-EnPra-Service-Token', 'X-EnPra-User-Id', 'X-EnPra-User-Name'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

app.get('/health', async (c) => {
  await pool.query('SELECT 1');
  return c.json({ ok: true, database: 'connected' });
});

app.use('/api/*', async (c, next) => {
  if (!isExpectedToken(c.req.header('X-EnPra-Service-Token'))) return c.json({ error: 'Unauthorized bridge request.' }, 401);

  const id = c.req.header('X-EnPra-User-Id')?.trim();
  const encodedDisplayName = c.req.header('X-EnPra-User-Name')?.trim();
  const displayName = encodedDisplayName ? decodeDisplayName(encodedDisplayName).trim() : undefined;
  if (!id || id.length > 256 || !displayName || displayName.length > 256) {
    return c.json({ error: 'A trusted EnPra user identity is required.' }, 400);
  }

  const user = { id, displayName };
  await upsertUser(user);
  c.set('user', user);
  await next();
});

app.get('/api/me', async (c) => {
  const user = c.get('user');
  const result = await pool.query(
    `SELECT status, plan_type, connected_at, last_verified_at
     FROM connections
     WHERE user_id = $1 AND provider = 'openai_codex'`,
    [user.id],
  );
  return c.json({ user, connection: result.rows[0] ?? null });
});

app.post('/api/connections/codex/start', async (c) => {
  const user = c.get('user');
  await markConnection(user.id, 'pending');

  try {
    return c.json(await codex.get(user.id).startDeviceLogin());
  } catch (error) {
    await markConnection(user.id, 'error');
    return c.json({ error: error instanceof Error ? error.message : 'Codex 로그인 시작에 실패했습니다.' }, 502);
  }
});

app.get('/api/connections/codex', async (c) => {
  const user = c.get('user');
  const current = await pool.query(
    `SELECT status, plan_type, connected_at, last_verified_at
     FROM connections
     WHERE user_id = $1 AND provider = 'openai_codex'`,
    [user.id],
  );
  if (!current.rows[0]) return c.json({ connection: null });

  try {
    const account = await codex.get(user.id).readAccount();
    if (account?.type === 'chatgpt') {
      await markConnection(user.id, 'active', account.planType);
      const refreshed = await pool.query(
        `SELECT status, plan_type, connected_at, last_verified_at
         FROM connections
         WHERE user_id = $1 AND provider = 'openai_codex'`,
        [user.id],
      );
      return c.json({ connection: refreshed.rows[0] });
    }
  } catch {
    // A device login can remain pending until the user completes it in ChatGPT.
  }

  return c.json({ connection: current.rows[0] });
});

app.post('/api/ai/respond', async (c) => {
  const user = c.get('user');
  let body: LearningRequest;
  try {
    body = await c.req.json<LearningRequest>();
  } catch {
    return c.json({ error: 'AI 요청 본문이 올바르지 않습니다.' }, 400);
  }

  const input = typeof body.input === 'string' ? body.input.trim() : '';
  const context = typeof body.context === 'string' ? body.context.trim() : undefined;
  if (!input || input.length > 8_000 || (context && context.length > 6_000)) {
    return c.json({ error: '학습 요청 또는 학습 맥락의 길이가 올바르지 않습니다.' }, 400);
  }

  try {
    const account = await codex.get(user.id).readAccount();
    if (account?.type !== 'chatgpt') {
      await markConnection(user.id, 'disconnected');
      return c.json({ error: '먼저 ChatGPT OAuth 연결을 완료해 주세요.' }, 409);
    }

    await markConnection(user.id, 'active', account.planType);
    const result = await codex.get(user.id).runLearningPrompt(learningPrompt(input, context));
    return c.json(result);
  } catch (error) {
    await markConnection(user.id, 'error');
    return c.json({ error: error instanceof Error ? error.message : 'AI 학습 요청에 실패했습니다.' }, 502);
  }
});

app.post('/api/connections/codex/disconnect', async (c) => {
  const user = c.get('user');
  try {
    await codex.get(user.id).logout();
  } catch {
    // Missing local credentials are already effectively disconnected.
  }
  await markConnection(user.id, 'disconnected');
  return c.body(null, 204);
});

initializeDatabase()
  .then(() => serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }))
  .then(() => console.log(`EnPra bridge listening on ${port}`))
  .catch((error) => {
    console.error('EnPra bridge failed to initialize.', error);
    process.exit(1);
  });
