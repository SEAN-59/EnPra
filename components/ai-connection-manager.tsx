'use client';

import { ArrowLeft, CheckCircle2, Link2, LoaderCircle, Unlink } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Connection = { status: 'pending' | 'active' | 'disconnected' | 'error'; plan_type?: string | null };
type DeviceLogin = { verificationUrl: string; userCode: string };
type ConnectionResponse = { connection?: Connection | null; error?: string };

export function AIConnectionManager() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [login, setLogin] = useState<DeviceLogin | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [testInput, setTestInput] = useState('"take part in"의 뜻과 자연스러운 예문을 알려줘.');
  const [testAnswer, setTestAnswer] = useState('');
  const [testing, setTesting] = useState(false);

  async function readConnection() {
    const response = await fetch('/api/ai-connection', { cache: 'no-store' });
    const result = await response.json() as ConnectionResponse;
    if (!response.ok) throw new Error(result.error ?? '연결 상태를 확인할 수 없습니다.');
    setConnection(result.connection ?? null);
    return result.connection ?? null;
  }

  useEffect(() => {
    void readConnection().catch((error: unknown) => setMessage(error instanceof Error ? error.message : '연결 상태를 확인할 수 없습니다.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (connection?.status !== 'pending') return;
    const timer = window.setInterval(() => { void readConnection().catch(() => undefined); }, 2500);
    return () => window.clearInterval(timer);
  }, [connection?.status]);

  async function startConnection() {
    setSubmitting(true); setMessage('');
    try {
      const response = await fetch('/api/ai-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
      const result = await response.json() as DeviceLogin & ConnectionResponse;
      if (!response.ok || !result.verificationUrl || !result.userCode) throw new Error(result.error ?? 'ChatGPT 연결을 시작할 수 없습니다.');
      setConnection({ status: 'pending' });
      setLogin({ verificationUrl: result.verificationUrl, userCode: result.userCode });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally { setSubmitting(false); }
  }

  async function disconnect() {
    setSubmitting(true); setMessage('');
    try {
      const response = await fetch('/api/ai-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'disconnect' }) });
      if (!response.ok) {
        const result = await response.json() as ConnectionResponse;
        throw new Error(result.error ?? '연결을 해제할 수 없습니다.');
      }
      setConnection({ status: 'disconnected' });
      setLogin(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally { setSubmitting(false); }
  }

  async function runTest() {
    const input = testInput.trim();
    if (!input) return;
    setTesting(true); setMessage(''); setTestAnswer('');
    try {
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input }) });
      const result = await response.json() as { text?: string; error?: string };
      if (!response.ok || !result.text) throw new Error(result.error ?? 'AI 응답을 받지 못했습니다.');
      setTestAnswer(result.text);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally { setTesting(false); }
  }

  const connected = connection?.status === 'active';
  const pending = connection?.status === 'pending';

  return <main className="grid min-h-screen place-items-center bg-[#f7f4ed] p-5 text-[#1d2935]"><section className="w-full max-w-md rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7 shadow-[0_18px_48px_rgba(35,44,43,0.08)] sm:p-9">
    <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#66706d] hover:text-[#1d2935]"><ArrowLeft className="size-4" /> EnPra로 돌아가기</a>
    <span className={`mt-8 grid size-10 place-items-center rounded-xl ${connected ? 'bg-[#e8f3eb] text-[#347353]' : 'bg-[#1d2935] text-[#f7f4ed]'}`}>{connected ? <CheckCircle2 className="size-5" /> : <Link2 className="size-5" />}</span>
    <h1 className="mt-5 font-serif text-3xl tracking-tight">ChatGPT 연결</h1>
    <p className="mt-2 text-sm leading-relaxed text-[#68716c]">연결한 ChatGPT 계정으로 EnPra의 AI 학습 기능을 사용할 수 있습니다.</p>
    {loading ? <p className="mt-7 flex items-center gap-2 text-sm text-[#68716c]"><LoaderCircle className="size-4 animate-spin" /> 연결 상태를 확인하고 있습니다.</p> : connected ? <><div className="mt-7 rounded-2xl bg-[#e8f3eb] p-5 text-[#28533d]"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5" /> 연결됨{connection?.plan_type ? ` · ${connection.plan_type}` : ''}</div><p className="mt-2 text-sm text-[#47735d]">이제 AI가 단어 생성과 학습 피드백에 사용됩니다.</p><Button type="button" variant="ghost" disabled={submitting} onClick={disconnect} className="mt-4 h-9 px-0 text-[#8d4834] hover:bg-transparent hover:text-[#6d3324]">{submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Unlink className="size-4" />}연결 해제</Button></div><section className="mt-5 rounded-2xl border border-[#d8d0c3] bg-[#f7f4ed] p-4"><p className="font-semibold">AI 응답 테스트</p><p className="mt-1 text-xs leading-5 text-[#68716c]">연결된 내 Codex 계정으로 실제 학습 요청을 한 번 보냅니다.</p><Textarea value={testInput} onChange={(event) => setTestInput(event.target.value)} className="mt-4 min-h-24 resize-none border-[#d8d0c3] bg-[#fffefa] text-sm" /><Button type="button" disabled={testing || !testInput.trim()} onClick={runTest} className="mt-3 h-10 w-full rounded-xl bg-[#1d2935] text-[#fffdf8] hover:bg-[#344451]">{testing && <LoaderCircle className="size-4 animate-spin" />}AI에게 보내기</Button>{testAnswer && <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[#fffdf8] p-3 font-sans text-sm leading-6 text-[#35433e]">{testAnswer}</pre>}</section></> : <>
      {pending && login && <div className="mt-7 rounded-2xl border border-[#d8d0c3] bg-[#f7f4ed] p-5"><p className="text-sm font-semibold">1. 아래 주소를 열고 ChatGPT에 로그인하세요.</p><a className="mt-2 block break-all text-sm font-medium text-[#d76a47] underline" href={login.verificationUrl} target="_blank" rel="noreferrer">{login.verificationUrl}</a><p className="mt-5 text-sm font-semibold">2. 이 코드를 입력하세요.</p><p className="mt-2 rounded-xl bg-[#1d2935] px-4 py-3 text-center font-mono text-xl tracking-[0.18em] text-[#f7f4ed]">{login.userCode}</p><p className="mt-4 flex items-center gap-2 text-xs text-[#68716c]"><LoaderCircle className="size-3.5 animate-spin" />로그인 완료를 확인하고 있습니다.</p></div>}
      {message && <p className="mt-5 rounded-lg bg-[#f9e8e1] px-3 py-2 text-sm text-[#a9492b]" role="alert">{message}</p>}
      {!pending && <Button type="button" onClick={startConnection} disabled={submitting} className="mt-7 h-11 w-full rounded-xl bg-[#1d2935] text-[#fffdf8] hover:bg-[#344451]">{submitting && <LoaderCircle className="size-4 animate-spin" />}ChatGPT 연결하기</Button>}
    </>}
  </section></main>;
}
