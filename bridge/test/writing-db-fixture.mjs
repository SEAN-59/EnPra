// Run only under an explicitly coordinated DB check; every created record is rolled back.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { Hono } from 'hono';

assert(process.argv[2], 'Pass the absolute path to the candidate writing.js module.');
const { registerWritingRoutes, initializeWritingDatabase } = await import(process.argv[2]);
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
await db.connect();
const prefix = `enpra-write-regression:${randomUUID()}:`;
const schema = `writing_fixture_${randomUUID().replaceAll('-', '')}`;
let user, userCounter = 0, savepointCounter = 0, currentCheck = '', gradePrompt = '';
let invalidQuestion = false, invalidHints = false, invalidGrade = false;
let bankQuestionId = null, errorCount = 0;
const stack = [], failures = [], coverage = { checks: 0, stages: [], learningCases: 0, testCases: 0, promotionCases: 0 };
const safeId = value => { const id = Number(value); assert(Number.isSafeInteger(id) && id > 0); return id; };
const pool = {
  async query(sql, params) {
    if (sql === 'BEGIN') { const name = `route_${++savepointCounter}`; stack.push(name); return db.query(`SAVEPOINT ${name}`); }
    if (sql === 'COMMIT') { const name = stack.pop(); assert(name); return db.query(`RELEASE SAVEPOINT ${name}`); }
    if (sql === 'ROLLBACK') { const name = stack.pop(); assert(name); await db.query(`ROLLBACK TO SAVEPOINT ${name}`); return db.query(`RELEASE SAVEPOINT ${name}`); }
    // Force new fixture questions without modifying any existing bank question.
    if (sql.startsWith('SELECT q.*')) return bankQuestionId
      ? db.query(sql.replace(' WHERE ', ` WHERE q.id=${safeId(bankQuestionId)} AND `), params)
      : { rows: [], rowCount: 0 };
    return db.query(sql, params);
  },
  async connect() { return { query: pool.query, release() {} }; },
};
const app = new Hono();
app.use('*', async (c, next) => { c.set('user', user); await next(); });
app.onError((error, c) => error.getResponse ? error.getResponse() : c.json({ code: error.code ?? 'INTERNAL_ERROR' }, 500));
registerWritingRoutes(app, pool, { get() { return {
  async readAccount() { return { type: 'chatgpt' }; },
  async runLearningPrompt(prompt) {
    let value;
    if (prompt.startsWith('EnPra IELTS Writing 문제')) {
      const task = prompt.match(/유형: (\w+);/)[1], format = prompt.match(/세부 유형: (\w+);/)[1];
      value = invalidQuestion ? {} : { title: 'Regression fixture', prompt: 'Describe the supplied information.',
        material: task === 'task2' ? {} : { type: format, content: 'The library opens at nine and closes at six near the park.',
          questions: [{ prompt: 'When does it open?' }, { prompt: 'When does it close?' }, { prompt: 'Where is it?' }],
          categories: ['2020', '2021'], series: [{ name: 'Visitors', data: [10, 20] }], rows: [{ label: '2020', value: 10 }, { label: '2021', value: 20 }],
          steps: [{ label: 'Entry', description: 'Enter.' }, { label: 'Exit', description: 'Leave.' }],
          mapPanels: [{ label: 'Before', features: [{ type: 'building', label: 'Library', x: 20, y: 20 }] }] },
        solutionContext: { expectedAnswers: ['It opens at nine.', 'It closes at six.', 'It is near the park.'] }, skills: [] };
    } else if (prompt.startsWith('EnPra Writing 학습 문제용 힌트')) {
      value = { hints: invalidHints ? [] : ['structure', 'grammar', 'vocabulary', 'sample'].map(type => ({ type, content: `${type} fixture hint`, skillCode: 'grammar_sentence_structure' })) };
    } else if (prompt.startsWith('EnPra IELTS Writing 답안')) {
      gradePrompt = prompt;
      value = invalidGrade ? {} : { errorCount, criteria: { taskAchievementOrResponse: 90, coherenceCohesion: 90, lexicalResource: 90, grammaticalRangeAccuracy: 90 },
        feedback: { correctedAnswer: 'The library opens at nine.', improvedAnswer: 'The library opens at nine and closes at six.', errors:[], synonymGroups:[{term:'opens',alternatives:['starts service'],note:'문맥에 맞는 대체 표현'}],usefulExpressions:[{expression:'closes at',meaning:'…시에 닫다',example:'The library closes at six.'}],keyLearningPoints:['주어와 동사를 확인해요.'],nextFocus:'문법' }, skills: [] };
    } else if (prompt.startsWith('EnPra Writing 오답노트')) {
      value = { correctedAnswer: 'The library opens at nine.', errors: [], improvedAnswer: [{ label: 'Answer', text: 'The library opens at nine.' }], keyLearningPoints: ['Verb agreement'], nextFocus: 'Grammar' };
    } else throw new Error('Unexpected fixture prompt category');
    return { text: JSON.stringify(value) };
  },
}; } });

