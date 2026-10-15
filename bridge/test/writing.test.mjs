import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Hono } from 'hono';
import {
  initializeWritingDatabase,
  registerWritingRoutes,
  writingQuestionPrompt,
} from '../dist/writing.js';

const result = (rows = []) => ({ rows, rowCount: rows.length });
const rules = new Map();
await initializeWritingDatabase({
  async query(sql, values) {
    if (sql.startsWith('UPDATE writing_level_rules'))
      rules.set(values[2], {
        publicLevel: values[0],
        group: values[1],
        config: JSON.parse(values[4]),
      });
    return result();
  },
});
assert.equal(rules.size, 13);
const foundationSections = [
  { label: 'Question 1', text: 'It opens at nine.' },
  { label: 'Question 2', text: 'It closes at six.' },
  { label: 'Question 3', text: 'It is near the park.' },
];
const evaluation = () => ({
  errorCount: 0,
  criteria: {
    taskAchievementOrResponse: 90,
    coherenceCohesion: 90,
    lexicalResource: 90,
    grammaticalRangeAccuracy: 90,
  },
  feedback: {
    correctedAnswer: 'A corrected answer.',
    improvedAnswer: 'An improved answer.',
  },
  skills: [],
});

function appFor(
  pool,
  generate,
  readAccount = async () => ({ type: 'chatgpt' }),
) {
  pool.connect ??= async () => ({ query: pool.query.bind(pool), release() {} });
  const prompts = [];
  const outputSchemas = [];
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('user', { id: 'fixture-user', displayName: 'Fixture' });
    await next();
  });
  app.onError((error, c) =>
    error.getResponse ? error.getResponse() : c.json({ error: error.message, code: error.code }, 500),
  );
  registerWritingRoutes(app, pool, {
    get() {
      return {
        readAccount,
        async runLearningPrompt(prompt, outputSchema) {
          prompts.push(prompt);
          outputSchemas.push(outputSchema);
          return { text: JSON.stringify(await generate(prompt)) };
        },
      };
    },
  });
  return {
    prompts,
    outputSchemas,
    async post(path, body = {}) {
      const response = await app.request(`http://fixture/api/writing${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    },
    async get(path) {
      const response = await app.request(`http://fixture/api/writing${path}`);
      return { status: response.status, body: await response.json() };
    },
  };
}

test('Writing grading opts into a closed JSON output schema without changing the stored rubric', async () => {
  const pool = gradingPool('6.0A', 'task1');
  const app = appFor(pool, evaluation);
  assert.equal(
    (
      await app.post('/sessions/10/items/20/submit', {
        answer: 'Original answer.',
      })
    ).status,
    200,
  );
  const schema = app.outputSchemas[0];
  assert.equal(schema?.type, 'object');
  const visit = (node) => {
    if (node.type === 'object') {
      assert.equal(node.additionalProperties, false);
      assert.deepEqual(
        node.required.slice().sort(),
        Object.keys(node.properties).sort(),
      );
      Object.values(node.properties).forEach(visit);
    } else if (node.type === 'array') visit(node.items);
  };
  visit(schema);
  assert.deepEqual(schema.properties.resultLabel.enum, [
    'pass',
    'partial',
    'needs_practice',
  ]);
  assert.equal(schema.properties.errorCount.type, 'integer');
  assert.equal(schema.properties.errorCount.maximum, 32767);
  assert.equal(
    schema.properties.feedback.properties.improvedAnswer.type,
    'string',
  );
  assert.equal(
    schema.properties.feedback.properties.improvedAnswer.minLength,
    1,
  );
  assert.equal(
    schema.properties.feedback.properties.synonymGroups.items.type,
    'object',
  );
  assert.equal(
    schema.properties.feedback.properties.usefulExpressions.items.type,
    'object',
  );
  assert.equal(
    schema.properties.feedback.properties.keyLearningPoints.minItems,
    1,
  );
  assert.equal(
    schema.properties.feedback.properties.keyLearningPoints.maxItems,
    3,
  );
  for (const key of [
    'taskAchievementOrResponse',
    'coherenceCohesion',
    'lexicalResource',
    'grammaticalRangeAccuracy',
  ]) {
    assert.deepEqual(schema.properties.criteria.properties[key], {
      type: 'number',
      minimum: 0,
      maximum: 100,
    });
  }
  assert.equal(pool.state.writes[0][13], 'v3');
});

function gradingPool(stage, task, options = {}) {
  const rule = rules.get(stage);
  const item = {
    id: 20,
    question_id: 30,
    item_order: 1,
    task_type: task,
    exercise_type: task,
    status: 'in_progress',
    prompt: 'Question text',
    material_json: {},
    solution_context: {},
    session_type:
      options.type ?? (options.promotion ? 'promotion_test' : 'learning'),
    internal_stage_snapshot: stage,
    public_level_snapshot: rule.publicLevel,
    rule_version: options.version ?? 'v3',
    target_public_level: options.promotion ?? null,
    target_level_group: null,
    target_word_count: rule.config.targetWordCounts?.[task] ?? null,
  };
  const session = {
    id: 10,
    session_type: item.session_type,
    status: 'in_progress',
    expected_item_count: options.hasNextItem ? 2 : 1,
    internal_stage_snapshot: stage,
    public_level_snapshot: rule.publicLevel,
    promotion_score: null,
  };
  const nextItem = options.hasNextItem
    ? { ...item, id: 21, question_id: 31, item_order: 2 }
    : null;
  const state = {
    item,
    session,
    nextItem,
    writes: [],
    descriptors: [],
    placementWrites: [],
  };
  return {
    state,
    async query(sql, values) {
      if (sql.startsWith('SELECT r.answer_text,r.answer_sections_json')) {
        const saved=state.writes[0];
        return result(saved && session.status!=='abandoned'?[{answer_text:saved[1],answer_sections_json:JSON.parse(saved[2]).map(s=>({text:s.text,label:s.label})),effective_score:saved[7],result_label:saved[8],feedback_json:JSON.parse(saved[10]),task_type:task,material_json:item.material_json}]:[]);
      }
      if (sql.startsWith('UPDATE writing_session_items i SET status=\'submitted\'')) {
        if (item.status!=='in_progress' && item.status!=='pending') return result();
        item.status='submitted'; item.submission_token=values[3];
        return result([{id:item.id}]);
      }
      if (sql.startsWith('UPDATE writing_session_items i SET status=\'in_progress\'')) {
        if (item.status==='submitted' && item.submission_token===values[3]) item.status='in_progress';
        return result();
      }
      if (sql.startsWith('SELECT status,submission_token FROM writing_session_items')) return result([{status:item.status,submission_token:item.submission_token}]);
      if (sql.startsWith('SELECT pg_advisory_xact_lock')) return result();
      if (sql.startsWith('UPDATE user_writing_profiles SET metrics_refreshed_for_date')) return result();
      if (sql.startsWith('SELECT i.*,q.prompt')) {
        assert.match(sql, /s\.rule_version/);
        assert.match(sql, /s\.target_public_level/);
        assert.equal(
          values[2],
          item.id,
          'submission must use the session-item id, not the question id',
        );
        return result(item.status==='evaluated'?[]:[item]);
      }
      if (sql.startsWith('SELECT config FROM writing_level_rules')) {
        assert.equal(values[1], item.rule_version);
        return result([
          { config: options.config ?? rules.get(values[0]).config },
        ]);
      }
      if (/^SELECT (h\.skill_code|penalty_score|qs\.skill_code)/.test(sql))
        return result();
      if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) return result();
      if (sql.startsWith('INSERT INTO writing_attempt_results(')) {
        state.writes.push(values);
        return result([{ id: 40 }]);
      }
      if (sql.startsWith('INSERT INTO writing_attempt_criterion_results')) {
        state.descriptors.push(values[3]);
        return result();
      }
      if (sql.startsWith('UPDATE writing_session_items')) {
        item.status = 'evaluated';
        return result();
      }
      if (sql.startsWith('SELECT COUNT(*)'))
        return result([{ count: nextItem ? 1 : 0 }]);
      if (sql.startsWith('SELECT AVG(effective_score)'))
        return result([{ score: 90 }]);
      if (sql.startsWith('UPDATE writing_sessions')) {
        if (sql.includes("status='abandoned'")) { session.status='abandoned'; return result([{id:10}]); }
        session.status = 'completed';
        session.promotion_score = values[1];
        return result();
      }
      if (
        sql.startsWith(
          'SELECT target_public_level, promotion_score FROM writing_sessions',
        )
      )
        return result(
          session.status === 'completed'
            ? [
                {
                  target_public_level: rule.publicLevel,
                  promotion_score: session.promotion_score,
                },
              ]
            : [],
        );
      if (
        sql.startsWith('INSERT INTO user_writing_profiles') ||
        sql.startsWith('DELETE FROM user_writing_skill_states') ||
        sql.startsWith('INSERT INTO writing_level_change_history')
      ) {
        state.placementWrites.push(sql);
        return result();
      }
      if (sql.startsWith('SELECT') && sql.includes('FROM user_writing_profiles'))
        return result();
      if (sql.startsWith('SELECT * FROM writing_sessions'))
        return result([session]);
      if (sql.startsWith('SELECT i.*, q.title'))
        return result([
          {
            ...item,
            result_id: state.writes.length ? 40 : null,
            answer_text: state.writes[0]?.[1],
            feedback_json: {},
            effective_score: 90,
            result_label: 'pass',
          },
          ...(nextItem ? [nextItem] : []),
        ]);
      throw new Error(`Unexpected mock query: ${sql.slice(0, 75)}`);
    },
  };
}

