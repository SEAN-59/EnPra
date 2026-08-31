import { serve } from '@hono/node-server';
import argon2 from 'argon2';
import Database from 'better-sqlite3';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SignJWT, jwtVerify } from 'jose';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CodexRegistry } from './codex.js';

const port = Number(process.env.PORT ?? 8787);
const dataDir = process.env.ENPRA_DATA_DIR ?? join(process.cwd(), '.enpra-data');
const corsOrigins = (process.env.ENPRA_CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const sessionSecret = process.env.ENPRA_SESSION_SECRET ?? 'change-this-before-public-use';
if (process.env.NODE_ENV === 'production' && sessionSecret === 'change-this-before-public-use') throw new Error('Set ENPRA_SESSION_SECRET before public use.');

mkdirSync(dataDir, { recursive: true });
const db = new Database(join(dataDir, 'enpra.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK(provider = 'openai_codex'),
    status TEXT NOT NULL CHECK(status IN ('pending', 'active', 'disconnected', 'error')),
    credential_ref TEXT NOT NULL,
    connected_at TEXT,
    last_verified_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, provider)
  );
`);

type UserRow = { id: string; name: string; email: string; username: string; password_hash: string };
type UserSession = { sub: string };
const key = new TextEncoder().encode(sessionSecret);
const codex = new CodexRegistry(dataDir);

function cleanEmail(value: string) { return value.trim().toLowerCase(); }
function cleanUsername(value: string) { return value.trim().toLowerCase(); }
function now() { return new Date().toISOString(); }
function userView(user: UserRow) { return { id: user.id, name: user.name, email: user.email, username: user.username }; }

async function createSession(userId: string) {
  return new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime('30d').sign(key);
}

async function readSession(header?: string): Promise<UserSession | null> {
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), key);
    return payload.sub ? { sub: payload.sub } : null;
  } catch { return null; }
}

const app = new Hono();
app.use('*', cors({ origin: corsOrigins, allowHeaders: ['Authorization', 'Content-Type'], allowMethods: ['GET', 'POST', 'OPTIONS'] }));
app.get('/health', (c) => c.json({ ok: true }));

app.post('/auth/register', async (c) => {
  const body = await c.req.json<{ name?: string; email?: string; username?: string; password?: string }>();
  const name = body.name?.trim() ?? '';
  const email = cleanEmail(body.email ?? '');
  const username = cleanUsername(body.username ?? '');
  const password = body.password ?? '';
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !/^[a-z0-9_]{3,24}$/.test(username) || password.length < 8) {
    return c.json({ error: '이름, 올바른 이메일, 3~24자 영문·숫자 아이디, 8자 이상 비밀번호가 필요합니다.' }, 400);
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) return c.json({ error: '이미 사용 중인 이메일 또는 아이디입니다.' }, 409);
  const id = randomUUID();
  const timestamp = now();
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  db.prepare('INSERT INTO users (id, name, email, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, name, email, username, passwordHash, timestamp, timestamp);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  return c.json({ user: userView(user), session: await createSession(id) }, 201);
});

app.post('/auth/login', async (c) => {
  const body = await c.req.json<{ identifier?: string; password?: string }>();
  const identifier = (body.identifier ?? '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(identifier, identifier) as UserRow | undefined;
  if (!user || !(await argon2.verify(user.password_hash, body.password ?? ''))) return c.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401);
  return c.json({ user: userView(user), session: await createSession(user.id) });
});

app.get('/me', async (c) => {
  const session = await readSession(c.req.header('Authorization'));
  if (!session) return c.json({ error: '로그인이 필요합니다.' }, 401);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.sub) as UserRow | undefined;
  if (!user) return c.json({ error: '사용자를 찾을 수 없습니다.' }, 401);
  return c.json({ user: userView(user) });
});

app.post('/connections/codex/start', async (c) => {
  const session = await readSession(c.req.header('Authorization'));
  if (!session) return c.json({ error: '로그인이 필요합니다.' }, 401);
  const credentialRef = `codex/${session.sub}`;
  const connection = db.prepare('SELECT id FROM connections WHERE user_id = ? AND provider = ?').get(session.sub, 'openai_codex') as { id: string } | undefined;
  if (!connection) db.prepare('INSERT INTO connections (id, user_id, provider, status, credential_ref) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), session.sub, 'openai_codex', 'pending', credentialRef);
  else db.prepare('UPDATE connections SET status = ? WHERE id = ?').run('pending', connection.id);
  try {
    const login = await codex.get(session.sub).startDeviceLogin();
    return c.json(login);
  } catch (error) {
    db.prepare('UPDATE connections SET status = ? WHERE user_id = ? AND provider = ?').run('error', session.sub, 'openai_codex');
    return c.json({ error: error instanceof Error ? error.message : 'Codex 로그인 시작에 실패했습니다.' }, 502);
  }
});

app.get('/connections/codex', async (c) => {
  const session = await readSession(c.req.header('Authorization'));
  if (!session) return c.json({ error: '로그인이 필요합니다.' }, 401);
  const connection = db.prepare('SELECT id, status, connected_at, last_verified_at FROM connections WHERE user_id = ? AND provider = ?').get(session.sub, 'openai_codex') as { id: string; status: string; connected_at: string | null; last_verified_at: string | null } | undefined;
  if (!connection) return c.json({ connection: null });
  try {
    const account = await codex.get(session.sub).readAccount();
    if (account?.type === 'chatgpt') {
      const timestamp = now();
      db.prepare('UPDATE connections SET status = ?, connected_at = COALESCE(connected_at, ?), last_verified_at = ? WHERE id = ?').run('active', timestamp, timestamp, connection.id);
      return c.json({ connection: { ...connection, status: 'active', account: { planType: account.planType ?? null } } });
    }
  } catch { /* pending logins can legitimately have no account yet */ }
  return c.json({ connection: { ...connection, account: null } });
});

app.post('/connections/codex/disconnect', async (c) => {
  const session = await readSession(c.req.header('Authorization'));
  if (!session) return c.json({ error: '로그인이 필요합니다.' }, 401);
  try { await codex.get(session.sub).logout(); } catch { /* a missing local session is already disconnected */ }
  db.prepare('UPDATE connections SET status = ?, last_verified_at = ? WHERE user_id = ? AND provider = ?').run('disconnected', now(), session.sub, 'openai_codex');
  return c.body(null, 204);
});

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
console.log(`EnPra bridge listening on ${port}`);
