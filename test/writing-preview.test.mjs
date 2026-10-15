import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writingRequest } from './writing-preview/routing.mjs';
test('local Writing preview maps real page requests and refuses malformed IDs', () => {
  assert.equal(
    writingRequest(new URLSearchParams('mode=overview')).path,
    '/api/writing/overview',
  );
  assert.equal(
    writingRequest(new URLSearchParams('mode=session&sessionId=12')).path,
    '/api/writing/sessions/12',
  );
  for (const action of [
    'placement',
    'start-session',
    'review-notebook',
    'reset-progress',
  ])
    assert.equal(writingRequest(null, { action }).method, 'POST');
  assert.deepEqual(
    writingRequest(null, {
      action: 'submit',
      sessionId: 2,
      itemId: 3,
      answer: 'Hello.',
    }),
    {
      method: 'POST',
      path: '/api/writing/sessions/2/items/3/submit',
      body: { sessionId: 2, itemId: 3, answer: 'Hello.' },
    },
  );
  assert.equal(
    writingRequest(null, {
      action: 'reveal-hint',
      sessionId: 2,
      itemId: 3,
      hintId: 4,
    }).path,
    '/api/writing/sessions/2/items/3/hints/4',
  );
  for (const value of [
    { action: 'submit', sessionId: -1, itemId: 3 },
    { action: 'reveal-hint', sessionId: 2, itemId: 3, hintId: '4' },
    [],
    null,
    { action: 'unexpected' },
  ])
    assert.throws(() => writingRequest(null, value));
  assert.throws(() =>
    writingRequest(new URLSearchParams('mode=session&sessionId=../secret')),
  );
});
