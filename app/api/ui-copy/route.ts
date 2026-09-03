export const dynamic = 'force-dynamic';

const bridgeUrl = process.env.ENPRA_BRIDGE_URL?.replace(/\/$/, '');

export async function GET() {
  if (!bridgeUrl) return Response.json({ error: '정적 문구 서비스를 아직 준비하지 못했습니다.' }, { status: 503 });
  try {
    const response = await fetch(`${bridgeUrl}/content/ui-copy/current.json`, { cache: 'no-store' });
    if (!response.ok) return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    return new Response(await response.text(), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=15, s-maxage=15, stale-while-revalidate=60',
        ...(response.headers.get('ETag') ? { ETag: response.headers.get('ETag')! } : {}),
      },
    });
  } catch (error) {
    console.error('EnPra static copy bundle request failed', { message: error instanceof Error ? error.message : String(error) });
    return Response.json({ error: '정적 문구 발행본을 불러오지 못했습니다.' }, { status: 502 });
  }
}
