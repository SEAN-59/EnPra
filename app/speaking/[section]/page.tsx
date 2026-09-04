import { notFound } from 'next/navigation';
import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AppShell } from '@/components/app-shell';
import { SpeakingHeader } from '@/components/speaking-header';
import { SpeakingNotebook } from '@/components/speaking-notebook';
import { SpeakingPartOnePrototype } from '@/components/speaking-part-one-prototype';
import { SpeakingPartTwoPrototype } from '@/components/speaking-part-two-prototype';
import { SpeakingPractice } from '@/components/speaking-practice';
import { SpeakingSubnav } from '@/components/speaking-subnav';

export const dynamic = 'force-dynamic';

export default async function SpeakingSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const user = await requireChatGPTUser(`/speaking/${section}`);
  if (section === 'part1') return <AppShell activeSection="SPEAKING" displayName={user.displayName} signOutHref={chatGPTSignOutPath(`/speaking/${section}`)}><section className="min-w-0"><SpeakingPartOnePrototype /></section></AppShell>;
  if (section === 'part2') return <AppShell activeSection="SPEAKING" displayName={user.displayName} signOutHref={chatGPTSignOutPath(`/speaking/${section}`)}><section className="min-w-0"><SpeakingPartTwoPrototype /></section></AppShell>;
  if (section === 'part3') return <AppShell activeSection="SPEAKING" displayName={user.displayName} signOutHref={chatGPTSignOutPath(`/speaking/${section}`)}><section className="min-w-0"><SpeakingPartOnePrototype variant="part3" /></section></AppShell>;
  if (section !== 'practice' && section !== 'notebook') notFound();
  return <AppShell activeSection="SPEAKING" displayName={user.displayName} signOutHref={chatGPTSignOutPath(`/speaking/${section}`)}><section className="min-w-0"><SpeakingHeader /><div className="mt-9"><SpeakingSubnav activeItem={section === 'practice' ? 'PRACTICE' : 'NOTEBOOK'} /></div>{section === 'practice' ? <SpeakingPractice /> : <SpeakingNotebook />}</section></AppShell>;
}
