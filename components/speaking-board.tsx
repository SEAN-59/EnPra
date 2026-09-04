'use client';

import { ArrowRight, Headphones, Mic, Sparkles } from 'lucide-react';
import { useStaticCopy } from '@/components/static-copy-provider';

export function SpeakingBoard() {
  const eyebrow = useStaticCopy('speaking.board', 'eyebrow', 'CURRENT SPEAKING LEVEL');
  const title = useStaticCopy('speaking.board', 'title', '시작 레벨을 설정하세요.');
  const description = useStaticCopy('speaking.board', 'description', '현재 말하기 실력에 맞는 단계부터 연습을 시작합니다.');
  const practice = useStaticCopy('speaking.board', 'practice', '학습하기');
  const reinforcement = useStaticCopy('speaking.board', 'reinforcement', '맞춤 보강 학습');
  const reinforcementDescription = useStaticCopy('speaking.board', 'reinforcement_description', '진단 결과가 쌓이면 보완이 필요한 발음·표현·답변 구조를 이곳에서 안내합니다.');
  return <section className="mt-7 space-y-5"><section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div><p className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#d76a47]"><Sparkles className="size-4" />{eyebrow}</p><h2 className="mt-4 font-serif text-3xl">{title}</h2><p className="mt-3 text-sm leading-6 text-[#69736e]">{description}</p></div><a href="/speaking/practice" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-5 text-sm font-bold text-[#fffdf8] hover:bg-[#344451]">{practice}<ArrowRight className="size-4" /></a></div></section><section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 sm:p-8"><p className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#d76a47]"><Headphones className="size-4" />REINFORCEMENT</p><div className="mt-4 flex items-start justify-between gap-6"><div><h2 className="font-serif text-2xl">{reinforcement}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#69736e]">{reinforcementDescription}</p></div><Mic className="size-6 shrink-0 text-[#d76a47]" /></div></section></section>;
}
