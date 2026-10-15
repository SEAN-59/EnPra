import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Pool, PoolClient } from 'pg';
import { personalVocabularyDetails, effectiveVocabularyDetails } from './personal-vocabulary.js';

type Variables = { user: { id: string; displayName: string } };
type Queryable = Pick<PoolClient, 'query'>;
export const vocabularyTestTypes = [
  'english_to_korean',
  'korean_to_english',
  'english_choice',
  'korean_choice',
] as const;
type TestType = (typeof vocabularyTestTypes)[number];
type Kind = 'study' | 'test';
type Scope = 'new' | 'needed' | 'all' | 'recent';
export type VocabularySnapshot = {
  id: number;
  word: string;
  pronunciationIpa: string;
  meanings: Array<{ partOfSpeech: string; text: string }>;
};
type SessionItem = VocabularySnapshot & {
  format?: TestType;
  prompt?: string;
  choices?: Array<{ key: string; label: string }>;
  expected: string[];
  answer?: string;
  known?: boolean;
  correct?: boolean;
  answeredAt?: string;
};
type SessionRow = {
  id: string | number;
  user_id: string;
  list_id: string | number;
  kind: Kind;
  scope: Scope;
  status: 'in_progress' | 'completed' | 'abandoned';
  first_side: 'english' | 'korean';
  test_type: TestType | 'mixed';
  items_json: SessionItem[];
  created_at: Date | string;
  completed_at: Date | string | null;
};
const defaults = {
  studyCount: 20,
  testCount: 20,
  firstSide: 'english',
  testType: 'mixed',
} as const;
function fail(message: string, status: 400 | 404 | 409 = 400): never {
  throw new HTTPException(status, {
    res: Response.json({ error: message }, { status }),
  });
}
function positiveId(value: unknown) {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !/^\d+$/.test(value))
  )
    fail('올바른 목록 또는 학습 번호가 아닙니다.');
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    fail('올바른 목록 또는 학습 번호가 아닙니다.');
  return id;
}
function count(value: unknown) {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 100
  )
    fail('학습·테스트 개수는 1~100개로 설정해 주세요.');
  return value;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('요청 형식을 확인해 주세요.');
  return value as Record<string, unknown>;
}
export function normalizeVocabularyAnswer(answer: string, korean = false) {
  const cleaned = answer
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[’‘]/g, "'")
    .replace(/[.!?。]+$/g, '')
    .replace(/\s+/g, ' ');
  return korean ? cleaned.replace(/\s/g, '') : cleaned;
}
export function vocabularyMeaningAnswers(word: VocabularySnapshot) {
  return [
    ...new Set(
      word.meanings
        .flatMap(({ text }) => [
          text,
          ...text.replace(/\([^)]*\)|\[[^\]]*\]/g, '').split(/[,;；/·]/),
        ])
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}
function shuffle<T>(values: T[], random = Math.random) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
export function buildVocabularyTest(
  words: VocabularySnapshot[],
  pool: VocabularySnapshot[],
  type: TestType | 'mixed',
  random = Math.random,
): SessionItem[] {
  return shuffle(words, random).map((word, index) => {
    const format =
      type === 'mixed'
        ? vocabularyTestTypes[index % vocabularyTestTypes.length]
        : type;
    const koreanAnswer =
      format === 'english_to_korean' || format === 'english_choice';
    const expected = koreanAnswer
      ? vocabularyMeaningAnswers(word)
      : [word.word];
    const item: SessionItem = {
      ...word,
      format,
      prompt: koreanAnswer
        ? word.word
        : word.meanings.map((sense) => sense.text).join(' / '),
      expected,
    };
    if (format.endsWith('choice')) {
      const correctMeanings = new Set(
        vocabularyMeaningAnswers(word).map((value) =>
          normalizeVocabularyAnswer(value, true),
        ),
      );
      const correctWord = normalizeVocabularyAnswer(word.word);
      const labels = new Set<string>();
      const candidates = shuffle(pool, random)
        .filter((candidate) => {
          if (
            candidate.id === word.id ||
            normalizeVocabularyAnswer(candidate.word) === correctWord ||
            !candidate.meanings.length
          )
            return false;
          if (
            vocabularyMeaningAnswers(candidate).some((value) =>
              correctMeanings.has(normalizeVocabularyAnswer(value, true)),
            )
          )
            return false;
          const label = koreanAnswer
            ? candidate.meanings.map((sense) => sense.text).join(' / ')
            : candidate.word;
          const key = normalizeVocabularyAnswer(label, koreanAnswer);
          if (labels.has(key)) return false;
          labels.add(key);
          return true;
        })
        .slice(0, 3);
      if (candidates.length < 3)
        fail(
          '서로 다른 뜻의 보기 4개를 만들 수 없습니다. 다른 목록이나 서술형 유형을 선택해 주세요.',
        );
      const options = shuffle([word, ...candidates], random);
      item.choices = options.map((candidate, optionIndex) => ({
        key: String.fromCharCode(65 + optionIndex),
        label: koreanAnswer
          ? candidate.meanings.map((sense) => sense.text).join(' / ')
          : candidate.word,
      }));
      item.expected = [
        String.fromCharCode(
          65 + options.findIndex((candidate) => candidate.id === word.id),
        ),
      ];
    }
    return item;
  });
}
export function publicVocabularySession(row: SessionRow) {
  const items = row.items_json;
  const answered = items.filter((item) => item.answeredAt);
  const completed = row.status === 'completed';
  const next =
    row.status === 'in_progress'
      ? items.find((item) => !item.answeredAt)
      : undefined;
  return {
    id: Number(row.id),
    listId: Number(row.list_id),
    kind: row.kind,
    scope: row.scope,
    status: row.status,
    firstSide: row.first_side,
    testType: row.test_type,
    total: items.length,
    answered: answered.length,
    current: next
      ? row.kind === 'study'
        ? {
            id: next.id,
            word: next.word,
            pronunciationIpa: next.pronunciationIpa,
            meanings: next.meanings,
          }
        : {
            id: next.id,
            format: next.format,
            prompt: next.prompt,
            choices: next.choices,
          }
      : null,
    result: completed
      ? {
          known: answered.filter((item) => item.known).length,
          needed: answered.filter((item) => item.known === false).length,
          correct: answered.filter((item) => item.correct).length,
          score:
            row.kind === 'test'
              ? Math.round(
                  (answered.filter((item) => item.correct).length /
                    items.length) *
                    100,
                )
              : null,
          items: answered.map((item) => ({
            id: item.id,
            word: item.word,
            meanings: item.meanings,
            known: item.known,
            answer: item.answer,
            answerLabel:
              item.choices?.find((choice) => choice.key === item.answer)
                ?.label ?? item.answer,
            correct: item.correct,
            format: item.format,
          })),
        }
      : null,
  };
}

