import { ArrowRight, BookMarked, BrainCircuit, CalendarDays, CheckCircle2, ClipboardCheck, Sparkles } from 'lucide-react';

import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { StudySubnav } from '@/components/study-subnav';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const week = [
  { day: 'MON', date: '25', status: 'done' },
  { day: 'TUE', date: '26', status: 'done' },
  { day: 'WED', date: '27', status: 'done' },
  { day: 'THU', date: '28', status: 'done' },
  { day: 'FRI', date: '29', status: 'today' },
  { day: 'SAT', date: '30', status: 'upcoming' },
  { day: 'SUN', date: '31', status: 'upcoming' },
];

export default async function VocaPage() {
  const user = await requireChatGPTUser('/voca');

  return (
    <AppShell activeSection="VOCA" displayName={user.displayName} signOutHref={chatGPTSignOutPath('/voca')}>
      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-sm font-semibold text-[#d76a47]">VOCA</p><h1 className="mt-1 font-serif text-4xl tracking-tight sm:text-5xl">나만의 단어 학습.</h1><p className="mt-3 text-sm leading-6 text-[#69736e]">단어를 모으고, 익히고, 테스트로 확인하세요.</p></div>
          <Button className="h-11 rounded-xl bg-[#1d2935] px-4 text-[#fffdf8] hover:bg-[#344451]"><Sparkles className="size-4" aria-hidden="true" />AI로 단어 만들기</Button>
        </div>

        <div className="mt-9"><StudySubnav activeItem="BOARD" /></div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#38634f]"><BookMarked className="size-4" aria-hidden="true" />TODAY&apos;S BOARD</div>
            <h2 className="mt-4 font-serif text-3xl tracking-tight">오늘의 단어 20개</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#69736e]">현재 학습 흐름에 맞춘 단어를 복습하고, 바로 테스트까지 이어갈 수 있어요.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap"><Button asChild size="lg" className="h-11 w-full rounded-xl bg-[#1d2935] px-3 text-[#fffdf8] hover:bg-[#344451] sm:w-auto sm:px-5"><a href="/voca#practice" className="inline-flex items-center justify-center gap-2 whitespace-nowrap">학습하기 <ArrowRight className="size-4 shrink-0" aria-hidden="true" /></a></Button><Button asChild size="lg" variant="outline" className="h-11 w-full rounded-xl border-[#d3cbbe] bg-[#fffdf8] px-3 text-[#43504e] hover:bg-[#f2ede4] sm:w-auto sm:px-5"><a href="/voca#test" className="inline-flex items-center justify-center gap-2 whitespace-nowrap">테스트 <ClipboardCheck className="size-4 shrink-0" aria-hidden="true" /></a></Button></div>
          </section>
          <section className="rounded-3xl bg-[#1d2935] p-6 text-[#f7f4ed] sm:p-8"><div className="flex items-center gap-2 text-sm font-semibold text-[#f0bf7f]"><BrainCircuit className="size-4" aria-hidden="true" />MEMORY CHECK</div><p className="mt-5 font-serif text-3xl tracking-tight">184개</p><p className="mt-1 text-sm text-[#bac3bd]">외운 단어</p><div className="mt-7 h-2 overflow-hidden rounded-full bg-[#52605b]"><div className="h-full w-[74%] rounded-full bg-[#f0bf7f]" /></div><p className="mt-3 text-xs text-[#bac3bd]">총 학습 단어 248개 중 74%</p></section>
        </div>

        <section className="mt-8 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-[#38634f]"><CalendarDays className="size-4" aria-hidden="true" />LEARNING FLOW</div><h2 className="mt-2 font-serif text-2xl">이번 주 학습 현황</h2></div><p className="text-sm text-[#737b76]">8월 25일–31일</p></div>
          <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
            {week.map(({ day, date, status }) => <div key={day} className={status === 'done' ? 'rounded-2xl border border-[#bdd8c5] bg-[#edf7f0] p-2 text-center sm:p-3' : status === 'today' ? 'rounded-2xl border border-[#e9bba9] bg-[#fff0e9] p-2 text-center sm:p-3' : 'rounded-2xl border border-dashed border-[#d9d1c3] bg-[#fbf9f4] p-2 text-center sm:p-3'}><p className="text-[10px] font-bold tracking-wide text-[#868d87]">{day}</p><p className="mt-2 font-serif text-xl">{date}</p><div className="mt-2 flex justify-center">{status === 'done' ? <CheckCircle2 className="size-4 text-[#3f7a58]" aria-label="학습 완료" /> : status === 'today' ? <span className="size-2.5 rounded-full bg-[#e9784f]" aria-label="오늘 학습" /> : <span className="size-2.5 rounded-full bg-[#d5d0c6]" aria-label="미학습" />}</div></div>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#727a76]"><span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-[#3f7a58]" />학습 완료</span><span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#e9784f]" />오늘 학습</span><span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#d5d0c6]" />미학습</span></div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5"><p className="text-xs font-semibold tracking-wide text-[#8b918b]">TOTAL LEARNED</p><p className="mt-4 font-serif text-3xl">248</p><p className="mt-1 text-sm text-[#747c77]">전체 학습 단어</p></article>
          <article className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5"><p className="text-xs font-semibold tracking-wide text-[#8b918b]">MEMORIZED</p><p className="mt-4 font-serif text-3xl">184</p><p className="mt-1 text-sm text-[#747c77]">외운 단어</p></article>
          <article className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5"><p className="text-xs font-semibold tracking-wide text-[#8b918b]">LAST TEST</p><p className="mt-4 font-serif text-3xl">18 <span className="text-lg text-[#7c837e]">/ 20</span></p><p className="mt-1 text-sm text-[#747c77]">가장 최근 테스트</p></article>
          <article className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5"><p className="text-xs font-semibold tracking-wide text-[#8b918b]">TESTS TAKEN</p><p className="mt-4 font-serif text-3xl">12</p><p className="mt-1 text-sm text-[#747c77]">전체 응시 테스트</p></article>
        </section>
      </section>
    </AppShell>
  );
}
