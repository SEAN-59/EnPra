// Browser-only synthetic fixture. Never imported by application routes or builds.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { VocaBoard, VocaWorkspace } from '@/components/voca-learning';
import { StudySubnav } from '@/components/study-subnav';
import '@/app/globals.css';
const wordPairs = [
  ['apple', '사과'],
  ['orange', '오렌지'],
  ['river', '강'],
  ['mountain', '산'],
  ['harbor', '항구'],
  ['evidence', '증거'],
  ['policy', '정책'],
  ['improve', '개선하다'],
  ['compare', '비교하다'],
  ['sustain', '유지하다'],
  ['culture', '문화'],
  ['climate', '기후'],
];
const words = wordPairs.map(([word, meaning], index) => ({
  id: index + 1,
  word,
  pronunciationIpa: '/demo/',
  meanings: [{ partOfSpeech: 'n', text: meaning }],
}));
const key = 'enpra-voca-isolated-preview-v1';
let state = JSON.parse(sessionStorage.getItem(key) || 'null') || {
  preferences: {
    studyCount: 20,
    testCount: 20,
    firstSide: 'english',
    testType: 'mixed',
  },
  sessions: [],
  statuses: {},
};
const save = () => sessionStorage.setItem(key, JSON.stringify(state));
function serial(session) {
  const done = session.items.filter((item) => item.answeredAt),
    next = session.items.find((item) => !item.answeredAt);
  return {
    id: session.id,
    listId: 1,
    kind: session.kind,
    status: session.status,
    scope: session.scope,
    firstSide: session.firstSide,
    testType: session.testType,
    total: session.items.length,
    answered: done.length,
    current:
      session.status === 'in_progress'
        ? session.kind === 'study'
          ? next
          : {
              id: next.id,
              format: next.format,
              prompt: next.prompt,
              choices: next.choices,
            }
        : null,
    result:
      session.status === 'completed'
        ? {
            known: done.filter((item) => item.known).length,
            needed: done.filter((item) => item.known === false).length,
            correct: done.filter((item) => item.correct).length,
            score:
              session.kind === 'test'
                ? Math.round(
                    (done.filter((item) => item.correct).length / done.length) *
                      100,
                  )
                : null,
            items: done,
          }
        : null,
  };
}
function overview() {
  const activity = new Map();
  for (const session of state.sessions.filter((session) => session.kind === 'study')) {
    for (const item of session.items.filter((item) => item.answeredAt)) {
      const parts = new Intl.DateTimeFormat('en', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(item.answeredAt));
      const part = type => parts.find(value => value.type === type).value;
      const day = `${part('year')}-${part('month')}-${part('day')}`;
      activity.set(day, (activity.get(day) ?? 0) + 1);
    }
  }
  const seen = new Set(
    state.sessions
      .filter((session) => session.kind === 'study')
      .flatMap((session) =>
        session.items.filter((item) => item.answeredAt).map((item) => item.id),
      ),
  );
  const known = Object.values(state.statuses).filter((value) => value).length,
    needed = Object.values(state.statuses).filter((value) => !value).length;
  return {
    preferences: state.preferences,
    lists: [
      {
        id: 1,
        title: 'UI 검증용 단어장',
        scope: 'personal',
        wordCount: words.length,
        studiedCount: seen.size,
        knownCount: known,
        neededCount: needed,
      },
    ],
    totals: {
      total: words.length,
      studied: seen.size,
      known,
      needed,
      tests: state.sessions.filter(
        (session) => session.kind === 'test' && session.status === 'completed',
      ).length,
    },
    activity: Array.from(activity, ([day,count]) => ({day,count})),
    sessions: state.sessions.slice().reverse().map(serial),
  };
}
const originalFetch = window.fetch.bind(window);
window.fetch = async (url, options = {}) => {
  if (!String(url).startsWith('/api/vocabulary/learning'))
    return originalFetch(url, options);
  const parsed = new URL(url, location.origin),
    body = options.body ? JSON.parse(options.body) : null;
  let data;
  if (!body)
    data =
      parsed.searchParams.get('mode') === 'session'
        ? {
            session: serial(
              state.sessions.find(
                (session) =>
                  session.id === Number(parsed.searchParams.get('sessionId')),
              ),
            ),
          }
        : overview();
  else if (body.action === 'settings') {
    state.preferences = {
      studyCount: body.studyCount,
      testCount: body.testCount,
      firstSide: body.firstSide,
      testType: body.testType,
    };
    data = { preferences: state.preferences };
  } else if (body.action === 'start') {
    let current = state.sessions.find(
      (session) =>
        session.kind === body.kind && session.status === 'in_progress',
    );
    if (!current) {
      const seen = new Set(
        state.sessions
          .filter((session) => session.kind === 'study')
          .flatMap((session) =>
            session.items
              .filter((item) => item.answeredAt)
              .map((item) => item.id),
          ),
      );
      let pool = words.filter((word) =>
        body.scope === 'new'
          ? !seen.has(word.id)
          : body.scope === 'needed'
            ? state.statuses[word.id] === false
            : true,
      );
      if (body.scope === 'recent') {
        const source =
          state.sessions.find(
            (session) => session.id === body.sourceSessionId,
          ) ||
          state.sessions
            .slice()
            .reverse()
            .find(
              (session) =>
                session.kind === 'study' && session.status === 'completed',
            );
        pool = pool.filter((word) =>
          source?.items.some((item) => item.id === word.id),
        );
      }
      const items = pool.slice(0, body.count).map((word, index) => {
        const format =
          body.testType === 'mixed'
            ? [
                'english_to_korean',
                'korean_to_english',
                'english_choice',
                'korean_choice',
              ][index % 4]
            : body.testType;
        const korean = format.startsWith('english');
        let item = {
          ...word,
          format,
          prompt: korean ? word.word : word.meanings[0].text,
          expected: korean ? word.meanings[0].text : word.word,
        };
        if (format.endsWith('choice')) {
          const options = [
            word,
            ...words.filter((other) => other.id !== word.id).slice(0, 3),
          ];
          item = {
            ...item,
            choices: options.map((option, i) => ({
              key: String.fromCharCode(65 + i),
              label: korean ? option.meanings[0].text : option.word,
            })),
            expected: 'A',
          };
        }
        return item;
      });
      if (!items.length)
        return Response.json(
          { error: '선택한 범위에 단어가 없어요.' },
          { status: 400 },
        );
      current = {
        id: Date.now(),
        kind: body.kind,
        scope: body.scope,
        status: 'in_progress',
        firstSide: body.firstSide,
        testType: body.testType,
        items,
      };
      state.sessions.push(current);
    }
    data = { session: serial(current) };
  } else if (body.action === 'respond') {
    const current = state.sessions.find(
        (session) => session.id === body.sessionId,
      ),
      item = current.items.find((item) => item.id === body.wordId);
    if (!item.answeredAt) {
      item.answeredAt = new Date().toISOString();
      if (current.kind === 'study') {
        item.known = body.known;
        state.statuses[item.id] = body.known;
      } else {
        item.answer = body.answer;
        item.answerLabel =
          item.choices?.find((choice) => choice.key === body.answer)?.label ||
          body.answer;
        item.correct =
          body.answer.toLowerCase().trim() ===
          item.expected.toLowerCase().trim();
      }
      if (current.items.every((item) => item.answeredAt))
        current.status = 'completed';
    }
    data = { session: serial(current) };
  } else if (body.action === 'abandon') {
    state.sessions.find((session) => session.id === body.sessionId).status =
      'abandoned';
    data = { abandoned: true };
  }
  save();
  return Response.json(data);
};
const kind = location.pathname.includes('/test') ? 'test' : 'study';
const board =
  !location.pathname.includes('/practice') &&
  !location.pathname.includes('/test');
createRoot(document.getElementById('root')).render(
  <main className="min-h-screen bg-[#f7f4ed] px-5 py-6 text-[#222] sm:px-8">
    <div className="mx-auto max-w-4xl">
      <p className="rounded-xl bg-[#fff0e9] p-4 text-sm leading-6">
        로컬 UI 검증용 · 12개 예시 단어 · 운영 서버와 연결되지 않습니다.
        <a className="ml-4 underline" href="http://127.0.0.1:4179/writing">라이팅 최신 AI 테스트</a>
      </p>
      <h1 className="my-6 text-2xl font-semibold text-[#203b35]">
        EnPra · VOCA
      </h1>
      <StudySubnav
        activeItem={board ? 'BOARD' : kind === 'study' ? 'PRACTICE' : 'TEST'}
      />
      {board ? <VocaBoard /> : <VocaWorkspace kind={kind} />}
    </div>
  </main>,
);
