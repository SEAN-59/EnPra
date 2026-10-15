// Opt-in live regression only: synthetic users, actual AI, rollback, no production/auth/model changes.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { Hono } from 'hono';

const startedAt = Date.now(), deadlineMs = 420_000;
const dryRun = process.argv.includes('--dry-run');
const firstPass = process.argv.includes('--first-pass');
const stageArgs = process.argv.slice(2).filter(value => value.startsWith('--stage='));
const stage = stageArgs[0]?.slice(8).replace(/^Foundation$/, 'foundation');
const modules = process.argv.slice(2).filter(value => value !== '--dry-run' && value !== '--first-pass' && !value.startsWith('--stage='));
const emit = (event, fields = {}) => console.log(JSON.stringify({ event, elapsedMs: Date.now() - startedAt, ...fields }));
let parseAiJsonObject, AiResponseError;
let describeAiFailure = () => ({ status: 500, metadata: { errorType: 'internal' } });
let checks = 0, currentCheck = 'configuration', routinePassed = false, rollbackVerified = false;
let child, childExited = false, childExitPromise, childExitResolve, killTimer, deadlineTimer, heartbeat;
let deadlineReached = false, db, connected = false, transactionOpen = false, routeError;
let sessionId, savepointCount = 0, incompleteSubmitFeedbackExposed = false;
const prefix = `enpra-write-live-level:${randomUUID()}:`;
const schema = `writing_live_${randomUUID().replaceAll('-', '')}`;
const user = { id: `${prefix}learner`, displayName: 'Synthetic live level diagnostic' };
const savepoints = [], aiCalls = [], questionIds = new Set(), attemptIds = new Set();
const savedResults = [];
const questionFormats = [];
const allowedFormats = new Set(['bar_chart', 'line_chart', 'pie_chart', 'table', 'diagram', 'map', 'two_views', 'opinion', 'advantages_disadvantages', 'two_part', 'causes_solutions', 'short_notice', 'simple_schedule', 'mini_table', 'mini_data_card', 'short_scenario', 'simple_sequence']);
const originalConsoleError = console.error;
console.error = () => emit('route_logged_failure', { rawDetailsSuppressed: true });

