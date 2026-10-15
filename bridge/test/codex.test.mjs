import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { after, mock, test } from 'node:test';

const json = '{"ok":true}';
const outputSchema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false };
const escapedAnswer = JSON.stringify({ answer: 'First paragraph.\n\nSecond paragraph.\tDetail.' });
const message = (id, text = json, phase) => ({ id, type: 'agentMessage', text, ...(phase ? { phase } : {}) });
const cases = {
  utf8Chunks: { byteChunks: true, completed: [message('a', '문법 설명 · café 😀', 'final_answer')], expected: '문법 설명 · café 😀' },
  utf8StreamChunks: { byteChunks: true, started: [message('a', '', 'final_answer')], deltas: [['a', '{"answer":"문법 설명 · café 😀"}']], outputSchema: { type: 'object', properties: { answer: { type: 'string' } }, required: ['answer'], additionalProperties: false }, expected: '{"answer":"문법 설명 · café 😀"}' },
  duplicate: { completed: [message('a'), message('a')], items: [message('a')], deltas: [['a', json]], expected: json },
  finalPreferred: { completed: [message('a', 'old')], items: [message('a', 'final')], deltas: [['a', 'partial']], expected: 'final' },
  distinctIds: { completed: [message('a', 'same'), message('b', 'same')], items: [message('a', 'same'), message('b', 'same')], expected: 'same\n\nsame' },
  completedOnly: { completed: [message('a')], expected: json },
  streamingOnly: { deltas: [['a', '{"ok":'], ['a', 'true}']], expected: json },
  mixedFallback: { items: [message('a', 'first')], deltas: [['a', 'partial'], ['b', 'second']], expected: 'first\n\nsecond' },
  commentaryThenFinal: { completed: [message('a', '{"draft":true}', 'commentary'), message('b', json, 'final_answer')], expected: json },
  phasePreserved: { completed: [message('a', '{"draft":true}', 'commentary'), message('b', json, 'final_answer')], items: [message('a', '{"draft":true}'), message('b', json)], expected: json },
  streamedPhase: { started: [message('a', '', 'commentary'), message('b', '', 'final_answer')], deltas: [['a', '{"draft":true}'], ['b', json]], expected: json },
  latestFinal: { completed: [message('a', '{"draft":true}', 'final_answer'), message('b', json, 'final_answer')], expected: json },
  plainText: { completed: [message('a', 'Checking.', 'commentary'), message('b', 'Explanation\nAn English example.', 'final_answer')], expected: 'Explanation\nAn English example.' },
  vocabularyArray: { completed: [message('a', 'Preparing vocabulary.', 'commentary'), message('b', '[{"word":"sample"}]', 'final_answer')], expected: '[{"word":"sample"}]' },
  onlyCommentary: { completed: [message('a', '{"draft":true}', 'commentary')] },
  rpcError: { rpcError: { code: -32000, message: 'Synthetic RPC failure', codexErrorInfo: 'usageLimitExceeded', additionalDetails: 'Synthetic details' } },
  failedTurn: { status: 'failed', turnError: { message: 'Synthetic terminal failure' }, notifications: [{ turnId: 'turn', error: { message: 'Synthetic stream failure', codexErrorInfo: { responseStreamDisconnected: { httpStatusCode: 503 } }, additionalDetails: 'Synthetic details' } }] },
  retriedNotification: { completed: [message('a')], notifications: [{ turnId: 'turn', willRetry: true, error: { codexErrorInfo: 'responseStreamDisconnected' } }], expected: json },
  requestTimeout: { ignored: ['account/read'] },
  initializeTimeout: { ignored: ['initialize'] },
  turnTimeout: { noTurnComplete: true },
  terminationFallback: { ignored: ['account/read'], ignoreSigterm: true },
  writeFailure: { throwOn: 'account/read' },
  spawnFailure: { spawnError: true },
  serverRequest: { serverRequest: true, completed: [message('a')], expected: json },
  synchronousReplies: { synchronous: true, completed: [message('a')], expected: json },
  schemaFinal: { outputSchema, completed: [message('a', 'Preparing.', 'commentary'), message('b', json, 'final_answer')], expected: json },
  schemaSingle: { outputSchema, completed: [message('a')], expected: json },
  schemaLatestFinal: { outputSchema, completed: [message('a', '{"ok":false}', 'final_answer'), message('b', json, 'final_answer')], expected: json },
  schemaEscapedAnswer: { outputSchema: { type: 'object', properties: { answer: { type: 'string' } }, required: ['answer'], additionalProperties: false }, deltas: [['a', escapedAnswer.slice(0, 24)], ['a', escapedAnswer.slice(24)]], expected: escapedAnswer },
  schemaAmbiguousFragments: { completed: [message('a', '{"answer":"First'), message('b', 'Second"}')] },
  schemaAmbiguousObjects: { completed: [message('a'), message('b')] },
};
const home = mkdtempSync(join(tmpdir(), 'enpra-codex-test-'));
const children = new Map();
const flush = () => new Promise(resolve => setImmediate(resolve));

