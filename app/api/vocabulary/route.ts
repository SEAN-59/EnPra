import { NextRequest } from 'next/server';

import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
const bridgeServiceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;

async function forwardToBridge(path: string, method: 'GET' | 'POST', user: NonNullable<Awaited<ReturnType<typeof getChatGPTUser>>>, body?: string) {
  if (!bridgeUrl || !bridgeServiceToken) {
    return Response.json({ error: '단어 목록 서비스를 아직 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 });
  }

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
    return new Response(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('EnPra vocabulary bridge request failed', {
      path,
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: '단어 목록 서버에 닿지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });

  const mode = request.nextUrl.searchParams.get('mode');
  if (mode === 'catalog') return forwardToBridge('/api/vocabulary/catalog', 'GET', user);
  return forwardToBridge('/api/vocabulary/lists', 'GET', user);
}

export async function POST(request: NextRequest) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '올바른 단어 목록 요청이 아닙니다.' }, { status: 400 });
  }

  if (body && typeof body === 'object' && (body as { action?: unknown }).action === 'manual') {
    const { action: _action, ...manualWord } = body as { action: 'manual' } & Record<string, unknown>;
    return forwardToBridge('/api/vocabulary/words', 'POST', user, JSON.stringify(manualWord));
  }

  if (body && typeof body === 'object' && (body as { action?: unknown }).action === 'manual-batch') {
    const { action: _action, ...manualWords } = body as { action: 'manual-batch' } & Record<string, unknown>;
    return forwardToBridge('/api/vocabulary/lists/manual-entries', 'POST', user, JSON.stringify(manualWords));
  }

  const listId = body && typeof body === 'object' ? (body as { listId?: unknown }).listId : undefined;

  if (typeof listId !== 'number' || !Number.isSafeInteger(listId) || listId < 1) {
    return Response.json({ error: '올바른 단어 목록이 아닙니다.' }, { status: 400 });
  }
  return forwardToBridge(`/api/vocabulary/lists/${listId}/add`, 'POST', user);
}