function check(name, condition) { currentCheck = name; checks++; assert(condition); }
function diagnosticError(code) { const error = new Error('Diagnostic stopped.'); error.diagnosticCode = code; return error; }
function safeFailure(error) {
  const failure = describeAiFailure(error);
  const reasons = new Map([
    ['AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.', 'json_parse_invalid'],
    ['AI가 필수 채점 정보를 완성하지 못했습니다. 다시 시도해 주세요.', 'grading_required_fields_invalid'],
    ['AI가 필수 문제 정보를 완성하지 못했습니다. 다시 시도해 주세요.', 'question_required_fields_invalid'],
    ['AI가 사용할 수 있는 문제 자료를 만들지 못했습니다. 다시 시도해 주세요.', 'question_material_invalid'],
    ['AI가 오류의 원문 위치를 정확히 찾지 못했습니다. 다시 시도해 주세요.', 'error_source_location_invalid'],
    ['AI가 오류의 원문과 교정 정보를 완성하지 못했습니다. 다시 시도해 주세요.', 'error_source_fields_invalid'],
  ]);
  return { status: failure.status, ...failure.metadata,
    diagnosticReason: AiResponseError && error instanceof AiResponseError ? reasons.get(error.message) ?? 'ai_response_other' : null,
    diagnosticCode: ['DEADLINE', 'AI_CALL_LIMIT', 'UNEXPECTED_AI_PROMPT', 'ACCOUNT_NOT_CHATGPT'].includes(error?.diagnosticCode) ? error.diagnosticCode : null,
    assertionFailed: error?.code === 'ERR_ASSERTION' };
}
function stopOwnChild() {
  if (!child || childExited) return;
  child.kill('SIGTERM');
  if (!killTimer) killTimer = setTimeout(() => { if (!childExited) child.kill('SIGKILL'); }, 5000);
}
function remaining() { if (deadlineReached || Date.now() - startedAt >= deadlineMs) throw diagnosticError('DEADLINE'); }
function id(value) { const number = Number(value); check('positive safe database identifier', Number.isSafeInteger(number) && number > 0); return number; }
function safeFormat(value) { return allowedFormats.has(value) ? value : 'unknown'; }
function kind(prompt) {
  if (prompt.startsWith('EnPra IELTS Writing 문제')) return 'question';
  if (prompt.startsWith('EnPra IELTS Writing 답안')) return 'grading';
  if (prompt.startsWith('EnPra Writing 오답노트')) return 'notebook_review';
  throw diagnosticError('UNEXPECTED_AI_PROMPT');
}
function firstPassFeedback(value) {
  const nonempty = value => typeof value === 'string' && Boolean(value.trim());
  return Boolean(value && nonempty(value.correctedAnswer) && nonempty(value.improvedAnswer)
    && Array.isArray(value.errors)
    && Array.isArray(value.synonymGroups) && value.synonymGroups.length <= 4 && value.synonymGroups.every(group => group && nonempty(group.term) && Array.isArray(group.alternatives) && group.alternatives.length > 0 && group.alternatives.length <= 4 && group.alternatives.every(nonempty) && typeof group.note === 'string')
    && Array.isArray(value.usefulExpressions) && value.usefulExpressions.length <= 4 && value.usefulExpressions.every(item => item && [item.expression,item.meaning,item.example].every(nonempty))
    && Array.isArray(value.keyLearningPoints) && value.keyLearningPoints.length > 0 && value.keyLearningPoints.length <= 3 && value.keyLearningPoints.every(nonempty)
    && typeof value.nextFocus === 'string');
}
function errorSourceMetadata(prompt, value) {
  const answer = /\n사용자 답안: ([\s\S]*?)\n평가 스킬: /.exec(prompt)?.[1];
  return { sourcePresent: typeof answer === 'string', errors: (Array.isArray(value.feedback?.errors) ? value.feedback.errors : []).map((error, index) => {
    const original = typeof error?.original === 'string' ? error.original : '';
    let exactMatches = 0;
    if (original && answer) for (let from = 0; from <= answer.length;) {
      const found = answer.indexOf(original, from);
      if (found < 0) break;
      exactMatches++; from = found + original.length;
    }
    const occurrence = Number.isSafeInteger(error?.occurrence) ? error.occurrence : null;
    return { index, quoteLength: original.length, exactMatches, occurrence,
      locationValid: occurrence !== null && occurrence > 0 && occurrence <= exactMatches,
      normalizedQuoteMatches: Boolean(original && answer?.normalize('NFKC').replace(/\s+/g, ' ').toLowerCase().includes(original.normalize('NFKC').replace(/\s+/g, ' ').toLowerCase())) };
  }) };
}
function gradingMetadata(response) {
  let directJsonParsePass = false, directRootObject = false, directParsePosition = null, directParseReason = null, directControlCharacterCode = null;
  try {
    const value = JSON.parse(response.trim()); directJsonParsePass = true;
    directRootObject = Boolean(value && typeof value === 'object' && !Array.isArray(value));
  } catch (error) {
    const message = error instanceof SyntaxError ? error.message : '';
    const position = /position\s+(\d+)/i.exec(message);
    directParsePosition = position ? Number(position[1]) : null;
    directParseReason = /unexpected end/i.test(message) ? 'unexpected_end' : /control character/i.test(message) ? 'unescaped_control_character'
      : /unterminated string/i.test(message) ? 'unterminated_string' : /property name/i.test(message) ? 'expected_property_name'
      : /non-whitespace/i.test(message) ? 'trailing_content' : /escape/i.test(message) ? 'invalid_escape'
      : /expected.*colon|expected ':'/i.test(message) ? 'expected_colon' : /expected.*[,}]/i.test(message) ? 'expected_delimiter'
      : /unexpected token/i.test(message) ? 'unexpected_token' : 'syntax_other';
  }
  if (directParseReason === 'unescaped_control_character' && directParsePosition !== null) {
    const code = response.trim().charCodeAt(directParsePosition);
    if (Number.isInteger(code) && code >= 0 && code < 32) directControlCharacterCode = code;
  }
  const metadata = { directJsonParsePass, directRootObject, directParsePosition, directParseReason, directControlCharacterCode, strictParserPass: false };
  let value;
  try { value = parseAiJsonObject(response); metadata.strictParserPass = true; } catch { return metadata; }
  const type = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const record = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  const criteria = Object.fromEntries(['taskAchievementOrResponse', 'coherenceCohesion', 'lexicalResource', 'grammaticalRangeAccuracy'].map(key => {
    const field = value.criteria?.[key]; return [key, { type: type(field), finiteNumber: typeof field === 'number' && Number.isFinite(field), inRange: typeof field === 'number' && Number.isFinite(field) && field >= 0 && field <= 100 }];
  }));
  const corrected = value.feedback?.correctedAnswer, improved = value.feedback?.improvedAnswer;
  const errorCountInteger = typeof value.errorCount === 'number' && Number.isInteger(value.errorCount);
  const errorCountInRange = errorCountInteger && value.errorCount >= 0 && value.errorCount <= 32767;
  const resultLabelAbsent = value.resultLabel === undefined;
  const resultLabelAllowed = typeof value.resultLabel === 'string' && ['pass', 'partial', 'needs_practice'].includes(value.resultLabel.trim());
  return { ...metadata, criteriaRecord: record(value.criteria), criteria, feedbackRecord: record(value.feedback),
    correctedAnswerType: type(corrected), correctedAnswerNonemptyString: nonempty(corrected), improvedAnswerType: type(improved), improvedAnswerNonemptyString: nonempty(improved),
    errorCountType: type(value.errorCount), errorCountInteger, errorCountInRange, resultLabelAbsent, resultLabelAllowed,
    requiredFieldsValid: record(value.criteria) && Object.values(criteria).every(field => field.finiteNumber && field.inRange)
      && record(value.feedback) && nonempty(corrected) && nonempty(improved) && errorCountInRange && (resultLabelAbsent || resultLabelAllowed) };
}
function learnerAnswer(item) {
  const material = item.question.material ?? {};
  if (item.taskType === 'foundation') {
    const content = String(material.content ?? '').replace(/\s+/g, ' ').split(' ').slice(0, 12).join(' ');
    const answerSections = material.questions.map((question, index) => ({ label: `Question ${index + 1}`, text: `I thinks the notice say ${content}. This information are useful for me.` }));
    return { answer: material.questions.map((question, index) => `Question ${index + 1}: ${question.prompt}\nAnswer ${index + 1}: ${answerSections[index].text}`).join('\n\n'), answerSections };
  }
  if (item.taskType === 'task1') {
    const list = value => Array.isArray(value) ? value : [];
    const observations = [...list(material.categories), ...list(material.series).map(row => row?.name), ...list(material.rows).map(row => `${row?.label} ${row?.value}`), ...list(material.steps).map(row => row?.label), ...list(material.mapPanels).flatMap(panel => [panel?.label, ...list(panel?.features).map(feature => feature?.label)])].filter(value => typeof value === 'string' && value).slice(0, 8).join(', ');
    return { answer: [
      `The material show information about ${material.title || 'the given topic'}. Some labels are ${observations || 'shown in the material'}. I can see several parts, but it is difficult to compare every detail.`,
      'Overall, there are important differences between the parts of the material. Some things are larger or more noticeable than the others. I thinks the main point is that the information is not the same in every group. However, I cannot give a clear overview of all the changes.',
      'Looking at the details, the first part have a different pattern from another part. It is useful to compare the labels and the information carefully. The material also contain other details which may help explain these differences. In conclusion, there are several features to discuss, and more exact comparisons would make this report clearer.',
    ].join('\n\n'), answerSections: [] };
  }
  const topic = item.question.prompt.replace(/\s+/g, ' ').split(' ').slice(0, 12).join(' ');
  return { answer: [
    `The question starts with "${topic}". I think this issue have both good and bad sides. My opinion is that people should choose a balanced way, because one simple rule cannot help everyone.`,
    'First, a change can give people more opportunities in their everyday life. For example, a family in a small town may find it useful, but another family may have different needs. I has seen this problem in my community. The local people was not always agree about the best choice.',
    'On the other hand, there are costs and practical difficulties. It is important to explain who will pay and how the idea will work. If the plan is too expensive, it might create another problem instead of solving the first one.',
    'In conclusion, I partly support changes when they help ordinary people. However, we needs clear information and a fair plan before making a final decision.',
  ].join('\n\n'), answerSections: [] };
}

