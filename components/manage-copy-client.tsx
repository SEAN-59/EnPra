'use client';

import { ArchiveRestore, ChevronDown, FilePlus2, History, LoaderCircle, Save, Send, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { toast } from '@/components/ui/toast';

type CopyEntry = {
  id: number;
  copyKey: string;
  scope: string;
  locale: string;
  description: string | null;
  textFormat: 'plain' | 'multiline';
  draftText: string;
  templateVariables: string[];
  maxLength: number | null;
  draftRevision: number;
  isActive: boolean;
  draftUpdatedAt: string;
  createdAt: string;
};

type Publication = {
  id: number;
  version: number;
  status: 'building' | 'ready' | 'published' | 'failed';
  contentHash: string | null;
  staticJsonPath: string | null;
  copyCount: number;
  publishedAt: string | null;
  createdAt: string;
  restoredFromPublicationId: number | null;
  note: string | null;
  failureReason: string | null;
};

type CopyResponse = { entries: CopyEntry[]; publications: Publication[]; error?: string };

const blankEntry = {
  copyKey: '',
  scope: 'speaking.board',
  locale: 'ko',
  description: '',
  textFormat: 'plain' as const,
  draftText: '',
  templateVariables: '',
  maxLength: '',
};

function getError(body: unknown, fallback: string) {
  return body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : fallback;
}

function formatDate(value: string | null) {
  if (!value) return '아직 없음';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function variablesToText(value: string[]) {
  return value.join(', ');
}

function textToVariables(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function publicationStatusLabel(status: Publication['status']) {
  if (status === 'published') return '사이트 반영 완료';
  if (status === 'ready') return '발행본 생성됨';
  if (status === 'failed') return '생성 실패';
  return '생성 중';
}

export function ManageCopyClient() {
  const [entries, setEntries] = useState<CopyEntry[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [creatingEntry, setCreatingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState(blankEntry);
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeCount = entries.filter((entry) => entry.isActive).length;
  const latestPublication = publications[0] ?? null;
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, CopyEntry[]>();
    entries.forEach((entry) => groups.set(entry.scope, [...(groups.get(entry.scope) ?? []), entry]));
    return [...groups.entries()];
  }, [entries]);

  const load = async (showError = true) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/copy', { cache: 'no-store' });
      const body = await response.json() as CopyResponse;
      if (!response.ok) throw new Error(getError(body, '문구 관리 정보를 불러오지 못했습니다.'));
      setEntries(body.entries);
      setPublications(body.publications);
    } catch (error) {
      if (showError) toast.add({ title: '문구 관리 정보를 불러오지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateLocalEntry = (id: number, patch: Partial<CopyEntry>) => {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
  };

  const saveEntry = async (entry: CopyEntry) => {
    setSavingId(entry.id);
    try {
      const response = await fetch('/api/admin/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-entry',
          entryId: entry.id,
          draftRevision: entry.draftRevision,
          scope: entry.scope,
          locale: entry.locale,
          description: entry.description ?? '',
          textFormat: entry.textFormat,
          draftText: entry.draftText,
          templateVariables: entry.templateVariables,
          maxLength: entry.maxLength,
          isActive: entry.isActive,
        }),
      });
      const body = await response.json() as { entry?: CopyEntry; error?: string };
      if (!response.ok || !body.entry) throw new Error(getError(body, '문구를 저장하지 못했습니다.'));
      updateLocalEntry(entry.id, body.entry);
      toast.add({ title: '초안을 저장했어요.', description: '아직 일반 사용자 화면에는 반영되지 않습니다.', type: 'success' });
    } catch (error) {
      toast.add({ title: '초안을 저장하지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
      if (error instanceof Error && error.message.includes('새로고침')) void load(false);
    } finally {
      setSavingId(null);
    }
  };

  const createEntry = async () => {
    setCreatingEntry(true);
    try {
      const response = await fetch('/api/admin/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-entry',
          ...newEntry,
          templateVariables: textToVariables(newEntry.templateVariables),
          maxLength: newEntry.maxLength === '' ? null : Number(newEntry.maxLength),
        }),
      });
      const body = await response.json() as { entry?: CopyEntry; error?: string };
      if (!response.ok || !body.entry) throw new Error(getError(body, '새 문구를 등록하지 못했습니다.'));
      setEntries((current) => [...current, body.entry!].sort((a, b) => a.scope.localeCompare(b.scope) || a.copyKey.localeCompare(b.copyKey)));
      setNewEntry(blankEntry);
      setNewEntryOpen(false);
      toast.add({ title: '새 문구 초안을 등록했어요.', description: '발행본을 만들기 전까지는 서비스 화면에 영향을 주지 않습니다.', type: 'success' });
    } catch (error) {
      toast.add({ title: '새 문구를 등록하지 못했어요.', description: error instanceof Error ? error.message : '변수명과 문구 내용을 확인해 주세요.', type: 'error', priority: 'high' });
    } finally {
      setCreatingEntry(false);
    }
  };

  const createPublication = async (publicationId?: number) => {
    setPublishing(true);
    try {
      const note = window.prompt(publicationId ? '되돌린 이유를 기록할까요? (선택)' : '이번 발행본에 남길 메모가 있나요? (선택)') ?? '';
      const response = await fetch('/api/admin/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publicationId ? { action: 'restore-publication', publicationId, note } : { action: 'create-publication', note }),
      });
      const body = await response.json() as { publication?: Publication; error?: string };
      if (!response.ok || !body.publication) throw new Error(getError(body, '발행본을 만들지 못했습니다.'));
      setPublications((current) => [body.publication!, ...current]);
      toast.add({ title: `발행본 v${body.publication.version}을 만들었어요.`, description: '정적 JSON 발행본이 준비되었습니다. 사이트 자동 반영 연결은 배포 설정 후 활성화됩니다.', type: 'success', priority: 'high' });
    } catch (error) {
      toast.add({ title: '발행본을 만들지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <section className="mt-8 grid min-h-64 place-items-center rounded-3xl border border-[#dcd6ca] bg-[#fffdf8]"><span className="inline-flex items-center gap-2 text-sm text-[#6d756f]"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />문구 관리 정보를 불러오는 중이에요.</span></section>;
  }

  return (
    <section className="mt-8 space-y-6">
      <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">STATIC COPY</p>
            <h2 className="mt-2 font-serif text-2xl text-[#26353b] sm:text-3xl">서비스 문구 관리</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69736e]">초안을 저장한 뒤 발행본으로 고정합니다. 발행본은 이력으로 남아 언제든 새 버전으로 되돌릴 수 있어요.</p>
          </div>
          <button type="button" onClick={() => void createPublication()} disabled={publishing || activeCount === 0} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-5 text-sm font-semibold text-[#fffdf8] transition-colors hover:bg-[#344451] disabled:cursor-not-allowed disabled:opacity-45"><Send className="size-4" aria-hidden="true" />{publishing ? '발행본 생성 중' : '발행본 만들기'}</button>
        </div>
        <div className="mt-5 grid gap-3 border-t border-[#ece7dd] pt-5 text-sm sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f5f2ea] px-4 py-3"><span className="block text-xs font-semibold text-[#7a827c]">활성 문구</span><strong className="mt-1 block font-serif text-2xl text-[#2a393d]">{activeCount}</strong></div>
          <div className="rounded-2xl bg-[#f5f2ea] px-4 py-3"><span className="block text-xs font-semibold text-[#7a827c]">최근 발행본</span><strong className="mt-1 block font-serif text-2xl text-[#2a393d]">{latestPublication ? `v${latestPublication.version}` : '—'}</strong></div>
          <div className="rounded-2xl bg-[#fff8f1] px-4 py-3"><span className="block text-xs font-semibold text-[#a26f57]">정적 사이트 연결</span><strong className="mt-1 block text-sm font-semibold text-[#714f3e]">{latestPublication?.status === 'published' ? '반영 완료' : '발행본 생성 단계'}</strong></div>
        </div>
        <p className="mt-4 rounded-xl border border-[#eadfce] bg-[#fffaf3] px-3 py-2 text-xs leading-5 text-[#756c60]">현재는 발행본 JSON과 이력을 안전하게 생성합니다. 이 JSON을 사이트 배포물로 교체하는 자동 연결은 별도 배포 권한을 연결한 뒤 활성화됩니다.</p>
      </section>

      <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">DRAFTS</p><h2 className="mt-1 font-serif text-2xl text-[#26353b]">문구 초안</h2></div><button type="button" onClick={() => setNewEntryOpen((current) => !current)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9d2c6] px-4 text-sm font-semibold text-[#43514e] transition-colors hover:bg-[#f3f0e9]"><FilePlus2 className="size-4" aria-hidden="true" />새 문구</button></div>
        {newEntryOpen && <section className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf4] p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-2"><Field label="변수명" value={newEntry.copyKey} placeholder="speaking.board.title" onChange={(copyKey) => setNewEntry((current) => ({ ...current, copyKey }))} /><Field label="소속" value={newEntry.scope} placeholder="speaking.board" onChange={(scope) => setNewEntry((current) => ({ ...current, scope }))} /><Field label="언어" value={newEntry.locale} placeholder="ko" onChange={(locale) => setNewEntry((current) => ({ ...current, locale }))} /><Field label="글자 수 제한" type="number" value={newEntry.maxLength} placeholder="선택" onChange={(maxLength) => setNewEntry((current) => ({ ...current, maxLength }))} /></div><Field className="mt-3" label="관리 메모" value={newEntry.description} placeholder="이 문구가 표시되는 위치와 목적" onChange={(description) => setNewEntry((current) => ({ ...current, description }))} /><Field className="mt-3" label="치환 변수 (쉼표로 구분)" value={newEntry.templateVariables} placeholder="display_name, count" onChange={(templateVariables) => setNewEntry((current) => ({ ...current, templateVariables }))} /><label className="mt-3 block text-xs font-semibold text-[#65706a]"><span>문구</span><textarea value={newEntry.draftText} onChange={(event) => setNewEntry((current) => ({ ...current, draftText: event.target.value }))} placeholder="사용자에게 보이는 문구를 입력하세요." className="mt-1.5 min-h-24 w-full rounded-xl border border-[#dcd6ca] bg-white px-3 py-2.5 text-sm leading-6 text-[#35423e] outline-none transition focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setNewEntryOpen(false); setNewEntry(blankEntry); }} className="h-10 rounded-xl px-4 text-sm font-semibold text-[#66706d] hover:bg-[#f0ece4]">취소</button><button type="button" disabled={creatingEntry} onClick={() => void createEntry()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-semibold text-white disabled:opacity-50"><Save className="size-4" aria-hidden="true" />{creatingEntry ? '등록 중' : '초안 등록'}</button></div></section>}
        {!entries.length ? <div className="mt-5 rounded-2xl border border-dashed border-[#d8d0c2] px-5 py-12 text-center"><SlidersHorizontal className="mx-auto size-5 text-[#9ba39d]" aria-hidden="true" /><p className="mt-3 font-medium text-[#43514e]">아직 등록된 문구가 없습니다.</p><p className="mt-1 text-sm text-[#77807a]">새 문구를 등록하면 초안과 발행 이력을 관리할 수 있어요.</p></div> : <div className="mt-5 space-y-5">{groupedEntries.map(([scope, scopedEntries]) => <section key={scope}><div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-[#edf2ef] px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-[#45665b]">{scope}</span><span className="text-xs text-[#818983]">{scopedEntries.length}개</span></div><div className="space-y-3">{scopedEntries.map((entry) => <CopyEntryEditor key={entry.id} entry={entry} saving={savingId === entry.id} onChange={(patch) => updateLocalEntry(entry.id, patch)} onSave={() => void saveEntry(entry)} />)}</div></section>)}</div>}
      </section>

      <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7">
        <button type="button" onClick={() => setHistoryOpen((current) => !current)} className="flex w-full items-center justify-between text-left"><span><span className="block text-xs font-bold tracking-[0.16em] text-[#d76a47]">RELEASE HISTORY</span><span className="mt-1 block font-serif text-2xl text-[#26353b]">발행본 이력</span></span><ChevronDown className={`size-5 text-[#6e7771] transition-transform ${historyOpen ? 'rotate-180' : ''}`} aria-hidden="true" /></button>
        {historyOpen && <div className="mt-5 space-y-3 border-t border-[#ece7dd] pt-5">{!publications.length ? <p className="text-sm text-[#77807a]">아직 만든 발행본이 없습니다.</p> : publications.map((publication) => <article key={publication.id} className="flex flex-col gap-3 rounded-2xl border border-[#e3ddd2] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="font-serif text-xl text-[#27363b]">v{publication.version}</strong><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${publication.status === 'ready' || publication.status === 'published' ? 'bg-[#e9f3ed] text-[#3f7158]' : publication.status === 'failed' ? 'bg-[#fae8e3] text-[#ad5540]' : 'bg-[#efede7] text-[#6f766f]'}`}>{publicationStatusLabel(publication.status)}</span></div><p className="mt-1 text-xs text-[#747c76]">{publication.copyCount}개 문구 · {formatDate(publication.publishedAt ?? publication.createdAt)}{publication.restoredFromPublicationId ? ` · v${publication.restoredFromPublicationId}에서 복원` : ''}</p>{publication.note && <p className="mt-1 truncate text-xs text-[#8a7163]">{publication.note}</p>}{publication.failureReason && <p className="mt-1 text-xs text-[#b05b43]">{publication.failureReason}</p>}</div><button type="button" onClick={() => void createPublication(publication.id)} disabled={publishing || publication.status === 'building'} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d9d2c6] px-3 text-xs font-semibold text-[#43514e] transition-colors hover:bg-[#f3f0e9] disabled:opacity-45"><ArchiveRestore className="size-3.5" aria-hidden="true" />이 버전으로 되돌리기</button></article>)}</div>}
      </section>
    </section>
  );
}

function Field({ label, value, placeholder, onChange, type = 'text', className = '' }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; type?: 'text' | 'number'; className?: string }) {
  return <label className={`block text-xs font-semibold text-[#65706a] ${className}`}><span>{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#dcd6ca] bg-white px-3 text-sm text-[#35423e] outline-none transition placeholder:text-[#a0a59f] focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label>;
}

function CopyEntryEditor({ entry, saving, onChange, onSave }: { entry: CopyEntry; saving: boolean; onChange: (patch: Partial<CopyEntry>) => void; onSave: () => void }) {
  const lengthWarning = entry.maxLength !== null && entry.draftText.length > entry.maxLength;
  return <article className={`rounded-2xl border p-4 transition-colors ${entry.isActive ? 'border-[#e1dbcf] bg-[#fffefb]' : 'border-[#e5ddd5] bg-[#f7f4ef] opacity-75'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-mono text-xs font-semibold text-[#48665c]">{entry.copyKey}</p><p className="mt-1 text-xs text-[#7a827c]">초안 v{entry.draftRevision} · {formatDate(entry.draftUpdatedAt)}</p></div><label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#6e7771]"><input type="checkbox" checked={entry.isActive} onChange={(event) => onChange({ isActive: event.target.checked })} className="size-4 accent-[#436b59]" />활성</label></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="소속" value={entry.scope} placeholder="speaking.board" onChange={(scope) => onChange({ scope })} /><Field label="언어" value={entry.locale} placeholder="ko" onChange={(locale) => onChange({ locale })} /><Field label="글자 수 제한" type="number" value={entry.maxLength === null ? '' : String(entry.maxLength)} placeholder="선택" onChange={(value) => onChange({ maxLength: value === '' ? null : Number(value) })} /><Field label="치환 변수" value={variablesToText(entry.templateVariables)} placeholder="display_name, count" onChange={(value) => onChange({ templateVariables: textToVariables(value) })} /></div><Field className="mt-3" label="관리 메모" value={entry.description ?? ''} placeholder="표시 위치와 목적" onChange={(description) => onChange({ description })} /><label className="mt-3 block text-xs font-semibold text-[#65706a]"><span>문구</span><textarea value={entry.draftText} onChange={(event) => onChange({ draftText: event.target.value })} className="mt-1.5 min-h-24 w-full rounded-xl border border-[#dcd6ca] bg-white px-3 py-2.5 text-sm leading-6 text-[#35423e] outline-none transition focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className={`text-xs ${lengthWarning ? 'font-semibold text-[#b35b43]' : 'text-[#87908a]'}`}>{entry.draftText.length}{entry.maxLength !== null ? ` / ${entry.maxLength}` : '자'}</span><button type="button" disabled={saving || lengthWarning} onClick={onSave} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#344451] disabled:cursor-not-allowed disabled:opacity-45"><Save className="size-3.5" aria-hidden="true" />{saving ? '저장 중' : '초안 저장'}</button></div></article>;
}
