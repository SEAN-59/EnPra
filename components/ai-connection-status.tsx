'use client';

import { CheckCircle2, ChevronRight, KeyRound, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type Connection = {
  status: 'pending' | 'active' | 'disconnected' | 'error';
  plan_type?: string | null;
};

type ConnectionResponse = { connection?: Connection | null; error?: string };

export function AIConnectionStatus({ variant = 'drawer' }: { variant?: 'drawer' | 'dashboard' }) {
  const [connection, setConnection] = useState<Connection | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void fetch('/api/ai-connection', { cache: 'no-store' })
      .then(async (response) => ({ response, body: await response.json() as ConnectionResponse }))
      .then(({ response, body }) => { if (alive && response.ok) setConnection(body.connection ?? null); })
      .catch(() => { if (alive) setConnection(null); });
    return () => { alive = false; };
  }, []);

  const isLoading = connection === undefined;
  const isConnected = connection?.status === 'active';
  const isPending = connection?.status === 'pending';
  const statusText = isLoading ? '상태 확인 중' : isConnected ? '연결됨' : isPending ? '로그인 확인 중' : '연결 필요';

  if (variant === 'dashboard') {
    return (
      <article className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-5">
        <p className="text-xs font-semibold tracking-wide text-[#8b918b]">AI CONNECTION</p>
        <p className="mt-4 flex items-center gap-2 font-semibold"><span className={`size-2 rounded-full ${isConnected ? 'bg-[#4ca773]' : isPending ? 'bg-[#d99c45]' : 'bg-[#a8ada9]'}`} />{statusText}</p>
        <a href="/connect" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#38634f] hover:text-[#264c3a]">{isConnected ? '연결 관리' : 'ChatGPT 연결하기'} <ChevronRight className="size-3.5" aria-hidden="true" /></a>
      </article>
    );
  }

  return (
    <section className="mt-7">
      <p className="px-1 text-[10px] font-bold tracking-[0.16em] text-[#8b918b] uppercase">AI connection</p>
      <a href="/connect" className="mt-3 block rounded-2xl border border-[#e1dbcf] p-4 transition-colors hover:bg-[#f7f4ed]">
        <span className="flex items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isConnected ? 'bg-[#e8f3eb] text-[#347353]' : 'bg-[#f1ede5] text-[#67716c]'}`}>
            {isLoading ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : isConnected ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <KeyRound className="size-5" aria-hidden="true" />}
          </span>
          <span className="min-w-0"><span className="block font-semibold">AI 사용 OAuth</span><span className="mt-1 flex items-center gap-1.5 text-sm text-[#737b76]"><span className={`size-2 rounded-full ${isConnected ? 'bg-[#4ca773]' : isPending ? 'bg-[#d99c45]' : 'bg-[#a8ada9]'}`} />{statusText}</span></span>
          <ChevronRight className="ml-auto mt-3 size-4 shrink-0 text-[#89908b]" aria-hidden="true" />
        </span>
        <span className="mt-4 block text-xs leading-relaxed text-[#7a817c]">{isConnected ? '내 ChatGPT 계정 연결을 관리합니다.' : '연결하면 내 ChatGPT 계정으로 AI 피드백을 사용할 수 있습니다.'}</span>
      </a>
    </section>
  );
}
