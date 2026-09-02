import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { WritingSessionClient } from '@/components/writing-client';

export const dynamic = 'force-dynamic';

export default async function WritingSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = Number(id);
  const user = await requireChatGPTUser(`/writing/session/${id}`);
  if (!Number.isSafeInteger(sessionId) || sessionId < 1) return null;
  return <AppShell activeSection="WRITING" displayName={user.displayName} signOutHref={chatGPTSignOutPath(`/writing/session/${id}`)}><section className="min-w-0"><WritingSessionClient sessionId={sessionId} /></section></AppShell>;
}
