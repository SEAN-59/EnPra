'use client';

import {
  Check,
  CircleHelp,
  Info,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  Waves,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useDocumentScrollLock } from '@/components/use-document-scroll-lock';

type SessionStage = 'ready' | 'countdown' | 'question' | 'recording' | 'recorded' | 'processing' | 'feedback' | 'finished';

type Turn = {
  prompt: string;
  translation: string;
  transcript: string;
  feedback: {
    summary: string;
    improve: string;
    next: string;
  };
};

const turns: Turn[] = [
  {
    prompt: 'Let’s talk about your home town. What kind of place is it?',
    translation: '고향에 대해 이야기해 봅시다. 어떤 곳인가요?',
    transcript: 'My hometown is a coastal city in Korea. It is busy, but it has many beautiful beaches and friendly people.',
    feedback: {
      summary: '질문의 핵심에는 자연스럽게 답했고, 장소를 설명하는 기본 어휘도 적절했어요.',
      improve: 'busy 뒤에 대조를 만들 때는 but보다 while 또는 although를 쓰면 연결이 더 자연스러워집니다.',
      next: 'Why do you think people enjoy living there?',
    },
  },
  {
    prompt: 'Why do you think people enjoy living there?',
    translation: '사람들이 그곳에서 사는 것을 좋아하는 이유는 무엇이라고 생각하나요?',
    transcript: 'I think people enjoy living there because they can relax near the sea after work. There are also many good restaurants.',
    feedback: {
      summary: '이유와 예시를 연결해 답변을 확장했어요. 답변 길이도 Part 1에 적절합니다.',
      improve: 'because 뒤의 이유를 한 단계 더 설명하면 더 설득력 있는 답변이 됩니다.',
      next: 'Has your home town changed much in recent years?',
    },
  },
  {
    prompt: 'Has your home town changed much in recent years?',
    translation: '최근 몇 년 사이에 고향이 많이 변했나요?',
    transcript: 'Yes, it has changed a lot. More tourists visit the city now, so new hotels and public transport have been developed.',
    feedback: {
      summary: '현재완료와 결과 표현을 사용해 변화에 관해 명확히 답했어요.',
      improve: '관광객 증가가 주민들의 생활에 어떤 영향을 주었는지 한 문장 더 보태 보세요.',
      next: 'Would you like to continue living there in the future?',
    },
  },
  {
    prompt: 'Would you like to continue living there in the future?',
    translation: '앞으로도 그곳에서 계속 살고 싶나요?',
    transcript: 'Yes, I would like to live there because my family is there. However, I may move to another city for my career.',
    feedback: {
      summary: '개인적 이유와 반대 가능성을 함께 제시해 균형 잡힌 답변을 만들었어요.',
      improve: 'may move의 이유를 구체적인 직업 분야나 기회와 연결하면 어휘가 더 풍부해집니다.',
      next: 'Let’s move on to a new topic.',
    },
  },
  {
    prompt: 'What do you usually enjoy doing at weekends?',
    translation: '주말에는 보통 무엇을 하며 시간을 보내는 것을 좋아하나요?',
    transcript: 'At weekends, I usually meet my friends or exercise. It helps me reduce stress and feel ready for the next week.',
    feedback: {
      summary: '일상 활동과 그 효과를 간결하게 연결했습니다.',
      improve: '구체적인 활동 하나를 짧게 예시로 들면 답변이 더 기억에 남습니다.',
      next: 'Part 1 is complete.',
    },
  },
];

function Waveform({ active = false }: { active?: boolean }) {
  return (
    <span className={`flex h-6 items-center gap-0.5 ${active ? 'text-[#d76a47]' : 'text-[#8b9791]'}`} aria-hidden="true">
      {[7, 13, 20, 10, 17, 8, 15, 11, 20, 9, 14, 7].map((height, index) => (
        <i key={index} className={`w-0.5 rounded-full bg-current ${active ? 'animate-pulse' : ''}`} style={{ height, animationDelay: `${index * 75}ms` }} />
      ))}
    </span>
  );
}

function PlaybackSpeakerIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
      <path d="M3.5 10v4h4l5 4V6l-5 4h-4Z" fill="currentColor" stroke="none" />
      {playing && <>
        <path className="speaking-speaker-wave-one" d="M15.5 9.5a4 4 0 0 1 0 5" />
        <path className="speaking-speaker-wave-two" d="M18 7a7.5 7.5 0 0 1 0 10" />
      </>}
    </svg>
  );
}

function formatRecordingTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function RecordingPlayer({
  durationSeconds,
  dark = false,
  showLabel = false,
}: {
  durationSeconds: number;
  dark?: boolean;
  showLabel?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const safeDuration = Math.max(1, durationSeconds);
  const progress = Math.min(100, (elapsedSeconds / safeDuration) * 100);

  useEffect(() => {
    setElapsedSeconds((current) => Math.min(current, safeDuration));
  }, [safeDuration]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => {
        if (current >= safeDuration) {
          setIsPlaying(false);
          return safeDuration;
        }
        return Math.min(safeDuration, current + 0.25);
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [isPlaying, safeDuration]);

  const togglePlayback = () => {
    if (elapsedSeconds >= safeDuration) setElapsedSeconds(0);
    setIsPlaying((current) => !current);
  };

  const palette = dark
    ? {
        button: 'bg-white text-[#1d2935] hover:bg-[#fff7f2]',
        track: 'bg-white/20',
        fill: 'bg-[#f0b197]',
        time: 'text-white/65',
        label: 'text-white/85',
      }
    : {
        button: 'border border-[#d7d0c4] bg-white text-[#d76a47] hover:bg-[#fff7f2]',
        track: 'bg-[#e8e1d6]',
        fill: 'bg-[#d76a47]',
        time: 'text-[#7b827e]',
        label: 'text-[#34434b]',
      };

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <button
        type="button"
        aria-label={isPlaying ? '내 녹음 일시정지' : '내 녹음 재생'}
        aria-pressed={isPlaying}
        onClick={togglePlayback}
        className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors ${palette.button}`}
      >
        {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
      </button>
      {showLabel && <span className={`shrink-0 text-sm font-bold ${palette.label}`}>내 녹음 듣기</span>}
      <div className="relative h-6 min-w-12 flex-1">
        <div className={`pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full ${palette.track}`}>
          <div className={`h-full rounded-full ${palette.fill} transition-[width] duration-200 ease-linear`} style={{ width: `${progress}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={safeDuration}
          step={0.25}
          value={elapsedSeconds}
          onChange={(event) => setElapsedSeconds(Number(event.target.value))}
          aria-label="내 녹음 재생 위치"
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 touch-none"
        />
      </div>
      <span className={`shrink-0 text-xs tabular-nums ${palette.time}`}>{formatRecordingTime(Math.floor(elapsedSeconds))} / {formatRecordingTime(safeDuration)}</span>
    </div>
  );
}

function Countdown({ open, onDone }: { open: boolean; onDone: () => void }) {
  const [count, setCount] = useState(2);
  useDocumentScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setCount(2);
    const one = window.setTimeout(() => setCount(1), 700);
    const two = window.setTimeout(onDone, 1_450);
    return () => {
      window.clearTimeout(one);
      window.clearTimeout(two);
    };
  }, [onDone, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#1d2935]/42 p-6 backdrop-blur-sm" aria-live="assertive">
      <div className="grid size-32 place-items-center rounded-full border border-white/30 bg-[#fffdf8]/95 shadow-[0_20px_70px_rgba(29,41,53,0.25)] sm:size-40">
        <div className="text-center">
          <span className="block text-xs font-bold tracking-[0.2em] text-[#d76a47]">GET READY</span>
          <strong key={count} className="mt-1 block font-serif text-6xl text-[#24333a] animate-in fade-in zoom-in-75 duration-200 sm:text-7xl">{count}</strong>
        </div>
      </div>
    </div>
  );
}

