import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Hono } from 'hono';
import {
  buildVocabularyTest,
  normalizeVocabularyAnswer,
  vocabularyMeaningAnswers,
  publicVocabularySession,
  registerVocabularyLearningRoutes,
  initializeVocabularyLearningDatabase,
  saveVocabularyWordStatus,
} from '../dist/vocabulary-learning.js';

const words = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  word: `word-${index + 1}`,
  pronunciationIpa: '/word/',
  meanings: [{ partOfSpeech: 'n', text: `뜻 ${index + 1}` }],
}));
test('Voca status writers update only provided fields in one atomic statement', async () => {
  const calls = [];
  const db = {
    async query(sql, values) {
      calls.push({ sql, values });
      return { rows: [{ learningStatus: 'completed', isImportant: true }] };
    },
  };
  assert.deepEqual(
    await saveVocabularyWordStatus(db, 'u', 1, { isImportant: true }),
    { learningStatus: 'completed', isImportant: true },
  );
  assert.equal(calls.length, 1);
  assert.ok(calls[0].sql.startsWith('INSERT'));
  assert.match(calls[0].sql,/\$3::text IS NULL/);
  assert.deepEqual(calls[0].values.slice(4), [false, true]);
  assert.match(calls[0].sql, /learning_status=CASE WHEN \$5/);
  await saveVocabularyWordStatus(db, 'u', 1, { learningStatus: 'needed' });
  assert.deepEqual(calls[1].values.slice(4), [true, false]);
  assert.match(calls[1].sql, /is_important=CASE WHEN \$6/);
});
for (const type of [
  'english_to_korean',
  'korean_to_english',
  'english_choice',
  'korean_choice',
  'mixed',
]) {
  test(`Voca ${type}: unique words, stable answers and unambiguous choices`, () => {
    const items = buildVocabularyTest(words, words, type, () => 0.3);
    assert.equal(items.length, 24);
    assert.equal(new Set(items.map((item) => item.id)).size, 24);
    if (type === 'mixed')
      for (const format of [
        'english_to_korean',
        'korean_to_english',
        'english_choice',
        'korean_choice',
      ])
        assert.equal(items.filter((item) => item.format === format).length, 6);
    for (const item of items) {
      if (item.choices) {
        assert.equal(item.choices.length, 4);
        assert.equal(
          new Set(item.choices.map((choice) => choice.label)).size,
          4,
        );
        assert.deepEqual(
          item.choices.map((choice) => choice.key),
          ['A', 'B', 'C', 'D'],
        );
        const correct = item.choices.find(
          (choice) => choice.key === item.expected[0],
        );
        assert.equal(
          correct.label,
          item.format === 'english_choice' ? item.meanings[0].text : item.word,
        );
      }
    }
  });
}
test('Voca excludes other words with the same accepted meaning from choices', () => {
  const pool = [
    words[0],
    { ...words[1], meanings: [{ partOfSpeech: 'n', text: '뜻 1, 다른 뜻' }] },
    ...words.slice(2),
  ];
  const item = buildVocabularyTest(
    [words[0]],
    pool,
    'english_choice',
    () => 0.1,
  )[0];
  assert.ok(!item.choices.some((choice) => choice.label.includes('다른 뜻')));
});
test('Voca cannot silently turn a four-choice question into a smaller-choice test', () => {
  assert.throws(
    () =>
      buildVocabularyTest(
        words.slice(0, 2),
        words.slice(0, 3),
        'english_choice',
      ),
    /./,
  );
});
test('Voca accepted meanings support saved alternatives, without fuzzy typo acceptance', () => {
  const answers = vocabularyMeaningAnswers({
    ...words[0],
    meanings: [{ partOfSpeech: 'v', text: '개선하다, 향상시키다 (성능)' }],
  });
  assert.ok(answers.includes('개선하다'));
  assert.ok(answers.includes('향상시키다'));
  assert.equal(normalizeVocabularyAnswer('  APPLE. '), 'apple');
  assert.equal(normalizeVocabularyAnswer(' 얼음 크림 ', true), '얼음크림');
  assert.notEqual(
    normalizeVocabularyAnswer('ice cream'),
    normalizeVocabularyAnswer('icecream'),
  );
  assert.notEqual(
    normalizeVocabularyAnswer('apple'),
    normalizeVocabularyAnswer('aple'),
  );
});
test('Voca unfinished test hides all expected answers, future prompts and results', () => {
  const row = {
    id: 1,
    list_id: 1,
    kind: 'test',
    scope: 'all',
    status: 'in_progress',
    first_side: 'english',
    test_type: 'korean_to_english',
    items_json: buildVocabularyTest(
      words,
      words,
      'korean_to_english',
      () => 0.3,
    ),
  };
  row.items_json[0].answer = 'wrong';
  row.items_json[0].correct = false;
  row.items_json[0].answeredAt = new Date().toISOString();
  const data = publicVocabularySession(row);
  assert.equal(data.answered, 1);
  assert.equal(data.result, null);
  assert.equal(data.current.id, row.items_json[1].id);
  assert.equal(data.current.word, undefined);
  assert.equal(data.current.meanings, undefined);
  assert.ok(!JSON.stringify(data).includes('expected'));
  assert.ok(!JSON.stringify(data).includes('wrong'));
  assert.ok(!JSON.stringify(data).includes(row.items_json[1].word));
});
test('Voca completed test exposes final results but never the private choice key', () => {
  const row = {
    id: 1,
    list_id: 1,
    kind: 'test',
    scope: 'all',
    status: 'completed',
    first_side: 'english',
    test_type: 'mixed',
    items_json: buildVocabularyTest(
      words.slice(0, 4),
      words,
      'mixed',
      () => 0.3,
    ).map((item, index) => ({
      ...item,
      correct: index < 2,
      answer: 'answer',
      answeredAt: new Date().toISOString(),
    })),
  };
  const data = publicVocabularySession(row);
  assert.equal(data.current, null);
  assert.equal(data.result.score, 50);
  assert.equal(data.result.items.length, 4);
  assert.ok(!JSON.stringify(data).includes('expected'));
});
test('Voca initialization is additive and protects active-session uniqueness', async () => {
  let sql = '';
  await initializeVocabularyLearningDatabase({
    async query(value) {
      sql += value;
      return { rows: [] };
    },
  });
  assert.match(sql, /CREATE TABLE IF NOT EXISTS/);
  assert.match(sql, /WHERE status='in_progress'/);
  assert.match(sql, /REFERENCES vocabulary_lists/);
  assert.ok(!/DROP|TRUNCATE/.test(sql));
});
for (const body of [
  null,
  [],
  { kind: 'other' },
  { kind: 'study', listId: 1, count: 0 },
  { kind: 'study', listId: true, count: 4 },
  { kind: 'study', listId: [1], count: 4 },
  { kind: 'study', listId: 1, count: 101 },
  { kind: 'test', listId: 1, count: 1.2 },
  { kind: 'test', listId: 1, count: 4, scope: 'new' },
  { kind: 'study', listId: 1, count: 4, scope: 'all', firstSide: 'other' },
]) {
  test(`Voca rejects invalid session request before writes: ${JSON.stringify(body)}`, async () => {
    let queries = 0;
    const pool = {
      async query() {
        queries++;
        return { rows: [] };
      },
      async connect() {
        throw new Error('Unexpected connection');
      },
    };
    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('user', { id: 'u', displayName: 'U' });
      await next();
    });
    registerVocabularyLearningRoutes(app, pool);
    const response = await app.request('/api/vocabulary/learning/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
    assert.equal(queries, 0);
    assert.equal(typeof (await response.json()).error, 'string');
  });
}
