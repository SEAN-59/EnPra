import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const jsx = require('react/jsx-runtime');
const tick = () => new Promise(setImmediate);
function load(file, dependencies = {}, globals = {}) {
  const output = ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const module = { exports: {} };
  runInNewContext(output, {
    exports: module.exports,
    require(name) {
      if (name === 'react/jsx-runtime') return jsx;
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
    Error,
    Intl,
    Date,
    ...globals,
  });
  return module.exports;
}
const core = load('../lib/voca-learning.ts', {}, { AbortSignal });
const overview = () => ({
  preferences: {
    studyCount: 20,
    testCount: 20,
    firstSide: 'english',
    testType: 'mixed',
  },
  lists: [
    {
      id: 1,
      title: 'My words',
      scope: 'personal',
      wordCount: 8,
      studiedCount: 0,
      knownCount: 0,
      neededCount: 0,
    },
  ],
  totals: { total: 8, known: 0, needed: 0, studied: 0, tests: 0 },
  activity: [],
  sessions: [],
});
const session = (kind = 'study', overrides = {}) => ({
  id: 10,
  listId: 1,
  kind,
  scope: 'all',
  status: 'in_progress',
  firstSide: 'english',
  testType: 'mixed',
  total: 8,
  answered: 0,
  current:
    kind === 'study'
      ? {
          id: 1,
          word: 'apple',
          pronunciationIpa: '/apple/',
          meanings: [{ partOfSpeech: 'n', text: '사과' }],
        }
      : { id: 1, format: 'english_to_korean', prompt: 'apple' },
  result: null,
  ...overrides,
});
function harness(respond = async () => overview(), search = '') {
  const state = [];
  const refs = new Map();
  const dependencies = new Map();
  const effects = [];
  const requests = [];
  const history = [];
  let index = 0;
  const components = load(
    '../components/voca-learning.tsx',
    {
      react: {
        useState(initial) {
          const slot = index++;
          if (!(slot in state))
            state[slot] = typeof initial === 'function' ? initial() : initial;
          return [
            state[slot],
            (value) => {
              state[slot] =
                typeof value === 'function' ? value(state[slot]) : value;
            },
          ];
        },
        useRef(initial) {
          const slot = index++;
          if (!refs.has(slot)) refs.set(slot, { current: initial });
          return refs.get(slot);
        },
        useEffect(effect, deps) {
          const slot = index++;
          const previous = dependencies.get(slot);
          if (
            !previous ||
            deps.some((value, i) => !Object.is(value, previous[i]))
          ) {
            effects.push(effect);
            dependencies.set(slot, deps);
          }
        },
      },
      'lucide-react': new Proxy(
        {},
        { get: () => () => React.createElement('span') },
      ),
      '@/components/voca-settings': {
        VocaSettings: () => React.createElement('button', null, '학습 설정'),
      },
      '@/lib/voca-learning': {
        ...core,
        async vocaRequest(query, body) {
          const request = { query, body };
          requests.push(request);
          return respond(request);
        },
      },
    },
    {
      URLSearchParams,
      window: {
        location: { search },
        history: {
          replaceState(...args) {
            history.push(args[2]);
          },
        },
        confirm: () => true,
      },
    },
  );
  return {
    requests,
    history,
    render(name = 'VocaWorkspace', props = { kind: 'study' }) {
      index = 0;
      return components[name](props);
    },
    async flush() {
      for (const effect of effects.splice(0)) effect();
      await tick();
      await tick();
    },
  };
}
function find(node, predicate) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return null;
  }
  if (predicate(node)) return node;
  if (typeof node.type === 'function')
    return find(node.type(node.props), predicate);
  return find(node.props?.children, predicate);
}
function text(node) {
  if (node === null || node === undefined || typeof node === 'boolean')
    return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  return text(node.props?.children);
}
function button(tree, label) {
  const node = find(
    tree,
    (node) => node.type === 'button' && text(node) === label,
  );
  assert.ok(node, `Missing ${label}`);
  return node;
}
async function ready(h, name = 'VocaWorkspace', props = { kind: 'study' }) {
  for (let i = 0; i < 3; i++) {
    h.render(name, props);
    await h.flush();
  }
  return h.render(name, props);
}
const markup = (tree) => renderToStaticMarkup(tree);