test('cancelled in-flight grading cannot resurrect a session or persist an attempt', async () => {
  const pool=gradingPool('6.0A','task1');
  let entered,release;
  const ready=new Promise(resolve=>entered=resolve), gate=new Promise(resolve=>release=resolve);
  const app=appFor(pool,async()=>{entered();await gate;return evaluation();});
  const grading=app.post('/sessions/10/items/20/submit',{answer:'My answer.'});
  await ready;
  assert.equal((await app.post('/sessions/10/abandon')).status,200);
  release();
  assert.equal((await grading).status,409);
  assert.equal(pool.state.session.status,'abandoned');
  assert.equal(pool.state.writes.length,0);
});

test('simultaneous submissions claim the item once and do not run duplicate AI', async () => {
  const pool=gradingPool('6.0A','task1');
  let entered,release;
  const ready=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
  const app=appFor(pool,async()=>{entered();await gate;return evaluation();});
  const first=app.post('/sessions/10/items/20/submit',{answer:'My answer.'});
  await ready;
  assert.equal((await app.post('/sessions/10/items/20/submit',{answer:'My answer.'})).status,409);
  assert.equal(app.prompts.length,1);
  release();assert.equal((await first).status,200);assert.equal(pool.state.writes.length,1);
});

test('saved submission can be replayed after cache refresh failure without regrading', async () => {
  const pool=gradingPool('6.0A','task1'), query=pool.query.bind(pool);
  let fail=true;
  pool.query=(sql,values)=>{if(fail && sql.includes('FROM user_writing_profiles')){fail=false;throw new Error('Transient simulated cache failure');}return query(sql,values);};
  const app=appFor(pool,structuredGrade);
  assert.equal((await app.post('/sessions/10/items/20/submit',{answer:'My answer.'})).status,200);
  const replay=await app.post('/sessions/10/items/20/submit',{answer:'My answer.'});
  assert.equal(replay.status,200);assert.equal(replay.body.replayed,true);assert.equal(app.prompts.length,1);assert.equal(pool.state.writes.length,1);
  assert.equal((await app.post('/sessions/10/items/20/submit',{answer:'Different answer.'})).status,409);
});

test('Foundation submission replay compares its three saved answer sections, not a reconstructed wrapper',async()=>{
  const pool=gradingPool('foundation','foundation');
  const app=appFor(pool,evaluation);
  const body={answer:'Compatibility Question and Answer labels.',answerSections:foundationSections};
  assert.equal((await app.post('/sessions/10/items/20/submit',body)).status,200);
  const repeated=await app.post('/sessions/10/items/20/submit',body);
  assert.equal(repeated.status,200);assert.equal(repeated.body.replayed,true);
  assert.equal(app.prompts.length,1);
  assert.equal((await app.post('/sessions/10/items/20/submit',{...body,answerSections:foundationSections.map((s,i)=>i? s : {...s,text:'Different answer.'})})).status,409);
});

for(const body of [null,[],1,'text']) test(`Writing rejects malformed body ${JSON.stringify(body)} with 400`,async()=>{
  const app=appFor({query:async()=>{throw new Error('No database access expected');}},evaluation);
  assert.equal((await app.post('/sessions',body)).status,400);assert.equal(app.prompts.length,0);
});

test('generating reservation is not completed before any items exist',async()=>{
  const app=appFor({query:async sql=>sql.startsWith('SELECT * FROM writing_sessions')?result([{id:10,session_type:'learning',status:'generating',expected_item_count:1}]):result()},evaluation);
  const response=await app.get('/sessions/10');
  assert.equal(response.body.session.completed,false);assert.equal(response.body.session.currentItem,null);assert.equal(response.body.session.status,'generating');
});

test('session GET redacts unrevealed hint content and retains used hint content',async()=>{
  let used=false;
  const app=appFor({query:async sql=>{
    if(sql.startsWith('SELECT * FROM writing_sessions'))return result([{id:10,session_type:'learning',status:'in_progress',expected_item_count:1}]);
    if(sql.startsWith('SELECT i.*, q.title'))return result([{id:20,question_id:30,status:'in_progress',hint_set_id:50}]);
    if(sql.startsWith('SELECT h.id'))return result([{id:60,hint_type:'sample',hint_order:1,content:'PRIVATE HINT'}]);
    if(sql.startsWith('SELECT hint_id'))return result(used?[{hint_id:60}]:[]);
    return result();
  }},evaluation);
  const fresh=await app.get('/sessions/10');assert.equal(fresh.body.session.hints[0].revealed,false);assert.equal('content' in fresh.body.session.hints[0],false);
  used=true;const opened=await app.get('/sessions/10');assert.equal(opened.body.session.hints[0].content,'PRIVATE HINT');
});

test('hint endpoint returns no content if no durable usage event exists',async()=>{
  const app=appFor({query:async sql=>sql.startsWith('SELECT 1 FROM writing_session_items')?result([{}]):result()},evaluation);
  const response=await app.post('/sessions/10/items/20/hints/60');assert.equal(response.status,404);assert.equal(response.body.content,undefined);
});

