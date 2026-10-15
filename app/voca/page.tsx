import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { StudySubnav } from '@/components/study-subnav';
import { VocaHeader } from '@/components/voca-header';
import { VocaBoard } from '@/components/voca-learning';
export const dynamic = 'force-dynamic';
export default async function VocaPage() {
  const user = await requireChatGPTUser('/voca');
  return (
    <AppShell
      activeSection="VOCA"
      displayName={user.displayName}
      signOutHref={chatGPTSignOutPath('/voca')}
    >
      <section className="min-w-0">
        <VocaHeader
          title="나만의 단어 학습."
          description="단어장을 고르고, 조금씩 익히고, 테스트로 확인해요."
        />
        <div className="mt-8">
          <StudySubnav activeItem="BOARD" />
        </div>
        <VocaBoard />
      </section>
    </AppShell>
  );
}
