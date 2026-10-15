export function writingRequest(query, body) {
  const positive = (value) => Number.isSafeInteger(value) && value > 0;
  if (body === undefined) {
    const mode = query.get('mode');
    if (['overview', 'active', 'notebook'].includes(mode))
      return { method: 'GET', path: `/api/writing/${mode}` };
    const id = Number(query.get('sessionId'));
    if (mode === 'session' && positive(id))
      return { method: 'GET', path: `/api/writing/sessions/${id}` };
    throw new Error('Invalid query');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new Error('Invalid body');
  const { action, ...payload } = body;
  const simple = {
    placement: 'placement',
    'start-session': 'sessions',
    'level-change': 'level-change',
    'review-notebook': 'notebook/review',
    'reset-progress': 'reset-progress',
  };
  let path = Object.hasOwn(simple, action) ? simple[action] : null;
  if (
    ['abandon', 'apply-promotion'].includes(action) &&
    positive(body.sessionId)
  )
    path = `sessions/${body.sessionId}/${action}`;
  if (
    ['reveal-hint', 'use-structure-guide', 'submit'].includes(action) &&
    positive(body.sessionId) &&
    positive(body.itemId)
  ) {
    const suffix =
      action === 'reveal-hint' && positive(body.hintId)
        ? `hints/${body.hintId}`
        : action === 'use-structure-guide'
          ? 'structure-guide'
          : action === 'submit'
            ? 'submit'
            : null;
    if (suffix)
      path = `sessions/${body.sessionId}/items/${body.itemId}/${suffix}`;
  }
  if (!path) throw new Error('Invalid action');
  return { method: 'POST', path: `/api/writing/${path}`, body: payload };
}