test('same-day metrics use the database calendar flag without another refresh',async()=>{
  let writes=0;
  const app=appFor({query:async sql=>{
    if(sql.includes('FROM user_writing_profiles'))return result([{onboarding_status:'active',current_public_level:'6.0',current_internal_stage:'6.0A',metrics_current:true,metrics_refreshed_for_date:new Date()}]);
    if(sql.startsWith('UPDATE writing_sessions'))return result();
    if(sql.startsWith('UPDATE')||sql.startsWith('DELETE')||sql.startsWith('INSERT'))writes++;
    return result();
  }},evaluation);
  assert.equal((await app.get('/overview')).status,200);assert.equal(writes,0);
});

test('question instructions are bound to current target, not cached IELTS word count',()=>{
  for(const prompt of ['Discuss both views. Write at least 250 words.','Discuss both views. You should write at least 250 words.','Discuss both views. Write a minimum of 250 words.']){
    const bound=writingQuestionPrompt(prompt,100);assert.match(bound,/Write at least 100 words\./);assert.doesNotMatch(bound,/250/);
  }
  assert.equal(writingQuestionPrompt('Answer three questions.',null),'Answer three questions.');
});

const structuredGrade = () => ({
  ...evaluation(),
  errorCount: 1,
  feedback: {
    correctedAnswer: 'A corrected answer.',
    errors: [
      {
        original: 'It increase.',
        correction: 'It increases.',
        reason: '단수 주어와 동사를 맞춰요.',
      },
    ],
    synonymGroups: [
      { term: 'increase', alternatives: ['rise'], note: '증가를 표현해요.' },
    ],
    usefulExpressions: [
      {
        expression: 'stood at',
        meaning: '수치가 …였다',
        example: 'The figure stood at 40%.',
      },
    ],
    improvedAnswer: 'Overview paragraph.\n\nDetails paragraph.',
    keyLearningPoints: ['전체 특징부터 설명해요.'],
    nextFocus: '자료 비교',
  },
});
test('first grading stores structured notebook feedback with one AI call and unchanged score', async () => {
  const pool = gradingPool('5.0A', 'task1');
  const query = pool.query.bind(pool);
  pool.query = (sql, values) =>
    sql.startsWith('SELECT r.id, r.answer_text')
      ? Promise.resolve(
          result([
            {
              id: 40,
              effective_score: 90,
              result_label: 'pass',
              error_count: 1,
              feedback_json: JSON.parse(pool.state.writes[0][10]),
              feedback_review_status: 'not_requested',
              title: 'Question',
              task_type: 'task1',
            },
          ]),
        )
      : query(sql, values);
  const grade = structuredGrade();
  const app = appFor(pool, () => grade);
  const submit = await app.post('/sessions/10/items/20/submit', {
    answer: 'Original answer.',
  });
  assert.equal(submit.status, 200);
  assert.deepEqual(submit.body.result.feedback, grade.feedback);
  const notebook = await app.get('/notebook');
  assert.equal(notebook.status, 200);
  const stored = notebook.body.entries[0].feedback;
  for (const key of ['synonymGroups', 'usefulExpressions', 'keyLearningPoints'])
    assert.deepEqual(stored[key], grade.feedback[key]);
  assert.equal(stored.improvedAnswer, grade.feedback.improvedAnswer);
  assert.equal(notebook.body.entries[0].score, 90);
  assert.equal(app.prompts.length, 1, 'Notebook read must not invoke AI again');
  assert(!app.prompts[0].startsWith('EnPra Writing 오답노트'));
});

test('grading merges duplicate descriptions without reducing an independent whole-answer error total', async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.errorCount = 6;
  grade.feedback.errors = [
    { original: 'teachers gives', correction: 'teachers give', reason: '주어와 동사 일치', occurrence: 1 },
    { original: 'teachers gives many tasks every day', correction: 'teachers give many tasks every day', reason: '같은 오류의 긴 설명', occurrence: 1 },
  ];
  const app = appFor(pool, () => grade);
  const response = await app.post('/sessions/10/items/20/submit', { answer: 'Some teachers gives many tasks every day.' });
  assert.equal(response.status, 200);
  assert.equal(response.body.result.feedback.errors.length, 1);
  assert.equal(pool.state.writes[0][9], 6, 'The total may include real errors omitted from explanation excerpts');
  assert.equal(pool.state.writes[0][7], 90, 'Feedback de-duplication must not rewrite scoring');
  assert.equal(JSON.parse(pool.state.writes[0][10]).errors.length, 1);
  assert.equal(app.outputSchemas[0].properties.feedback.properties.errors.items.properties.occurrence.minimum, 1);
  assert.match(app.prompts[0], /occurrence/);
});

test('grading removes a proven duplicate from a total that followed all six listed explanations', async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.errorCount = 6;
  grade.feedback.errors = [
    { original: 'teachers gives', correction: 'teachers give', reason: '일치', occurrence: 1 },
    { original: 'teachers gives tasks', correction: 'teachers give tasks', reason: '동일 오류', occurrence: 1 },
    { original: 'students learns', correction: 'students learn', reason: '일치', occurrence: 1 },
    { original: 'it help', correction: 'it helps', reason: '일치', occurrence: 1 },
    { original: 'people is', correction: 'people are', reason: '일치', occurrence: 1 },
    { original: 'we was', correction: 'we were', reason: '일치', occurrence: 1 },
  ];
  const app = appFor(pool, () => grade);
  const response = await app.post('/sessions/10/items/20/submit', { answer: 'teachers gives tasks. students learns because it help. people is busy and we was tired.' });
  assert.equal(response.status, 200);
  assert.equal(response.body.result.feedback.errors.length, 5);
  assert.equal(pool.state.writes[0][9], 5);
  assert.equal(pool.state.writes[0][7], 90);
});

test('same mistake at separate source occurrences remains separate, including offset zero', async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.errorCount = 3;
  grade.feedback.errors = [
    { original: 'teachers gives', correction: 'teachers give', reason: '첫 번째 오류', occurrence: 1 },
    { original: 'teachers gives', correction: 'teachers give', reason: '두 번째 오류', occurrence: 2 },
    { original: 'teachers gives many tasks', correction: 'teachers give many tasks', reason: '두 번째 오류 중복', occurrence: 1 },
  ];
  const app = appFor(pool, () => grade);
  const response = await app.post('/sessions/10/items/20/submit', { answer: 'teachers gives homework, and other teachers gives many tasks.' });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.result.feedback.errors.map(error => error.occurrence), [1, 2]);
  assert.equal(pool.state.writes[0][9], 2);
});

for (const total of [0, 1]) test(`deduplicating explanations cannot hide a remaining real error when AI counted ${total}`, async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.errorCount = total;
  grade.feedback.errors = [
    { original: 'teachers gives', correction: 'teachers give', reason: '오류', occurrence: 1 },
    { original: 'teachers gives tasks', correction: 'teachers give tasks', reason: '같은 오류', occurrence: 1 },
  ];
  const app = appFor(pool, () => grade);
  assert.equal((await app.post('/sessions/10/items/20/submit', { answer: 'teachers gives tasks.' })).status, 200);
  assert.equal(pool.state.writes[0][9], 1);
  assert.equal(JSON.parse(pool.state.writes[0][10]).errors.length, 1);
});