export async function initializeVocabularyLearningDatabase(
  pool: Pick<Pool, 'query'>,
) {
  await pool.query(`CREATE TABLE IF NOT EXISTS user_vocabulary_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    study_count SMALLINT NOT NULL DEFAULT 20 CHECK(study_count BETWEEN 1 AND 100),
    test_count SMALLINT NOT NULL DEFAULT 20 CHECK(test_count BETWEEN 1 AND 100),
    first_side TEXT NOT NULL DEFAULT 'english' CHECK(first_side IN ('english','korean')),
    test_type TEXT NOT NULL DEFAULT 'mixed' CHECK(test_type IN ('mixed','english_to_korean','korean_to_english','english_choice','korean_choice')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS vocabulary_learning_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    list_id BIGINT NOT NULL REFERENCES vocabulary_lists(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK(kind IN ('study','test')),
    scope TEXT NOT NULL CHECK(scope IN ('new','needed','all','recent')),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','abandoned')),
    first_side TEXT NOT NULL CHECK(first_side IN ('english','korean')),
    test_type TEXT NOT NULL CHECK(test_type IN ('mixed','english_to_korean','korean_to_english','english_choice','korean_choice')),
    items_json JSONB NOT NULL CHECK(jsonb_typeof(items_json)='array' AND jsonb_array_length(items_json) BETWEEN 1 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ
  );
  CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_learning_active_idx ON vocabulary_learning_sessions(user_id,list_id,kind) WHERE status='in_progress';
  CREATE INDEX IF NOT EXISTS vocabulary_learning_user_list_idx ON vocabulary_learning_sessions(user_id,list_id,created_at DESC);`);
}

