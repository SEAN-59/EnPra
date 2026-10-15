// Opt-in root-cause diagnostic: read-only DB, unchanged AI baseline, no raw payloads or production edits.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { Hono } from 'hono';

const startedAt = Date.now();
const deadlineMs = 330_000;
const dryRun = process.argv.includes('--dry-run');
const modulePaths = process.argv.slice(2).filter(value => value !== '--dry-run');
const emit = (event, fields = {}) => console.log(JSON.stringify({ event, elapsedMs: Date.now() - startedAt, ...fields }));
const sha256 = text => createHash('sha256').update(text).digest('hex');
let parseAiJsonObject, AiResponseError;
let describeAiFailure = () => ({ status: 500, metadata: { errorType: 'internal' } });
let checks = 0, currentCheck = 'configuration', calls = 0, causeIdentified = false, failureReproduced = false;
let db, connected = false, readTransaction = false;
let client, child, childExited = false, childExitPromise, childExitResolve;
let deadlineReached = false, deadlineTimer, heartbeat, killTimer;
let promptHash;
const originalConsoleError = console.error;
console.error = () => emit('route_logged_failure', { rawDetailsSuppressed: true });

function check(name, condition) { currentCheck = name; checks++; assert(condition); }
function diagnosticError(code) { const error = new Error('Diagnostic stopped.'); error.diagnosticCode = code; return error; }
function safeFailure(error) {
  const failure = describeAiFailure(error);
  const staticReasons = new Map([
    ['AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.', 'json_parse_invalid'],
    ['AI가 필수 채점 정보를 완성하지 못했습니다. 다시 시도해 주세요.', 'grading_required_fields_invalid'],
  ]);
  return { status: failure.status, ...failure.metadata,
    diagnosticReason: AiResponseError && error instanceof AiResponseError ? staticReasons.get(error.message) ?? 'ai_response_other' : null,
    diagnosticCode: ['DEADLINE', 'ACCOUNT_NOT_CHATGPT', 'UNEXPECTED_READONLY_QUERY'].includes(error?.diagnosticCode) ? error.diagnosticCode : null,
    assertionFailed: error?.code === 'ERR_ASSERTION' };
}
function stopOwnChild() {
  if (!child || childExited) return;
  child.kill('SIGTERM');
  if (!killTimer) killTimer = setTimeout(() => { if (!childExited) child.kill('SIGKILL'); }, 5000);
}
function remaining() { if (deadlineReached || Date.now() - startedAt >= deadlineMs) throw diagnosticError('DEADLINE'); }
function syntheticAnswer(prompt) {
  const topic = prompt.replace(/\s+/g, ' ').split(' ').slice(0, 12).join(' ');
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
      : /unexpected token/i.test(message) ? 'unexpected_token' : 'syntax_other';
  }
  const metadata = { directJsonParsePass, directRootObject, directParsePosition, directParseReason, strictParserPass: false };
  let value;
  try { value = parseAiJsonObject(response); metadata.strictParserPass = true; }
  catch { return metadata; }
  const type = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const record = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  const keys = ['taskAchievementOrResponse', 'coherenceCohesion', 'lexicalResource', 'grammaticalRangeAccuracy'];
  const criteria = Object.fromEntries(keys.map(key => {
    const field = value.criteria?.[key];
    return [key, { type: type(field), finiteNumber: typeof field === 'number' && Number.isFinite(field), inRange: typeof field === 'number' && Number.isFinite(field) && field >= 0 && field <= 100 }];
  }));
  const corrected = value.feedback?.correctedAnswer, improved = value.feedback?.improvedAnswer;
  const errorCountInteger = typeof value.errorCount === 'number' && Number.isInteger(value.errorCount);
  const errorCountInRange = errorCountInteger && value.errorCount >= 0 && value.errorCount <= 32767;
  const resultLabelAbsent = value.resultLabel === undefined;
  const resultLabelAllowed = typeof value.resultLabel === 'string' && ['pass', 'partial', 'needs_practice'].includes(value.resultLabel.trim());
  const invalidFields = [];
  if (!record(value.criteria)) invalidFields.push('criteria');
  for (const key of keys) if (!criteria[key].finiteNumber || !criteria[key].inRange) invalidFields.push(`criteria.${key}`);
  if (!record(value.feedback)) invalidFields.push('feedback');
  if (!nonempty(corrected)) invalidFields.push('feedback.correctedAnswer');
  if (!nonempty(improved)) invalidFields.push('feedback.improvedAnswer');
  if (!errorCountInRange) invalidFields.push('errorCount');
  if (!resultLabelAbsent && !resultLabelAllowed) invalidFields.push('resultLabel');
  return { ...metadata, criteriaRecord: record(value.criteria), criteria,
    feedbackRecord: record(value.feedback), correctedAnswerType: type(corrected), correctedAnswerNonemptyString: nonempty(corrected),
    improvedAnswerType: type(improved), improvedAnswerNonemptyString: nonempty(improved),
    errorCountType: type(value.errorCount), errorCountInteger, errorCountInRange,
    resultLabelType: type(value.resultLabel), resultLabelAbsent, resultLabelAllowed,
    invalidResultLabelCategory: resultLabelAbsent || resultLabelAllowed ? null : value.resultLabel === 'pass|partial|needs_practice' ? 'literal_template_enum' : 'unknown_invalid',
    invalidFields, requiredFieldsValid: invalidFields.length === 0 };
}