test('different corrections sharing a source quote are not mistaken for duplicate edits', async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.errorCount = 2;
  grade.feedback.errors = [
    { original: 'teachers gives', correction: 'teachers give', reason: '현재 시제', occurrence: 1 },
    { original: 'teachers gives', correction: 'teachers gave', reason: '과거 시제', occurrence: 1 },
  ];
  const app = appFor(pool, () => grade);
  assert.equal((await app.post('/sessions/10/items/20/submit', { answer: 'The teachers gives tasks.' })).status, 200);
  assert.equal(JSON.parse(pool.state.writes[0][10]).errors.length, 2);
  assert.equal(pool.state.writes[0][9], 2);
});

for (const repeated of [false, true]) test(`legacy error excerpts remain compatible with repeated source=${repeated}`, async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.errorCount = 2;
  grade.feedback.errors = [
    { original: 'teachers gives', correction: 'teachers give', reason: '첫 설명' },
    { original: 'teachers gives', correction: 'teachers give', reason: '둘째 설명' },
  ];
  const app = appFor(pool, () => grade);
  const response = await app.post('/sessions/10/items/20/submit', { answer: repeated ? 'teachers gives tasks and teachers gives homework.' : 'teachers gives tasks.' });
  assert.equal(response.status, 200);
  assert.equal(response.body.result.feedback.errors.length, repeated ? 2 : 1);
  assert.equal(pool.state.writes[0][9], repeated ? 2 : 1);
});

for (const occurrence of [0, -1, 1.5, 2, '1']) test(`unique source quote recovers an imperfect occurrence ${JSON.stringify(occurrence)} without losing grading`, async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.feedback.errors = [{ original: 'teachers gives', correction: 'teachers give', reason: '일치', occurrence }];
  const app = appFor(pool, () => grade);
  const response = await app.post('/sessions/10/items/20/submit', { answer: 'teachers gives tasks.' });
  assert.equal(response.status, 200);
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.result.feedback.errors[0].occurrence, 1);
  assert.equal(pool.state.writes[0][9], 1);
  assert.equal(pool.state.writes[0][7], 90);
});

for (const patch of [{ original: '' }, { correction: null }, { reason: null }]) test(`located errors require complete core correction information ${JSON.stringify(patch)}`, async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.feedback.errors = [{ original: 'teachers gives', correction: 'teachers give', reason: '일치', occurrence: 1, ...patch }];
  const app = appFor(pool, () => grade);
  const response = await app.post('/sessions/10/items/20/submit', { answer: 'teachers gives tasks.' });
  assert.equal(response.status, 500);
  assert.equal(response.body.code, 'AI_RESPONSE_INVALID');
  assert.equal(pool.state.writes.length, 0);
});

test('ambiguous repeated quotes keep separate errors when occurrence metadata cannot locate them safely', async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.errorCount = 2;
  grade.feedback.errors = [
    { original: 'teachers gives', correction: 'teachers give', reason: '첫 오류', occurrence: 0 },
    { original: 'teachers gives', correction: 'teachers give', reason: '둘째 오류', occurrence: 99 },
  ];
  const app = appFor(pool, () => grade);
  const response = await app.post('/sessions/10/items/20/submit', { answer: 'teachers gives tasks and teachers gives homework.' });
  assert.equal(response.status, 200);
  assert.equal(response.body.result.feedback.errors.length, 2);
  assert(response.body.result.feedback.errors.every(error => !('occurrence' in error)));
  assert.equal(pool.state.writes[0][9], 2);
});

for (const count of [3, 6]) test(`unverified source descriptions are omitted without reducing total ${count} except a proven duplicate`, async () => {
  const pool = gradingPool('5.0A', 'task2');
  const grade = structuredGrade();
  grade.errorCount = count;
  grade.feedback.errors = [
    { original: 'teachers gives', correction: 'teachers give', reason: '실제 오류', occurrence: 1 },
    { original: 'teachers gives tasks', correction: 'teachers give tasks', reason: '실제 중복', occurrence: 1 },
    { original: 'invented source quote', correction: 'invented corrected quote', reason: '검증 불가능', occurrence: 1 },
  ];
  const app = appFor(pool, () => grade);
  const response = await app.post('/sessions/10/items/20/submit', { answer: 'teachers gives tasks.' });
  assert.equal(response.status, 200);
  assert.equal(response.body.result.feedback.errors.length, 1);
  assert.equal(response.body.result.feedback.errors[0].original, 'teachers gives');
  assert.equal(pool.state.writes[0][9], count === 3 ? 2 : 6);
  assert.equal(pool.state.writes[0][7], 90);
});
for (const patch of [
  { keyLearningPoints: [] },
  { keyLearningPoints: [''] },
  { synonymGroups: [{ term: 'rise', alternatives: [], note: '' }] },
  { usefulExpressions: ['plain legacy string'] },
  {
    usefulExpressions: [
      { expression: 'stood at', meaning: '수치', example: '' },
    ],
  },
]) {
  test(`invalid first-pass structured feedback rejects without writes: ${JSON.stringify(patch)}`, async () => {
    const pool = gradingPool('5.0A', 'task1');
    const grade = structuredGrade();
    grade.feedback = { ...grade.feedback, ...patch };
    const response = await appFor(pool, () => grade).post(
      '/sessions/10/items/20/submit',
      { answer: 'Original answer.' },
    );
    assert.equal(response.status, 500);
    assert.equal(pool.state.writes.length, 0);
  });
}
for (const [stage, rule] of rules) {
  for (const task of stage === 'foundation'
    ? ['foundation']
    : ['task1', 'task2']) {
    test(`${stage} ${task}: stored v3 rubric reaches grading and completion results`, async () => {
      const pool = gradingPool(stage, task);
      const app = appFor(pool, evaluation);
      const response = await app.post('/sessions/10/items/20/submit', {
        answer: 'Compatibility answer with Question and Answer labels.',
        answerSections: task === 'foundation' ? foundationSections : [],
      });
      assert.equal(response.status, 200);
      assert(app.prompts[0].includes(rule.config.qualityControls));
      assert(
        app.prompts[0].includes(
          rule.config.expectation[task === 'foundation' ? 'task1' : task],
        ),
      );
      assert.equal(
        pool.state.writes[0][0],
        20,
        'stored attempt must reference the session-item id, not question id 30',
      );
      assert.equal(pool.state.writes[0][13], 'v3');
      assert.equal(response.body.session.results.length, 1);
      assert.equal(response.body.session.averageScore, 90);
      if (task === 'foundation') {
        const clean = foundationSections.map((v) => v.text).join('\n\n');
        assert.equal(pool.state.writes[0][3], clean.split(/\s+/).length);
        assert.equal(pool.state.writes[0][4], [...clean].length);
        assert(!app.prompts[0].includes('Compatibility answer with'));
        assert.equal(
          pool.state.writes[0][1],
          'Compatibility answer with Question and Answer labels.',
        );
      }
    });
  }
}

test('promotion from Foundation to 7.0 grades against target 7.0A', async () => {
  const pool = gradingPool('foundation', 'task1', { promotion: '7.0' });
  const app = appFor(pool, evaluation);
  assert.equal(
    (
      await app.post('/sessions/10/items/20/submit', {
        answer: 'A complete report.',
      })
    ).status,
    200,
  );
  assert(app.prompts[0].includes('현재 내부 단계: 7.0A'));
  assert(app.prompts[0].includes(rules.get('7.0A').config.qualityControls));
  assert(app.prompts[0].includes('목표 최소 분량: 150단어'));
  assert(pool.state.descriptors.every((v) => v.startsWith('7.0A')));
  assert.equal(
    pool.state.writes[0][11],
    false,
    'target-stage evidence must not advance the source stage',
  );
});

