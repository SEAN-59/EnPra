'use client';

import { ChevronRight, CircleAlert, Headphones, Mic, Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useStaticCopy } from '@/components/static-copy-provider';

type SpeakingTurn = {
  id: number;
  label: string;
  question: string;
  translation: string;
  transcript: string;
  improvedAnswer: string;
  duration: number;
  hasRecording: boolean;
};

type NotebookEntry = {
  id: number;
  part: 'PART 1' | 'PART 2' | 'PART 3';
  mode: '학습하기' | '일반 테스트';
  title: string;
  completedAt: string;
  duration: number;
  targetLevel: string;
  status: '보완 필요' | '복습 권장' | '확인 완료';
  focuses: string[];
  turns: SpeakingTurn[];
  strength: string;
};

const previewEntries: NotebookEntry[] = [
  {
    id: 1,
    part: 'PART 3',
    mode: '학습하기',
    title: 'Public spaces in modern cities',
    completedAt: '오늘',
    duration: 89,
    targetLevel: '6.0A',
    status: '보완 필요',
    focuses: ['근거 확장', '예시 구체화'],
    turns: [
      { id: 1, label: 'QUESTION 1', question: 'Why do you think public spaces are important in modern cities?', translation: '현대 도시에서 공공장소가 중요한 이유는 무엇이라고 생각하나요?', transcript: 'I think public spaces are important because they give people a place to relax and meet others. They can also make crowded cities feel more liveable.', improvedAnswer: 'I believe public spaces are essential in modern cities because they give residents a break from busy urban life. Parks and squares allow people to exercise, meet friends, and take part in community events, which makes cities healthier and more liveable.', duration: 42, hasRecording: false },
      { id: 2, label: 'QUESTION 2', question: 'Should local governments spend more money on public parks?', translation: '지방 정부는 공원에 더 많은 예산을 써야 할까요?', transcript: 'Yes, I think they should, especially in crowded areas. Parks are free places where people of different ages can exercise and spend time together.', improvedAnswer: 'Yes, particularly in densely populated neighbourhoods where residents may not have private outdoor space. Well-maintained parks offer a free place to exercise, socialise, and improve their mental well-being.', duration: 47, hasRecording: false },
    ],
    strength: '의견을 먼저 밝힌 뒤 두 가지 이유를 자연스럽게 연결했어요.',
  },
  {
    id: 2,
    part: 'PART 2',
    mode: '일반 테스트',
    title: 'Describe a public park you enjoyed visiting',
    completedAt: '어제',
    duration: 159,
    targetLevel: '6.0B',
    status: '복습 권장',
    focuses: ['시간 흐름', '연결 표현'],
    turns: [
      { id: 1, label: 'CUE CARD ANSWER', question: 'Describe a public park you enjoyed visiting.', translation: '즐겁게 방문했던 공원 한 곳을 설명해 보세요.', transcript: 'I would like to talk about a park near my home. I visited it with my friends last spring, and we spent the afternoon walking around the lake and having a picnic.', improvedAnswer: 'I would like to describe Riverside Park, which is close to my home. I went there with two friends last spring, and we spent most of the afternoon walking around the lake before having a picnic. What I enjoyed most was the calm atmosphere, because it felt completely different from the busy streets nearby. I still remember it as a relaxing day because we could talk without being interrupted by traffic or crowds.', duration: 98, hasRecording: true },
      { id: 2, label: 'FOLLOW-UP 1', question: 'Why do people need public parks in cities?', translation: '도시 사람들에게 공원이 필요한 이유는 무엇인가요?', transcript: 'People need parks because city life can be stressful. A green space gives them a chance to rest, exercise, and spend time with their family.', improvedAnswer: 'People need public parks because urban life can be stressful and many residents live in small apartments. Green spaces give them somewhere to exercise, relax, or spend time with family without having to spend money.', duration: 27, hasRecording: true },
      { id: 3, label: 'FOLLOW-UP 2', question: 'How can cities encourage people to use public spaces more often?', translation: '도시는 사람들이 공공장소를 더 자주 이용하도록 어떻게 장려할 수 있을까요?', transcript: 'They could keep parks safe and organise simple community events. If a space is clean and has useful facilities, more people will want to visit it.', improvedAnswer: 'Cities can encourage people to use public spaces by keeping them clean, safe, and easy to reach by public transport. They could also organise low-cost events, such as weekend markets or outdoor performances, which would give residents a reason to visit regularly.', duration: 34, hasRecording: true },
    ],
    strength: '장소, 방문 시점, 활동을 순서대로 말해 긴 답변의 흐름이 안정적이었어요.',
  },
  {
    id: 3,
    part: 'PART 1',
    mode: '학습하기',
    title: 'Your home town',
    completedAt: '3일 전',
    duration: 76,
    targetLevel: '5.0B',
    status: '확인 완료',
    focuses: ['현재완료', '대조 표현'],
    turns: [
      { id: 1, label: 'QUESTION 1', question: 'Has your home town changed much in recent years?', translation: '최근 몇 년 사이에 고향이 많이 변했나요?', transcript: 'Yes, it has changed a lot. More tourists visit the city now, so new hotels and public transport have been developed.', improvedAnswer: 'Yes, it has changed a lot in recent years. More tourists visit now, so the town has built new hotels and improved its public transport. As a result, it is much busier than before.', duration: 31, hasRecording: false },
      { id: 2, label: 'QUESTION 2', question: 'What is one thing you would like to improve in your home town?', translation: '고향에서 개선되었으면 하는 점 한 가지는 무엇인가요?', transcript: 'I would like to see more bicycle lanes because many people use cars even for short trips. It would make the town quieter and cleaner.', improvedAnswer: 'I would like the town to have more bicycle lanes. Many people drive even for short journeys, so safer cycling routes could make the streets quieter and cleaner.', duration: 25, hasRecording: false },
      { id: 3, label: 'QUESTION 3', question: 'Do you think you will live there in the future?', translation: '앞으로도 그곳에서 살 것 같나요?', transcript: 'I might return in the future because my family is there. However, I would like to gain more work experience in a bigger city first.', improvedAnswer: 'I might live there again in the future because my family is there and I feel comfortable in the town. However, I would like to get more work experience in a bigger city first.', duration: 20, hasRecording: false },
    ],
    strength: '현재완료와 변화의 결과를 적절하게 활용해 명확하게 답했어요.',
  },
];

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
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