function captureApplication(registerWritingRoutes, config) {
  const question = {
    prompt: 'Some people think governments should make public transport free. Others think passengers should pay. Discuss both views and give your own opinion.',
    material_json: {},
    solution_context: { keyFacts: ['Discuss both views and provide a position.'], expectedAnswers: ['Consider affordability, public funding, and service quality.'], commonMistakes: ['Addressing only one view.'] },
  };
  const answer = syntheticAnswer(question.prompt);
  const item = { ...question, question_id: 1, task_type: 'task2', target_word_count: config.targetWordCounts?.task2 ?? 150,
    session_type: 'learning', internal_stage_snapshot: '5.0B', public_level_snapshot: '5.0', rule_version: 'v3', status: 'in_progress' };
  const state = { mode: 'capture', capturedPrompt: null, capturedSchema: null, responseText: null, routeError: null, reachedPersistenceBoundary: false };
  const captureSentinel = new Error('Synthetic prompt captured.');
  const writeSentinel = new Error('Synthetic persistence boundary reached.');
  const pool = {
    async query(sql) {
      if (sql.startsWith('SELECT i.*,q.prompt')) return { rows: [item], rowCount: 1 };
      if (sql.startsWith('SELECT h.skill_code')) return { rows: [{ skill_code: 't2_position', penalty_score: 5, hint_type: 'structure' }], rowCount: 1 };
      if (sql.startsWith('SELECT penalty_score FROM writing_session_item_scaffolds')) return { rows: [], rowCount: 0 };
      if (sql.startsWith('SELECT qs.skill_code,qs.weight')) return { rows: [{ skill_code: 't2_position', weight: 0.5 }, { skill_code: 't2_reasoning', weight: 0.5 }, { skill_code: 'grammar_sentence_structure', weight: 0.3 }], rowCount: 3 };
      if (sql.startsWith('SELECT config FROM writing_level_rules')) return { rows: [{ config }], rowCount: 1 };
      throw diagnosticError('UNEXPECTED_READONLY_QUERY');
    },
    async connect() { state.reachedPersistenceBoundary = true; throw writeSentinel; },
  };
  const app = new Hono();
  app.use('*', async (c, next) => { c.set('user', { id: 'enpra-grading-readonly-synthetic' }); await next(); });
  app.onError((error, c) => { state.routeError = error; return c.json({ diagnosticOnly: true }, 500); });
  registerWritingRoutes(app, pool, { get: () => ({ readAccount: async () => ({ type: 'chatgpt' }), async runLearningPrompt(prompt, outputSchema) {
    if (state.mode === 'capture') { state.capturedPrompt = prompt; state.capturedSchema = outputSchema; throw captureSentinel; }
    check('same captured grading prompt', prompt === state.capturedPrompt);
    check('same captured grading schema', JSON.stringify(outputSchema) === JSON.stringify(state.capturedSchema));
    return { text: state.responseText };
  } }) });
  const request = async () => {
    state.routeError = null;
    state.reachedPersistenceBoundary = false;
    await app.request('http://forensic/api/writing/sessions/1/items/1/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answer, answerSections: [] }) });
  };
  return { state, request, answer, captureSentinel, writeSentinel };
}

try {
  check('explicit grading forensic opt in', dryRun || process.env.ENPRA_WRITING_GRADING_FORENSICS === '1');
  check('three absolute candidate module paths', modulePaths.length === 3 && modulePaths.every(path => isAbsolute(path) && existsSync(path)));
  const { registerWritingRoutes } = await import(pathToFileURL(modulePaths[0]).href);
  const { CodexRegistry } = await import(pathToFileURL(modulePaths[1]).href);
  ({ describeAiFailure } = await import(pathToFileURL(modulePaths[2]).href));
  ({ parseAiJsonObject, AiResponseError } = await import(pathToFileURL(join(dirname(modulePaths[0]), 'ai-json.js')).href));
  check('candidate module interfaces', [registerWritingRoutes, CodexRegistry, describeAiFailure, parseAiJsonObject, AiResponseError].every(value => typeof value === 'function'));
  if (dryRun) {
    const valid = { criteria: { taskAchievementOrResponse: 50, coherenceCohesion: 60, lexicalResource: 55, grammaticalRangeAccuracy: 40 }, feedback: { correctedAnswer: 'Correction.', improvedAnswer: 'Improvement.' }, errorCount: 4, resultLabel: 'needs_practice' };
    check('valid metadata self check', gradingResponseMetadata(JSON.stringify(valid)).requiredFieldsValid);
    check('invalid JSON self check', !gradingResponseMetadata('{"criteria":').strictParserPass);
    const invalid = gradingResponseMetadata(JSON.stringify({ ...valid, errorCount: '4', resultLabel: 'pass|partial|needs_practice' }));
    check('invalid schema self check', invalid.strictParserPass && !invalid.requiredFieldsValid && invalid.errorCountType === 'string' && invalid.invalidResultLabelCategory === 'literal_template_enum');
    const encoded = JSON.stringify(gradingResponseMetadata('{"SECRET_SENTINEL":"broken'));
    check('no raw diagnostic payload leakage', !encoded.includes('SECRET_SENTINEL'));
    check('fixed parser error reason', safeFailure(new AiResponseError()).diagnosticReason === 'json_parse_invalid');
    check('fixed field validation reason', safeFailure(new AiResponseError('AI가 필수 채점 정보를 완성하지 못했습니다. 다시 시도해 주세요.')).diagnosticReason === 'grading_required_fields_invalid');
    const fixture = captureApplication(registerWritingRoutes, { targetWordCounts: { task2: 150 }, expectation: { task2: 'Synthetic dry-run expectations.' }, qualityControls: 'Synthetic dry-run quality controls.' });
    await fixture.request();
    check('actual route prompt captured without inference', fixture.state.routeError === fixture.captureSentinel && typeof fixture.state.capturedPrompt === 'string' && !fixture.state.reachedPersistenceBoundary);
    check('same synthetic answer format', fixture.answer.split(/\s+/).length === 159);
    fixture.state.mode = 'validate'; fixture.state.responseText = JSON.stringify(valid);
    await fixture.request();
    check('actual route validation succeeds without writes', fixture.state.routeError === fixture.writeSentinel && fixture.state.reachedPersistenceBoundary);
    fixture.state.responseText = JSON.stringify({ ...valid, errorCount: '4' });
    await fixture.request();
    check('actual route field error identified', safeFailure(fixture.state.routeError).diagnosticReason === 'grading_required_fields_invalid' && !fixture.state.reachedPersistenceBoundary);
    emit('dry_run_verified', { checks, inferenceCalls: 0, databaseConnections: 0, childProcessesStarted: 0 });
  } else {
    check('configured database connection', Boolean(process.env.DATABASE_URL));
    let accountHome = process.env.ENPRA_CODEX_SHARED_HOME;
    if (!accountHome) {
      const dataDir = process.env.ENPRA_DATA_DIR;
      check('existing data directory', typeof dataDir === 'string' && isAbsolute(dataDir) && existsSync(join(dataDir, 'codex')));
      const homes = readdirSync(join(dataDir, 'codex')).filter(name => existsSync(join(dataDir, 'codex', name, 'auth.json')));
      check('exactly one existing auth home', homes.length === 1);
      accountHome = join(dataDir, 'codex', homes[0]);
    }
    check('existing shared auth home', typeof accountHome === 'string' && isAbsolute(accountHome) && existsSync(join(accountHome, 'auth.json')));
    accountHome = realpathSync(accountHome);
    check('registry auth home layout', basename(dirname(accountHome)) === 'codex');
    deadlineTimer = setTimeout(() => { deadlineReached = true; stopOwnChild(); }, Math.max(1, deadlineMs - (Date.now() - startedAt)));
    db = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
    await db.connect(); connected = true;
    await db.query('BEGIN READ ONLY'); readTransaction = true;
    await db.query("SET LOCAL statement_timeout='15s'");
    await db.query("SET LOCAL lock_timeout='5s'");
    const rows = await db.query("SELECT config FROM writing_level_rules WHERE internal_stage='5.0B' AND rule_version='v3' AND is_active=TRUE ORDER BY id DESC LIMIT 1");
    check('active original v3 5.0B config', rows.rowCount === 1 && rows.rows[0].config && typeof rows.rows[0].config === 'object');
    const config = rows.rows[0].config;
    await db.query('ROLLBACK'); readTransaction = false;
    await db.end(); connected = false;
    const fixture = captureApplication(registerWritingRoutes, config);
    await fixture.request();
    check('actual baseline grade prompt captured', fixture.state.routeError === fixture.captureSentinel && typeof fixture.state.capturedPrompt === 'string' && !fixture.state.reachedPersistenceBoundary);
    const prompt = fixture.state.capturedPrompt;
    promptHash = sha256(prompt);
    emit('forensics_start', { mode: 'unchanged-grading-baseline-readonly', model: 'gpt-6-luna', effort: 'high', serviceTier: 'priority', stage: '5.0B', task: 'task2', ruleVersion: 'v3', promptSha256: promptHash, promptLength: prompt.length, answerWordCount: fixture.answer.split(/\s+/).length, syntheticQuestion: true, syntheticAnswer: true, exactFailedResponseReplay: false, databaseWrites: 0, maxCalls: 3 });
    remaining();
    client = new CodexRegistry(dirname(dirname(accountHome))).get(basename(accountHome));
    child = client.child;
    check('diagnostic owns its child process', Boolean(child?.pid));
    childExitPromise = new Promise(resolve => { childExitResolve = resolve; });
    child.once('exit', (code, signal) => { childExited = true; clearTimeout(killTimer); emit('own_child_exit', { code, signal }); childExitResolve(); });
    child.once('error', () => { if (!child.pid) { childExited = true; childExitResolve(); } });
    const account = await client.readAccount();
    emit('account_state', { accountPresent: Boolean(account), type: account?.type === 'chatgpt' ? 'chatgpt' : 'other_or_absent' });
    if (account?.type !== 'chatgpt') throw diagnosticError('ACCOUNT_NOT_CHATGPT');
    heartbeat = setInterval(() => emit('forensics_waiting', { step: currentCheck, inferenceCalls: calls }), 30_000);
    for (let attempt = 1; attempt <= 3; attempt++) {
      remaining();
      check('baseline prompt hash unchanged', sha256(prompt) === promptHash);
      calls++;
      currentCheck = 'actual baseline grading';
      emit('ai_call_start', { callNumber: calls, promptSha256: promptHash });
      const callStartedAt = Date.now();
      const result = await client.runLearningPrompt(prompt, fixture.state.capturedSchema);
      remaining();
      const metadata = gradingResponseMetadata(result.text);
      fixture.state.mode = 'validate'; fixture.state.responseText = result.text;
      await fixture.request();
      const validation = fixture.state.routeError === fixture.writeSentinel && fixture.state.reachedPersistenceBoundary
        ? { validationPassed: true, diagnosticReason: null }
        : { validationPassed: false, ...safeFailure(fixture.state.routeError) };
      emit('grading_response_diagnostic', { callNumber: calls, elapsedMsForCall: Date.now() - callStartedAt, promptSha256: promptHash, responseSha256: sha256(result.text), responseLength: result.text.length, ...metadata, ...validation, databaseWrites: 0 });
      if (!validation.validationPassed) { failureReproduced = true; causeIdentified = Boolean(validation.diagnosticReason); break; }
    }
    emit('forensics_result', { inferenceCalls: calls, causeIdentified, failureReproduced, allResponsesValidated: !failureReproduced && calls === 3, promptSha256: promptHash, databaseWrites: 0, exactFailedResponseReplay: false, productionCodeChanged: false });
  }
} catch (error) {
  emit('forensics_failure', { failedCheck: currentCheck, inferenceCalls: calls, ...safeFailure(error) });
  process.exitCode = 1;
} finally {
  clearTimeout(deadlineTimer); clearInterval(heartbeat);
  stopOwnChild();
  if (childExitPromise) {
    let timer;
    await Promise.race([childExitPromise, new Promise(resolve => { timer = setTimeout(resolve, 10_000); })]);
    clearTimeout(timer);
  }
  clearTimeout(killTimer);
  if (connected) {
    try { if (readTransaction) await db.query('ROLLBACK'); }
    catch (error) { emit('read_only_cleanup_failure', safeFailure(error)); process.exitCode = 1; }
    finally { await db.end().catch(() => { process.exitCode = 1; }); }
  }
  if (child && !childExited) process.exitCode = 1;
  emit('forensics_cleanup', { dryRun, checks, inferenceCalls: calls, ownChildExited: childExited, databaseWrites: 0, causeIdentified, failureReproduced, productionCodeChanged: false });
  console.error = originalConsoleError;
}