function proxy(user = { userId: 'fixture-user', displayName: 'Fixture' }) {
  const requests = [];
  const api = load(
    '../app/api/vocabulary/learning/route.ts',
    {
      '@/app/chatgpt-auth': { getChatGPTUser: async () => user },
    },
    {
      process: {
        env: {
          ENPRA_BRIDGE_URL: 'https://fixture.invalid',
          ENPRA_BRIDGE_SERVICE_TOKEN: 'test-only-placeholder',
        },
      },
      Response,
      AbortSignal,
      fetch: async (url, options) => {
        requests.push({ url, options });
        return Response.json({ session: { id: 1 } });
      },
    },
  );
  return { ...api, requests };
}
test('Voca proxy refuses unauthenticated requests without contacting the bridge', async () => {
  const api = proxy(null);
  const response = await api.GET({
    nextUrl: new URL('https://fixture/?mode=overview'),
  });
  assert.equal(response.status, 401);
  assert.equal(api.requests.length, 0);
});
test('Voca proxy routes valid submissions using the authenticated identity', async () => {
  const api = proxy();
  const response = await api.POST({
    json: async () => ({
      action: 'respond',
      sessionId: 12,
      wordId: 4,
      known: true,
      userId: 'forged',
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(
    api.requests[0].url,
    'https://fixture.invalid/api/vocabulary/learning/sessions/12/respond',
  );
  assert.equal(
    api.requests[0].options.headers['X-EnPra-User-Id'],
    'fixture-user',
  );
  assert.ok(api.requests[0].options.signal);
});
test('Voca proxy rejects arrays and invalid session identifiers before forwarding', async () => {
  const api = proxy();
  for (const body of [
    null,
    [],
    { action: 'respond', sessionId: true },
    { action: 'respond', sessionId: -1 },
  ]) {
    assert.equal((await api.POST({ json: async () => body })).status, 400);
  }
  assert.equal(api.requests.length, 0);
});
test('Voca proxy routes settings, list reset and numeric session retrieval', async () => {
  const api = proxy();
  assert.equal(
    (
      await api.POST({
        json: async () => ({
          action: 'settings',
          studyCount: 20,
          testCount: 20,
          firstSide: 'english',
          testType: 'mixed',
        }),
      })
    ).status,
    200,
  );
  assert.equal(
    (await api.POST({ json: async () => ({ action: 'reset', listId: 4 }) }))
      .status,
    200,
  );
  assert.equal(
    (
      await api.GET({
        nextUrl: new URL('https://fixture/?mode=session&sessionId=12'),
      })
    ).status,
    200,
  );
  assert.ok(api.requests[0].url.endsWith('/settings'));
  assert.ok(api.requests[1].url.endsWith('/lists/4/reset'));
  assert.ok(api.requests[2].url.endsWith('/sessions/12'));
});

test('Voca board uses real counters, not prior sample statistics', async () => {
  const data = overview();
  data.totals.known = 2;
  data.totals.studied = 4;
  const h = harness(async () => data);
  const html = markup(await ready(h, 'VocaBoard', {}));
  assert.match(html, /알아요 2개/);
  assert.match(html, /확인한 단어 4개/);
  assert.ok(!html.includes('184'));
  assert.match(html, /\/voca\/practice/);
});
test('Voca initial request error exposes retry, which recovers the screen', async () => {
  let failed = true;
  const h = harness(async () => {
    if (failed) throw new Error('offline');
    return overview();
  });
  const tree = await ready(h);
  assert.match(markup(tree), /offline/);
  failed = false;
  button(tree, '다시 불러오기').props.onClick();
  await h.flush();
  assert.match(markup(h.render()), /카드 학습 시작하기/);
});
test('Voca empty account offers list management, not a fake study session', async () => {
  const data = overview();
  data.lists = [];
  const h = harness(async () => data);
  const tree = await ready(h);
  assert.match(markup(tree), /먼저 단어장을 추가/);
  assert.equal(
    find(
      tree,
      (node) => node.type === 'button' && text(node) === '카드 학습 시작하기',
    ),
    null,
  );
});
test('Voca new scope count excludes studied words and respects 100-word bound', () => {
  const data = overview();
  const list = {
    ...data.lists[0],
    wordCount: 400,
    studiedCount: 40,
    neededCount: 8,
  };
  assert.equal(core.vocaScopeCount(data, list, 'new'), 360);
  assert.equal(core.vocaScopeCount(data, list, 'needed'), 8);
});
test('Voca starts selected list with actual remaining count and chosen first side', async () => {
  const h = harness(
    async (request) =>
      request.body
        ? { session: session('study', { firstSide: request.body.firstSide }) }
        : overview(),
    '?list=1',
  );
  let tree = await ready(h);
  const selects = [];
  find(tree, (node) => {
    if (node.type === 'select') selects.push(node);
    return false;
  });
  selects[2].props.onChange({ target: { value: 'korean' } });
  tree = h.render();
  find(tree, (node) => node.type === 'form').props.onSubmit({
    preventDefault() {},
  });
  await h.flush();
  const body = h.requests.find(
    (request) => request.body?.action === 'start',
  ).body;
  assert.equal(body.count, 8);
  assert.equal(body.listId, 1);
  assert.equal(body.firstSide, 'korean');
  const html = markup(h.render());
  assert.match(html, /사과/);
  assert.match(
    text(
      find(
        h.render(),
        (node) =>
          node.props?.className?.includes('voca-card-face') &&
          node.props['aria-hidden'] === false,
      ),
    ),
    /사과/,
  );
  assert.match(h.history.at(-1), /sessionId=10/);
});
test('Voca restarting a completed small test bounds the default even when availability is unchanged', async () => {
  const done = session('test', {
    status: 'completed',
    current: null,
    answered: 8,
    result: { known: 0, needed: 0, correct: 8, score: 100, items: [] },
  });
  const h = harness(async (request) => {
    if (request.body?.action === 'start') return { session: session('test') };
    return request.query.includes('sessionId') ? { session: done } : overview();
  }, '?sessionId=10');
  const props = { kind: 'test' };
  button(await ready(h, 'VocaWorkspace', props), '다른 테스트 시작하기').props.onClick();
  await h.flush();
  const tree = await ready(h, 'VocaWorkspace', props);
  assert.equal(find(tree, (node) => node.props?.type === 'number').props.value, 8);
  assert.equal(button(tree, '테스트 시작하기').props.disabled, false);
  find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await h.flush();
  assert.equal(h.requests.find((request) => request.body?.action === 'start').body.count, 8);
});
for (const kind of ['study', 'test']) {
  test(`Voca ${kind} settings bound a new default to the selected range without overriding manual edits`, async () => {
    const h = harness(async (request) => request.body?.action === 'settings'
      ? { preferences: request.body }
      : overview());
    const props = { kind };
    let tree = await ready(h, 'VocaWorkspace', props);
    await find(tree, (node) => typeof node.props?.onSave === 'function').props.onSave({
      ...overview().preferences,
      studyCount: 30,
      testCount: 30,
    });
    tree = await ready(h, 'VocaWorkspace', props);
    assert.equal(find(tree, (node) => node.props?.type === 'number').props.value, 8);
    const startLabel = kind === 'study' ? '카드 학습 시작하기' : '테스트 시작하기';
    assert.equal(button(tree, startLabel).props.disabled, false);
    find(tree, (node) => node.props?.type === 'number').props.onChange({ target: { value: '4' } });
    tree = await ready(h, 'VocaWorkspace', props);
    assert.equal(find(tree, (node) => node.props?.type === 'number').props.value, 4);
    assert.equal(button(tree, startLabel).props.disabled, false);
    find(tree, (node) => node.props?.type === 'number').props.onChange({ target: { value: '0' } });
    tree = await ready(h, 'VocaWorkspace', props);
    assert.equal(find(tree, (node) => node.props?.type === 'number').props.value, 0);
    assert.equal(button(tree, startLabel).props.disabled, true);
  });
}
test('Voca keeps the 100-word cap and zero-availability scopes disabled, then recovers on scope change', async () => {
  const data = overview();
  data.preferences.testCount = 100;
  data.lists[0].wordCount = 400;
  const h = harness(async (request) => request.body?.action === 'settings'
    ? { preferences: request.body }
    : data);
  const props = { kind: 'test' };
  let tree = await ready(h, 'VocaWorkspace', props);
  assert.equal(find(tree, (node) => node.props?.type === 'number').props.value, 100);
  const chooseScope = (tree, value) => find(tree,
    (node) => node.type === 'select' && node.props.value === (value === 'needed' ? 'all' : 'needed'),
  ).props.onChange({ target: { value } });
  chooseScope(tree, 'needed');
  tree = await ready(h, 'VocaWorkspace', props);
  await find(tree, (node) => typeof node.props?.onSave === 'function').props.onSave({
    ...data.preferences,
    testCount: 30,
  });
  tree = await ready(h, 'VocaWorkspace', props);
  assert.equal(find(tree, (node) => node.props?.type === 'number').props.value, 30);
  assert.equal(button(tree, '테스트 시작하기').props.disabled, true);
  assert.match(markup(tree), /선택한 범위에 단어가 없어요/);
  chooseScope(tree, 'all');
  tree = await ready(h, 'VocaWorkspace', props);
  assert.equal(find(tree, (node) => node.props?.type === 'number').props.value, 30);
  assert.equal(button(tree, '테스트 시작하기').props.disabled, false);
});
test('Voca card click flips English to meaning without submitting', async () => {
  const h = harness(
    async (request) =>
      request.query.includes('sessionId') ? { session: session() } : overview(),
    '?sessionId=10',
  );
  let tree = await ready(h);
  assert.match(markup(tree), /apple/);
  find(
    tree,
    (node) => node.props?.['aria-label'] === '카드 뒤집어 확인하기',
  ).props.onClick();
  tree = h.render();
  assert.match(
    text(
      find(
        tree,
        (node) =>
          node.props?.className?.includes('voca-card-face') &&
          node.props['aria-hidden'] === false,
      ),
    ),
    /사과/,
  );
  assert.equal(
    find(tree, (node) => node.props?.className === 'voca-card-turn').props[
      'data-flipped'
    ],
    true,
  );
  assert.equal(
    find(tree, (node) => node.props?.['aria-label'] === '카드 첫 면 보기')
      .props['aria-pressed'],
    true,
  );
  assert.equal(h.requests.filter((request) => request.body).length, 0);
  find(
    tree,
    (node) => node.props?.['aria-label'] === '카드 첫 면 보기',
  ).props.onClick({ detail: 0 });
  assert.equal(
    find(h.render(), (node) => node.props?.className === 'voca-card-turn')
      .props['data-flipped'],
    false,
  );
});
for (const direction of ['left', 'right'])
  test(`Voca ${direction} swipe records correct self-reported status once`, async () => {
    const h = harness(
      async (request) =>
        request.body
          ? {
              session: session('study', {
                answered: 1,
                current: { ...session().current, id: 2, word: 'orange' },
              }),
            }
          : request.query.includes('sessionId')
            ? { session: session() }
            : overview(),
      '?sessionId=10',
    );
    const tree = await ready(h);
    const card = find(
      tree,
      (node) => node.props?.['aria-label'] === '카드 뒤집어 확인하기',
    );
    card.props.onPointerDown({
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      currentTarget: { setPointerCapture() {} },
    });
    card.props.onPointerUp({
      clientX: direction === 'left' ? 20 : 180,
      clientY: 100,
    });
    card.props.onClick();
    await h.flush();
    const requests = h.requests.filter(
      (request) => request.body?.action === 'respond',
    );
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.known, direction === 'right');
    assert.match(markup(h.render()), /orange/);
  });
test('Voca vertical scroll or small drag never records knowledge', async () => {
  const h = harness(
    async (request) =>
      request.query.includes('sessionId') ? { session: session() } : overview(),
    '?sessionId=10',
  );
  const card = find(
    await ready(h),
    (node) => node.props?.['aria-label'] === '카드 뒤집어 확인하기',
  );
  for (const point of [
    [110, 200],
    [130, 100],
  ]) {
    card.props.onPointerDown({
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      currentTarget: { setPointerCapture() {} },
    });
    card.props.onPointerUp({ clientX: point[0], clientY: point[1] });
    card.props.onClick();
    assert.equal(
      find(h.render(), (node) => node.props?.className === 'voca-card-turn')
        .props['data-flipped'],
      false,
    );
  }
  await h.flush();
  assert.equal(
    h.requests.filter((request) => request.body?.action === 'respond').length,
    0,
  );
});
test('Voca mouse drag follows pointer and cancellation returns card without saving', async () => {
  const h = harness(
    async (request) =>
      request.query.includes('sessionId') ? { session: session() } : overview(),
    '?sessionId=10',
  );
  const card = find(
    await ready(h),
    (node) => node.props?.['aria-label'] === '카드 뒤집어 확인하기',
  );
  card.props.onPointerDown({
    button: 0,
    clientX: 100,
    clientY: 100,
    pointerId: 1,
    currentTarget: { setPointerCapture() {} },
  });
  card.props.onPointerMove({ clientX: 180, clientY: 100 });
  let current = find(
    h.render(),
    (node) => node.props?.['aria-label'] === '카드 뒤집어 확인하기',
  );
  assert.match(current.props.style.transform, /translateX\(80px\) rotate/);
  assert.equal(current.props['data-dragging'], true);
  card.props.onPointerCancel();
  card.props.onPointerUp({ clientX: 180, clientY: 100 });
  card.props.onClick();
  current = find(
    h.render(),
    (node) => node.props?.['aria-label'] === '카드 뒤집어 확인하기',
  );
  assert.equal(current.props.style.transform, undefined);
  assert.equal(current.props['data-dragging'], false);
  assert.equal(h.requests.filter((request) => request.body).length, 0);
  // The next real click still flips after a cancelled gesture.
  card.props.onPointerDown({
    button: 0,
    clientX: 100,
    clientY: 100,
    pointerId: 2,
    currentTarget: { setPointerCapture() {} },
  });
  card.props.onPointerUp({ clientX: 100, clientY: 100 });
  card.props.onClick();
  assert.equal(
    find(h.render(), (node) => node.props?.className === 'voca-card-turn')
      .props['data-flipped'],
    true,
  );
});
test('Voca two quick button clicks send one mutation', async () => {
  let finish;
  const h = harness(
    async (request) =>
      request.body
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : request.query.includes('sessionId')
          ? { session: session() }
          : overview(),
    '?sessionId=10',
  );
  const tree = await ready(h);
  const known = button(tree, '알아요 ');
  known.props.onClick();
  known.props.onClick();
  assert.equal(
    h.requests.filter((request) => request.body?.action === 'respond').length,
    1,
  );
  finish({ session: session('study', { answered: 1 }) });
  await h.flush();
});
test('Voca failed save keeps the same card and allows retry', async () => {
  const h = harness(async (request) => {
    if (request.body) throw new Error('save failed');
    return request.query.includes('sessionId')
      ? { session: session() }
      : overview();
  }, '?sessionId=10');
  button(await ready(h), '아직 몰라요').props.onClick();
  await h.flush();
  const tree = h.render();
  assert.match(markup(tree), /save failed/);
  assert.match(markup(tree), /apple/);
  assert.equal(button(tree, '아직 몰라요').props.disabled, false);
});
for (const format of [
  'english_to_korean',
  'korean_to_english',
  'english_choice',
  'korean_choice',
])
  test(`Voca renders ${format} input and hides unfinished score`, async () => {
    const current = {
      id: 1,
      format,
      prompt: format.startsWith('english') ? 'apple' : '사과',
      ...(format.endsWith('choice')
        ? {
            choices: ['A', 'B', 'C', 'D'].map((key) => ({
              key,
              label: `option ${key}`,
            })),
          }
        : {}),
    };
    const h = harness(
      async (request) =>
        request.query.includes('sessionId')
          ? { session: session('test', { current }) }
          : overview(),
      '?sessionId=10',
    );
    const tree = await ready(h, 'VocaWorkspace', { kind: 'test' });
    const html = markup(tree);
    assert.match(html, new RegExp(core.vocaTestLabels[format]));
    assert.equal(
      Boolean(
        find(
          tree,
          (node) => node.type === 'input' && node.props.type === 'radio',
        ),
      ),
      format.endsWith('choice'),
    );
    assert.equal(
      Boolean(
        find(
          tree,
          (node) => node.type === 'input' && node.props.type === 'text',
        ),
      ),
      !format.endsWith('choice'),
    );
    assert.ok(!html.includes('점'));
    assert.ok(button(tree, '제출하고 다음 문제').props.disabled);
  });
test('Voca completed study links the exact session to a following test', async () => {
  const done = session('study', {
    status: 'completed',
    current: null,
    answered: 8,
    result: {
      known: 6,
      needed: 2,
      correct: 0,
      score: null,
      items: [
        {
          id: 1,
          word: 'apple',
          meanings: [{ partOfSpeech: 'n', text: '사과' }],
          known: false,
        },
      ],
    },
  });
  const h = harness(
    async (request) =>
      request.query.includes('sessionId') ? { session: done } : overview(),
    '?sessionId=10',
  );
  const tree = await ready(h);
  const link = find(
    tree,
    (node) => node.type === 'a' && text(node) === '이번 단어로 테스트',
  );
  assert.equal(link.props.href, '/voca/test?list=1&sourceSessionId=10');
  assert.match(markup(tree), /알아요 6개/);
  assert.ok(!markup(tree).includes('0점'));
});
test('Voca completed test shows incorrect words and full results can be expanded', async () => {
  const done = session('test', {
    status: 'completed',
    current: null,
    answered: 2,
    total: 2,
    result: {
      known: 0,
      needed: 0,
      correct: 1,
      score: 50,
      items: [
        {
          id: 1,
          word: 'apple',
          meanings: [{ partOfSpeech: 'n', text: '사과' }],
          correct: true,
          answer: '사과',
        },
        {
          id: 2,
          word: 'orange',
          meanings: [{ partOfSpeech: 'n', text: '오렌지' }],
          correct: false,
          answer: '사과',
        },
      ],
    },
  });
  const h = harness(
    async (request) =>
      request.query.includes('sessionId') ? { session: done } : overview(),
    '?sessionId=10',
  );
  let tree = await ready(h, 'VocaWorkspace', { kind: 'test' });
  assert.match(markup(tree), /50점/);
  assert.match(markup(tree), /orange/);
  assert.ok(!markup(tree).includes('apple'));
  button(tree, '전체 결과 보기').props.onClick();
  tree = h.render('VocaWorkspace', { kind: 'test' });
  assert.match(markup(tree), /apple/);
});
test('Voca navigation uses real practice/test routes and one active tab', () => {
  const { StudySubnav } = load('../components/study-subnav.tsx');
  const html = markup(StudySubnav({ activeItem: 'TEST' }));
  assert.match(html, /href="\/voca\/practice"/);
  assert.match(html, /href="\/voca\/test" aria-current="page"/);
  assert.equal((html.match(/aria-current/g) || []).length, 1);
});
