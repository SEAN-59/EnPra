import { NextRequest } from 'next/server';

import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
const bridgeServiceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;

export async function POST(request: NextRequest) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });
  if (!bridgeUrl || !bridgeServiceToken) {
    return Response.json({ error: 'AI 연결 서비스를 아직 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 });
  }

  let body: string;
  try {
    body = await request.text();
    JSON.parse(body);
  } catch {
    return Response.json({ error: 'AI 요청 본문이 올바르지 않습니다.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${bridgeUrl}/api/ai/respond`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-EnPra-Service-Token': bridgeServiceToken,
        'X-EnPra-User-Id': user.userId,
        // HTTP header values must be ASCII. The display name can contain Korean,
        // so encode it before it leaves the Sites worker.
        'X-EnPra-User-Name': encodeURIComponent(user.displayName),
      },
      body,
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json; charset=utf-8' },
    });
  } catch {
    return Response.json({ error: 'AI 연결 서버에 닿지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}
