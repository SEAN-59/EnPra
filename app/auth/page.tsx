import { redirect } from 'next/navigation';

import { chatGPTSignInPath } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

export default function LegacyAuthPage() {
  redirect(chatGPTSignInPath('/'));
}
