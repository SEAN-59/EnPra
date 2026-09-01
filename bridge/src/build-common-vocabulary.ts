import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Pool, PoolClient } from 'pg';

import { CodexRegistry } from './codex.js';

type DifficultyBand = 'under_5' | 'band_5' | 'band_6' | 'band_7_plus';
type VocabularySense = { partOfSpeech: string; text: string };
type VocabularyCandidate = {
  word: string;
  normalizedWord: string;
  pronunciationIpa: string;
  difficultyBand: DifficultyBand;
  senses: VocabularySense[];
};
type BuildRun = { id: string; status: string };

const databaseUrl = process.env.DATABASE_URL;
const builderUserId = process.env.ENPRA_VOCABULARY_BUILDER_USER_ID;
const dataDir = process.env.ENPRA_DATA_DIR ?? join(process.cwd(), '.enpra-data');
const logPath = join(dataDir, 'common-vocabulary-build.log');

if (!databaseUrl) throw new Error('DATABASE_URL is required.');
if (!builderUserId) throw new Error('ENPRA_VOCABULARY_BUILDER_USER_ID is required.');

const pool = new Pool({ connectionString: databaseUrl });
const codex = new CodexRegistry(dataDir);

const targets: Record<DifficultyBand, number> = {
  under_5: 1_500,
  band_5: 1_875,
  band_6: 2_375,
  band_7_plus: 1_750,
};

const listPlans = [
  ...Array.from({ length: 5 }, (_, index) => ({
    title: `IELTS VOCA ${String(index + 2).padStart(2, '0')}`,
    quotas: { under_5: 125, band_5: 125, band_6: 150, band_7_plus: 100 },
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    title: `IELTS VOCA ${String(index + 7).padStart(2, '0')}`,
    quotas: { under_5: 100, band_5: 125, band_6: 150, band_7_plus: 125 },
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    title: `IELTS VOCA ${String(index + 12).padStart(2, '0')}`,
    quotas: { under_5: 75, band_5: 125, band_6: 175, band_7_plus: 125 },
  })),
] as const;

const topics = [
  'education and learning', 'environment and climate', 'health and lifestyle', 'cities and transport',
  'work and economy', 'science and technology', 'society and public policy', 'culture and history',
  'media and communication', 'food and agriculture', 'travel and tourism', 'housing and communities',
  'research and data', 'crime and law', 'energy and natural resources', 'globalisation and development',
];
const candidateBatchSize = 550;

function writeLog(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  mkdirSync(dataDir, { recursive: true });
  appendFileSync(logPath, `${line}\n`);
}

