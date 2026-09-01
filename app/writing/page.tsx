import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { WritingBoard } from '@/components/writing-board';
import { WritingHeader } from '@/components/writing-header';
import { WritingSubnav } from '@/components/writing-subnav';

export const dynamic = 'force-dynamic';

export default async function WritingPage() {
  const user = await requireChatGPTUser('/writing');

  return (
    <AppShell activeSection="WRITING" displayName={user.displayName} signOutHref={chatGPTSignOutPath('/writing')}>
      <section className="min-w-0"><WritingHeader /><div className="mt-9"><WritingSubnav activeItem="BOARD" /></div><WritingBoard /></section>
    </AppShell>
  );
}
