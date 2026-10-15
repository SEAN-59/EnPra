import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AiResponseError, parseAiJsonObject } from '../dist/ai-json.js';

for (const [name, input, expected] of [
  ['plain object', '{"ok":true}', { ok: true }],
  ['fenced object', '```json\n{"ok":true}\n```', { ok: true }],
  ['legacy prose', 'Result:\n{"ok":true}\nEnd.', { ok: true }],
  ['braces in prose', 'Note {not JSON}: {"ok":true}', { ok: true }],
  ['nested arrays and escaped quotes', JSON.stringify({ answer: 'A "quote" and {braces} \\', items: [{ count: 2 }] }), { answer: 'A "quote" and {braces} \\', items: [{ count: 2 }] }],
  ['escaped paragraph breaks and tabs', JSON.stringify({ answer: 'First.\n\nSecond.\tDetail.' }), { answer: 'First.\n\nSecond.\tDetail.' }],
]) {
  test(name, () => assert.deepEqual(parseAiJsonObject(input), expected));
}

for (const input of [
  '{"commentary":true}\n{"ok":true}',
  '{"rawScore":90,}\n{"rawScore":10}',
  '{"rawScore":10}\n{"rawScore":90,}',
  '[{"ok":true}]',
  '{"ok":true,}',
  '{"outer":{"ok":true}',
  '{"ok":true}\n{',
  '{"ok":]',
  'No JSON',
  'null',
  '"{}"',
  '{"answer":"First\nSecond"}',
  '{"answer":"First\tSecond"}',
  '',
]) {
  test(`invalid response ${input.length}`, () => assert.throws(() => parseAiJsonObject(input), error => error instanceof AiResponseError && error.code === 'AI_RESPONSE_INVALID' && !error.message.includes(input || 'No JSON')));
}
