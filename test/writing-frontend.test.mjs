import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const jsx = require('react/jsx-runtime');
const tick = () => new Promise(setImmediate);
const stages = [
  'foundation',
  '5.0A',
  '5.0B',
  '5.0C',
  '5.0D',
  '5.5A',
  '5.5B',
  '6.0A',
  '6.0B',
  '6.5A',
  '6.5B',
  '7.0A',
  '7.0B',
];

function load(relativePath, dependencies, globals = {}) {
  const path = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };
  runInNewContext(
    outputText,
    {
      exports: module.exports,
      require(name) {
        if (name === 'react/jsx-runtime') return jsx;
        if (name in dependencies) return dependencies[name];
        throw new Error(`Unexpected test dependency: ${name}`);
      },
      ...globals,
    },
    { filename: path.pathname },
  );
  return module.exports;
}

function Button(props) {
  const buttonProps = { ...props };
  delete buttonProps.variant;
  delete buttonProps.size;
  return React.createElement('button', buttonProps);
}
const Icon = (props) => React.createElement('span', props);
const noop = () => {};
const charts = new Proxy(
  {},
  { get: () => (props) => React.createElement('div', null, props.children) },
);
const { WritingMaterial } = load('../components/writing-material.tsx', {
  recharts: charts,
});
const { WritingSubnav } = load('../components/writing-subnav.tsx', {});

function client(initialState = [], respond = async () => ({ data: {} })) {
  const state = initialState.slice();
  const refs = new Map();
  const dependencies = new Map();
  const effects = [];
  const requests = [];
  const navigation = [];
  const timers = new Map();
  let index = 0;
  let renderingChildren = false;
  let response = respond;
  const components = load(
    '../components/writing-client.tsx',
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
          if (renderingChildren) return;
          const previous = dependencies.get(slot);
          if (
            !previous ||
            deps.some(
              (value, depIndex) => !Object.is(value, previous[depIndex]),
            )
          ) {
            effects.push(effect);
            dependencies.set(slot, deps);
          }
        },
      },
      'next/navigation': {
        useRouter: () => ({
          push: (path) => navigation.push(path),
          replace: (path) => navigation.push(path),
        }),
      },
      '@/components/ui/button': { Button },
      '@/components/use-document-scroll-lock': { useDocumentScrollLock: noop },
      '@/components/writing-material': { WritingMaterial },
      'lucide-react': new Proxy({}, { get: () => Icon }),
    },
    {
      window: {setInterval(fn) {const id=timers.size+1;timers.set(id,fn);return id;},clearInterval(id){timers.delete(id);}},
      fetch: async (url, options) => {
        const request = {
          url,
          body: options?.body ? JSON.parse(options.body) : null,
        };
        requests.push(request);
        const result = await response(request);
        return { ok: result.ok ?? true, json: async () => result.data };
      },
    },
  );
  return {
    requests,
    navigation,
    timers,
    setResponse(next) {
      response = next;
    },
    render(name, props = {}) {
      index = 0;
      return components[name](props);
    },
    markup(tree) {
      renderingChildren = true;
      try {
        return renderToStaticMarkup(tree);
      } finally {
        renderingChildren = false;
      }
    },
    async runEffects() {
      for (const effect of effects.splice(0)) effect();
      await tick();
    },
  };
}

function text(node) {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  return text(node.props?.children);
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = find(child, predicate);
      if (match) return match;
    }
    return null;
  }
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function button(tree, label) {
  const result = find(
    tree,
    (node) =>
      (node.type === Button || node.type === 'button') && text(node) === label,
  );
  assert.ok(result, `Button not found: ${label}`);
  return result;
}
function sessionState(
  session,
  { answer = '', sections = [], foundationAnswers = [], feedback = null } = {},
) {
  return [
    session,
    answer,
    sections,
    foundationAnswers,
    false,
    false,
    '',
    feedback,
  ];
}
const feedback = {
  effectiveScore: 90,
  label: 'pass',
  feedback: {
    correctedAnswer: 'VISIBLE LEARNING CORRECTION',
    errors: [],
    synonymGroups: [{ term: 'rise', alternatives: ['increase'], note: '증가 표현' }],
    usefulExpressions: [{ expression: 'stood at', meaning: '수치가 …였다', example: 'The figure stood at 40%.' }],
    improvedAnswer: 'Overview.\n\nDetails.',
    keyLearningPoints: ['비교 표현을 확인해요.'],
    nextFocus: 'Grammar',
  },
};