mock.method(childProcess, 'spawn', (_command, _args, options) => {
  const name = basename(options.env.CODEX_HOME);
  const fixture = cases[name] ?? {};
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = new EventEmitter();
  child.stdin.writable = true;
  child.stdin.destroyed = false;
  child.exitCode = null;
  child.killSignals = [];
  child.requests = [];
  child.clientResponses = [];
  child.exit = (code = 0) => {
    child.exitCode = code;
    child.stdin.destroyed = true;
    child.stdin.writable = false;
    child.emit('exit', code, null);
  };
  child.kill = (signal = 'SIGTERM') => {
    child.killSignals.push(signal);
    if (!fixture.ignoreSigterm || signal === 'SIGKILL') child.exit();
    return true;
  };
  const emit = value => {
    const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
    if (fixture.byteChunks) {
      for (const byte of bytes) child.stdout.emit('data', Buffer.from([byte]));
    } else child.stdout.emit('data', bytes);
  };
  child.stdin.write = line => {
    if (child.stdin.destroyed) return false;
    const request = JSON.parse(line);
    if (!request.method) { child.clientResponses.push(request); return true; }
    child.requests.push(request);
    if (request.method === fixture.throwOn) throw new Error('Synthetic write failure');
    const reply = () => {
      if (fixture.ignored?.includes(request.method) || fixture.spawnError) return;
      if (request.method === 'initialize') emit({ id: request.id, result: {} });
      if (request.method === 'account/read') emit({ id: request.id, result: { account: { type: 'chatgpt' } } });
      if (request.method === 'account/logout') emit({id:request.id,result:{}});
      if (request.method === 'thread/start') emit(fixture.rpcError
        ? { id: request.id, error: fixture.rpcError }
        : { id: request.id, result: { thread: { id: 'thread' } } });
      if (request.method === 'turn/start') {
        if (fixture.serverRequest) emit({ id: request.id, method: 'item/tool/requestUserInput', params: {} });
        emit({ id: request.id, result: { turn: { id: 'turn' } } });
        for (const item of fixture.started ?? []) emit({ method: 'item/started', params: { turnId: 'turn', item } });
        for (const [itemId, delta] of fixture.deltas ?? []) emit({ method: 'item/agentMessage/delta', params: { turnId: 'turn', itemId, delta } });
        for (const item of fixture.completed ?? []) emit({ method: 'item/completed', params: { turnId: 'turn', item } });
        for (const params of fixture.notifications ?? []) emit({ method: 'error', params });
        if (!fixture.noTurnComplete) emit({ method: 'turn/completed', params: { turn: { id: 'turn', status: fixture.status ?? 'completed', error: fixture.turnError, items: fixture.items ?? [] } } });
      }
    };
    if (fixture.synchronous) reply();
    else queueMicrotask(reply);
    return true;
  };
  const list = children.get(name) ?? [];
  list.push(child);
  children.set(name, list);
  if (fixture.spawnError) queueMicrotask(() => child.emit('error', new Error('Synthetic spawn failure')));
  return child;
});
syncBuiltinESMExports();
const { CodexRegistry, CodexRequestError } = await import('../dist/codex.js');

after(() => {
  for (const list of children.values()) for (const child of list) child.exit();
  mock.restoreAll();
  syncBuiltinESMExports();
  rmSync(home, { recursive: true });
});

