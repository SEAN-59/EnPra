'use client';

import { ArrowRight, ChevronRight, CircleAlert, Headphones, Mic, Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useStaticCopy } from '@/components/static-copy-provider';

type NotebookEntry = {
  id: number;
  part: 'PART 1' | 'PART 2' | 'PART 3';
  mode: '학습하기' | '일반 테스트';
  title: string;
  completedAt: string;
  duration: number;
  hasRecording: boolean;
  status: '보완 필요' | '복습 권장' | '확인 완료';
  focuses: string[];
  question: string;
  translation: string;
  transcript: string;
  strength: string;
  improve: string;
  href: string;
};

const previewEntries: NotebookEntry[] = [
  {
    id: 1,
    part: 'PART 3',
    mode: '학습하기',
    title: 'Public spaces in modern cities',
    completedAt: '오늘',
    duration: 42,
    hasRecording: false,
    status: '보완 필요',
    focuses: ['근거 확장', '예시 구체화'],
    question: 'Why do you think public spaces are important in modern cities?',
    translation: '현대 도시에서 공공장소가 중요한 이유는 무엇이라고 생각하나요?',
    transcript: 'I think public spaces are important because they give people a place to relax and meet others. They can also make crowded cities feel more liveable.',
    strength: '의견을 먼저 밝힌 뒤 두 가지 이유를 자연스럽게 연결했어요.',
    improve: '공원이나 광장처럼 구체적인 예시를 한 가지 더하면 답변이 더 설득력 있어집니다.',
    href: '/speaking/part3?mode=learning',
  },
  {
    id: 2,
    part: 'PART 2',
    mode: '일반 테스트',
    title: 'Describe a public park you enjoyed visiting',
    completedAt: '어제',
    duration: 98,
    hasRecording: true,
    status: '복습 권장',
    focuses: ['시간 흐름', '연결 표현'],
    question: 'Describe a public park you enjoyed visiting.',
    translation: '즐겁게 방문했던 공원 한 곳을 설명해 보세요.',
    transcript: 'I would like to talk about a park near my home. I visited it with my friends last spring, and we spent the afternoon walking around the lake and having a picnic.',
    strength: '장소, 방문 시점, 활동을 순서대로 말해 긴 답변의 흐름이 안정적이었어요.',
    improve: '마지막에 그 장소가 기억에 남는 이유를 한 문장으로 정리해 보세요.',
    href: '/speaking/part2?mode=test',
  },
  {
    id: 3,
    part: 'PART 1',
    mode: '학습하기',
    title: 'Your home town',
    completedAt: '3일 전',
    duration: 31,
    hasRecording: false,
    status: '확인 완료',
    focuses: ['현재완료', '대조 표현'],
    question: 'Has your home town changed much in recent years?',
    translation: '최근 몇 년 사이에 고향이 많이 변했나요?',
    transcript: 'Yes, it has changed a lot. More tourists visit the city now, so new hotels and public transport have been developed.',
    strength: '현재완료와 변화의 결과를 적절하게 활용해 명확하게 답했어요.',
    improve: '관광객 증가가 주민들의 생활에 미친 영향을 한 문장 더 덧붙여 보세요.',
    href: '/speaking/part1?mode=learning',
  },
];

function formatTime(seconds: number) {
  return `00:${String(seconds).padStart(2, '0')}`;
}

