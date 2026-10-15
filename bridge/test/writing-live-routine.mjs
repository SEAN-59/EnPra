// Opt-in diagnostic only: real AI calls, synthetic learner data, no deployment, all DB rows rolled back.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { Hono } from 'hono';

const startedAt = Date.now();
const workDeadlineMs = 420_000;
const dryRun = process.argv.includes('--dry-run');
const modulePaths = process.argv.slice(2).filter(argument => argument !== '--dry-run');
const emit = (event, fields = {}) => console.log(JSON.stringify({ event, elapsedMs: Date.now() - startedAt, ...fields }));
let describeAiFailure = () => ({ status: 500, metadata: { errorType: 'internal' } });
let parseAiJsonObject, AiResponseError;
let currentCheck = 'configuration';
let checks = 0;
let client, child, db;
let childExited = false, connected = false, transactionOpen = false, deadlineReached = false;
let sessionId, itemId, questionId, attemptId;
const prefix = `enpra-write-live:${randomUUID()}:`;
const user = { id: `${prefix}learner`, displayName: 'Synthetic live Writing diagnostic' };
const savepoints = [];
const aiCalls = [];
let savepointCounter = 0;
let deadlineTimer, heartbeat;
let childExitPromise, childExitResolve;
let killTimer;
let routeError = null;
let rollbackVerified = false;
let routinePassed = false;
let apiQuestionIdentifierMismatch = false;
const originalConsoleError = console.error;
// The notebook route currently logs raw upstream error messages; this diagnostic must not do so.
console.error = () => emit('route_logged_failure', { rawDetailsSuppressed: true });