for (const stage of stages) {
  test(`completed ${stage} learning shows its feedback`, () => {
    const harness = client(
      sessionState(
        {
          type: 'learning',
          internalStage: stage,
          completed: true,
          currentItem: null,
        },
        { feedback },
      ),
    );
    const markup = harness.markup(
      harness.render('WritingSessionClient', { sessionId: 1 }),
    );
    assert.match(markup, /LEARNING FEEDBACK/);
    assert.match(markup, /VISIBLE LEARNING CORRECTION/);
    assert.match(markup, /stood at/);
    assert.match(markup, /increase/);
    assert.match(markup, /비교 표현을 확인해요/);
    assert.doesNotMatch(markup, /COMPLETED/);
    assert.match(markup, /Board로 돌아가기/);
  });
}

test('promotion warning retains the latest chosen target and force starts it', async () => {
  const harness = client(
    [
      {
        profile: { onboardingStatus: 'active', currentPublicLevel: '5.0' },
        activeSession: null,
        topSkills: [],
      },
      'promotion',
      null,
      '',
      false,
      '',
      null,
    ],
    async ({ body }) => ({
      data: body.force
        ? { sessionId: 42 }
        : { warning: true, message: '현재 단계 학습 권장' },
    }),
  );
  button(harness.render('WritingPracticeClient'), '5.5').props.onClick();
  await tick();
  button(harness.render('WritingPracticeClient'), '6.0').props.onClick();
  await tick();
  const force = button(harness.render('WritingPracticeClient'), '그래도 시작');
  assert.equal(force.props.disabled, false);
  await force.props.onClick();
  assert.deepEqual(
    harness.requests.map(({ body }) => [
      body.targetPublicLevel,
      Boolean(body.force),
    ]),
    [
      ['5.5', false],
      ['6.0', false],
      ['6.0', true],
    ],
  );
  assert.deepEqual(harness.navigation, ['/writing/session/42']);
});

for (const name of [
  'WritingBoardClient',
  'WritingPracticeClient',
  'WritingSessionClient',
]) {
  test(`${name} initial request failure is visible and can retry`, async () => {
    const harness = client([], async () => ({
      ok: false,
      data: { error: 'VISIBLE REQUEST FAILURE' },
    }));
    harness.render(name, { sessionId: 1 });
    await harness.runEffects();
    const failed = harness.render(name, { sessionId: 1 });
    const markup = harness.markup(failed);
    assert.match(markup, /VISIBLE REQUEST FAILURE/);
    assert.match(markup, /다시 시도/);
    assert.doesNotMatch(markup, /animate-spin/);
    harness.setResponse(async () => ({
      data:
        name === 'WritingSessionClient'
          ? {
              session: {
                type: 'test',
                completed: true,
                currentItem: null,
                results: [],
                averageScore: 80,
              },
            }
          : {
              profile: {
                onboardingStatus: 'active',
                currentPublicLevel: '6.0',
              },
              topSkills: [],
              activeSession: null,
            },
    }));
    await failed.props.retry();
    assert.doesNotMatch(
      harness.markup(harness.render(name, { sessionId: 1 })),
      /VISIBLE REQUEST FAILURE/,
    );
    assert.equal(harness.requests.length, 2);
  });
}

