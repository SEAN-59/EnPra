'use client';

import { ChevronDown, FilePenLine, Plus, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

type VocabularyList = {
  id: number;
  title: string;
  scope: 'common' | 'personal';
  listType: 'daily' | 'custom' | 'ai_generated';
  wordCount: number;
};

type Sense = { partOfSpeech: 'n' | 'v' | 'a' | 'ad' | 'prep' | 'phrase' | 'conj'; text: string };
type DraftWord = { id: string; word: string; pronunciationIpa: string; senses: Sense[] };

const partOfSpeechOptions: Array<{ value: Sense['partOfSpeech']; label: string }> = [
  { value: 'n', label: 'n.' }, { value: 'v', label: 'v.' }, { value: 'a', label: 'a.' }, { value: 'ad', label: 'ad.' },
  { value: 'prep', label: 'prep.' }, { value: 'phrase', label: 'phr.' }, { value: 'conj', label: 'conj.' },
];

function blankSense(): Sense { return { partOfSpeech: 'n', text: '' }; }
function blankWord(): DraftWord { return { id: `${Date.now()}-${Math.random()}`, word: '', pronunciationIpa: '', senses: [blankSense()] }; }

async function readResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try { return JSON.parse(text) as T; } catch { throw new Error(text || '요청을 처리하지 못했습니다.'); }
}

