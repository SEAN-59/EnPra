import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
const bridgeServiceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;

export async function GET(_: Request, context: { params: Promise<{ listId: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });
  if (!bridgeUrl || !bridgeServiceToken) {
    return Response.json({ error: '단어 목록 서비스를 아직 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 });
  }

  const { listId } = await context.params;
  if (!/^\d+$/.test(listId)) return Response.json({ error: '올바른 단어 목록이 아닙니다.' }, { status: 400 });

  try {
    const response = await fetch(`${bridgeUrl}/api/vocabulary/lists/${listId}`, {
      cache: 'no-store',
      headers: {
        'X-EnPra-Service-Token': bridgeServiceToken,
        'X-EnPra-User-Id': user.userId,
        'X-EnPra-User-Name': encodeURIComponent(user.displayName),
      },
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('EnPra vocabulary detail bridge request failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: '단어 목록 서버에 닿지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}
