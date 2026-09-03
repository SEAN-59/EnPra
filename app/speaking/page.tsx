import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { SpeakingPartOnePrototype } from '@/components/speaking-part-one-prototype';

export const dynamic = 'force-dynamic';

export default async function SpeakingPage() {
  const user = await requireChatGPTUser('/speaking');

  return (
    <AppShell
      activeSection="SPEAKING"
      displayName={user.displayName}
      signOutHref={chatGPTSignOutPath('/speaking')}
    >
      <section className="min-w-0">
        <SpeakingPartOnePrototype />
      </section>
    </AppShell>
  );
}
