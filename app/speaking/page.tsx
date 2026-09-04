import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { SpeakingBoard } from '@/components/speaking-board';
import { SpeakingHeader } from '@/components/speaking-header';
import { SpeakingSubnav } from '@/components/speaking-subnav';

export const dynamic = 'force-dynamic';

export default async function SpeakingPage() {
  const user = await requireChatGPTUser('/speaking');

  return (
    <AppShell
      activeSection="SPEAKING"
      displayName={user.displayName}
      signOutHref={chatGPTSignOutPath('/speaking')}
    >
      <section className="min-w-0"><SpeakingHeader /><div className="mt-9"><SpeakingSubnav activeItem="BOARD" /></div><SpeakingBoard /></section>
    </AppShell>
  );
}
