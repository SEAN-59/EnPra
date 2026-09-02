import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { WritingNotebookClient } from '@/components/writing-client';
import { WritingHeader } from '@/components/writing-header';
import { WritingSubnav } from '@/components/writing-subnav';

export const dynamic = 'force-dynamic';

export default async function WritingNotebookPage() {
  const user = await requireChatGPTUser('/writing/notebook');
  return <AppShell activeSection="WRITING" displayName={user.displayName} signOutHref={chatGPTSignOutPath('/writing/notebook')}><section className="min-w-0"><WritingHeader /><div className="mt-9"><WritingSubnav activeItem="NOTEBOOK" /></div><WritingNotebookClient /></section></AppShell>;
}
