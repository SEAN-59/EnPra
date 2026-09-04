'use client';

import {
  Check,
  Clock3,
  FileText,
  Mic,
  Pause,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

type Stage = 'covered' | 'preparing' | 'recording' | 'recorded' | 'processing' | 'followup' | 'complete';
type ResponsePhase = 'card' | 'followup';

const PREPARATION_SECONDS = 90;
const CARD_RESPONSE_SECONDS = 130;
const FOLLOWUP_RESPONSE_SECONDS = 45;
const MAX_MEMO_CHARACTERS = 300;
const MAX_MEMO_LINES = 6;

const cueCard = {
  topic: 'Describe a place in your city that you enjoy visiting.',
  bullets: [
    'where it is',
    'what you usually do there',
    'who you go there with',
    'and explain why you enjoy visiting this place',
  ],
};

const followUpQuestions = [
  'Do you think public places are as important for adults as they are for children?',
  'How can cities make public places more attractive to residents?',
];

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function TimerRail({ remaining, total, active }: { remaining: number; total: number; active: boolean }) {
  const progress = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  return <div className="mt-4"><div className="mb-2 flex items-center justify-between text-xs font-bold tracking-[0.1em] text-[#7b827e]"><span>{active ? 'TIME REMAINING' : 'TIME USED'}</span><span className="tabular-nums text-[#d76a47]">{formatTime(remaining)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#e7e0d5]"><div className={`h-full rounded-full bg-[#d76a47] transition-[width] duration-1000 ease-linear ${active ? 'animate-pulse' : ''}`} style={{ width: `${progress}%` }} /></div></div>;
}

function RecordingBubble({ seconds, processing, followup }: { seconds: number; processing: boolean; followup: boolean }) {
  return <article className="ml-auto max-w-[90%] rounded-[1.5rem] rounded-tr-md bg-[#1d2935] p-4 text-[#fffdf8] shadow-sm sm:max-w-[76%] sm:p-5"><div className="flex items-center gap-3"><span className={`relative grid size-10 place-items-center rounded-2xl bg-white/10 ${processing ? 'text-[#f0b197]' : ''}`}>{processing && <span className="absolute inset-1 rounded-xl border border-[#f0b197] animate-ping" />}<Mic className={`relative size-5 ${processing ? 'animate-pulse' : ''}`} /></span><div><p className="text-[10px] font-bold tracking-[0.16em] text-[#f0b197]">MY RECORDING</p><p className="mt-1 text-sm font-semibold">{processing ? '답변 처리 중…' : `${followup ? '추가 답변' : '임시 녹음'} · ${formatTime(seconds)}`}</p></div></div>{processing && <div className="mt-4 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-full w-3/4 rounded-full bg-[#f0b197] animate-pulse" /></div><span className="text-xs text-white/65">처리 중</span></div>}</article>;
}

export function SpeakingPartTwoPrototype() {
  const [stage, setStage] = useState<Stage>('covered');
  const [phase, setPhase] = useState<ResponsePhase>('card');
  const [cardRevealed, setCardRevealed] = useState(false);
  const [memo, setMemo] = useState('');
  const [preparationRemaining, setPreparationRemaining] = useState(PREPARATION_SECONDS);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const targetLevel = 6.5;
  const followUpLimit = targetLevel >= 6.5 ? 2 : targetLevel >= 6 ? 1 : 0;
  const isCardResponse = phase === 'card';
  const recordingLimit = isCardResponse ? CARD_RESPONSE_SECONDS : FOLLOWUP_RESPONSE_SECONDS;

  useEffect(() => {
    if (!cardRevealed || stage !== 'covered') return;
    const timer = window.setTimeout(() => setStage('preparing'), 620);
    return () => window.clearTimeout(timer);
  }, [cardRevealed, stage]);

  useEffect(() => {
    if (stage !== 'preparing') return;
    const timer = window.setInterval(() => {
      setPreparationRemaining((current) => {
        if (current <= 1) {
          setStage('recording');
          setRecordingSeconds(0);
          return 0;
        }
        return current - 1;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'recording') return;
    const timer = window.setInterval(() => {
      setRecordingSeconds((current) => {
        if (current >= recordingLimit - 1) {
          setStage('recorded');
          return recordingLimit;
        }
        return current + 1;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [recordingLimit, stage]);

  useEffect(() => {
    if (stage !== 'processing') return;
    const timer = window.setTimeout(() => {
      if (phase === 'card' && followUpLimit > 0) {
        setPhase('followup');
        setFollowUpIndex(0);
        setStage('followup');
        return;
      }
      if (phase === 'followup' && followUpIndex + 1 < followUpLimit) {
        setFollowUpIndex((current) => current + 1);
        setStage('followup');
        return;
      }
      setStage('complete');
    }, 2_000);
    return () => window.clearTimeout(timer);
  }, [followUpIndex, followUpLimit, phase, stage]);

  const revealCard = () => setCardRevealed(true);
  const updateMemo = (value: string) => {
    const limitedLines = value.split('\n').slice(0, MAX_MEMO_LINES).join('\n');
    setMemo(limitedLines.slice(0, MAX_MEMO_CHARACTERS));
  };
  const finishRecording = () => setStage('recorded');
  const sendRecording = () => setStage('processing');
  const startFollowUpRecording = () => {
    setRecordingSeconds(0);
    setStage('recording');
  };
  const restart = () => {
    setStage('covered');
    setPhase('card');
    setCardRevealed(false);
    setMemo('');
    setPreparationRemaining(PREPARATION_SECONDS);
    setRecordingSeconds(0);
    setFollowUpIndex(0);
  };

  const cardIsVisible = phase === 'card' && stage !== 'complete';
  const memoEditable = stage === 'preparing';
  const memoHelper = stage === 'covered' ? '카드를 열면 1분 30초 동안 메모할 수 있어요.' : memoEditable ? '핵심어만 적어 보세요. 이 메모는 채점에 사용되지 않습니다.' : '발화가 시작되어 메모가 잠겼어요. 세션이 끝나면 자동으로 폐기됩니다.';

  return <>
    <header><p className="text-xs font-semibold text-[#d76a47] sm:text-sm">SPEAKING</p><div className="mt-1 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-3xl tracking-tight sm:text-5xl">Part 2 카드 연습.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#69736e]">카드를 열고 핵심을 메모한 뒤, 하나의 주제를 길게 설명해 보세요.</p></div><span className="rounded-full border border-[#d6e3db] bg-[#eaf3ed] px-3 py-1.5 text-xs font-bold text-[#38634f]">6.5A · 학습하기</span></div></header>

    <section className="mt-9 overflow-hidden rounded-[2rem] border border-[#dcd6ca] bg-[#fffdf8] shadow-[0_18px_48px_rgba(35,44,43,0.05)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e0d5] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#fff0e9] text-[#d76a47]"><FileText className="size-5" /></span><div><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">PART 2 · LONG TURN</p><p className="mt-0.5 text-sm font-semibold text-[#40504d]">카드 준비 · 발화 · 연계 질문</p></div></div><span className="rounded-full bg-[#f2eee6] px-2.5 py-1.5 text-xs font-bold text-[#748079]">후속 질문 {followUpLimit}개</span></div>

      <div className="min-h-[590px] bg-[#fbfaf6] px-4 py-6 sm:px-7 sm:py-8"><div className="mx-auto max-w-3xl space-y-6">
        {stage === 'complete' ? <div className="grid min-h-[500px] place-items-center p-6"><div className="max-w-md text-center"><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#eaf3ed] text-[#38634f]"><Check className="size-8" /></span><p className="mt-6 text-xs font-bold tracking-[0.16em] text-[#38634f]">PART 2 COMPLETE</p><h2 className="mt-2 font-serif text-3xl text-[#24333a]">카드 연습을 마쳤어요.</h2><p className="mt-3 leading-7 text-[#68736e]">메모는 저장하지 않고 폐기했어요. 음성 처리 연결 후 이 자리에 답변 분석과 최종 피드백이 표시됩니다.</p><Button type="button" size="lg" onClick={restart} className="mt-7 h-11 rounded-xl bg-[#1d2935] px-5 text-[#fffdf8] hover:bg-[#344451]"><RotateCcw className="size-4" />새 카드 연습</Button></div></div> : <>
          {cardIsVisible && <article className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">CUE CARD</p><p className="mt-1 text-sm text-[#68736e]">카드를 열면 준비 시간이 시작됩니다.</p></div>{stage !== 'covered' && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0e9] px-3 py-1.5 text-xs font-bold text-[#b05236]"><Clock3 className="size-3.5" />{stage === 'preparing' ? '메모 중' : '발화 중'}</span>}</div>
            <button type="button" onClick={revealCard} disabled={cardRevealed} aria-label="Part 2 카드 열기" className="mt-6 block w-full cursor-pointer text-left [perspective:1200px] disabled:cursor-default"><span className={`relative block min-h-[270px] transition-transform duration-700 [transform-style:preserve-3d] ${cardRevealed ? '[transform:rotateY(180deg)]' : ''}`}><span className="absolute inset-0 grid place-items-center overflow-hidden rounded-3xl border border-[#25353b] bg-[#1d2935] p-8 text-center text-[#fffdf8] shadow-[0_16px_34px_rgba(29,41,53,0.17)] [backface-visibility:hidden]"><span><span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/20 bg-white/10"><Sparkles className="size-6 text-[#f0b197]" /></span><strong className="mt-5 block font-serif text-3xl">Part 2</strong><span className="mt-2 block text-sm text-white/70">카드를 눌러 주제를 확인하세요</span></span></span><span className="absolute inset-0 overflow-hidden rounded-3xl border border-[#e6c9bb] bg-[#fff7f1] p-6 shadow-[0_16px_34px_rgba(29,41,53,0.1)] [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8"><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">DESCRIBE A PLACE</p><h2 className="mt-4 max-w-2xl font-serif text-2xl leading-9 text-[#28373b] sm:text-3xl sm:leading-10">{cueCard.topic}</h2><div className="mt-5 border-t border-[#ead7cb] pt-4"><p className="text-xs font-bold tracking-[0.14em] text-[#a06550]">YOU SHOULD SAY</p><ul className="mt-3 space-y-2 text-sm leading-6 text-[#465552] sm:text-base">{cueCard.bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#d76a47]" />{bullet}</li>)}</ul></div></span></span></button>
            {stage === 'preparing' && <TimerRail remaining={preparationRemaining} total={PREPARATION_SECONDS} active />}
            {stage === 'recording' && isCardResponse && <TimerRail remaining={Math.max(0, CARD_RESPONSE_SECONDS - recordingSeconds)} total={CARD_RESPONSE_SECONDS} active />}
          </article>}

          {cardIsVisible && <article className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.16em] text-[#547263]">PRIVATE NOTES</p><p className="mt-1 text-sm text-[#68736e]">{memoHelper}</p></div><span className="shrink-0 text-xs font-bold tabular-nums text-[#7b827e]">{memo.length}/{MAX_MEMO_CHARACTERS}</span></div><textarea value={memo} onChange={(event) => updateMemo(event.target.value)} disabled={!memoEditable} rows={6} maxLength={MAX_MEMO_CHARACTERS} placeholder="예: riverside park · walk after work · quiet · friends · reduce stress" className="mt-4 min-h-32 w-full resize-none rounded-2xl border border-[#dcd6ca] bg-[#fbfaf6] px-4 py-3 text-sm leading-6 text-[#40504d] outline-none placeholder:text-[#a4aaa6] focus:border-[#d76a47] disabled:cursor-not-allowed disabled:bg-[#f3f0e9] disabled:text-[#7c8580]" /><p className="mt-2 text-xs text-[#89918c]">최대 {MAX_MEMO_LINES}줄 · {MAX_MEMO_CHARACTERS}자 · 서버에 저장되지 않음</p></article>}

          {stage === 'recording' && <article className="ml-auto max-w-[90%] rounded-[1.5rem] rounded-tr-md bg-[#1d2935] p-4 text-[#fffdf8] shadow-sm sm:max-w-[76%] sm:p-5"><div className="flex items-center gap-3"><span className="relative grid size-10 place-items-center rounded-2xl bg-white/10 text-[#f0b197]"><span className="absolute size-3 animate-ping rounded-full bg-[#f0b197]/45" /><Mic className="relative size-5" /></span><div><p className="text-[10px] font-bold tracking-[0.16em] text-[#f0b197]">{isCardResponse ? 'YOUR LONG TURN' : 'FOLLOW-UP RESPONSE'}</p><p className="mt-1 text-sm font-semibold">녹음 중 · {formatTime(recordingSeconds)} / {formatTime(recordingLimit)}</p></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#f0b197] transition-[width] duration-1000 ease-linear" style={{ width: `${Math.min(100, (recordingSeconds / recordingLimit) * 100)}%` }} /></div></article>}

          {(stage === 'recorded' || stage === 'processing') && <RecordingBubble seconds={recordingSeconds} processing={stage === 'processing'} followup={!isCardResponse} />}

          {stage === 'followup' && <article className="mr-auto max-w-[90%] rounded-[1.5rem] rounded-tl-md border border-[#d8e1da] bg-[#f3f8f4] p-4 shadow-sm sm:max-w-[76%] sm:p-5"><p className="text-[10px] font-bold tracking-[0.16em] text-[#547263]">EXAMINER · FOLLOW-UP {followUpIndex + 1} / {followUpLimit}</p><div className="mt-4 flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#38634f] text-white"><Volume2 className="size-5" /></span><div><p className="font-serif text-xl leading-8 text-[#2b393d]">{followUpQuestions[followUpIndex]}</p><p className="mt-2 text-xs text-[#6d7c74]">질문을 듣고 답변을 녹음하세요.</p></div></div></article>}

          {stage === 'processing' && <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#eadbcd] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#7b6357]"><Sparkles className="size-4 animate-pulse text-[#d76a47]" />답변을 정리하고 있어요.</div>}
        </>}
      </div></div>

      {stage === 'covered' && <footer className="border-t border-[#e7e0d5] bg-[#fffdf8] px-5 py-4 sm:px-7"><p className="text-sm font-semibold text-[#58645f]">카드를 열면 준비 시간이 시작됩니다.</p></footer>}
      {stage === 'preparing' && <footer className="border-t border-[#e7e0d5] bg-[#fffdf8] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#fff0e9] text-[#d76a47]"><FileText className="size-4" /></span><p className="text-sm font-semibold text-[#58645f]">메모 시간이에요. 시간이 끝나면 자동으로 녹음이 시작됩니다.</p></div></footer>}
      {stage === 'recording' && <footer className="border-t border-[#e7e0d5] bg-[#fffdf8] p-4 sm:px-7"><div className="mx-auto flex max-w-3xl items-center gap-3"><div className="min-w-0 flex-1 rounded-2xl border border-[#f0c5b3] bg-[#fff7f3] px-4 py-3"><p className="text-sm font-bold text-[#a74e34]">{isCardResponse ? '주제에 맞춰 길게 이야기해 보세요.' : '짧고 명확하게 의견을 이어 보세요.'}</p></div><button type="button" aria-label="녹음 종료" onClick={finishRecording} className="grid size-14 shrink-0 place-items-center rounded-full bg-[#1d2935] text-white shadow-sm hover:bg-[#344451]"><Pause className="size-5 fill-current" /></button></div></footer>}
      {stage === 'recorded' && <footer className="border-t border-[#e7e0d5] bg-[#fffdf8] p-4 sm:px-7"><div className="mx-auto flex max-w-3xl items-center gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-bold tracking-[0.12em] text-[#7b827e]">RECORDING READY</p><p className="mt-1 text-sm text-[#55615d]">현재 녹음만 임시 보관되어 있어요. 새로 녹음하면 교체됩니다.</p></div><button type="button" onClick={() => { setRecordingSeconds(0); setStage('recording'); }} className="rounded-xl border border-[#d8d0c3] px-3 py-2.5 text-sm font-bold text-[#69736e] hover:bg-[#f2eee6]">다시 녹음</button><button type="button" onClick={sendRecording} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-bold text-[#fffdf8] hover:bg-[#344451]"><Send className="size-4" />전송</button></div></footer>}
      {stage === 'followup' && <footer className="border-t border-[#e7e0d5] bg-[#fffdf8] p-4 sm:px-7"><div className="mx-auto flex max-w-3xl items-center gap-3"><div className="min-w-0 flex-1 rounded-2xl border border-dashed border-[#dcd4c8] bg-[#fbfaf6] px-4 py-3"><p className="text-sm font-semibold text-[#58645f]">추가 질문에는 별도 메모 없이 바로 답해 보세요.</p></div><button type="button" aria-label="추가 질문 녹음 시작" onClick={startFollowUpRecording} className="grid size-14 shrink-0 place-items-center rounded-full bg-[#d76a47] text-white shadow-[0_6px_18px_rgba(215,106,71,0.28)] hover:bg-[#c95b3b]"><Mic className="size-6" /></button></div></footer>}
    </section>
  </>;
}
