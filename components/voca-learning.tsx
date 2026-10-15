'use client';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { VocaSettings } from '@/components/voca-settings';
import {
  vocaRequest,
  vocaScopeCount,
  vocaTestLabels,
  type VocaOverview,
  type VocaPreferences,
  type VocaSession,
  type VocaTestType,
} from '@/lib/voca-learning';

const card = 'rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 sm:p-8';
const primary =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#203b35] px-6 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50';
const secondary =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#dcd6ca] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#203b35] disabled:opacity-50';
const field =
  'mt-2 min-h-12 w-full rounded-xl border border-[#dcd6ca] bg-white px-4 py-2 text-base text-[#222]';
const message = (error: unknown) =>
  error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
function boundedAmount(requested: number, available: number) {
  return available > 0
    ? Math.max(1, Math.min(requested, available, 100))
    : requested;
}
function Notice({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="my-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
    >
      <p>{error}</p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="mt-2 min-h-12 underline"
        >
          다시 불러오기
        </button>
      )}
    </div>
  );
}
function koreanDays() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  const today = `${get('year')}-${get('month')}-${get('day')}`;
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 6 + index);
    return {
      key: date.toISOString().slice(0, 10),
      label: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
    };
  });
}

export function VocaBoard() {
  const [overview, setOverview] = useState<VocaOverview | null>(null);
  const [error, setError] = useState('');
  async function load() {
    setError('');
    try {
      setOverview(await vocaRequest<VocaOverview>('?mode=overview'));
    } catch (error) {
      setError(message(error));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!overview)
    return (
      <section className="mt-6">
        {error ? (
          <Notice error={error} retry={() => void load()} />
        ) : (
          <p role="status" className={card}>
            단어 학습 현황을 불러오고 있어요.
          </p>
        )}
      </section>
    );
  const active = overview.sessions.filter(
    (session) => session.status === 'in_progress',
  );
  const tests = overview.sessions.filter(
    (session) => session.kind === 'test' && session.status === 'completed',
  );
  return (
    <section className="mt-6 space-y-6" aria-label="단어 학습 보드">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#666]">내 단어장으로 조금씩 이어가요.</p>
        <VocaSettings
          preferences={overview.preferences}
          onSave={async (preferences) => {
            const result = await vocaRequest<{ preferences: VocaPreferences }>(
              '',
              { action: 'settings', ...preferences },
            );
            setOverview({ ...overview, preferences: result.preferences });
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className={card}>
          <p className="text-xs font-bold tracking-widest text-[#d76a47]">
            ONE STEP AT A TIME
          </p>
          <h2 className="mt-4 text-2xl font-semibold">
            이번에는 {overview.preferences.studyCount}개씩
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#666]">
            단어장을 고르고, 영어와 뜻을 카드로 확인해요.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a href="/voca/practice" className={primary}>
              학습하기 <ArrowRight className="size-4" />
            </a>
            <a href="/voca/test" className={secondary}>
              테스트하기
            </a>
          </div>
        </article>
        <article className={card}>
          <p className="text-xs font-bold tracking-widest text-[#d76a47]">
            MY VOCABULARY
          </p>
          <h2 className="mt-4 text-2xl font-semibold">
            알아요 {overview.totals.known}개
          </h2>
          <p className="mt-2 text-sm text-[#666]">
            전체 {overview.totals.total}개 · 아직 몰라요{' '}
            {overview.totals.needed}개
          </p>
          <p className="mt-4 text-sm leading-6 text-[#666]">
            카드로 확인한 단어 {overview.totals.studied}개<br />
            알아요 표시는 본인 판단이고, 테스트 결과는 따로 기록해요.
          </p>
        </article>
      </div>
      {active.length > 0 && (
        <article className={card}>
          <h2 className="text-xl font-semibold">진행 중인 학습</h2>
          <div className="mt-4 space-y-4">
            {active.map((session) => (
              <a
                key={session.id}
                href={`/voca/${session.kind === 'study' ? 'practice' : 'test'}?list=${session.listId}&sessionId=${session.id}`}
                className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-[#dcd6ca] p-4"
              >
                <span>
                  {
                    overview.lists.find((list) => list.id === session.listId)
                      ?.title
                  }
                  <span className="mt-2 block text-sm text-[#666]">
                    {session.kind === 'study' ? '카드 학습' : '테스트'} ·{' '}
                    {session.answered}/{session.total}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  이어하기 →
                </span>
              </a>
            ))}
          </div>
        </article>
      )}
      <article className={card}>
        <h2 className="text-xl font-semibold">최근 7일 학습</h2>
        <p className="mt-2 text-sm text-[#666]">
          한국 시간 기준, 카드에 답한 횟수예요.
        </p>
        <div className="mt-6 grid grid-cols-7 gap-2">
          {koreanDays().map((day) => {
            const amount =
              overview.activity.find((activity) => activity.day === day.key)
                ?.count ?? 0;
            return (
              <div
                key={day.key}
                className={`rounded-xl p-2 text-center ${amount ? 'bg-[#e8f0ed]' : 'bg-[#f4f1ea]'}`}
              >
                <p className="text-xs text-[#666]">{day.label}</p>
                <p className="mt-2 text-base font-semibold">{amount}</p>
              </div>
            );
          })}
        </div>
      </article>
      <article className={card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">내 단어장</h2>
          <a
            href="/voca/list"
            className="min-h-12 py-2 text-sm font-semibold underline"
          >
            목록 관리
          </a>
        </div>
        {overview.lists.length ? (
          <div className="mt-4 space-y-4">
            {overview.lists.map((list) => (
              <div
                key={list.id}
                className="rounded-2xl border border-[#dcd6ca] p-4"
              >
                <h3 className="font-semibold">{list.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#666]">
                  학습한 단어 {list.studiedCount}/{list.wordCount} · 알아요{' '}
                  {list.knownCount} · 아직 몰라요 {list.neededCount}
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <a
                    className={secondary}
                    href={`/voca/practice?list=${list.id}`}
                  >
                    학습하기
                  </a>
                  <a className={secondary} href={`/voca/test?list=${list.id}`}>
                    테스트
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#666]">
            아직 단어장이 없어요. 목록 관리에서 공통 단어장을 추가하거나 내
            단어장을 만들어 주세요.
          </p>
        )}
      </article>
      <article className={card}>
        <h2 className="text-xl font-semibold">최근 테스트</h2>
        <p className="mt-2 text-sm text-[#666]">
          완료한 테스트 {overview.totals.tests}회
        </p>
        {tests.length ? (
          <div className="mt-4 space-y-4">
            {tests.slice(0, 10).map((session) => (
              <a
                key={session.id}
                href={`/voca/test?sessionId=${session.id}`}
                className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-[#dcd6ca] p-4"
              >
                <span>
                  {
                    overview.lists.find((list) => list.id === session.listId)
                      ?.title
                  }
                  <span className="mt-2 block text-sm text-[#666]">
                    {vocaTestLabels[session.testType]} ·{' '}
                    {session.result?.correct}/{session.total}개 정답
                  </span>
                </span>
                <span className="text-xl font-semibold">
                  {session.result?.score}점
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#666]">
            첫 테스트를 완료하면 여기에 기록돼요.
          </p>
        )}
      </article>
    </section>
  );
}

export function VocaWorkspace({ kind }: { kind: 'study' | 'test' }) {
  const [overview, setOverview] = useState<VocaOverview | null>(null);
  const [listId, setListId] = useState(0);
  const [scope, setScope] = useState(kind === 'study' ? 'new' : 'all');
  const [amount, setAmount] = useState(20);
  const [firstSide, setFirstSide] = useState<'english' | 'korean'>('english');
  const [testType, setTestType] = useState<VocaTestType>('mixed');
  const [session, setSession] = useState<VocaSession | null>(null);
  const [source, setSource] = useState<VocaSession | undefined>();
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const busy = useRef(false);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const list = overview?.lists.find((list) => list.id === listId);
  const current = session?.current;
  const available =
    overview && list ? vocaScopeCount(overview, list, scope, source) : 0;
  const maximum = Math.min(100, available);
  const active = overview?.sessions.find(
    (session) =>
      session.listId === listId &&
      session.kind === kind &&
      session.status === 'in_progress',
  );
  async function load() {
    setError('');
    try {
      const data = await vocaRequest<VocaOverview>('?mode=overview');
      setOverview(data);
      const params = new URLSearchParams(window.location.search);
      const selectedList =
        data.lists.find((list) => list.id === Number(params.get('list'))) ??
        data.lists[0];
      setListId(selectedList?.id ?? 0);
      setAmount(
        boundedAmount(
          kind === 'study'
            ? data.preferences.studyCount
            : data.preferences.testCount,
          selectedList ? vocaScopeCount(data, selectedList, scope) : 0,
        ),
      );
      setFirstSide(data.preferences.firstSide);
      setTestType(data.preferences.testType);
      const requestedId = Number(params.get('sessionId'));
      if (Number.isSafeInteger(requestedId) && requestedId > 0) {
        const result = await vocaRequest<{ session: VocaSession }>(
          `?mode=session&sessionId=${requestedId}`,
        );
        if (result.session.kind !== kind)
          throw new Error(
            '학습 종류가 다릅니다. 단어 보드에서 다시 열어 주세요.',
          );
        setSession(result.session);
        setListId(result.session.listId);
      }
      const sourceId = Number(params.get('sourceSessionId'));
      if (kind === 'test' && Number.isSafeInteger(sourceId) && sourceId > 0) {
        const result = await vocaRequest<{ session: VocaSession }>(
          `?mode=session&sessionId=${sourceId}`,
        );
        if (
          result.session.kind !== 'study' ||
          result.session.status !== 'completed'
        )
          throw new Error('완료한 카드 학습만 테스트 범위로 선택할 수 있어요.');
        setSource(result.session);
        setListId(result.session.listId);
        setScope('recent');
        setAmount(
          boundedAmount(data.preferences.testCount, result.session.total),
        );
      }
    } catch (error) {
      setError(message(error));
    }
  }
  useEffect(() => {
    void load();
  }, [kind]);
  useEffect(() => {
    setAmount((current) => boundedAmount(current, maximum));
  }, [maximum]);
  useEffect(() => {
    if (session?.kind === 'test' && session.current && !session.current.choices)
      inputRef.current?.focus();
  }, [session?.current?.id]);
  const remember = (value: VocaSession) => {
    setSession(value);
    setListId(value.listId);
    window.history.replaceState(
      null,
      '',
      `/voca/${kind === 'study' ? 'practice' : 'test'}?list=${value.listId}&sessionId=${value.id}`,
    );
  };
  async function start() {
    if (busy.current || !overview || !list) return;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const result = await vocaRequest<{ session: VocaSession }>('', {
        action: 'start',
        listId,
        kind,
        scope,
        count: amount,
        firstSide,
        testType,
        ...(source && (scope === 'recent' || scope === 'needed')
          ? { sourceSessionId: source.id }
          : {}),
      });
      remember(result.session);
      setFlipped(false);
      setAnswer('');
      setShowAll(false);
    } catch (error) {
      setError(message(error));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function respond(known?: boolean, skip = false) {
    if (
      busy.current ||
      !session?.current ||
      (kind === 'test' && !skip && !answer.trim())
    )
      return;
    busy.current = true;
    setPending(true);
    setError('');
    if (kind === 'study') setDragX(known ? 96 : -96);
    try {
      const result = await vocaRequest<{ session: VocaSession }>('', {
        action: 'respond',
        sessionId: session.id,
        wordId: session.current.id,
        ...(kind === 'study'
          ? { known }
          : { answer: skip ? '' : answer, skip }),
      });
      setSession(result.session);
      setFlipped(false);
      setAnswer('');
      if (result.session.status === 'completed')
        setOverview(await vocaRequest<VocaOverview>('?mode=overview'));
    } catch (error) {
      setError(message(error));
    } finally {
      busy.current = false;
      setPending(false);
      setDragX(0);
    }
  }
  async function setupAgain(nextScope = kind === 'study' ? 'new' : 'all') {
    const data = await vocaRequest<VocaOverview>('?mode=overview');
    setOverview(data);
    setSession(null);
    setSource(undefined);
    setScope(nextScope);
    setFlipped(false);
    setAnswer('');
    setShowAll(false);
    const selectedList = data.lists.find((list) => list.id === listId);
    setAmount(
      boundedAmount(
        kind === 'study'
          ? data.preferences.studyCount
          : data.preferences.testCount,
        selectedList ? vocaScopeCount(data, selectedList, nextScope) : 0,
      ),
    );
    window.history.replaceState(
      null,
      '',
      `/voca/${kind === 'study' ? 'practice' : 'test'}?list=${listId}`,
    );
  }
  async function leave() {
    if (
      !session ||
      busy.current ||
      !window.confirm(
        '이 학습을 중단하고 새로 설정할까요? 지금까지 저장한 답은 유지돼요.',
      )
    )
      return;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      await vocaRequest('', { action: 'abandon', sessionId: session.id });
      await setupAgain();
    } catch (error) {
      setError(message(error));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!pointer.current) return;
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    pointer.current = null;
    setDragging(false);
    setDragX(0);
    // A drag must not become a face-flipping click when it falls short of a swipe.
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 8) suppressClick.current = true;
    if (Math.abs(dx) >= 64 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      suppressClick.current = true;
      void respond(dx > 0);
    }
  }
  if (!overview)
    return (
      <section className="mt-6">
        {error ? (
          <Notice error={error} retry={() => void load()} />
        ) : (
          <p role="status" className={card}>
            학습할 단어장을 불러오고 있어요.
          </p>
        )}
      </section>
    );
  return (
    <section
      className="mt-6 space-y-6"
      aria-label={kind === 'study' ? '카드 학습' : '단어 테스트'}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <a
          className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-[#203b35]"
          href={listId ? `/voca/list?list=${listId}` : '/voca/list'}
        >
          <ArrowLeft className="size-4" />
          단어장으로
        </a>
        <VocaSettings
          preferences={overview.preferences}
          onSave={async (preferences) => {
            const result = await vocaRequest<{ preferences: VocaPreferences }>(
              '',
              { action: 'settings', ...preferences },
            );
            setOverview({ ...overview, preferences: result.preferences });
            if (!session) {
              setAmount(
                boundedAmount(
                  kind === 'study'
                    ? result.preferences.studyCount
                    : result.preferences.testCount,
                  available,
                ),
              );
              setFirstSide(result.preferences.firstSide);
              setTestType(result.preferences.testType);
            }
          }}
        />
      </div>
      {error && <Notice error={error} />}
      {!session && (
        <form
          className={card}
          onSubmit={(event) => {
            event.preventDefault();
            void start();
          }}
        >
          <p className="text-xs font-bold tracking-widest text-[#d76a47]">
            {kind === 'study' ? 'YOUR NEXT WORDS' : 'CHECK YOUR WORDS'}
          </p>
          <h2 className="mt-4 text-2xl font-semibold">
            {kind === 'study'
              ? '이번에 학습할 단어'
              : '어떤 방식으로 확인할까요?'}
          </h2>
          {overview.lists.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[#666]">
              먼저 단어장을 추가해 주세요.{' '}
              <a href="/voca/list" className="underline">
                단어장 관리로 이동
              </a>
            </p>
          ) : (
            <>
              <label className="mt-6 block text-sm font-semibold">
                단어장
                <select
                  className={field}
                  value={listId}
                  onChange={(event) => {
                    setListId(Number(event.target.value));
                    setSource(undefined);
                  }}
                >
                  {overview.lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title} · {list.wordCount}개
                    </option>
                  ))}
                </select>
              </label>
              {list && (
                <p className="mt-2 text-sm text-[#666]">
                  학습한 단어 {list.studiedCount}/{list.wordCount} · 알아요{' '}
                  {list.knownCount} · 아직 몰라요 {list.neededCount}
                </p>
              )}
              <label className="mt-4 block text-sm font-semibold">
                {kind === 'study' ? '학습 범위' : '출제 범위'}
                <select
                  className={field}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                >
                  {kind === 'study' ? (
                    <>
                      <option value="new">
                        이어서 학습 · 아직 보지 않은 단어
                      </option>
                      <option value="needed">모르는 단어 복습</option>
                      <option value="all">전체 다시 학습 · 처음부터</option>
                    </>
                  ) : (
                    <>
                      <option value="recent">이번에 학습한 단어</option>
                      <option value="needed">아직 모르는 단어</option>
                      <option value="all">목록 전체에서 무작위 출제</option>
                    </>
                  )}
                </select>
              </label>
              {source && (
                <p className="mt-2 text-sm text-[#666]">
                  방금 완료한 카드 학습을 출제 범위로 사용해요.
                </p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  {kind === 'study' ? '한 번에 학습할 개수' : '테스트 문제 수'}
                  <input
                    className={field}
                    type="number"
                    min={1}
                    max={maximum || 100}
                    required
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                  />
                  <span className="mt-2 block text-xs leading-6 text-[#666]">
                    선택한 범위 {available}개 · 한 번에 최대 {maximum}개
                  </span>
                </label>
                {kind === 'study' ? (
                  <label className="block text-sm font-semibold">
                    카드 첫 화면
                    <select
                      className={field}
                      value={firstSide}
                      onChange={(event) =>
                        setFirstSide(event.target.value as 'english' | 'korean')
                      }
                    >
                      <option value="english">영어 먼저 보기</option>
                      <option value="korean">해석 먼저 보기</option>
                    </select>
                  </label>
                ) : (
                  <label className="block text-sm font-semibold">
                    테스트 유형
                    <select
                      className={field}
                      value={testType}
                      onChange={(event) =>
                        setTestType(event.target.value as VocaTestType)
                      }
                    >
                      {Object.entries(vocaTestLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#666]">
                {kind === 'study'
                  ? '카드를 누르면 반대 면이 보여요. 오른쪽은 알아요, 왼쪽은 아직 몰라요. 분량은 하루 제한이 아니에요.'
                  : '같은 단어는 한 테스트에 한 번만 나와요. 서술형은 저장된 영단어·뜻을 기준으로 판정하고, 결과는 마지막에 함께 확인해요.'}
              </p>
              {kind === 'test' &&
                (testType === 'mixed' || testType.endsWith('choice')) && (
                  <p className="mt-2 text-xs leading-6 text-[#666]">
                    4지선다에는 이 단어장에서 서로 다른 뜻의 보기 4개를 만들 수
                    있어야 해요.
                  </p>
                )}
              <div className="mt-6 flex flex-wrap gap-4">
                {active ? (
                  <button
                    type="button"
                    className={primary}
                    disabled={pending}
                    onClick={async () => {
                      setError('');
                      try {
                        const result = await vocaRequest<{
                          session: VocaSession;
                        }>(`?mode=session&sessionId=${active.id}`);
                        remember(result.session);
                      } catch (error) {
                        setError(message(error));
                      }
                    }}
                  >
                    진행 중인 {kind === 'study' ? '학습' : '테스트'} 이어하기 ·{' '}
                    {active.answered}/{active.total}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={primary}
                    disabled={
                      pending ||
                      !available ||
                      !Number.isInteger(amount) ||
                      amount < 1 ||
                      amount > maximum
                    }
                  >
                    {pending
                      ? '준비하고 있어요…'
                      : kind === 'study'
                        ? '카드 학습 시작하기'
                        : '테스트 시작하기'}
                  </button>
                )}
              </div>
              {!available && (
                <p role="status" className="mt-4 text-sm text-[#666]">
                  선택한 범위에 단어가 없어요. 다른 범위를 선택하거나 먼저 카드
                  학습을 완료해 주세요.
                </p>
              )}
            </>
          )}
        </form>
      )}
      {session?.status === 'in_progress' && current && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {
                  overview.lists.find((list) => list.id === session.listId)
                    ?.title
                }
              </h2>
              <p className="mt-2 text-sm text-[#666]">
                {session.answered + 1}/{session.total} · {session.answered}개
                저장됨
              </p>
            </div>
            <button
              type="button"
              className={secondary}
              disabled={pending}
              onClick={() => void leave()}
            >
              중단·다시 설정
            </button>
          </div>
          <progress
            className="h-2 w-full accent-[#203b35]"
            aria-label="학습 진행률"
            value={session.answered}
            max={session.total}
          />
          {kind === 'study' ? (
            <>
              <div className="overflow-hidden p-2">
                <button
                  key={current.id}
                  type="button"
                  disabled={pending}
                  aria-pressed={flipped}
                  aria-label={
                    flipped ? '카드 첫 면 보기' : '카드 뒤집어 확인하기'
                  }
                  onClick={(event) => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      if (event?.detail !== 0) return;
                    }
                    setFlipped((value) => !value);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'ArrowLeft' ||
                      event.key === 'ArrowRight'
                    ) {
                      event.preventDefault();
                      void respond(event.key === 'ArrowRight');
                    }
                  }}
                  onPointerDown={(event) => {
                    if (event.button !== 0 || busy.current || pointer.current)
                      return;
                    suppressClick.current = false;
                    pointer.current = { x: event.clientX, y: event.clientY };
                    setDragging(true);
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (pointer.current && !pending) {
                      const dx = event.clientX - pointer.current.x;
                      const dy = event.clientY - pointer.current.y;
                      if (Math.abs(dx) > Math.abs(dy))
                        setDragX(Math.max(-240, Math.min(240, dx)));
                    }
                  }}
                  onPointerUp={pointerUp}
                  onPointerCancel={() => {
                    pointer.current = null;
                    suppressClick.current = true;
                    setDragging(false);
                    setDragX(0);
                  }}
                  onLostPointerCapture={() => {
                    if (pointer.current) {
                      pointer.current = null;
                      suppressClick.current = true;
                      setDragging(false);
                      setDragX(0);
                    }
                  }}
                  data-dragging={dragging}
                  style={{
                    touchAction: 'pan-y',
                    transform: dragX
                      ? `translateX(${dragX}px) rotate(${Math.max(-8, Math.min(8, dragX / 24))}deg)`
                      : undefined,
                  }}
                  className="voca-study-card relative w-full select-none rounded-3xl text-center disabled:opacity-60"
                >
                  <span className="voca-card-turn" data-flipped={flipped}>
                    {(['english', 'korean'] as const).map((side) => (
                      <span
                        key={side}
                        className="voca-card-face flex min-h-80 min-w-0 flex-col items-center justify-center gap-6 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-sm"
                        data-back={side !== session.firstSide}
                        aria-hidden={
                          ((session.firstSide === 'english') !== flipped) !==
                          (side === 'english')
                        }
                      >
                        <span className="text-xs font-bold tracking-widest text-[#d76a47]">
                          {side === 'english' ? 'ENGLISH' : 'MEANING'}
                        </span>
                        {side === 'english' ? (
                          <>
                            <span
                              lang="en"
                              className="w-full min-w-0 break-words text-4xl font-semibold text-[#203b35]"
                            >
                              {current.word}
                            </span>
                            {current.pronunciationIpa && (
                              <span className="text-base text-[#666]">
                                {current.pronunciationIpa}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="space-y-4 text-2xl font-semibold text-[#203b35]">
                            {current.meanings?.map((sense, index) => (
                              <span key={index} className="block">
                                <span className="mr-2 text-sm font-normal text-[#666]">
                                  {sense.partOfSpeech}.
                                </span>
                                {sense.text}
                              </span>
                            ))}
                          </span>
                        )}
                        <span className="text-sm text-[#666]">
                          {pending
                            ? '답을 저장하고 있어요…'
                            : '눌러서 반대 면 보기'}
                        </span>
                      </span>
                    ))}
                  </span>
                  {Math.abs(dragX) > 8 && (
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute right-4 top-4 rounded-xl px-4 py-2 text-sm font-bold ${dragX > 0 ? 'bg-[#203b35] text-white' : 'bg-[#fff0e9] text-[#a3472b]'}`}
                    >
                      {dragX > 0 ? '알아요 →' : '← 아직 몰라요'}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-center text-sm text-[#666]">
                카드를 오른쪽으로 끌면 알아요 · 왼쪽으로 끌면 아직 몰라요
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={secondary}
                  disabled={pending}
                  type="button"
                  onClick={() => void respond(false)}
                >
                  <ArrowLeft className="size-4" />
                  아직 몰라요
                </button>
                <button
                  className={primary}
                  disabled={pending}
                  type="button"
                  onClick={() => void respond(true)}
                >
                  알아요 <ArrowRight className="size-4" />
                </button>
              </div>
              <p className="text-center text-xs leading-6 text-[#666]">
                좌우로 넘기거나 버튼을 누르세요. 카드에 포커스를 두면 키보드
                방향키도 사용할 수 있어요.
              </p>
            </>
          ) : (
            <form
              className={card}
              onSubmit={(event) => {
                event.preventDefault();
                void respond();
              }}
            >
              <p className="text-xs font-bold tracking-widest text-[#d76a47]">
                {current.format && vocaTestLabels[current.format]}
              </p>
              <h3 className="mt-6 break-words text-2xl font-semibold">
                {current.prompt}
              </h3>
              {current.choices ? (
                <fieldset className="mt-6 space-y-4" disabled={pending}>
                  <legend className="mb-4 text-sm text-[#666]">
                    맞는 보기를 하나 선택해 주세요.
                  </legend>
                  {current.choices.map((choice) => (
                    <label
                      key={choice.key}
                      className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border p-4 ${answer === choice.key ? 'border-[#203b35] bg-[#e8f0ed]' : 'border-[#dcd6ca] bg-white'}`}
                    >
                      <input
                        type="radio"
                        name="voca-answer"
                        value={choice.key}
                        checked={answer === choice.key}
                        onChange={() => setAnswer(choice.key)}
                        className="size-4 accent-[#203b35]"
                      />
                      <span className="text-sm font-semibold">
                        {choice.key}
                      </span>
                      <span className="break-words text-base">
                        {choice.label}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <label className="mt-6 block text-sm font-semibold">
                  {current.format === 'english_to_korean'
                    ? '한국어 뜻을 하나 적어 주세요.'
                    : '영단어를 적어 주세요.'}
                  <input
                    ref={inputRef}
                    className={field}
                    type="text"
                    maxLength={500}
                    disabled={pending}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                  />
                </label>
              )}
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  className={primary}
                  type="submit"
                  disabled={pending || !answer.trim()}
                >
                  {pending
                    ? '저장하고 있어요…'
                    : session.answered + 1 === session.total
                      ? '제출하고 결과 보기'
                      : '제출하고 다음 문제'}
                </button>
                <button
                  className={secondary}
                  type="button"
                  disabled={pending}
                  onClick={() => void respond(undefined, true)}
                >
                  모르겠어요
                </button>
              </div>
            </form>
          )}
        </>
      )}
      {session?.status === 'completed' && session.result && (
        <article className={card}>
          <CheckCircle2 className="size-8 text-[#203b35]" />
          <p className="mt-4 text-xs font-bold tracking-widest text-[#d76a47]">
            {kind === 'study' ? 'STUDY COMPLETE' : 'TEST COMPLETE'}
          </p>
          <h2 className="mt-4 text-2xl font-semibold">
            {kind === 'study'
              ? '이번 분량을 다 확인했어요.'
              : `${session.result.correct}/${session.total}개 정답 · ${session.result.score}점`}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#666]">
            {kind === 'study'
              ? `알아요 ${session.result.known}개 · 아직 몰라요 ${session.result.needed}개`
              : '테스트 결과는 알아요 표시와 별도로 저장했어요.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            {kind === 'study' ? (
              <>
                <a
                  className={primary}
                  href={`/voca/test?list=${session.listId}&sourceSessionId=${session.id}`}
                >
                  이번 단어로 테스트
                </a>
                <button
                  className={secondary}
                  disabled={pending}
                  type="button"
                  onClick={() => {
                    void setupAgain('new').catch((error) =>
                      setError(message(error)),
                    );
                  }}
                >
                  다음 분량 학습
                </button>
                {session.result.needed > 0 && (
                  <button
                    className={secondary}
                    type="button"
                    onClick={() => {
                      void setupAgain('needed').catch((error) =>
                        setError(message(error)),
                      );
                    }}
                  >
                    <RotateCcw className="size-4" />
                    모르는 단어 복습
                  </button>
                )}
              </>
            ) : (
              <button
                className={primary}
                type="button"
                onClick={() => {
                  void setupAgain().catch((error) => setError(message(error)));
                }}
              >
                다른 테스트 시작하기
              </button>
            )}
            <a href="/voca" className={secondary}>
              보드로 돌아가기
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-xl font-semibold">
              {showAll
                ? '전체 결과'
                : kind === 'study'
                  ? '아직 모르는 단어'
                  : '틀린 단어'}
            </h3>
            <button
              type="button"
              className={secondary}
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? '보완할 단어만 보기' : '전체 결과 보기'}
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {session.result.items
              .filter(
                (item) =>
                  showAll ||
                  (kind === 'study' ? item.known === false : !item.correct),
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#dcd6ca] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h4 lang="en" className="text-xl font-semibold">
                      {item.word}
                    </h4>
                    <span className="text-sm text-[#666]">
                      {kind === 'study'
                        ? item.known
                          ? '알아요'
                          : '아직 몰라요'
                        : item.correct
                          ? '정답'
                          : '오답'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#666]">
                    {item.meanings
                      .map((sense) => `${sense.partOfSpeech}. ${sense.text}`)
                      .join(' / ')}
                  </p>
                  {kind === 'test' && (
                    <p className="mt-2 break-words text-sm">
                      내 답: {item.answerLabel || item.answer || '모르겠어요'}
                    </p>
                  )}
                </div>
              ))}
            {!showAll &&
              session.result.items.every((item) =>
                kind === 'study' ? item.known : item.correct,
              ) && (
                <p className="text-sm text-[#666]">
                  이번 분량에는 보완할 단어가 없어요.
                </p>
              )}
          </div>
        </article>
      )}
      {session?.status === 'abandoned' && (
        <article className={card}>
          <p>중단한 학습이에요. 저장한 답은 남아 있어요.</p>
          <button
            className={`${primary} mt-4`}
            type="button"
            onClick={() => {
              void setupAgain().catch((error) => setError(message(error)));
            }}
          >
            새로 설정하기
          </button>
        </article>
      )}
    </section>
  );
}
