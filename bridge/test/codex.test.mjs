import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { after, mock, test } from 'node:test';

const json = '{"ok":true}';
const message = (id, text = json) => ({ id, type: 'agentMessage', text });
const cases = {
  duplicate: { completed: [message('a'), message('a')], items: [message('a')], deltas: [['a', json]], expected: json },
  finalPreferred: { completed: [message('a', 'old')], items: [message('a', 'final')], deltas: [['a', 'partial']], expected: 'final' },
  distinctIds: { completed: [message('a', 'same'), message('b', 'same')], items: [message('a', 'same'), message('b', 'same')], expected: 'same\n\nsame' },
  completedOnly: { completed: [message('a')], expected: json },
  streamingOnly: { deltas: [['a', '{"ok":'], ['a', 'true}']], expected: json },
  mixedFallback: { items: [message('a', 'first')], deltas: [['a', 'partial'], ['b', 'second']], expected: 'first\n\nsecond' },
};
const home = mkdtempSync(join(tmpdir(), 'enpra-codex-test-'));

mock.method(childProcess, 'spawn', (_command, _args, options) => {
  const fixture = cases[basename(options.env.CODEX_HOME)];
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const emit = (value) => child.stdout.emit('data', Buffer.from(`${JSON.stringify(value)}\n`));
  child.stdin = { write(line) {
    const request = JSON.parse(line);
    queueMicrotask(() => {
      if (request.method === 'initialize') emit({ id: request.id, result: {} });
      if (request.method === 'thread/start') emit({ id: request.id, result: { thread: { id: 'thread' } } });
      if (request.method === 'turn/start') {
        emit({ id: request.id, result: { turn: { id: 'turn' } } });
        for (const [itemId, delta] of fixture.deltas ?? []) emit({ method: 'item/agentMessage/delta', params: { turnId: 'turn', itemId, delta } });
        for (const item of fixture.completed ?? []) emit({ method: 'item/completed', params: { turnId: 'turn', item } });
        emit({ method: 'turn/completed', params: { turn: { id: 'turn', status: 'completed', items: fixture.items ?? [] } } });
      }
    });
    return true;
  } };
  return child;
});
syncBuiltinESMExports();
const { CodexRegistry } = await import('../dist/codex.js');

after(() => {
  mock.restoreAll();
  syncBuiltinESMExports();
  rmSync(home, { recursive: true });
});

for (const [name, fixture] of Object.entries(cases)) {
  test(name, async () => {
    const result = await new CodexRegistry(home).get(name).runLearningPrompt('test');
    assert.equal(result.text, fixture.expected);
    if (fixture.expected === json) assert.deepEqual(JSON.parse(result.text), { ok: true });
  });
}
