'use client';

import { ArrowLeft, CheckCircle2, ChevronRight, ListChecks, Sparkles } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

type VocabularyMeaning = { partOfSpeech: 'n.' | 'v.' | 'adj.' | 'adv.'; text: string };
type VocabularyWord = { word: string; meanings: VocabularyMeaning[] };

function FittedWord({ word }: { word: string }) {
  const wordRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const element = wordRef.current;
    if (!element) return;

    const fit = () => {
      const maximum = window.matchMedia('(min-width: 640px)').matches ? 36 : 24;
      let size = maximum;
      element.style.fontSize = `${size}px`;

      while (element.scrollWidth > element.clientWidth && size > 11) {
        size -= 1;
        element.style.fontSize = `${size}px`;
      }
    };

    const observer = new ResizeObserver(fit);
    observer.observe(element);
    fit();
    return () => observer.disconnect();
  }, [word]);

  return <h3 ref={wordRef} className="min-w-0 truncate font-serif font-semibold tracking-[-0.035em] text-[#293632]">{word}</h3>;
}

const lists: Array<{ id: string; date: string; label: string; count: number; status: string; words: VocabularyWord[] }> = [
  { id: 'aug-31', date: '2026. 08. 31', label: '오늘', count: 20, status: '학습 전', words: [{ word: 'habit', meanings: [{ partOfSpeech: 'n.', text: '습관' }, { partOfSpeech: 'n.', text: '버릇' }] }, { word: 'routine', meanings: [{ partOfSpeech: 'n.', text: '일상' }, { partOfSpeech: 'n.', text: '규칙적인 절차' }] }, { word: 'sustainable', meanings: [{ partOfSpeech: 'adj.', text: '지속 가능한' }, { partOfSpeech: 'adj.', text: '계속할 수 있는' }] }, { word: 'commitment', meanings: [{ partOfSpeech: 'n.', text: '전념' }, { partOfSpeech: 'n.', text: '약속, 책임' }] }, { word: 'consistent', meanings: [{ partOfSpeech: 'adj.', text: '일관된' }, { partOfSpeech: 'adj.', text: '꾸준한' }] }, { word: 'realistic', meanings: [{ partOfSpeech: 'adj.', text: '현실적인' }, { partOfSpeech: 'adj.', text: '실현 가능한' }] }] },
  { id: 'aug-30', date: '2026. 08. 30', label: '어제', count: 20, status: '학습 완료', words: [{ word: 'perspective', meanings: [{ partOfSpeech: 'n.', text: '관점' }, { partOfSpeech: 'n.', text: '시각' }] }, { word: 'approach', meanings: [{ partOfSpeech: 'n.', text: '접근법' }, { partOfSpeech: 'v.', text: '다가가다' }] }, { word: 'challenge', meanings: [{ partOfSpeech: 'n.', text: '도전, 난제' }, { partOfSpeech: 'v.', text: '도전하다' }] }, { word: 'progress', meanings: [{ partOfSpeech: 'n.', text: '진전' }, { partOfSpeech: 'v.', text: '발전하다' }] }, { word: 'reflect', meanings: [{ partOfSpeech: 'v.', text: '되돌아보다' }, { partOfSpeech: 'v.', text: '반영하다' }] }, { word: 'improve', meanings: [{ partOfSpeech: 'v.', text: '개선하다' }, { partOfSpeech: 'v.', text: '향상시키다' }] }] },
  { id: 'aug-29', date: '2026. 08. 29', label: '금요일', count: 30, status: '학습 완료', words: [{ word: 'consider', meanings: [{ partOfSpeech: 'v.', text: '고려하다' }, { partOfSpeech: 'v.', text: '생각하다' }] }, { word: 'decision', meanings: [{ partOfSpeech: 'n.', text: '결정' }, { partOfSpeech: 'n.', text: '판단' }] }, { word: 'priority', meanings: [{ partOfSpeech: 'n.', text: '우선순위' }, { partOfSpeech: 'n.', text: '우선 사항' }] }, { word: 'balance', meanings: [{ partOfSpeech: 'n.', text: '균형' }, { partOfSpeech: 'v.', text: '균형을 맞추다' }] }, { word: 'achieve', meanings: [{ partOfSpeech: 'v.', text: '달성하다' }, { partOfSpeech: 'v.', text: '이루다' }] }, { word: 'focus', meanings: [{ partOfSpeech: 'n.', text: '집중' }, { partOfSpeech: 'v.', text: '집중하다' }] }] },
  { id: 'aug-28', date: '2026. 08. 28', label: '목요일', count: 20, status: '학습 완료', words: [{ word: 'encourage', meanings: [{ partOfSpeech: 'v.', text: '격려하다' }, { partOfSpeech: 'v.', text: '장려하다' }] }, { word: 'support', meanings: [{ partOfSpeech: 'v.', text: '지원하다' }, { partOfSpeech: 'n.', text: '지지' }] }, { word: 'confidence', meanings: [{ partOfSpeech: 'n.', text: '자신감' }, { partOfSpeech: 'n.', text: '신뢰' }] }, { word: 'effort', meanings: [{ partOfSpeech: 'n.', text: '노력' }, { partOfSpeech: 'n.', text: '수고' }] }, { word: 'growth', meanings: [{ partOfSpeech: 'n.', text: '성장' }, { partOfSpeech: 'n.', text: '증가' }] }, { word: 'notice', meanings: [{ partOfSpeech: 'v.', text: '알아차리다' }, { partOfSpeech: 'n.', text: '공지' }] }] },
];

