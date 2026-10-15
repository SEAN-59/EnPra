import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { StudySubnav } from '@/components/study-subnav';
import { VocaHeader } from '@/components/voca-header';
import { VocaWorkspace } from '@/components/voca-learning';
export const dynamic = 'force-dynamic';
export default async function VocaTestPage() {
  const user = await requireChatGPTUser('/voca/test');
  return (
    <AppShell
      activeSection="VOCA"
      displayName={user.displayName}
      signOutHref={chatGPTSignOutPath('/voca/test')}
    >
      <section className="min-w-0">
        <VocaHeader
          title="얼마나 기억하고 있을까요?"
          description="같은 단어장에서 네 가지 방식으로 확인해요."
        />
        <div className="mt-8">
          <StudySubnav activeItem="TEST" />
        </div>
        <VocaWorkspace kind="test" />
      </section>
    </AppShell>
  );
}