function check(name, condition) {
  currentCheck = name;
  checks++;
  assert(condition);
}
function diagnosticError(code) {
  const error = new Error('Diagnostic stopped.');
  error.diagnosticCode = code;
  return error;
}
function safeFailure(error) {
  const failure = describeAiFailure(error);
  const reasons = new Map([
    ['AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.', 'json_parse_invalid'],
    ['AI가 필수 채점 정보를 완성하지 못했습니다. 다시 시도해 주세요.', 'grading_required_fields_invalid'],
    ['AI가 필수 문제 정보를 완성하지 못했습니다. 다시 시도해 주세요.', 'question_required_fields_invalid'],
    ['AI가 사용할 수 있는 문제 자료를 만들지 못했습니다. 다시 시도해 주세요.', 'question_material_invalid'],
    ['AI가 네 종류의 힌트를 완성하지 못했습니다. 다시 시도해 주세요.', 'hint_required_fields_invalid'],
  ]);
  return {
    status: failure.status,
    ...failure.metadata,
    diagnosticCode: ['WORK_DEADLINE', 'AI_CALL_LIMIT', 'UNEXPECTED_AI_PROMPT', 'ACCOUNT_NOT_CHATGPT'].includes(error?.diagnosticCode)
      ? error.diagnosticCode : null,
    assertionFailed: error?.code === 'ERR_ASSERTION',
    diagnosticReason: AiResponseError && error instanceof AiResponseError ? reasons.get(error.message) ?? 'ai_response_other' : null,
  };
}
function stopOwnChild() {
  if (!child || childExited) return;
  child.kill('SIGTERM');
  if (!killTimer) killTimer = setTimeout(() => {
    if (!childExited) child.kill('SIGKILL');
  }, 5000);
}
function assertRemaining() {
  if (deadlineReached || Date.now() - startedAt >= workDeadlineMs) throw diagnosticError('WORK_DEADLINE');
}
function positiveId(value) {
  const id = Number(value);
  check('positive database identifier', Number.isSafeInteger(id) && id > 0);
  return id;
}
function promptKind(prompt) {
  if (prompt.startsWith('EnPra IELTS Writing 문제')) return 'question';
  if (prompt.startsWith('EnPra Writing 학습 문제용 힌트')) return 'hints';
  if (prompt.startsWith('EnPra IELTS Writing 답안')) return 'grading';
  if (prompt.startsWith('EnPra Writing 오답노트')) return 'notebook_review';
  throw diagnosticError('UNEXPECTED_AI_PROMPT');
}
function syntheticAnswer(prompt) {
  const topic = prompt.replace(/\s+/g, ' ').split(' ').slice(0, 12).join(' ');
  // Intentionally imperfect, generic learner response; never borrow a hint, sample, or AI feedback.
  return [
    `The question starts with "${topic}". I think this issue have both good and bad sides. My opinion is that people should choose a balanced way, because one simple rule cannot help everyone.`,
    'First, a change can give people more opportunities in their everyday life. For example, a family in a small town may find it useful, but another family may have different needs. I has seen this problem in my community. The local people was not always agree about the best choice.',
    'On the other hand, there are costs and practical difficulties. It is important to explain who will pay and how the idea will work. If the plan is too expensive, it might create another problem instead of solving the first one.',
    'In conclusion, I partly support changes when they help ordinary people. However, we needs clear information and a fair plan before making a final decision.',
  ].join('\n\n');
}
function gradingResponseMetadata(response) {
  let directJsonParsePass = false, directRootObject = false, directParsePosition = null, directParseReason = null;
  try {
    const value = JSON.parse(response.trim());
    directJsonParsePass = true;
    directRootObject = Boolean(value && typeof value === 'object' && !Array.isArray(value));
  } catch (error) {
    const message = error instanceof SyntaxError ? error.message : '';
    const position = /position\s+(\d+)/i.exec(message);
    directParsePosition = position ? Number(position[1]) : null;
    directParseReason = /unexpected end/i.test(message) ? 'unexpected_end'
      : /control character/i.test(message) ? 'unescaped_control_character'
      : /unterminated string/i.test(message) ? 'unterminated_string'
      : /property name/i.test(message) ? 'expected_property_name'
      : /non-whitespace/i.test(message) ? 'trailing_content'
      : /escape/i.test(message) ? 'invalid_escape'
      : /expected.*colon|expected ':'/i.test(message) ? 'expected_colon'
      : /expected.*[,}]/i.test(message) ? 'expected_delimiter'
      : /unexpected token/i.test(message) ? 'unexpected_token'
      : 'syntax_other';
  }
  const metadata = { directJsonParsePass, directRootObject, directParsePosition, directParseReason, strictParserPass: false };
  let value;
  try { value = parseAiJsonObject(response); metadata.strictParserPass = true; }
  catch { return metadata; }
  const type = field => field === null ? 'null' : Array.isArray(field) ? 'array' : typeof field;
  const record = field => Boolean(field && typeof field === 'object' && !Array.isArray(field));
  const nonemptyString = field => typeof field === 'string' && field.trim().length > 0;
  const keys = ['taskAchievementOrResponse', 'coherenceCohesion', 'lexicalResource', 'grammaticalRangeAccuracy'];
  const criteria = Object.fromEntries(keys.map(key => {
    const field = value.criteria?.[key];
    return [key, { type: type(field), finiteNumber: typeof field === 'number' && Number.isFinite(field), inRange: typeof field === 'number' && Number.isFinite(field) && field >= 0 && field <= 100 }];
  }));
  const corrected = value.feedback?.correctedAnswer, improved = value.feedback?.improvedAnswer;
  const resultLabelAbsent = value.resultLabel === undefined;
  const resultLabelAllowed = typeof value.resultLabel === 'string' && ['pass', 'partial', 'needs_practice'].includes(value.resultLabel.trim());
  const errorCountInteger = typeof value.errorCount === 'number' && Number.isInteger(value.errorCount);
  const errorCountInRange = errorCountInteger && value.errorCount >= 0 && value.errorCount <= 32767;
  return {
    ...metadata,
    criteriaRecord: record(value.criteria), criteria,
    feedbackRecord: record(value.feedback),
    correctedAnswerType: type(corrected), correctedAnswerNonemptyString: nonemptyString(corrected),
    improvedAnswerType: type(improved), improvedAnswerNonemptyString: nonemptyString(improved),
    errorCountType: type(value.errorCount), errorCountInteger, errorCountInRange,
    resultLabelAbsent, resultLabelAllowed,
    requiredFieldsValid: record(value.criteria) && Object.values(criteria).every(field => field.finiteNumber && field.inRange)
      && record(value.feedback) && nonemptyString(corrected) && nonemptyString(improved) && errorCountInRange && (resultLabelAbsent || resultLabelAllowed),
  };
}

