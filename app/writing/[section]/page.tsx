import { ArrowLeft, PenLine } from 'lucide-react';
import { notFound } from 'next/navigation';

import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { WritingHeader } from '@/components/writing-header';
import { WritingSubnav } from '@/components/writing-subnav';

const sections = {
  learning: { activeItem: 'LEARNING' as const, title: '학습하기', description: '현재 단계와 반복 약점을 반영한 AI 학습 화면을 다음 작업에서 연결합니다.' },
  test: { activeItem: 'TEST' as const, title: '테스트', description: '일반 테스트와 3문항 승급 테스트 흐름을 다음 작업에서 연결합니다.' },
  notebook: { activeItem: 'NOTEBOOK' as const, title: '오답노트', description: '완료한 원문과 첨삭, 표현을 기록·검색하는 화면을 다음 작업에서 연결합니다.' },
};

export const dynamic = 'force-dynamic';

export default async function WritingSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const current = sections[section as keyof typeof sections];
  if (!current) notFound();
  const user = await requireChatGPTUser(`/writing/${section}`);

  return (
    <AppShell activeSection="WRITING" displayName={user.displayName} signOutHref={chatGPTSignOutPath(`/writing/${section}`)}>
      <section className="min-w-0"><WritingHeader /><div className="mt-9"><WritingSubnav activeItem={current.activeItem} /></div><section className="mt-7 rounded-3xl border border-dashed border-[#d7cfc2] bg-[#fbf9f4] px-6 py-16 text-center sm:px-10"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fffdf8] text-[#d76a47]"><PenLine className="size-5" aria-hidden="true" /></span><p className="mt-5 text-xs font-bold tracking-[0.14em] text-[#d76a47]">WRITING</p><h2 className="mt-2 font-serif text-3xl">{current.title}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#707873]">{current.description}</p><a href="/writing" className="mt-7 inline-flex items-center gap-2 rounded-xl border border-[#d8d0c3] bg-[#fffdf8] px-4 py-2.5 text-sm font-semibold text-[#596560] hover:bg-[#f1ede5]"><ArrowLeft className="size-4" aria-hidden="true" />Board로 돌아가기</a></section></section>
    </AppShell>
  );
}
