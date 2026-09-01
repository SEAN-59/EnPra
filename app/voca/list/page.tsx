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
        <VocaHeader title="저장된 단어 리스트." description="추가한 공통 목록과 내 개인 단어 목록을 기기와 관계없이 이어서 학습하세요." />
        <div className="mt-9"><StudySubnav activeItem="LIST" /></div>
        <VocaListBoard />
      </section>
    </AppShell>
  );
}