try {
  check('explicit live diagnostic opt in', dryRun || process.env.ENPRA_WRITING_LIVE_DIAGNOSTIC === '1');
  check('three absolute candidate module paths', modulePaths.length === 3 && modulePaths.every(path => isAbsolute(path) && existsSync(path)));
  check('configured database connection', Boolean(process.env.DATABASE_URL));
  let configuredHome = process.env.ENPRA_CODEX_SHARED_HOME;
  if (!configuredHome) {
    const dataDir = process.env.ENPRA_DATA_DIR;
    check('configured existing data directory', typeof dataDir === 'string' && isAbsolute(dataDir) && existsSync(join(dataDir, 'codex')));
    const homes = readdirSync(join(dataDir, 'codex')).filter(name => existsSync(join(dataDir, 'codex', name, 'auth.json')));
    check('exactly one existing shared auth home', homes.length === 1);
    configuredHome = join(dataDir, 'codex', homes[0]);
  }
  check('existing shared Codex home', typeof configuredHome === 'string' && isAbsolute(configuredHome) && existsSync(join(configuredHome, 'auth.json')));
  const accountHome = realpathSync(configuredHome);
  check('shared Codex home has registry layout', basename(dirname(accountHome)) === 'codex');
  const { registerWritingRoutes } = await import(pathToFileURL(modulePaths[0]).href);
  const { CodexRegistry } = await import(pathToFileURL(modulePaths[1]).href);
  ({ describeAiFailure } = await import(pathToFileURL(modulePaths[2]).href));
  ({ parseAiJsonObject, AiResponseError } = await import(pathToFileURL(join(dirname(modulePaths[0]), 'ai-json.js')).href));
  check('candidate module interfaces', [registerWritingRoutes, CodexRegistry, describeAiFailure, parseAiJsonObject, AiResponseError].every(value => typeof value === 'function'));
  if (dryRun) {
    check('four bounded AI prompt categories', ['EnPra IELTS Writing 문제', 'EnPra Writing 학습 문제용 힌트', 'EnPra IELTS Writing 답안', 'EnPra Writing 오답노트'].map(promptKind).join(',') === 'question,hints,grading,notebook_review');
    const answer = syntheticAnswer('Some people prefer living in cities while others prefer living in small towns.');
    check('synthetic answer self check', answer.split(/\s+/).length >= 150 && answer.includes('I has') && answer.includes('we needs'));
    const validGrade = { criteria: { taskAchievementOrResponse: 50, coherenceCohesion: 60, lexicalResource: 55, grammaticalRangeAccuracy: 40 }, feedback: { correctedAnswer: 'Correction.', improvedAnswer: 'Improvement.' }, errorCount: 4, resultLabel: 'needs_practice' };
    const validMeta = gradingResponseMetadata(JSON.stringify(validGrade));
    check('valid grade diagnostic self check', validMeta.directJsonParsePass && validMeta.directRootObject && validMeta.strictParserPass && validMeta.requiredFieldsValid);
    const invalidJsonMeta = gradingResponseMetadata('{"criteria":');
    check('invalid JSON diagnostic self check', !invalidJsonMeta.directJsonParsePass && !invalidJsonMeta.strictParserPass && typeof invalidJsonMeta.directParseReason === 'string');
    const invalidFieldsMeta = gradingResponseMetadata(JSON.stringify({ ...validGrade, errorCount: '4' }));
    check('invalid schema diagnostic self check', invalidFieldsMeta.directJsonParsePass && invalidFieldsMeta.strictParserPass && !invalidFieldsMeta.requiredFieldsValid && invalidFieldsMeta.errorCountType === 'string');
    check('whitelisted parser failure reason', safeFailure(new AiResponseError()).diagnosticReason === 'json_parse_invalid');
    check('whitelisted schema failure reason', safeFailure(new AiResponseError('AI가 필수 채점 정보를 완성하지 못했습니다. 다시 시도해 주세요.')).diagnosticReason === 'grading_required_fields_invalid');
    routinePassed = true;
    emit('dry_run_verified', { checks, databaseConnections: 0, inferenceCalls: 0, childProcessesStarted: 0 });
  } else {
  const registry = new CodexRegistry(dirname(dirname(accountHome)));
  client = registry.get(basename(accountHome));
  child = client.child;
  check('diagnostic owns a child process', Boolean(child?.pid));
  childExitPromise = new Promise(resolve => { childExitResolve = resolve; });
  child.once('exit', (code, signal) => {
    childExited = true;
    clearTimeout(killTimer);
    emit('own_child_exit', { code, signal });
    childExitResolve();
  });
  child.once('error', () => {
    if (!child.pid) { childExited = true; childExitResolve(); }
  });
  deadlineTimer = setTimeout(() => { deadlineReached = true; stopOwnChild(); }, Math.max(1, workDeadlineMs - (Date.now() - startedAt)));
  heartbeat = setInterval(() => emit('routine_waiting', { step: currentCheck, inferenceCalls: aiCalls.length }), 30_000);
  const account = await client.readAccount();
  emit('account_state', { accountPresent: Boolean(account), type: account?.type === 'chatgpt' ? 'chatgpt' : 'other_or_absent' });
  if (account?.type !== 'chatgpt') throw diagnosticError('ACCOUNT_NOT_CHATGPT');

  const liveCodex = { get(id) {
    check('AI route scoped to synthetic learner', id === user.id);
    return {
      readAccount: () => client.readAccount(),
      async runLearningPrompt(prompt, outputSchema) {
        assertRemaining();
        if (aiCalls.length >= 5) throw diagnosticError('AI_CALL_LIMIT');
        const kind = promptKind(prompt);
        const call = { kind, startedAtMs: Date.now() - startedAt, completed: false };
        aiCalls.push(call);
        currentCheck = `live ${kind}`;
        emit('ai_call_start', { kind, callNumber: aiCalls.length, model: 'gpt-6-luna', effort: 'high', serviceTier: 'priority', promptLength: prompt.length });
        try {
          const result = await client.runLearningPrompt(prompt, outputSchema);
          assertRemaining();
          call.completed = true;
          call.elapsedMs = Date.now() - startedAt - call.startedAtMs;
          call.responseLength = result.text.length;
          emit('ai_call_complete', { kind, callNumber: aiCalls.length, elapsedMsForCall: call.elapsedMs, responseLength: call.responseLength });
          if (kind === 'grading') emit('grading_response_diagnostic', gradingResponseMetadata(result.text));
          return result;
        } catch (error) {
          call.failure = safeFailure(error);
          emit('ai_call_failure', { kind, callNumber: aiCalls.length, ...call.failure });
          throw error;
        }
      },
    };
  } };

  db = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
  await db.connect();
  connected = true;
  await db.query('BEGIN');
  transactionOpen = true;
  await db.query("SET LOCAL statement_timeout='20s'");
  await db.query("SET LOCAL lock_timeout='5s'");
  await db.query("SET LOCAL idle_in_transaction_session_timeout='10min'");
  const pool = {
    async query(sql, params) {
      assertRemaining();
      if (sql === 'BEGIN') {
        const name = `live_route_${++savepointCounter}`;
        savepoints.push(name);
        return db.query(`SAVEPOINT ${name}`);
      }
      if (sql === 'COMMIT') {
        const name = savepoints.pop();
        assert(name);
        return db.query(`RELEASE SAVEPOINT ${name}`);
      }
      if (sql === 'ROLLBACK') {
        const name = savepoints.pop();
        assert(name);
        await db.query(`ROLLBACK TO SAVEPOINT ${name}`);
        return db.query(`RELEASE SAVEPOINT ${name}`);
      }
      // Cache bypass only: generate a new question without changing any existing question row.
      if (sql.startsWith('SELECT q.*')) return { rows: [], rowCount: 0 };
      return db.query(sql, params);
    },
    async connect() { return { query: pool.query, release() {} }; },
  };
  const rule = (await db.query("SELECT public_level,level_group,internal_stage,config FROM writing_level_rules WHERE internal_stage='5.0B' AND rule_version='v3' AND is_active=TRUE ORDER BY id DESC LIMIT 1")).rows[0];
  check('original active v3 5.0B rule exists', rule?.public_level === '5.0' && rule.internal_stage === '5.0B');
  await db.query('INSERT INTO users(id,display_name) VALUES($1,$2)', [user.id, user.displayName]);
  await db.query("INSERT INTO user_writing_profiles(user_id,onboarding_status,current_public_level,current_level_group,current_internal_stage,metrics_refreshed_for_date,metrics_refreshed_at) VALUES($1,'active',$2,$3,$4,CURRENT_DATE,NOW())", [user.id, rule.public_level, rule.level_group, rule.internal_stage]);
  const app = new Hono();
  app.use('*', async (c, next) => { c.set('user', user); await next(); });
  app.onError((error, c) => {
    routeError = error;
    const failure = describeAiFailure(error);
    return c.json({ diagnosticFailure: true }, failure.status);
  });
  registerWritingRoutes(app, pool, liveCodex);
  async function request(label, path, body) {
    assertRemaining();
    currentCheck = label;
    routeError = null;
    const response = await app.request(`http://live-diagnostic/api/writing${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    });
    if (routeError) throw routeError;
    check(`${label} HTTP 200`, response.status === 200);
    return response.json();
  }

  emit('routine_start', { mode: 'candidate-writing-real-ai-real-db-rollback', stage: '5.0B', task: 'task2', ruleVersion: 'v3', syntheticLearner: true, syntheticAnswer: true, answerQualityValidation: false, productionSourceReplaced: false });
  const started = await request('session generation', '/sessions', { sessionType: 'learning', learningMode: 'standard', taskType: 'task2' });
  sessionId = positiveId(started.sessionId);
  const initial = (await request('generated session read', `/sessions/${sessionId}`)).session;
  itemId = positiveId(initial.currentItem?.id);
  const apiQuestionId = positiveId(initial.currentItem?.question?.id);
  const itemRow = (await db.query('SELECT question_id FROM writing_session_items WHERE id=$1 AND session_id=$2', [itemId, sessionId])).rows[0];
  questionId = positiveId(itemRow?.question_id);
  apiQuestionIdentifierMismatch = apiQuestionId !== questionId;
  if (apiQuestionIdentifierMismatch) emit('api_question_identifier_mismatch', { mismatch: true, persistenceChecksUseActualForeignKey: true });
  check('API question identifier matches actual question foreign key', !apiQuestionIdentifierMismatch);
  check('generated Task 2 in progress', initial.status === 'in_progress' && !initial.completed && initial.currentItem.taskType === 'task2');
  check('session original stage snapshot', initial.internalStage === '5.0B' && initial.publicLevel === '5.0');
  check('original stage target word count', Number(initial.currentItem.targetWordCount) === Number(rule.config.targetWordCounts.task2));
  check('four actual generated hints', initial.hints.length === 4 && new Set(initial.hints.map(h => h.type)).size === 4);
  check('question generation and hints were real AI calls', aiCalls.length === 2 && aiCalls[0].kind === 'question' && aiCalls[1].kind === 'hints' && aiCalls.every(call => call.completed));
  const storedQuestion = (await db.query('SELECT prompt,material_json,status,task_type FROM writing_questions WHERE id=$1', [questionId])).rows[0];
  check('generated question persisted before rollback', storedQuestion?.prompt === initial.currentItem.question.prompt && JSON.stringify(storedQuestion.material_json) === JSON.stringify(initial.currentItem.question.material) && storedQuestion.task_type === 'task2' && storedQuestion.status === 'active');
  const structure = initial.hints.find(hint => hint.type === 'structure');
  const hintId = positiveId(structure?.id);
  const revealed = await request('structure hint reveal', `/sessions/${sessionId}/items/${itemId}/hints/${hintId}`, {});
  check('actual hint content returned', typeof revealed.content === 'string' && revealed.content.length > 0);
  await request('structure hint repeated', `/sessions/${sessionId}/items/${itemId}/hints/${hintId}`, {});
  check('repeat hint idempotent', (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_hint_usage_events WHERE session_item_id=$1', [itemId])).rows[0].n === 1);

  const answer = syntheticAnswer(initial.currentItem.question.prompt);
  const answerWordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  emit('synthetic_answer_ready', { answerWordCount, answerCharacterCount: [...answer].length, borrowedAiSample: false, genericAnswer: true, deliberateGrammarMistakes: true });
  const submitted = await request('actual grading submission', `/sessions/${sessionId}/items/${itemId}/submit`, { answer, answerSections: [] });
  check('submission completed', submitted.submitted === true && submitted.session.completed && submitted.session.status === 'completed');
  check('completed one-item learning session', submitted.session.expectedItemCount === 1 && submitted.session.completedItemCount === 1 && submitted.session.results.length === 1);
  const saved = (await db.query('SELECT id,answer_text,answer_word_count,answer_character_count,evaluation_status,raw_score,hint_penalty_score,effective_score,result_label,error_count,feedback_json,rule_version,evaluation_model,affects_progress,feedback_released_at FROM writing_attempt_results WHERE session_item_id=$1', [itemId])).rows[0];
  attemptId = positiveId(saved?.id);
  check('real result persisted with original v3 rubric and model', saved.evaluation_status === 'completed' && saved.rule_version === 'v3' && saved.evaluation_model === 'gpt-6-luna');
  check('original synthetic answer stored without replacement', saved.answer_text === answer && saved.answer_word_count === answerWordCount && saved.answer_character_count === [...answer].length);
  check('released learning result affects progress', saved.affects_progress === true && saved.feedback_released_at != null);
  const criteria = (await db.query('SELECT criterion_code,raw_score,descriptor_target FROM writing_attempt_criterion_results WHERE attempt_result_id=$1', [attemptId])).rows;
  check('four independent criterion rows persisted', criteria.length === 4 && new Set(criteria.map(row => row.criterion_code)).size === 4 && criteria.every(row => Number.isFinite(Number(row.raw_score)) && Number(row.raw_score) >= 0 && Number(row.raw_score) <= 100 && row.descriptor_target.startsWith('5.0B')));
  check('raw score matches four criterion average', Number(saved.raw_score) === Math.round(criteria.reduce((sum, row) => sum + Number(row.raw_score), 0) / criteria.length));
  check('structure hint penalty applied exactly once', Number(saved.hint_penalty_score) === 5 && Number(saved.effective_score) === Math.max(0, Number(saved.raw_score) - 5));
  check('learner feedback persisted', typeof saved.feedback_json?.correctedAnswer === 'string' && saved.feedback_json.correctedAnswer.length > 0 && typeof saved.feedback_json.improvedAnswer === 'string' && saved.feedback_json.improvedAnswer.length > 0);
  check('saved result and completion payload agree', submitted.result.effectiveScore === Number(saved.effective_score) && submitted.session.averageScore === Number(saved.effective_score) && submitted.session.results[0].answerText === answer);
  check('actual AI reports errors for notebook eligibility', Number.isInteger(saved.error_count) && saved.error_count > 0);
  emit('grading_persistence_verified', { rawScore: Number(saved.raw_score), hintPenalty: Number(saved.hint_penalty_score), effectiveScore: Number(saved.effective_score), errorCount: saved.error_count, criteriaCount: criteria.length, model: saved.evaluation_model, ruleVersion: saved.rule_version });

  const beforeReview = await request('notebook before review', '/notebook');
  check('graded answer visible in notebook', beforeReview.entries.length === 1 && beforeReview.entries[0].id === attemptId && beforeReview.entries[0].answer === answer && beforeReview.entries[0].score === Number(saved.effective_score) && !beforeReview.entries[0].reviewed);
  const review = await request('actual notebook AI review', '/notebook/review', {});
  check('exactly one notebook review succeeded', review.reviewedCount === 1 && review.failedCount === 0);
  const reviewed = (await db.query('SELECT feedback_review_status,reviewed_feedback_json,feedback_reviewed_at,feedback_review_model,feedback_review_version,raw_score,hint_penalty_score,effective_score,error_count,feedback_json,rule_version FROM writing_attempt_results WHERE id=$1', [attemptId])).rows[0];
  check('notebook review persisted', reviewed.feedback_review_status === 'completed' && reviewed.feedback_reviewed_at != null && reviewed.feedback_review_model === 'gpt-6-luna' && typeof reviewed.feedback_review_version === 'string');
  check('review has correction and improved paragraphs', typeof reviewed.reviewed_feedback_json?.correctedAnswer === 'string' && reviewed.reviewed_feedback_json.correctedAnswer.length > 0 && Array.isArray(reviewed.reviewed_feedback_json.improvedAnswer) && reviewed.reviewed_feedback_json.improvedAnswer.length > 0 && reviewed.reviewed_feedback_json.improvedAnswer.every(paragraph => typeof paragraph.text === 'string' && paragraph.text.length > 0));
  check('review preserves actual error explanations', Array.isArray(reviewed.reviewed_feedback_json.errors) && reviewed.reviewed_feedback_json.errors.length > 0);
  check('review never replaces original grades or feedback', reviewed.rule_version === saved.rule_version && Number(reviewed.raw_score) === Number(saved.raw_score) && Number(reviewed.hint_penalty_score) === Number(saved.hint_penalty_score) && Number(reviewed.effective_score) === Number(saved.effective_score) && reviewed.error_count === saved.error_count && JSON.stringify(reviewed.feedback_json) === JSON.stringify(saved.feedback_json));
  const afterReview = await request('notebook after review', '/notebook');
  check('reviewed notebook payload returned', afterReview.entries.length === 1 && afterReview.entries[0].reviewed && afterReview.entries[0].reviewStatus === 'completed' && JSON.stringify(afterReview.entries[0].feedback) === JSON.stringify(reviewed.reviewed_feedback_json));
  const finalSession = (await request('completed session reread', `/sessions/${sessionId}`)).session;
  check('completed session reread retains grade', finalSession.completed && finalSession.results.length === 1 && finalSession.averageScore === Number(saved.effective_score));
  check('exactly four real AI calls completed', aiCalls.length === 4 && ['question', 'hints', 'grading', 'notebook_review'].every((kind, index) => aiCalls[index]?.kind === kind && aiCalls[index].completed));
  check('route transaction savepoints fully released', savepoints.length === 0);
  routinePassed = true;
  emit('routine_verified', { checks, inferenceCalls: aiCalls.length, model: 'gpt-6-luna', stage: '5.0B', task: 'task2', notebookReviewed: true, warningCount: Number(apiQuestionIdentifierMismatch), apiQuestionIdentifierMismatch, persistenceChecksUseActualForeignKey: true });
  }
} catch (error) {
  emit('diagnostic_failure', { failedCheck: currentCheck, inferenceCalls: aiCalls.length, ...safeFailure(error) });
  process.exitCode = 1;
} finally {
  clearTimeout(deadlineTimer);
  clearInterval(heartbeat);
  stopOwnChild();
  if (childExitPromise) {
    let cleanupTimer;
    await Promise.race([
      childExitPromise,
      new Promise(resolve => { cleanupTimer = setTimeout(resolve, 10_000); }),
    ]);
    clearTimeout(cleanupTimer);
  }
  clearTimeout(killTimer);
  if (connected) {
    try {
      if (transactionOpen) { await db.query('ROLLBACK'); transactionOpen = false; }
      await db.query("SET statement_timeout='8s'");
      const users = (await db.query('SELECT COUNT(*)::INTEGER n FROM users WHERE id LIKE $1', [`${prefix}%`])).rows[0].n;
      const sessions = (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_sessions WHERE user_id LIKE $1', [`${prefix}%`])).rows[0].n;
      const questions = questionId ? (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_questions WHERE id=$1', [questionId])).rows[0].n : 0;
      const attempts = attemptId ? (await db.query('SELECT COUNT(*)::INTEGER n FROM writing_attempt_results WHERE id=$1', [attemptId])).rows[0].n : 0;
      rollbackVerified = users === 0 && sessions === 0 && questions === 0 && attempts === 0;
      emit('rollback_verified', { usersRemaining: users, sessionsRemaining: sessions, generatedQuestionsRemaining: questions, attemptsRemaining: attempts, rollbackVerified });
    } catch (error) {
      emit('cleanup_database_failure', safeFailure(error));
      process.exitCode = 1;
    } finally { await db.end().catch(() => { process.exitCode = 1; }); }
  }
  if (!dryRun && (!rollbackVerified || !childExited)) process.exitCode = 1;
  emit('diagnostic_cleanup', { dryRun, routinePassed, checks, inferenceCalls: aiCalls.length, rollbackVerified, ownChildExited: childExited, productionSourceReplaced: false, syntheticAnswer: true, answerQualityValidation: false, warningCount: Number(apiQuestionIdentifierMismatch), apiQuestionIdentifierMismatch, persistenceChecksUseActualForeignKey: !dryRun && questionId != null });
  console.error = originalConsoleError;
}
