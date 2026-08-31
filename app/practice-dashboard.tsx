'use client';

import { ArrowUpRight, BookOpen, Check, Clock3, Flame, Headphones, KeyRound, Lightbulb, LogOut, Menu, Mic, PenLine, Send, Sparkles, SpellCheck, UserRound, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

const prompt = 'Describe a small habit you want to build this month. Explain why it matters and how you will make it easy to keep.';

type PracticeDashboardProps = {
  displayName: string;
  signOutHref: string;
};

export function PracticeDashboard({ displayName, signOutHref }: PracticeDashboardProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#1d2935]">
      <header className="border-b border-[#dcd6ca] bg-[#f7f4ed]/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="학습 메뉴 열기" aria-expanded={leftDrawerOpen} onClick={() => { setLeftDrawerOpen(true); setDrawerOpen(false); }} className="grid size-10 place-items-center rounded-xl bg-[#1d2935] text-[#f7f4ed] shadow-sm lg:hidden"><Menu className="size-5" aria-hidden="true" /></button>
            <a className="flex items-center gap-3" href="#today">
            <span><span className="block font-serif text-xl leading-none tracking-tight">EnPra</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.18em] text-[#727a76] uppercase">English practice</span></span>
            </a>
          </div>
          <button type="button" aria-label="프로필 메뉴 열기" aria-expanded={drawerOpen} onClick={() => { setDrawerOpen(true); setLeftDrawerOpen(false); }} className="grid size-10 place-items-center rounded-xl border border-[#d4ccbe] bg-[#fffdf8] text-[#44514e] hover:bg-[#eee9df]"><UserRound className="size-5" aria-hidden="true" /></button>
        </div>
      </header>

      {leftDrawerOpen && <button type="button" aria-label="학습 메뉴 닫기" onClick={() => setLeftDrawerOpen(false)} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px] lg:hidden" />}
      <aside aria-label="학습 메뉴" className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col border-r border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[16px_0_45px_rgba(29,41,53,0.14)] transition-transform duration-200 lg:hidden ${leftDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-[#1d2935] text-[#f7f4ed]"><BookOpen className="size-4" aria-hidden="true" /></span><span className="font-serif text-xl">EnPra</span></div>
          <button type="button" aria-label="학습 메뉴 닫기" onClick={() => setLeftDrawerOpen(false)} className="grid size-9 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button>
        </div>
        <nav aria-label="학습 메뉴" className="mt-8 space-y-1 text-sm">
          <a onClick={() => setLeftDrawerOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-[#66706d] hover:bg-[#ebe7dd]" href="#library"><SpellCheck className="size-4" aria-hidden="true" />VOCA</a>
          <a onClick={() => setLeftDrawerOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-[#66706d] hover:bg-[#ebe7dd]" href="#library"><BookOpen className="size-4" aria-hidden="true" />READING</a>
          <a onClick={() => setLeftDrawerOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-[#66706d] hover:bg-[#ebe7dd]" href="#library"><Headphones className="size-4" aria-hidden="true" />LISTENING</a>
          <a onClick={() => setLeftDrawerOpen(false)} className="flex items-center gap-3 rounded-lg bg-[#e9e5dc] px-3 py-3 font-semibold" href="#today"><PenLine className="size-4 text-[#e9784f]" aria-hidden="true" />WRITING</a>
          <a onClick={() => setLeftDrawerOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-[#66706d] hover:bg-[#ebe7dd]" href="#library"><Mic className="size-4" aria-hidden="true" />SPEAKING</a>
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f1ede5] p-4 text-xs leading-relaxed text-[#69736e]">하루 한 번의 짧은 연습으로 영어 감각을 이어가세요.</div>
      </aside>

      {drawerOpen && <button type="button" aria-label="계정 메뉴 닫기" onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]" />}
      <aside aria-label="계정 메뉴" className={`fixed inset-y-0 right-0 z-50 flex w-[min(23rem,calc(100vw-1.5rem))] flex-col border-l border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[-16px_0_45px_rgba(29,41,53,0.14)] transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#727a76]">Account</p>
          <button type="button" aria-label="계정 메뉴 닫기" onClick={() => setDrawerOpen(false)} className="grid size-9 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button>
        </div>

        <a href="/mypage" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e1dbcf] p-4 transition-colors hover:bg-[#f7f4ed]">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e8f0eb] text-[#38634f]"><UserRound className="size-5" aria-hidden="true" /></span>
          <span className="min-w-0"><span className="block truncate font-semibold">{displayName}</span><span className="mt-0.5 block text-xs text-[#737b76]">마이페이지</span></span>
          <ArrowUpRight className="ml-auto size-4 shrink-0 text-[#89908b]" aria-hidden="true" />
        </a>

        <section className="mt-7">
          <p className="px-1 text-[10px] font-bold tracking-[0.16em] text-[#8b918b] uppercase">AI connection</p>
          <div className="mt-3 rounded-2xl border border-[#e1dbcf] p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1ede5] text-[#67716c]"><KeyRound className="size-5" aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="font-semibold">AI 사용 OAuth</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[#737b76]"><span className="size-2 rounded-full bg-[#a8ada9]" />연결 필요</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#7a817c]">연결하면 내 ChatGPT 계정으로 AI 피드백을 사용할 수 있습니다.</p>
          </div>
        </section>

        <a href={signOutHref} className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6a4135] hover:bg-[#faede7]"><LogOut className="size-4" aria-hidden="true" />로그아웃</a>
      </aside>

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 lg:grid-cols-[218px_minmax(0,1fr)_260px] lg:px-8 lg:py-10">
        <aside className="hidden lg:block"><div className="sticky top-8 space-y-7">
          <section className="rounded-2xl border border-[#dfd8cb] bg-[#fffdf8] p-5 shadow-[0_10px_30px_rgba(35,44,43,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold"><Flame className="size-4 text-[#e9784f]" aria-hidden="true" />5-day rhythm</div>
            <div className="mt-4 flex gap-1.5" aria-label="이번 주 학습 현황">{['M','T','W','T','F','S','S'].map((day, index) => <span key={`${day}-${index}`} className={`grid size-6 place-items-center rounded-md text-[10px] font-bold ${index < 5 ? 'bg-[#1d2935] text-[#fffdf8]' : 'bg-[#eee9df] text-[#8b918b]'}`}>{day}</span>)}</div>
            <p className="mt-4 text-xs leading-relaxed text-[#717873]">One thoughtful answer a day is enough to build fluency.</p>
          </section>
          <section id="library" className="px-1"><p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-[#8b918b] uppercase">Practice</p><div className="space-y-1 text-sm"><a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#66706d] hover:bg-[#ebe7dd]" href="#library"><SpellCheck className="size-4" aria-hidden="true" />VOCA</a><a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#66706d] hover:bg-[#ebe7dd]" href="#library"><BookOpen className="size-4" aria-hidden="true" />READING</a><a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#66706d] hover:bg-[#ebe7dd]" href="#library"><Headphones className="size-4" aria-hidden="true" />LISTENING</a><a className="flex items-center gap-3 rounded-lg bg-[#e9e5dc] px-3 py-2.5 font-semibold" href="#today"><PenLine className="size-4 text-[#e9784f]" aria-hidden="true" />WRITING</a><a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#66706d] hover:bg-[#ebe7dd]" href="#library"><Mic className="size-4" aria-hidden="true" />SPEAKING</a></div></section>
          <p className="px-1 text-xs leading-relaxed text-[#8b918b]">Feedback will come from your personal Codex connection once the local bridge is linked.</p>
        </div></aside>

        <section id="today" className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-[#d76a47]">Tuesday · 10 minutes</p><h1 className="mt-1 font-serif text-4xl tracking-tight sm:text-5xl">Your practice, today.</h1></div><Badge className="h-7 bg-[#e7efe9] px-3 text-[#32614c] hover:bg-[#e7efe9]">Intermediate · B1</Badge></div>
          <article className="overflow-hidden rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] shadow-[0_18px_48px_rgba(35,44,43,0.06)]">
            <div className="border-b border-[#e4ded2] bg-[#e8f0eb] px-6 py-4 sm:px-8"><div className="flex items-center gap-2 text-sm font-semibold text-[#38634f]"><Sparkles className="size-4" aria-hidden="true" />Daily prompt</div></div>
            <div className="px-6 py-7 sm:px-8 sm:py-9"><p className="max-w-2xl font-serif text-[1.7rem] leading-[1.23] tracking-tight text-[#26333d] sm:text-[2rem]">{prompt}</p><div className="mt-5 flex flex-wrap gap-2"><Badge variant="secondary" className="bg-[#f1ede5] text-[#626a66]">Use 3–5 sentences</Badge><Badge variant="secondary" className="bg-[#f1ede5] text-[#626a66]">Focus: future plans</Badge></div>
              <label className="mt-8 block" htmlFor="answer"><span className="mb-2 block text-sm font-semibold">Write your answer</span><Textarea id="answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setSubmitted(false); }} placeholder="Start with: This month, I want to..." className="min-h-52 resize-y border-[#d8d0c3] bg-[#fffefa] p-4 text-base leading-7 shadow-inner shadow-[#e8e1d5]/30 focus-visible:border-[#d76a47] focus-visible:ring-[#f2c9b9]" /></label>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#808780]"><span>{wordCount} words</span><span>Try for 45–80 words</span></div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-sm text-xs leading-relaxed text-[#777f79]">Your answer stays in your personal workspace. The bridge is not connected in this first screen yet.</p><Button size="lg" disabled={!answer.trim()} onClick={() => setSubmitted(true)} className="h-11 rounded-xl bg-[#1d2935] px-5 text-[#fffdf8] hover:bg-[#344451]">Send for feedback <Send className="size-4" data-icon="inline-end" aria-hidden="true" /></Button></div>
            </div>
          </article>
          {submitted && <section className="mt-6 rounded-2xl border border-[#bcd8c5] bg-[#edf7f0] p-5 text-[#29533e]" aria-live="polite"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#cce7d3]"><Check className="size-4" aria-hidden="true" /></span><div><p className="font-semibold">Answer saved for feedback</p><p className="mt-1 text-sm text-[#47735d]">Connect your local bridge to receive the full grammar and expression review here.</p></div></div></section>}
        </section>

        <aside id="progress" className="space-y-5"><section className="rounded-2xl border border-[#dfd8cb] bg-[#fffdf8] p-5"><div className="flex items-center justify-between"><h2 className="font-serif text-xl">This week</h2><ArrowUpRight className="size-4 text-[#8a918b]" aria-hidden="true" /></div><Progress value={71} className="mt-5 gap-2 [&_[data-slot=progress-indicator]]:bg-[#e9784f]"><ProgressLabel className="text-xs font-medium text-[#6d746f]">Practice goal</ProgressLabel><ProgressValue className="text-xs text-[#6d746f]">5 / 7</ProgressValue></Progress><div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#eee8dd] pt-5"><div><p className="text-2xl font-semibold">12</p><p className="mt-1 text-xs text-[#7a827c]">answers saved</p></div><div><p className="text-2xl font-semibold">38</p><p className="mt-1 text-xs text-[#7a827c]">new phrases</p></div></div></section>
          <section className="rounded-2xl bg-[#1d2935] p-5 text-[#f7f4ed]"><div className="flex items-center gap-2 text-sm font-semibold text-[#f0bf7f]"><Lightbulb className="size-4" aria-hidden="true" />Tiny focus</div><p className="mt-3 font-serif text-xl leading-snug">Use “I am going to” for plans you have already decided.</p><p className="mt-4 text-xs leading-relaxed text-[#bac3bd]">Example: I am going to prepare my lunch the night before.</p></section>
          <section className="rounded-2xl border border-dashed border-[#cfc6b6] p-5 text-sm text-[#6f7771]"><div className="flex items-center gap-2 font-semibold text-[#3e4b50]"><Clock3 className="size-4" aria-hidden="true" />Next review</div><p className="mt-2 text-xs leading-relaxed">Your common phrase patterns will appear here after the local bridge is linked.</p></section></aside>
      </div>
    </main>
  );
}
