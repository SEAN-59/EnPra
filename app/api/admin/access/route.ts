import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
const bridgeServiceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });
  if (!bridgeUrl || !bridgeServiceToken) return Response.json({ isAdmin: false });

  try {
    const response = await fetch(`${bridgeUrl}/api/admin/access`, {
      cache: 'no-store',
      headers: {
        'X-EnPra-Service-Token': bridgeServiceToken,
        'X-EnPra-User-Id': user.userId,
        'X-EnPra-User-Name': encodeURIComponent(user.displayName),
      },
    });
    if (!response.ok) return Response.json({ isAdmin: false }, { status: response.status });
    return Response.json(await response.json());
  } catch (error) {
    console.error('EnPra admin menu access check failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ isAdmin: false });
  }
}