function EntryCard({ entry, opened, onToggle, labels }: { entry: NotebookEntry; opened: boolean; onToggle: () => void; labels: { dialogue: string; question: string; answer: string; feedback: string; strength: string; improvedAnswer: string; recording: string; recordingAvailable: string; recordingUnavailable: string } }) {
  const statusStyle = entry.status === '보완 필요'
    ? 'bg-[#fff1eb] text-[#b25336]'
    : entry.status === '복습 권장'
      ? 'bg-[#fff7e7] text-[#9a692d]'
      : 'bg-[#eaf4ed] text-[#38634f]';

  return (
    <article className="overflow-hidden rounded-2xl border border-[#dcd6ca] bg-[#fffdf8] transition-shadow hover:shadow-[0_10px_28px_rgba(35,44,43,0.04)]">
      <button type="button" onClick={onToggle} aria-expanded={opened} className="notebook-entry-trigger flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6">
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-[.1em] text-[#d76a47]">{entry.part}<span className="text-[#9aa19c]">·</span><span className="text-[#68736e]">{entry.mode}</span></span>
          <span className="mt-2 block truncate font-serif text-xl text-[#24333a] sm:text-2xl">{entry.title}</span>
          <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#747d77]"><span>{entry.completedAt}</span><span className="text-[#cac2b6]">•</span><span>답변 {entry.turns.length}개 · {formatTime(entry.duration)}</span></span>
        </span>
        <span className="flex shrink-0 items-center gap-2 sm:gap-3">
          {entry.turns.some((turn) => turn.hasRecording) && <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe1d4] bg-[#eef7f0] px-2.5 py-1 text-xs font-bold text-[#38634f]"><Mic className="size-3.5" />{labels.recordingAvailable}</span>}
          <span className={`hidden rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex ${statusStyle}`}>{entry.status}</span>
          <ChevronRight className={`size-5 text-[#78827c] transition-transform ${opened ? 'rotate-90' : ''}`} />
        </span>
      </button>
      {opened && <div className="border-t border-[#ece5da] px-5 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,.9fr)]">
          <section className="space-y-4">
            <p className="text-xs font-bold tracking-[.14em] text-[#d76a47]">{labels.dialogue}</p>
            {entry.turns.map((turn) => <section key={turn.id} className="rounded-2xl border border-[#e4ddd2] bg-[#fbfaf6] p-4 sm:p-5">
              <p className="text-[11px] font-bold tracking-[.14em] text-[#7c8b83]">{turn.label}</p>
              <p className="mt-3 text-xs font-bold tracking-[.14em] text-[#d76a47]">{labels.question}</p>
              <div className="mt-2 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#38634f] text-white"><Volume2 className="size-4" /></span><div><p className="font-serif text-lg leading-7 text-[#2f4040]">{turn.question}</p><p className="mt-2 text-sm leading-6 text-[#65766c]">{turn.translation}</p></div></div>
              <div className="mt-5 border-t border-[#e6ded2] pt-4"><p className="text-xs font-bold tracking-[.14em] text-[#d76a47]">{labels.answer}</p>{turn.hasRecording
                ? <div className="mt-3"><RecordingPlayer duration={turn.duration} label={labels.recording} /></div>
                : <p className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-[#d9d3c7] px-3 py-2.5 text-sm leading-6 text-[#747d77]"><Mic className="size-4 shrink-0 text-[#a1aaa4]" />{labels.recordingUnavailable}</p>}
                <p className="mt-3 text-sm leading-7 text-[#42514f]">{turn.transcript}</p>
                <div className="mt-4 rounded-xl border border-[#ead9ce] bg-[#fff8f3] p-4"><p className="text-xs font-bold tracking-[.14em] text-[#c85f40]">{labels.improvedAnswer} · {entry.targetLevel}</p><p className="mt-2 text-sm leading-7 text-[#5d514b]">{turn.improvedAnswer}</p></div>
              </div>
            </section>)}
          </section>
          <aside className="h-fit rounded-2xl border border-[#ead9ce] bg-[#fff9f5] p-5">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[#c85f40]"><Sparkles className="size-4" />{labels.feedback}</p>
            <section className="mt-5"><p className="text-xs font-bold text-[#50625a]">{labels.strength}</p><p className="mt-2 text-sm leading-6 text-[#5d645f]">{entry.strength}</p></section>
            <div className="mt-5 flex flex-wrap gap-2">{entry.focuses.map((focus) => <span key={focus} className="rounded-full border border-[#ead4c7] bg-white px-2.5 py-1 text-xs font-bold text-[#a25b43]">{focus}</span>)}</div>
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
  const dialogue = useStaticCopy('speaking.notebook', 'dialogue', 'SESSION RESPONSES');
  const question = useStaticCopy('speaking.notebook', 'question', 'QUESTION');
  const answer = useStaticCopy('speaking.notebook', 'answer', 'MY ANSWER');
  const feedback = useStaticCopy('speaking.notebook', 'feedback', 'FEEDBACK · IMPROVE');
  const strength = useStaticCopy('speaking.notebook', 'strength', '잘한 점');
  const improvedAnswer = useStaticCopy('speaking.notebook', 'improved_answer', 'IMPROVED ANSWER');
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
        {previewEntries.map((entry) => <EntryCard key={entry.id} entry={entry} opened={openedId === entry.id} onToggle={() => setOpenedId((current) => current === entry.id ? null : entry.id)} labels={{ dialogue, question, answer, feedback, strength, improvedAnswer, recording, recordingAvailable, recordingUnavailable }} />)}
      </div>

      <p className="flex items-center gap-2 px-1 text-sm text-[#7b827e]"><Mic className="size-4 text-[#d76a47]" />{pendingNote}</p>
    </section>
  );
}
