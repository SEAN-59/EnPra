'use client';

import { Bot, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { toast } from '@/components/ui/toast';

async function readResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try { return JSON.parse(text) as T; } catch { throw new Error(text || '요청을 처리하지 못했습니다.'); }
}

export function VocaAIGenerator() {
  const [count, setCount] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!generating) return;
    setProgress(8);
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(92, current + Math.max(1, Math.round((95 - current) / 7))));
    }, 900);
    return () => window.clearInterval(timer);
  }, [generating]);

  async function generateVocabulary() {
    setGenerating(true);
    try {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-generate', count }),
      });
      const started = await readResponse<{ jobId?: string; error?: string }>(response);
      if (!response.ok || !started.jobId) throw new Error(started.error ?? 'AI 단어 생성을 시작하지 못했습니다.');
      let result: { status?: 'running' | 'completed' | 'failed'; listId?: number; addedCount?: number; partial?: boolean; attempts?: number; error?: string };
      do {
        await new Promise((resolve) => window.setTimeout(resolve, 1_800));
        const statusResponse = await fetch(`/api/vocabulary?mode=generation&jobId=${started.jobId}`, { cache: 'no-store' });
        result = await readResponse<typeof result>(statusResponse);
        if (!statusResponse.ok || result.status === 'failed') throw new Error(result.error ?? 'AI 단어를 생성하지 못했습니다.');
        if (result.status === 'running') setProgress((current) => Math.min(95, Math.max(current, 15 + (result.attempts ?? 0) * 15)));
      } while (result.status === 'running');
      if (result.status !== 'completed' || !result.listId) throw new Error(result.error ?? 'AI 단어를 생성하지 못했습니다.');
      setProgress(100);
      window.setTimeout(() => {
        const params = new URLSearchParams({ list: String(result.listId), generated: '1', added: String(result.addedCount ?? 0) });
        if (result.partial) params.set('partial', '1');
        window.location.href = `/voca/list?${params.toString()}`;
      }, 650);
    } catch (error) {
      toast.add({ title: 'AI 단어를 생성하지 못했어요.', description: error instanceof Error ? error.message : 'ChatGPT 연결 상태를 확인한 뒤 다시 시도해 주세요.', type: 'error', priority: 'high' });
      setGenerating(false);
      setProgress(0);
    }
  }

  return (
    <section className="mt-7 max-w-3xl" aria-labelledby="ai-vocabulary-title">
      <div className="flex items-start gap-3 border-b border-[#dcd6ca] pb-5"><a href="/voca/list" aria-label="저장된 단어 리스트로 돌아가기" className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#ded7ca] bg-[#fffdf8] text-[#52605b] transition-transform hover:bg-[#f4f0e8] active:scale-95">←</a><div><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">AI VOCABULARY</p><h2 id="ai-vocabulary-title" className="mt-1 font-serif text-2xl sm:text-3xl">AI로 새 단어 만들기</h2><p className="mt-2 text-sm leading-6 text-[#707873]">연결한 ChatGPT가 기존 단어와 중복되지 않도록 확인하며 개인 단어 목록을 만듭니다.</p></div></div>

      <section className="mt-6 rounded-3xl border border-[#ded7ca] bg-[#fffdf8] p-6 shadow-[0_12px_32px_rgba(35,44,43,0.04)] sm:p-8">
        {!generating ? <><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.12em] text-[#8a918b]">GENERATE COUNT</p><h3 className="mt-1 font-serif text-2xl">몇 개를 만들까요?</h3></div><span className="rounded-2xl bg-[#1d2935] px-4 py-2 font-serif text-2xl text-[#fffdf8]">{count}<span className="ml-1 text-sm font-sans font-semibold text-[#c7d0cb]">개</span></span></div><input aria-label="AI가 생성할 단어 수" type="range" min="20" max="50" step="5" value={count} onChange={(event) => setCount(Number(event.target.value))} className="mt-10 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#ded7ca] accent-[#e9784f]" /><div className="mt-3 flex justify-between text-xs font-semibold text-[#848b86]"><span>20개</span><span>25</span><span>30</span><span>35</span><span>40</span><span>45</span><span>50개</span></div><div className="mt-9 rounded-2xl bg-[#f7f4ed] p-4 text-sm leading-6 text-[#66706b]"><div className="flex items-center gap-2 font-semibold text-[#43504c]"><Bot className="size-4 text-[#d76a47]" aria-hidden="true" />중복 방지 생성</div><p className="mt-2">필요한 개수를 채울 때까지 최대 5번 연속으로 생성하고, 이미 저장된 단어와 이번 생성의 중복을 제외합니다.</p></div><button type="button" onClick={() => void generateVocabulary()} className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1d2935] text-sm font-semibold text-[#fffdf8] transition-transform hover:bg-[#344451] active:scale-[0.98]"><Sparkles className="size-4" aria-hidden="true" />{count}개 단어 생성하기</button></> : <div className="py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fff0e9] text-[#d76a47]"><Sparkles className="size-6" aria-hidden="true" /></span><h3 className="mt-6 font-serif text-2xl">AI가 단어를 만들고 있어요.</h3><p className="mt-2 text-sm leading-6 text-[#707873]">현재 생성 작업이 계속 진행 중입니다. 중복을 확인하고 개인 목록으로 저장하는 중이에요.</p><div className="mt-8 h-2 overflow-hidden rounded-full bg-[#e5dfd3]"><div className="h-full rounded-full bg-[#e9784f] transition-[width] duration-700 ease-out animate-pulse" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-xs font-semibold text-[#b65d3d]">{progress < 92 ? '단어를 생성하고 있어요' : progress < 100 ? '단어 목록에 저장하고 있어요' : '저장이 완료됐어요'}</p></div>}
      </section>
    </section>
  );
}
