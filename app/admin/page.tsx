import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { requireEnPraAdmin } from '@/app/enpra-admin';
import { AppShell } from '@/components/app-shell';
import { ManageCopyClient } from '@/components/manage-copy-client';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireChatGPTUser('/admin');
  await requireEnPraAdmin(user);

  return (
    <AppShell activeSection="ADMIN" displayName={user.displayName} signOutHref={chatGPTSignOutPath('/admin')}>
      <section className="min-w-0">
        <p className="text-xs font-semibold text-[#d76a47] sm:text-sm">MANAGE</p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-5xl">서비스 관리.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69736e]">고정 문구의 초안, 발행본, 되돌리기 이력을 관리합니다.</p>
        <ManageCopyClient />
      </section>
    </AppShell>
  );
}