test('legacy Foundation Question/Answer serialization preserves compatibility and counts only real answers', async () => {
  const pool = gradingPool('foundation', 'foundation');
  const questions = ['When (exactly)?', 'Where is it?', 'Who visits?'];
  pool.state.item.material_json = {
    content: 'Library material',
    questions: questions.map((prompt) => ({ prompt })),
  };
  const answer = questions
    .map(
      (question, index) =>
        `Question ${index + 1}: ${question}\nAnswer ${index + 1}: ${foundationSections[index].text}`,
    )
    .join('\n\n');
  const app = appFor(pool, evaluation);
  assert.equal(
    (
      await app.post('/sessions/10/items/20/submit', {
        answer,
        answerSections: [],
      })
    ).status,
    200,
  );
  const clean = foundationSections.map((section) => section.text).join('\n\n');
  assert.equal(pool.state.writes[0][1], answer);
  assert.equal(pool.state.writes[0][3], clean.split(/\s+/).length);
  assert.equal(pool.state.writes[0][4], [...clean].length);
  assert.deepEqual(JSON.parse(pool.state.writes[0][2]), foundationSections);
  assert(!app.prompts[0].includes('사용자 답안: Question'));
});

for (const answers of [
  [' ', ' ', ' '],
  ['Answer.', '', 'Answer.'],
  ['Answer.', 'Answer.', 'Answer.\n\nQuestion 4: Extra\nAnswer 4: Extra'],
]) {
  test(`legacy Foundation rejects blank or extra serialized answers ${answers.join().length}`, async () => {
    const pool = gradingPool('foundation', 'foundation');
    pool.state.item.material_json = {
      content: 'Material',
      questions: ['Q1?', 'Q2?', 'Q3?'].map((prompt) => ({ prompt })),
    };
    const answer = answers
      .map(
        (text, index) =>
          `Question ${index + 1}: Q${index + 1}?\nAnswer ${index + 1}: ${text}`,
      )
      .join('\n\n');
    const app = appFor(pool, evaluation);
    assert.equal(
      (
        await app.post('/sessions/10/items/20/submit', {
          answer,
          answerSections: [],
        })
      ).status,
      400,
    );
    assert.equal(app.prompts.length, 0);
    assert.equal(pool.state.writes.length, 0);
  });
}

test('old unfinished session uses stored rubric and stores original rule version', async () => {
  const config = {
    expectation: { task1: 'Historical expectation' },
    qualityControls: 'Historical quality controls',
  };
  const pool = gradingPool('5.0A', 'task1', { version: 'v2', config });
  const app = appFor(pool, evaluation);
  assert.equal(
    (
      await app.post('/sessions/10/items/20/submit', {
        answer: 'Old session answer.',
      })
    ).status,
    200,
  );
  assert(app.prompts[0].includes('Historical expectation'));
  assert(app.prompts[0].includes('Historical quality controls'));
  assert(!app.prompts[0].includes(rules.get('5.0A').config.qualityControls));
  assert.equal(pool.state.writes[0][13], 'v2');
});

test('missing historical rubric rejects without silently applying v3 or calling AI', async () => {
  const pool = gradingPool('5.0A', 'task1', { version: 'missing-history' });
  const query = pool.query.bind(pool);
  pool.query = (sql, values) =>
    sql.startsWith('SELECT config FROM writing_level_rules')
      ? Promise.resolve(result())
      : query(sql, values);
  const app = appFor(pool, evaluation);
  assert.equal(
    (await app.post('/sessions/10/items/20/submit', { answer: 'Answer.' }))
      .status,
    500,
  );
  assert.equal(app.prompts.length, 0);
  assert.equal(pool.state.writes.length, 0);
});

for (const type of ['learning', 'test', 'placement_test', 'promotion_test']) {
  for (const task of ['foundation', 'task1', 'task2']) {
    test(`${type} ${task}: session GET keeps item and question identities distinct`, async () => {
      const pool = gradingPool(
        task === 'foundation' ? 'foundation' : '5.0C',
        task,
      );
      pool.state.item.session_type = pool.state.session.session_type = type;
      const app = appFor(pool, evaluation);
      const response = await app.get('/sessions/10');
      assert.equal(response.status, 200);
      const current = response.body.session.currentItem;
      assert.equal(current.id, 20);
      assert.equal(current.question.id, 30);
      assert.notEqual(current.id, current.question.id);
      assert.equal(app.prompts.length, 0);
      assert.equal(pool.state.writes.length, 0);
    });
  }
}

test('completed results preserve zero averages and incomplete test feedback stays hidden', async () => {
  const pool = gradingPool('5.0C', 'task1');
  const app = appFor(pool, evaluation);
  pool.state.item.status = 'evaluated';
  pool.state.writes.push(['', 'Answer.']);
  pool.state.session.session_type = 'test';
  assert.deepEqual((await app.get('/sessions/10')).body.session.results, []);
  pool.state.session.status = 'completed';
  pool.state.session.promotion_score = 0;
  const session = (await app.get('/sessions/10')).body.session;
  assert.equal(session.results.length, 1);
  assert.equal(session.averageScore, 0);
  assert.equal(session.promotionScore, 0);
});

