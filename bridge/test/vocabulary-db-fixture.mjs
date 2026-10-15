// Runs only when explicitly invoked, never by the normal *.test.mjs suite.
// All tables/data live in a transaction-local schema and are rolled back.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { Hono } from 'hono';
import { initializePersonalVocabularyDatabase, savePersonalVocabulary, personalVocabularyDetails } from '../dist/personal-vocabulary.js';
import {
  initializeVocabularyLearningDatabase,
  registerVocabularyLearningRoutes,
  saveVocabularyWordStatus,
} from '../dist/vocabulary-learning.js';

if (!process.argv.includes('--run'))
  throw new Error('Pass --run to invoke the rollback-only database fixture.');
const pool = new Pool({
  connectionString:
    process.env.ENPRA_VOCA_FIXTURE_DATABASE_URL ?? process.env.DATABASE_URL,
  max: 1,
});
const client = await pool.connect();
const schema = `voca_fixture_${randomUUID().replaceAll('-', '')}`;
let checks = 0;
const check = (value, expected, label) => {
  assert.deepEqual(value, expected, label);
  checks++;
};
let savepoint = 0;
const savepoints = [];
const query = async (sql, values) => {
  if (sql === 'BEGIN') {
    const name = `voca_case_${++savepoint}`;
    savepoints.push(name);
    return client.query(`SAVEPOINT ${name}`);
  }
  if (sql === 'COMMIT')
    return client.query(`RELEASE SAVEPOINT ${savepoints.pop()}`);
  if (sql === 'ROLLBACK') {
    const name = savepoints.pop();
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    return client.query(`RELEASE SAVEPOINT ${name}`);
  }
  return client.query(sql, values);
};
const db = {
  query,
  async connect() {
    return { query, release() {} };
  },
};
const app = new Hono();
app.use('*', async (c, next) => {
  c.set('user', {
    id: c.req.header('X-Fixture-User') ?? 'user-a',
    displayName: 'Fixture',
  });
  await next();
});
app.onError((error, c) =>
  error.getResponse
    ? error.getResponse()
    : c.json({ error: error.message }, 500),
);
registerVocabularyLearningRoutes(app, db);
async function request(path, body, user = 'user-a') {
  const response = await app.request(`/api/vocabulary/learning${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', 'X-Fixture-User': user },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
const start = (kind = 'study', overrides = {}) =>
  request('/sessions', {
    kind,
    listId: 1,
    scope: kind === 'study' ? 'new' : 'all',
    count: 20,
    firstSide: 'english',
    testType: 'mixed',
    ...overrides,
  });
try {
  await client.query('BEGIN');
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.query(`SET LOCAL search_path TO ${schema}`);
  await client.query(`CREATE TABLE users(id TEXT PRIMARY KEY);
    CREATE TABLE vocabulary_lists(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,owner_user_id TEXT REFERENCES users(id),scope TEXT,title TEXT,list_type TEXT DEFAULT 'custom',learning_date DATE,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE vocabulary_words(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,word TEXT,normalized_word TEXT UNIQUE,pronunciation_ipa TEXT,difficulty_band TEXT);
    CREATE TABLE vocabulary_senses(word_id BIGINT REFERENCES vocabulary_words(id),part_of_speech TEXT,meaning_ko TEXT,sort_order INTEGER);
    CREATE TABLE vocabulary_list_items(list_id BIGINT REFERENCES vocabulary_lists(id),word_id BIGINT REFERENCES vocabulary_words(id),sort_order INTEGER,PRIMARY KEY(list_id,word_id));
    CREATE TABLE user_vocabulary_word_status(user_id TEXT REFERENCES users(id),word_id BIGINT REFERENCES vocabulary_words(id),learning_status TEXT,is_important BOOLEAN DEFAULT FALSE,learning_status_updated_at TIMESTAMPTZ,updated_at TIMESTAMPTZ DEFAULT NOW(),PRIMARY KEY(user_id,word_id));
    CREATE TABLE user_vocabulary_list_subscriptions(user_id TEXT REFERENCES users(id),list_id BIGINT REFERENCES vocabulary_lists(id),is_enabled BOOLEAN DEFAULT TRUE,PRIMARY KEY(user_id,list_id));`);
  await initializePersonalVocabularyDatabase(db);
  await client.query(`
    INSERT INTO users VALUES('user-a'),('user-b');
    INSERT INTO vocabulary_lists(owner_user_id,scope,title) VALUES('user-a','personal','400-word list'),(NULL,'common','Common list'),('user-b','personal','Other user'),('user-a','personal','Empty list');
    INSERT INTO vocabulary_words(word,normalized_word,pronunciation_ipa) SELECT 'word-'||n,'word-'||n,'/word/' FROM generate_series(1,400) n;
    INSERT INTO vocabulary_senses SELECT id,'n','뜻 '||id,0 FROM vocabulary_words;
    INSERT INTO vocabulary_list_items SELECT 1,id,id FROM vocabulary_words;
    INSERT INTO vocabulary_list_items SELECT 2,id,id FROM vocabulary_words WHERE id<=8;
    INSERT INTO vocabulary_list_items SELECT 3,id,id FROM vocabulary_words WHERE id<=4;
    INSERT INTO user_vocabulary_list_subscriptions VALUES('user-a',2,TRUE);`);
  await initializeVocabularyLearningDatabase(db);
  await initializeVocabularyLearningDatabase(db);
  let status = await saveVocabularyWordStatus(db, 'user-a', 400, {
    learningStatus: 'completed',
    isImportant: true,
  });
  check(status.learningStatus, 'completed');
  check(status.isImportant, true);
  status = await saveVocabularyWordStatus(db, 'user-a', 400, {
    isImportant: false,
  });
  check(status.learningStatus, 'completed');
  check(status.isImportant, false);
  status = await saveVocabularyWordStatus(db, 'user-a', 400, {
    isImportant: true,
  });
  status = await saveVocabularyWordStatus(db, 'user-a', 400, {
    learningStatus: null,
  });
  check(status.learningStatus, null);
  check(status.isImportant, true);
  status = await saveVocabularyWordStatus(db, 'user-a', 400, {
    isImportant: false,
  });
  check(status.learningStatus, null);
  check(status.isImportant, false);
  let result = await request('/overview');
  check(result.status, 200);
  check(result.body.lists.length, 3);
  check(result.body.totals.total, 400);
  check(result.body.totals.studied, 0);
  check(result.body.preferences.studyCount, 20);
  result = await request('/settings', {
    studyCount: 40,
    testCount: 12,
    firstSide: 'korean',
    testType: 'english_to_korean',
  });
  check(result.status, 200);
  check((await request('/overview')).body.preferences.firstSide, 'korean');
  check(
    (await request('/overview', undefined, 'user-b')).body.preferences
      .studyCount,
    20,
  );
  for (const overrides of [
    { listId: 3 },
    { listId: 4 },
    { scope: 'needed' },
    { kind: 'test', scope: 'recent' },
  ])
    check(
      (await start('study', overrides)).status,
      overrides.listId === 3 ? 404 : 400,
    );
  const first = await start();
  check(first.status, 200);
  const firstId = first.body.session.id;
  check(first.body.session.total, 20);
  check(first.body.session.current.id, 1);
  check(
    (await start('study', { count: 40, firstSide: 'korean' })).body.session.id,
    firstId,
    'active session resumed despite changed settings',
  );
  check(
    (await request(`/sessions/${firstId}`, undefined, 'user-b')).status,
    404,
  );
  check(
    (await request(`/sessions/${firstId}/respond`, { wordId: 2, known: true }))
      .status,
    409,
  );
  check(
    (
      await request(`/sessions/${firstId}/respond`, {
        wordId: 999,
        known: true,
      })
    ).status,
    404,
  );
  for (let wordId = 1; wordId <= 20; wordId++) {
    result = await request(`/sessions/${firstId}/respond`, {
      wordId,
      known: wordId % 2 === 0,
    });
    check(result.status, 200);
    check(result.body.session.answered, wordId);
    if (wordId === 1) {
      check(result.body.session.result, null);
      check((await request(`/sessions/${firstId}`)).body.session.current.id, 2);
      check(
        (
          await request(`/sessions/${firstId}/respond`, {
            wordId,
            known: false,
          })
        ).body.session.answered,
        1,
      );
      check(
        (await request(`/sessions/${firstId}/respond`, { wordId, known: true }))
          .status,
        409,
      );
    }
  }
  check(result.body.session.result.known, 10);
  check(result.body.session.result.needed, 10);
  check(result.body.session.status, 'completed');
  check(
    (await request(`/sessions/${firstId}/respond`, { wordId: 20, known: true }))
      .body.session.answered,
    20,
  );
  result = await request('/overview');
  check(result.body.totals.studied, 20);
  check(result.body.activity.reduce((sum, day) => sum + day.count, 0), 20, 'daily activity counts only answered study cards');
  check(result.body.totals.known, 10);
  check(result.body.totals.needed, 10);
  check(result.body.lists.find((list) => list.id === 1).studiedCount, 20);
  const next = await start();
  check(next.body.session.current.id, 21);
  await request(`/sessions/${next.body.session.id}/abandon`, {});
  const review = await start('study', {
    scope: 'needed',
    count: 100,
    firstSide: 'korean',
  });
  check(review.body.session.total, 10);
  check(review.body.session.firstSide, 'korean');
  check(review.body.session.current.id, 1);
  await request(`/sessions/${review.body.session.id}/abandon`, {});
  const restart = await start('study', { scope: 'all' });
  check(restart.body.session.current.id, 1);
  await request(`/sessions/${restart.body.session.id}/abandon`, {});
  check((await start('test', { scope: 'recent', count: 21 })).status, 400);
  check(
    (
      await start('test', {
        scope: 'recent',
        sourceSessionId: firstId,
        listId: 2,
      })
    ).status,
    400,
  );
  check((await start('test', { scope: 'all', count: 101 })).status, 400);
  for (const testType of [
    'english_to_korean',
    'korean_to_english',
    'english_choice',
    'korean_choice',
    'mixed',
  ]) {
    const started = await start('test', {
      scope: 'recent',
      sourceSessionId: firstId,
      count: 12,
      testType,
    });
    check(started.status, 200, testType);
    let current = started.body.session;
    const original = (
      await client.query(
        'SELECT items_json FROM vocabulary_learning_sessions WHERE id=$1',
        [current.id],
      )
    ).rows[0].items_json;
    check(new Set(original.map((item) => item.id)).size, 12);
    if (testType === 'mixed')
      for (const format of [
        'english_to_korean',
        'korean_to_english',
        'english_choice',
        'korean_choice',
      ])
        check(original.filter((item) => item.format === format).length, 3);
    for (let index = 0; index < 12; index++) {
      const item = original[index];
      check(current.current.id, item.id);
      check(current.result, null);
      assert.ok(!JSON.stringify(current).includes('expected'));
      checks++;
      let answer =
        index < 8
          ? item.expected[0]
          : item.choices
            ? item.choices.find((choice) => choice.key !== item.expected[0]).key
            : 'incorrect';
      if (item.format === 'korean_to_english' && index < 8)
        answer = `  ${answer.toUpperCase()}. `;
      const submitted = await request(`/sessions/${current.id}/respond`, {
        wordId: item.id,
        answer,
      });
      check(submitted.status, 200);
      current = submitted.body.session;
      if (index === 0) {
        check(
          (await request(`/sessions/${current.id}`)).body.session.current.id,
          original[1].id,
        );
        check(
          (
            await request(`/sessions/${current.id}/respond`, {
              wordId: item.id,
              answer,
            })
          ).body.session.answered,
          1,
        );
      }
    }
    check(current.status, 'completed');
    check(current.result.correct, 8);
    check(current.result.score, 67);
    check(
      (await request(`/sessions/${current.id}`)).body.session.result.score,
      67,
    );
  }
  result = await request('/overview');
  check(result.body.totals.tests, 5);
  check(
    result.body.totals.known,
    10,
    'test must not replace self-reported knowledge',
  );
  const neededTest = await start('test', {
    scope: 'needed',
    count: 10,
    testType: 'english_to_korean',
  });
  check(neededTest.body.session.total, 10);
  check(neededTest.body.session.result, null);
  let skip = await request(`/sessions/${neededTest.body.session.id}/respond`, {
    wordId: neededTest.body.session.current.id,
    skip: true,
  });
  check(skip.status, 200);
  check(skip.body.session.answered, 1);
  await request(`/sessions/${neededTest.body.session.id}/abandon`, {});
  check(
    (
      await request(`/sessions/${neededTest.body.session.id}/respond`, {
        wordId: skip.body.session.current.id,
        answer: 'x',
      })
    ).status,
    409,
  );
  // A removed common subscription must revoke resume/submit access.
  const common = await start('study', { listId: 2, count: 4, scope: 'all' });
  check(common.status, 200);
  await client.query(
    "UPDATE user_vocabulary_list_subscriptions SET is_enabled=FALSE WHERE user_id='user-a' AND list_id=2",
  );
  check((await request(`/sessions/${common.body.session.id}`)).status, 404);
  check(
    (
      await request(`/sessions/${common.body.session.id}/respond`, {
        wordId: common.body.session.current.id,
        known: true,
      })
    ).status,
    404,
  );
  await client.query(
    "UPDATE user_vocabulary_list_subscriptions SET is_enabled=TRUE WHERE user_id='user-a' AND list_id=2",
  );
  await request(`/sessions/${common.body.session.id}/abandon`, {});
  await client.query(
    "UPDATE user_vocabulary_word_status SET is_important=TRUE WHERE user_id='user-a' AND word_id=1",
  );
  await client.query(
    "INSERT INTO user_vocabulary_word_status(user_id,word_id,learning_status) VALUES('user-b',1,'completed')",
  );
  check((await request('/lists/1/reset', {})).status, 200);
  result = await request('/overview');
  check(result.body.totals.studied, 0);
  check(result.body.totals.known, 0);
  check(result.body.totals.tests, 5);
  check(
    (
      await client.query(
        "SELECT is_important FROM user_vocabulary_word_status WHERE user_id='user-a' AND word_id=1",
      )
    ).rows[0].is_important,
    true,
  );
  check(
    (
      await client.query(
        "SELECT learning_status FROM user_vocabulary_word_status WHERE user_id='user-b' AND word_id=1",
      )
    ).rows[0].learning_status,
    'completed',
  );
  check((await start()).body.session.current.id, 1);
  const sense = text => [{partOfSpeech:'n',text}];
  const sharedId = await savePersonalVocabulary(db,'user-a',{word:'Word-1',pronunciationIpa:'/private-a/',senses:sense('A only')});
  check(sharedId,1);
  check(await savePersonalVocabulary(db,'user-b',{word:'Ｗｏｒｄ-1',pronunciationIpa:'/private-b/',senses:sense('B only')}),1);
  await savePersonalVocabulary(db,'user-a',{word:'Word-1',pronunciationIpa:'/private-a/',senses:sense('A only')});
  check((await personalVocabularyDetails(db,'user-a','personal',[1])).get(1).senses.length,1,'repeated meanings deduplicated');
  check((await personalVocabularyDetails(db,'user-b','personal',[1])).get(1).senses[0].text,'B only');
  check((await personalVocabularyDetails(db,'user-a','common',[1])).size,0,'common list never overlays private data');
  check((await client.query('SELECT meaning_ko FROM vocabulary_senses WHERE word_id=1')).rows.map(r=>r.meaning_ko),['뜻 1']);
  const privateId = await savePersonalVocabulary(db,'user-a',{word:'PrivateHeadword',pronunciationIpa:'/private/',senses:sense('secret')});
  const identity = (await client.query('SELECT pronunciation_ipa,is_canonical FROM vocabulary_words WHERE id=$1',[privateId])).rows[0];
  check(identity,{pronunciation_ipa:'—',is_canonical:false},'shared identity contains no private IPA');
  check((await personalVocabularyDetails(db,'user-b','personal',[privateId])).size,0,'other owner has no private entry');
  // New sessions must use only the current owner's meanings, not the other owner's overlay.
  await client.query("UPDATE vocabulary_learning_sessions SET status='abandoned' WHERE status='in_progress'");
  const ownerSession = (await start('study',{scope:'all'})).body.session;
  check(ownerSession.current.meanings.some(m=>m.text==='A only'),true);
  check(ownerSession.current.meanings.some(m=>m.text==='B only'),false);
  const otherResponse = await request('/sessions',{kind:'study',listId:3,scope:'all',count:4,firstSide:'english',testType:'mixed'},'user-b');
  check(otherResponse.status,200,'other owner study starts');
  const otherSession = otherResponse.body.session;
  check(otherSession.current.meanings.some(m=>m.text==='B only'),true);
  check(otherSession.current.meanings.some(m=>m.text==='A only'),false);
  await client.query('SAVEPOINT legacy_guard');
  await client.query('DROP TABLE user_vocabulary_entries');
  await client.query("DELETE FROM vocabulary_list_items WHERE list_id IN (SELECT id FROM vocabulary_lists WHERE scope='personal')");
  await assert.rejects(()=>initializePersonalVocabularyDatabase(db),/explicit provenance review/);
  await client.query('ROLLBACK TO SAVEPOINT legacy_guard');
  checks++;
  await client.query('ROLLBACK');
  check(
    (
      await client.query('SELECT 1 FROM pg_namespace WHERE nspname=$1', [
        schema,
      ])
    ).rowCount,
    0,
    'owned schema rolled back',
  );
  console.log(
    JSON.stringify({
      event: 'voca_db_fixture_complete',
      checks,
      passed: true,
      words: 400,
      testTypes: 5,
      rollbackVerified: true,
      productionTablesChanged: false,
    }),
  );
} catch (error) {
  await client.query('ROLLBACK');
  console.error(
    JSON.stringify({
      event: 'voca_db_fixture_failed',
      checks,
      message: error.message,
      rollbackVerified:
        (
          await client.query('SELECT 1 FROM pg_namespace WHERE nspname=$1', [
            schema,
          ])
        ).rowCount === 0,
    }),
  );
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
