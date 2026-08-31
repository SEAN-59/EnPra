'use client';

import { ChevronDown, ChevronUp, RotateCcw, Settings2, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

const testTypes = [
  { id: 'word', label: '영단어 맞추기', ratio: 40 },
  { id: 'meaning', label: '뜻 맞추기', ratio: 40 },
  { id: 'sentence', label: '문장 맞추기', ratio: 20 },
] as const;

type TestType = (typeof testTypes)[number]['id'];

function defaultTestCounts(generationCount: number): Record<TestType, number> {
  const total = Math.round(generationCount * 0.6);
  const word = Math.round(total * 0.4);
  const meaning = Math.round(total * 0.4);
  return { word, meaning, sentence: total - word - meaning };
}

export function VocaSettings() {
  const [open, setOpen] = useState(false);
  const [generationCount, setGenerationCount] = useState(20);
  const [testCounts, setTestCounts] = useState<Record<TestType, number>>(() => defaultTestCounts(20));
  const [autoTestCounts, setAutoTestCounts] = useState(true);

  function updateGenerationCount(value: number) {
    setGenerationCount(value);
    if (autoTestCounts) setTestCounts(defaultTestCounts(value));
  }

  function updateTestCount(id: TestType, value: number) {
    setAutoTestCounts(false);
    setTestCounts((current) => ({ ...current, [id]: Math.min(100, Math.max(0, value)) }));
  }

  return (
    <>
      <button type="button" aria-label="VOCA 학습 설정 열기" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#d8d0c3] bg-[#fffdf8] text-[#596560] hover:bg-[#eee9df]"><Settings2 className="size-4" aria-hidden="true" /></button>

      {open && <button type="button" aria-label="VOCA 학습 설정 닫기" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]" />}
      <aside aria-label="VOCA 학습 설정" className={`fixed inset-y-0 right-0 z-50 flex w-[min(25rem,calc(100vw-1.5rem))] flex-col border-l border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[-16px_0_45px_rgba(29,41,53,0.14)] transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#d76a47]">VOCA SETTINGS</p><h2 className="mt-1 font-serif text-2xl">학습 설정</h2></div><button type="button" aria-label="VOCA 학습 설정 닫기" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button></div>

        <section className="mt-8"><div className="flex items-center justify-between"><label htmlFor="generation-count" className="font-semibold">1회 생성량</label><span className="rounded-full bg-[#e8f0eb] px-3 py-1 text-sm font-bold text-[#38634f]">{generationCount}개</span></div><p className="mt-2 text-sm leading-6 text-[#747c77]">AI가 한 번에 만들어 줄 단어 수입니다.</p><input id="generation-count" type="range" min="20" max="100" step="10" value={generationCount} onChange={(event) => updateGenerationCount(Number(event.target.value))} className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#ded7ca] accent-[#e9784f]" /><div className="mt-2 flex justify-between text-xs text-[#8a918b]"><span>20개</span><span>100개</span></div></section>

        <section className="mt-9 border-t border-[#e7e0d5] pt-8"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">테스트 문제 수</h3><p className="mt-2 text-sm leading-6 text-[#747c77]">일일 생성량의 60%를 기본으로, 40% · 40% · 20%로 나눕니다.</p></div><button type="button" onClick={() => { setTestCounts(defaultTestCounts(generationCount)); setAutoTestCounts(true); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#d8d0c3] px-2.5 py-2 text-xs font-semibold text-[#5d6863] hover:bg-[#f1ede5]"><RotateCcw className="size-3.5" aria-hidden="true" />기본값</button></div><div className="mt-5 space-y-3">{testTypes.map(({ id, label, ratio }) => <div key={id} className="flex items-center gap-3 rounded-xl border border-[#ddd5c8] bg-[#fffefa] p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{label}</p><p className="mt-0.5 text-xs text-[#7d847f]">기본 {ratio}%</p></div><div className="flex h-10 w-24 overflow-hidden rounded-lg border border-[#d8d0c3] bg-white"><input aria-label={label + ' 문제 수'} type="number" min="0" max="100" value={testCounts[id]} onChange={(event) => updateTestCount(id, Number(event.target.value) || 0)} className={autoTestCounts ? 'min-w-0 flex-1 bg-transparent px-2 text-center text-sm font-bold text-[#d24c31] outline-none' : 'min-w-0 flex-1 bg-transparent px-2 text-center text-sm font-bold text-[#1d2935] outline-none'} /><div className="flex w-8 flex-col border-l border-[#d8d0c3]"><button type="button" aria-label={label + ' 문제 수 늘리기'} onClick={() => updateTestCount(id, testCounts[id] + 1)} className="grid flex-1 place-items-center border-b border-[#d8d0c3] text-[#67716c] hover:bg-[#f1ede5]"><ChevronUp className="size-3" aria-hidden="true" /></button><button type="button" aria-label={label + ' 문제 수 줄이기'} onClick={() => updateTestCount(id, testCounts[id] - 1)} className="grid flex-1 place-items-center text-[#67716c] hover:bg-[#f1ede5]"><ChevronDown className="size-3" aria-hidden="true" /></button></div></div></div>)}</div><p className={autoTestCounts ? 'mt-4 text-right text-xs font-semibold text-[#d24c31]' : 'mt-4 text-right text-xs font-semibold text-[#68736e]'}>총 {Object.values(testCounts).reduce((sum, count) => sum + count, 0)}문제</p></section>

        <Button onClick={() => setOpen(false)} className="mt-auto h-12 w-full rounded-xl bg-[#1d2935] text-[#fffdf8] hover:bg-[#344451]">설정 적용하기</Button>
      </aside>
    </>
  );
}
