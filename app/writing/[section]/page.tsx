import { redirect } from 'next/navigation';

import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
export const dynamic = 'force-dynamic';

export default async function WritingSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  await requireChatGPTUser(`/writing/${section}`);
  if (section === 'learning' || section === 'test') redirect('/writing/practice');
  redirect('/writing');
}
