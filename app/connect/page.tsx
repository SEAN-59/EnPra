import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { AIConnectionManager } from '@/components/ai-connection-manager';

export const dynamic = 'force-dynamic';

export default async function ConnectPage() {
  await requireChatGPTUser('/connect');
  return <AIConnectionManager />;
}