for (const type of ['test', 'promotion_test', 'placement_test', 'learning']) {
  for (const hasNextItem of [true, false]) {
    test(`${type}: submit feedback visibility follows session status with next=${hasNextItem}`, async () => {
      const pool = gradingPool('5.0C', 'task2', {
        type,
        hasNextItem,
        promotion: type === 'promotion_test' ? '7.0' : undefined,
      });
      const grade = { ...evaluation(), errorCount: 2 };
      const app = appFor(pool, () => grade);
      const response = await app.post('/sessions/10/items/20/submit', {
        answer: 'Original fixture answer.',
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.submitted, true);
      const session = response.body.session;
      assert.equal(session.status, hasNextItem ? 'in_progress' : 'completed');
      assert.equal(session.completed, !hasNextItem);
      assert.equal(session.averageScore, hasNextItem ? null : 90);
      assert.equal(session.currentItem?.id ?? null, hasNextItem ? 21 : null);
      if (hasNextItem) assert.equal(session.currentItem.question.id, 31);
      assert.equal(
        session.results.length,
        type === 'learning' || !hasNextItem ? 1 : 0,
      );
      if (type !== 'learning' && hasNextItem)
        assert.equal(response.body.result, null);
      else
        assert.deepEqual(response.body.result, {
          effectiveScore: 90,
          label: 'pass',
          feedback: grade.feedback,
        });
      assert.equal(app.prompts.length, 1);
      assert.equal(pool.state.writes.length, 1);
      const saved = pool.state.writes[0];
      assert.equal(saved[0], 20);
      assert.equal(saved[1], 'Original fixture answer.');
      assert.equal(saved[5], 90);
      assert.equal(saved[7], 90);
      assert.equal(saved[9], 2);
      assert.equal(saved[13], 'v3');
      assert.equal(
        JSON.parse(saved[10]).correctedAnswer,
        grade.feedback.correctedAnswer,
      );
      assert.equal(
        JSON.parse(saved[10]).improvedAnswer,
        grade.feedback.improvedAnswer,
      );
      assert.equal(pool.state.descriptors.length, 4);
      assert.equal(pool.state.item.status, 'evaluated');
      assert.equal(
        pool.state.placementWrites.length,
        type === 'placement_test' && !hasNextItem ? 3 : 0,
      );
    });
  }
}

test('test: submit hides feedback when persisted status is in_progress despite no current item', async () => {
  const pool = gradingPool('5.0C', 'task2', { type: 'test' });
  const query = pool.query.bind(pool);
  pool.query = (sql, values) =>
    sql.startsWith('SELECT COUNT(*)')
      ? Promise.resolve(result([{ count: 1 }]))
      : query(sql, values);
  const response = await appFor(pool, evaluation).post(
    '/sessions/10/items/20/submit',
    { answer: 'Fixture answer.' },
  );
  assert.equal(response.status, 200);
  assert.equal(response.body.session.completed, false);
  assert.equal(response.body.session.status, 'in_progress');
  assert.equal(response.body.result, null);
  assert.deepEqual(response.body.session.results, []);
  assert.equal(response.body.session.averageScore, null);
});

for (const type of ['test', 'placement_test', 'learning']) {
  test(`${type}: Foundation one-item submit returns final feedback`, async () => {
    const pool = gradingPool('foundation', 'foundation', { type });
    const grade = evaluation();
    const response = await appFor(pool, () => grade).post(
      '/sessions/10/items/20/submit',
      {
        answer: 'Original Foundation answer.',
        answerSections: foundationSections,
      },
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.session.status, 'completed');
    assert.equal(response.body.session.currentItem, null);
    assert.equal(response.body.session.results.length, 1);
    assert.deepEqual(response.body.result, {
      effectiveScore: 90,
      label: 'pass',
      feedback: grade.feedback,
    });
    assert.equal(pool.state.writes[0][0], 20);
    assert.equal(pool.state.writes[0][1], 'Original Foundation answer.');
  });
}

for (const sections of [
  [],
  foundationSections.slice(0, 2),
  foundationSections.map((v) => ({ ...v, text: '   ' })),
]) {
  test(`Foundation rejects ${sections.length} missing/blank real answers before AI`, async () => {
    const pool = gradingPool('foundation', 'foundation');
    const app = appFor(pool, evaluation);
    assert.equal(
      (
        await app.post('/sessions/10/items/20/submit', {
          answer: 'Question 1: prompt\nAnswer 1:',
          answerSections: sections,
        })
      ).status,
      400,
    );
    assert.equal(app.prompts.length, 0);
    assert.equal(pool.state.writes.length, 0);
  });
}

for (const invalid of [
  {},
  { ...evaluation(), criteria: {} },
  {
    ...evaluation(),
    criteria: { ...evaluation().criteria, lexicalResource: 101 },
  },
  {
    ...evaluation(),
    criteria: { ...evaluation().criteria, lexicalResource: '90' },
  },
  { ...evaluation(), feedback: {} },
]) {
  test(`invalid grading shape ${JSON.stringify(invalid).length} rejects before persistence`, async () => {
    const pool = gradingPool('5.0C', 'task1');
    const app = appFor(pool, () => invalid);
    const response = await app.post('/sessions/10/items/20/submit', {
      answer: 'Answer.',
    });
    assert.equal(response.status, 500);
    assert.equal(response.body.code, 'AI_RESPONSE_INVALID');
    assert.equal(pool.state.writes.length, 0);
  });
}

function creationPool(stage = 'foundation', bankQuestion) {
  const rule = rules.get(stage),
    state = { questions: 0, hints: 0, targets: [], abandoned: false };
  return {
    state,
    async query(sql, values) {
      if (sql.startsWith('SELECT pg_advisory_xact_lock')) return result();
      if (sql.startsWith('UPDATE writing_sessions') && sql.includes("INTERVAL '20 minutes'")) return result();
      if (sql.startsWith('SELECT id, session_type')) return result();
      if (sql.startsWith('SELECT id FROM writing_sessions')) return result();
      if (sql.startsWith('SELECT') && sql.includes('FROM user_writing_profiles'))
        return result([
          {
            onboarding_status: 'active',
            current_public_level: rule.publicLevel,
            current_level_group: rule.group,
            current_internal_stage: stage,
          },
        ]);
      if (sql.startsWith('SELECT AVG(recent_effective_score_avg)'))
        return result([{ score: 0, count: 0 }]);
      if (sql.startsWith('INSERT INTO writing_sessions('))
        return result([{ id: 10 }]);
      if (sql.startsWith('SELECT q.*'))
        return result(bankQuestion ? [bankQuestion] : []);
      if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) return result();
      if (sql.startsWith('INSERT INTO writing_questions')) {
        state.questions++;
        return result([
          {
            id: 30,
            task_type: values[0],
            exercise_type: values[1],
            prompt: values[7],
            material_json: JSON.parse(values[8]),
          },
        ]);
      }
      if (sql.startsWith('SELECT id FROM writing_question_hint_sets'))
        return result();
      if (sql.startsWith('SELECT skill_code'))
        return result([{ skill_code: 'grammar_sentence_structure' }]);
      if (sql.startsWith('INSERT INTO writing_question_hint_sets')) {
        state.hints++;
        return result([{ id: 50 }]);
      }
      if (sql.startsWith('INSERT INTO writing_session_items')) {
        state.targets.push({ task: values[3], words: values[8] });
        return result();
      }
      if (sql.startsWith('UPDATE writing_sessions')) {
        state.abandoned ||= sql.includes("status='abandoned'");
        return result(sql.includes('RETURNING id')?[{id:10}]:[]);
      }
      if (
        sql.startsWith('INSERT INTO writing_question_skills') ||
        sql.startsWith('INSERT INTO writing_question_hints') ||
        sql.startsWith('DELETE FROM writing_question_hints')
      )
        return result();
      throw new Error(`Unexpected creation query: ${sql.slice(0, 75)}`);
    },
  };
}
function questionFixture(prompt) {
  const format = prompt.match(/세부 유형: (\w+);/)[1];
  return {
    title: 'Fixture question',
    prompt: 'Write about the information.',
    material: {
      type: format,
      content: 'Library hours.',
      questions: [
        { prompt: 'When?' },
        { prompt: 'Where?' },
        { prompt: 'Who?' },
      ],
      categories: ['A'],
      series: [{ name: 'Series', data: [10] }],
      rows: [{ label: 'A', value: 10 }],
      mapPanels: [{ label: 'Before', features: [{ type: 'building',label:'Library',x:20,y:20 }] }],
      steps: [{ label: 'Step', description: 'Process' }],
    },
    solutionContext: { expectedAnswers: ['Nine.', 'Park.', 'People.'] },
    skills: [],
  };
}
const hintFixture = () => ({
  hints: ['structure', 'grammar', 'vocabulary', 'sample'].map((type) => ({
    type,
    content: `${type} hint`,
  })),
});

test('invalid cached Foundation material is skipped without modifying its row', async () => {
  const pool = creationPool('foundation', {
    id: 99,
    task_type: 'foundation',
    material_json: {
      content: 'Material',
      questions: [{ prompt: 'Only one?' }],
    },
  });
  const app = appFor(pool, (prompt) =>
    prompt.includes('문제를 하나') ? questionFixture(prompt) : hintFixture(),
  );
  assert.equal(
    (await app.post('/sessions', { sessionType: 'learning' })).status,
    200,
  );
  assert.equal(pool.state.questions, 1);
});

