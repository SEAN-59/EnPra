import { ArrowLeft, ClipboardCheck, FileQuestion, ListChecks } from 'lucide-react';
import { redirect } from 'next/navigation';

import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';

const levelTests = {
  '5.0': { label: '5.0+', tasks: ['Task 1'], description: 'Task 1 한 문항으로 5.0+ 내부 시작 단계를 확인합니다.' },
  '6.0': { label: '6.0+', tasks: ['Task 1', 'Task 2'], description: 'Task 1과 Task 2를 통해 현재 수준을 확인합니다.' },
  '7.0': { label: '7.0+', tasks: ['Task 1', 'Task 2'], description: 'Task 1과 Task 2를 심화 기준으로 확인합니다.' },
};

export const dynamic = 'force-dynamic';

export default async function WritingPlacementPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams;
  const test = levelTests[level as keyof typeof levelTests];
  if (!test) redirect('/writing');
  const user = await requireChatGPTUser(`/writing/placement?level=${level}`);

  return (
    <AppShell activeSection="WRITING" displayName={user.displayName} signOutHref={chatGPTSignOutPath(`/writing/placement?level=${level}`)}>
      <section className="min-w-0">
        <a href="/writing" className="inline-flex items-center gap-2 text-sm font-semibold text-[#596560] transition-colors hover:text-[#d76a47]"><ArrowLeft className="size-4" aria-hidden="true" />Board로 돌아가기</a>
        <div className="mt-8 max-w-3xl">
          <p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">STARTING LEVEL TEST</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">{test.label} 레벨 테스트</h1>
          <p className="mt-3 text-sm leading-6 text-[#69736e]">{test.description}</p>
        </div>

        <section className="mt-8 max-w-3xl rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#38634f]"><ClipboardCheck className="size-4" aria-hidden="true" />TEST COMPOSITION</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{test.tasks.map((task, index) => <article key={task} className="rounded-2xl border border-[#ded7ca] bg-[#fbf9f4] p-5"><span className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">QUESTION {index + 1}</span><p className="mt-2 font-serif text-2xl">{task}</p><p className="mt-2 text-sm text-[#737b76]">사전 설정된 진단 문제 · 힌트 없음</p></article>)}</div>
          <div className="mt-7 rounded-2xl border border-dashed border-[#d7cfc2] bg-[#fbf9f4] px-5 py-10 text-center"><FileQuestion className="mx-auto size-7 text-[#a9afa9]" aria-hidden="true" /><p className="mt-4 font-semibold text-[#56615d]">진단 문제를 준비 중입니다.</p><p className="mt-2 text-sm leading-6 text-[#7a827d]">사전 설정할 문제와 판정 기준을 등록하면 이곳에서 바로 레벨 테스트를 진행합니다.</p></div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#eef5f0] p-4 text-sm leading-6 text-[#52705f]"><ListChecks className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>레벨 테스트는 시작 단계만 산정하며, 오답노트와 반복 약점 기록에는 포함되지 않습니다.</p></div>
        </section>
      </section>
    </AppShell>
  );
}