function normalizeWord(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

function extractJsonArray(text: string) {
  const start = text.indexOf('[');
  if (start < 0) throw new Error('JSON 배열을 찾지 못했습니다.');
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === '[') depth += 1;
    else if (character === ']') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  throw new Error('완결된 JSON 배열을 찾지 못했습니다.');
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePartOfSpeech(value: unknown, word: string): string | null {
  const part = asString(value).toLocaleLowerCase('en-US').replace(/[.\s]/g, '');
  const aliases: Record<string, string> = {
    n: 'n', noun: 'n', v: 'v', verb: 'v', a: 'a', adj: 'a', adjective: 'a',
    ad: 'ad', adv: 'ad', adverb: 'ad', prep: 'prep', preposition: 'prep',
    phrase: 'phrase', idiom: 'phrase', conj: 'conj', conjunction: 'conj',
  };
  return aliases[part] ?? (word.includes(' ') ? 'phrase' : null);
}

function parseCandidates(text: string, expectedBand: DifficultyBand): VocabularyCandidate[] {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJsonArray(text));
  } catch (error) {
    throw new Error(`AI 응답 JSON 해석 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(raw)) throw new Error('AI 응답이 배열이 아닙니다.');

  const candidates = new Map<string, VocabularyCandidate>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const word = asString(record.word);
    const normalizedWord = normalizeWord(word);
    const pronunciationIpa = asString(record.pronunciationIpa ?? record.pronunciation ?? record.ipa);
    if (!/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(word) || word.length > 120 || !pronunciationIpa || pronunciationIpa.length > 160) continue;
    const rawSenses = Array.isArray(record.senses) ? record.senses : [];
    const senses = rawSenses.flatMap((sense) => {
      if (!sense || typeof sense !== 'object') return [];
      const senseRecord = sense as Record<string, unknown>;
      const meaning = asString(senseRecord.meaningKo ?? senseRecord.meaning ?? senseRecord.text);
      const partOfSpeech = normalizePartOfSpeech(senseRecord.partOfSpeech ?? senseRecord.pos, word);
      if (!partOfSpeech || !meaning || meaning.length > 500 || !/[가-힣]/.test(meaning)) return [];
      return [{ partOfSpeech, text: meaning }];
    }).slice(0, 5);
    if (!senses.length || candidates.has(normalizedWord)) continue;
    candidates.set(normalizedWord, { word, normalizedWord, pronunciationIpa, difficultyBand: expectedBand, senses });
  }
  return [...candidates.values()];
}

function vocabularyPrompt(count: number, band: DifficultyBand, topic: string, excludedWords: string[]) {
  const bandInstruction: Record<DifficultyBand, string> = {
    under_5: 'IELTS 학습의 토대가 되는 고빈도 핵심어. 너무 유아적인 단독 기초어는 피하되, IELTS 지문·답변에서 실제로 쓰이는 필수 어휘를 고른다.',
    band_5: 'IELTS 5.0 이상 학습자에게 필요한 중급 핵심어. 일상·학업·사회 주제에서 반복 활용되는 어휘를 고른다.',
    band_6: 'IELTS 6.0 이상, 특히 Reading·Writing Task 2·Speaking에서 효과적인 중상급 학업·논증 어휘를 고른다.',
    band_7_plus: 'IELTS 7.0 목표에 직접 도움이 되는 고급이지만 실용적인 학업·논증·정확한 표현 어휘를 고른다. 희귀하거나 과도하게 문어적인 단어는 제외한다.',
  };
  return [
    'You are building a permanent shared IELTS vocabulary library for Korean learners targeting IELTS band 7.0.',
    `Generate exactly ${count} unique English headwords for the internal difficulty band ${band}.`,
    `Difficulty rule: ${bandInstruction[band]}`,
    `Prioritise IELTS Reading, Listening, Writing, and Speaking usefulness. This batch should emphasise the topic: ${topic}.`,
    'Exclude proper names, brand names, slang, archaic words, highly specialised jargon, transparent inflections, and near-duplicate word forms.',
    'Use base lemmas where possible. A fixed phrase is allowed only when it is a genuinely useful IELTS expression.',
    'The following headwords are already in the shared pool. Never return any of them, including spelling variants or transparent derivatives.',
    excludedWords.join(', '),
    'Return ONLY a valid JSON array. Do not use markdown or explanatory text.',
    'Each item must follow this exact schema:',
    '[{"word":"...","pronunciationIpa":"/.../","senses":[{"partOfSpeech":"n|v|a|ad|prep|phrase|conj","meaningKo":"자연스러운 한국어 뜻"}]}]',
    'Every item needs one or more concise Korean meanings and a standard IPA pronunciation.',
  ].join('\n');
}

async function ensureBuildTables(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS vocabulary_build_runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('building', 'ready', 'finalized', 'failed')),
      targets JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finalized_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS vocabulary_build_candidates (
      run_id TEXT NOT NULL REFERENCES vocabulary_build_runs(id) ON DELETE CASCADE,
      normalized_word TEXT NOT NULL,
      word TEXT NOT NULL,
      pronunciation_ipa TEXT NOT NULL,
      difficulty_band TEXT NOT NULL CHECK (difficulty_band IN ('under_5', 'band_5', 'band_6', 'band_7_plus')),
      build_batch INTEGER NOT NULL DEFAULT 1,
      senses JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (run_id, normalized_word)
    );
    CREATE INDEX IF NOT EXISTS vocabulary_build_candidates_run_band_idx
      ON vocabulary_build_candidates (run_id, difficulty_band, normalized_word);
    ALTER TABLE vocabulary_build_candidates
      ADD COLUMN IF NOT EXISTS build_batch INTEGER NOT NULL DEFAULT 1;
    CREATE INDEX IF NOT EXISTS vocabulary_build_candidates_run_batch_idx
      ON vocabulary_build_candidates (run_id, build_batch, normalized_word);
  `);
  await client.query(`
    WITH ordered AS (
      SELECT run_id, normalized_word,
             CEIL(row_number() OVER (PARTITION BY run_id ORDER BY created_at, normalized_word)::numeric / $1)::INTEGER AS build_batch
      FROM vocabulary_build_candidates
    )
    UPDATE vocabulary_build_candidates candidate
    SET build_batch = ordered.build_batch
    FROM ordered
    WHERE candidate.run_id = ordered.run_id AND candidate.normalized_word = ordered.normalized_word
  `, [candidateBatchSize]);
}

