import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { StudySubnav } from '@/components/study-subnav';
import { VocaHeader } from '@/components/voca-header';
import { VocaListBoard } from '@/components/voca-list-board';
import { VocaManualEntry } from '@/components/voca-manual-entry';
import { VocaAIGenerator } from '@/components/voca-ai-generator';

export const dynamic = 'force-dynamic';

export default async function VocaListPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const user = await requireChatGPTUser('/voca/list');
  const { mode } = await searchParams;
  const addingWords = mode === 'add';
  const generatingWords = mode === 'ai';

  return (
    <AppShell activeSection="VOCA" displayName={user.displayName} signOutHref={chatGPTSignOutPath('/voca/list')}>
      <section className="min-w-0">
        <VocaHeader title={addingWords ? '단어를 직접 추가하세요.' : generatingWords ? 'AI로 단어를 만들어 보세요.' : '저장된 단어 리스트.'} description={addingWords ? '개인 목록을 선택하고 여러 단어를 한 번에 저장할 수 있어요.' : generatingWords ? '원하는 개수를 정하면 AI가 중복을 확인해 개인 단어 목록으로 저장합니다.' : '추가한 공통 목록과 내 개인 단어 목록을 기기와 관계없이 이어서 학습하세요.'} />
        <div className="mt-9"><StudySubnav activeItem="LIST" /></div>
        {addingWords ? <VocaManualEntry /> : generatingWords ? <VocaAIGenerator /> : <VocaListBoard />}
      </section>
    </AppShell>
  );
}
