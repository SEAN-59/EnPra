import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { StudySubnav } from '@/components/study-subnav';
import { VocaHeader } from '@/components/voca-header';
import { VocaWorkspace } from '@/components/voca-learning';
export const dynamic = 'force-dynamic';
export default async function VocaPracticePage() {
  const user = await requireChatGPTUser('/voca/practice');
  return (
    <AppShell
      activeSection="VOCA"
      displayName={user.displayName}
      signOutHref={chatGPTSignOutPath('/voca/practice')}
    >
      <section className="min-w-0">
        <VocaHeader
          title="단어를 하나씩 익혀요."
          description="눌러서 확인하고, 아는 단어와 모르는 단어를 나눠요."
        />
        <div className="mt-8">
          <StudySubnav activeItem="PRACTICE" />
        </div>
        <VocaWorkspace kind="study" />
      </section>
    </AppShell>
  );
}
