import { NextRequest } from 'next/server';

import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
const bridgeServiceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;

async function forward(method: 'GET' | 'POST', body?: string) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });
  if (!bridgeUrl || !bridgeServiceToken) return Response.json({ error: '문구 관리 서비스를 아직 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 });

  try {
    const response = await fetch(`${bridgeUrl}/api/admin/copy`, {
      method,
      cache: 'no-store',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        'X-EnPra-Service-Token': bridgeServiceToken,
        'X-EnPra-User-Id': user.userId,
        'X-EnPra-User-Name': encodeURIComponent(user.displayName),
      },
      body,
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('EnPra copy management bridge request failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: '문구 관리 서버에 닿지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}

export async function GET() {
  return forward('GET');
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  return forward('POST', JSON.stringify(body));
}
