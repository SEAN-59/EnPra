'use client';

import { ArrowLeft, BookOpenCheck, ChevronRight, ListChecks } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';

type VocabularyList = {
  id: number;
  title: string;
  scope: 'common' | 'personal';
  listType: 'daily' | 'custom' | 'ai_generated';
  learningDate: string | null;
  wordCount: number;
};
type VocabularyWord = { id: number; word: string; pronunciationIpa: string; meanings: Array<{ partOfSpeech: string; text: string }> };
type ListsResponse = { lists?: VocabularyList[]; error?: string };
type DetailResponse = { list?: VocabularyList; words?: VocabularyWord[]; error?: string };

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

function partOfSpeechLabel(value: string) {
  const labels: Record<string, string> = { n: 'n.', v: 'v.', a: 'a.', ad: 'ad.', prep: 'prep.', phrase: 'phr.', conj: 'conj.' };
  return labels[value] ?? value;
}

async function readResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try { return JSON.parse(text) as T; } catch { throw new Error(text || '요청을 처리하지 못했습니다.'); }
}

export function VocaListBoard() {
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [selected, setSelected] = useState<VocabularyList | null>(null);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  async function selectList(list: VocabularyList) {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/vocabulary/list/${list.id}`, { cache: 'no-store' });
      const result = await readResponse<DetailResponse>(response);
      if (!response.ok || !result.list) throw new Error(result.error ?? '단어 목록을 불러오지 못했습니다.');
      setSelected(result.list);
      setWords(result.words ?? []);
      window.history.replaceState(null, '', `/voca/list?list=${list.id}`);
    } catch (error) {
      toast.add({ title: '단어 목록을 불러오지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch('/api/vocabulary', { cache: 'no-store' })
      .then(async (response) => {
        const result = await readResponse<ListsResponse>(response);
        if (!response.ok) throw new Error(result.error ?? '단어 목록을 불러오지 못했습니다.');
        if (!active) return;
        const nextLists = result.lists ?? [];
        setLists(nextLists);
        const requestedId = Number(new URLSearchParams(window.location.search).get('list'));
        const requestedList = nextLists.find((list) => list.id === requestedId);
        if (requestedList) void selectList(requestedList);
      })
      .catch((error) => { if (active) toast.add({ title: '단어 목록을 불러오지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('generated') !== '1') return;
    const added = Number(params.get('added') ?? '0');
    if (params.get('partial') === '1') {
      toast.add({ title: `${added}개 단어를 저장했어요.`, description: '중복 항목이 많아 요청한 수를 모두 채우지는 못했어요.', type: 'warning' });
    } else {
      toast.add({ title: `${added}개 AI 단어를 저장했어요.`, description: '새 개인 단어 목록을 열었습니다.', type: 'success' });
    }
    params.delete('generated');
    params.delete('added');
    params.delete('partial');
    const query = params.toString();
    window.history.replaceState(null, '', `/voca/list${query ? `?${query}` : ''}`);
  }, []);

  if (selected) {
    return (
      <section className="mt-7" aria-labelledby="word-list-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><button type="button" onClick={() => { setSelected(null); setWords([]); window.history.replaceState(null, '', '/voca/list'); }} aria-label="단어 목록으로 돌아가기" className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#ded7ca] bg-[#fffdf8] text-[#52605b] transition-transform hover:bg-[#f4f0e8] active:scale-95"><ArrowLeft className="size-4" aria-hidden="true" /></button><div><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">{selected.scope === 'common' ? 'COMMON VOCABULARY' : 'MY VOCABULARY'}</p><h2 id="word-list-title" className="mt-1 font-serif text-2xl sm:text-3xl">{selected.title}</h2></div></div>
          <span className="rounded-full bg-[#e8f0eb] px-3 py-1.5 text-xs font-semibold text-[#38634f]">{selected.wordCount}개 · {selected.scope === 'common' ? '공통' : '개인'}</span>
        </div>
        {detailLoading ? <p className="rounded-3xl border border-[#ded7ca] bg-[#fffdf8] px-5 py-12 text-center text-sm text-[#77807a]">단어를 불러오는 중입니다.</p> : <div className="overflow-hidden rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] shadow-[0_18px_48px_rgba(35,44,43,0.05)]">{words.map((item, index) => <article key={item.id} className="grid grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-center gap-3 border-b border-[#e7e0d5] px-5 py-5 last:border-b-0 sm:gap-8 sm:px-7"><div className="flex min-w-0 items-baseline gap-2 sm:gap-3"><span className="w-4 shrink-0 text-xs font-semibold text-[#a3aaa5] sm:w-5">{index + 1}</span><FittedWord word={item.word} /></div><div className="border-l border-[#e9e1d6] pl-3 text-sm leading-6 text-[#59645e] sm:pl-7 sm:text-base sm:leading-7">{item.meanings.map((meaning, meaningIndex) => <p key={`${meaning.partOfSpeech}-${meaning.text}`} className="flex gap-2"><span className="w-9 shrink-0 font-semibold text-[#d76a47]">{meaningIndex === 0 || item.meanings[meaningIndex - 1].partOfSpeech !== meaning.partOfSpeech ? partOfSpeechLabel(meaning.partOfSpeech) : ''}</span><span>{meaning.text}</span></p>)}</div></article>)}</div>}
      </section>
    );
  }

  return (
    <section className="mt-7 max-w-3xl" aria-labelledby="saved-list-title">
      <div className="mb-4 flex items-center gap-2"><ListChecks className="size-4 text-[#d76a47]" aria-hidden="true" /><h2 id="saved-list-title" className="font-serif text-2xl">저장된 단어 리스트</h2></div>
      {loading ? <p className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] px-5 py-10 text-center text-sm text-[#77807a]">목록을 불러오는 중입니다.</p> : lists.length ? <div className="space-y-3">{lists.map((list) => <button key={list.id} type="button" onClick={() => void selectList(list)} className="flex w-full items-center gap-4 rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-4 text-left shadow-[0_8px_20px_rgba(35,44,43,0.035)] transition-colors hover:border-[#e6b7a5] hover:bg-[#fff8f4]"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0eb] text-[#38634f]"><BookOpenCheck className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate font-semibold">{list.title}</span><span className="shrink-0 text-xs text-[#8a918b]">{list.scope === 'common' ? '공통' : '개인'}</span></span><span className="mt-1 block text-sm text-[#6e7772]">{list.wordCount}개</span></span><ChevronRight className="size-4 shrink-0 text-[#929993]" aria-hidden="true" /></button>)}</div> : <div className="rounded-3xl border border-dashed border-[#d8d0c3] bg-[#fbf9f4] px-6 py-12 text-center"><BookOpenCheck className="mx-auto size-6 text-[#9ba39d]" aria-hidden="true" /><p className="mt-4 font-semibold text-[#52605b]">아직 불러온 단어 목록이 없습니다.</p><p className="mt-2 text-sm leading-6 text-[#7a827d]">VOCA 상단의 + 버튼에서 공통 목록을 추가하거나, 개인 단어 목록을 만들어 보세요.</p></div>}
    </section>
  );
}