for (const [name, fixture] of Object.entries(cases).filter(([, value]) => value.expected)) {
  test(name, async () => {
    const result = await new CodexRegistry(home).get(name).runLearningPrompt('test', fixture.outputSchema);
    assert.equal(result.text, fixture.expected);
    if (fixture.expected === json) assert.deepEqual(JSON.parse(result.text), { ok: true });
    const child = children.get(name).at(-1);
    for (const request of child.requests.filter(value => ['thread/start', 'turn/start'].includes(value.method))) {
      assert.equal(request.params.model, 'gpt-6-luna');
      assert.equal(request.params.serviceTier, 'priority');
      if (request.method === 'turn/start') assert.equal(request.params.effort, 'high');
      if (request.method === 'turn/start' && fixture.outputSchema) assert.deepEqual(request.params.outputSchema, fixture.outputSchema);
      else assert.equal(Object.hasOwn(request.params, 'outputSchema'), false);
    }
    if (fixture.outputSchema) {
      assert.equal(result.outputMetadata.selectedMessageCount, 1);
      const hasFinal = [...(fixture.started ?? []), ...(fixture.completed ?? []), ...(fixture.items ?? [])].some(item => item.phase === 'final_answer');
      assert.equal(result.outputMetadata.selection, hasFinal ? 'final_answer' : 'single_message');
    }
    if (fixture.serverRequest) assert.deepEqual(child.clientResponses[0], { id: child.requests.find(value => value.method === 'turn/start').id, error: { code: -32601, message: 'Client requests are not supported.' } });
  });
}

for (const name of ['schemaAmbiguousFragments', 'schemaAmbiguousObjects']) {
  test(`${name} rejects rather than joining structured output messages`, async () => {
    await assert.rejects(new CodexRegistry(home).get(name).runLearningPrompt('test', outputSchema), error => {
      assert.equal(error.code, 'CODEX_STRUCTURED_OUTPUT_AMBIGUOUS');
      assert.equal(error.requestMethod, 'turn/completed');
      assert.equal(error.additionalDetails.candidateMessageCount, 2);
      return true;
    });
  });
}

test('commentary alone does not become the final answer', async () => {
  await assert.rejects(new CodexRegistry(home).get('onlyCommentary').runLearningPrompt('test'), /학습 응답을 반환하지/);
});

test('RPC error metadata survives the wrapper', async () => {
  await assert.rejects(new CodexRegistry(home).get('rpcError').runLearningPrompt('test'), error => {
    assert.ok(error instanceof CodexRequestError);
    assert.equal(error.code, -32000);
    assert.equal(error.codexErrorInfo, 'usageLimitExceeded');
    assert.equal(error.additionalDetails, 'Synthetic details');
    assert.equal(error.requestMethod, 'thread/start');
    return true;
  });
});

test('failed turn preserves nested notification metadata', async () => {
  await assert.rejects(new CodexRegistry(home).get('failedTurn').runLearningPrompt('test'), error => {
    assert.ok(error instanceof CodexRequestError);
    assert.equal(error.message, 'Synthetic terminal failure');
    assert.deepEqual(error.codexErrorInfo, { responseStreamDisconnected: { httpStatusCode: 503 } });
    assert.equal(error.additionalDetails, 'Synthetic details');
    assert.equal(error.requestMethod, 'turn/completed');
    return true;
  });
});

test('exited child rejects pending and future requests, then registry replaces it', async () => {
  const registry = new CodexRegistry(home);
  const client = registry.get('requestTimeout');
  await client.initialization;
  const pending = assert.rejects(client.readAccount(), { code: 'CODEX_SERVER_STOPPED' });
  await flush();
  children.get('requestTimeout').at(-1).exit(1);
  await pending;
  await assert.rejects(client.readAccount(), { code: 'CODEX_SERVER_STOPPED' });
  await assert.rejects(client.runLearningPrompt('test'), { code: 'CODEX_SERVER_STOPPED' });
  assert.equal(client.pending.size, 0);
  const replacement = registry.get('requestTimeout');
  assert.notEqual(replacement, client);
  await replacement.initialization;
  assert.equal(replacement.stopped, false);
});

