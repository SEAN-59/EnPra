import { ArrowRight, BarChart3, BookOpenCheck, ClipboardCheck, FileText, GraduationCap, Sparkles, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';

const metrics = [
  { label: 'CURRENT LEVEL', value: '시작 전', detail: '시작 난이도 설정 필요' },
  { label: 'LEARNING COMPLETED', value: '0회', detail: '완료한 학습' },
  { label: 'TESTS TAKEN', value: '0회', detail: '완료한 테스트' },
  { label: 'ACTIVE FOCUS', value: '—', detail: '현재 보완 항목' },
];

const abilityRows = [
  { label: '문장 정확성', detail: '학습 기록이 쌓이면 분석됩니다.' },
  { label: 'Task 1 데이터 표현', detail: '학습 기록이 쌓이면 분석됩니다.' },
  { label: 'Task 2 논리 전개', detail: '학습 기록이 쌓이면 분석됩니다.' },
  { label: '연결어·응집성', detail: '학습 기록이 쌓이면 분석됩니다.' },
];

export function WritingBoard() {
  return (
    <section className="mt-7" aria-labelledby="writing-board-title">
      <div className="mb-4 flex items-center gap-2"><BarChart3 className="size-4 text-[#d76a47]" aria-hidden="true" /><h2 id="writing-board-title" className="font-serif text-2xl">Writing Board</h2></div>

      <section className="overflow-hidden rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] shadow-[0_18px_48px_rgba(35,44,43,0.05)]">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#38634f]"><Sparkles className="size-4" aria-hidden="true" />CURRENT WRITING STATUS</div>
            <h3 className="mt-4 font-serif text-3xl tracking-tight">첫 학습을 시작해 보세요.</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69736e]">아직 Writing 기록이 없습니다. 시작 난이도를 정한 뒤 학습을 완료하면, 강점과 보완 항목을 바탕으로 다음 학습을 안내해 드립니다.</p>
          </div>
          <Button asChild size="lg" className="h-11 shrink-0 rounded-xl bg-[#1d2935] px-5 text-[#fffdf8] hover:bg-[#344451]"><a href="/writing/learning?setup=level" className="inline-flex items-center justify-center gap-2 whitespace-nowrap">학습 시작하기 <ArrowRight className="size-4" aria-hidden="true" /></a></Button>
        </div>
        <div className="border-t border-[#e8e2d6] bg-[#fbf9f4] px-6 py-4 text-sm text-[#737b76] sm:px-8"><span className="font-semibold text-[#52605b]">안내</span><span className="mx-2 text-[#c7beb1]">·</span>승급 테스트는 학습·일반 테스트 기록이 충분히 쌓인 뒤에만 안내됩니다.</div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 sm:p-7">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0eb] text-[#38634f]"><BookOpenCheck className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold tracking-[0.14em] text-[#38634f]">LEARNING</p><h3 className="mt-1 font-serif text-2xl">현재 단계 학습</h3><p className="mt-2 text-sm leading-6 text-[#707873]">힌트와 약점 보완을 포함한 학습으로 현재 Writing 단계를 차근차근 익힙니다.</p></div></div>
          <Button asChild className="mt-6 h-10 w-full rounded-xl bg-[#1d2935] text-[#fffdf8] hover:bg-[#344451]"><a href="/writing/learning" className="inline-flex items-center justify-center gap-2">학습하기 <ArrowRight className="size-4" aria-hidden="true" /></a></Button>
        </section>
        <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 sm:p-7">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e9] text-[#d76a47]"><ClipboardCheck className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">QUICK CHECK</p><h3 className="mt-1 font-serif text-2xl">빠른 실력 점검</h3><p className="mt-2 text-sm leading-6 text-[#707873]">힌트 없는 한 문항으로 현재 상태를 빠르게 확인하고, 다음 학습에 반영합니다.</p></div></div>
          <Button asChild variant="outline" className="mt-6 h-10 w-full rounded-xl border-[#d3cbbe] bg-[#fffdf8] text-[#43504e] hover:bg-[#f2ede4]"><a href="/writing/test" className="inline-flex items-center justify-center gap-2">테스트 <ClipboardCheck className="size-4" aria-hidden="true" /></a></Button>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="writing-metrics-title">
        <div className="flex items-center gap-2"><Target className="size-4 text-[#d76a47]" aria-hidden="true" /><h3 id="writing-metrics-title" className="font-serif text-2xl">현재 학습 상태</h3></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5"><p className="text-xs font-semibold tracking-wide text-[#8b918b]">{metric.label}</p><p className="mt-4 font-serif text-2xl">{metric.value}</p><p className="mt-1 text-sm text-[#747c77]">{metric.detail}</p></article>)}</div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 sm:p-7" aria-labelledby="ability-title">
          <div className="flex items-center gap-2"><BarChart3 className="size-4 text-[#38634f]" aria-hidden="true" /><h3 id="ability-title" className="font-serif text-2xl">능력 현황</h3></div>
          <div className="mt-5 divide-y divide-[#ebe5d9]">{abilityRows.map((ability) => <article key={ability.label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="font-semibold text-[#43504e]">{ability.label}</p><p className="mt-1 text-sm text-[#7a827d]">{ability.detail}</p></div><span className="shrink-0 rounded-full bg-[#f1ede5] px-3 py-1.5 text-xs font-semibold text-[#78807b]">대기</span></article>)}</div>
        </section>
        <section className="rounded-3xl border border-dashed border-[#d7cfc2] bg-[#fbf9f4] p-6 sm:p-7" aria-labelledby="recent-title">
          <div className="flex items-center gap-2"><FileText className="size-4 text-[#d76a47]" aria-hidden="true" /><h3 id="recent-title" className="font-serif text-2xl">최근 기록</h3></div>
          <div className="mt-7 text-center"><FileText className="mx-auto size-8 text-[#b5b8b1]" aria-hidden="true" /><p className="mt-4 font-semibold text-[#56615d]">아직 완료한 기록이 없습니다.</p><p className="mt-2 text-sm leading-6 text-[#7a827d]">첫 학습을 완료하면 가장 최근 피드백을 이곳에서 바로 확인할 수 있어요.</p></div>
          <a href="/writing/notebook" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8d0c3] bg-[#fffdf8] px-4 py-2.5 text-sm font-semibold text-[#596560] transition-colors hover:bg-[#f1ede5]">오답노트 보기 <ArrowRight className="size-4" aria-hidden="true" /></a>
        </section>
      </section>

      <section className="mt-4 rounded-2xl border border-[#e9d6ab] bg-[#fff8e7] p-5 text-sm leading-6 text-[#705b2d]" aria-label="승급 테스트 안내"><div className="flex items-start gap-3"><GraduationCap className="mt-0.5 size-5 shrink-0 text-[#b0781f]" aria-hidden="true" /><p><span className="font-semibold">승급 테스트 안내</span><br />현재 단계의 마지막 내부 난이도까지 학습 기록이 쌓이면, 다음 단계를 위한 3문항 승급 테스트를 안내합니다.</p></div></section>
    </section>
  );
}
