'use client';

import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Loader2,
  PenLine,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useDocumentScrollLock } from '@/components/use-document-scroll-lock';
import { WritingMaterial } from '@/components/writing-material';

type Profile = {
  onboardingStatus: string;
  selectedStartLevel?: string | null;
  currentPublicLevel?: string | null;
  currentLevelGroup?: string | null;
  currentInternalStage?: string | null;
  boardSummary?: string | null;
  boardNextAction?: string | null;
};
type Overview = {
  profile: Profile | null;
  activeSession: { id: number; type: string } | null;
  topSkills: Array<{
    code: string;
    name: string;
    score: number;
    evidenceCount: number;
    reinforcementCount: number;
  }>;
};

async function api<T>(
  body?: Record<string, unknown>,
  query = 'overview',
): Promise<T> {
  const response = body
    ? await fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    : await fetch(`/api/writing?mode=${query}`, { cache: 'no-store' });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? '요청을 처리하지 못했습니다.');
  return data;
}

function InitialLoadError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <section className="mt-7 rounded-3xl border border-[#efd2c7] bg-[#fff8f4] p-6 text-sm text-[#a64b32]">
      <p role="alert">{message}</p>
      <Button variant="outline" onClick={retry} className="mt-4">
        다시 시도
      </Button>
    </section>
  );
}

