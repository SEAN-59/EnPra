import { NextRequest } from 'next/server';

import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
const bridgeServiceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;

async function forward(path: string, method: 'GET' | 'POST', request: NextRequest, body?: string) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });
  if (!bridgeUrl || !bridgeServiceToken) return Response.json({ error: '라이팅 서비스를 아직 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 });
  try {
    const response = await fetch(`${bridgeUrl}${path}`, {
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
    return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json; charset=utf-8' } });
  } catch (error) {
    console.error('EnPra writing bridge request failed', { path, message: error instanceof Error ? error.message : String(error) });
    return Response.json({ error: '라이팅 서버에 닿지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode');
  if (mode === 'overview') return forward('/api/writing/overview', 'GET', request);
  if (mode === 'active') return forward('/api/writing/active', 'GET', request);
  if (mode === 'notebook') return forward('/api/writing/notebook', 'GET', request);
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (mode === 'session' && sessionId && /^\d+$/.test(sessionId)) return forward(`/api/writing/sessions/${sessionId}`, 'GET', request);
  return Response.json({ error: '올바른 라이팅 조회 요청이 아닙니다.' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 }); }
  const action = typeof body.action === 'string' ? body.action : '';
  const payload = JSON.stringify(Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'action')));
  if (action === 'placement') return forward('/api/writing/placement', 'POST', request, payload);
  if (action === 'start-session') return forward('/api/writing/sessions', 'POST', request, payload);
  if (action === 'abandon' && Number.isSafeInteger(body.sessionId)) return forward(`/api/writing/sessions/${body.sessionId}/abandon`, 'POST', request, payload);
  if (action === 'apply-promotion' && Number.isSafeInteger(body.sessionId)) return forward(`/api/writing/sessions/${body.sessionId}/apply-promotion`, 'POST', request, payload);
  if (action === 'level-change') return forward('/api/writing/level-change', 'POST', request, payload);
  if (action === 'reveal-hint' && Number.isSafeInteger(body.sessionId) && Number.isSafeInteger(body.itemId) && Number.isSafeInteger(body.hintId)) return forward(`/api/writing/sessions/${body.sessionId}/items/${body.itemId}/hints/${body.hintId}`, 'POST', request, payload);
  if (action === 'submit' && Number.isSafeInteger(body.sessionId) && Number.isSafeInteger(body.itemId)) return forward(`/api/writing/sessions/${body.sessionId}/items/${body.itemId}/submit`, 'POST', request, payload);
  return Response.json({ error: '올바른 라이팅 요청이 아닙니다.' }, { status: 400 });
}