async function accessible(db: Queryable, userId: string, listId: number) {
  const result = await db.query(
    `SELECT l.id,l.title,l.scope FROM vocabulary_lists l
    LEFT JOIN user_vocabulary_list_subscriptions s ON s.list_id=l.id AND s.user_id=$1
    WHERE l.id=$2 AND (l.owner_user_id=$1 OR (l.scope='common' AND s.is_enabled=TRUE))`,
    [userId, listId],
  );
  if (!result.rows[0]) fail('접근할 수 없는 단어 목록입니다.', 404);
  return result.rows[0];
}
export async function saveVocabularyWordStatus(
  db: Queryable,
  userId: string,
  wordId: number,
  changes: {
    learningStatus?: 'needed' | 'completed' | null;
    isImportant?: boolean;
  },
) {
  // Keep empty rows: read-then-delete could discard a concurrent card answer.
  const hasStatus = Object.prototype.hasOwnProperty.call(
    changes,
    'learningStatus',
  );
  const hasImportant = Object.prototype.hasOwnProperty.call(
    changes,
    'isImportant',
  );
  const result = await db.query<{
    learningStatus: 'needed' | 'completed' | null;
    isImportant: boolean;
  }>(
    `INSERT INTO user_vocabulary_word_status(user_id,word_id,learning_status,is_important,learning_status_updated_at)
      VALUES($1,$2,$3::text,$4::boolean,CASE WHEN $3::text IS NULL THEN NULL ELSE NOW() END)
      ON CONFLICT(user_id,word_id) DO UPDATE SET
        learning_status=CASE WHEN $5 THEN EXCLUDED.learning_status ELSE user_vocabulary_word_status.learning_status END,
        is_important=CASE WHEN $6 THEN EXCLUDED.is_important ELSE user_vocabulary_word_status.is_important END,
        learning_status_updated_at=CASE WHEN $5 AND user_vocabulary_word_status.learning_status IS DISTINCT FROM EXCLUDED.learning_status THEN EXCLUDED.learning_status_updated_at ELSE user_vocabulary_word_status.learning_status_updated_at END,
        updated_at=NOW() RETURNING learning_status AS "learningStatus",is_important AS "isImportant"`,
    [
      userId,
      wordId,
      changes.learningStatus ?? null,
      changes.isImportant ?? false,
      hasStatus,
      hasImportant,
    ],
  );
  return result.rows[0];
}
async function loadWords(db: Queryable, userId: string, listId: number, scope: string) {
  const result = await db.query(
    `SELECT w.id,w.word,w.pronunciation_ipa,st.learning_status,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('partOfSpeech',s.part_of_speech,'text',s.meaning_ko) ORDER BY s.sort_order) FROM vocabulary_senses s WHERE s.word_id=w.id),'[]'::jsonb) AS meanings,
    EXISTS(SELECT 1 FROM vocabulary_learning_sessions ls, jsonb_array_elements(ls.items_json) item
      WHERE ls.user_id=$1 AND ls.list_id=$2 AND ls.kind='study' AND (item->>'id')::bigint=w.id AND item->>'answeredAt' IS NOT NULL) AS studied
    FROM vocabulary_list_items li JOIN vocabulary_words w ON w.id=li.word_id
    LEFT JOIN user_vocabulary_word_status st ON st.word_id=w.id AND st.user_id=$1
    WHERE li.list_id=$2 ORDER BY li.sort_order,w.id`,
    [userId, listId],
  );
  const personal = await personalVocabularyDetails(db, userId, scope, result.rows.map(row=>Number(row.id)));
  return result.rows
    .map((row) => ({
      id: Number(row.id),
      ...effectiveVocabularyDetails({word:row.word as string,pronunciationIpa:row.pronunciation_ipa as string,meanings:row.meanings as VocabularySnapshot['meanings']},personal.get(Number(row.id))),
      learningStatus: row.learning_status,
      studied: Boolean(row.studied),
    }))
    .filter((word) => word.meanings.length);
}
async function session(
  db: Queryable,
  userId: string,
  id: number,
  lock = false,
): Promise<SessionRow> {
  const result = await db.query<SessionRow>(
    `SELECT * FROM vocabulary_learning_sessions WHERE id=$1 AND user_id=$2${lock ? ' FOR UPDATE' : ''}`,
    [id, userId],
  );
  if (!result.rows[0]) fail('학습 기록을 찾을 수 없습니다.', 404);
  await accessible(db, userId, Number(result.rows[0].list_id));
  return result.rows[0];
}
async function transaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const value = await work(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export function registerVocabularyLearningRoutes(
  app: Hono<{ Variables: Variables }>,
  pool: Pool,
) {
  app.get('/api/vocabulary/learning/overview', async (c) => {
    const userId = c.get('user').id;
    const lists = await pool.query(
      `SELECT l.id,l.title,l.scope,COUNT(li.word_id)::integer AS word_count,
      COUNT(li.word_id) FILTER(WHERE st.learning_status='completed')::integer AS known_count,
      COUNT(li.word_id) FILTER(WHERE st.learning_status='needed')::integer AS needed_count,
      COUNT(li.word_id) FILTER(WHERE EXISTS(SELECT 1 FROM vocabulary_learning_sessions ls,jsonb_array_elements(ls.items_json) item
        WHERE ls.user_id=$1 AND ls.list_id=l.id AND ls.kind='study' AND (item->>'id')::bigint=li.word_id AND item->>'answeredAt' IS NOT NULL))::integer AS studied_count
      FROM vocabulary_lists l LEFT JOIN vocabulary_list_items li ON li.list_id=l.id
      LEFT JOIN user_vocabulary_word_status st ON st.word_id=li.word_id AND st.user_id=$1
      LEFT JOIN user_vocabulary_list_subscriptions sub ON sub.list_id=l.id AND sub.user_id=$1
      WHERE l.owner_user_id=$1 OR (l.scope='common' AND sub.is_enabled=TRUE)
      GROUP BY l.id ORDER BY l.created_at DESC,l.id DESC`,
      [userId],
    );
    const preferences = await pool.query(
      `SELECT study_count AS "studyCount",test_count AS "testCount",first_side AS "firstSide",test_type AS "testType" FROM user_vocabulary_preferences WHERE user_id=$1`,
      [userId],
    );
    const sessions = await pool.query<SessionRow>(
      `WITH eligible AS (SELECT ls.* FROM vocabulary_learning_sessions ls JOIN vocabulary_lists l ON l.id=ls.list_id
        LEFT JOIN user_vocabulary_list_subscriptions sub ON sub.list_id=l.id AND sub.user_id=$1
        WHERE ls.user_id=$1 AND (l.owner_user_id=$1 OR (l.scope='common' AND sub.is_enabled=TRUE))),
      ranked AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY list_id,kind,status ORDER BY created_at DESC,id DESC) AS position FROM eligible)
      SELECT * FROM ranked WHERE status='in_progress' OR (kind='study' AND status='completed' AND position=1)
        OR (kind='test' AND status='completed' AND position<=10) ORDER BY created_at DESC,id DESC`,
      [userId],
    );
    const totals = await pool.query(
      `SELECT COUNT(DISTINCT li.word_id)::integer AS total,
      COUNT(DISTINCT li.word_id) FILTER(WHERE st.learning_status='completed')::integer AS known,
      COUNT(DISTINCT li.word_id) FILTER(WHERE st.learning_status='needed')::integer AS needed,
      COUNT(DISTINCT li.word_id) FILTER(WHERE EXISTS(SELECT 1 FROM vocabulary_learning_sessions ls,jsonb_array_elements(ls.items_json) item
        WHERE ls.user_id=$1 AND ls.list_id=l.id AND ls.kind='study' AND (item->>'id')::bigint=li.word_id AND item->>'answeredAt' IS NOT NULL))::integer AS studied
      FROM vocabulary_list_items li JOIN vocabulary_lists l ON l.id=li.list_id
      LEFT JOIN user_vocabulary_list_subscriptions sub ON sub.list_id=l.id AND sub.user_id=$1
      LEFT JOIN user_vocabulary_word_status st ON st.word_id=li.word_id AND st.user_id=$1
      WHERE l.owner_user_id=$1 OR (l.scope='common' AND sub.is_enabled=TRUE)`,
      [userId],
    );
    const activity = await pool.query(
      `SELECT ((item->>'answeredAt')::timestamptz AT TIME ZONE 'Asia/Seoul')::date::text AS day,COUNT(*)::integer AS count
      FROM vocabulary_learning_sessions ls JOIN vocabulary_lists l ON l.id=ls.list_id
      LEFT JOIN user_vocabulary_list_subscriptions sub ON sub.list_id=l.id AND sub.user_id=$1,
      jsonb_array_elements(ls.items_json) item
      WHERE ls.user_id=$1 AND ls.kind='study' AND (l.owner_user_id=$1 OR (l.scope='common' AND sub.is_enabled=TRUE))
      AND item->>'answeredAt' IS NOT NULL AND (item->>'answeredAt')::timestamptz>=NOW()-INTERVAL '8 days' GROUP BY day ORDER BY day`,
      [userId],
    );
    const tests = await pool.query(
      `SELECT COUNT(*)::integer AS count FROM vocabulary_learning_sessions ls JOIN vocabulary_lists l ON l.id=ls.list_id
      LEFT JOIN user_vocabulary_list_subscriptions sub ON sub.list_id=l.id AND sub.user_id=$1
      WHERE ls.user_id=$1 AND ls.kind='test' AND ls.status='completed' AND (l.owner_user_id=$1 OR (l.scope='common' AND sub.is_enabled=TRUE))`,
      [userId],
    );
    return c.json({
      preferences: preferences.rows[0] ?? defaults,
      lists: lists.rows.map((row) => ({
        id: Number(row.id),
        title: row.title,
        scope: row.scope,
        wordCount: row.word_count,
        knownCount: row.known_count,
        neededCount: row.needed_count,
        studiedCount: row.studied_count,
      })),
      totals: { ...totals.rows[0], tests: tests.rows[0].count },
      activity: activity.rows,
      sessions: sessions.rows.map((row) => {
        const value = publicVocabularySession(row);
        // Overview needs counters, not every completed answer's snapshot.
        if (value.result) value.result.items = [];
        return value;
      }),
    });
  });
  app.post('/api/vocabulary/learning/settings', async (c) => {
    const body = record(await c.req.json().catch(() => null));
    const studyCount = count(body.studyCount);
    const testCount = count(body.testCount);
    if (body.firstSide !== 'english' && body.firstSide !== 'korean')
      fail('카드 첫 화면을 선택해 주세요.');
    if (
      body.testType !== 'mixed' &&
      !vocabularyTestTypes.includes(body.testType as TestType)
    )
      fail('테스트 유형을 선택해 주세요.');
    await pool.query(
      `INSERT INTO user_vocabulary_preferences(user_id,study_count,test_count,first_side,test_type) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(user_id) DO UPDATE SET study_count=$2,test_count=$3,first_side=$4,test_type=$5,updated_at=NOW()`,
      [c.get('user').id, studyCount, testCount, body.firstSide, body.testType],
    );
    return c.json({
      preferences: {
        studyCount,
        testCount,
        firstSide: body.firstSide,
        testType: body.testType,
      },
    });
  });
  app.post('/api/vocabulary/learning/sessions', async (c) => {
    const body = record(await c.req.json().catch(() => null));
    const userId = c.get('user').id;
    const listId = positiveId(body.listId);
    const amount = count(body.count);
    if (body.kind !== 'study' && body.kind !== 'test')
      fail('학습 또는 테스트를 선택해 주세요.');
    const kind = body.kind as Kind;
    const scopes =
      kind === 'study' ? ['new', 'needed', 'all'] : ['recent', 'needed', 'all'];
    if (!scopes.includes(String(body.scope)))
      fail('출제 범위를 확인해 주세요.');
    if (body.firstSide !== 'english' && body.firstSide !== 'korean')
      fail('카드 첫 화면을 선택해 주세요.');
    if (
      body.testType !== 'mixed' &&
      !vocabularyTestTypes.includes(body.testType as TestType)
    )
      fail('테스트 유형을 선택해 주세요.');
    const result = await transaction(pool, async (db) => {
      await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      const list = await accessible(db, userId, listId);
      const active = await db.query<SessionRow>(
        `SELECT * FROM vocabulary_learning_sessions WHERE user_id=$1 AND list_id=$2 AND kind=$3 AND status='in_progress'`,
        [userId, listId, kind],
      );
      if (active.rows[0])
        return {
          session: publicVocabularySession(active.rows[0]),
          resumed: true,
        };
      const poolWords = await loadWords(db, userId, listId, list.scope);
      let candidates = poolWords.filter((word) =>
        body.scope === 'new'
          ? !word.studied
          : body.scope === 'needed'
            ? word.learningStatus === 'needed'
            : true,
      );
      if (body.scope === 'recent' || body.sourceSessionId !== undefined) {
        let source: SessionRow | undefined;
        if (body.sourceSessionId !== undefined)
          source = await session(db, userId, positiveId(body.sourceSessionId));
        else
          source = (
            await db.query<SessionRow>(
              `SELECT * FROM vocabulary_learning_sessions WHERE user_id=$1 AND list_id=$2 AND kind='study' AND status='completed' ORDER BY created_at DESC,id DESC LIMIT 1`,
              [userId, listId],
            )
          ).rows[0];
        if (
          !source ||
          source.kind !== 'study' ||
          Number(source.list_id) !== listId ||
          source.status !== 'completed'
        )
          fail('먼저 이 목록의 카드 학습을 완료해 주세요.');
        const ids = new Set(
          source.items_json
            .filter((item) => item.answeredAt)
            .map((item) => item.id),
        );
        candidates = candidates.filter((word) => ids.has(word.id));
      }
      if (!candidates.length)
        fail(
          body.scope === 'new'
            ? '새로 학습할 단어가 없습니다. 모르는 단어 복습이나 전체 다시 학습을 선택해 주세요.'
            : '선택한 범위에 단어가 없습니다.',
        );
      if (kind === 'test' && amount > candidates.length)
        fail(
          `선택한 범위에는 ${candidates.length}개 단어가 있습니다. 문제 수를 줄여 주세요.`,
        );
      const selected = (
        kind === 'test' ? shuffle(candidates) : candidates
      ).slice(0, amount);
      const items: SessionItem[] =
        kind === 'study'
          ? selected.map((word) => ({
              id: word.id,
              word: word.word,
              pronunciationIpa: word.pronunciationIpa,
              meanings: word.meanings,
              expected: [],
            }))
          : buildVocabularyTest(
              selected,
              poolWords,
              body.testType as TestType | 'mixed',
            );
      const inserted = await db.query<SessionRow>(
        `INSERT INTO vocabulary_learning_sessions(user_id,list_id,kind,scope,first_side,test_type,items_json) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          userId,
          listId,
          kind,
          body.scope,
          body.firstSide,
          body.testType,
          JSON.stringify(items),
        ],
      );
      return {
        session: publicVocabularySession(inserted.rows[0]),
        resumed: false,
      };
    });
    return c.json(result);
  });
  app.get('/api/vocabulary/learning/sessions/:id', async (c) =>
    c.json({
      session: publicVocabularySession(
        await session(pool, c.get('user').id, positiveId(c.req.param('id'))),
      ),
    }),
  );
  app.post('/api/vocabulary/learning/sessions/:id/respond', async (c) => {
    const body = record(await c.req.json().catch(() => null));
    const userId = c.get('user').id;
    const wordId = positiveId(body.wordId);
    const result = await transaction(pool, async (db) => {
      const row = await session(
        db,
        userId,
        positiveId(c.req.param('id')),
        true,
      );
      if (row.status === 'abandoned')
        fail('중단한 학습입니다. 새로 시작해 주세요.', 409);
      const item = row.items_json.find((item) => item.id === wordId);
      if (!item) fail('현재 학습에 포함되지 않은 단어입니다.', 404);
      const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
      if (row.kind === 'study' && typeof body.known !== 'boolean')
        fail('알아요 또는 아직 몰라요를 선택해 주세요.');
      if (
        row.kind === 'test' &&
        (answer.length > 500 || (!answer && body.skip !== true))
      )
        fail('답을 입력하거나 모르겠어요를 선택해 주세요.');
      if (item.answeredAt) {
        if (
          row.kind === 'study'
            ? item.known !== body.known
            : item.answer !== answer
        )
          fail('이미 저장한 답입니다. 새로고침해 주세요.', 409);
        return publicVocabularySession(row);
      }
      if (row.items_json.find((item) => !item.answeredAt)?.id !== wordId)
        fail('현재 카드부터 순서대로 진행해 주세요.', 409);
      if (row.kind === 'study') {
        item.known = body.known as boolean;
        await saveVocabularyWordStatus(db, userId, wordId, {
          learningStatus: item.known ? 'completed' : 'needed',
        });
      } else {
        if (
          item.choices &&
          answer &&
          !item.choices.some((choice) => choice.key === answer)
        )
          fail('제공된 보기 중 하나를 선택해 주세요.');
        item.answer = answer;
        item.correct =
          answer !== '' &&
          item.expected.some(
            (value) =>
              normalizeVocabularyAnswer(
                value,
                item.format === 'english_to_korean',
              ) ===
              normalizeVocabularyAnswer(
                answer,
                item.format === 'english_to_korean',
              ),
          );
      }
      item.answeredAt = new Date().toISOString();
      const status = row.items_json.every((item) => item.answeredAt)
        ? 'completed'
        : 'in_progress';
      const updated = await db.query<SessionRow>(
        `UPDATE vocabulary_learning_sessions SET items_json=$3,status=$4,completed_at=CASE WHEN $4='completed' THEN NOW() ELSE NULL END WHERE id=$1 AND user_id=$2 RETURNING *`,
        [row.id, userId, JSON.stringify(row.items_json), status],
      );
      return publicVocabularySession(updated.rows[0]);
    });
    return c.json({ session: result });
  });
  app.post('/api/vocabulary/learning/sessions/:id/abandon', async (c) => {
    const userId = c.get('user').id;
    const id = positiveId(c.req.param('id'));
    await session(pool, userId, id);
    await pool.query(
      `UPDATE vocabulary_learning_sessions SET status='abandoned' WHERE id=$1 AND user_id=$2 AND status='in_progress'`,
      [id, userId],
    );
    return c.json({ abandoned: true });
  });
  app.post('/api/vocabulary/learning/lists/:id/reset', async (c) => {
    const userId = c.get('user').id;
    const listId = positiveId(c.req.param('id'));
    await transaction(pool, async (db) => {
      await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      await accessible(db, userId, listId);
      await db.query(
        `DELETE FROM vocabulary_learning_sessions WHERE user_id=$1 AND list_id=$2 AND kind='study'`,
        [userId, listId],
      );
      await db.query(
        `UPDATE user_vocabulary_word_status SET learning_status=NULL,learning_status_updated_at=NULL,updated_at=NOW() WHERE user_id=$1 AND word_id IN(SELECT word_id FROM vocabulary_list_items WHERE list_id=$2)`,
        [userId, listId],
      );
    });
    return c.json({ reset: true });
  });
}