export function VocaListBoard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = lists.find((list) => list.id === selectedId);

  if (selected) {
    return (
      <section className="mt-7" aria-labelledby="word-list-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setSelectedId(null)} aria-label="일일 단어 리스트로 돌아가기" className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#ded7ca] bg-[#fffdf8] text-[#52605b] hover:bg-[#f4f0e8]"><ArrowLeft className="size-4" aria-hidden="true" /></button><div><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">{selected.label.toUpperCase()} VOCABULARY</p><h2 id="word-list-title" className="mt-1 font-serif text-2xl sm:text-3xl">{selected.date}</h2></div></div>
          <span className={selected.status === '학습 완료' ? 'rounded-full bg-[#e8f0eb] px-3 py-1.5 text-xs font-semibold text-[#38634f]' : 'rounded-full bg-[#f8eadf] px-3 py-1.5 text-xs font-semibold text-[#bd5d3e]'}>{selected.count}개 · {selected.status}</span>
        </div>
        <div className="overflow-hidden rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] shadow-[0_18px_48px_rgba(35,44,43,0.05)]">
          {selected.words.map((item, index) => <article key={item.word} className="grid grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-center gap-3 border-b border-[#e7e0d5] px-5 py-5 last:border-b-0 sm:gap-8 sm:px-7"><div className="flex min-w-0 items-baseline gap-2 sm:gap-3"><span className="w-4 shrink-0 text-xs font-semibold text-[#a3aaa5] sm:w-5">{index + 1}</span><FittedWord word={item.word} /></div><div className="border-l border-[#e9e1d6] pl-3 text-sm leading-6 text-[#59645e] sm:pl-7 sm:text-base sm:leading-7">{item.meanings.map((meaning, meaningIndex) => <p key={`${meaning.partOfSpeech}-${meaning.text}`} className="flex gap-2"><span className="w-7 shrink-0 font-semibold text-[#d76a47]">{meaningIndex === 0 || item.meanings[meaningIndex - 1].partOfSpeech !== meaning.partOfSpeech ? meaning.partOfSpeech : ''}</span><span>{meaning.text}</span></p>)}</div></article>)}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-7 max-w-3xl" aria-labelledby="daily-list-title"><div className="mb-4 flex items-center gap-2"><ListChecks className="size-4 text-[#d76a47]" aria-hidden="true" /><h2 id="daily-list-title" className="font-serif text-2xl">일일 단어 리스트</h2></div><div className="space-y-3">{lists.map((list) => { const completed = list.status === '학습 완료'; return <button key={list.id} type="button" onClick={() => setSelectedId(list.id)} className="flex w-full items-center gap-4 rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-4 text-left shadow-[0_8px_20px_rgba(35,44,43,0.035)] hover:border-[#e6b7a5] hover:bg-[#fff8f4]"><span className={completed ? 'grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0eb] text-[#38634f]' : 'grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1ede5] text-[#777f79]'}>{completed ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <Sparkles className="size-5" aria-hidden="true" />}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="font-semibold">{list.date}</span><span className="text-xs text-[#8a918b]">{list.label}</span></span><span className="mt-1 block text-sm text-[#6e7772]">{list.count}개 · {list.status}</span></span><ChevronRight className="size-4 shrink-0 text-[#929993]" aria-hidden="true" /></button>; })}</div></section>
  );
}