function ResultDialog({ turn, open, onClose }: { turn: Turn; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'question' | 'answer' | 'feedback'>('question');
  useDocumentScrollLock(open);
  useEffect(() => {
    if (open) setTab('question');
  }, [open]);
  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="답변 확인 닫기" onClick={onClose} className="fixed inset-0 z-[80] bg-[#1d2935]/35 backdrop-blur-[1px]" />
      <section role="dialog" aria-modal="true" aria-label="답변 확인" className="fixed inset-x-4 top-1/2 z-[81] mx-auto w-auto max-w-xl -translate-y-1/2 overflow-hidden rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] shadow-[0_24px_80px_rgba(29,41,53,0.25)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#e5ded3] px-5 py-5 sm:px-7">
          <div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">YOUR RESPONSE</p><h2 className="mt-1 font-serif text-2xl text-[#24333a]">답변 확인</h2></div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-[#69736e] hover:bg-[#f1ede5]"><X className="size-5" /></button>
        </header>
        <div className="flex border-b border-[#e5ded3] px-5 sm:px-7">
          <button type="button" onClick={() => setTab('question')} className={`flex-1 whitespace-nowrap border-b-2 px-2 py-3 text-xs font-bold sm:flex-none sm:px-3 sm:text-sm ${tab === 'question' ? 'border-[#d76a47] text-[#d76a47]' : 'border-transparent text-[#7b827e]'}`}>질문</button>
          <button type="button" onClick={() => setTab('answer')} className={`flex-1 whitespace-nowrap border-b-2 px-2 py-3 text-xs font-bold sm:flex-none sm:px-3 sm:text-sm ${tab === 'answer' ? 'border-[#d76a47] text-[#d76a47]' : 'border-transparent text-[#7b827e]'}`}>내 답변</button>
          <button type="button" onClick={() => setTab('feedback')} className={`flex-1 whitespace-nowrap border-b-2 px-2 py-3 text-xs font-bold sm:flex-none sm:px-3 sm:text-sm ${tab === 'feedback' ? 'border-[#d76a47] text-[#d76a47]' : 'border-transparent text-[#7b827e]'}`}>피드백 · 개선</button>
        </div>
        <div className="min-h-64 px-5 py-6 sm:px-7">
          {tab === 'question' ? <div className="space-y-5"><section><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">QUESTION</p><p className="mt-3 font-serif text-xl leading-8 text-[#2b393d]">{turn.prompt}</p></section><section className="rounded-2xl bg-[#eff6f1] p-4"><p className="text-xs font-bold tracking-[0.14em] text-[#547263]">한국어 뜻</p><p className="mt-2 leading-7 text-[#40504d]">{turn.translation}</p></section></div> : tab === 'answer' ? <div><p className="text-xs font-bold tracking-[0.14em] text-[#7d8780]">TRANSCRIPT</p><p className="mt-3 font-serif text-xl leading-8 text-[#2b393d]">{turn.transcript}</p><div className="mt-6 rounded-2xl border border-[#d7d0c4] bg-white px-4 py-3"><RecordingPlayer durationSeconds={42} showLabel /></div></div> : <div className="space-y-5"><section><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">ASSESSMENT</p><p className="mt-2 leading-7 text-[#40504d]">{turn.feedback.summary}</p></section><section className="rounded-2xl bg-[#fff4ee] p-4"><p className="text-xs font-bold tracking-[0.14em] text-[#c85f40]">IMPROVE NEXT</p><p className="mt-2 leading-7 text-[#5e5049]">{turn.feedback.improve}</p></section></div>}
        </div>
      </section>
    </>
  );
}

export function SpeakingPartOnePrototype() {
  const [stage, setStage] = useState<SessionStage>('ready');
  const [turnIndex, setTurnIndex] = useState(0);
  const [replays, setReplays] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [selectedHint, setSelectedHint] = useState<'text' | 'structure' | null>(null);
  const [resultTurnIndex, setResultTurnIndex] = useState<number | null>(null);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [questionPlaying, setQuestionPlaying] = useState(false);

  const currentTurn = turns[turnIndex];
  const spokenMinutes = Math.min(10 * 60 + 30, 162 + turnIndex * 94 + (stage === 'recorded' || stage === 'processing' || stage === 'feedback' ? 42 : 0));
  const spokenTime = `${String(Math.floor(spokenMinutes / 60)).padStart(2, '0')}:${String(spokenMinutes % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (stage !== 'recording') return;
    const timer = window.setInterval(() => setAudioSeconds((current) => current + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (!questionPlaying) return;
    const timer = window.setTimeout(() => setQuestionPlaying(false), 1_700);
    return () => window.clearTimeout(timer);
  }, [questionPlaying]);

  useEffect(() => {
    if (stage === 'ready' || stage === 'finished' || stage === 'countdown') return;
    const timer = window.setTimeout(() => {
      const main = document.querySelector('main');
      if (main instanceof HTMLElement && main.scrollHeight > main.clientHeight) {
        main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
        return;
      }
      const page = document.scrollingElement;
      page?.scrollTo({ top: page.scrollHeight, behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [stage, turnIndex]);

  useEffect(() => {
    if (stage !== 'feedback') return;
    const timer = window.setTimeout(() => {
      if (turnIndex === turns.length - 1) {
        setStage('finished');
        return;
      }
      setTurnIndex((current) => current + 1);
      setReplays(0);
      setHintOpen(false);
      setSelectedHint(null);
      setStage('countdown');
    }, 80);
    return () => window.clearTimeout(timer);
  }, [stage, turnIndex]);

  useEffect(() => {
    if (stage !== 'processing') return;
    const timer = window.setTimeout(() => setStage('feedback'), 2_000);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const startQuestion = () => {
    setReplays(0);
    setHintOpen(false);
    setSelectedHint(null);
    setQuestionPlaying(true);
    setStage('question');
  };

  const prepareFirstQuestion = () => setStage('countdown');
  const beginRecording = () => {
    setAudioSeconds(0);
    setStage('recording');
  };
  const finishRecording = () => {
    setAudioSeconds((current) => Math.max(current, 42));
    setStage('recorded');
  };
  const sendRecording = () => setStage('processing');

  return (
    <>
      <header>
        <p className="text-xs font-semibold text-[#d76a47] sm:text-sm">SPEAKING</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-3xl tracking-tight sm:text-5xl">Part 1 대화 연습.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#69736e]">질문을 듣고, 직접 녹음한 뒤 답변 흐름과 개선점을 확인하세요.</p></div><span className="rounded-full border border-[#d6e3db] bg-[#eaf3ed] px-3 py-1.5 text-xs font-bold text-[#38634f]">5.0A · 학습하기</span></div>
      </header>

      <section className="mt-9 overflow-hidden rounded-[2rem] border border-[#dcd6ca] bg-[#fffdf8] shadow-[0_18px_48px_rgba(35,44,43,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e0d5] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#fff0e9] text-[#d76a47]"><Waves className="size-5" /></span><div><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">PART 1 · INTERVIEW</p><p className="mt-0.5 text-sm font-semibold text-[#40504d]">친숙한 주제로 이어지는 음성 대화</p></div></div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#748079]"><span className="rounded-full bg-[#f2eee6] px-2.5 py-1.5">Turn {stage === 'ready' ? '0' : Math.min(turnIndex + 1, turns.length)} / {turns.length}</span><span className="rounded-full bg-[#f2eee6] px-2.5 py-1.5">내 발화 {spokenTime}</span></div>
        </div>

        {stage === 'ready' ? (
          <div className="grid min-h-[540px] place-items-center p-6 sm:p-10">
            <div className="max-w-md text-center"><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#edf4ef] text-[#38634f]"><Volume2 className="size-7" /></span><p className="mt-6 text-xs font-bold tracking-[0.16em] text-[#d76a47]">PART 1 READY</p><h2 className="mt-2 font-serif text-3xl text-[#24333a]">대화를 시작할 준비가 됐어요.</h2><p className="mt-3 leading-7 text-[#68736e]">시작을 누르면 카운트다운 뒤 첫 음성 질문이 재생됩니다. 이후에는 답변을 바탕으로 질문이 이어집니다.</p><Button type="button" size="lg" onClick={prepareFirstQuestion} className="mt-7 h-12 rounded-xl bg-[#1d2935] px-6 text-[#fffdf8] hover:bg-[#344451]"><Sparkles className="size-4" />대화 시작</Button><p className="mt-4 text-xs text-[#89918c]">예상 진행 4~6회 · 종료 기준 내 발화 09:30–10:30</p></div>
          </div>
        ) : stage === 'finished' ? (
          <div className="grid min-h-[540px] place-items-center p-6 sm:p-10"><div className="max-w-md text-center"><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#eaf3ed] text-[#38634f]"><Check className="size-8" /></span><p className="mt-6 text-xs font-bold tracking-[0.16em] text-[#38634f]">PART 1 COMPLETE</p><h2 className="mt-2 font-serif text-3xl text-[#24333a]">대화 연습을 마쳤어요.</h2><p className="mt-3 leading-7 text-[#68736e]">최종 심사와 전체 피드백은 음성 처리 기능을 연결할 때 이 화면에 이어집니다.</p><Button type="button" size="lg" onClick={() => { setTurnIndex(0); setStage('ready'); }} className="mt-7 h-11 rounded-xl bg-[#1d2935] px-5 text-[#fffdf8] hover:bg-[#344451]"><RotateCcw className="size-4" />다시 보기</Button></div></div>
        ) : (
          <div className="min-h-[540px] bg-[#fbfaf6] px-4 py-6 sm:px-7 sm:py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              {turns.slice(0, turnIndex).map((turn, index) => (
                <div key={turn.prompt} className="space-y-3 opacity-80">
                  <article className="mr-auto max-w-[90%] rounded-[1.5rem] rounded-tl-md border border-[#d8e1da] bg-[#f3f8f4] p-4 shadow-sm sm:max-w-[76%] sm:p-5">
                    <p className="text-[10px] font-bold tracking-[0.16em] text-[#547263]">EXAMINER · QUESTION {index + 1}</p>
                    <div className="mt-4 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#38634f] text-white"><Volume2 className="size-5" /></span><div><Waveform /><p className="mt-1 text-xs text-[#6d7c74]">음성 질문 · 완료됨</p></div></div>
                  </article>
                  <article className="ml-auto max-w-[90%] rounded-[1.5rem] rounded-tr-md bg-[#1d2935] p-4 text-[#fffdf8] shadow-sm sm:max-w-[76%] sm:p-5">
                    <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-white/10"><Mic className="size-5" /></span><div><p className="text-[10px] font-bold tracking-[0.16em] text-[#f0b197]">MY RECORDING</p><p className="mt-1 text-sm font-semibold">보낸 답변 · 00:42</p></div></div>
                    <button type="button" onClick={() => setResultTurnIndex(index)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15"><Info className="size-4" />답변 확인</button>
                  </article>
                </div>
              ))}

              <article className="relative mr-auto max-w-[90%] rounded-[1.5rem] rounded-tl-md border border-[#d8e1da] bg-[#f3f8f4] p-4 shadow-sm sm:max-w-[76%] sm:p-5">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[0.16em] text-[#547263]">EXAMINER · QUESTION {turnIndex + 1}</p><p className="mt-1 text-sm font-semibold text-[#40504d]">음성 질문</p></div><div className="relative"><button type="button" aria-label="질문 힌트 열기" onClick={() => setHintOpen((current) => !current)} className="grid size-8 place-items-center rounded-full border border-[#cfdbd3] bg-[#fffdf8] text-[#d76a47] shadow-sm hover:bg-[#fff5ef]"><CircleHelp className="size-4" /></button>{hintOpen && <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-2xl border border-[#dcd6ca] bg-[#fffdf8] p-1.5 shadow-[0_14px_36px_rgba(29,41,53,0.15)] sm:left-0 sm:right-auto"><button type="button" onClick={() => { setSelectedHint('text'); setHintOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#40504d] hover:bg-[#fff4ef]"><Info className="size-4 text-[#d76a47]" />질문 텍스트 보기</button><button type="button" onClick={() => { setSelectedHint('structure'); setHintOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#40504d] hover:bg-[#fff4ef]"><Sparkles className="size-4 text-[#d76a47]" />답변 구조 힌트</button></div>}</div></div>
                <div className="mt-5 flex items-center gap-3"><button type="button" aria-label="질문 다시 듣기" onClick={() => { setReplays((current) => Math.min(4, current + 1)); setQuestionPlaying(true); }} className="grid size-12 place-items-center rounded-2xl bg-[#38634f] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"><PlaybackSpeakerIcon playing={questionPlaying} /></button><div><Waveform active={questionPlaying} /><p className="mt-1 text-xs text-[#6d7c74]">{questionPlaying ? '질문을 재생하고 있어요.' : '답변하세요.'}</p></div></div>
                {selectedHint === 'text' && <div className="mt-4 rounded-xl border border-[#dbe5dd] bg-white/75 p-3 text-sm leading-6 text-[#40504d]"><span className="mr-2 text-xs font-bold tracking-[0.12em] text-[#d76a47]">TEXT</span>{currentTurn.prompt}</div>}
                {selectedHint === 'structure' && <div className="mt-4 rounded-xl border border-[#f1d5c8] bg-[#fff9f5] p-3 text-sm leading-6 text-[#5a5048]"><span className="mr-2 text-xs font-bold tracking-[0.12em] text-[#d76a47]">HINT</span>Answer directly, then add one short reason or example.</div>}
              </article>

              {(stage === 'recorded' || stage === 'processing' || stage === 'feedback') && <article className="ml-auto max-w-[90%] rounded-[1.5rem] rounded-tr-md bg-[#1d2935] p-4 text-[#fffdf8] shadow-sm sm:max-w-[76%] sm:p-5"><div className="flex items-center gap-3"><span className={`relative grid size-10 place-items-center rounded-2xl bg-white/10 ${stage === 'processing' ? 'text-[#f0b197]' : ''}`}>{stage === 'processing' && <span className="absolute inset-1 rounded-xl border border-[#f0b197] animate-ping" />}<Mic className={`relative size-5 ${stage === 'processing' ? 'animate-pulse' : ''}`} /></span><div><p className="text-[10px] font-bold tracking-[0.16em] text-[#f0b197]">MY RECORDING</p><p className="mt-1 text-sm font-semibold">{stage === 'processing' ? '답변 처리 중…' : `임시 녹음 · ${String(audioSeconds || 42).padStart(2, '0')}초`}</p></div></div><div className="mt-4">{stage === 'processing' ? <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-white text-[#1d2935]"><Play className="size-4 fill-current" /></span><div className="h-1.5 flex-1 rounded-full bg-white/20"><div className="h-full w-3/4 rounded-full bg-[#f0b197] animate-pulse" /></div><span className="text-xs text-white/65">처리 중</span></div> : <RecordingPlayer durationSeconds={audioSeconds || 42} dark />}</div>{stage === 'feedback' && <button type="button" onClick={() => setResultTurnIndex(turnIndex)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15"><Info className="size-4" />답변 확인</button>}</article>}

              {stage === 'processing' && <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#eadbcd] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#7b6357]"><Sparkles className="size-4 animate-pulse text-[#d76a47]" />답변을 정리하고 있어요.</div>}
              {stage === 'feedback' && <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#d7e5db] bg-[#eff7f1] px-4 py-2 text-sm font-semibold text-[#38634f]"><Check className="size-4" />다음 질문을 준비했어요.</div>}
            </div>
          </div>
        )}

        {(stage === 'countdown' || stage === 'question') && <footer className="h-[104px] border-t border-[#e7e0d5] bg-[#fffdf8] p-4 sm:h-[92px] sm:p-5"><div className="mx-auto flex h-full max-w-3xl items-center gap-3"><div className="min-w-0 flex-1 rounded-2xl border border-dashed border-[#dcd4c8] bg-[#fbfaf6] px-4 py-3"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef2ee] text-[#617067]"><Mic className="size-4" /></span><p className="text-sm font-semibold text-[#58645f]">{questionPlaying ? '질문이 끝나면 녹음할 수 있습니다.' : '녹음 전에는 서버로 전송되지 않습니다.'}</p></div></div><button type="button" aria-label="녹음 시작" onClick={beginRecording} disabled={questionPlaying} className="grid size-14 shrink-0 place-items-center rounded-full bg-[#d76a47] text-white shadow-[0_6px_18px_rgba(215,106,71,0.28)] hover:bg-[#c95b3b] disabled:cursor-not-allowed disabled:bg-[#b9b9b2] disabled:shadow-none"><Mic className="size-6" /></button></div></footer>}

        {stage === 'recording' && <footer className="h-[104px] border-t border-[#e7e0d5] bg-[#fffdf8] p-4 sm:h-[92px] sm:p-5"><div className="mx-auto flex h-full max-w-3xl items-center gap-3"><div className="min-w-0 flex-1 rounded-2xl border border-[#f0c5b3] bg-[#fff7f3] px-4 py-3"><div className="flex items-center gap-3"><span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0e9] text-[#d76a47]"><span className="absolute size-3 animate-ping rounded-full bg-[#d76a47]/50" /><Mic className="relative size-4" /></span><div><p className="text-sm font-bold text-[#a74e34]">녹음 중 · 00:{String(audioSeconds).padStart(2, '0')}</p><p className="mt-0.5 text-xs text-[#956452]">이 화면에서는 실제 마이크를 사용하지 않는 목업입니다.</p></div></div></div><button type="button" aria-label="녹음 종료" onClick={finishRecording} className="grid size-14 shrink-0 place-items-center rounded-full bg-[#1d2935] text-white shadow-sm hover:bg-[#344451]"><Pause className="size-5 fill-current" /></button></div></footer>}

        {stage === 'recorded' && <footer className="h-[104px] border-t border-[#e7e0d5] bg-[#fffdf8] p-4 sm:h-[92px] sm:p-5"><div className="mx-auto flex h-full max-w-3xl items-center gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-bold tracking-[0.12em] text-[#7b827e]">LOCAL RECORDING READY</p><p className="mt-1 text-sm text-[#55615d]">현재 녹음만 임시 보관되어 있어요. 새로 녹음하면 교체됩니다.</p></div><button type="button" aria-label="새로 녹음하기" onClick={beginRecording} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#d8d0c3] text-[#69736e] hover:bg-[#f2eee6]"><Trash2 className="size-4" /></button><button type="button" onClick={sendRecording} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-bold text-[#fffdf8] hover:bg-[#344451]"><Send className="size-4" />전송</button></div></footer>}
      </section>

      <Countdown open={stage === 'countdown'} onDone={startQuestion} />
      {resultTurnIndex !== null && <ResultDialog turn={turns[resultTurnIndex]} open onClose={() => setResultTurnIndex(null)} />}
    </>
  );
}
