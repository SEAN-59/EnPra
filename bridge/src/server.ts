import { serve } from '@hono/node-server';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Pool } from 'pg';

import { CodexRegistry } from './codex.js';

type UserContext = { id: string; displayName: string };
type Variables = { user: UserContext };
type LearningRequest = { input?: unknown; context?: unknown };
type ManualVocabularyRequest = {
  word?: unknown;
  pronunciationIpa?: unknown;
  senses?: unknown;
};
type ManualVocabularyBatchRequest = {
  listId?: unknown;
  listTitle?: unknown;
  words?: unknown;
};
type GeneratedVocabularyWord = {
  word: string;
  normalizedWord: string;
  pronunciationIpa: string;
  senses: Array<{ partOfSpeech: string; text: string }>;
};
type AIVocabularyGenerationResult = { listId: number; addedCount: number; attempts: number; partial: boolean };
type AIVocabularyGenerationJob = {
  id: string;
  userId: string;
  status: 'running' | 'completed' | 'failed';
  attempts: number;
  result?: AIVocabularyGenerationResult;
  error?: string;
  updatedAt: number;
};
type VocabularyListRow = {
  id: string | number;
  title: string;
  scope: 'common' | 'personal';
  list_type: 'daily' | 'custom' | 'ai_generated';
  learning_date: string | null;
  word_count: string | number;
  added_at?: string | null;
};

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
const aiVocabularyGenerationJobs = new Map<string, AIVocabularyGenerationJob>();

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

    CREATE TABLE IF NOT EXISTS vocabulary_words (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      word TEXT NOT NULL,
      normalized_word TEXT NOT NULL UNIQUE,
      pronunciation_ipa TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (char_length(trim(word)) > 0),
      CHECK (char_length(trim(normalized_word)) > 0),
      CHECK (char_length(trim(pronunciation_ipa)) > 0)
    );

    CREATE TABLE IF NOT EXISTS vocabulary_senses (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      word_id BIGINT NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
      part_of_speech TEXT NOT NULL,
      meaning_ko TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (char_length(trim(part_of_speech)) > 0),
      CHECK (char_length(trim(meaning_ko)) > 0),
      UNIQUE (word_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS vocabulary_lists (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      owner_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      scope TEXT NOT NULL CHECK (scope IN ('common', 'personal')),
      list_type TEXT NOT NULL CHECK (list_type IN ('daily', 'custom', 'ai_generated')),
      title TEXT NOT NULL,
      learning_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (char_length(trim(title)) > 0),
      CHECK (
        (scope = 'common' AND owner_user_id IS NULL)
        OR (scope = 'personal' AND owner_user_id IS NOT NULL)
      )
    );

    CREATE TABLE IF NOT EXISTS vocabulary_list_items (
      list_id BIGINT NOT NULL REFERENCES vocabulary_lists(id) ON DELETE CASCADE,
      word_id BIGINT NOT NULL REFERENCES vocabulary_words(id) ON DELETE RESTRICT,
      sort_order INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (list_id, word_id),
      UNIQUE (list_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS user_vocabulary_word_status (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      word_id BIGINT NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
      learning_status TEXT CHECK (learning_status IN ('needed', 'completed')),
      is_important BOOLEAN NOT NULL DEFAULT FALSE,
      learning_status_updated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, word_id)
    );

    CREATE TABLE IF NOT EXISTS user_vocabulary_list_subscriptions (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      list_id BIGINT NOT NULL REFERENCES vocabulary_lists(id) ON DELETE CASCADE,
      is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, list_id)
    );

    CREATE INDEX IF NOT EXISTS vocabulary_senses_word_sort_idx
      ON vocabulary_senses (word_id, sort_order);

    CREATE INDEX IF NOT EXISTS vocabulary_lists_owner_created_idx
      ON vocabulary_lists (owner_user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS vocabulary_lists_common_created_idx
      ON vocabulary_lists (created_at DESC)
      WHERE scope = 'common';

    CREATE INDEX IF NOT EXISTS vocabulary_list_items_word_idx
      ON vocabulary_list_items (word_id);

    CREATE INDEX IF NOT EXISTS user_vocabulary_word_status_filter_idx
      ON user_vocabulary_word_status (user_id, learning_status, is_important);

    CREATE INDEX IF NOT EXISTS user_vocabulary_list_subscriptions_visible_idx
      ON user_vocabulary_list_subscriptions (user_id, is_enabled, updated_at DESC);
  `);
}

function serializeVocabularyList(row: VocabularyListRow) {
  return {
    id: Number(row.id),
    title: row.title,
    scope: row.scope,
    listType: row.list_type,
    learningDate: row.learning_date,
    wordCount: Number(row.word_count),
    addedAt: row.added_at ?? null,
  };
}

async function getAccessibleVocabularyList(userId: string, listId: number) {
  const result = await pool.query<VocabularyListRow>(
    `SELECT l.id, l.title, l.scope, l.list_type, l.learning_date,
            COUNT(li.word_id)::INTEGER AS word_count,
            s.added_at
     FROM vocabulary_lists l
     LEFT JOIN vocabulary_list_items li ON li.list_id = l.id
     LEFT JOIN user_vocabulary_list_subscriptions s
       ON s.list_id = l.id AND s.user_id = $1
     WHERE l.id = $2
       AND (
         l.owner_user_id = $1
         OR (l.scope = 'common' AND s.is_enabled = TRUE)
       )
     GROUP BY l.id, s.added_at`,
    [userId, listId],
  );
  return result.rows[0] ?? null;
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

function vocabularyGenerationPrompt(count: number, excludedWords: string[]) {
  return [
    'EnPra의 개인 영어 단어장을 만들고 있습니다.',
    `실용적인 중상급 영어 단어 또는 짧은 관용구를 정확히 ${count}개 제안해 주세요.`,
    '반드시 아래 JSON 객체만 반환하세요. 마크다운, 설명, 코드 블록은 절대 쓰지 마세요.',
    '{"words":[{"word":"example","pronunciationIpa":"[ɪɡˈzæmpəl]","senses":[{"partOfSpeech":"n","text":"예시, 사례"}]}]}',
    'partOfSpeech는 n, v, a, ad, prep, phrase, conj 중 하나만 사용합니다. 뜻은 자연스러운 한국어로 작성하세요.',
    excludedWords.length ? `다음 단어는 이미 이번 목록에 포함했으니 절대로 다시 제안하지 마세요: ${excludedWords.join(', ')}` : null,
  ].filter(Boolean).join('\n');
}

function parseGeneratedVocabulary(text: string): GeneratedVocabularyWord[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const source = fenced ?? text.trim();
  const objectStart = source.indexOf('{');
  const objectEnd = source.lastIndexOf('}');
  const json = objectStart >= 0 && objectEnd > objectStart ? source.slice(objectStart, objectEnd + 1) : source;
  const parsed = JSON.parse(json) as { words?: unknown };
  const allowedPartsOfSpeech = new Set(['n', 'v', 'a', 'ad', 'prep', 'phrase', 'conj']);
  if (!Array.isArray(parsed.words)) return [];

  return parsed.words.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const entry = item as { word?: unknown; pronunciationIpa?: unknown; senses?: unknown };
    const word = typeof entry.word === 'string' ? entry.word.trim() : '';
    const pronunciationIpa = typeof entry.pronunciationIpa === 'string' ? entry.pronunciationIpa.trim() : '';
    const normalizedWord = word.normalize('NFKC').toLocaleLowerCase('en-US');
    const senses = Array.isArray(entry.senses) ? entry.senses.flatMap((sense) => {
      if (!sense || typeof sense !== 'object') return [];
      const meaning = sense as { partOfSpeech?: unknown; text?: unknown };
      const partOfSpeech = typeof meaning.partOfSpeech === 'string' ? meaning.partOfSpeech.trim() : '';
      const meaningText = typeof meaning.text === 'string' ? meaning.text.trim() : '';
      return allowedPartsOfSpeech.has(partOfSpeech) && meaningText ? [{ partOfSpeech, text: meaningText }] : [];
    }) : [];
    return word && word.length <= 120 && pronunciationIpa && pronunciationIpa.length <= 160 && senses.length && senses.length <= 20 && senses.every((sense) => sense.text.length <= 500)
      ? [{ word, normalizedWord, pronunciationIpa, senses }]
      : [];
  });
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

app.get('/api/vocabulary/lists', async (c) => {
  const user = c.get('user');
  const result = await pool.query<VocabularyListRow>(
    `SELECT l.id, l.title, l.scope, l.list_type, l.learning_date,
            COUNT(li.word_id)::INTEGER AS word_count,
            s.added_at
     FROM vocabulary_lists l
     LEFT JOIN vocabulary_list_items li ON li.list_id = l.id
     LEFT JOIN user_vocabulary_list_subscriptions s
       ON s.list_id = l.id AND s.user_id = $1
     WHERE l.owner_user_id = $1
        OR (l.scope = 'common' AND s.is_enabled = TRUE)
     GROUP BY l.id, s.added_at, s.updated_at
     ORDER BY COALESCE(s.updated_at, l.updated_at) DESC, l.id DESC`,
    [user.id],
  );
  return c.json({ lists: result.rows.map(serializeVocabularyList) });
});

app.get('/api/vocabulary/catalog', async (c) => {
  const user = c.get('user');
  const result = await pool.query<VocabularyListRow>(
    `SELECT l.id, l.title, l.scope, l.list_type, l.learning_date,
            COUNT(li.word_id)::INTEGER AS word_count,
            s.added_at
     FROM vocabulary_lists l
     LEFT JOIN vocabulary_list_items li ON li.list_id = l.id
     LEFT JOIN user_vocabulary_list_subscriptions s
       ON s.list_id = l.id AND s.user_id = $1
     WHERE l.scope = 'common'
       AND COALESCE(s.is_enabled, FALSE) = FALSE
     GROUP BY l.id, s.added_at
     ORDER BY l.created_at DESC, l.id DESC`,
    [user.id],
  );
  return c.json({ lists: result.rows.map(serializeVocabularyList) });
});

app.post('/api/vocabulary/lists/:listId/add', async (c) => {
  const user = c.get('user');
  const listId = Number(c.req.param('listId'));
  if (!Number.isSafeInteger(listId) || listId < 1) return c.json({ error: '올바른 단어 목록이 아닙니다.' }, 400);

  const list = await pool.query<{ scope: string }>(
    'SELECT scope FROM vocabulary_lists WHERE id = $1',
    [listId],
  );
  if (!list.rows[0] || list.rows[0].scope !== 'common') return c.json({ error: '공통 단어 목록만 추가할 수 있습니다.' }, 404);

  await pool.query(
    `INSERT INTO user_vocabulary_list_subscriptions (user_id, list_id, is_enabled)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (user_id, list_id) DO UPDATE
     SET is_enabled = TRUE, updated_at = NOW()`,
    [user.id, listId],
  );
  return c.json({ added: true, listId });
});

app.post('/api/vocabulary/lists/manual-entries', async (c) => {
  const user = c.get('user');
  let body: ManualVocabularyBatchRequest;
  try {
    body = await c.req.json<ManualVocabularyBatchRequest>();
  } catch {
    return c.json({ error: '단어 입력 형식이 올바르지 않습니다.' }, 400);
  }

  const requestedListId = typeof body.listId === 'number' && Number.isSafeInteger(body.listId) && body.listId > 0 ? body.listId : null;
  const listTitle = typeof body.listTitle === 'string' ? body.listTitle.trim() : '';
  const allowedPartsOfSpeech = new Set(['n', 'v', 'a', 'ad', 'prep', 'phrase', 'conj']);
  const words = Array.isArray(body.words) ? body.words.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const entry = item as { word?: unknown; pronunciationIpa?: unknown; senses?: unknown };
    const word = typeof entry.word === 'string' ? entry.word.trim() : '';
    const pronunciationIpa = typeof entry.pronunciationIpa === 'string' ? entry.pronunciationIpa.trim() : '';
    const senses = Array.isArray(entry.senses) ? entry.senses.flatMap((sense) => {
      if (!sense || typeof sense !== 'object') return [];
      const meaning = sense as { partOfSpeech?: unknown; text?: unknown };
      const partOfSpeech = typeof meaning.partOfSpeech === 'string' ? meaning.partOfSpeech.trim() : '';
      const text = typeof meaning.text === 'string' ? meaning.text.trim() : '';
      return allowedPartsOfSpeech.has(partOfSpeech) && text ? [{ partOfSpeech, text }] : [];
    }) : [];
    return word && pronunciationIpa && senses.length ? [{ word, pronunciationIpa, senses }] : [];
  }) : [];

  if ((!requestedListId && (!listTitle || listTitle.length > 120)) || !words.length || words.length > 100) {
    return c.json({ error: '개인 목록을 선택하거나 이름을 입력한 뒤, 한 개 이상의 단어를 추가해 주세요.' }, 400);
  }
  if (words.some((entry) => entry.word.length > 120 || entry.pronunciationIpa.length > 160 || entry.senses.length > 20 || entry.senses.some((sense) => sense.text.length > 500))) {
    return c.json({ error: '단어, 발음, 뜻의 길이를 확인해 주세요.' }, 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let listId: number;
    if (requestedListId) {
      const list = await client.query<{ id: string | number }>(
        `SELECT id FROM vocabulary_lists
         WHERE id = $1 AND owner_user_id = $2 AND scope = 'personal'`,
        [requestedListId, user.id],
      );
      if (!list.rows[0]) {
        await client.query('ROLLBACK');
        return c.json({ error: '개인 단어 목록만 선택할 수 있습니다.' }, 404);
      }
      listId = Number(list.rows[0].id);
    } else {
      let list = await client.query<{ id: string | number }>(
        `SELECT id FROM vocabulary_lists
         WHERE owner_user_id = $1 AND scope = 'personal' AND list_type = 'custom' AND title = $2
         ORDER BY id ASC LIMIT 1`,
        [user.id, listTitle],
      );
      if (!list.rows[0]) {
        list = await client.query<{ id: string | number }>(
          `INSERT INTO vocabulary_lists (owner_user_id, scope, list_type, title)
           VALUES ($1, 'personal', 'custom', $2) RETURNING id`,
          [user.id, listTitle],
        );
      }
      listId = Number(list.rows[0].id);
    }

    const nextItemSort = await client.query<{ next_sort: number }>(
      `SELECT COALESCE(MAX(sort_order) + 1, 0)::INTEGER AS next_sort
       FROM vocabulary_list_items WHERE list_id = $1`,
      [listId],
    );
    let itemSort = nextItemSort.rows[0].next_sort;
    let addedCount = 0;
    for (const entry of words) {
      const normalizedWord = entry.word.normalize('NFKC').toLocaleLowerCase('en-US');
      const wordResult = await client.query<{ id: string | number }>(
        `INSERT INTO vocabulary_words (word, normalized_word, pronunciation_ipa)
         VALUES ($1, $2, $3)
         ON CONFLICT (normalized_word) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [entry.word, normalizedWord, entry.pronunciationIpa],
      );
      const wordId = Number(wordResult.rows[0].id);
      const currentSort = await client.query<{ next_sort: number }>(
        `SELECT COALESCE(MAX(sort_order) + 1, 0)::INTEGER AS next_sort
         FROM vocabulary_senses WHERE word_id = $1`,
        [wordId],
      );
      let senseSort = currentSort.rows[0].next_sort;
      for (const sense of entry.senses) {
        const existingSense = await client.query(
          `SELECT 1 FROM vocabulary_senses
           WHERE word_id = $1 AND part_of_speech = $2 AND meaning_ko = $3`,
          [wordId, sense.partOfSpeech, sense.text],
        );
        if (!existingSense.rowCount) {
          await client.query(
            `INSERT INTO vocabulary_senses (word_id, part_of_speech, meaning_ko, sort_order)
             VALUES ($1, $2, $3, $4)`,
            [wordId, sense.partOfSpeech, sense.text, senseSort],
          );
          senseSort += 1;
        }
      }
      const inserted = await client.query(
        `INSERT INTO vocabulary_list_items (list_id, word_id, sort_order)
         VALUES ($1, $2, $3) ON CONFLICT (list_id, word_id) DO NOTHING`,
        [listId, wordId, itemSort],
      );
      if (inserted.rowCount) {
        itemSort += 1;
        addedCount += 1;
      }
    }
    await client.query('COMMIT');
    return c.json({ listId, addedCount });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Manual vocabulary batch creation failed', { userId: user.id, message: error instanceof Error ? error.message : String(error) });
    return c.json({ error: '단어를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 500);
  } finally {
    client.release();
  }
});