function RecordingPlayer({ duration, label }: { duration: number; label: string }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setElapsed((current) => {
        if (current >= duration) {
          setPlaying(false);
          return duration;
        }
        return Math.min(duration, current + 1);
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [duration, playing]);

  const togglePlayback = () => {
    if (elapsed >= duration) setElapsed(0);
    setPlaying((current) => !current);
  };

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#1d2935] p-3.5 text-white">
      <button type="button" aria-label={playing ? '내 답변 일시정지' : '내 답변 재생'} onClick={togglePlayback} className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#1d2935] transition hover:bg-[#fff5ef]">
        {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold tracking-[.14em] text-[#f0b197]">{label}</p><p className="text-xs tabular-nums text-white/65">{formatTime(elapsed)} / {formatTime(duration)}</p></div>
        <div className="relative mt-2.5 h-5">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#f0b197] transition-[width] duration-200" style={{ width: `${(elapsed / duration) * 100}%` }} /></div>
          <input type="range" min={0} max={duration} value={elapsed} onChange={(event) => setElapsed(Number(event.target.value))} aria-label="내 답변 재생 위치" className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0" />
        </div>
      </div>
    </div>
  );
}

function EntryCard({ entry, opened, onToggle, labels }: { entry: NotebookEntry; opened: boolean; onToggle: () => void; labels: { question: string; answer: string; feedback: string; review: string; strength: string; improve: string; recording: string; recordingAvailable: string; recordingUnavailable: string } }) {
  const statusStyle = entry.status === '보완 필요'
    ? 'bg-[#fff1eb] text-[#b25336]'
    : entry.status === '복습 권장'
      ? 'bg-[#fff7e7] text-[#9a692d]'
      : 'bg-[#eaf4ed] text-[#38634f]';

  return (
    <article className="overflow-hidden rounded-2xl border border-[#dcd6ca] bg-[#fffdf8] transition-shadow hover:shadow-[0_10px_28px_rgba(35,44,43,0.04)]">
      <button type="button" onClick={onToggle} aria-expanded={opened} className="flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6">
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-[.1em] text-[#d76a47]">{entry.part}<span className="text-[#9aa19c]">·</span><span className="text-[#68736e]">{entry.mode}</span></span>
          <span className="mt-2 block truncate font-serif text-xl text-[#24333a] sm:text-2xl">{entry.title}</span>
          <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#747d77]"><span>{entry.completedAt}</span><span className="text-[#cac2b6]">•</span><span>내 답변 {formatTime(entry.duration)}</span></span>
        </span>
        <span className="flex shrink-0 items-center gap-2 sm:gap-3">
          {entry.hasRecording && <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe1d4] bg-[#eef7f0] px-2.5 py-1 text-xs font-bold text-[#38634f]"><Mic className="size-3.5" />{labels.recordingAvailable}</span>}
          <span className={`hidden rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex ${statusStyle}`}>{entry.status}</span>
          <ChevronRight className={`size-5 text-[#78827c] transition-transform ${opened ? 'rotate-90' : ''}`} />
        </span>
      </button>
      {opened && <div className="border-t border-[#ece5da] px-5 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,.9fr)]">
          <div className="space-y-5">
            <section>
              <p className="text-xs font-bold tracking-[.14em] text-[#d76a47]">{labels.question}</p>
              <div className="mt-3 rounded-2xl border border-[#dbe4dd] bg-[#f4f8f5] p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#38634f] text-white"><Volume2 className="size-4" /></span><div><p className="font-serif text-lg leading-7 text-[#2f4040]">{entry.question}</p><p className="mt-2 text-sm leading-6 text-[#65766c]">{entry.translation}</p></div></div></div>
            </section>
            <section>
              <p className="text-xs font-bold tracking-[.14em] text-[#d76a47]">{labels.answer}</p>
              {entry.hasRecording
                ? <div className="mt-3"><RecordingPlayer duration={entry.duration} label={labels.recording} /></div>
                : <p className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-[#d9d3c7] bg-[#fbfaf6] px-4 py-3 text-sm leading-6 text-[#747d77]"><Mic className="size-4 shrink-0 text-[#a1aaa4]" />{labels.recordingUnavailable}</p>}
              <p className="mt-3 rounded-2xl border border-[#e4ddd2] bg-[#fbfaf6] p-4 text-sm leading-7 text-[#42514f]">{entry.transcript}</p>
            </section>
          </div>
          <aside className="rounded-2xl border border-[#ead9ce] bg-[#fff9f5] p-5">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[#c85f40]"><Sparkles className="size-4" />{labels.feedback}</p>
            <section className="mt-5"><p className="text-xs font-bold text-[#50625a]">{labels.strength}</p><p className="mt-2 text-sm leading-6 text-[#5d645f]">{entry.strength}</p></section>
            <section className="mt-5 border-t border-[#eddcd1] pt-5"><p className="text-xs font-bold text-[#b25336]">{labels.improve}</p><p className="mt-2 text-sm leading-6 text-[#6c5a51]">{entry.improve}</p></section>
            <div className="mt-5 flex flex-wrap gap-2">{entry.focuses.map((focus) => <span key={focus} className="rounded-full border border-[#ead4c7] bg-white px-2.5 py-1 text-xs font-bold text-[#a25b43]">{focus}</span>)}</div>
            <a href={entry.href} className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-bold text-[#fffdf8] transition hover:bg-[#344451]">{labels.review}<ArrowRight className="size-4" /></a>
          </aside>
        </div>
      </div>}
    </article>
  );
}

export function SpeakingNotebook() {
  const [openedId, setOpenedId] = useState<number | null>(1);
  const eyebrow = useStaticCopy('speaking.notebook', 'eyebrow', 'SPEAKING NOTEBOOK');
  const title = useStaticCopy('speaking.notebook', 'title', '말하기 오답노트');
  const description = useStaticCopy('speaking.notebook', 'description', '완료한 답변의 전사문과 피드백이 이곳에 쌓입니다.');
  const queueLabel = useStaticCopy('speaking.notebook', 'queue_label', 'REVIEW QUEUE');
  const queueTitle = useStaticCopy('speaking.notebook', 'queue_title', '다시 확인할 답변');
  const queueDescription = useStaticCopy('speaking.notebook', 'queue_description', '완료한 답변은 질문, 녹음, 전사문과 개선 포인트를 함께 확인할 수 있습니다.');
  const question = useStaticCopy('speaking.notebook', 'question', 'QUESTION');
  const answer = useStaticCopy('speaking.notebook', 'answer', 'MY ANSWER');
  const feedback = useStaticCopy('speaking.notebook', 'feedback', 'FEEDBACK · IMPROVE');
  const review = useStaticCopy('speaking.notebook', 'review', '다시 연습하기');
  const strength = useStaticCopy('speaking.notebook', 'strength', '잘한 점');
  const improve = useStaticCopy('speaking.notebook', 'improve', '다음에 보완할 점');
  const recording = useStaticCopy('speaking.notebook', 'recording_label', 'MY RECORDING');
  const recordingAvailable = useStaticCopy('speaking.notebook', 'recording_available', '녹음본 있음');
  const recordingUnavailable = useStaticCopy('speaking.notebook', 'recording_unavailable', '연결된 녹음본이 없습니다. 전사문과 피드백은 계속 확인할 수 있어요.');
  const pendingNote = useStaticCopy('speaking.notebook', 'pending_note', '음성 처리와 채점 연동 후에는 실제 완료 기록만 이 목록에 저장됩니다.');

  return (
    <section className="mt-7 space-y-5">
      <header className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-bold tracking-[.14em] text-[#d76a47]">{eyebrow}</p><h2 className="mt-2 font-serif text-3xl text-[#24333a] sm:text-4xl">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#69736e]">{description}</p></div><span className="grid size-11 place-items-center rounded-2xl bg-[#fff0e9] text-[#d76a47]"><Headphones className="size-5" /></span></div>
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#dce8e0] bg-[#f7fbf8] px-4 py-3.5"><span className="grid size-9 place-items-center rounded-xl bg-[#e7f1e9] text-[#38634f]"><CircleAlert className="size-4" /></span><div><p className="text-xs font-bold tracking-[.14em] text-[#38634f]">{queueLabel}</p><p className="mt-1 text-sm text-[#64746c]"><strong className="font-bold text-[#40564a]">{queueTitle}</strong> · {queueDescription}</p></div></div>
      </header>

      <div className="space-y-3">
        {previewEntries.map((entry) => <EntryCard key={entry.id} entry={entry} opened={openedId === entry.id} onToggle={() => setOpenedId((current) => current === entry.id ? null : entry.id)} labels={{ question, answer, feedback, review, strength, improve, recording, recordingAvailable, recordingUnavailable }} />)}
      </div>

      <p className="flex items-center gap-2 px-1 text-sm text-[#7b827e]"><Mic className="size-4 text-[#d76a47]" />{pendingNote}</p>
    </section>
  );
}
