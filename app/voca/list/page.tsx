import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { StudySubnav } from '@/components/study-subnav';
import { VocaHeader } from '@/components/voca-header';
import { VocaListBoard } from '@/components/voca-list-board';

export const dynamic = 'force-dynamic';

export default async function VocaListPage() {
  const user = await requireChatGPTUser('/voca/list');

  return (
    <AppShell activeSection="VOCA" displayName={user.displayName} signOutHref={chatGPTSignOutPath('/voca/list')}>
      <section className="min-w-0">
        <VocaHeader title="생성된 단어 리스트." description="AI가 만든 단어를 일일 단위로 확인하고 학습을 이어가세요." />
        <div className="mt-9"><StudySubnav activeItem="LIST" /></div>
        <VocaListBoard />
      </section>
    </AppShell>
  );
}