try {
  check('one supported stage', stageArgs.length === 1 && ['foundation', '5.0A', '6.0A'].includes(stage));
  check('explicit live opt in', dryRun || process.env.ENPRA_WRITING_LIVE_LEVELS === '1');
  check('three absolute candidate modules', modules.length === 3 && modules.every(path => isAbsolute(path) && existsSync(path)));
  const { registerWritingRoutes, initializeWritingDatabase, writingQuestionPrompt } = await import(pathToFileURL(modules[0]).href);
  const { CodexRegistry } = await import(pathToFileURL(modules[1]).href);
  ({ describeAiFailure } = await import(pathToFileURL(modules[2]).href));
  ({ parseAiJsonObject, AiResponseError } = await import(pathToFileURL(join(dirname(modules[0]), 'ai-json.js')).href));
  check('candidate interfaces', [registerWritingRoutes, CodexRegistry, describeAiFailure, parseAiJsonObject, AiResponseError].every(value => typeof value === 'function'));
  if (dryRun) {
    const valid = { criteria: { taskAchievementOrResponse: 50, coherenceCohesion: 60, lexicalResource: 55, grammaticalRangeAccuracy: 40 }, feedback: { correctedAnswer: 'Correction.', improvedAnswer: 'Improvement.' }, errorCount: 4 };
    check('valid grading metadata', gradingMetadata(JSON.stringify(valid)).requiredFieldsValid);
    check('invalid JSON metadata', !gradingMetadata('{"criteria":').strictParserPass);
    check('invalid grading fields metadata', !gradingMetadata(JSON.stringify({ ...valid, errorCount: '4' })).requiredFieldsValid);
    check('control character metadata excludes response text', gradingMetadata('{"answer":"First\nSecond"}').directControlCharacterCode === 10);
    check('safe metadata excludes raw values', !JSON.stringify(gradingMetadata('{"SECRET_SENTINEL":"broken')).includes('SECRET_SENTINEL'));
    check('question format metadata whitelisted', safeFormat('table') === 'table' && safeFormat('SECRET_SENTINEL') === 'unknown');
    const structured={correctedAnswer:'Correction.',improvedAnswer:'Overview.\n\nDetails.',errors:[],synonymGroups:[{term:'rise',alternatives:['increase'],note:'증가'}],usefulExpressions:[{expression:'stood at',meaning:'수치가 …였다',example:'The figure stood at 40%.'}],keyLearningPoints:['문법을 확인해요.'],nextFocus:'Grammar'};
    check('first-pass feedback shape passes',firstPassFeedback(structured));
    check('legacy feedback shape is not mistaken for first-pass',!firstPassFeedback(valid.feedback));
    check('malformed first-pass feedback rejected',!firstPassFeedback({...structured,keyLearningPoints:[]}) && !firstPassFeedback({...structured,usefulExpressions:['flat string']}));
    const locations = errorSourceMetadata('\n사용자 답안: I has books. I has time.\n평가 스킬: grammar', {feedback:{errors:[{original:'I has',occurrence:2},{original:'I HAS',occurrence:1}]}});
    check('source location diagnostics contain only counts and flags',locations.errors[0].exactMatches===2 && locations.errors[0].locationValid && !locations.errors[1].locationValid && locations.errors[1].normalizedQuoteMatches && !JSON.stringify(locations).includes('I has'));
    const foundation = learnerAnswer({ taskType: 'foundation', question: { material: { content: 'The library opens at nine near the park.', questions: [{ prompt: 'When?' }, { prompt: 'Where?' }, { prompt: 'What?' }] } } });
    check('Foundation three real sections', foundation.answerSections.length === 3 && foundation.answerSections.every(section => section.text.trim()));
    for (const taskType of ['task1', 'task2']) {
      const answer = learnerAnswer({ taskType, question: { prompt: 'Some people prefer cities while other people prefer small towns.', material: { rows: [{ label: '2020', value: 20 }] } } });
      check(`${taskType} imperfect nonempty answer`, answer.answer.length > 100 && answer.answerSections.length === 0 && answer.answer.includes('have'));
    }
    emit('dry_run_verified', { stage, checks, databaseConnections: 0, inferenceCalls: 0, childProcessesStarted: 0 });
  } else {
    check('database connection configured', Boolean(process.env.DATABASE_URL));
    let home = process.env.ENPRA_CODEX_SHARED_HOME;
    if (!home) {
      const dataDir = process.env.ENPRA_DATA_DIR;
      check('existing data directory', typeof dataDir === 'string' && isAbsolute(dataDir) && existsSync(join(dataDir, 'codex')));
      const homes = readdirSync(join(dataDir, 'codex')).filter(name => existsSync(join(dataDir, 'codex', name, 'auth.json')));
      check('exactly one existing auth home', homes.length === 1); home = join(dataDir, 'codex', homes[0]);
    }
    check('existing shared auth home', typeof home === 'string' && isAbsolute(home) && existsSync(join(home, 'auth.json')));
    home = realpathSync(home); check('registry home layout', basename(dirname(home)) === 'codex');
    const client = new CodexRegistry(dirname(dirname(home))).get(basename(home));
    child = client.child; check('own diagnostic child', Boolean(child?.pid));
    childExitPromise = new Promise(resolve => { childExitResolve = resolve; });
    child.once('exit', (code, signal) => { childExited = true; clearTimeout(killTimer); emit('own_child_exit', { code, signal }); childExitResolve(); });
    child.once('error', () => { if (!child.pid) { childExited = true; childExitResolve(); } });
    deadlineTimer = setTimeout(() => { deadlineReached = true; stopOwnChild(); }, Math.max(1, deadlineMs - (Date.now() - startedAt)));
    heartbeat = setInterval(() => emit('routine_waiting', { stage, step: currentCheck, inferenceCalls: aiCalls.length }), 30_000);
    const account = await client.readAccount();
    emit('account_state', { accountPresent: Boolean(account), type: account?.type === 'chatgpt' ? 'chatgpt' : 'other_or_absent' });
    if (account?.type !== 'chatgpt') throw diagnosticError('ACCOUNT_NOT_CHATGPT');
    const codex = { get(userId) {
      check('AI synthetic learner ownership', userId === user.id);
      return { readAccount: () => client.readAccount(), async runLearningPrompt(prompt, outputSchema) {
        remaining(); if (aiCalls.length >= 6) throw diagnosticError('AI_CALL_LIMIT');
        const call = { kind: kind(prompt), completed: false }; aiCalls.push(call); currentCheck = `live ${call.kind}`;
        check('only grading requests a closed JSON output schema', call.kind === 'grading' ? outputSchema?.type === 'object' && outputSchema?.additionalProperties === false : outputSchema === undefined);
        emit('ai_call_start', { stage, kind: call.kind, callNumber: aiCalls.length, model: 'gpt-6-luna', effort: 'high', serviceTier: 'priority', schemaRequested: Boolean(outputSchema), promptLength: prompt.length, ...(call.kind === 'question' ? { requestedQuestionFormat: safeFormat(/세부 유형: (\w+)/.exec(prompt)?.[1]) } : {}) });
        const start = Date.now();
        try {
          const result = await client.runLearningPrompt(prompt, outputSchema); remaining(); call.completed = true;
          emit('ai_call_complete', { stage, kind: call.kind, callNumber: aiCalls.length, elapsedMsForCall: Date.now() - start, responseLength: result.text.length });
          if (outputSchema) {
            const meta = result.outputMetadata;
            check('structured grading uses one final message', meta?.selectedMessageCount === 1 && Number.isSafeInteger(meta.agentMessageCount) && Number.isSafeInteger(meta.finalAnswerMessageCount) && ['final_answer', 'single_message'].includes(meta.selection));
            emit('structured_output_diagnostic', { stage, kind: call.kind, agentMessageCount: meta.agentMessageCount, finalAnswerMessageCount: meta.finalAnswerMessageCount, selectedMessageCount: meta.selectedMessageCount, selection: meta.selection });
          }
          if (call.kind === 'grading') {
            emit('grading_response_diagnostic', { stage, ...gradingMetadata(result.text) });
            emit('error_source_diagnostic', { stage, ...errorSourceMetadata(prompt, parseAiJsonObject(result.text)) });
            if(firstPass) check('native first-pass feedback shape',firstPassFeedback(parseAiJsonObject(result.text).feedback));
          }
          return result;
        } catch (error) { emit('ai_call_failure', { stage, kind: call.kind, ...safeFailure(error) }); throw error; }
      } };
    } };
    db = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
    await db.connect(); connected = true; await db.query('BEGIN'); transactionOpen = true;
    await db.query("SET LOCAL statement_timeout='20s'"); await db.query("SET LOCAL lock_timeout='5s'"); await db.query("SET LOCAL idle_in_transaction_session_timeout='10min'");
    const pool = { async query(sql, params) {
      remaining();
      if (sql === 'BEGIN') { const point = `level_route_${++savepointCount}`; savepoints.push(point); return db.query(`SAVEPOINT ${point}`); }
      if (sql === 'COMMIT') { const point = savepoints.pop(); assert(point); return db.query(`RELEASE SAVEPOINT ${point}`); }
      if (sql === 'ROLLBACK') { const point = savepoints.pop(); assert(point); await db.query(`ROLLBACK TO SAVEPOINT ${point}`); return db.query(`RELEASE SAVEPOINT ${point}`); }
      if (sql.startsWith('SELECT q.*')) return { rows: [], rowCount: 0 };
      return db.query(sql, params);
    }, async connect() { return { query: pool.query, release() {} }; } };
    await db.query(`CREATE SCHEMA ${schema}`);
    await db.query(`SET LOCAL search_path TO ${schema}`);
    await db.query('CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT)');
    await initializeWritingDatabase(pool);
    const rule = (await db.query("SELECT public_level,level_group,internal_stage,config FROM writing_level_rules WHERE internal_stage=$1 AND rule_version='v3' AND is_active=TRUE ORDER BY id DESC LIMIT 1", [stage])).rows[0];
    check('original active v3 stage rule', rule?.internal_stage === stage);
    await db.query('INSERT INTO users(id,display_name) VALUES($1,$2)', [user.id, user.displayName]);
    await db.query("INSERT INTO user_writing_profiles(user_id,onboarding_status,current_public_level,current_level_group,current_internal_stage,metrics_refreshed_for_date,metrics_refreshed_at) VALUES($1,'active',$2,$3,$4,CURRENT_DATE,NOW())", [user.id, rule.public_level, rule.level_group, stage]);
    const app = new Hono(); app.use('*', async (c, next) => { c.set('user', user); await next(); });
    app.onError((error, c) => { routeError = error; return c.json({ diagnosticFailure: true }, describeAiFailure(error).status); });
    registerWritingRoutes(app, pool, codex);
    async function request(label, path, body) {
      remaining(); currentCheck = label; routeError = null;
      const response = await app.request(`http://live-level/api/writing${path}`, { method: body === undefined ? 'GET' : 'POST', ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) });
      if (routeError) throw routeError; check(`${label} HTTP 200`, response.status === 200); return response.json();
    }
    emit('routine_start', { stage, firstPass, sessionType: 'test', ruleVersion: 'v3', maxAiCalls: 6, syntheticLearner: true, syntheticAnswer: true, answerQualityValidation: false, productionCodeChanged: false });
    sessionId = id((await request('generate test', '/sessions', { sessionType: 'test' })).sessionId);
    let session = (await request('read test', `/sessions/${sessionId}`)).session;
    const itemCount = stage === 'foundation' ? 1 : 2;
    check('test correct original stage and item count', session.type === 'test' && session.internalStage === stage && session.expectedItemCount === itemCount && !session.completed);
    check('test initial feedback hidden', session.results.length === 0 && session.averageScore === null && session.hints.length === 0);
    const noNotes = await request('initial notebook', '/notebook'); check('initial notebook empty', noNotes.entries.length === 0);
    const beforeReviewCalls = aiCalls.length;
    const initialReview = firstPass ? {reviewedCount:0,failedCount:0} : await request('unfinished test notebook review', '/notebook/review', {});
    check('unfinished notebook review skips AI', initialReview.reviewedCount === 0 && initialReview.failedCount === 0 && aiCalls.length === beforeReviewCalls);
    for (let index = 0; index < itemCount; index++) {
      const item = session.currentItem, itemId = id(item?.id);
      const expectedTask = stage === 'foundation' ? 'foundation' : index === 0 ? 'task1' : 'task2';
      check('correct task order and no hints', item.taskType === expectedTask && session.hints.length === 0);
      const storedItem = (await db.query('SELECT question_id FROM writing_session_items WHERE id=$1 AND session_id=$2', [itemId, sessionId])).rows[0];
      const questionId = id(storedItem?.question_id); questionIds.add(questionId);
      check('API question identifier equals actual foreign key', id(item.question.id) === questionId);
      const question = (await db.query('SELECT prompt,material_json,task_type,question_format FROM writing_questions WHERE id=$1', [questionId])).rows[0];
      check('generated question data matches actual stored question', writingQuestionPrompt(question?.prompt,item.targetWordCount) === item.question.prompt && question.task_type === expectedTask && question.question_format === item.question.questionFormat && JSON.stringify(question.material_json) === JSON.stringify(item.question.material));
      const questionFormat = safeFormat(question.question_format);
      questionFormats.push({ task: expectedTask, questionFormat });
      const questionWordInstruction = /(?:at least|minimum(?: of)?|minimum length[: ]*)\s*(\d+)\s*words/i.exec(item.question.prompt)?.[1];
      emit('generated_question_verified', { stage, task: expectedTask, questionFormat, targetWordCount: Number(item.targetWordCount ?? 0), questionWordInstruction: questionWordInstruction ? Number(questionWordInstruction) : null });
      check('stage task target words', Number(item.targetWordCount ?? 0) === Number(rule.config.targetWordCounts?.[expectedTask] ?? 0));
      const answer = learnerAnswer(item);
      const counted = expectedTask === 'foundation' ? answer.answerSections.map(section => section.text).join('\n\n') : answer.answer;
      check('Foundation exactly three answer sections', expectedTask !== 'foundation' || answer.answerSections.length === 3 && answer.answerSections.every(section => section.text.trim()));
      emit('synthetic_answer_ready', { stage, task: expectedTask, wordCount: counted.trim().split(/\s+/).length, sections: answer.answerSections.length, borrowedAnswerKey: false, answerQualityValidation: false });
      const submitted = await request('actual grading submit', `/sessions/${sessionId}/items/${itemId}/submit`, answer);
      const saved = (await db.query('SELECT id,answer_text,answer_word_count,answer_character_count,evaluation_status,raw_score,hint_penalty_score,effective_score,error_count,feedback_json,rule_version,evaluation_model FROM writing_attempt_results WHERE session_item_id=$1', [itemId])).rows[0];
      const attemptId = id(saved?.id); attemptIds.add(attemptId); savedResults.push(saved);
      check('original answer and real counts stored', saved.answer_text === answer.answer && saved.answer_word_count === counted.trim().split(/\s+/).filter(Boolean).length && saved.answer_character_count === [...counted].length);
      check('original v3 rubric model and zero hint penalty', saved.rule_version === 'v3' && saved.evaluation_model === 'gpt-6-luna' && saved.evaluation_status === 'completed' && Number(saved.hint_penalty_score) === 0 && Number(saved.effective_score) === Number(saved.raw_score));
      const criteria = (await db.query('SELECT criterion_code,raw_score,descriptor_target FROM writing_attempt_criterion_results WHERE attempt_result_id=$1', [attemptId])).rows;
      check('four original-stage criteria persisted', criteria.length === 4 && new Set(criteria.map(row => row.criterion_code)).size === 4 && criteria.every(row => Number.isFinite(Number(row.raw_score)) && Number(row.raw_score) >= 0 && Number(row.raw_score) <= 100 && row.descriptor_target.startsWith(stage)));
      check('score matches independent criterion average', Number(saved.raw_score) === Math.round(criteria.reduce((sum, row) => sum + Number(row.raw_score), 0) / 4));
      check('real correction and improved answer stored', typeof saved.feedback_json?.correctedAnswer === 'string' && saved.feedback_json.correctedAnswer.trim() && typeof saved.feedback_json.improvedAnswer === 'string' && saved.feedback_json.improvedAnswer.trim());
      if(firstPass) check('structured feedback stored at initial grading',firstPassFeedback(saved.feedback_json));
      session = submitted.session;
      check('completed item count advances', submitted.submitted && session.completedItemCount === index + 1);
      if (index + 1 < itemCount) {
        check('unfinished test session results remain hidden', !session.completed && session.results.length === 0 && session.averageScore === null);
        incompleteSubmitFeedbackExposed = submitted.result !== null;
        if (incompleteSubmitFeedbackExposed) emit('incomplete_test_submit_feedback_exposed', { exposed: true, sessionResultsHidden: true });
        check('unfinished test submit response has no score or feedback', submitted.result === null);
        check('unfinished test notebook remains empty', (await request('unfinished notebook', '/notebook')).entries.length === 0);
        const callsBeforeReview = aiCalls.length;
        const skipped = firstPass ? {reviewedCount:0,failedCount:0} : await request('unfinished graded notebook review', '/notebook/review', {});
        check('unfinished graded review skips AI', skipped.reviewedCount === 0 && skipped.failedCount === 0 && aiCalls.length === callsBeforeReview);
      } else {
        check('completed test submit response releases its result', submitted.result?.effectiveScore === Number(saved.effective_score) && submitted.result?.feedback?.correctedAnswer === saved.feedback_json.correctedAnswer);
      }
      emit('grading_persistence_verified', { stage, task: expectedTask, rawScore: Number(saved.raw_score), effectiveScore: Number(saved.effective_score), errorCount: saved.error_count, criteriaCount: criteria.length });
    }
    check('test fully completed with released results', session.completed && session.status === 'completed' && session.results.length === itemCount);
    check('completed score average', session.averageScore === savedResults.reduce((sum, row) => sum + Number(row.effective_score), 0) / itemCount);
    const eligible = savedResults.filter(row => row.error_count > 0);
    const notebook = await request('completed notebook', '/notebook');
    check('only actual error results visible in notebook', notebook.entries.length === eligible.length && notebook.entries.every(entry => eligible.some(row => Number(row.id) === entry.id && Number(row.effective_score) === entry.score)));
    if (eligible.length !== itemCount) emit('notebook_coverage_not_eligible', { stage, eligibleCount: eligible.length, completedItemCount: itemCount, errorCountsNotModified: true });
    const callsBeforeNotebook = aiCalls.length;
    if(firstPass) {
      check('notebook immediately shares original structured feedback',notebook.entries.every(entry => eligible.some(row => Number(row.id)===entry.id && JSON.stringify(entry.feedback)===JSON.stringify(row.feedback_json) && firstPassFeedback(entry.feedback) && !entry.reviewed)));
      await request('first-pass notebook reread','/notebook');
      check('notebook reads require no AI',aiCalls.length===callsBeforeNotebook);
    }
    const reviewed = firstPass ? {reviewedCount:eligible.length,failedCount:0} : await request('completed actual notebook review', '/notebook/review', {});
    check('actual notebook review succeeds for eligible entries', reviewed.reviewedCount === eligible.length && reviewed.failedCount === 0);
    for (const original of savedResults) {
      const now = (await db.query('SELECT raw_score,effective_score,hint_penalty_score,error_count,feedback_json,rule_version,feedback_review_status,reviewed_feedback_json,feedback_review_model FROM writing_attempt_results WHERE id=$1', [original.id])).rows[0];
      check('notebook review preserves original rubric and grades', now.rule_version === original.rule_version && Number(now.raw_score) === Number(original.raw_score) && Number(now.effective_score) === Number(original.effective_score) && Number(now.hint_penalty_score) === Number(original.hint_penalty_score) && now.error_count === original.error_count && JSON.stringify(now.feedback_json) === JSON.stringify(original.feedback_json));
      if (original.error_count > 0) {
        if(firstPass) check('first-pass notebook needs no review job',now.feedback_review_status==='not_requested' && firstPassFeedback(now.feedback_json));
        else check('actual notebook reviewed feedback persisted', now.feedback_review_status === 'completed' && now.feedback_review_model === 'gpt-6-luna' && typeof now.reviewed_feedback_json?.correctedAnswer === 'string' && now.reviewed_feedback_json.correctedAnswer.trim() && Array.isArray(now.reviewed_feedback_json.improvedAnswer) && now.reviewed_feedback_json.improvedAnswer.length > 0);
      }
    }
    const finalNotebook = await request('reviewed notebook reread', '/notebook');
    check('reviewed notebook feedback returned', finalNotebook.entries.length === eligible.length && finalNotebook.entries.every(entry => firstPass ? !entry.reviewed && firstPassFeedback(entry.feedback) : entry.reviewed && entry.reviewStatus === 'completed'));
    check('all expected real AI calls completed', aiCalls.length === itemCount * 2 + (firstPass ? 0 : eligible.length) && aiCalls.every(call => call.completed) && aiCalls.filter(call => call.kind === 'question').length === itemCount && aiCalls.filter(call => call.kind === 'grading').length === itemCount && aiCalls.filter(call => call.kind === 'notebook_review').length === (firstPass ? 0 : eligible.length));
    check('all nested route transactions released', savepoints.length === 0);
    routinePassed = true;
    emit('routine_verified', { stage, firstPass, checks, inferenceCalls: aiCalls.length, questionFormats, completedItemCount: itemCount, notebookReviewedCount: firstPass ? 0 : eligible.length, firstPassNotebookCount: firstPass ? eligible.length : null, notebookCoverageComplete: eligible.length === itemCount, incompleteSubmitFeedbackExposed, answerQualityValidation: false });
  }
} catch (error) {
  emit('diagnostic_failure', { stage, failedCheck: currentCheck, inferenceCalls: aiCalls.length, ...safeFailure(error) }); process.exitCode = 1;
} finally {
  clearTimeout(deadlineTimer); clearInterval(heartbeat); stopOwnChild();
  if (childExitPromise) { let timer; await Promise.race([childExitPromise, new Promise(resolve => { timer = setTimeout(resolve, 10_000); })]); clearTimeout(timer); }
  clearTimeout(killTimer);
  if (connected) {
    try {
      if (transactionOpen) { await db.query('ROLLBACK'); transactionOpen = false; }
      await db.query("SET statement_timeout='8s'");
      rollbackVerified = (await db.query('SELECT to_regnamespace($1) IS NULL AS absent',[schema])).rows[0].absent;
      emit('rollback_verified', { stage, isolatedSchemaAbsent:rollbackVerified, rollbackVerified });
    } catch (error) { emit('database_cleanup_failure', safeFailure(error)); process.exitCode = 1; }
    finally { await db.end().catch(() => { process.exitCode = 1; }); }
  }
  if (!dryRun && (!rollbackVerified || !childExited)) process.exitCode = 1;
  emit('diagnostic_cleanup', { stage, dryRun, routinePassed, checks, inferenceCalls: aiCalls.length, questionFormats, rollbackVerified, ownChildExited: childExited, incompleteSubmitFeedbackExposed, productionCodeChanged: false, answerQualityValidation: false });
  console.error = originalConsoleError;
}
