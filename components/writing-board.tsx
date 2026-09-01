'use client';

import { ArrowRight, Compass, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

const levelChoices = [
  { level: 'FOUNDATION', description: '기본 문장 구조부터 바로 학습을 시작합니다.', href: '/writing/learning?level=foundation' },
  { level: '5.0+', description: 'Task 1 한 문항으로 시작 단계를 확인합니다.', href: '/writing/placement?level=5.0' },
  { level: '6.0+', description: 'Task 1과 Task 2로 현재 실력을 확인합니다.', href: '/writing/placement?level=6.0' },
  { level: '7.0+', description: 'Task 1과 Task 2로 심화 기준을 확인합니다.', href: '/writing/placement?level=7.0' },
];

export function WritingBoard() {
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);

  return (
    <section className="mt-7" aria-labelledby="writing-board-title">
      <div className="mb-4 flex items-center gap-2"><Compass className="size-4 text-[#d76a47]" aria-hidden="true" /><h2 id="writing-board-title" className="font-serif text-2xl">Writing Board</h2></div>

      <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#38634f]"><Sparkles className="size-4" aria-hidden="true" />STARTING LEVEL</div>
            <h3 className="mt-4 font-serif text-3xl tracking-tight">시작 레벨을 설정하세요.</h3>
            <p className="mt-3 text-sm leading-6 text-[#69736e]">내 실력에 맞는 Writing 단계로 학습을 시작합니다.</p>
          </div>
          <Button type="button" size="lg" onClick={() => setLevelDialogOpen(true)} className="h-11 shrink-0 rounded-xl bg-[#1d2935] px-5 text-[#fffdf8] hover:bg-[#344451]">레벨 설정하기 <ArrowRight className="size-4" aria-hidden="true" /></Button>
        </div>
      </section>

      {levelDialogOpen && <><button type="button" aria-label="시작 레벨 선택 닫기" onClick={() => setLevelDialogOpen(false)} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]" /><section role="dialog" aria-modal="true" aria-labelledby="writing-level-dialog-title" className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-lg -translate-y-1/2 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(29,41,53,0.2)] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">STARTING LEVEL</p><h3 id="writing-level-dialog-title" className="mt-1 font-serif text-3xl">어디서 시작할까요?</h3><p className="mt-2 text-sm leading-6 text-[#707873]">처음 선택한 레벨은 학습의 출발점이 됩니다.</p></div><button type="button" aria-label="닫기" onClick={() => setLevelDialogOpen(false)} className="grid size-9 shrink-0 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button></div><div className="mt-6 space-y-3">{levelChoices.map((choice) => <a key={choice.level} href={choice.href} className="group flex items-center justify-between gap-4 rounded-2xl border border-[#ded7ca] p-4 transition-colors hover:border-[#e6b7a5] hover:bg-[#fff8f4]"><span><span className="block font-serif text-xl text-[#24333a]">{choice.level}</span><span className="mt-1 block text-sm text-[#737b76]">{choice.description}</span></span><ArrowRight className="size-4 shrink-0 text-[#9ba39d] transition-transform group-hover:translate-x-0.5 group-hover:text-[#d76a47]" aria-hidden="true" /></a>)}</div></section></>}
    </section>
  );
}
