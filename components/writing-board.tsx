import { ArrowRight, Compass, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function WritingBoard() {
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
          <Button asChild size="lg" className="h-11 shrink-0 rounded-xl bg-[#1d2935] px-5 text-[#fffdf8] hover:bg-[#344451]"><a href="/writing/learning?setup=level" className="inline-flex items-center justify-center gap-2 whitespace-nowrap">레벨 설정하기 <ArrowRight className="size-4" aria-hidden="true" /></a></Button>
        </div>
      </section>
    </section>
  );
}
