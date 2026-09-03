import { redirect } from 'next/navigation';

import type { ChatGPTUser } from '@/app/chatgpt-auth';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
const bridgeServiceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;

export async function getEnPraAdminAccess(user: ChatGPTUser): Promise<boolean> {
  if (!bridgeUrl || !bridgeServiceToken) return false;

  try {
    const response = await fetch(`${bridgeUrl}/api/admin/access`, {
      cache: 'no-store',
      headers: {
        'X-EnPra-Service-Token': bridgeServiceToken,
        'X-EnPra-User-Id': user.userId,
        'X-EnPra-User-Name': encodeURIComponent(user.displayName),
      },
    });
    if (!response.ok) return false;
    const body = await response.json() as { isAdmin?: unknown };
    return body.isAdmin === true;
  } catch (error) {
    console.error('EnPra admin access check failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function requireEnPraAdmin(user: ChatGPTUser) {
  if (!await getEnPraAdminAccess(user)) redirect('/');
}