export function VocaManualEntry() {
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [selection, setSelection] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [words, setWords] = useState<DraftWord[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/vocabulary', { cache: 'no-store' })
      .then(async (response) => {
        const result = await readResponse<{ lists?: VocabularyList[]; error?: string }>(response);
        if (!response.ok) throw new Error(result.error ?? '개인 목록을 불러오지 못했습니다.');
        if (active) setLists((result.lists ?? []).filter((list) => list.scope === 'personal'));
      })
      .catch((error) => { if (active) toast.add({ title: '개인 목록을 불러오지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' }); })
      .finally(() => { if (active) setLoadingLists(false); });
    return () => { active = false; };
  }, []);

  const isNewList = selection === 'new';
  const selectedList = lists.find((list) => String(list.id) === selection);
  const canAddWords = Boolean(selectedList || (isNewList && newListTitle.trim()));
  const canSave = canAddWords && words.length > 0 && !saving;

  function updateWord(id: string, changes: Partial<DraftWord>) {
    setWords((current) => current.map((word) => word.id === id ? { ...word, ...changes } : word));
  }

  function updateSense(wordId: string, senseIndex: number, changes: Partial<Sense>) {
    setWords((current) => current.map((word) => word.id !== wordId ? word : {
      ...word,
      senses: word.senses.map((sense, index) => index === senseIndex ? { ...sense, ...changes } : sense),
    }));
  }

  function addSense(wordId: string) {
    setWords((current) => current.map((word) => word.id === wordId ? { ...word, senses: [...word.senses, blankSense()] } : word));
  }

  function removeSense(wordId: string, senseIndex: number) {
    setWords((current) => current.map((word) => word.id === wordId ? { ...word, senses: word.senses.filter((_, index) => index !== senseIndex) } : word));
  }

  async function saveWords() {
    const normalizedWords = words.map((word) => ({
      word: word.word.trim(),
      pronunciationIpa: word.pronunciationIpa.trim(),
      senses: word.senses.map((sense) => ({ ...sense, text: sense.text.trim() })).filter((sense) => sense.text),
    }));
    if (!canAddWords || normalizedWords.some((word) => !word.word || !word.pronunciationIpa || !word.senses.length)) {
      toast.add({ title: '모든 카드에 영단어, 발음, 뜻을 입력해 주세요.', type: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual-batch',
          ...(selectedList ? { listId: selectedList.id } : { listTitle: newListTitle.trim() }),
          words: normalizedWords,
        }),
      });
      const result = await readResponse<{ listId?: number; addedCount?: number; error?: string }>(response);
      if (!response.ok || !result.listId) throw new Error(result.error ?? '단어를 저장하지 못했습니다.');
      toast.add({ title: `${result.addedCount ?? 0}개 단어를 저장했어요.`, description: '저장한 목록으로 이동합니다.', type: 'success' });
      window.setTimeout(() => { window.location.href = `/voca/list?list=${result.listId}`; }, 450);
    } catch (error) {
      toast.add({ title: '단어를 저장하지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
      setSaving(false);
    }
  }

  return (
    <section className="mt-7 max-w-4xl" aria-labelledby="manual-vocabulary-title">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dcd6ca] pb-5">
        <div className="flex min-w-0 items-start gap-3"><a href="/voca/list" aria-label="저장된 단어 리스트로 돌아가기" className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#ded7ca] bg-[#fffdf8] text-[#52605b] transition-transform hover:bg-[#f4f0e8] active:scale-95">←</a><div><p className="text-xs font-bold tracking-[0.14em] text-[#3f7a58]">PERSONAL VOCABULARY</p><h2 id="manual-vocabulary-title" className="mt-1 font-serif text-2xl sm:text-3xl">단어 추가하기</h2><p className="mt-2 text-sm leading-6 text-[#707873]">개인 목록을 선택한 다음, 원하는 만큼 단어 카드를 만들어 한 번에 저장하세요.</p></div></div>
        <button type="button" onClick={() => void saveWords()} disabled={!canSave} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-semibold text-[#fffdf8] transition-transform hover:bg-[#344451] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Save className="size-4" aria-hidden="true" />{saving ? '저장 중…' : '저장'}</button>
      </div>

      <section className="mt-6 rounded-3xl border border-[#ded7ca] bg-[#fffdf8] p-5 shadow-[0_12px_32px_rgba(35,44,43,0.04)] sm:p-6" aria-labelledby="target-list-title">
        <div><p className="text-xs font-bold tracking-[0.12em] text-[#8a918b]">TARGET LIST</p><h3 id="target-list-title" className="mt-1 font-serif text-xl">저장할 목록</h3></div>
        <div className="mt-4 max-w-md">
          <label className="sr-only" htmlFor="manual-list-selector">저장할 개인 목록 선택</label>
          <div className="relative"><select id="manual-list-selector" value={selection} disabled={loadingLists} onChange={(event) => setSelection(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[#d8d0c3] bg-[#fffefa] px-4 pr-10 text-sm font-semibold text-[#35423e] outline-none transition-colors focus:border-[#3f7a58] disabled:opacity-60"><option value="" disabled>{loadingLists ? '개인 목록을 불러오는 중…' : '저장할 목록을 선택하세요'}</option><option value="new">사용자 추가</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.title} · {list.wordCount}개</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#68736e]" aria-hidden="true" /></div>
          {isNewList && <label className="mt-3 block text-sm font-semibold text-[#52605b]">새 목록 이름<Input autoFocus value={newListTitle} onChange={(event) => setNewListTitle(event.target.value)} maxLength={120} placeholder="예: 여행에서 만난 단어" className="mt-2 h-11 border-[#d8d0c3] bg-[#fffefa]" /></label>}
          {selectedList && <p className="mt-3 text-sm text-[#3f7a58]">‘{selectedList.title}’ 개인 목록에 저장합니다.</p>}
        </div>
      </section>

      {canAddWords && <section className="mt-6" aria-labelledby="word-cards-title"><div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.12em] text-[#8a918b]">WORD CARDS</p><h3 id="word-cards-title" className="mt-1 font-serif text-2xl">단어</h3></div>{words.length > 0 && <span className="rounded-full bg-[#e8f0eb] px-3 py-1.5 text-xs font-semibold text-[#38634f]">{words.length}개 작성 중</span>}</div><div className="space-y-4">{words.map((word, wordIndex) => <article key={word.id} className="relative rounded-3xl border border-[#ded7ca] bg-[#fffdf8] p-5 shadow-[0_12px_32px_rgba(35,44,43,0.04)] sm:p-6"><button type="button" aria-label={`${wordIndex + 1}번째 단어 카드 삭제`} onClick={() => setWords((current) => current.filter((item) => item.id !== word.id))} className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-[#8c5b4b] transition-colors hover:bg-[#f9e8e1]"><X className="size-4" aria-hidden="true" /></button><p className="text-xs font-bold tracking-[0.12em] text-[#8a918b]">WORD {String(wordIndex + 1).padStart(2, '0')}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-[#52605b]">영단어<Input value={word.word} onChange={(event) => updateWord(word.id, { word: event.target.value })} placeholder="example" className="mt-2 h-11 border-[#d8d0c3] bg-[#fffefa]" /></label><label className="mr-9 block text-sm font-semibold text-[#52605b] sm:mr-0">발음<Input value={word.pronunciationIpa} onChange={(event) => updateWord(word.id, { pronunciationIpa: event.target.value })} placeholder="[ɪɡˈzæmpəl]" className="mt-2 h-11 border-[#d8d0c3] bg-[#fffefa]" /></label></div><div className="mt-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#52605b]">뜻</p><button type="button" onClick={() => addSense(word.id)} className="text-xs font-semibold text-[#3f7a58] hover:text-[#28533d]">+ 뜻 추가</button></div><div className="mt-2 space-y-2">{word.senses.map((sense, senseIndex) => <div key={senseIndex} className="flex gap-2"><select aria-label={`${wordIndex + 1}번째 단어 ${senseIndex + 1}번째 뜻 품사`} value={sense.partOfSpeech} onChange={(event) => updateSense(word.id, senseIndex, { partOfSpeech: event.target.value as Sense['partOfSpeech'] })} className="h-11 w-20 shrink-0 rounded-lg border border-[#d8d0c3] bg-[#fffefa] px-2 text-sm text-[#52605b] outline-none focus:border-[#3f7a58]">{partOfSpeechOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Input value={sense.text} onChange={(event) => updateSense(word.id, senseIndex, { text: event.target.value })} placeholder="한국어 뜻" className="h-11 border-[#d8d0c3] bg-[#fffefa]" />{word.senses.length > 1 && <button type="button" aria-label={`${senseIndex + 1}번째 뜻 삭제`} onClick={() => removeSense(word.id, senseIndex)} className="grid size-11 shrink-0 place-items-center rounded-lg text-[#8c5b4b] hover:bg-[#f9e8e1]"><X className="size-4" aria-hidden="true" /></button>}</div>)}</div></div></article>)}<button type="button" onClick={() => setWords((current) => [...current, blankWord()])} className="flex min-h-28 w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-[#a8c9b2] bg-[#f6fbf7] text-sm font-semibold text-[#38634f] transition-colors hover:bg-[#eaf5ed]"><Plus className="size-4" aria-hidden="true" />단어 추가</button></div></section>}
    </section>
  );
}
