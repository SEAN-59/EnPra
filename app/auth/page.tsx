'use client';

import { ArrowLeft, KeyRound, LoaderCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'login' | 'register';
const bridgeUrl = process.env.NEXT_PUBLIC_ENPRA_BRIDGE_URL;

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bridgeUrl) { setMessage('로컬 브리지 주소가 아직 설정되지 않았습니다.'); return; }
    setPending(true); setMessage('');
    const data = new FormData(event.currentTarget);
    const body = mode === 'register'
      ? { name: data.get('name'), email: data.get('email'), username: data.get('username'), password: data.get('password') }
      : { identifier: data.get('identifier'), password: data.get('password') };
    try {
      const response = await fetch(`${bridgeUrl}/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const result = await response.json() as { error?: string; session?: string };
      if (!response.ok || !result.session) throw new Error(result.error ?? '로그인에 실패했습니다.');
      sessionStorage.setItem('enpra_session', result.session);
      window.location.href = '/connect';
    } catch (error) { setMessage(error instanceof Error ? error.message : '다시 시도해 주세요.'); }
    finally { setPending(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f7f4ed] p-5 text-[#1d2935]">
    <section className="w-full max-w-md rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7 shadow-[0_18px_48px_rgba(35,44,43,0.08)] sm:p-9">
      <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#66706d] hover:text-[#1d2935]"><ArrowLeft className="size-4" /> EnPra로 돌아가기</a>
      <div className="mt-8"><span className="grid size-10 place-items-center rounded-xl bg-[#1d2935] text-[#f7f4ed]"><KeyRound className="size-5" /></span><h1 className="mt-5 font-serif text-3xl tracking-tight">{mode === 'login' ? 'Welcome back.' : 'Start your practice.'}</h1><p className="mt-2 text-sm leading-relaxed text-[#68716c]">{mode === 'login' ? '로그인하고 자신의 학습 공간으로 돌아가세요.' : '가입 후 자신의 ChatGPT/Codex 연결을 추가할 수 있어요.'}</p></div>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === 'register' && <><label className="block text-sm font-medium">이름<Input required name="name" className="mt-1.5 border-[#d8d0c3] bg-[#fffefa]" /></label><label className="block text-sm font-medium">이메일<Input required name="email" type="email" className="mt-1.5 border-[#d8d0c3] bg-[#fffefa]" /></label><label className="block text-sm font-medium">아이디<Input required name="username" pattern="[a-zA-Z0-9_]{3,24}" title="3~24자 영문, 숫자, 밑줄을 사용하세요." className="mt-1.5 border-[#d8d0c3] bg-[#fffefa]" /></label></>}
        {mode === 'login' && <label className="block text-sm font-medium">이메일 또는 아이디<Input required name="identifier" autoComplete="username" className="mt-1.5 border-[#d8d0c3] bg-[#fffefa]" /></label>}
        <label className="block text-sm font-medium">비밀번호<Input required name="password" type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="mt-1.5 border-[#d8d0c3] bg-[#fffefa]" /></label>
        {message && <p className="rounded-lg bg-[#f9e8e1] px-3 py-2 text-sm text-[#a9492b]" role="alert">{message}</p>}
        <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-[#1d2935] text-[#fffdf8] hover:bg-[#344451]">{pending && <LoaderCircle className="size-4 animate-spin" />}{mode === 'login' ? '로그인' : '회원가입'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-[#68716c]">{mode === 'login' ? '처음이신가요?' : '이미 계정이 있나요?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }} className="font-semibold text-[#d76a47] hover:underline">{mode === 'login' ? '회원가입' : '로그인'}</button></p>
    </section>
  </main>;
}
