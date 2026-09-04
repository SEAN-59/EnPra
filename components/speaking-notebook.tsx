'use client';

import { BookOpenCheck } from 'lucide-react';
import { useStaticCopy } from '@/components/static-copy-provider';

export function SpeakingNotebook() {
  const eyebrow = useStaticCopy('speaking.notebook', 'eyebrow', 'SPEAKING NOTEBOOK');
  const title = useStaticCopy('speaking.notebook', 'title', '말하기 오답노트');
  const description = useStaticCopy('speaking.notebook', 'description', '완료한 답변의 전사문과 피드백이 이곳에 쌓입니다.');
  const empty = useStaticCopy('speaking.notebook', 'empty', '아직 완료한 Speaking 기록이 없습니다.');
  return <section className="mt-7 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-8 shadow-[0_18px_48px_rgba(35,44,43,0.05)]"><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">{eyebrow}</p><h2 className="mt-2 font-serif text-3xl">{title}</h2><p className="mt-3 text-sm leading-6 text-[#69736e]">{description}</p><div className="mt-7 grid min-h-40 place-items-center rounded-2xl border border-dashed border-[#d8d1c5] text-center"><div><BookOpenCheck className="mx-auto size-6 text-[#9ba39d]" /><p className="mt-3 text-sm font-medium text-[#69736e]">{empty}</p></div></div></section>;
}
