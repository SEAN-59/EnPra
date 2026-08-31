'use client';

import { ArrowLeft, CheckCircle2, Link2, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const bridgeUrl = process.env.NEXT_PUBLIC_ENPRA_BRIDGE_URL;
type Login = { verificationUrl: string; userCode: string };

export default function ConnectPage() {
  const [login, setLogin] = useState<Login | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'active' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const session = typeof window === 'undefined' ? null : sessionStorage.getItem('enpra_session');

  useEffect(() => {
    if (status !== 'pending' || !bridgeUrl || !session) return;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`${bridgeUrl}/connections/codex`, { headers: { Authorization: `Bearer ${session}` } });
        const result = await response.json() as { connection?: { status?: string } };
        if (result.connection?.status === 'active') { setStatus('active'); window.clearInterval(interval); }
      } catch { /* Keep polling while the user completes their OAuth step. */ }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [session, status]);

  async function startLogin() {
    if (!bridgeUrl || !session) { setStatus('error'); setMessage('먼저 EnPra에 로그인하고 로컬 브리지 주소를 설정해 주세요.'); return; }
    setStatus('pending'); setMessage('');
    try {
      const response = await fetch(`${bridgeUrl}/connections/codex/start`, { method: 'POST', headers: { Authorization: `Bearer ${session}` } });
      const result = await response.json() as Login & { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Codex 연결을 시작할 수 없습니다.');
      setLogin(result);
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : '다시 시도해 주세요.'); }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f7f4ed] p-5 text-[#1d2935]"><section className="w-full max-w-md rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7 shadow-[0_18px_48px_rgba(35,44,43,0.08)] sm:p-9">
    <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#66706d] hover:text-[#1d2935]"><ArrowLeft className="size-4" /> EnPra로 돌아가기</a>
    <span className="mt-8 grid size-10 place-items-center rounded-xl bg-[#1d2935] text-[#f7f4ed]"><Link2 className="size-5" /></span>
    <h1 className="mt-5 font-serif text-3xl tracking-tight">Connect ChatGPT</h1>
    <p className="mt-2 text-sm leading-relaxed text-[#68716c]">내 Codex 연결을 추가하면, AI 사용량은 내 ChatGPT 계정의 할당량으로 처리됩니다.</p>
    {status === 'active' ? <div className="mt-7 rounded-2xl bg-[#e8f3eb] p-5 text-[#28533d]"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5" /> 연결 완료</div><p className="mt-2 text-sm text-[#47735d]">이제 EnPra에서 내 Codex 연결을 사용할 수 있습니다.</p><a href="/" className="mt-4 inline-block text-sm font-semibold underline">학습 시작하기</a></div> : <>
      {login && <div className="mt-7 rounded-2xl border border-[#d8d0c3] bg-[#f7f4ed] p-5"><p className="text-sm font-semibold">1. 아래 주소를 열고 로그인하세요.</p><a className="mt-2 block break-all text-sm font-medium text-[#d76a47] underline" href={login.verificationUrl} target="_blank" rel="noreferrer">{login.verificationUrl}</a><p className="mt-5 text-sm font-semibold">2. 이 코드를 입력하세요.</p><p className="mt-2 rounded-xl bg-[#1d2935] px-4 py-3 text-center font-mono text-xl tracking-[0.18em] text-[#f7f4ed]">{login.userCode}</p><p className="mt-4 flex items-center gap-2 text-xs text-[#68716c]"><LoaderCircle className="size-3.5 animate-spin" />로그인 완료를 확인하고 있습니다.</p></div>}
      {message && <p className="mt-5 rounded-lg bg-[#f9e8e1] px-3 py-2 text-sm text-[#a9492b]" role="alert">{message}</p>}
      {!login && <Button onClick={startLogin} className="mt-7 h-11 w-full rounded-xl bg-[#1d2935] text-[#fffdf8] hover:bg-[#344451]">ChatGPT 연결하기</Button>}
    </>}
  </section></main>;
}