test('valid cached Foundation material is reused without regenerating the question', async () => {
  const pool = creationPool('foundation', {
    id: 99,
    task_type: 'foundation',
    exercise_type: 'foundation_three_prompts',
    prompt: 'Question',
    material_json: {
      content: 'Material',
      questions: [{ prompt: 'One?' }, { prompt: 'Two?' }, { prompt: 'Three?' }],
    },
  });
  const app = appFor(pool, () => hintFixture());
  assert.equal(
    (await app.post('/sessions', { sessionType: 'learning' })).status,
    200,
  );
  assert.equal(pool.state.questions, 0);
});

for (const [format, random] of [
  ['pie_chart', 0.58],
  ['table', 0.75],
]) {
  test(`${format} generator rejects rows without the numeric value required by its guide`, async (t) => {
    t.mock.method(Math, 'random', () => random);
    const pool = creationPool('5.0C');
    const app = appFor(pool, (prompt) => ({
      ...questionFixture(prompt),
      material: { rows: [{ label: 'A', ignoredField: 10 }] },
    }));
    const response = await app.post('/sessions', {
      sessionType: 'learning',
      taskType: 'task1',
    });
    assert.equal(response.status, 500);
    assert.equal(pool.state.questions, 0);
  });
}

test('promotion generation uses target Task1/Task2 word targets, even from Foundation', async () => {
  const pool = creationPool();
  const app = appFor(pool, questionFixture);
  assert.equal(
    (
      await app.post('/sessions', {
        sessionType: 'promotion_test',
        targetPublicLevel: '7.0',
        force: true,
      })
    ).status,
    200,
  );
  assert.deepEqual(pool.state.targets, [
    { task: 'task1', words: 150 },
    { task: 'task1', words: 150 },
    { task: 'task2', words: 250 },
  ]);
});

for (const task of ['task1', 'task2'])
  test(`${task} empty generated material shape rejects before question write`, async () => {
    const pool = creationPool('5.0C');
    const app = appFor(pool, (prompt) => ({
      ...questionFixture(prompt),
      material: task === 'task1' ? {} : [],
    }));
    const response = await app.post('/sessions', {
      sessionType: 'learning',
      taskType: task,
    });
    assert.equal(response.status, 500);
    assert.equal(response.body.code, 'AI_RESPONSE_INVALID');
    assert.equal(pool.state.questions, 0);
  });

for (const invalid of [
  {},
  { title: 'T', prompt: 'P', material: {}, solutionContext: {} },
  {
    title: 'T',
    prompt: 'P',
    material: {
      type: 'short_notice',
      content: 'C',
      questions: [{ prompt: 'Only one' }],
    },
    solutionContext: {},
  },
]) {
  test(`invalid Foundation generation ${JSON.stringify(invalid).length} never creates question`, async () => {
    const pool = creationPool();
    const app = appFor(pool, () => invalid);
    const response = await app.post('/sessions', { sessionType: 'learning' });
    assert.equal(response.status, 500);
    assert.equal(response.body.code, 'AI_RESPONSE_INVALID');
    assert.equal(pool.state.questions, 0);
    assert(pool.state.abandoned);
  });
}
for (const hints of [
  [],
  hintFixture().hints.slice(0, 3),
  hintFixture().hints.map((v) => ({ ...v, type: 'structure' })),
  hintFixture().hints.map((v) => ({ ...v, content: ' ' })),
]) {
  test(`invalid hints ${JSON.stringify(hints).length} never create ready hint set`, async () => {
    const pool = creationPool();
    const app = appFor(pool, (prompt) =>
      prompt.includes('문제를 하나') ? questionFixture(prompt) : { hints },
    );
    const response = await app.post('/sessions', { sessionType: 'learning' });
    assert.equal(response.status, 500);
    assert.equal(response.body.code, 'AI_RESPONSE_INVALID');
    assert.equal(pool.state.hints, 0);
    assert(pool.state.abandoned);
  });
}

for (const status of ['completed', 'abandoned'])
  test(`${status} item cannot record hint usage`, async () => {
    let writes = 0;
    const app = appFor(
      {
        async query(sql) {
          if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) return result();
          if (sql.startsWith('SELECT 1 FROM writing_session_items')) {
            assert.match(sql, /s\.status='in_progress'/);
            assert.match(sql, /i\.status IN/);
            return result();
          }
          writes++;
          return result();
        },
      },
      evaluation,
    );
    assert.equal(
      (await app.post('/sessions/10/items/20/hints/50')).status,
      404,
    );
    assert.equal(writes, 0);
  });

test('promotion profile lock protects apply and replay/stale/active-session guards', async () => {
  const state = {
    profile: { current_public_level: '5.0', current_level_group: null },
    applied: false,
    active: false,
    updates: 0,
  };
  const pool = {
    async query(sql, values) {
      if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) return result();
      if (sql.includes('pg_advisory_xact_lock')) return result();
      if (sql.startsWith('SELECT') && sql.includes('FROM user_writing_profiles')) {
        assert.match(sql, /FOR UPDATE/);
        return result([state.profile]);
      }
      if (sql.startsWith('SELECT * FROM writing_sessions')) {
        assert.match(sql, /FOR UPDATE/);
        return result([
          {
            public_level_snapshot: '5.0',
            level_group_snapshot: '5.0_basic',
            target_public_level: '5.5',
            target_level_group: null,
          },
        ]);
      }
      if (sql.startsWith('SELECT 1 FROM writing_level_change_history'))
        return result(state.applied ? [{}] : []);
      if (sql.startsWith('SELECT id FROM writing_sessions'))
        return result(state.active ? [{ id: 99 }] : []);
      if (sql.startsWith('UPDATE user_writing_profiles')) {
        state.updates++;
        state.profile.current_public_level = values[1];
        return result();
      }
      if (sql.startsWith('INSERT INTO writing_level_change_history')) {
        state.applied = true;
        return result();
      }
      if (sql.startsWith('DELETE FROM user_writing_skill_states'))
        return result();
      throw new Error('Unexpected promotion query');
    },
  };
  const app = appFor(pool, evaluation);
  assert.equal((await app.post('/sessions/10/apply-promotion')).status, 200);
  assert.equal((await app.post('/sessions/10/apply-promotion')).status, 409);
  state.profile.current_public_level = '5.0';
  assert.equal((await app.post('/sessions/10/apply-promotion')).status, 409);
  state.applied = false;
  state.profile.current_public_level = '6.5';
  assert.equal((await app.post('/sessions/10/apply-promotion')).status, 409);
  state.profile.current_public_level = '5.0';
  state.active = true;
  assert.equal((await app.post('/sessions/10/apply-promotion')).status, 409);
  assert.equal(state.updates, 1);
});

