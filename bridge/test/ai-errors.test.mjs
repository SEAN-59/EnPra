import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeAiFailure } from '../dist/ai-errors.js';
import { AiResponseError } from '../dist/ai-json.js';
import { CodexRequestError } from '../dist/codex.js';

test('safe diagnostic fields exclude raw error, tokens and learner text', () => {
  const error = new CodexRequestError('sensitive learner answer and SECRET_TOKEN', {
    code: -32000,
    codexErrorInfo: { responseStreamConnectionFailed: { httpStatusCode: 503, secret: 'SECRET_TOKEN' } },
    additionalDetails: 'sensitive learner answer and SECRET_TOKEN',
  });
  const result = describeAiFailure(error);
  assert.equal(result.status, 502);
  assert.equal(result.metadata.rpcCode, -32000);
  assert.equal(result.metadata.codexErrorCategory, 'ResponseStreamConnectionFailed');
  assert.equal(result.metadata.httpStatusCode, 503);
  assert.equal(result.metadata.additionalDetailsPresent, true);
  assert.doesNotMatch(JSON.stringify(result), /SECRET_TOKEN|sensitive learner answer/);
});

for (const [code, info, status] of [
  [undefined, 'Unauthorized', 409],
  [undefined, 'usageLimitExceeded', 429],
  [undefined, { httpConnectionFailed: { httpStatusCode: 429 } }, 429],
  ['CODEX_REQUEST_TIMEOUT', undefined, 504],
  ['CODEX_TURN_TIMEOUT', undefined, 504],
  ['CODEX_SERVER_STOPPED', undefined, 503],
  ['CODEX_STRUCTURED_OUTPUT_AMBIGUOUS', undefined, 502],
]) {
  test(`maps ${code ?? JSON.stringify(info)}`, () => {
    assert.equal(describeAiFailure(new CodexRequestError('private', { code, codexErrorInfo: info })).status, status);
  });
}

test('invalid JSON has a safe, actionable error', () => assert.equal(describeAiFailure(new AiResponseError()).status, 502));
test('unknown error contents are not returned', () => {
  const result = describeAiFailure(new Error('postgres connection secret'));
  assert.equal(result.status, 500);
  assert.doesNotMatch(JSON.stringify(result), /postgres connection secret/);
});