async function getOrCreateRun(client: PoolClient): Promise<BuildRun> {
  const current = await client.query<BuildRun>(
    `SELECT id, status FROM vocabulary_build_runs
     WHERE status IN ('building', 'ready')
     ORDER BY created_at DESC LIMIT 1`,
  );
  if (current.rows[0]) return current.rows[0];
  const id = randomUUID();
  await client.query(
    `INSERT INTO vocabulary_build_runs (id, status, targets) VALUES ($1, 'building', $2::jsonb)`,
    [id, JSON.stringify(targets)],
  );
  return { id, status: 'building' };
}

async function getCounts(client: PoolClient, runId: string) {
  const result = await client.query<{ difficulty_band: DifficultyBand; count: string }>(
    `SELECT difficulty_band, count(*)::text FROM vocabulary_build_candidates
     WHERE run_id = $1 GROUP BY difficulty_band`,
    [runId],
  );
  const counts: Record<DifficultyBand, number> = { under_5: 0, band_5: 0, band_6: 0, band_7_plus: 0 };
  for (const row of result.rows) counts[row.difficulty_band] = Number(row.count);
  return counts;
}

async function getActiveBatch(client: PoolClient, runId: string) {
  const result = await client.query<{ build_batch: string; word_count: string }>(
    `SELECT build_batch::text, count(*)::text
     FROM vocabulary_build_candidates
     WHERE run_id = $1
     GROUP BY build_batch
     ORDER BY build_batch`,
    [runId],
  );
  const incomplete = result.rows.find((row) => Number(row.word_count) < candidateBatchSize);
  if (incomplete) return { number: Number(incomplete.build_batch), count: Number(incomplete.word_count) };
  return { number: result.rows.length + 1, count: 0 };
}

async function getExcludedWords(client: PoolClient, runId: string, activeBatch: number) {
  const result = await client.query<{ normalized_word: string }>(
    `SELECT normalized_word FROM vocabulary_words
     UNION
     SELECT normalized_word FROM vocabulary_build_candidates WHERE run_id = $1 AND build_batch < $2
     ORDER BY normalized_word`,
    [runId, activeBatch],
  );
  return result.rows.map((row) => row.normalized_word);
}

function nextBand(counts: Record<DifficultyBand, number>) {
  return (Object.keys(targets) as DifficultyBand[])
    .filter((band) => counts[band] < targets[band])
    .sort((left, right) => (targets[right] - counts[right]) - (targets[left] - counts[left]))[0] ?? null;
}