for (const type of ['test', 'placement_test', 'promotion_test']) {
  test(`unfinished ${type} submission accepts a hidden null result and shows the next question`, async () => {
    const initial = {
      type,
      status: 'in_progress',
      completed: false,
      expectedItemCount: type === 'promotion_test' ? 3 : 2,
      currentItem: {
        id: 11,
        order: 1,
        taskType: 'task1',
        question: { prompt: 'FIRST TEST QUESTION', material: {} },
      },
      results: [],
      averageScore: null,
      promotionScore: null,
      hints: [],
    };
    const next = {
      ...initial,
      completedItemCount: 1,
      currentItem: {
        id: 12,
        order: 2,
        taskType: type === 'promotion_test' ? 'task1' : 'task2',
        question: { prompt: 'NEXT TEST QUESTION', material: {} },
      },
    };
    const harness = client(
      sessionState(initial, {
        answer: 'An answer to the first test question.',
      }),
      async ({ body }) => {
        assert.equal(body.action, 'submit');
        assert.equal(body.itemId, 11);
        return { data: { submitted: true, result: null, session: next } };
      },
    );
    const first = harness.render('WritingSessionClient', { sessionId: 1 });
    assert.equal(button(first, '답안 제출').props.disabled, false);
    await button(first, '답안 제출').props.onClick();
    const after = harness.render('WritingSessionClient', { sessionId: 1 });
    const markup = harness.markup(after);
    assert.match(markup, /NEXT TEST QUESTION/);
    assert.doesNotMatch(
      markup,
      /FIRST TEST QUESTION|LEARNING FEEDBACK|최종 내부 점수|평균 .*점|role="alert"/,
    );
    assert.equal(button(after, '답안 제출').props.disabled, true);
    assert.equal(harness.requests.length, 1);
    assert.deepEqual(harness.navigation, []);
  });

  test(`completed ${type} exposes performance tier, all answers and feedback without numeric scores`, () => {
    const results = [
      {
        itemId: 11,
        order: 1,
        taskType: 'task1',
        answerText: 'FIRST ORIGINAL ANSWER',
        effectiveScore: 80,
        label: 'pass',
        feedback: { correctedAnswer: 'FIRST CORRECTION' },
      },
      {
        itemId: 12,
        order: 2,
        taskType: 'task2',
        answerText: 'SECOND ORIGINAL ANSWER',
        effectiveScore: 90,
        label: 'pass',
        feedback: { correctedAnswer: 'SECOND CORRECTION' },
      },
    ];
    const harness = client(
      sessionState({
        type,
        completed: true,
        currentItem: null,
        averageScore: 85,
        results,
      }),
    );
    const markup = harness.markup(
      harness.render('WritingSessionClient', { sessionId: 1 }),
    );
    for (const value of [
      '전체 결과',
      '잘했어요',
      '평가 기준 안내',
      'FIRST ORIGINAL ANSWER',
      'SECOND ORIGINAL ANSWER',
      'FIRST CORRECTION',
      'SECOND CORRECTION',
    ])
      assert.ok(markup.includes(value), value);
    assert.doesNotMatch(markup, /평균 .*점|최종 내부 점수|(?:80|85|90)점/);
  });
}

test('zero session average is shown as needs work, not missing or a numeric score', () => {
  const harness = client(
    sessionState({
      type: 'test',
      completed: true,
      currentItem: null,
      averageScore: 0,
      results: [],
    }),
  );
  const html = harness.markup(
    harness.render('WritingSessionClient', { sessionId: 1 }),
  );
  assert.match(html, /보완이 필요해요/);
  assert.doesNotMatch(html, /0점|평가 정보가 없어요/);
});