for (const name of ['closedStdin', 'writeFailure', 'spawnFailure', 'stdinError']) {
  test(`${name} rejects instead of leaving a pending request`, async () => {
    const client = new CodexRegistry(home).get(name);
    if (name !== 'spawnFailure') await client.initialization;
    const child = children.get(name).at(-1);
    if (name === 'closedStdin') { child.stdin.destroyed = true; child.stdin.writable = false; }
    if (name === 'stdinError') child.stdin.emit('error', new Error('Synthetic input error'));
    await assert.rejects(client.readAccount(), { code: 'CODEX_SERVER_STOPPED' });
    assert.equal(client.pending.size, 0);
    assert.equal(client.stopped, true);
  });
}

for (const [name, method, waitMs, code] of [
  ['initializeTimeout', 'initialize', 30_001, 'CODEX_REQUEST_TIMEOUT'],
  ['requestTimeout', 'account/read', 30_001, 'CODEX_REQUEST_TIMEOUT'],
  ['turnTimeout', 'turn/completed', 180_001, 'CODEX_TURN_TIMEOUT'],
]) {
  test(`${method} timeout clears state and terminates its child`, async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const client = new CodexRegistry(home).get(name);
      const promise = name === 'turnTimeout' ? client.runLearningPrompt('test') : client.readAccount();
      const rejected = assert.rejects(promise, { code, requestMethod: method });
      await flush();
      mock.timers.tick(waitMs);
      await rejected;
      assert.equal(client.pending.size, 0);
      assert.equal(client.turnWaiters.size, 0);
      assert.equal(client.stopped, true);
      assert.deepEqual(children.get(name).at(-1).killSignals, ['SIGTERM']);
    } finally { mock.timers.reset(); }
  });
}

test('timeout escalates only its own child to SIGKILL when SIGTERM is ignored', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const client = new CodexRegistry(home).get('terminationFallback');
    const rejected = assert.rejects(client.readAccount(), { code: 'CODEX_REQUEST_TIMEOUT' });
    await flush();
    mock.timers.tick(30_001);
    await rejected;
    const child = children.get('terminationFallback').at(-1);
    assert.deepEqual(child.killSignals, ['SIGTERM']);
    mock.timers.tick(5000);
    assert.deepEqual(child.killSignals, ['SIGTERM', 'SIGKILL']);
    assert.equal(child.exitCode, 0);
  } finally { mock.timers.reset(); }
});

test('idle expiry terminates only the idle client and removes its registry entry',async()=>{
  mock.timers.enable({apis:['setTimeout']});
  try {
    const registry=new CodexRegistry(home),client=registry.get('idleLifecycle');await client.readAccount();
    mock.timers.tick(600_001);
    assert.equal(client.stopped,true);assert.equal(registry.clients.size,0);
    assert.deepEqual(children.get('idleLifecycle').at(-1).killSignals,['SIGTERM']);
  } finally {mock.timers.reset();}
});

test('disconnect releases its registry entry and terminates its idle child',async()=>{
  mock.timers.enable({apis:['setTimeout']});
  try {
    const registry=new CodexRegistry(home),client=registry.get('logoutLifecycle');await client.readAccount();
    await registry.disconnect('logoutLifecycle');assert.equal(registry.clients.size,0);
    mock.timers.tick(1);assert.equal(client.stopped,true);
  } finally {mock.timers.reset();}
});

test('disconnect retirement waits for an active AI turn before terminating',async()=>{
  mock.timers.enable({apis:['setTimeout']});
  try {
    const registry=new CodexRegistry(home),client=registry.get('turnTimeout');
    const running=client.runLearningPrompt('test');await flush();
    await registry.disconnect('turnTimeout');mock.timers.tick(1000);
    assert.equal(client.stopped,false);assert.equal(client.turnWaiters.size,1);
    const child=children.get('turnTimeout').at(-1);
    child.stdout.emit('data',Buffer.from(JSON.stringify({method:'turn/completed',params:{turn:{id:'turn',status:'completed',items:[message('final','Done.','final_answer')]}}})+'\n'));
    assert.equal((await running).text,'Done.');mock.timers.tick(1000);assert.equal(client.stopped,true);
  } finally {mock.timers.reset();}
});
