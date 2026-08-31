import { Bell } from 'lucide-react';

import { AppShell } from '@/components/app-shell';

type PracticeDashboardProps = {
  displayName: string;
  signOutHref: string;
};

export function PracticeDashboard({ displayName, signOutHref }: PracticeDashboardProps) {
  return (
    <AppShell activeSection="HOME" displayName={displayName} signOutHref={signOutHref}>
      <section id="home" className="min-w-0">
        <div className="mb-8"><p className="text-sm font-semibold text-[#d76a47]">HOME</p><h1 className="mt-1 font-serif text-4xl tracking-tight sm:text-5xl">안녕하세요, {displayName}.</h1><p className="mt-3 text-sm leading-6 text-[#69736e]">EnPra의 새로운 소식과 내 활동을 한곳에서 확인하세요.</p></div>
        <section aria-labelledby="notice-title"><div className="mb-3 flex items-center gap-2"><Bell className="size-4 text-[#d76a47]" aria-hidden="true" /><h2 id="notice-title" className="font-serif text-2xl">서비스 공지</h2></div><div className="overflow-hidden rounded-2xl border border-[#ded7ca] bg-[#fffdf8]"><article className="border-b border-[#ebe5d9] p-5 sm:p-6"><div className="flex items-start justify-between gap-5"><div><p className="font-semibold">EnPra 베타 서비스를 준비하고 있어요.</p><p className="mt-2 text-sm leading-6 text-[#717873]">각 학습 영역과 개인 기록 기능은 순서대로 열릴 예정입니다.</p></div><span className="shrink-0 text-xs text-[#8b918b]">NEW</span></div></article><article className="p-5 sm:p-6"><p className="font-semibold">AI 피드백 연결 기능을 준비 중입니다.</p><p className="mt-2 text-sm leading-6 text-[#717873]">계정별 AI 연결 상태는 프로필 메뉴에서 확인할 수 있습니다.</p></article></div></section>
        <section className="mt-10" aria-labelledby="dashboard-title"><h2 id="dashboard-title" className="font-serif text-2xl">나의 대시보드</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5"><p className="text-xs font-semibold tracking-wide text-[#8b918b]">ACCOUNT</p><p className="mt-4 font-semibold">{displayName}</p><a href="/mypage" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#38634f] hover:text-[#264c3a]">마이페이지 ↗</a></article><article className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5"><p className="text-xs font-semibold tracking-wide text-[#8b918b]">AI CONNECTION</p><p className="mt-4 flex items-center gap-2 font-semibold"><span className="size-2 rounded-full bg-[#a8ada9]" />연결 필요</p><p className="mt-3 text-xs leading-5 text-[#747c77]">연결 후 AI 피드백을 사용할 수 있습니다.</p></article><article className="rounded-2xl border border-dashed border-[#cec6b7] bg-[#fbf9f4] p-5"><p className="text-xs font-semibold tracking-wide text-[#8b918b]">MY ACTIVITY</p><p className="mt-4 font-semibold">아직 기록이 없습니다.</p><p className="mt-3 text-xs leading-5 text-[#747c77]">학습을 시작하면 내 활동이 이곳에 표시됩니다.</p></article></div></section>
      </section>
    </AppShell>
  );
}
