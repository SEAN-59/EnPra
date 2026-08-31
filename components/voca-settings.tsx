'use client';

import { Check, ChevronDown, ChevronUp, Settings2, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

const testTypes = [
  { id: 'word', label: '영단어 맞추기' },
  { id: 'meaning', label: '뜻 맞추기' },
  { id: 'sentence', label: '문장 맞추기' },
] as const;

export function VocaSettings() {
  const [open, setOpen] = useState(false);
  const [generationCount, setGenerationCount] = useState(20);
  const [testCount, setTestCount] = useState(20);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(testTypes.map(({ id }) => id));

  function changeTestCount(amount: number) {
    setTestCount((current) => Math.min(100, Math.max(5, current + amount)));
  }

  function toggleType(id: string) {
    setSelectedTypes((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <>
      <button type="button" aria-label="VOCA 학습 설정 열기" aria-expanded={open} onClick={() => setOpen(true)} className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg border border-[#d8d0c3] bg-[#fffdf8] text-[#596560] hover:bg-[#eee9df]"><Settings2 className="size-4" aria-hidden="true" /></button>

      {open && <button type="button" aria-label="VOCA 학습 설정 닫기" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]" />}
      <aside aria-label="VOCA 학습 설정" className={`fixed inset-y-0 right-0 z-50 flex w-[min(25rem,calc(100vw-1.5rem))] flex-col border-l border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[-16px_0_45px_rgba(29,41,53,0.14)] transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#d76a47]">VOCA SETTINGS</p><h2 className="mt-1 font-serif text-2xl">학습 설정</h2></div><button type="button" aria-label="VOCA 학습 설정 닫기" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button></div>

        <section className="mt-8"><div className="flex items-center justify-between"><label htmlFor="generation-count" className="font-semibold">1회 생성량</label><span className="rounded-full bg-[#e8f0eb] px-3 py-1 text-sm font-bold text-[#38634f]">{generationCount}개</span></div><p className="mt-2 text-sm leading-6 text-[#747c77]">AI가 한 번에 만들어 줄 단어 수입니다.</p><input id="generation-count" type="range" min="20" max="100" step="10" value={generationCount} onChange={(event) => setGenerationCount(Number(event.target.value))} className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#ded7ca] accent-[#e9784f]" /><div className="mt-2 flex justify-between text-xs text-[#8a918b]"><span>20개</span><span>100개</span></div></section>

        <section className="mt-9 border-t border-[#e7e0d5] pt-8"><label htmlFor="test-count" className="font-semibold">1회 테스트 문제</label><p className="mt-2 text-sm leading-6 text-[#747c77]">한 번의 테스트에서 출제할 문제 수입니다.</p><div className="mt-5 flex h-12 overflow-hidden rounded-xl border border-[#d8d0c3] bg-[#fffefa]"><input id="test-count" type="number" min="5" max="100" value={testCount} onChange={(event) => setTestCount(Math.min(100, Math.max(5, Number(event.target.value) || 5)))} className="min-w-0 flex-1 bg-transparent px-4 text-lg font-semibold outline-none" /><div className="flex w-12 flex-col border-l border-[#d8d0c3]"><button type="button" aria-label="테스트 문제 수 늘리기" onClick={() => changeTestCount(1)} className="grid flex-1 place-items-center border-b border-[#d8d0c3] text-[#67716c] hover:bg-[#f1ede5]"><ChevronUp className="size-4" aria-hidden="true" /></button><button type="button" aria-label="테스트 문제 수 줄이기" onClick={() => changeTestCount(-1)} className="grid flex-1 place-items-center text-[#67716c] hover:bg-[#f1ede5]"><ChevronDown className="size-4" aria-hidden="true" /></button></div></div></section>

        <section className="mt-9 border-t border-[#e7e0d5] pt-8"><h3 className="font-semibold">테스트 유형</h3><p className="mt-2 text-sm leading-6 text-[#747c77]">한 번의 테스트에 포함할 유형을 선택하세요.</p><div className="mt-5 space-y-2">{testTypes.map(({ id, label }) => { const selected = selectedTypes.includes(id); return <button key={id} type="button" aria-pressed={selected} onClick={() => toggleType(id)} className={selected ? 'flex w-full items-center justify-between rounded-xl border border-[#bcd8c5] bg-[#edf7f0] px-4 py-3 text-left text-sm font-semibold text-[#315e46]' : 'flex w-full items-center justify-between rounded-xl border border-[#ddd5c8] bg-[#fffdf8] px-4 py-3 text-left text-sm font-medium text-[#596560] hover:bg-[#f6f2ea]'}><span>{label}</span><span className={selected ? 'grid size-5 place-items-center rounded-full bg-[#3f7a58] text-white' : 'size-5 rounded-full border border-[#cfc7ba]'}>{selected && <Check className="size-3.5" aria-hidden="true" />}</span></button>; })}</div></section>

        <Button onClick={() => setOpen(false)} className="mt-auto h-12 w-full rounded-xl bg-[#1d2935] text-[#fffdf8] hover:bg-[#344451]">설정 적용하기</Button>
      </aside>
    </>
  );
}
