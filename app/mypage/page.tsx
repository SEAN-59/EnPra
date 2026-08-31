import { ArrowLeft, UserRound } from 'lucide-react';

import { requireChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const user = await requireChatGPTUser('/mypage');

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-8 text-[#1d2935] sm:px-8">
      <section className="mx-auto max-w-2xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5e6965] hover:text-[#1d2935]"><ArrowLeft className="size-4" aria-hidden="true" />학습 화면으로</a>
        <div className="mt-8 rounded-3xl border border-[#ded7ca] bg-[#fffdf8] p-7 shadow-[0_16px_42px_rgba(35,44,43,0.06)] sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#e8f0eb] text-[#38634f]"><UserRound className="size-6" aria-hidden="true" /></span>
          <p className="mt-6 text-sm font-semibold text-[#d76a47]">MY PAGE</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight">{user.displayName}</h1>
          <p className="mt-4 text-sm leading-6 text-[#69736e]">계정과 학습 기록을 관리하는 공간입니다.</p>
        </div>
      </section>
    </main>
  );
}