async function generateAIVocabulary(user: UserContext, count: number, job: AIVocabularyGenerationJob): Promise<AIVocabularyGenerationResult> {
  const selected = new Map<string, GeneratedVocabularyWord>();
  let attempts = 0;
  let lastError: Error | null = null;
  while (selected.size < count && attempts < 5) {
    attempts += 1;
    job.attempts = attempts;
    job.updatedAt = Date.now();
    try {
      const completion = await codex.get(user.id).runLearningPrompt(
        vocabularyGenerationPrompt(count - selected.size, [...selected.values()].map((word) => word.word).slice(-120)),
      );
      const candidates = parseGeneratedVocabulary(completion.text)
        .filter((word) => !selected.has(word.normalizedWord));
      if (!candidates.length) continue;
      const existing = await pool.query<{ normalized_word: string }>(
        'SELECT normalized_word FROM vocabulary_words WHERE normalized_word = ANY($1::text[])',
        [candidates.map((word) => word.normalizedWord)],
      );
      const existingWords = new Set(existing.rows.map((word) => word.normalized_word));
      for (const word of candidates) {
        if (!existingWords.has(word.normalizedWord) && selected.size < count) selected.set(word.normalizedWord, word);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('AI 단어 생성에 실패했습니다.');
    }
  }

  if (!selected.size) {
    await markConnection(user.id, 'error');
    throw lastError ?? new Error('중복되지 않는 새 단어를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const listTitle = `AI 단어 · ${new Date().toISOString().slice(0, 10).replaceAll('-', '.')}`;
    const list = await client.query<{ id: string | number }>(
      `INSERT INTO vocabulary_lists (owner_user_id, scope, list_type, title)
       VALUES ($1, 'personal', 'ai_generated', $2) RETURNING id`,
      [user.id, listTitle],
    );
    const listId = Number(list.rows[0].id);
    let sortOrder = 0;
    for (const entry of selected.values()) {
      const word = await client.query<{ id: string | number }>(
        `INSERT INTO vocabulary_words (word, normalized_word, pronunciation_ipa)
         VALUES ($1, $2, $3) RETURNING id`,
        [entry.word, entry.normalizedWord, entry.pronunciationIpa],
      );
      const wordId = Number(word.rows[0].id);
      for (const [senseIndex, sense] of entry.senses.entries()) {
        await client.query(
          `INSERT INTO vocabulary_senses (word_id, part_of_speech, meaning_ko, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [wordId, sense.partOfSpeech, sense.text, senseIndex],
        );
      }
      await client.query(
        `INSERT INTO vocabulary_list_items (list_id, word_id, sort_order)
         VALUES ($1, $2, $3)`,
        [listId, wordId, sortOrder],
      );
      sortOrder += 1;
    }
    await client.query('COMMIT');
    return { listId, addedCount: selected.size, attempts, partial: selected.size < count };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('AI vocabulary generation storage failed', { userId: user.id, message: error instanceof Error ? error.message : String(error) });
    throw new Error('AI 단어를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  } finally {
    client.release();
  }
}

app.post('/api/vocabulary/lists/ai-generate', async (c) => {
  const user = c.get('user');
  let body: { count?: unknown };
  try {
    body = await c.req.json<{ count?: unknown }>();
  } catch {
    return c.json({ error: 'AI 생성 요청 형식이 올바르지 않습니다.' }, 400);
  }
  const count = typeof body.count === 'number' ? body.count : NaN;
  if (!Number.isInteger(count) || count < 20 || count > 50 || count % 5 !== 0) {
    return c.json({ error: '생성 개수는 20개부터 50개 사이의 5개 단위여야 합니다.' }, 400);
  }

  try {
    const account = await codex.get(user.id).readAccount();
    if (account?.type !== 'chatgpt') {
      await markConnection(user.id, 'disconnected');
      return c.json({ error: '먼저 ChatGPT OAuth 연결을 완료해 주세요.' }, 409);
    }
    await markConnection(user.id, 'active', account.planType);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'ChatGPT 연결 상태를 확인하지 못했습니다.' }, 502);
  }

  const existingJob = [...aiVocabularyGenerationJobs.values()].find((job) => job.userId === user.id && job.status === 'running');
  if (existingJob) return c.json({ jobId: existingJob.id, status: existingJob.status }, 202);

  const job: AIVocabularyGenerationJob = {
    id: randomUUID(), userId: user.id, status: 'running', attempts: 0, updatedAt: Date.now(),
  };
  aiVocabularyGenerationJobs.set(job.id, job);
  void generateAIVocabulary(user, count, job)
    .then((result) => { job.status = 'completed'; job.result = result; job.updatedAt = Date.now(); })
    .catch((error) => { job.status = 'failed'; job.error = error instanceof Error ? error.message : 'AI 단어 생성에 실패했습니다.'; job.updatedAt = Date.now(); });
  return c.json({ jobId: job.id, status: job.status }, 202);
});

app.get('/api/vocabulary/generation/:jobId', (c) => {
  const user = c.get('user');
  const job = aiVocabularyGenerationJobs.get(c.req.param('jobId'));
  if (!job || job.userId !== user.id) return c.json({ error: 'AI 생성 작업을 찾을 수 없습니다.' }, 404);
  return c.json({
    status: job.status,
    attempts: job.attempts,
    ...(job.status === 'completed' ? job.result : {}),
    ...(job.status === 'failed' ? { error: job.error ?? 'AI 단어 생성에 실패했습니다.' } : {}),
  });
});

app.post('/api/vocabulary/words', async (c) => {
  const user = c.get('user');
  let body: ManualVocabularyRequest;
  try {
    body = await c.req.json<ManualVocabularyRequest>();
  } catch {
    return c.json({ error: '단어 입력 형식이 올바르지 않습니다.' }, 400);
  }

  const word = typeof body.word === 'string' ? body.word.trim() : '';
  const pronunciationIpa = typeof body.pronunciationIpa === 'string' ? body.pronunciationIpa.trim() : '';
  const normalizedWord = word.normalize('NFKC').toLocaleLowerCase('en-US');
  const allowedPartsOfSpeech = new Set(['n', 'v', 'a', 'ad', 'prep', 'phrase', 'conj']);
  const senses = Array.isArray(body.senses)
    ? body.senses.flatMap((sense) => {
      if (!sense || typeof sense !== 'object') return [];
      const entry = sense as { partOfSpeech?: unknown; text?: unknown };
      const partOfSpeech = typeof entry.partOfSpeech === 'string' ? entry.partOfSpeech.trim() : '';
      const text = typeof entry.text === 'string' ? entry.text.trim() : '';
      return allowedPartsOfSpeech.has(partOfSpeech) && text ? [{ partOfSpeech, text }] : [];
    })
    : [];

  if (!word || word.length > 120 || !pronunciationIpa || pronunciationIpa.length > 160 || !senses.length || senses.length > 20) {
    return c.json({ error: '영단어, 발음, 그리고 최소 한 개의 뜻을 입력해 주세요.' }, 400);
  }
  if (senses.some((sense) => sense.text.length > 500)) return c.json({ error: '뜻은 500자 이내로 입력해 주세요.' }, 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wordResult = await client.query<{ id: string | number }>(
      `INSERT INTO vocabulary_words (word, normalized_word, pronunciation_ipa)
       VALUES ($1, $2, $3)
       ON CONFLICT (normalized_word) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [word, normalizedWord, pronunciationIpa],
    );
    const wordId = Number(wordResult.rows[0].id);

    const currentSort = await client.query<{ next_sort: number }>(
      `SELECT COALESCE(MAX(sort_order) + 1, 0)::INTEGER AS next_sort
       FROM vocabulary_senses WHERE word_id = $1`,
      [wordId],
    );
    let sortOrder = currentSort.rows[0].next_sort;
    for (const sense of senses) {
      const existing = await client.query(
        `SELECT 1 FROM vocabulary_senses
         WHERE word_id = $1 AND part_of_speech = $2 AND meaning_ko = $3`,
        [wordId, sense.partOfSpeech, sense.text],
      );
      if (!existing.rowCount) {
        await client.query(
          `INSERT INTO vocabulary_senses (word_id, part_of_speech, meaning_ko, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [wordId, sense.partOfSpeech, sense.text, sortOrder],
        );
        sortOrder += 1;
      }
    }

    const defaultListTitle = '직접 추가한 단어';
    let list = await client.query<{ id: string | number }>(
      `SELECT id FROM vocabulary_lists
       WHERE owner_user_id = $1 AND scope = 'personal' AND list_type = 'custom' AND title = $2
       ORDER BY id ASC LIMIT 1`,
      [user.id, defaultListTitle],
    );
    if (!list.rows[0]) {
      list = await client.query<{ id: string | number }>(
        `INSERT INTO vocabulary_lists (owner_user_id, scope, list_type, title)
         VALUES ($1, 'personal', 'custom', $2) RETURNING id`,
        [user.id, defaultListTitle],
      );
    }
    const listId = Number(list.rows[0].id);
    const nextItemSort = await client.query<{ next_sort: number }>(
      `SELECT COALESCE(MAX(sort_order) + 1, 0)::INTEGER AS next_sort
       FROM vocabulary_list_items WHERE list_id = $1`,
      [listId],
    );
    const inserted = await client.query(
      `INSERT INTO vocabulary_list_items (list_id, word_id, sort_order)
       VALUES ($1, $2, $3) ON CONFLICT (list_id, word_id) DO NOTHING`,
      [listId, wordId, nextItemSort.rows[0].next_sort],
    );
    await client.query('COMMIT');
    return c.json({ created: inserted.rowCount === 1, listId, wordId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Manual vocabulary creation failed', { userId: user.id, message: error instanceof Error ? error.message : String(error) });
    return c.json({ error: '단어를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 500);
  } finally {
    client.release();
  }
});

app.get('/api/vocabulary/lists/:listId', async (c) => {
  const user = c.get('user');
  const listId = Number(c.req.param('listId'));
  if (!Number.isSafeInteger(listId) || listId < 1) return c.json({ error: '올바른 단어 목록이 아닙니다.' }, 400);

  const list = await getAccessibleVocabularyList(user.id, listId);
  if (!list) return c.json({ error: '접근할 수 없는 단어 목록입니다.' }, 404);

  const words = await pool.query<{ id: string | number; word: string; pronunciation_ipa: string; sort_order: number }>(
    `SELECT w.id, w.word, w.pronunciation_ipa, li.sort_order
     FROM vocabulary_list_items li
     JOIN vocabulary_words w ON w.id = li.word_id
     WHERE li.list_id = $1
     ORDER BY li.sort_order ASC`,
    [listId],
  );
  const senses = await pool.query<{ word_id: string | number; part_of_speech: string; meaning_ko: string; sort_order: number }>(
    `SELECT s.word_id, s.part_of_speech, s.meaning_ko, s.sort_order
     FROM vocabulary_senses s
     JOIN vocabulary_list_items li ON li.word_id = s.word_id
     WHERE li.list_id = $1
     ORDER BY s.word_id ASC, s.sort_order ASC`,
    [listId],
  );
  const sensesByWord = new Map<number, Array<{ partOfSpeech: string; text: string }>>();
  for (const sense of senses.rows) {
    const wordId = Number(sense.word_id);
    const current = sensesByWord.get(wordId) ?? [];
    current.push({ partOfSpeech: sense.part_of_speech, text: sense.meaning_ko });
    sensesByWord.set(wordId, current);
  }

  return c.json({
    list: serializeVocabularyList(list),
    words: words.rows.map((word) => ({
      id: Number(word.id),
      word: word.word,
      pronunciationIpa: word.pronunciation_ipa,
      meanings: sensesByWord.get(Number(word.id)) ?? [],
    })),
  });
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
    console.error('EnPra AI request failed', {
      userId: user.id,
      message: error instanceof Error ? error.message : String(error),
    });
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
