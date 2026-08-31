'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, BookOpen, Headphones, KeyRound, LogOut, Menu, Mic, PenLine, SpellCheck, UserRound, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type AppSection = 'HOME' | 'VOCA' | 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';

type AppShellProps = {
  activeSection: AppSection;
  children: ReactNode;
  displayName: string;
  signOutHref: string;
};

const navigation: Array<{ label: AppSection; href: string; icon: LucideIcon }> = [
  { label: 'HOME', href: '/', icon: BookOpen },
  { label: 'VOCA', href: '/voca', icon: SpellCheck },
  { label: 'READING', href: '/#reading', icon: BookOpen },
  { label: 'LISTENING', href: '/#listening', icon: Headphones },
  { label: 'WRITING', href: '/#writing', icon: PenLine },
  { label: 'SPEAKING', href: '/#speaking', icon: Mic },
];

function NavigationLinks({ activeSection, closeMenu }: { activeSection: AppSection; closeMenu?: () => void }) {
  return (
    <>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = label === activeSection;
        return <a key={label} onClick={closeMenu} className={active ? 'flex items-center gap-3 rounded-lg bg-[#e9e5dc] px-3 py-2.5 text-sm font-semibold' : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#66706d] hover:bg-[#ebe7dd]'} href={href}><Icon className={active ? 'size-4 text-[#e9784f]' : 'size-4'} aria-hidden="true" />{label}</a>;
      })}
    </>
  );
}

export function AppShell({ activeSection, children, displayName, signOutHref }: AppShellProps) {
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#1d2935]">
      <header className="border-b border-[#dcd6ca] bg-[#f7f4ed]/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="학습 메뉴 열기" aria-expanded={leftDrawerOpen} onClick={() => { setLeftDrawerOpen(true); setAccountDrawerOpen(false); }} className="grid size-10 place-items-center rounded-xl bg-[#1d2935] text-[#f7f4ed] shadow-sm lg:hidden"><Menu className="size-5" aria-hidden="true" /></button>
            <a className="flex items-center gap-3" href="/"><span><span className="block font-serif text-xl leading-none tracking-tight">EnPra</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.18em] text-[#727a76] uppercase">English practice</span></span></a>
          </div>
          <button type="button" aria-label="프로필 메뉴 열기" aria-expanded={accountDrawerOpen} onClick={() => { setAccountDrawerOpen(true); setLeftDrawerOpen(false); }} className="grid size-10 place-items-center rounded-xl border border-[#d4ccbe] bg-[#fffdf8] text-[#44514e] hover:bg-[#eee9df]"><UserRound className="size-5" aria-hidden="true" /></button>
        </div>
      </header>

      {leftDrawerOpen && <button type="button" aria-label="학습 메뉴 닫기" onClick={() => setLeftDrawerOpen(false)} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px] lg:hidden" />}
      <aside aria-label="학습 메뉴" className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col border-r border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[16px_0_45px_rgba(29,41,53,0.14)] transition-transform duration-200 lg:hidden ${leftDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-[#1d2935] text-[#f7f4ed]"><BookOpen className="size-4" aria-hidden="true" /></span><span className="font-serif text-xl">EnPra</span></div><button type="button" aria-label="학습 메뉴 닫기" onClick={() => setLeftDrawerOpen(false)} className="grid size-9 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button></div>
        <nav aria-label="학습 메뉴" className="mt-8 space-y-1"><NavigationLinks activeSection={activeSection} closeMenu={() => setLeftDrawerOpen(false)} /></nav>
      </aside>

      {accountDrawerOpen && <button type="button" aria-label="계정 메뉴 닫기" onClick={() => setAccountDrawerOpen(false)} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]" />}
      <aside aria-label="계정 메뉴" className={`fixed inset-y-0 right-0 z-50 flex w-[min(23rem,calc(100vw-1.5rem))] flex-col border-l border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[-16px_0_45px_rgba(29,41,53,0.14)] transition-transform duration-200 ${accountDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#727a76]">Account</p><button type="button" aria-label="계정 메뉴 닫기" onClick={() => setAccountDrawerOpen(false)} className="grid size-9 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button></div>
        <a href="/mypage" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e1dbcf] p-4 transition-colors hover:bg-[#f7f4ed]"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e8f0eb] text-[#38634f]"><UserRound className="size-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block truncate font-semibold">{displayName}</span><span className="mt-0.5 block text-xs text-[#737b76]">마이페이지</span></span><ArrowUpRight className="ml-auto size-4 shrink-0 text-[#89908b]" aria-hidden="true" /></a>
        <section className="mt-7"><p className="px-1 text-[10px] font-bold tracking-[0.16em] text-[#8b918b] uppercase">AI connection</p><div className="mt-3 rounded-2xl border border-[#e1dbcf] p-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1ede5] text-[#67716c]"><KeyRound className="size-5" aria-hidden="true" /></span><div><p className="font-semibold">AI 사용 OAuth</p><p className="mt-1 flex items-center gap-1.5 text-sm text-[#737b76]"><span className="size-2 rounded-full bg-[#a8ada9]" />연결 필요</p></div></div><p className="mt-4 text-xs leading-relaxed text-[#7a817c]">연결하면 내 ChatGPT 계정으로 AI 피드백을 사용할 수 있습니다.</p></div></section>
        <a href={signOutHref} className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6a4135] hover:bg-[#faede7]"><LogOut className="size-4" aria-hidden="true" />로그아웃</a>
      </aside>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-7 lg:grid-cols-[218px_minmax(0,1fr)] lg:px-8 lg:py-10">
        <aside className="hidden lg:block"><div className="sticky top-8"><p className="mb-3 px-1 text-[10px] font-bold tracking-[0.16em] text-[#8b918b] uppercase">Practice</p><nav aria-label="학습 메뉴" className="space-y-1"><NavigationLinks activeSection={activeSection} /></nav></div></aside>
        {children}
      </div>
    </main>
  );
}