async function saveCandidates(client: PoolClient, runId: string, buildBatch: number, candidates: VocabularyCandidate[]) {
  let inserted = 0;
  for (const candidate of candidates) {
    const result = await client.query(
      `INSERT INTO vocabulary_build_candidates (run_id, normalized_word, word, pronunciation_ipa, difficulty_band, build_batch, senses)
       SELECT $1, $2, $3, $4, $5, $6, $7::jsonb
       WHERE NOT EXISTS (SELECT 1 FROM vocabulary_words WHERE normalized_word = $2)
       ON CONFLICT (run_id, normalized_word) DO NOTHING`,
      [runId, candidate.normalizedWord, candidate.word, candidate.pronunciationIpa, candidate.difficultyBand, buildBatch, JSON.stringify(candidate.senses)],
    );
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}

async function buildCandidates(run: BuildRun) {
  if (run.status === 'ready' || run.status === 'finalized') return;
  let requestNumber = 0;
  let consecutiveEmptyBatches = 0;
  while (true) {
    const client = await pool.connect();
    let counts: Record<DifficultyBand, number>;
    let excludedWords: string[];
    let activeBatch: { number: number; count: number };
    try {
      counts = await getCounts(client, run.id);
      activeBatch = await getActiveBatch(client, run.id);
      excludedWords = await getExcludedWords(client, run.id, activeBatch.number);
    } finally {
      client.release();
    }
    const band = nextBand(counts);
    if (!band) break;
    const remaining = targets[band] - counts[band];
    const batchSize = Math.min(60, remaining, candidateBatchSize - activeBatch.count);
    const topic = topics[(excludedWords.length + requestNumber) % topics.length];
    requestNumber += 1;
    writeLog(`run=${run.id} request=${requestNumber} poolBatch=${activeBatch.number} pool=${activeBatch.count}/${candidateBatchSize} band=${band} current=${counts[band]}/${targets[band]} ask=${batchSize} excluded=${excludedWords.length} topic=${topic}`);
    try {
      const completion = await codex.get(builderUserId!).runLearningPrompt(vocabularyPrompt(batchSize, band, topic, excludedWords));
      const candidates = parseCandidates(completion.text, band);
      const saveClient = await pool.connect();
      let inserted = 0;
      try {
        inserted = await saveCandidates(saveClient, run.id, activeBatch.number, candidates);
      } finally {
        saveClient.release();
      }
      if (inserted === 0) consecutiveEmptyBatches += 1;
      else consecutiveEmptyBatches = 0;
      writeLog(`run=${run.id} request=${requestNumber} parsed=${candidates.length} accepted=${inserted}`);
    } catch (error) {
      consecutiveEmptyBatches += 1;
      writeLog(`run=${run.id} request=${requestNumber} error=${error instanceof Error ? error.message : String(error)}`);
    }
    if (consecutiveEmptyBatches >= 5) throw new Error('연속 다섯 번의 생성 배치가 유효한 단어를 확보하지 못했습니다. 로그를 확인해 주세요.');
  }
  const client = await pool.connect();
  try {
    await client.query(`UPDATE vocabulary_build_runs SET status = 'ready', updated_at = NOW() WHERE id = $1`, [run.id]);
  } finally {
    client.release();
  }
  writeLog(`run=${run.id} all 7,500 candidates are ready.`);
}

async function finalizeRun(run: BuildRun) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const counts = await getCounts(client, run.id);
    for (const band of Object.keys(targets) as DifficultyBand[]) {
      if (counts[band] !== targets[band]) throw new Error(`${band} 후보 수가 ${counts[band]}개라서 ${targets[band]}개 목표를 확정할 수 없습니다.`);
    }
    const collision = await client.query<{ normalized_word: string }>(
      `SELECT c.normalized_word
       FROM vocabulary_build_candidates c
       JOIN vocabulary_words w ON w.normalized_word = c.normalized_word
       WHERE c.run_id = $1 LIMIT 1`,
      [run.id],
    );
    if (collision.rows[0]) throw new Error(`생성 중 기존 단어와 겹친 항목이 있어 확정할 수 없습니다: ${collision.rows[0].normalized_word}`);

    const lists = await client.query<{ id: string; title: string; word_count: string }>(
      `SELECT l.id, l.title, count(i.word_id)::text AS word_count
       FROM vocabulary_lists l
       LEFT JOIN vocabulary_list_items i ON i.list_id = l.id
       WHERE l.scope = 'common' AND l.title = ANY($1::text[])
       GROUP BY l.id, l.title`,
      [listPlans.map((plan) => plan.title)],
    );
    if (lists.rows.length !== listPlans.length) throw new Error('IELTS VOCA 02~16 공통 목록을 모두 찾지 못했습니다.');
    if (lists.rows.some((list) => Number(list.word_count) > 0)) throw new Error('공통 목록 02~16 중 이미 단어가 담긴 목록이 있어 덮어쓰지 않습니다.');
    const listIds = new Map(lists.rows.map((list) => [list.title, Number(list.id)]));

    const candidateRows = await client.query<{
      normalized_word: string; word: string; pronunciation_ipa: string; difficulty_band: DifficultyBand; senses: VocabularySense[];
    }>(
      `SELECT normalized_word, word, pronunciation_ipa, difficulty_band, senses
       FROM vocabulary_build_candidates WHERE run_id = $1
       ORDER BY difficulty_band, normalized_word`,
      [run.id],
    );
    const byBand: Record<DifficultyBand, typeof candidateRows.rows> = { under_5: [], band_5: [], band_6: [], band_7_plus: [] };
    for (const candidate of candidateRows.rows) byBand[candidate.difficulty_band].push(candidate);

    const placements: Array<{ candidate: typeof candidateRows.rows[number]; listId: number }> = [];
    for (const band of Object.keys(targets) as DifficultyBand[]) {
      let index = 0;
      for (const plan of listPlans) {
        const listId = listIds.get(plan.title);
        if (!listId) throw new Error(`목록 ID를 찾지 못했습니다: ${plan.title}`);
        for (let count = 0; count < plan.quotas[band]; count += 1) {
          const candidate = byBand[band][index++];
          if (!candidate) throw new Error(`${band} 후보 배치 중 단어가 부족합니다.`);
          placements.push({ candidate, listId });
        }
      }
    }

    const nextSort = new Map<number, number>();
    for (const plan of listPlans) nextSort.set(listIds.get(plan.title)!, 0);
    for (const { candidate, listId } of placements) {
      const wordResult = await client.query<{ id: string }>(
        `INSERT INTO vocabulary_words (word, normalized_word, pronunciation_ipa, difficulty_band)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [candidate.word, candidate.normalized_word, candidate.pronunciation_ipa, candidate.difficulty_band],
      );
      const wordId = Number(wordResult.rows[0].id);
      for (const [index, sense] of candidate.senses.entries()) {
        await client.query(
          `INSERT INTO vocabulary_senses (word_id, part_of_speech, meaning_ko, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [wordId, sense.partOfSpeech, sense.text, index],
        );
      }
      const sortOrder = nextSort.get(listId)!;
      await client.query(`INSERT INTO vocabulary_list_items (list_id, word_id, sort_order) VALUES ($1, $2, $3)`, [listId, wordId, sortOrder]);
      nextSort.set(listId, sortOrder + 1);
    }
    await client.query(`UPDATE vocabulary_build_runs SET status = 'finalized', finalized_at = NOW(), updated_at = NOW() WHERE id = $1`, [run.id]);
    await client.query('COMMIT');
    writeLog(`run=${run.id} finalized: 7,500 words assigned to IELTS VOCA 02~16.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function classificationPrompt(words: Array<{ normalized_word: string; senses: string }>) {
  return [
    'Classify existing entries in a permanent IELTS vocabulary library for Korean learners targeting IELTS band 7.0.',
    'Use the bands under_5, band_5, band_6, band_7_plus according to IELTS usefulness and difficulty.',
    'Return ONLY a JSON array, with exactly one object per supplied word: [{"word":"lowercase headword","difficultyBand":"under_5|band_5|band_6|band_7_plus"}].',
    'Do not introduce words that were not supplied.',
    JSON.stringify(words),
  ].join('\n');
}

async function classifyExistingWords() {
  const client = await pool.connect();
  try {
    const words = await client.query<{ id: string; normalized_word: string; senses: string }>(
      `SELECT w.id, w.normalized_word, string_agg(s.meaning_ko, '; ' ORDER BY s.sort_order) AS senses
       FROM vocabulary_words w
       JOIN vocabulary_list_items i ON i.word_id = w.id
       JOIN vocabulary_lists l ON l.id = i.list_id
       LEFT JOIN vocabulary_senses s ON s.word_id = w.id
       WHERE l.title = 'IELTS VOCA 01' AND w.difficulty_band IS NULL
       GROUP BY w.id, w.normalized_word ORDER BY w.normalized_word`,
    );
    for (let offset = 0; offset < words.rows.length; offset += 75) {
      const batch = words.rows.slice(offset, offset + 75);
      const completion = await codex.get(builderUserId!).runLearningPrompt(
        classificationPrompt(batch.map(({ normalized_word, senses }) => ({ normalized_word, senses }))),
      );
      const parsed = JSON.parse(extractJsonArray(completion.text)) as Array<{ word?: unknown; difficultyBand?: unknown }>;
      const valid = new Map<string, DifficultyBand>();
      for (const item of parsed) {
        const word = normalizeWord(asString(item.word));
        const band = asString(item.difficultyBand) as DifficultyBand;
        if (batch.some((entry) => entry.normalized_word === word) && Object.hasOwn(targets, band)) valid.set(word, band);
      }
      for (const word of batch) {
        const band = valid.get(word.normalized_word);
        if (band) await client.query(`UPDATE vocabulary_words SET difficulty_band = $1, updated_at = NOW() WHERE id = $2`, [band, word.id]);
      }
      writeLog(`IELTS VOCA 01 classification ${Math.min(offset + batch.length, words.rows.length)}/${words.rows.length}`);
    }
  } finally {
    client.release();
  }
}

async function main() {
  const client = await pool.connect();
  let run: BuildRun;
  try {
    await ensureBuildTables(client);
    run = await getOrCreateRun(client);
  } finally {
    client.release();
  }
  writeLog(`starting common IELTS vocabulary build run=${run.id}`);
  await buildCandidates(run);
  await finalizeRun(run);
  await classifyExistingWords();
  writeLog(`common IELTS vocabulary build is complete.`);
}

main()
  .catch((error) => {
    writeLog(`build failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => { await pool.end(); });
