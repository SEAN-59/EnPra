import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { WritingPracticeClient } from '@/components/writing-client';
import { WritingHeader } from '@/components/writing-header';
import { WritingSubnav } from '@/components/writing-subnav';

export const dynamic = 'force-dynamic';

export default async function WritingPracticePage() {
  const user = await requireChatGPTUser('/writing/practice');
  return <AppShell activeSection="WRITING" displayName={user.displayName} signOutHref={chatGPTSignOutPath('/writing/practice')}><section className="min-w-0"><WritingHeader /><div className="mt-9"><WritingSubnav activeItem="PRACTICE" /></div><WritingPracticeClient /></section></AppShell>;
}
