'use client';

import { ArrowRight, ClipboardCheck, Mic } from 'lucide-react';
import { useStaticCopy } from '@/components/static-copy-provider';

export function SpeakingPractice() {
  const eyebrow = useStaticCopy('speaking.practice', 'eyebrow', 'PRACTICE');
  const title = useStaticCopy('speaking.practice', 'title', '오늘의 Speaking.');
  const description = useStaticCopy('speaking.practice', 'description', '학습과 테스트 모두 실제 질문에 답하며 진행합니다.');
  const learning = useStaticCopy('speaking.practice', 'learning', '학습하기');
  const learningDescription = useStaticCopy('speaking.practice', 'learning_description', '힌트와 피드백을 사용해 답변을 확장하는 연습입니다.');
  const test = useStaticCopy('speaking.practice', 'test', '일반 테스트');
  const testDescription = useStaticCopy('speaking.practice', 'test_description', '힌트 없이 현재 단계의 말하기 실력을 확인합니다.');
  const partOne = useStaticCopy('speaking.practice', 'part_one', 'Part 1 연습 열기');
  return <section className="mt-7 max-w-3xl rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8"><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">{eyebrow}</p><h2 className="mt-2 font-serif text-4xl">{title}</h2><p className="mt-3 text-sm leading-6 text-[#69736e]">{description}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><a href="/speaking/part1?mode=learning" className="rounded-2xl border border-[#dcd6ca] bg-[#fbf9f4] p-6 transition hover:border-[#e6b7a5] hover:bg-[#fff8f4]"><Mic className="size-5 text-[#d76a47]" /><h3 className="mt-5 font-serif text-2xl">{learning}</h3><p className="mt-2 text-sm leading-6 text-[#69736e]">{learningDescription}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#d76a47]">{partOne}<ArrowRight className="size-4" /></span></a><a href="/speaking/part1?mode=test" className="rounded-2xl border border-[#dcd6ca] bg-[#fbf9f4] p-6 transition hover:border-[#e6b7a5] hover:bg-[#fff8f4]"><ClipboardCheck className="size-5 text-[#d76a47]" /><h3 className="mt-5 font-serif text-2xl">{test}</h3><p className="mt-2 text-sm leading-6 text-[#69736e]">{testDescription}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#d76a47]">{partOne}<ArrowRight className="size-4" /></span></a></div></section>;
}
