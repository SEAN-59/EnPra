'use client';

import { CheckCircle2, ChevronRight, ListChecks, Sparkles } from 'lucide-react';
import { useState } from 'react';

const lists = [
  { id: 'aug-31', date: '2026. 08. 31', label: '오늘', count: 20, status: '학습 전', words: ['habit', 'routine', 'sustainable', 'commitment', 'consistent', 'realistic'] },
  { id: 'aug-30', date: '2026. 08. 30', label: '어제', count: 20, status: '학습 완료', words: ['perspective', 'approach', 'challenge', 'progress', 'reflect', 'improve'] },
  { id: 'aug-29', date: '2026. 08. 29', label: '금요일', count: 30, status: '학습 완료', words: ['consider', 'decision', 'priority', 'balance', 'achieve', 'focus'] },
  { id: 'aug-28', date: '2026. 08. 28', label: '목요일', count: 20, status: '학습 완료', words: ['encourage', 'support', 'confidence', 'effort', 'growth', 'notice'] },
];

export function VocaListBoard() {
  const [selectedId, setSelectedId] = useState(lists[0].id);
  const selected = lists.find((list) => list.id === selectedId) ?? lists[0];

  return (
    <div className="mt-7 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
      <section aria-labelledby="daily-list-title"><div className="mb-3 flex items-center gap-2"><ListChecks className="size-4 text-[#d76a47]" aria-hidden="true" /><h2 id="daily-list-title" className="font-serif text-2xl">일일 단어 리스트</h2></div><div className="space-y-3">{lists.map((list) => { const selectedItem = list.id === selectedId; const completed = list.status === '학습 완료'; return <button key={list.id} type="button" onClick={() => setSelectedId(list.id)} className={selectedItem ? 'flex w-full items-center gap-4 rounded-2xl border border-[#e6b7a5] bg-[#fff0e9] p-4 text-left shadow-[0_10px_24px_rgba(35,44,43,0.05)]' : 'flex w-full items-center gap-4 rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-4 text-left hover:bg-[#f7f4ed]'}><span className={completed ? 'grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0eb] text-[#38634f]' : 'grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1ede5] text-[#777f79]'}>{completed ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <Sparkles className="size-5" aria-hidden="true" />}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="font-semibold">{list.date}</span><span className="text-xs text-[#8a918b]">{list.label}</span></span><span className="mt-1 block text-sm text-[#6e7772]">{list.count}개 · {list.status}</span></span><ChevronRight className="size-4 shrink-0 text-[#929993]" aria-hidden="true" /></button>; })}</div></section>
      <section aria-labelledby="list-preview-title" className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#d76a47]">{selected.label.toUpperCase()} LIST</p><h2 id="list-preview-title" className="mt-1 font-serif text-3xl tracking-tight">{selected.date}</h2><p className="mt-2 text-sm text-[#707872]">AI가 생성한 {selected.count}개 단어</p></div><span className={selected.status === '학습 완료' ? 'rounded-full bg-[#e8f0eb] px-3 py-1.5 text-xs font-semibold text-[#38634f]' : 'rounded-full bg-[#f8eadf] px-3 py-1.5 text-xs font-semibold text-[#bd5d3e]'}>{selected.status}</span></div><div className="mt-7 grid gap-2 sm:grid-cols-2">{selected.words.map((word, index) => <div key={word} className="flex items-center gap-3 rounded-xl border border-[#e5ded2] bg-[#fffefa] px-4 py-3"><span className="grid size-6 place-items-center rounded-md bg-[#f1ede5] text-xs font-bold text-[#7b827e]">{index + 1}</span><span className="font-semibold">{word}</span></div>)}</div><p className="mt-6 text-xs leading-5 text-[#7b827e]">단어를 선택하면 뜻·예문·학습 상태를 확인하는 상세 화면으로 이어집니다.</p></section>
    </div>
  );
}
