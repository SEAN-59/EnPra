import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { requireEnPraAdmin } from '@/app/enpra-admin';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireChatGPTUser('/admin');
  await requireEnPraAdmin(user);

  return (
    <AppShell activeSection="ADMIN" displayName={user.displayName} signOutHref={chatGPTSignOutPath('/admin')}>
      <section className="min-w-0">
        <p className="text-xs font-semibold text-[#d76a47] sm:text-sm">ADMIN</p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-5xl">관리하기.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69736e]">서비스 문구와 공통 학습 콘텐츠를 검토하고 발행할 수 있습니다.</p>
        <section className="mt-9 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">CONTENT MANAGEMENT</p>
          <h2 className="mt-2 font-serif text-2xl">문구 발행 관리</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#69736e]">정적 문구 편집과 발행본 JSON 생성 기능을 이 화면에 추가합니다. 발행 전까지는 일반 사용자 화면에 영향을 주지 않습니다.</p>
        </section>
      </section>
    </AppShell>
  );
}