test('promotion during account wait rejects stale session reservation before generation', async () => {
  const pool = creationPool('5.0C');
  const profile = {
    onboarding_status: 'active',
    current_public_level: '5.0',
    current_level_group: null,
    current_internal_stage: '5.0C',
  };
  const baseQuery = pool.query.bind(pool);
  pool.query = async (sql, values) => {
      if (sql.startsWith('SELECT') && sql.includes('FROM user_writing_profiles'))
      return result([{ ...profile }]);
    if (sql.startsWith('SELECT * FROM writing_sessions'))
      return result([
        {
          public_level_snapshot: '5.0',
          target_public_level: '5.5',
          target_level_group: null,
        },
      ]);
    if (sql.startsWith('SELECT 1 FROM writing_level_change_history'))
      return result();
    if (sql.startsWith('UPDATE user_writing_profiles')) {
      profile.current_public_level = values[1];
      profile.current_level_group = values[2];
      profile.current_internal_stage = values[3];
      return result();
    }
    if (
      sql.startsWith('DELETE FROM user_writing_skill_states') ||
      sql.startsWith('INSERT INTO writing_level_change_history')
    )
      return result();
    return baseQuery(sql, values);
  };
  let entered, release;
  const accountEntered = new Promise((resolve) => {
    entered = resolve;
  });
  const accountGate = new Promise((resolve) => {
    release = resolve;
  });
  const app = appFor(pool, questionFixture, async () => {
    entered();
    return accountGate;
  });
  const starting = app.post('/sessions', {
    sessionType: 'learning',
    taskType: 'task1',
  });
  await accountEntered;
  assert.equal((await app.post('/sessions/10/apply-promotion')).status, 200);
  release({ type: 'chatgpt' });
  const response = await starting;
  assert.equal(response.status, 409);
  assert.match(response.body.error, /학습 단계가 변경/);
  assert.equal(pool.state.questions, 0);
  assert.equal(pool.state.targets.length, 0);
  assert.equal(app.prompts.length, 0);
});

test('AI generation runs after reservation transaction has committed', async () => {
  const pool = creationPool();
  const baseQuery = pool.query.bind(pool);
  const transactions = [];
  pool.query = (sql, values) => {
    if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) transactions.push(sql);
    return baseQuery(sql, values);
  };
  const app = appFor(pool, (prompt) => {
    assert.equal(transactions.at(-1), 'COMMIT');
    return prompt.includes('문제를 하나')
      ? questionFixture(prompt)
      : hintFixture();
  });
  assert.equal(
    (await app.post('/sessions', { sessionType: 'learning' })).status,
    200,
  );
});

test('generation cancelled during AI cannot return to in_progress',async()=>{
  const pool=creationPool(),query=pool.query.bind(pool);let entered,release;
  const ready=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
  pool.query=(sql,values)=>{
    if(sql.startsWith('UPDATE writing_sessions') && sql.includes("status='in_progress'"))return Promise.resolve(result(pool.state.abandoned?[]:[{id:10}]));
    if(sql.startsWith('UPDATE writing_session_items'))return Promise.resolve(result());
    return query(sql,values);
  };
  const app=appFor(pool,async prompt=>{if(prompt.startsWith('EnPra IELTS Writing 문제')){entered();await gate;return questionFixture(prompt);}return hintFixture();});
  const starting=app.post('/sessions',{sessionType:'learning'});await ready;
  assert.equal((await app.post('/sessions/10/abandon')).status,200);release();
  assert.equal((await starting).status,409);assert.equal(pool.state.abandoned,true);
});

test('another completed shared hint set is reused without deleting earlier hints',async()=>{
  const pool=creationPool(),query=pool.query.bind(pool);let reads=0,deletes=0;
  pool.query=(sql,values)=>{
    if(sql.startsWith('SELECT id FROM writing_question_hint_sets'))return Promise.resolve(result(++reads===1?[]:[{id:50}]));
    if(sql.startsWith('DELETE FROM writing_question_hints'))deletes++;
    return query(sql,values);
  };
  const app=appFor(pool,prompt=>prompt.startsWith('EnPra IELTS Writing 문제')?questionFixture(prompt):hintFixture());
  assert.equal((await app.post('/sessions',{sessionType:'learning'})).status,200);
  assert.equal(reads,2);assert.equal(deletes,0);assert.equal(pool.state.hints,0);
});

for(const feature of [{type:'building'},{type:'building',label:'Library',x:NaN,y:20},{type:'building',label:'Library',x:95,y:20},{type:'road',label:'Road',points:[[0,0]]},{type:'road',label:'Road',points:[[0,0],[120,20]]}])
test(`map rejects incomplete/out-of-bounds feature ${JSON.stringify(feature)}`,async t=>{
  t.mock.method(Math,'random',()=>0.99);
  const pool=creationPool('5.0C');
  const app=appFor(pool,prompt=>({...questionFixture(prompt),material:{mapPanels:[{label:'Before',features:[feature]}]}}));
  const response=await app.post('/sessions',{sessionType:'learning',taskType:'task1'});
  assert.equal(response.status,500);assert.equal(response.body.code,'AI_RESPONSE_INVALID');assert.equal(pool.state.questions,0);
});

test('invalid cached map geometry is regenerated instead of being reused',async t=>{
  t.mock.method(Math,'random',()=>0.99);
  const pool=creationPool('5.0C',{id:99,task_type:'task1',question_format:'map',title:'Map',prompt:'Describe the map.',material_json:{mapPanels:[{label:'Before',features:[{type:'building'}]}]},solution_context:{}});
  const app=appFor(pool,prompt=>prompt.startsWith('EnPra IELTS Writing 문제')?questionFixture(prompt):hintFixture());
  assert.equal((await app.post('/sessions',{sessionType:'learning',taskType:'task1'})).status,200);assert.equal(pool.state.questions,1);
});

for (const type of ['test', 'promotion_test', 'placement_test']) {
  test(`${type} notebook publication is independent from progression evidence`, async () => {
    const state = { completed: false, reviewed: false };
    const row = {
      id: 40,
      answer_text: 'Answer.',
      effective_score: 90,
      result_label: 'pass',
      error_count: 1,
      feedback_json: {},
      feedback_review_status: 'not_requested',
      title: 'Fixture',
      prompt: 'Question',
      material_json: {},
    };
    const pool = {
      async query(sql) {
        if (sql.startsWith('SELECT r.id')) {
          assert(!sql.includes('r.affects_progress=TRUE'));
          assert(sql.includes("s.session_type<>'placement_test'"));
          assert(
            sql.includes("(s.session_type='learning' OR s.status='completed')"),
          );
          assert(
            sql.includes(
              "r.evaluation_status='completed' AND r.error_count > 0",
            ),
          );
          const pending = sql.includes(
            "r.feedback_review_status IN ('not_requested','failed')",
          );
          return result(
            type !== 'placement_test' &&
              state.completed &&
              !(pending && state.reviewed)
              ? [row]
              : [],
          );
        }
        if (sql.includes("SET feedback_review_status='completed'")) {
          state.reviewed = true;
          return result();
        }
        if (sql.includes("SET feedback_review_status='reviewing'"))
          return result();
        throw new Error('Unexpected notebook query');
      },
    };
    const app = appFor(pool, () => ({
      correctedAnswer: 'Corrected.',
      errors: [],
      improvedAnswer: [{ label: 'Answer', text: 'Improved.' }],
    }));
    assert.deepEqual((await app.get('/notebook')).body.entries, []);
    assert.equal((await app.post('/notebook/review')).body.reviewedCount, 0);
    state.completed = true;
    assert.equal(
      (await app.get('/notebook')).body.entries.length,
      type === 'placement_test' ? 0 : 1,
    );
    assert.equal(
      (await app.post('/notebook/review')).body.reviewedCount,
      type === 'placement_test' ? 0 : 1,
    );
  });
}
