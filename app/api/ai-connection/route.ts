import { NextRequest } from 'next/server';

import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');
const bridgeServiceToken = process.env.ENPRA_BRIDGE_SERVICE_TOKEN;

type ConnectionAction = 'start' | 'disconnect';

function configurationError() {
  return Response.json(
    { error: 'AI 연결 서비스를 아직 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
    { status: 503 },
  );
}

async function forwardToBridge(path: string, method: 'GET' | 'POST', user: NonNullable<Awaited<ReturnType<typeof getChatGPTUser>>>) {
  if (!bridgeUrl || !bridgeServiceToken) return configurationError();

  try {
    const response = await fetch(`${bridgeUrl}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        'X-EnPra-Service-Token': bridgeServiceToken,
        'X-EnPra-User-Id': user.userId,
        // HTTP header values must be ASCII. The display name can contain Korean,
        // so encode it before it leaves the Sites worker.
        'X-EnPra-User-Name': encodeURIComponent(user.displayName),
      },
    });
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('EnPra bridge request failed', {
      path,
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      { error: 'AI 연결 서버에 닿지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 502 },
    );
  }
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });

  return forwardToBridge('/api/connections/codex', 'GET', user);
}

export async function POST(request: NextRequest) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'ChatGPT 로그인이 필요합니다.' }, { status: 401 });

  let action: ConnectionAction | undefined;
  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === 'start' || body.action === 'disconnect') action = body.action;
  } catch {
    // The validation response below is more useful than a JSON parsing failure.
  }

  if (!action) return Response.json({ error: '올바른 연결 요청이 아닙니다.' }, { status: 400 });

  return forwardToBridge(
    action === 'start' ? '/api/connections/codex/start' : '/api/connections/codex/disconnect',
    'POST',
    user,
  );
}