for (const [score, label] of [
  [0, '보완이 필요해요'],
  [59, '보완이 필요해요'],
  [60, '조금 더 다듬어요'],
  [77, '조금 더 다듬어요'],
  [78, '잘했어요'],
  [100, '잘했어요'],
]) {
  test(`Writing performance ${score} maps to a tier with an accessible criteria disclosure`, () => {
    const h = client(
      sessionState(
        { type: 'learning', completed: true, currentItem: null },
        { feedback: { ...feedback, effectiveScore: score } },
      ),
    );
    const html = h.markup(h.render('WritingSessionClient', { sessionId: 1 }));
    assert.match(html, new RegExp(label));
    assert.match(html, /<details/);
    assert.match(html, /aria-label="평가 기준 안내"/);
    assert.match(html, /학습 단계의 기준|사용한 힌트도 반영|공식 IELTS Band/);
    assert.doesNotMatch(html, /최종 내부 점수|\d+점/);
  });
}
test('Writing feedback separates actual alternatives, legacy Korean glosses and example sentences', () => {
  const h = client(
    sessionState(
      { type: 'learning', completed: true, currentItem: null },
      {
        feedback: {
          ...feedback,
          feedback: {
            synonyms: [
              'recorded = 나타냈다',
              'ranged from = …에서 …까지 분포했다',
              'stood at = …였다',
              'increase → rise (증가하다)',
            ],
            usefulExpressions: [
              'Country A recorded the highest rate, at 68%.',
              'The difference was 46 percentage points.',
            ],
          },
        },
      },
    ),
  );
  const html = h.markup(h.render('WritingSessionClient', { sessionId: 1 }));
  assert.match(
    html,
    /유의어·대체어[\s\S]*increase → rise[\s\S]*어휘·구문 뜻[\s\S]*recorded = 나타냈다[\s\S]*활용 표현·예문[\s\S]*Country A/,
  );
  assert.doesNotMatch(html, /유의어 · 표현/);
  assert.equal((html.match(/Country A recorded/g) ?? []).length, 1);
});
test('Writing malformed vocabulary arrays do not crash or render object strings', () => {
  const h = client(
    sessionState(
      { type: 'learning', completed: true, currentItem: null },
      {
        feedback: {
          ...feedback,
          feedback: {
            synonyms: 'invalid',
            usefulExpressions: [null, {}, 'USEFUL EXAMPLE'],
          },
        },
      },
    ),
  );
  const html = h.markup(h.render('WritingSessionClient', { sessionId: 1 }));
  assert.match(html, /USEFUL EXAMPLE/);
  assert.doesNotMatch(html, /\[object Object\]|유의어·대체어/);
});
test('Writing notebook has a tier and independent help control, not score or raw model label', () => {
  const h = client([
    [
      {
        id: 1,
        title: 'Notebook fixture',
        taskType: 'task1',
        score: 6,
        label: 'needs_practice',
        errorCount: 1,
      },
    ],
    null,
    null,
    false,
    '',
    '',
  ]);
  const html = h.markup(h.render('WritingNotebookClient'));
  assert.match(html, /보완이 필요해요|평가 기준 안내/);
  assert.doesNotMatch(html, /내 점수|6점|needs_practice/);
  assert.doesNotMatch(html, /<button[^>]*>[\s\S]*?<summary[\s\S]*?<\/button>/);
});
test('Writing grading prompt distinguishes English alternatives from Korean meanings', () => {
  const source = readFileSync(
    new URL('../bridge/src/writing.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /synonymGroups에는 실제 영어 유의어·대체어 쌍만/);
  assert.match(source, /영어 단어 = 한국어 뜻은 유의어가 아니므로/);
  assert.match(source, /usefulExpressions에는 활용 구문과 한국어 뜻/);
});
test('Writing notebook shows formatted first-pass feedback immediately with no review button or AI request', () => {
  const entry = {
    id: 1,
    title: 'Formatted notebook',
    taskType: 'task1',
    score: 90,
    errorCount: 1,
    answer: 'My answer',
    feedback: {
      correctedAnswer: 'My corrected answer.',
      errors: [],
      synonymGroups: [
        { term: 'increase', alternatives: ['rise'], note: '증가' },
      ],
      usefulExpressions: [
        {
          expression: 'stood at',
          meaning: '수치가 …였다',
          example: 'The figure stood at 40%.',
        },
      ],
      improvedAnswer: 'OVERVIEW CONTENT\n\nDETAIL CONTENT',
      keyLearningPoints: ['KEY LEARNING'],
      nextFocus: 'NEXT GOAL',
    },
  };
  const h = client([[entry], 1, null, '']);
  const html = h.markup(h.render('WritingNotebookClient'));
  for (const value of [
    '유의어·대체어',
    'increase',
    'rise',
    '활용 표현·예문',
    'stood at',
    '수치가 …였다',
    'The figure stood at',
    '문단 1',
    '문단 2',
    'OVERVIEW CONTENT',
    'DETAIL CONTENT',
    'KEY LEARNING',
    'NEXT GOAL',
  ])
    assert.ok(html.includes(value), value);
  assert.doesNotMatch(
    html,
    /AI 검수|검수 완료|AI NOTE REVIEW|AI REVIEWED FEEDBACK/,
  );
  assert.equal(h.requests.length, 0);
  assert.doesNotMatch(
    readFileSync(
      new URL('../components/writing-client.tsx', import.meta.url),
      'utf8',
    ),
    /action: 'review-notebook'/,
  );
});
test('Writing already-reviewed notebook paragraphs stay compatible without another AI step', () => {
  const h = client([
    [
      {
        id: 1,
        title: 'Old reviewed result',
        taskType: 'task1',
        score: 80,
        errorCount: 1,
        feedback: {
          correctedAnswer: 'CORRECTION',
          errors: [],
          synonymGroups: [],
          usefulExpressions: [],
          improvedAnswer: [{ label: 'Overview', text: 'OLD PARAGRAPH' }],
          keyLearningPoints: ['OLD POINT'],
        },
      },
    ],
    1,
    null,
    '',
  ]);
  const html = h.markup(h.render('WritingNotebookClient'));
  for (const value of ['CORRECTION', 'Overview', 'OLD PARAGRAPH', 'OLD POINT'])
    assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, /AI 검수|검수 완료/);
});

test('applying promotion blocks repeated clicks, reports failure and allows retry', async () => {
  let resolveRequest;
  const harness = client(
    sessionState({
      type: 'promotion_test',
      completed: true,
      currentItem: null,
      promotionRecommendation: 'ready',
      averageScore: 90,
      results: [],
    }),
    () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
  );
  const apply = button(
    harness.render('WritingSessionClient', { sessionId: 1 }),
    '승급 적용하기',
  );
  const first = apply.props.onClick();
  await apply.props.onClick();
  assert.equal(harness.requests.length, 1);
  assert.equal(
    button(
      harness.render('WritingSessionClient', { sessionId: 1 }),
      '승급 적용 중',
    ).props.disabled,
    true,
  );
  resolveRequest({ ok: false, data: { error: 'VISIBLE PROMOTION FAILURE' } });
  await first;
  const failed = harness.render('WritingSessionClient', { sessionId: 1 });
  assert.match(harness.markup(failed), /VISIBLE PROMOTION FAILURE/);
  assert.equal(button(failed, '승급 적용하기').props.disabled, false);
  assert.deepEqual(harness.navigation, []);
  harness.setResponse(async () => ({ data: { promoted: true } }));
  await button(failed, '승급 적용하기').props.onClick();
  assert.equal(harness.requests.length, 2);
  assert.deepEqual(harness.navigation, ['/writing']);
});

const foundationMaterial = {
  title: 'Library notice',
  content: 'FOUNDATION SOURCE: The library closes at six.',
  questions: [
    { prompt: 'When does it close?' },
    { prompt: 'Which place closes?' },
    { prompt: 'What can you borrow?' },
  ],
};
const foundationSession = {
  type: 'learning',
  completed: false,
  expectedItemCount: 1,
  hints: [],
  currentItem: {
    id: 7,
    order: 1,
    taskType: 'foundation',
    question: {
      prompt: 'Answer the three questions.',
      material: foundationMaterial,
    },
  },
};

test('hint content is revealed only after a successful durable usage response, and failure is retryable', async () => {
  const initial={...foundationSession,hints:[{id:3,order:1,type:'grammar',revealed:false}]};
  let respond;
  const harness=client(sessionState(initial),()=>new Promise(resolve=>{respond=resolve;}));
  const menu=()=>find(harness.render('WritingSessionClient',{sessionId:'10'}),node=>typeof node.props?.onReveal==='function');
  const pending=menu().props.onReveal(3);
  assert.equal(await menu().props.onReveal(3),false,'duplicate reveal waits for first request');
  assert.equal(menu().props.hints[0].revealed,false);
  assert.equal(menu().props.hints[0].content,undefined);
  respond({ok:false,data:{error:'usage write failed'}});
  assert.equal(await pending,false);
  assert.equal(menu().props.hints[0].revealed,false);
  harness.setResponse(async()=>({data:{content:'CONFIRMED HINT'}}));
  assert.equal(await menu().props.onReveal(3),true);
  assert.equal(menu().props.hints[0].revealed,true);
  assert.equal(menu().props.hints[0].content,'CONFIRMED HINT');
  const count=harness.requests.length;
  assert.equal(await menu().props.onReveal(3),true);
  assert.equal(harness.requests.length,count,'already revealed hint does not charge again');
});

for(const status of ['generating','submitted']) test(`${status} session waits instead of showing completion, and polls for recovery`, async()=>{
  const initial={...foundationSession,status:status==='generating'?'generating':'in_progress',currentItem:status==='generating'?null:{...foundationSession.currentItem,status}};
  const harness=client(sessionState(initial),async()=>({data:{session:initial}}));
  const render=()=>harness.render('WritingSessionClient',{sessionId:'10'});
  const html=harness.markup(render());
  assert.match(html,status==='generating'?/문제를 준비하고 있어요/:/답안을 채점하고 있어요/);
  assert.doesNotMatch(html,/SESSION COMPLETE/);
  await harness.runEffects();
  assert.equal(harness.timers.size,1);
  harness.setResponse(async()=>({data:{session:{...foundationSession,status:'in_progress'}}}));
  [...harness.timers.values()][0]();
  await tick();await tick();
  assert.match(harness.markup(render()),/Answer the three questions/);
});

test('legacy map missing geometry uses visible fallback coordinates and sizes instead of zero',()=>{
  const html=renderToStaticMarkup(React.createElement(WritingMaterial,{format:'map',material:{mapPanels:[{label:'Map',features:[{type:'building',label:'Library'}]}]}}));
  assert.match(html,/x="8"/);assert.match(html,/y="10"/);
  assert.match(html,/width="18"/);assert.match(html,/height="12"/);
});
for (const geometry of [
  { x: 20, y: 20, width: 60, height: 40 },
  { x: 0, y: 0, width: 100, height: 100 },
  { x: 98, y: 96, width: 2, height: 4 },
]) {
  test(`map preserves server-valid building geometry ${JSON.stringify(geometry)}`, () => {
    const html = renderToStaticMarkup(React.createElement(WritingMaterial, {
      format: 'map',
      material: { mapPanels: [{ label: 'Map', features: [{ type: 'building', label: 'Library', ...geometry }] }] },
    }));
    assert.match(html, new RegExp(`<rect x="${geometry.x}" y="${geometry.y}" width="${geometry.width}" height="${geometry.height}"`));
  });
}
test('map preserves label coordinates at the validated canvas boundary', () => {
  const html = renderToStaticMarkup(React.createElement(WritingMaterial, {
    format: 'map',
    material: { mapPanels: [{ label: 'Map', features: [{ type: 'label', label: 'East', x: 100, y: 100 }] }] },
  }));
  assert.match(html, /<text x="100" y="100"[^>]*>East<\/text>/);
});
for (const type of ['road', 'river', 'path']) {
  test(`map renders the ${type} label next to its actual polyline`, () => {
    const html = renderToStaticMarkup(React.createElement(WritingMaterial, {
      format: 'map',
      material: { mapPanels: [{ label: 'Map', features: [{ type, label: `Main ${type}`, points: [[10, 80], [40, 20], [90, 80]] }] }] },
    }));
    assert.match(html, /points="10,80 40,20 90,80"/);
    assert.match(html, new RegExp(`<text x="40" y="16"[^>]*>Main ${type}<\\/text>`));
  });
}
test('legacy map linear features keep visible fallback paths and labels', () => {
  const html = renderToStaticMarkup(React.createElement(WritingMaterial, {
    format: 'map',
    material: { mapPanels: [{ label: 'Map', features: [{ type: 'road', label: 'Old Road' }] }] },
  }));
  assert.match(html, /points="8,10 26,22"/);
  assert.match(html, /<text x="17" y="12"[^>]*>Old Road<\/text>/);
});

for (const answers of [
  ['', '', ''],
  [' ', '\n', '\t'],
  ['It closes at six.', '', 'Books.'],
]) {
  test(`Foundation requires all three actual answers: ${JSON.stringify(answers)}`, async () => {
    const harness = client(
      sessionState(foundationSession, { foundationAnswers: answers }),
    );
    const tree = harness.render('WritingSessionClient', { sessionId: 1 });
    const submit = button(tree, '답안 제출');
    assert.equal(submit.props.disabled, true);
    await submit.props.onClick();
    assert.equal(harness.requests.length, 0);
    if (answers.every((answer) => !answer.trim()))
      assert.match(
        harness.markup(tree),
        /0<!-- --> words · <!-- -->0<!-- --> chars|0 words · 0 chars/,
      );
  });
}

test('Foundation counts actual text and submits three sections with compatible full answer', async () => {
  const answers = [
    ' It closes at six. ',
    'The library closes.',
    ' You can borrow books.\n',
  ];
  const actualText = answers.map((answer) => answer.trim()).join('\n\n');
  const harness = client(
    sessionState(foundationSession, { foundationAnswers: answers }),
    async () => ({
      data: {
        result: feedback,
        session: { type: 'learning', completed: true, currentItem: null },
      },
    }),
  );
  const tree = harness.render('WritingSessionClient', { sessionId: 1 });
  const markup = harness.markup(tree).replace(/<!--.*?-->/g, '');
  assert.ok(
    markup.includes(
      `${actualText.split(/\s+/).length} words · ${[...actualText].length} chars`,
    ),
  );
  assert.equal(button(tree, '답안 제출').props.disabled, false);
  await button(tree, '답안 제출').props.onClick();
  assert.deepEqual(
    harness.requests[0].body.answerSections,
    answers.map((answer, index) => ({
      label: `Question ${index + 1}`,
      text: answer.trim(),
    })),
  );
  assert.match(
    harness.requests[0].body.answer,
    /Question 1: When does it close\?/,
  );
  assert.match(
    harness.markup(harness.render('WritingSessionClient', { sessionId: 1 })),
    /VISIBLE LEARNING CORRECTION/,
  );
});

for (const format of [
  'short_notice',
  'simple_schedule',
  'mini_table',
  'mini_data_card',
  'short_scenario',
  'simple_sequence',
]) {
  test(`Foundation notebook material displays source and prompts for ${format}`, () => {
    const markup = renderToStaticMarkup(
      React.createElement(WritingMaterial, {
        format,
        material: foundationMaterial,
      }),
    );
    assert.match(markup, /FOUNDATION SOURCE/);
    for (const question of foundationMaterial.questions)
      assert.ok(markup.includes(question.prompt));
  });
}

test('Task 1 table displays data and its separate unit', () => {
  const markup = renderToStaticMarkup(
    React.createElement(WritingMaterial, {
      format: 'table',
      material: {
        title: 'Annual sales',
        unit: 'millions USD',
        rows: [
          { label: 'North', value: 12 },
          { label: 'South', value: 18 },
        ],
      },
    }),
  );
  for (const value of ['North', 'South', '12', '18', 'millions USD'])
    assert.ok(markup.includes(value));
});

for (const [activeItem, href] of [
  ['BOARD', '/writing'],
  ['PRACTICE', '/writing/practice'],
  ['NOTEBOOK', '/writing/notebook'],
]) {
  test(`Writing navigation activates ${activeItem}`, () => {
    const markup = renderToStaticMarkup(
      React.createElement(WritingSubnav, { activeItem }),
    );
    const links = [
      ...markup.matchAll(/<a[^>]*href="([^"]+)"[^>]*class="([^"]+)"/g),
    ];
    const activeLinks = links.filter((match) =>
      match[2].includes('border-b-[#fffdf8]'),
    );
    assert.equal(activeLinks.length, 1);
    assert.equal(activeLinks[0][1], href);
    assert.equal((markup.match(/aria-current="page"/g) ?? []).length, 1);
    assert.ok(markup.includes(`href="${href}" aria-current="page"`));
  });
}
