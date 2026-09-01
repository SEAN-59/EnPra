'use client';

import { BookOpenCheck, ClipboardPaste, FilePenLine, FolderOpen, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/toast';

type VocabularyList = {
  id: number;
  title: string;
  scope: 'common' | 'personal';
  listType: 'daily' | 'custom' | 'ai_generated';
  learningDate: string | null;
  wordCount: number;
};

type ListsResponse = { lists?: VocabularyList[]; error?: string };

async function readResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try { return JSON.parse(text) as T; } catch { throw new Error(text || '요청을 처리하지 못했습니다.'); }
}

export function VocaAddMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedLists, setSavedLists] = useState<VocabularyList[]>([]);
  const [catalogLists, setCatalogLists] = useState<VocabularyList[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!libraryOpen) return;
    let active = true;
    setLoading(true);
    Promise.all([fetch('/api/vocabulary', { cache: 'no-store' }), fetch('/api/vocabulary?mode=catalog', { cache: 'no-store' })])
      .then(async ([savedResponse, catalogResponse]) => {
        const saved = await readResponse<ListsResponse>(savedResponse);
        const catalog = await readResponse<ListsResponse>(catalogResponse);
        if (!savedResponse.ok) throw new Error(saved.error ?? '저장된 목록을 불러오지 못했습니다.');
        if (!catalogResponse.ok) throw new Error(catalog.error ?? '공통 목록을 불러오지 못했습니다.');
        if (!active) return;
        setSavedLists(saved.lists ?? []);
        setCatalogLists(catalog.lists ?? []);
      })
      .catch((error) => { if (active) toast.add({ title: '단어 목록을 불러오지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [libraryOpen]);

  async function addCommonList(list: VocabularyList) {
    try {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id }),
      });
      const result = await readResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result.error ?? '공통 목록을 추가하지 못했습니다.');
      setCatalogLists((current) => current.filter((item) => item.id !== list.id));
      setSavedLists((current) => [{ ...list, scope: 'common' }, ...current]);
      toast.add({ title: '단어 목록을 추가했어요.', description: `‘${list.title}’을 모든 기기에서 볼 수 있어요.`, type: 'success' });
    } catch (error) {
      toast.add({ title: '공통 목록을 추가하지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
    }
  }

  function openList(list: VocabularyList) {
    window.location.href = `/voca/list?list=${list.id}`;
  }

  return (
    <div className="relative">
      <button type="button" aria-label="단어 목록 추가 메뉴 열기" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#1d2935] text-[#fffdf8] shadow-sm transition-transform duration-150 hover:bg-[#344451] active:scale-95 sm:size-11 sm:rounded-xl"><Plus className="size-4 sm:size-5" aria-hidden="true" /></button>
      {menuOpen && <><button type="button" aria-label="단어 목록 추가 메뉴 닫기" className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} /><div className="absolute right-0 top-[calc(100%+0.55rem)] z-40 w-56 overflow-hidden rounded-2xl border border-[#dcd6ca] bg-[#fffdf8] p-1.5 shadow-[0_18px_42px_rgba(29,41,53,0.16)]"><button type="button" onClick={() => { setMenuOpen(false); setLibraryOpen(true); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#35423e] transition-colors hover:bg-[#edf4ef]"><FolderOpen className="size-4 text-[#3f7a58]" aria-hidden="true" />저장된 단어 불러오기</button><button type="button" onClick={() => { window.location.href = '/voca/list?mode=add'; }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#35423e] transition-colors hover:bg-[#edf4ef]"><FilePenLine className="size-4 text-[#3f7a58]" aria-hidden="true" />단어 추가하기</button><button type="button" onClick={() => { setMenuOpen(false); toast.add({ title: '데이터 불러오기는 다음에 합니다.', description: 'Google 스프레드시트 연동으로 준비할 예정이에요.', type: 'info', timeout: 2_000 }); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#35423e] transition-colors hover:bg-[#f1eee7]"><ClipboardPaste className="size-4 text-[#7a7062]" aria-hidden="true" />데이터 불러오기</button></div></>}

      {libraryOpen && <><button type="button" aria-label="저장된 단어 불러오기 닫기" className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]" onClick={() => setLibraryOpen(false)} /><section role="dialog" aria-modal="true" aria-label="저장된 단어 불러오기" className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-lg -translate-y-1/2 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(29,41,53,0.2)] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">VOCABULARY LIBRARY</p><h2 className="mt-1 font-serif text-2xl">저장된 단어 불러오기</h2><p className="mt-2 text-sm leading-6 text-[#707873]">내 개인 목록은 바로 열고, 공통 목록은 추가한 뒤 모든 기기에서 이어서 볼 수 있어요.</p></div><button type="button" aria-label="닫기" onClick={() => setLibraryOpen(false)} className="grid size-9 shrink-0 place-items-center rounded-lg text-[#68736e] hover:bg-[#f1ede5]"><X className="size-5" aria-hidden="true" /></button></div>
        {loading ? <p className="py-12 text-center text-sm text-[#77807a]">목록을 불러오는 중입니다.</p> : <div className="mt-6 space-y-5"><div><p className="mb-2 text-xs font-bold tracking-[0.12em] text-[#8a918b]">내가 추가한 목록</p>{savedLists.length ? <div className="space-y-2">{savedLists.map((list) => <button key={list.id} type="button" onClick={() => openList(list)} className="flex w-full items-center gap-3 rounded-2xl border border-[#ded7ca] px-4 py-3 text-left hover:border-[#a8c9b2] hover:bg-[#f6fbf7]"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0eb] text-[#38634f]"><BookOpenCheck className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{list.title}</span><span className="mt-0.5 block text-xs text-[#77807a]">{list.wordCount}개 · {list.scope === 'common' ? '공통' : '개인'}</span></span></button>)}</div> : <p className="rounded-2xl bg-[#f5f2eb] px-4 py-3 text-sm text-[#78807a]">아직 추가한 단어 목록이 없습니다.</p>}</div><div><p className="mb-2 text-xs font-bold tracking-[0.12em] text-[#8a918b]">공통 단어 목록</p>{catalogLists.length ? <div className="space-y-2">{catalogLists.map((list) => <div key={list.id} className="flex items-center gap-3 rounded-2xl border border-[#ded7ca] px-4 py-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f8eadf] text-[#c86442]"><FolderOpen className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{list.title}</span><span className="mt-0.5 block text-xs text-[#77807a]">{list.wordCount}개 · 공통</span></span><button type="button" onClick={() => addCommonList(list)} className="rounded-lg bg-[#1d2935] px-3 py-2 text-xs font-semibold text-white transition-transform hover:bg-[#344451] active:scale-95">추가</button></div>)}</div> : <p className="rounded-2xl bg-[#f5f2eb] px-4 py-3 text-sm text-[#78807a]">추가할 공통 목록이 없습니다.</p>}</div></div>}
      </section></>}
    </div>
  );
}
