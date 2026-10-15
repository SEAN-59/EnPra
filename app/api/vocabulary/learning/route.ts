import { NextRequest } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

async function forward(
  path: string,
  method: 'GET' | 'POST',
  payload?: Record<string, unknown>,
) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json(
      { error: '로그인한 뒤 단어 학습을 시작해 주세요.' },
      { status: 401 },
    );
  const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
  const token = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;
  if (!bridgeUrl || !token)
    return Response.json(
      { error: '단어 학습 서버를 아직 준비하지 못했습니다.' },
      { status: 503 },
    );
  try {
    const response = await fetch(
      `${bridgeUrl}/api/vocabulary/learning${path}`,
      {
        method,
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
        headers: {
          'X-EnPra-Service-Token': token,
          'X-EnPra-User-Id': user.userId,
          'X-EnPra-User-Name': encodeURIComponent(user.displayName),
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
      },
    );
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') ??
          'application/json; charset=utf-8',
      },
    });
  } catch {
    return Response.json(
      {
        error: '단어 학습 서버에 닿지 못했습니다. 잠시 후 다시 시도해 주세요.',
      },
      { status: 502 },
    );
  }
}
const validId = (id: unknown) =>
  typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode');
  if (mode === 'overview') return forward('/overview', 'GET');
  const id = Number(request.nextUrl.searchParams.get('sessionId'));
  if (mode === 'session' && validId(id))
    return forward(`/sessions/${id}`, 'GET');
  return Response.json(
    { error: '올바른 단어 학습 조회 요청이 아닙니다.' },
    { status: 400 },
  );
}
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error();
    body = value as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: '요청 형식을 확인해 주세요.' },
      { status: 400 },
    );
  }
  const { action, ...payload } = body;
  if (action === 'settings') return forward('/settings', 'POST', payload);
  if (action === 'start') return forward('/sessions', 'POST', payload);
  if (action === 'respond' && validId(body.sessionId))
    return forward(`/sessions/${body.sessionId}/respond`, 'POST', payload);
  if (action === 'abandon' && validId(body.sessionId))
    return forward(`/sessions/${body.sessionId}/abandon`, 'POST', payload);
  if (action === 'reset' && validId(body.listId))
    return forward(`/lists/${body.listId}/reset`, 'POST', payload);
  return Response.json(
    { error: '올바른 단어 학습 요청이 아닙니다.' },
    { status: 400 },
  );
}