function Dialog({
  open,
  title,
  children,
  close,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  useDocumentScrollLock(open);
  if (!open) return null;
  return (
    <>
      <button
        type="button"
        aria-label="닫기"
        onClick={close}
        className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-lg -translate-y-1/2 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(29,41,53,0.2)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-3xl text-[#24333a]">{title}</h2>
          <button
            type="button"
            onClick={close}
            className="grid size-9 place-items-center rounded-xl text-[#69736e] hover:bg-[#f1ede5]"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </section>
    </>
  );
}

function AiProgressOverlay({
  active,
  label = 'AI가 문제를 준비하고 있어요.',
}: {
  active: boolean;
  label?: string;
}) {
  const [visible, setVisible] = useState(active);
  const [progress, setProgress] = useState(0);
  useDocumentScrollLock(visible);

  useEffect(() => {
    let timer: number | undefined;
    if (active) {
      setVisible(true);
      setProgress(1);
      const startedAt = Date.now();
      timer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        setProgress(
          Math.min(90, 1 + Math.round((Math.min(elapsed, 5_000) / 5_000) * 89)),
        );
      }, 80);
      return () => {
        if (timer) window.clearInterval(timer);
      };
    }
    if (!visible) return;
    timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(
          100,
          current + Math.max(2, Math.ceil((100 - current) / 4)),
        );
        if (next === 100) {
          if (timer) window.clearInterval(timer);
          window.setTimeout(() => setVisible(false), 180);
        }
        return next;
      });
    }, 55);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [active, visible]);

  if (!visible) return null;
  const waiting = active && progress >= 90;
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#1d2935]/35 p-5 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
    >
      <section className="w-full max-w-sm rounded-3xl border border-[#e2d8ca] bg-[#fffdf8] p-6 shadow-[0_24px_80px_rgba(29,41,53,0.25)]">
        <div className="flex items-center gap-3">
          <span
            className={`grid size-10 place-items-center rounded-2xl bg-[#fff0e9] text-[#d76a47] ${waiting ? 'animate-pulse' : ''}`}
          >
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-serif text-xl text-[#24333a]">{label}</p>
            <p className="mt-1 text-sm text-[#69736e]">
              {waiting
                ? '아직 작업을 계속하고 있어요.'
                : '잠시만 기다려 주세요.'}
            </p>
          </div>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#eee7dc]">
          <div
            className={`h-full rounded-full bg-[#d76a47] transition-[width] duration-100 ease-out ${waiting ? 'animate-pulse' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs font-bold text-[#8a756b]">
          <span>{waiting ? '처리 중' : '준비 중'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </section>
    </div>
  );
}

function HintMenu({
  hints,
  onReveal,
  structureGuide,
}: {
  hints: Array<any>;
  onReveal: (hintId: number) => Promise<boolean>;
  structureGuide?: {
    available: boolean;
    used: boolean;
    busy: boolean;
    onUse: () => void;
  };
}) {
  const [open, setOpen] = useState(false);
  const [selectedHintId, setSelectedHintId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside, true);
    return () => document.removeEventListener('pointerdown', closeOutside, true);
  }, [open]);

  if (!hints.length && !structureGuide?.available) return null;
  const labels: Record<string, string> = {
    structure: 'Structure',
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    sample: 'Sample',
  };
  const selectedHint = hints.find((hint) => hint.id === selectedHintId);
  return (
    <div ref={menuRef} className="relative z-20 ml-auto w-fit">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="힌트 열기"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-full border border-[#ddd4c7] bg-[#fffdf8] text-[#d76a47] shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        <CircleHelp className="size-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-64 overflow-hidden rounded-2xl border border-[#dcd6ca] bg-[#fffdf8] p-1.5 shadow-[0_16px_40px_rgba(29,41,53,0.16)]">
          {hints.map((hint) => (
            <button
              key={hint.id}
              type="button"
              onClick={async () => {
                if (!await onReveal(hint.id)) return;
                setOpen(false);
                setSelectedHintId(hint.id);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#fff8f4]"
            >
              <span className="text-xs font-bold tracking-[.1em] text-[#d76a47]">
                HINT {hint.order} · {labels[hint.type] ?? hint.type}
              </span>
              {hint.revealed && (
                <Check className="size-4 shrink-0 text-[#38634f]" />
              )}
            </button>
          ))}
          {structureGuide?.available && (
            <button
              type="button"
              disabled={structureGuide.busy}
              onClick={() => {
                structureGuide.onUse();
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#fff8f4] disabled:cursor-wait disabled:opacity-60"
            >
              <span className="text-xs font-bold tracking-[.1em] text-[#d76a47]">
                HINT 5 · Paragraphs
              </span>
              {structureGuide.used && (
                <Check className="size-4 shrink-0 text-[#38634f]" />
              )}
            </button>
          )}
        </div>
      )}
      <Dialog
        open={Boolean(selectedHint?.revealed)}
        title={`HINT ${selectedHint?.order ?? ''} · ${selectedHint ? (labels[selectedHint.type] ?? selectedHint.type) : ''}`}
        close={() => setSelectedHintId(null)}
      >
        <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-[#4f5e58]">
          {selectedHint?.content}
        </p>
        <Button onClick={() => setSelectedHintId(null)} className="mt-7 w-full">
          확인
        </Button>
      </Dialog>
    </div>
  );
}

const startLevels = [
  {
    level: 'foundation',
    label: 'FOUNDATION',
    description: '기본 문장 구조부터 바로 학습을 시작합니다.',
  },
  {
    level: '5.0',
    label: '5.0+',
    description: 'Task 1 한 문항으로 시작 단계를 확인합니다.',
  },
  {
    level: '6.0',
    label: '6.0+',
    description: 'Task 1과 Task 2로 현재 실력을 확인합니다.',
  },
  {
    level: '7.0',
    label: '7.0+',
    description: 'Task 1과 Task 2를 심화 기준으로 확인합니다.',
  },
];

export function WritingBoardClient() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => {
    setError('');
    return api<Overview>()
      .then(setOverview)
      .catch((cause: Error) => setError(cause.message));
  };
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = async (level: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ sessionId?: number; active?: boolean }>({
        action: 'placement',
        level,
      });
      if (result.sessionId) router.push(`/writing/session/${result.sessionId}`);
      else router.push('/writing/practice');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '레벨을 설정하지 못했습니다.',
      );
    } finally {
      setBusy(false);
    }
  };
  const startReinforcement = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ sessionId?: number }>({
        action: 'start-session',
        sessionType: 'learning',
        learningMode: 'reinforcement',
      });
      if (result.sessionId) router.push(`/writing/session/${result.sessionId}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '보강 학습을 시작하지 못했습니다.',
      );
    } finally {
      setBusy(false);
    }
  };
  if (!overview && error)
    return <InitialLoadError message={error} retry={load} />;
  if (!overview)
    return (
      <section className="mt-7 grid min-h-56 place-items-center rounded-3xl border border-dashed border-[#d7cfc2]">
        <Loader2 className="size-5 animate-spin text-[#d76a47]" />
      </section>
    );
  const profile = overview.profile;
  if (!profile || profile.onboardingStatus !== 'active')
    return (
      <section className="mt-7 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#38634f]">
              <Sparkles className="size-4" />
              STARTING LEVEL
            </div>
            <h2 className="mt-4 font-serif text-3xl">
              시작 레벨을 설정하세요.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#69736e]">
              내 실력에 맞는 Writing 단계로 학습을 시작합니다.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setDialog(true)}
            className="h-11 rounded-xl bg-[#1d2935] px-5 text-[#fffdf8] hover:bg-[#344451]"
          >
            레벨 설정하기 <ArrowRight className="size-4" />
          </Button>
        </div>
        {error && <p className="mt-5 text-sm text-[#c34f32]">{error}</p>}
        <AiProgressOverlay
          active={busy}
          label="AI가 시작 레벨 문제를 준비하고 있어요."
        />
        <Dialog
          open={dialog}
          title="어디서 시작할까요?"
          close={() => setDialog(false)}
        >
          <p className="mt-2 text-sm leading-6 text-[#707873]">
            처음 선택한 레벨은 학습의 출발점이 됩니다.
          </p>
          <div className="mt-6 space-y-3">
            {startLevels.map((choice) => (
              <button
                key={choice.level}
                type="button"
                disabled={busy}
                onClick={() => choose(choice.level)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#ded7ca] p-4 text-left transition-colors hover:border-[#e6b7a5] hover:bg-[#fff8f4] disabled:opacity-60"
              >
                <span>
                  <span className="block font-serif text-xl text-[#24333a]">
                    {choice.label}
                  </span>
                  <span className="mt-1 block text-sm text-[#737b76]">
                    {choice.description}
                  </span>
                </span>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4 text-[#d76a47]" />
                )}
              </button>
            ))}
          </div>
        </Dialog>
      </section>
    );
  return (
    <section className="mt-7 space-y-5">
      <AiProgressOverlay active={busy} label="보강 문제를 준비하고 있어요." />
      <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">
              CURRENT WRITING LEVEL
            </p>
            <h2 className="mt-2 font-serif text-4xl">
              {profile.currentLevelGroup === '5.0_basic'
                ? '5.0 기본반'
                : profile.currentPublicLevel?.toUpperCase()}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#69736e]">
              {profile.boardSummary}
            </p>
          </div>
          <a
            href="/writing/practice"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1d2935] px-5 text-sm font-bold text-[#fffdf8] transition-transform active:scale-[.98]"
          >
            학습하기 <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
      <section className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-[#d76a47]">
              REINFORCEMENT
            </p>
            <h3 className="mt-2 font-serif text-2xl text-[#24333a]">
              맞춤 보강 학습
            </h3>
          </div>
          {overview.topSkills.length > 0 && (
            <button
              type="button"
              disabled={Boolean(overview.activeSession) || busy}
              onClick={startReinforcement}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1d2935] px-5 text-sm font-bold text-[#fffdf8] transition-transform active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              보강 학습 <ArrowRight className="size-4" />
            </button>
          )}
        </div>
        {overview.topSkills.length ? (
          <div className="mt-5 divide-y divide-[#ece5da] rounded-xl border border-[#ece5da] bg-[#fffcf7] px-4">
            {overview.topSkills.map((skill, index) => (
              <div
                key={skill.code}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f1ede5] text-xs font-bold text-[#68736e]">
                    {index + 1}
                  </span>
                  <p className="truncate text-sm font-bold text-[#344149]">
                    {skill.name}
                  </p>
                </div>
                {skill.reinforcementCount > 0 && (
                  <p className="shrink-0 text-sm text-[#69736e]">
                    보완 필요 {skill.reinforcementCount}회
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#69736e]">
            첫 학습 결과가 쌓이면 현재 상황에 맞는 보강 학습을 안내합니다.
          </p>
        )}
      </section>
      {error && <p className="text-sm text-[#c34f32]">{error}</p>}
    </section>
  );
}

const levelOrder = ['foundation', '5.0', '5.5', '6.0', '6.5', '7.0'];
const displayLevel = (level: string, group?: string | null) =>
  group === '5.0_basic'
    ? '5.0 기본반'
    : level === 'foundation'
      ? 'FOUNDATION'
      : level;

export function WritingPracticeClient() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [modal, setModal] = useState<
    'learning' | 'promotion' | 'demotion' | null
  >(null);
  const [target, setTarget] = useState<{
    level: string;
    group?: string | null;
  } | null>(null);
  const [warning, setWarning] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<{
    id: number;
    type: string;
  } | null>(null);
  const load = () => {
    setError('');
    return api<Overview>()
      .then((data) => {
        setOverview(data);
        setActiveSession(data.activeSession);
      })
      .catch((cause: Error) => setError(cause.message));
  };
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const start = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const response = await api<{
        sessionId?: number;
        warning?: boolean;
        message?: string;
      }>({ action: 'start-session', ...payload });
      if (response.warning) {
        setWarning(
          response.message ?? '현재 단계에서 조금 더 학습하는 것을 권장합니다.',
        );
        return;
      }
      if (response.sessionId)
        router.push(`/writing/session/${response.sessionId}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '학습을 시작하지 못했습니다.',
      );
    } finally {
      setBusy(false);
    }
  };
  const change = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await api({
        action: 'level-change',
        targetPublicLevel: target.level,
        targetLevelGroup: target.group ?? null,
      });
      router.replace('/writing');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '레벨을 변경하지 못했습니다.',
      );
    } finally {
      setBusy(false);
    }
  };
  if (!overview && error)
    return <InitialLoadError message={error} retry={load} />;
  if (!overview)
    return (
      <section className="mt-7 grid min-h-56 place-items-center rounded-3xl border border-dashed border-[#d7cfc2]">
        <Loader2 className="size-5 animate-spin text-[#d76a47]" />
      </section>
    );
  const profile = overview.profile;
  if (!profile || profile.onboardingStatus !== 'active')
    return (
      <section className="mt-7 rounded-3xl border border-dashed border-[#d7cfc2] bg-[#fbf9f4] p-10 text-center">
        <p className="font-serif text-2xl">먼저 시작 레벨을 설정해 주세요.</p>
        <a
          href="/writing"
          className="mt-5 inline-flex text-sm font-bold text-[#d76a47]"
        >
          Board로 이동 <ArrowRight className="ml-1 size-4" />
        </a>
      </section>
    );
  const index = levelOrder.indexOf(profile.currentPublicLevel ?? 'foundation');
  const higher = levelOrder.slice(index + 1);
  const lower = levelOrder.slice(0, index);
  return (
    <section className="mt-7 max-w-3xl">
      <AiProgressOverlay active={busy} label="AI가 응답을 준비하고 있어요." />
      <div className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
        <p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">
          PRACTICE
        </p>
        <h2 className="mt-2 font-serif text-4xl">오늘의 Writing.</h2>
        <p className="mt-3 text-sm leading-6 text-[#69736e]">
          학습은 필요한 Task를 골라 집중하고, 테스트는 현재 단계를 빠르게
          확인합니다.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={Boolean(activeSession) || busy}
            onClick={() => setModal('learning')}
            className="rounded-2xl border border-[#dcd6ca] bg-[#fbf9f4] p-6 text-left transition hover:border-[#e6b7a5] hover:bg-[#fff8f4]"
          >
            <PenLine className="size-5 text-[#d76a47]" />
            <h3 className="mt-5 font-serif text-2xl">학습하기</h3>
            <p className="mt-2 text-sm leading-6 text-[#69736e]">
              힌트와 피드백을 사용해 필요한 Task를 학습합니다.
            </p>
          </button>
          <button
            type="button"
            disabled={Boolean(activeSession) || busy}
            onClick={() => start({ sessionType: 'test' })}
            className="rounded-2xl border border-[#dcd6ca] bg-[#fbf9f4] p-6 text-left transition hover:border-[#e6b7a5] hover:bg-[#fff8f4]"
          >
            <ClipboardCheck className="size-5 text-[#d76a47]" />
            <h3 className="mt-5 font-serif text-2xl">일반 테스트</h3>
            <p className="mt-2 text-sm leading-6 text-[#69736e]">
              힌트 없이 현재 단계의 실력을 확인합니다.
            </p>
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={Boolean(activeSession) || busy}
            onClick={() => setModal('promotion')}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-bold text-[#fffdf8] active:scale-[.98]"
          >
            <GraduationCap className="size-4" />
            승급 테스트
          </button>
          {index > 0 && (
            <button
              type="button"
              disabled={Boolean(activeSession) || busy}
              onClick={() => setModal('demotion')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d7cfc2] px-4 text-sm font-semibold text-[#69736e] active:scale-[.98]"
            >
              <RotateCcw className="size-4" />
              강등
            </button>
          )}
        </div>
        {error && <p className="mt-4 text-sm text-[#c34f32]">{error}</p>}
      </div>
      <Dialog
        open={modal === 'learning'}
        title="어떤 유형을 학습할까요?"
        close={() => setModal(null)}
      >
        {profile.currentPublicLevel === 'foundation' ? (
          <div className="mt-6">
            <p className="text-sm leading-6 text-[#69736e]">
              FOUNDATION은 자료 기반 3문장 훈련으로 바로 시작합니다.
            </p>
            <Button
              disabled={busy}
              onClick={() => start({ sessionType: 'learning' })}
              className="mt-6 w-full"
            >
              FOUNDATION 학습 시작
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(['task1', 'task2'] as const).map((task) => (
              <button
                key={task}
                disabled={busy}
                onClick={() =>
                  start({ sessionType: 'learning', taskType: task })
                }
                className="rounded-2xl border border-[#ded7ca] p-5 text-left hover:border-[#e6b7a5] hover:bg-[#fff8f4]"
              >
                <span className="font-serif text-2xl">
                  {task === 'task1' ? 'Task 1' : 'Task 2'}
                </span>
                <span className="mt-2 block text-sm text-[#737b76]">
                  {task === 'task1'
                    ? '자료를 객관적으로 분석하는 훈련'
                    : '의견을 논리적으로 전개하는 훈련'}
                </span>
              </button>
            ))}
          </div>
        )}
      </Dialog>
      <Dialog
        open={modal === 'promotion'}
        title="승급 목표를 선택하세요"
        close={() => {
          setModal(null);
          setWarning('');
          setTarget(null);
        }}
      >
        <p className="mt-2 text-sm leading-6 text-[#69736e]">
          현재 단계의 학습을 충분히 마치지 않았더라도 언제든 도전할 수 있습니다.
        </p>
        <div className="mt-6 space-y-2">
          {higher.map((level) => (
            <button
              key={level}
              disabled={busy}
              onClick={() => {
                setTarget({ level });
                setWarning('');
                start({
                  sessionType: 'promotion_test',
                  targetPublicLevel: level,
                });
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[#ded7ca] px-4 py-3 text-left hover:border-[#e6b7a5]"
            >
              <span className="font-semibold">{displayLevel(level)}</span>
              <ChevronRight className="size-4" />
            </button>
          ))}
        </div>
        {warning && (
          <div className="mt-5 rounded-2xl bg-[#fff2ec] p-4 text-sm leading-6 text-[#a64b32]">
            <AlertCircle className="mr-2 inline size-4" />
            {warning}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setWarning('');
                  setTarget(null);
                  setModal('learning');
                }}
              >
                현재 단계 학습
              </Button>
              <Button
                disabled={busy || !target}
                onClick={() =>
                  target &&
                  start({
                    sessionType: 'promotion_test',
                    targetPublicLevel: target.level,
                    force: true,
                  })
                }
              >
                그래도 시작
              </Button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        open={modal === 'demotion'}
        title="낮출 레벨을 선택하세요"
        close={() => {
          setModal(null);
          setTarget(null);
        }}
      >
        <p className="mt-2 text-sm leading-6 text-[#69736e]">
          현재 단계의 진단 상태는 초기화되며, 이전 학습 기록은 삭제되지
          않습니다.
        </p>
        <div className="mt-6 space-y-2">
          {lower
            .flatMap((level) =>
              level === '5.0'
                ? [
                    { level, group: '5.0_basic', label: '5.0 기본반' },
                    { level, group: null, label: '5.0' },
                  ]
                : [{ level, group: null, label: displayLevel(level) }],
            )
            .map((choice) => (
              <button
                key={`${choice.level}-${choice.group}`}
                onClick={() => setTarget(choice)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${target?.level === choice.level && target.group === choice.group ? 'border-[#d76a47] bg-[#fff8f4]' : 'border-[#ded7ca]'}`}
              >
                <span className="font-semibold">{choice.label}</span>
                {target?.level === choice.level &&
                  target.group === choice.group && (
                    <Check className="size-4 text-[#d76a47]" />
                  )}
              </button>
            ))}
        </div>
        <Button
          disabled={!target || busy}
          onClick={change}
          className="mt-6 w-full"
        >
          {target
            ? `${displayLevel(target.level, target.group)}로 변경`
            : '레벨 선택'}
        </Button>
      </Dialog>
      <Dialog
        open={Boolean(activeSession)}
        title="아직 풀지 않은 문제가 있습니다."
        close={() => router.replace('/writing')}
      >
        <p className="mt-3 text-sm leading-6 text-[#69736e]">
          이어서 문제를 푸시겠습니까?
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => router.replace('/writing')}>
            취소
          </Button>
          <Button
            onClick={() =>
              activeSession &&
              router.replace('/writing/session/' + activeSession.id)
            }
          >
            이어서 풀기
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

export function WritingSessionClient({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [answerSections, setAnswerSections] = useState<
    Array<{ label: string; text: string }>
  >([]);
  const [foundationAnswers, setFoundationAnswers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [structureGuideBusy, setStructureGuideBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const applyingPromotion = useRef(false);
  const revealingHints = useRef(new Set<number>());
  const load = () => {
    setError('');
    return api<{ session: any }>(undefined, `session&sessionId=${sessionId}`)
      .then((data) => {
        setSession(data.session);
        if (data.session.status === 'abandoned')
          router.replace('/writing/practice');
      })
      .catch((cause: Error) => setError(cause.message));
  };
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const current = session?.currentItem;
  useEffect(() => {
    if (busy || (session?.status !== 'generating' && current?.status !== 'submitted')) return;
    let pending = false;
    const timer = window.setInterval(() => {
      if (pending) return;
      pending = true;
      void load().finally(() => {pending=false;});
    },2000);
    return () => window.clearInterval(timer);
  },[busy,session?.status,current?.status]);
  const isLearning = session?.type === 'learning';
  const structureLabels =
    current?.taskType === 'task1' || current?.taskType === 'task2'
      ? ['서론', '본론 1', '본론 2']
      : [];
  const structureGuideAvailable = isLearning && structureLabels.length > 0;
  const structureGuideUsed = Boolean(current?.structureGuideUsed);
  const foundationQuestions = Array.isArray(
    current?.question?.material?.questions,
  )
    ? current.question.material.questions
        .map((question: any) =>
          typeof question?.prompt === 'string' ? question.prompt.trim() : '',
        )
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const isFoundationDrill =
    current?.taskType === 'foundation' && foundationQuestions.length === 3;
  const foundationSections = isFoundationDrill
    ? foundationQuestions.map((_: string, index: number) => ({
        label: `Question ${index + 1}`,
        text: (foundationAnswers[index] ?? '').trim(),
      }))
    : [];
  const submittedAnswer = structureGuideUsed
    ? answerSections
        .map((section) => section.text.trim())
        .filter(Boolean)
        .join('\n\n')
    : isFoundationDrill
      ? foundationQuestions
          .map(
            (question: string, index: number) =>
              `Question ${index + 1}: ${question}\nAnswer ${index + 1}: ${(foundationAnswers[index] ?? '').trim()}`,
          )
          .join('\n\n')
      : answer;
  const countedAnswer = isFoundationDrill
    ? foundationSections
        .map((section: { text: string }) => section.text)
        .filter(Boolean)
        .join('\n\n')
    : submittedAnswer;
  const hasRequiredAnswer = isFoundationDrill
    ? foundationSections.every((section: { text: string }) =>
        Boolean(section.text),
      )
    : Boolean(submittedAnswer.trim());
  useEffect(() => {
    if (!current) return;
    if (current.structureGuideUsed) {
      setAnswerSections((previous) =>
        previous.length
          ? previous
          : structureLabels.map((label) => ({ label, text: '' })),
      );
      return;
    }
    setAnswerSections([]);
    setFoundationAnswers(
      Array.isArray(current.question?.material?.questions)
        ? Array(3).fill('')
        : [],
    );
  }, [current?.id, current?.structureGuideUsed]); // eslint-disable-line react-hooks/exhaustive-deps
  const reveal = async (hintId: number) => {
    if (!current || revealingHints.current.has(hintId)) return false;
    if (session.hints?.find((hint: any) => hint.id === hintId)?.revealed) return true;
    revealingHints.current.add(hintId);
    setError('');
    try {
    const result = await api<{ content: string }>({
      action: 'reveal-hint',
      sessionId,
      itemId: current.id,
      hintId,
    });
    setSession((previous: any) => ({...previous,hints:previous.hints.map((hint: any)=>hint.id===hintId?{...hint,revealed:true,content:result.content}:hint)}));
    return true;
    } catch(cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '힌트 사용 기록을 저장하지 못했습니다.',
      );
      return false;
    } finally { revealingHints.current.delete(hintId); }
  };
  const submit = async () => {
    if (!hasRequiredAnswer || !current || busy || structureGuideBusy) return;
    setBusy(true);
    setError('');
    try {
      const result = await api<{ result: any; session: any }>({
        action: 'submit',
        sessionId,
        itemId: current.id,
        answer: submittedAnswer,
        answerSections: isFoundationDrill
          ? foundationSections
          : structureGuideUsed
            ? answerSections
            : [],
      });
      setSession(result.session);
      setFeedback(result.result ? { ...result.result, answerText: submittedAnswer } : null);
      setAnswer('');
      setAnswerSections([]);
      setFoundationAnswers([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '채점하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };
  const useStructureGuide = async () => {
    if (!current || !structureGuideAvailable) return;
    setStructureGuideBusy(true);
    setError('');
    try {
      const result = await api<{ enabled: boolean }>({
        action: 'use-structure-guide',
        sessionId,
        itemId: current.id,
      });
      if (result.enabled) {
        setAnswerSections(
          structureLabels.map((label, index) => ({
            label,
            text: index === 0 ? answer : '',
          })),
        );
        setAnswer('');
      } else {
        setAnswer(
          answerSections
            .map((section) => section.text.trim())
            .filter(Boolean)
            .join('\n\n'),
        );
        setAnswerSections([]);
      }
      setSession((previous: any) => ({
        ...previous,
        currentItem: {
          ...previous.currentItem,
          structureGuideUsed: result.enabled,
          structureGuidePenalty: result.enabled ? 10 : 0,
        },
      }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '문단 구조 가이드를 열지 못했습니다.',
      );
    } finally {
      setStructureGuideBusy(false);
    }
  };
  const abandon = async () => {
    if (
      !confirm(
        '현재 세션을 포기할까요? 답하지 않은 문제는 기록에 반영되지 않습니다.',
      )
    )
      return;
    setBusy(true);
    try {
      await api({ action: 'abandon', sessionId });
      router.replace('/writing/practice');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '세션을 포기하지 못했습니다.',
      );
    } finally {
      setBusy(false);
    }
  };
  const next = () => {
    setFeedback(null);
    load();
  };
  const applyPromotion = async () => {
    if (applyingPromotion.current) return;
    applyingPromotion.current = true;
    setBusy(true);
    setError('');
    try {
      await api({ action: 'apply-promotion', sessionId });
      router.replace('/writing');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '승급을 적용하지 못했습니다.',
      );
    } finally {
      applyingPromotion.current = false;
      setBusy(false);
    }
  };
  if (!session && error)
    return <InitialLoadError message={error} retry={load} />;
  if (!session)
    return (
      <section className="mt-7 grid min-h-64 place-items-center rounded-3xl border border-dashed border-[#d7cfc2]">
        <Loader2 className="size-5 animate-spin text-[#d76a47]" />
      </section>
    );
  if (session.status === 'generating' || current?.status === 'submitted') return (
    <section className="mt-7 rounded-3xl border border-[#ded7ca] bg-[#fffdf8] p-7 text-center" role="status">
      <Loader2 className="mx-auto size-6 animate-spin text-[#d76a47]" />
      <p className="mt-4">{session.status==='generating'?'문제를 준비하고 있어요.':'답안을 채점하고 있어요.'}</p>
      <p className="mt-2 text-sm text-[#69736e]">완료되면 자동으로 이어집니다.</p>
      {error && <p role="alert" className="mt-3 text-sm text-[#c34f32]">{error}</p>}
      <Button variant="outline" className="mt-5" disabled={busy} onClick={abandon}>세션 포기</Button>
    </section>
  );
  if (feedback && isLearning)
    return (
      <section className="mt-7 max-w-3xl rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
        <p className="text-xs font-bold tracking-[.14em] text-[#d76a47]">
          LEARNING FEEDBACK
        </p>
        <h2 className="mt-2 font-serif text-3xl">이번 답안을 살펴볼까요?</h2>
        <Performance score={feedback.effectiveScore} />
        {typeof feedback.answerText === 'string' && feedback.answerText && (
          <section aria-label="내가 제출한 답안" className="mt-6 rounded-2xl border border-[#ece5da] bg-[#fbf9f4] p-4">
            <h3 className="font-bold text-[#24333a]">내가 제출한 답안</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#344149]">
              {feedback.answerText}
            </p>
          </section>
        )}
        <Feedback data={feedback.feedback} />
        <Button
          className="mt-7"
          onClick={session.completed ? () => router.replace('/writing') : next}
        >
          {session.completed ? 'Board로 돌아가기' : '다음 문제'}{' '}
          <ArrowRight className="size-4" />
        </Button>
      </section>
    );
  if (session.completed) {
    const results = Array.isArray(session.results) ? session.results : [];
    const averageScore = session.averageScore ?? session.promotionScore;
    const resultTitle =
      session.type === 'placement_test'
        ? '시작 레벨 진단'
        : session.type === 'test'
          ? '일반 테스트'
          : session.type === 'learning'
            ? '학습'
            : '승급 테스트';
    return (
      <section className="mt-7 max-w-3xl rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7 text-center shadow-[0_18px_48px_rgba(35,44,43,0.05)]">
        <Check className="mx-auto size-9 text-[#38634f]" />
        <p className="mt-4 text-xs font-bold tracking-[.14em] text-[#d76a47]">
          COMPLETED
        </p>
        <h2 className="mt-2 font-serif text-3xl">세션을 완료했습니다.</h2>
        {typeof averageScore === 'number' && (
          <Performance
            score={averageScore}
            title={`${resultTitle} 전체 결과`}
          />
        )}
        {session.type === 'promotion_test' && (
          <p className="mt-3 text-sm text-[#69736e]">
            {session.promotionRecommendation === 'ready'
              ? '목표 레벨에 도전할 준비가 되었습니다.'
              : '현재 단계에서 조금 더 학습하는 것을 권장합니다.'}
          </p>
        )}
        {session.type === 'promotion_test' &&
          session.promotionRecommendation === 'ready' && (
            <Button className="mt-6" disabled={busy} onClick={applyPromotion}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? '승급 적용 중' : '승급 적용하기'}
            </Button>
          )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-[#c34f32]">
            {error}
          </p>
        )}
        {results.length > 0 && (
          <div className="mt-6 space-y-5 text-left">
            {results.map((result: any) => (
              <article
                key={result.itemId}
                className="rounded-2xl border border-[#ded7ca] bg-[#fbf9f4] p-5"
              >
                <p className="text-xs font-bold tracking-[.12em] text-[#d76a47]">
                  QUESTION {result.order} ·{' '}
                  {result.taskType === 'task1'
                    ? 'Task 1'
                    : result.taskType === 'task2'
                      ? 'Task 2'
                      : 'FOUNDATION'}
                </p>
                <Performance score={result.effectiveScore} />
                <p className="mt-4 text-xs font-bold text-[#69736e]">
                  MY ANSWER
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#344149]">
                  {result.answerText}
                </p>
                <Feedback data={result.feedback} />
              </article>
            ))}
          </div>
        )}
        <a
          href="/writing"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#d76a47]"
        >
          Board로 돌아가기 <ArrowRight className="size-4" />
        </a>
      </section>
    );
  }
  if (!current) return null;
  const material = current.question.material;
  return (
    <section className="mt-7 max-w-3xl">
      <AiProgressOverlay active={busy} label="AI가 응답을 준비하고 있어요." />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.14em] text-[#d76a47]">
            {session.type.replace('_', ' ').toUpperCase()} · QUESTION{' '}
            {current.order}/{session.expectedItemCount}
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            {current.taskType === 'task1'
              ? 'Task 1'
              : current.taskType === 'task2'
                ? 'Task 2'
                : 'FOUNDATION'}
          </h2>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={abandon}
          className="text-sm font-semibold text-[#8a756b] hover:text-[#c34f32]"
        >
          포기하기
        </button>
      </div>
      {material &&
        Object.keys(material).length > 0 &&
        (current.taskType === 'foundation' ? (
          <section className="mt-5 rounded-3xl border border-[#dcd6ca] bg-[#f7faf7] p-6 shadow-[0_12px_32px_rgba(35,44,43,0.04)] sm:p-7">
            <p className="text-[11px] font-bold tracking-[.16em] text-[#38634f]">
              SHORT SOURCE MATERIAL
            </p>
            {typeof material.title === 'string' && material.title && (
              <h3 className="mt-2 font-serif text-2xl text-[#24333a]">
                {material.title}
              </h3>
            )}
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[#314047]">
              {typeof material.content === 'string'
                ? material.content
                : typeof material.description === 'string'
                  ? material.description
                  : ''}
            </p>
          </section>
        ) : (
          <WritingMaterial
            format={current.question.questionFormat}
            material={material}
          />
        ))}
      <section className="mt-5 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_12px_32px_rgba(35,44,43,0.04)] sm:p-7">
        <div className="flex items-start gap-4 border-b border-[#ece5da] pb-5">
          <span className="font-serif text-5xl leading-none text-[#d76a47]">
            Q.
          </span>
          <div>
            <p className="text-[11px] font-bold tracking-[.16em] text-[#d76a47]">
              WRITING QUESTION
            </p>
            <h3 className="mt-1 font-serif text-2xl text-[#24333a]">
              Write your response.
            </h3>
          </div>
        </div>
        <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-[#314047]">
          {current.question.prompt}
        </p>
        {isFoundationDrill ? (
          <p className="mt-4 rounded-xl bg-[#fff8f4] px-4 py-3 text-sm text-[#a45138]">
            아래 3개 질문에 각각 짧은 영어 문장으로 답해 보세요.
          </p>
        ) : current.targetSentenceCount ? (
          <p className="mt-4 rounded-xl bg-[#fff8f4] px-4 py-3 text-sm text-[#a45138]">
            영어 {current.targetSentenceCount}문장을 작성해 보세요.
          </p>
        ) : null}
        {isLearning && session.hints?.length > 0 && (
          <div className="hidden">
            {session.hints.map((hint: any) => (
              <button
                type="button"
                key={hint.id}
                onClick={() => !hint.revealed && reveal(hint.id)}
                className="rounded-xl border border-[#ded7ca] px-4 py-3 text-left text-sm hover:border-[#e6b7a5]"
              >
                <span className="font-bold text-[#d76a47]">
                  HINT {hint.order} · {hint.type}
                </span>
                <span className="mt-1 block leading-6 text-[#69736e]">
                  {hint.revealed ? hint.content : '눌러서 힌트 보기'}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-6">
          <HintMenu
            hints={isLearning ? (session.hints ?? []) : []}
            onReveal={reveal}
            structureGuide={{
              available: structureGuideAvailable,
              used: structureGuideUsed,
              busy: structureGuideBusy,
              onUse: useStructureGuide,
            }}
          />
          {isFoundationDrill ? (
            <div className="mt-3 space-y-4">
              {foundationQuestions.map((question: string, index: number) => (
                <label
                  key={question}
                  className="block rounded-2xl border border-[#ded7ca] bg-[#fffefa] p-4"
                >
                  <span className="text-xs font-bold tracking-[.12em] text-[#d76a47]">
                    QUESTION {index + 1}
                  </span>
                  <span className="mt-2 block text-sm font-semibold leading-6 text-[#314047]">
                    {question}
                  </span>
                  <textarea
                    value={foundationAnswers[index] ?? ''}
                    onChange={(event) =>
                      setFoundationAnswers((previous) =>
                        Array.from({ length: 3 }, (_, answerIndex) =>
                          answerIndex === index
                            ? event.target.value
                            : (previous[answerIndex] ?? ''),
                        ),
                      )
                    }
                    placeholder="영어 한 문장으로 답하세요."
                    className="mt-3 min-h-24 w-full resize-y rounded-xl border border-[#d7cfc2] bg-[#fffdf8] p-3 text-base leading-7 outline-none focus:border-[#d76a47]"
                  />
                </label>
              ))}
            </div>
          ) : structureGuideUsed ? (
            <div className="mt-3 space-y-4">
              <div className="rounded-xl border border-[#f0cbbb] bg-[#fff8f4] px-4 py-3 text-sm leading-6 text-[#8a4a37]">
                문단 구조 가이드를 사용 중입니다. 문단별 역할을 확인하며 작성해
                보세요.
              </div>
              {answerSections.map((section, index) => (
                <label key={section.label} className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[.12em] text-[#d76a47]">
                    <span>SECTION {index + 1}</span>
                    <span className="text-[#314047]">{section.label}</span>
                  </span>
                  <textarea
                    value={section.text}
                    onChange={(event) =>
                      setAnswerSections((previous) =>
                        previous.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, text: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder={`${section.label} 문단을 영어로 작성하세요.`}
                    className="min-h-36 w-full resize-y rounded-2xl border border-[#d7cfc2] bg-[#fffdf8] p-4 text-base leading-7 outline-none focus:border-[#d76a47]"
                  />
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="영어로 답안을 작성하세요."
              className="mt-3 min-h-52 w-full resize-y rounded-2xl border border-[#d7cfc2] bg-[#fffdf8] p-4 text-base leading-7 outline-none focus:border-[#d76a47]"
            />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-[#7b827e]">
          <span>
            {countedAnswer.trim()
              ? countedAnswer.trim().split(/\s+/).length
              : 0}{' '}
            words · {[...countedAnswer].length} chars
          </span>
          {current.targetWordCount && (
            <span>권장 {current.targetWordCount}+ words</span>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-[#c34f32]">{error}</p>}
        <Button
          disabled={busy || structureGuideBusy || !hasRequiredAnswer}
          onClick={submit}
          className="mt-5 w-full"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              채점 중
            </>
          ) : (
            '답안 제출'
          )}
        </Button>
      </section>
    </section>
  );
}

function Performance({
  score,
  title = '학습 결과',
}: {
  score: unknown;
  title?: string;
}) {
  const valid = typeof score === 'number' && Number.isFinite(score);
  const label = !valid
    ? '평가 정보가 없어요'
    : score >= 78
      ? '잘했어요'
      : score >= 60
        ? '조금 더 다듬어요'
        : '보완이 필요해요';
  const color =
    valid && score >= 78
      ? 'bg-[#eef5f0] text-[#38634f]'
      : valid && score >= 60
        ? 'bg-[#fff4e3] text-[#795b25]'
        : 'bg-[#fff0e9] text-[#a64b32]';
  return (
    <div
      className={`relative mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-left text-sm ${color}`}
    >
      <p>
        <span className="mr-2">{title}</span>
        <strong>{label}</strong>
      </p>
      <details className="group shrink-0">
        <summary
          aria-label="평가 기준 안내"
          className="grid size-12 cursor-pointer list-none place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
        >
          <CircleHelp className="size-5" />
        </summary>
        <p
          role="note"
          className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-[#dcd6ca] bg-[#fffdf8] p-4 font-normal leading-6 text-[#344149] shadow-lg"
        >
          이 결과는 답안을 평가한 학습 단계의 기준으로 측정했어요. 과제 수행,
          구성·연결, 어휘, 문법을 함께 살펴보고, 사용한 힌트도 반영해요. 승급
          테스트는 도전한 목표 단계가 기준이에요. 공식 IELTS Band나 다른
          학습자와의 순위는 아니에요.
        </p>
      </details>
    </div>
  );
}

function VocabularyFeedback({
  synonyms,
  expressions,
}: {
  synonyms: unknown;
  expressions: unknown;
}) {
  const strings = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .filter(
            (item): item is string =>
              typeof item === 'string' && Boolean(item.trim()),
          )
          .map((item) => item.trim())
      : [];
  const alternatives: string[] = [],
    meanings: string[] = [];
  for (const item of strings(synonyms)) {
    const pair = item.split(/\s*(?:=|→|->)\s*/);
    // Legacy grading sometimes puts Korean glosses in synonyms; keep them without mislabelling them.
    if (pair.length > 1 && /^[^A-Za-z]*[가-힣]/.test(pair[1]))
      meanings.push(item);
    else alternatives.push(item);
  }
  return (
    <>
      {[
        {
          title: '유의어·대체어',
          description: '비슷한 의미로 바꿔 쓸 수 있는 영어 어휘예요.',
          items: alternatives,
        },
        {
          title: '어휘·구문 뜻',
          description: '답안에 쓰인 단어와 구문의 뜻을 살펴보세요.',
          items: meanings,
        },
        {
          title: '활용 표현·예문',
          description: '비교나 설명에 활용할 수 있는 구문과 예문이에요.',
          items: strings(expressions),
        },
      ]
        .filter((group) => group.items.length)
        .map((group) => (
          <section key={group.title}>
            <h3 className="font-bold text-[#24333a]">{group.title}</h3>
            <p className="mt-1 text-[#69736e]">{group.description}</p>
            <ul className="mt-3 space-y-2">
              {group.items.map((item, index) => (
                <li
                  key={index}
                  className="whitespace-pre-wrap break-words rounded-xl border border-[#ece5da] bg-[#fffdf8] px-4 py-3 text-[#344149]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
    </>
  );
}

function Feedback({ data }: { data: any }) {
  if (!data || typeof data !== 'object') return null;
  if (Array.isArray(data.keyLearningPoints))
    return <StructuredFeedback data={data} />;
  return (
    <div className="mt-6 space-y-5 text-sm leading-6">
      <Section title="최소 교정 답안" value={data.correctedAnswer} />
      <Section
        title="오류 설명"
        value={
          Array.isArray(data.errors)
            ? data.errors
                .map(
                  (item: any) =>
                    `${item.original} → ${item.correction}\n${item.reason}`,
                )
                .join('\n\n')
            : null
        }
      />
      <VocabularyFeedback
        synonyms={data.synonyms}
        expressions={data.usefulExpressions}
      />
      <Section title="개선 답안" value={data.improvedAnswer} />
      <Section title="이번에 기억할 핵심" value={data.keyLearning} />
    </div>
  );
}

function StructuredFeedback({ data }: { data: any }) {
  const errors = Array.isArray(data.errors) ? data.errors : [];
  const synonymGroups = Array.isArray(data.synonymGroups)
    ? data.synonymGroups
    : [];
  const usefulExpressions = Array.isArray(data.usefulExpressions)
    ? data.usefulExpressions
    : [];
  const improvedAnswer = Array.isArray(data.improvedAnswer)
    ? data.improvedAnswer
    : typeof data.improvedAnswer === 'string'
      ? data.improvedAnswer
          .split(/\n\s*\n/)
          .filter((part: string) => part.trim())
          .map((part: string, index: number) => ({
            label: `문단 ${index + 1}`,
            text: part.trim(),
          }))
      : [];
  const keyLearningPoints = Array.isArray(data.keyLearningPoints)
    ? data.keyLearningPoints
    : [];
  return (
    <div className="mt-6 space-y-7 text-sm leading-6">
      <Section title="최소 교정 답안" value={data.correctedAnswer} />
      {errors.length > 0 && (
        <section>
          <h3 className="font-bold text-[#24333a]">오류 설명</h3>
          <div className="mt-3 space-y-3">
            {errors.map((item: any, index: number) => (
              <article
                key={`${item.original}-${index}`}
                className="rounded-2xl border border-[#ece5da] bg-[#fbf9f4] p-4"
              >
                <p className="font-medium text-[#8a756b] line-through">
                  {item.original}
                </p>
                <p className="mt-1 font-bold text-[#c95738]">
                  {item.correction}
                </p>
                <p className="mt-2 text-[#69736e]">{item.reason}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {synonymGroups.length > 0 && (
        <section>
          <h3 className="font-bold text-[#24333a]">유의어·대체어</h3>
          <div className="mt-3 space-y-3">
            {synonymGroups.map((group: any, index: number) => (
              <article
                key={`${group.term}-${index}`}
                className="rounded-2xl border border-[#ece5da] p-4"
              >
                <p className="font-bold text-[#24333a]">{group.term}</p>
                <p className="mt-1 text-[#c95738]">
                  {(group.alternatives ?? []).join(' · ')}
                </p>
                {group.note && (
                  <p className="mt-2 text-[#69736e]">{group.note}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {usefulExpressions.length > 0 && (
        <section>
          <h3 className="font-bold text-[#24333a]">활용 표현·예문</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {usefulExpressions.map((item: any, index: number) => (
              <article
                key={`${item.expression}-${index}`}
                className="rounded-2xl border border-[#ece5da] bg-[#fffdf8] p-4"
              >
                <p className="font-bold text-[#24333a]">{item.expression}</p>
                <p className="mt-1 text-[#c95738]">{item.meaning}</p>
                {item.example && (
                  <p className="mt-3 border-t border-[#eee8dd] pt-3 text-[#69736e]">
                    {item.example}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {improvedAnswer.length > 0 && (
        <section>
          <h3 className="font-bold text-[#24333a]">개선 답안</h3>
          <div className="mt-3 space-y-3 rounded-2xl border border-[#dce8e0] bg-[#f7fbf8] p-4 sm:p-5">
            {improvedAnswer.map((paragraph: any, index: number) => (
              <div key={`${paragraph.label}-${index}`}>
                {paragraph.label && (
                  <p className="text-xs font-bold tracking-[.12em] text-[#38634f]">
                    {paragraph.label}
                  </p>
                )}
                <p className="mt-1 whitespace-pre-wrap text-[#344149]">
                  {paragraph.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      {keyLearningPoints.length > 0 && (
        <section>
          <h3 className="font-bold text-[#24333a]">이번에 기억할 핵심</h3>
          <ul className="mt-3 space-y-2">
            {keyLearningPoints.map((point: string, index: number) => (
              <li
                key={`${point}-${index}`}
                className="flex gap-2 text-[#69736e]"
              >
                <Check className="mt-1 size-4 shrink-0 text-[#38634f]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Section title="다음 학습 목표" value={data.nextFocus} />
    </div>
  );
}
function Section({ title, value }: { title: string; value: any }) {
  const content = typeof value === 'string' ? value.trim() : '';
  return content ? (
    <section>
      <h3 className="font-bold text-[#24333a]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-[#69736e]">{content}</p>
    </section>
  ) : null;
}

export function WritingNotebookClient() {
  const [entries, setEntries] = useState<any[] | null>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const [materialOpened, setMaterialOpened] = useState<number | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ entries: any[] }>(undefined, 'notebook')
      .then((notebook) => setEntries(notebook.entries))
      .catch((cause: Error) => setError(cause.message));
  }, []);
  if (error)
    return (
      <section className="mt-7 rounded-3xl border border-[#efd2c7] bg-[#fff8f4] p-6 text-sm text-[#a64b32]">
        {error}
      </section>
    );
  if (!entries)
    return (
      <section className="mt-7 grid min-h-56 place-items-center rounded-3xl border border-dashed border-[#d7cfc2]">
        <Loader2 className="size-5 animate-spin text-[#d76a47]" />
      </section>
    );
  if (!entries.length)
    return (
      <section className="mt-7 rounded-3xl border border-dashed border-[#d7cfc2] bg-[#fbf9f4] p-10 text-center">
        <BookOpenCheck className="mx-auto size-8 text-[#d76a47]" />
        <h2 className="mt-4 font-serif text-3xl">아직 정리할 오답이 없어요.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#69736e]">
          학습과 테스트에서 보완할 답안이 생기면 이곳에 원문과 첨삭을 함께
          기록합니다.
        </p>
      </section>
    );
  return (
    <section className="mt-7 space-y-3">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="rounded-2xl border border-[#dcd6ca] bg-[#fffdf8] p-5"
        >
          <button
            type="button"
            onClick={() => setOpened(opened === entry.id ? null : entry.id)}
            className="flex w-full items-start justify-between gap-4 text-left"
          >
            <span>
              <span className="text-xs font-bold tracking-[.12em] text-[#d76a47]">
                {entry.taskType === 'task1'
                  ? 'TASK 1'
                  : entry.taskType === 'task2'
                    ? 'TASK 2'
                    : 'FOUNDATION'}{' '}
                · {entry.errorCount}개 보완
              </span>
              <span className="mt-2 block font-serif text-xl text-[#24333a]">
                {entry.title}
              </span>
            </span>
            <ChevronRight
              className={`mt-2 size-4 shrink-0 text-[#69736e] transition-transform ${opened === entry.id ? 'rotate-90' : ''}`}
            />
          </button>
          <Performance score={entry.score} />
          {opened === entry.id && (
            <div className="mt-5 border-t border-[#ece5da] pt-5">
              {entry.material && Object.keys(entry.material).length > 0 && (
                <section className="mb-5">
                  <button
                    type="button"
                    onClick={() =>
                      setMaterialOpened(
                        materialOpened === entry.id ? null : entry.id,
                      )
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d7cfc2] bg-[#fffdf8] px-3.5 text-sm font-bold text-[#344149] transition-colors hover:bg-[#f7f2ea]"
                    aria-expanded={materialOpened === entry.id}
                  >
                    <FileText className="size-4 text-[#d76a47]" />
                    문제 자료 보기
                    <ChevronRight
                      className={`size-4 text-[#69736e] transition-transform ${materialOpened === entry.id ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {materialOpened === entry.id && (
                    <div className="mt-3 rounded-2xl border border-[#e5ddd1] bg-[#fbf9f4] p-3 sm:p-4">
                      <WritingMaterial
                        format={entry.questionFormat}
                        material={entry.material}
                      />
                    </div>
                  )}
                </section>
              )}
              <p className="text-xs font-bold text-[#69736e]">MY ANSWER</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#344149]">
                {entry.answer}
              </p>
              <Feedback data={entry.feedback} />
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