const sections = ['It opens at nine.', 'It closes at six.', 'It is near the park.'].map((text, i) => ({ label: `Question ${i + 1}`, text }));
async function request(path, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await app.request(`http://fixture/api/writing${path}`, { method, ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
}
function check(name, condition) { currentCheck = name; coverage.checks++; assert(condition); }
async function expected(name, response, status = 200) { check(name, response.status === status); return response.body; }
async function newUser(rule) {
  user = { id: `${prefix}${++userCounter}`, displayName: 'Regression fixture' };
  await db.query('INSERT INTO users(id,display_name) VALUES($1,$2)', [user.id, user.displayName]);
  await db.query("INSERT INTO user_writing_profiles(user_id,onboarding_status,current_public_level,current_level_group,current_internal_stage,metrics_refreshed_for_date,metrics_refreshed_at) VALUES($1,'active',$2,$3,$4,CURRENT_DATE,NOW())", [user.id, rule.public_level, rule.level_group, rule.internal_stage]);
}
async function isolated(name, run) {
  const point = `case_${++savepointCounter}`, depth = stack.length;
  await db.query(`SAVEPOINT ${point}`);
  try { await run(); } catch (error) { failures.push({ case: name, failedCheck: currentCheck, code: error.code ?? 'ASSERTION_FAILED' }); }
  finally { await db.query(`ROLLBACK TO SAVEPOINT ${point}`); await db.query(`RELEASE SAVEPOINT ${point}`); stack.splice(depth); invalidQuestion = invalidHints = invalidGrade = false; bankQuestionId = null; errorCount = 0; }
}
async function start(type, options = {}) { return safeId((await expected(`start-${type}`, await request('/sessions', { sessionType: type, ...options }))).sessionId); }
async function read(session) {
  const payload = (await expected('session-read', await request(`/sessions/${safeId(session)}`))).session;
  if (payload.currentItem) {
    const stored = (await db.query('SELECT question_id FROM writing_session_items WHERE id=$1 AND session_id=$2', [safeId(payload.currentItem.id), safeId(session)])).rows[0];
    check('current session item exists', Boolean(stored));
    check('question id matches stored foreign key', safeId(payload.currentItem.question.id) === safeId(stored.question_id));
  }
  return payload;
}
async function submit(session, item, options = {}) {
  const submitted = await expected('submit', await request(`/sessions/${safeId(session)}/items/${safeId(item.id)}/submit`, {
    answer: 'Compatibility Question and Answer labels.', answerSections: item.taskType === 'foundation' ? sections : [], ...options,
  }));
  if (submitted.session.type === 'learning' || submitted.session.status === 'completed')
    check('released submission result present', typeof submitted.result?.effectiveScore === 'number' && typeof submitted.result?.feedback?.correctedAnswer === 'string');
  else
    check('unfinished test submission result withheld', submitted.result === null);
  return submitted;
}
async function finish(session, validate) {
  let payload = await read(session);
  while (!payload.completed) { if (validate) await validate(payload); payload = (await submit(session, payload.currentItem)).session; }
  return payload;
}
let rolledBack = false;
await db.query('BEGIN');
try {
  await db.query("SET LOCAL statement_timeout='20s'");
  await db.query("SET LOCAL lock_timeout='5s'");
  await db.query(`CREATE SCHEMA ${schema}`);
  await db.query(`SET LOCAL search_path TO ${schema}`);
  await db.query('CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT)');
  await initializeWritingDatabase(pool);
  const rows = await db.query("SELECT DISTINCT ON (internal_stage) public_level,level_group,internal_stage,config FROM writing_level_rules WHERE is_active=TRUE AND rule_version='v3' ORDER BY internal_stage,id DESC");
  check('13 stages', rows.rows.length === 13);
  for (const rule of rows.rows) {
    const stage = rule.internal_stage; coverage.stages.push(stage);
    for (const task of stage === 'foundation' ? ['foundation'] : ['task1', 'task2']) await isolated(`${stage}-${task}`, async () => {
      await newUser(rule); coverage.learningCases++;
      const session = await start('learning', { taskType: task }), payload = await read(session), item = payload.currentItem;
      check('learning targets', Number(item.targetWordCount ?? 0) === Number(rule.config.targetWordCounts?.[task] ?? 0));
      check('four hints', payload.hints.length === 4);
      check('unrevealed content withheld', payload.hints.every(hint=>hint.revealed===false && hint.content===undefined));
      const firstHint = safeId(payload.hints[0].id);
      await expected('hint', await request(`/sessions/${session}/items/${item.id}/hints/${firstHint}`, {}));
      await expected('repeat hint', await request(`/sessions/${session}/items/${item.id}/hints/${firstHint}`, {}));
      check('one hint event', (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_hint_usage_events WHERE session_item_id=$1', [item.id])).rows[0].n === 1);
      const completed = await submit(session, item);
      await submit(session, item);
      check('one saved attempt on retry', (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_attempt_results WHERE session_item_id=$1',[item.id])).rows[0].n===1);
      check('v3 controls present', gradePrompt.includes(rule.config.qualityControls));
      check('completed results', completed.session.results.length === 1 && completed.session.averageScore === 85);
      await expected('late hint denied', await request(`/sessions/${session}/items/${item.id}/hints/${firstHint}`, {}), 404);
      await expected('duplicate submit denied', await request(`/sessions/${session}/items/${item.id}/submit`, { answer: 'Duplicate' }), 409);
      const saved = (await db.query('SELECT rule_version,answer_word_count,answer_character_count FROM writing_attempt_results WHERE session_item_id=$1', [item.id])).rows[0];
      check('stored v3', saved.rule_version === 'v3');
      if (task === 'foundation') {
        const clean = sections.map(v => v.text).join('\n\n');
        check('Foundation text counts', saved.answer_word_count === clean.split(/\s+/).length && saved.answer_character_count === [...clean].length);
      }
    });
    await isolated(`${stage}-test`, async () => {
      await newUser(rule); coverage.testCases++;
      const session = await start('test'); const initial = await read(session);
      check('test results hidden before completion', initial.results.length === 0);
      const completed = await finish(session, payload => check('test no hints', payload.hints.length === 0));
      check('test result count', completed.results.length === (stage === 'foundation' ? 1 : 2));
    });
    if (rule.public_level !== '7.0') await isolated(`${stage}-promotion`, async () => {
      await newUser(rule); coverage.promotionCases++;
      const session = await start('promotion_test', { targetPublicLevel: '7.0', force: true });
      const complete = await finish(session, payload => check('promotion target words', payload.currentItem.targetWordCount === (payload.currentItem.taskType === 'task1' ? 150 : 250)));
      check('promotion target grading', gradePrompt.includes('현재 내부 단계: 7.0A') && gradePrompt.includes(rows.rows.find(r => r.internal_stage === '7.0A').config.qualityControls));
      check('promotion ready', complete.promotionRecommendation === 'ready');
      check('promotion excluded from source-stage progress', (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_attempt_results r JOIN writing_session_items i ON i.id=r.session_item_id WHERE i.session_id=$1 AND r.affects_progress=TRUE', [session])).rows[0].n === 0);
      await expected('promotion apply', await request(`/sessions/${session}/apply-promotion`, {}));
      await expected('promotion replay denied', await request(`/sessions/${session}/apply-promotion`, {}), 409);
      await expected('manual demotion', await request('/level-change', { targetPublicLevel: rule.public_level, targetLevelGroup: rule.level_group }));
      await expected('old promotion after demotion denied', await request(`/sessions/${session}/apply-promotion`, {}), 409);
      check('only one promotion history', (await db.query("SELECT COUNT(*)::INTEGER n FROM writing_level_change_history WHERE user_id=$1 AND change_type='promotion'", [user.id])).rows[0].n === 1);
    });
  }
  const foundation = rows.rows.find(r => r.internal_stage === 'foundation'), ordinary = rows.rows.find(r => r.internal_stage === '5.0C');
  await isolated('stage-episode-evidence-and-reentry', async () => {
    await newUser(rows.rows.find(r => r.internal_stage === '5.0A'));
    const now = (await db.query('SELECT NOW() AS clock')).rows[0].clock.getTime();
    const at = offset => new Date(now + offset);
    const day = 86_400_000;
    await db.query('UPDATE user_writing_profiles SET current_stage_started_at=$2 WHERE user_id=$1', [user.id, at(-3 * day)]);
    const questionId = (await db.query("INSERT INTO writing_questions(task_type,exercise_type,question_format,difficulty,title,prompt) VALUES('task2','task2','opinion','standard','Stage episode fixture','State your view.') RETURNING id")).rows[0].id;
    async function evidence(stage, score, started, evaluated, count) {
      for (let index = 0; index < count; index++) {
        const sessionId = (await db.query("INSERT INTO writing_sessions(user_id,session_type,status,public_level_snapshot,internal_stage_snapshot,expected_item_count,rule_version,started_at,completed_at) VALUES($1,'learning','completed','5.0',$2,1,'v3',$3,$4) RETURNING id", [user.id, stage, started, evaluated])).rows[0].id;
        const itemId = (await db.query("INSERT INTO writing_session_items(session_id,question_id,item_order,task_type,exercise_type,item_purpose,status) VALUES($1,$2,1,'task2','task2','main_learning','evaluated') RETURNING id", [sessionId, questionId])).rows[0].id;
        const attemptId = (await db.query("INSERT INTO writing_attempt_results(session_item_id,answer_text,answer_word_count,answer_character_count,evaluation_status,evaluated_at,raw_score,effective_score,error_count,affects_progress) VALUES($1,'Old or new evidence.',4,20,'completed',$2,$3,$3,1,TRUE) RETURNING id", [itemId, evaluated, score])).rows[0].id;
        await db.query("INSERT INTO writing_attempt_skill_results(attempt_result_id,skill_code,quality_score,effective_score,weight_applied) VALUES($1,'grammar_sentence_structure',$2,$2,1)", [attemptId, score]);
      }
    }
    async function refresh() {
      await db.query('UPDATE user_writing_profiles SET metrics_refreshed_for_date=NULL WHERE user_id=$1', [user.id]);
      return (await expected('progress overview', await request('/overview'))).profile.currentInternalStage;
    }
    async function skillEvidence() {
      return (await db.query('SELECT recent_evidence_count,recent_effective_score_avg FROM user_writing_skill_states WHERE user_id=$1', [user.id])).rows;
    }
    await evidence('5.0A', 95, at(-2 * day), at(-2 * day + 1000), 6);
    check('A current episode legitimately advances to B', await refresh() === '5.0B');
    await db.query('UPDATE user_writing_profiles SET current_stage_started_at=$2 WHERE user_id=$1', [user.id, at(-day)]);
    await evidence('5.0B', 40, at(-day / 2), at(-day / 2 + 1000), 6);
    check('B current episode legitimately demotes to A', await refresh() === '5.0A');
    check('daily refresh does not reuse the previous A episode', await refresh() === '5.0A');
    check('previous A skills are not restored after demotion', (await skillEvidence()).length === 0);
    await evidence('5.0A', 95, at(-2 * day), at(1000), 6);
    check('late submissions from an old A session cannot advance the new episode', await refresh() === '5.0A');
    check('late old-session skills are excluded too', (await skillEvidence()).length === 0);
    await evidence('5.0A', 95, at(1000), at(2000), 5);
    check('five new A answers do not borrow old answers to reach six', await refresh() === '5.0A');
    const states = await skillEvidence();
    check('only new-episode skill evidence is counted', states.length === 1 && states[0].recent_evidence_count === 5 && Number(states[0].recent_effective_score_avg) === 95);
    await evidence('5.0A', 95, at(1000), at(2000), 1);
    check('six genuinely new A answers can advance again', await refresh() === '5.0B');
    check('old B failures do not cause an immediate re-demotion', await refresh() === '5.0B');
    await evidence('5.0B', 90, at(1000), at(2000), 6);
    check('new B evidence can legitimately advance to C', await refresh() === '5.0C');
    check('notebook history survives all episode changes', (await expected('episode notebook', await request('/notebook'))).entries.length === 30);
    check('all old and new attempts remain stored', (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_attempt_results r JOIN writing_session_items i ON i.id=r.session_item_id JOIN writing_sessions s ON s.id=i.session_id WHERE s.user_id=$1', [user.id])).rows[0].n === 30);
  });
  await isolated('stale-generating-recovery',async()=>{
    await newUser(ordinary);
    const pending=await db.query("INSERT INTO writing_sessions(user_id,session_type,status,expected_item_count,rule_version,updated_at) VALUES($1,'learning','generating',1,'v3',NOW()-INTERVAL '21 minutes') RETURNING id",[user.id]);
    const abandoned=await read(pending.rows[0].id);
    check('zero items not completed',abandoned.completed===false);
    await start('learning',{taskType:'task1'});
    check('stale reservation abandoned',(await db.query('SELECT status FROM writing_sessions WHERE id=$1',[pending.rows[0].id])).rows[0].status==='abandoned');
  });
  await isolated('stale-submission-recovery',async()=>{
    await newUser(foundation);
    const session=await start('learning'), payload=await read(session),item=payload.currentItem;
    await db.query("UPDATE writing_session_items SET status='submitted',submission_token=$2,submission_started_at=NOW()-INTERVAL '6 minutes' WHERE id=$1",[item.id,randomUUID()]);
    check('expired claim retryable',(await read(session)).currentItem.status==='in_progress');
    await submit(session,item);
    check('recovered submission saved',(await read(session)).completed);
  });
  await isolated('blank-foundation', async () => {
    await newUser(foundation); const session = await start('learning'); const payload = await read(session);
    await expected('blank Foundation rejected', await request(`/sessions/${session}/items/${payload.currentItem.id}/submit`, { answer: 'Question 1: a question\nAnswer 1:', answerSections: sections.map(v => ({ ...v, text: ' ' })) }), 400);
  });
  await isolated('legacy-foundation', async () => {
    await newUser(foundation); const session = await start('learning'); const payload = await read(session), item = payload.currentItem;
    const answer = item.question.material.questions.map((question, i) => `Question ${i + 1}: ${question.prompt}\nAnswer ${i + 1}: ${sections[i].text}`).join('\n\n');
    await submit(session, item, { answer, answerSections: [] });
    const saved = (await db.query('SELECT answer_word_count,answer_character_count FROM writing_attempt_results WHERE session_item_id=$1', [item.id])).rows[0];
    const clean = sections.map(v => v.text).join('\n\n');
    check('legacy Foundation real counts', saved.answer_word_count === clean.split(/\s+/).length && saved.answer_character_count === [...clean].length);
  });
  await isolated('invalid-cached-foundation', async () => {
    await newUser(foundation);
    const seeded = await db.query("INSERT INTO writing_questions(task_type,exercise_type,question_format,difficulty,purpose,title,prompt,material_json,solution_context,status) VALUES('foundation','foundation_three_prompts','short_notice','standard','main_learning','Synthetic invalid bank','Synthetic question',$1,'{}','active') RETURNING id", [JSON.stringify({ content: 'Material', questions: [{ prompt: 'Only one?' }] })]);
    bankQuestionId = safeId(seeded.rows[0].id);
    const session = await start('learning');
    check('invalid cached question replaced', (await db.query('SELECT question_id FROM writing_session_items WHERE session_id=$1', [session])).rows[0].question_id !== String(bankQuestionId));
    check('invalid bank row retained', (await db.query('SELECT material_json FROM writing_questions WHERE id=$1', [bankQuestionId])).rows[0].material_json.questions.length === 1);
  });
  for (const type of ['test', 'promotion_test']) await isolated(`${type}-notebook-release`, async () => {
    await newUser(ordinary); errorCount = 1;
    const session = await start(type, type === 'promotion_test' ? { targetPublicLevel: '7.0', force: true } : {});
    const p = await read(session); await submit(session, p.currentItem);
    check('unfinished test notes hidden', (await expected('notebook', await request('/notebook'))).entries.length === 0);
    check('unfinished test review skipped', (await expected('notebook-review', await request('/notebook/review', {}))).reviewedCount === 0);
    await finish(session);
    const entries = (await expected('completed-notebook', await request('/notebook'))).entries;
    check('completed test notes visible', entries.length === (type === 'test' ? 2 : 3));
    const review = await expected('completed-review', await request('/notebook/review', {}));
    check('completed test notes reviewed', review.reviewedCount === entries.length && review.failedCount === 0);
  });
  for (const kind of ['question', 'hint', 'grade']) await isolated(`invalid-${kind}`, async () => {
    await newUser(ordinary);
    if (kind === 'grade') {
      const session = await start('learning', { taskType: 'task1' }), p = await read(session); invalidGrade = true;
      await expected('invalid grade rejected', await request(`/sessions/${session}/items/${p.currentItem.id}/submit`, { answer: 'Answer' }), 500);
      check('invalid grade not stored', (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_attempt_results WHERE session_item_id=$1', [p.currentItem.id])).rows[0].n === 0);
    } else {
      invalidQuestion = kind === 'question'; invalidHints = kind === 'hint';
      await expected('invalid generation rejected', await request('/sessions', { sessionType: 'learning', taskType: 'task1' }), 500);
      check('no active invalid generation', (await db.query("SELECT COUNT(*)::INTEGER n FROM writing_sessions WHERE user_id=$1 AND status IN ('generating','in_progress')", [user.id])).rows[0].n === 0);
    }
  });
  await isolated('old-version', async () => {
    await newUser(ordinary); const session = await start('learning', { taskType: 'task1' }); const payload = await read(session);
    const version = `fixture-${randomUUID()}`;
    await db.query('INSERT INTO writing_level_rules(public_level,internal_stage,rule_version,config,is_active) VALUES($1,$2,$3,$4,FALSE)', [ordinary.public_level, ordinary.internal_stage, version, JSON.stringify({ ...ordinary.config, qualityControls: 'Historical fixture controls' })]);
    await db.query('UPDATE writing_sessions SET rule_version=$2 WHERE id=$1', [session, version]);
    await submit(session, payload.currentItem);
    check('historical rubric', gradePrompt.includes('Historical fixture controls'));
    check('historical result version', (await db.query('SELECT rule_version FROM writing_attempt_results WHERE session_item_id=$1', [payload.currentItem.id])).rows[0].rule_version === version);
  });
} finally {
  await db.query('ROLLBACK');
  rolledBack = (await db.query('SELECT to_regnamespace($1) IS NULL AS absent', [schema])).rows[0].absent;
  await db.end();
}
console.log(JSON.stringify({ mode: 'candidate-writing-real-db-fixture-no-live-ai', ...coverage, failures, rollbackVerified: rolledBack }));
if (failures.length || !rolledBack) process.exitCode = 1;
