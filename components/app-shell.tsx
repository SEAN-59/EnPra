'use client';

import type { LucideIcon } from 'lucide-react';
import { Bell, BookOpen, Home, LogOut, Mic, PenLine, SpellCheck, UserRound, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { AIConnectionStatus } from '@/components/ai-connection-status';
import { AdminNavigationLink } from '@/components/admin-navigation-link';
import { useDocumentScrollLock } from '@/components/use-document-scroll-lock';

type AppSection = 'HOME' | 'VOCA' | 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING' | 'ADMIN';

type AppShellProps = {
  activeSection: AppSection;
  children: ReactNode;
  displayName: string;
  signOutHref: string;
};

const primaryNavigation: Array<{ label: AppSection; href: string; icon: LucideIcon }> = [
  { label: 'HOME', href: '/', icon: Home },
  { label: 'VOCA', href: '/voca', icon: SpellCheck },
  { label: 'WRITING', href: '/writing', icon: PenLine },
  { label: 'SPEAKING', href: '/speaking', icon: Mic },
];

const bottomNavigation: Array<{ label: string; section: AppSection; href: string; icon: LucideIcon }> = [
  { label: '홈', section: 'HOME', href: '/', icon: Home },
  { label: '단어', section: 'VOCA', href: '/voca', icon: SpellCheck },
  { label: '라이팅', section: 'WRITING', href: '/writing', icon: PenLine },
  { label: '스피킹', section: 'SPEAKING', href: '/speaking', icon: Mic },
];

function Wordmark() {
  return (
    <a href="/" className="inline-flex items-center gap-2.5" aria-label="EnPra 홈">
      <span className="grid size-9 place-items-center rounded-[0.8rem] bg-[#1d2935] text-[#fffdf8] shadow-[0_4px_12px_rgba(29,41,53,0.14)]">
        <BookOpen className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="font-serif text-[1.38rem] leading-none tracking-[-0.04em]">EnPra</span>
    </a>
  );
}

export function AppShell({ activeSection, children, displayName, signOutHref }: AppShellProps) {
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  useDocumentScrollLock(accountDrawerOpen);

  return (
    <main className="min-h-screen bg-[#f7f4ed] pb-22 text-[#1d2935] sm:pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-[#dcd6ca]/90 bg-[#f7f4ed]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
          <Wordmark />

          <nav aria-label="주요 메뉴" className="mx-auto hidden items-center gap-1 lg:flex">
            {primaryNavigation.map(({ label, href }) => {
              const active = label === activeSection;
              return <a key={label} href={href} aria-current={active ? 'page' : undefined} className={active ? 'rounded-xl bg-[#e9e5dc] px-4 py-2 text-sm font-semibold text-[#1d2935]' : 'rounded-xl px-4 py-2 text-sm font-medium text-[#67716d] hover:bg-[#eee9df] hover:text-[#1d2935]'}>{label}</a>;
            })}
          </nav>

          <div className="ml-auto flex h-full items-center gap-1.5">
            <span className="grid size-10 place-items-center text-[#77807a]" aria-label="알림 준비 중">
              <Bell className="size-[19px]" aria-hidden="true" />
            </span>
            <button type="button" aria-label="프로필 메뉴 열기" aria-expanded={accountDrawerOpen} onClick={() => setAccountDrawerOpen(true)} className="grid size-11 place-items-center rounded-full border border-[#d4ccbe] bg-[#fffdf8] text-[#44514e] shadow-[0_2px_5px_rgba(29,41,53,0.04)] hover:bg-[#eee9df]">
              <UserRound className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {accountDrawerOpen && <button type="button" aria-label="계정 메뉴 닫기" onClick={() => setAccountDrawerOpen(false)} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]" />}
      <aside aria-label="계정 메뉴" className={`fixed inset-y-0 right-0 z-50 flex w-[min(23rem,calc(100vw-1.5rem))] flex-col border-l border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[-16px_0_45px_rgba(29,41,53,0.14)] transition-transform duration-200 ${accountDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#727a76]">Account</p><button type="button" aria-label="계정 메뉴 닫기" onClick={() => setAccountDrawerOpen(false)} className="grid size-9 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button></div>
        <a href="/mypage" onClick={() => setAccountDrawerOpen(false)} className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e1dbcf] p-4 transition-colors hover:bg-[#f7f4ed]"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e8f0eb] text-[#38634f]"><UserRound className="size-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block truncate font-semibold">{displayName}</span><span className="mt-0.5 block text-xs text-[#737b76]">마이페이지</span></span></a>
        <AIConnectionStatus />
        <div className="mt-5"><AdminNavigationLink active={activeSection === 'ADMIN'} closeMenu={() => setAccountDrawerOpen(false)} /></div>
        <a href={signOutHref} className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6a4135] hover:bg-[#faede7]"><LogOut className="size-4" aria-hidden="true" />로그아웃</a>
      </aside>

      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        {children}
      </div>

      <nav aria-label="하단 메뉴" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dcd6ca]/90 bg-[#fffdf8]/95 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {bottomNavigation.map(({ label, section, href, icon: Icon }) => {
            const active = section === activeSection;
            return <a key={section} href={href} aria-current={active ? 'page' : undefined} className={active ? 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[#d66e4d]' : 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[#77807a]'}><Icon className="size-[19px]" strokeWidth={active ? 2.3 : 1.9} aria-hidden="true" /><span className="text-[10px] font-semibold leading-none">{label}</span></a>;
          })}
          <a href="/mypage" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[#77807a]"><UserRound className="size-[19px]" strokeWidth={1.9} aria-hidden="true" /><span className="text-[10px] font-semibold leading-none">마이</span></a>
        </div>
      </nav>
    </main>
  );
}
