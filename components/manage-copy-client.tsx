'use client';

import { ArchiveRestore, ChevronDown, FilePlus2, LayoutPanelTop, LoaderCircle, Pencil, Save, Send, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { useStaticCopy } from '@/components/static-copy-provider';

type Screen = { id: number; screenKey: string; displayName: string; routePath: string | null; sortOrder: number; isActive: boolean };
type Entry = { id: number; screenId: number; screenKey: string; screenLabel: string; variableName: string; locale: string; description: string | null; textFormat: 'plain' | 'multiline'; draftText: string; templateVariables: string[]; maxLength: number | null; draftRevision: number; isActive: boolean; draftUpdatedAt: string };
type Publication = { id: number; version: number; status: 'building' | 'ready' | 'published' | 'failed'; copyCount: number; publishedAt: string | null; createdAt: string; restoredFromPublicationId: number | null; note: string | null };
type Payload = { screens: Screen[]; entries: Entry[]; publications: Publication[]; draftStatus?: { unpublishedEntryIds: number[] }; error?: string };

const blankScreen = { screenKey: '', displayName: '', routePath: '', sortOrder: '0' };
const blankEntry = { screenId: '', variableName: '', locale: 'ko', description: '', draftText: '', templateVariables: '', maxLength: '' };
const inputClass = 'h-9 w-full rounded-lg border border-[#d8d1c5] bg-white px-2.5 text-sm text-[#344247] outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]';
const errorText = (body: unknown, fallback: string) => body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : fallback;
const dateText = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '아직 없음';
const vars = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export function ManageCopyClient() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [screenOpen, setScreenOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [screenEditing, setScreenEditing] = useState(false);
  const [entryEditing, setEntryEditing] = useState(false);
  const [savingScreens, setSavingScreens] = useState(false);
  const [savingEntries, setSavingEntries] = useState(false);
  const [screenDirty, setScreenDirty] = useState<Set<number>>(new Set());
  const [entryDirty, setEntryDirty] = useState<Set<number>>(new Set());
  const [unpublishedEntryIds, setUnpublishedEntryIds] = useState<Set<number>>(new Set());
  const [screenDraft, setScreenDraft] = useState(blankScreen);
  const [entryDraft, setEntryDraft] = useState(blankEntry);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draftScreenFilter, setDraftScreenFilter] = useState('all');
  const copyTitle = useStaticCopy('manage.copy', 'title', '서비스 문구 관리');
  const copyDescription = useStaticCopy('manage.copy', 'description', '문구는 소속 화면 아래에서 관리합니다.');
  const draftScreenFilterLabel = useStaticCopy('manage.copy', 'draft_screen_filter_label', '소속 화면');
  const draftScreenFilterAll = useStaticCopy('manage.copy', 'draft_screen_filter_all', '전체 화면');
  const draftScreenFilterCount = useStaticCopy('manage.copy', 'draft_screen_filter_count', '{count}개 문구 표시');
  const draftScreenFilterEmptyTitle = useStaticCopy('manage.copy', 'draft_screen_filter_empty_title', '이 화면에 등록된 문구가 없습니다.');
  const draftScreenFilterEmptyDescription = useStaticCopy('manage.copy', 'draft_screen_filter_empty_description', '다른 소속 화면을 선택하거나 새 문구를 등록하세요.');
  const activeCount = entries.filter((entry) => entry.isActive).length;
  const latest = publications[0];
  const unpublishedCount = unpublishedEntryIds.size;
  const orderedScreens = useMemo(() => [...screens].sort((a, b) => a.sortOrder - b.sortOrder || a.screenKey.localeCompare(b.screenKey)), [screens]);
  const filteredEntries = useMemo(
    () => draftScreenFilter === 'all' ? entries : entries.filter((entry) => entry.screenId === Number(draftScreenFilter)),
    [draftScreenFilter, entries],
  );

  async function load(showError = true) {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/copy', { cache: 'no-store' });
      const body = await response.json() as Payload;
      if (!response.ok) throw new Error(errorText(body, '문구 관리 정보를 불러오지 못했습니다.'));
      setScreens(body.screens); setEntries(body.entries); setPublications(body.publications); setUnpublishedEntryIds(new Set(body.draftStatus?.unpublishedEntryIds ?? []));
      setScreenDirty(new Set()); setEntryDirty(new Set());
    } catch (error) {
      if (showError) toast.add({ title: '문구 관리 정보를 불러오지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function patchScreen(id: number, patch: Partial<Screen>) {
    setScreens((current) => current.map((screen) => screen.id === id ? { ...screen, ...patch } : screen));
    setScreenDirty((current) => new Set(current).add(id));
  }
  function patchEntry(id: number, patch: Partial<Entry>) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
    setEntryDirty((current) => new Set(current).add(id));
  }

  async function createScreen() {
    try {
      const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-screen', ...screenDraft, sortOrder: Number(screenDraft.sortOrder) }) });
      const body = await response.json() as { screen?: Screen; error?: string };
      if (!response.ok || !body.screen) throw new Error(errorText(body, '소속 화면을 등록하지 못했습니다.'));
      setScreens((current) => [...current, body.screen!]);
      setEntryDraft((current) => ({ ...current, screenId: String(body.screen!.id) }));
      setScreenDraft(blankScreen); setScreenOpen(false);
      toast.add({ title: '소속 화면을 등록했어요.', description: '이 화면 안에서 title 같은 변수명을 사용할 수 있습니다.', type: 'success' });
    } catch (error) { toast.add({ title: '소속 화면을 등록하지 못했어요.', description: error instanceof Error ? error.message : '입력값을 확인해 주세요.', type: 'error', priority: 'high' }); }
  }

  async function createEntry() {
    try {
      const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-entry', ...entryDraft, screenId: Number(entryDraft.screenId), templateVariables: vars(entryDraft.templateVariables), maxLength: entryDraft.maxLength === '' ? null : Number(entryDraft.maxLength), textFormat: 'plain' }) });
      const body = await response.json() as { entry?: Entry; error?: string };
      if (!response.ok || !body.entry) throw new Error(errorText(body, '새 문구를 등록하지 못했습니다.'));
      setEntries((current) => [...current, body.entry!]); setUnpublishedEntryIds((current) => new Set(current).add(body.entry!.id)); setEntryDraft(blankEntry); setEntryOpen(false);
      toast.add({ title: '새 문구 초안을 등록했어요.', description: '발행본을 만들기 전까지 서비스 화면에는 반영되지 않습니다.', type: 'success' });
    } catch (error) { toast.add({ title: '새 문구를 등록하지 못했어요.', description: error instanceof Error ? error.message : '입력값을 확인해 주세요.', type: 'error', priority: 'high' }); }
  }

  async function saveScreens() {
    const targets = screens.filter((screen) => screenDirty.has(screen.id));
    if (!targets.length) { setScreenEditing(false); return; }
    setSavingScreens(true);
    try {
      const saved = await Promise.all(targets.map(async (screen) => {
        const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-screen', screenId: screen.id, displayName: screen.displayName, routePath: screen.routePath ?? '', sortOrder: screen.sortOrder, isActive: screen.isActive }) });
        const body = await response.json() as { screen?: Screen; error?: string };
        if (!response.ok || !body.screen) throw new Error(errorText(body, '소속 화면을 저장하지 못했습니다.'));
        return body.screen;
      }));
      const byId = new Map(saved.map((screen) => [screen.id, screen]));
      setScreens((current) => current.map((screen) => byId.get(screen.id) ?? screen));
      setScreenDirty(new Set()); setScreenEditing(false);
      toast.add({ title: '소속 화면 변경사항을 저장했어요.', description: '발행본을 만들면 화면별 문구 구성에도 반영됩니다.', type: 'success' });
    } catch (error) { toast.add({ title: '소속 화면을 저장하지 못했어요.', description: error instanceof Error ? error.message : '입력값을 확인해 주세요.', type: 'error', priority: 'high' }); void load(false); }
    finally { setSavingScreens(false); }
  }

  async function saveEntries() {
    const targets = entries.filter((entry) => entryDirty.has(entry.id));
    if (!targets.length) { setEntryEditing(false); return; }
    setSavingEntries(true);
    try {
      const saved = await Promise.all(targets.map(async (entry) => {
        const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-entry', entryId: entry.id, draftRevision: entry.draftRevision, screenId: entry.screenId, variableName: entry.variableName, locale: entry.locale, description: entry.description ?? '', textFormat: entry.textFormat, draftText: entry.draftText, templateVariables: entry.templateVariables, maxLength: entry.maxLength, isActive: entry.isActive }) });
        const body = await response.json() as { entry?: Entry; error?: string };
        if (!response.ok || !body.entry) throw new Error(errorText(body, '문구를 저장하지 못했습니다.'));
        return body.entry;
      }));
      const byId = new Map(saved.map((entry) => [entry.id, entry]));
      setEntries((current) => current.map((entry) => byId.get(entry.id) ?? entry));
      setEntryDirty(new Set()); setUnpublishedEntryIds((current) => { const next = new Set(current); saved.forEach((entry) => next.add(entry.id)); return next; }); setEntryEditing(false);
      toast.add({ title: '문구 변경사항을 저장했어요.', description: '발행본을 만들면 서비스 화면에 반영됩니다.', type: 'success' });
    } catch (error) { toast.add({ title: '문구를 저장하지 못했어요.', description: error instanceof Error ? error.message : '입력값을 확인해 주세요.', type: 'error', priority: 'high' }); void load(false); }
    finally { setSavingEntries(false); }
  }

  async function publish(publicationId?: number) {
    setPublishing(true);
    try {
      const note = window.prompt(publicationId ? '되돌린 이유를 기록할까요? (선택)' : '이번 발행본에 남길 메모가 있나요? (선택)') ?? '';
      const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(publicationId ? { action: 'restore-publication', publicationId, note } : { action: 'create-publication', note }) });
      const body = await response.json() as { publication?: Publication; error?: string };
      if (!response.ok || !body.publication) throw new Error(errorText(body, '발행본을 만들지 못했습니다.'));
      setPublications((current) => [body.publication!, ...current]); setUnpublishedEntryIds(new Set());
      toast.add({ title: `발행본 v${body.publication.version}을 만들었어요.`, description: '새로고침한 사이트에는 최신 문구가 반영됩니다.', type: 'success', priority: 'high' });
    } catch (error) { toast.add({ title: '발행본을 만들지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' }); }
    finally { setPublishing(false); }
  }

  if (loading) return <section className="mt-8 grid min-h-64 place-items-center rounded-3xl border border-[#dcd6ca] bg-[#fffdf8]"><span className="inline-flex items-center gap-2 text-sm text-[#6d756f]"><LoaderCircle className="size-4 animate-spin" />문구 관리 정보를 불러오는 중이에요.</span></section>;
  return <section className="mt-8 space-y-6">
    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">STATIC COPY</p><h2 className="mt-2 font-serif text-2xl text-[#26353b] sm:text-3xl">{copyTitle}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69736e]">{copyDescription} 소속 화면 안에서만 변수명이 구분되므로, 여러 화면에 각각 <code className="rounded bg-[#f1eee7] px-1 py-0.5">title</code>을 둘 수 있어요.</p></div><button type="button" onClick={() => void publish()} disabled={publishing || !activeCount} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-5 text-sm font-semibold text-white disabled:opacity-45"><Send className="size-4" />{publishing ? '발행본 생성 중' : '발행본 만들기'}</button></div><div className="mt-5 grid gap-3 border-t border-[#ece7dd] pt-5 sm:grid-cols-3"><Metric label="소속 화면" value={String(screens.length)} /><Metric label="활성 문구" value={String(activeCount)} /><Metric label="최근 발행본" value={latest ? `v${latest.version}` : '—'} /></div></section>

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><SectionHead eyebrow="SCREENS" title="소속 화면" action={<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setScreenOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9d2c6] px-3.5 text-sm font-semibold text-[#43514e]"><LayoutPanelTop className="size-4" />화면 등록</button>{screenEditing ? <><button type="button" onClick={() => { void load(false); setScreenEditing(false); }} className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-semibold text-[#66706d]"><X className="size-4" />취소</button><button type="button" onClick={() => void saveScreens()} disabled={savingScreens} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-sm font-semibold text-white disabled:opacity-45"><Save className="size-4" />{savingScreens ? '저장 중' : '변경 저장'}</button></> : <button type="button" onClick={() => setScreenEditing(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-sm font-semibold text-white"><Pencil className="size-4" />수정</button>}</div>} />
      {screenOpen && <CreateScreen draft={screenDraft} onChange={setScreenDraft} onCancel={() => { setScreenOpen(false); setScreenDraft(blankScreen); }} onSubmit={() => void createScreen()} />}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#e3ddd2]"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-[#f5f2ea] text-xs font-bold tracking-[0.08em] text-[#66716d]"><tr><th className="px-4 py-3">화면 키</th><th className="px-4 py-3">화면 이름</th><th className="px-4 py-3">경로</th><th className="w-28 px-4 py-3">정렬</th><th className="w-24 px-4 py-3">상태</th></tr></thead><tbody>{orderedScreens.length ? orderedScreens.map((screen) => <tr key={screen.id} className="border-t border-[#eae4da] align-top"><td className="px-4 py-3"><code className="font-mono text-xs font-semibold text-[#45665b]">{screen.screenKey}</code>{screenEditing && <p className="mt-1 text-[11px] text-[#8b918b]">코드 연결 기준</p>}</td><td className="px-4 py-3">{screenEditing ? <input className={inputClass} value={screen.displayName} onChange={(event) => patchScreen(screen.id, { displayName: event.target.value })} /> : <span className="font-medium text-[#344247]">{screen.displayName}</span>}</td><td className="px-4 py-3">{screenEditing ? <input className={inputClass} value={screen.routePath ?? ''} placeholder="/writing/practice" onChange={(event) => patchScreen(screen.id, { routePath: event.target.value || null })} /> : <code className="text-xs text-[#60716c]">{screen.routePath ?? '—'}</code>}</td><td className="px-4 py-3">{screenEditing ? <input className={inputClass} type="number" value={screen.sortOrder} onChange={(event) => patchScreen(screen.id, { sortOrder: Number(event.target.value) || 0 })} /> : screen.sortOrder}</td><td className="px-4 py-3">{screenEditing ? <Toggle checked={screen.isActive} label="활성" onChange={(isActive) => patchScreen(screen.id, { isActive })} /> : <Status active={screen.isActive} />}</td></tr>) : <EmptyRow colSpan={5} text="아직 등록된 소속 화면이 없습니다." />}</tbody></table></div><p className="mt-3 text-xs text-[#7b847e]">화면 키는 코드와 연결되는 기준값이라 수정하지 않습니다. 화면 이름·경로·정렬·활성 상태는 표 안에서 바로 변경할 수 있어요.</p></section>

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><SectionHead eyebrow="DRAFTS" title="문구 초안" action={<div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={!screens.length} onClick={() => setEntryOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9d2c6] px-3.5 text-sm font-semibold text-[#43514e] disabled:opacity-45"><FilePlus2 className="size-4" />새 문구</button>{entryEditing ? <><button type="button" onClick={() => { void load(false); setEntryEditing(false); }} className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-semibold text-[#66706d]"><X className="size-4" />취소</button><button type="button" onClick={() => void saveEntries()} disabled={savingEntries} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-sm font-semibold text-white disabled:opacity-45"><Save className="size-4" />{savingEntries ? '저장 중' : '변경 저장'}</button></> : <button type="button" disabled={!entries.length} onClick={() => setEntryEditing(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-sm font-semibold text-white disabled:opacity-45"><Pencil className="size-4" />수정</button>}</div>} />
      {entryOpen && <CreateEntry draft={entryDraft} screens={orderedScreens} onChange={setEntryDraft} onCancel={() => { setEntryOpen(false); setEntryDraft(blankEntry); }} onSubmit={() => void createEntry()} />}
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e7dfd2] bg-[#faf7f0] p-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex min-w-0 items-center gap-3 text-sm font-semibold text-[#43514e]"><span className="shrink-0">{draftScreenFilterLabel}</span><select value={draftScreenFilter} onChange={(event) => setDraftScreenFilter(event.target.value)} className="h-10 min-w-0 rounded-xl border border-[#d8d1c5] bg-white px-3 text-sm font-medium text-[#344247] outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]"><option value="all">{draftScreenFilterAll}</option>{orderedScreens.map((screen) => <option key={screen.id} value={screen.id}>{screen.displayName}</option>)}</select></label><span className="text-xs text-[#78817b]">{draftScreenFilterCount.replace('{count}', String(filteredEntries.length))}</span></div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-[#e7dfd2] bg-[#faf7f0] px-3 py-2.5 text-xs"><span className="font-semibold text-[#66716d]">현재 상태</span>{entryDirty.size > 0 && <DraftBadge tone="warning">저장 전 변경 {entryDirty.size}건</DraftBadge>}{unpublishedCount > 0 && <DraftBadge tone="pending">수정됨 {unpublishedCount}건</DraftBadge>}{entryDirty.size === 0 && unpublishedCount === 0 && <DraftBadge tone="published">{latest ? `발행본 v${latest.version} 반영됨` : '발행할 문구가 없습니다'}</DraftBadge>}<span className="text-[#858c85]">저장 전 → 수정됨 → 반영 완료 순서로 관리돼요.</span></div>
      {!entries.length ? <div className="mt-5 rounded-2xl border border-dashed border-[#d8d0c2] px-5 py-12 text-center"><SlidersHorizontal className="mx-auto size-5 text-[#9ba39d]" /><p className="mt-3 font-medium text-[#43514e]">아직 등록된 문구가 없습니다.</p><p className="mt-1 text-sm text-[#77807a]">소속 화면을 선택하고 title 같은 변수명으로 문구를 등록하세요.</p></div> : filteredEntries.length ? <EntryTable entries={filteredEntries} screens={orderedScreens} editing={entryEditing} dirtyEntryIds={entryDirty} unpublishedEntryIds={unpublishedEntryIds} latestVersion={latest?.version ?? null} onChange={patchEntry} /> : <div className="mt-5 rounded-2xl border border-dashed border-[#d8d0c2] px-5 py-12 text-center"><SlidersHorizontal className="mx-auto size-5 text-[#9ba39d]" /><p className="mt-3 font-medium text-[#43514e]">{draftScreenFilterEmptyTitle}</p><p className="mt-1 text-sm text-[#77807a]">{draftScreenFilterEmptyDescription}</p></div>}</section>

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><div role="button" tabIndex={0} onClick={() => setHistoryOpen((v) => !v)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setHistoryOpen((v) => !v); } }} aria-expanded={historyOpen} className="flex w-full cursor-pointer items-center justify-between text-left"><span><span className="block text-xs font-bold tracking-[0.16em] text-[#d76a47]">RELEASE HISTORY</span><span className="mt-1 block font-serif text-2xl text-[#26353b]">발행본 이력</span></span><ChevronDown className={`size-5 text-[#566560] transition-transform ${historyOpen ? 'rotate-180' : ''}`} /></div>{historyOpen && <div className="mt-5 space-y-3 border-t border-[#ece7dd] pt-5">{!publications.length ? <p className="text-sm text-[#77807a]">아직 만든 발행본이 없습니다.</p> : publications.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-[#e3ddd2] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong className="font-serif text-xl">v{item.version}</strong><span className="rounded-full bg-[#e9f3ed] px-2 py-0.5 text-[11px] font-bold text-[#3f7158]">{item.status === 'published' ? '사이트 반영 완료' : item.status === 'ready' ? '발행본 생성됨' : item.status === 'failed' ? '생성 실패' : item.status}</span></div><p className="mt-1 text-xs text-[#747c76]">{item.copyCount}개 문구 · {dateText(item.publishedAt ?? item.createdAt)}{item.restoredFromPublicationId ? ` · v${item.restoredFromPublicationId}에서 복원` : ''}</p></div><button type="button" onClick={() => void publish(item.id)} disabled={publishing} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#d9d2c6] px-3 text-xs font-semibold text-[#43514e] disabled:opacity-45"><ArchiveRestore className="size-3.5" />이 버전으로 되돌리기</button></article>)}</div>}</section>
  </section>;
}

function SectionHead({ eyebrow, title, action }: { eyebrow: string; title: string; action: React.ReactNode }) { return <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">{eyebrow}</p><h2 className="mt-1 font-serif text-2xl text-[#26353b]">{title}</h2></div>{action}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#f5f2ea] px-4 py-3"><span className="block text-xs font-semibold text-[#7a827c]">{label}</span><strong className="mt-1 block font-serif text-2xl text-[#2a393d]">{value}</strong></div>; }
function Status({ active }: { active: boolean }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-[#e9f3ed] text-[#3f7158]' : 'bg-[#f1eee8] text-[#7d756a]'}`}>{active ? '활성' : '비활성'}</span>; }
function DraftBadge({ tone, children }: { tone: 'warning' | 'pending' | 'published'; children: React.ReactNode }) { const classes = tone === 'warning' ? 'bg-[#fff1dd] text-[#9d6425]' : tone === 'pending' ? 'bg-[#fae7df] text-[#a84f35]' : 'bg-[#e9f3ed] text-[#3f7158]'; return <span className={`inline-flex rounded-full px-2.5 py-1 font-semibold ${classes}`}>{children}</span>; }
function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) { return <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#5e6964]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#436b59]" />{label}</label>; }
function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) { return <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-[#77807a]">{text}</td></tr>; }
function Field({ label, value, placeholder, onChange, type = 'text', className = '' }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; type?: 'text' | 'number'; className?: string }) { return <label className={`block text-xs font-semibold text-[#65706a] ${className}`}><span>{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`mt-1.5 ${inputClass}`} /></label>; }
function ScreenSelect({ value, screens, onChange }: { value: string; screens: Screen[]; onChange: (value: string) => void }) { return <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">선택</option>{screens.filter((screen) => screen.isActive || String(screen.id) === value).map((screen) => <option key={screen.id} value={screen.id}>{screen.displayName} · {screen.screenKey}</option>)}</select>; }
function CreateScreen({ draft, onChange, onCancel, onSubmit }: { draft: typeof blankScreen; onChange: (value: typeof blankScreen) => void; onCancel: () => void; onSubmit: () => void }) { return <section className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf4] p-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="화면 키" value={draft.screenKey} placeholder="writing.practice" onChange={(screenKey) => onChange({ ...draft, screenKey })} /><Field label="화면 이름" value={draft.displayName} placeholder="라이팅 학습하기" onChange={(displayName) => onChange({ ...draft, displayName })} /><Field label="경로" value={draft.routePath} placeholder="/writing/practice" onChange={(routePath) => onChange({ ...draft, routePath })} /><Field label="정렬 순서" type="number" value={draft.sortOrder} placeholder="0" onChange={(sortOrder) => onChange({ ...draft, sortOrder })} /></div><Actions onCancel={onCancel} onSubmit={onSubmit} label="화면 등록" /></section>; }
function CreateEntry({ draft, screens, onChange, onCancel, onSubmit }: { draft: typeof blankEntry; screens: Screen[]; onChange: (value: typeof blankEntry) => void; onCancel: () => void; onSubmit: () => void }) { return <section className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf4] p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-[#65706a]"><span>소속 화면</span><div className="mt-1.5"><ScreenSelect value={draft.screenId} screens={screens} onChange={(screenId) => onChange({ ...draft, screenId })} /></div></label><Field label="변수명" value={draft.variableName} placeholder="title" onChange={(variableName) => onChange({ ...draft, variableName })} /><Field label="언어" value={draft.locale} placeholder="ko" onChange={(locale) => onChange({ ...draft, locale })} /><Field label="글자 수 제한" type="number" value={draft.maxLength} placeholder="선택" onChange={(maxLength) => onChange({ ...draft, maxLength })} /></div><Field className="mt-3" label="관리 메모" value={draft.description} placeholder="표시 위치와 목적" onChange={(description) => onChange({ ...draft, description })} /><Field className="mt-3" label="치환 변수 (쉼표로 구분)" value={draft.templateVariables} placeholder="display_name, count" onChange={(templateVariables) => onChange({ ...draft, templateVariables })} /><label className="mt-3 block text-xs font-semibold text-[#65706a]"><span>문구</span><textarea value={draft.draftText} onChange={(event) => onChange({ ...draft, draftText: event.target.value })} placeholder="사용자에게 보이는 문구를 입력하세요." className="mt-1.5 min-h-24 w-full rounded-xl border border-[#dcd6ca] bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label><Actions onCancel={onCancel} onSubmit={onSubmit} label="초안 등록" /></section>; }
function Actions({ onCancel, onSubmit, label }: { onCancel: () => void; onSubmit: () => void; label: string }) { return <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} className="h-10 px-4 text-sm font-semibold text-[#66706d]">취소</button><button type="button" onClick={onSubmit} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-semibold text-white"><Save className="size-4" />{label}</button></div>; }
function EntryTable({ entries, screens, editing, dirtyEntryIds, unpublishedEntryIds, latestVersion, onChange }: { entries: Entry[]; screens: Screen[]; editing: boolean; dirtyEntryIds: Set<number>; unpublishedEntryIds: Set<number>; latestVersion: number | null; onChange: (id: number, patch: Partial<Entry>) => void }) { const ordered = [...entries].sort((a, b) => a.screenKey.localeCompare(b.screenKey) || a.variableName.localeCompare(b.variableName)); return <div className="mt-5 overflow-x-auto rounded-2xl border border-[#e3ddd2]"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-[#f5f2ea] text-xs font-bold tracking-[0.08em] text-[#66716d]"><tr><th className="px-4 py-3">소속 화면</th><th className="px-4 py-3">변수명</th><th className="min-w-[320px] px-4 py-3">문구 · 관리 메모</th><th className="min-w-[200px] px-4 py-3">언어 · 길이 · 치환 변수</th><th className="w-32 px-4 py-3">반영 상태</th></tr></thead><tbody>{ordered.map((entry) => { const overflow = entry.maxLength !== null && entry.draftText.length > entry.maxLength; const unsaved = dirtyEntryIds.has(entry.id); const unpublished = unpublishedEntryIds.has(entry.id); return <tr key={entry.id} className="border-t border-[#eae4da] align-top"><td className="px-4 py-3">{editing ? <ScreenSelect value={String(entry.screenId)} screens={screens} onChange={(value) => { const screen = screens.find((item) => item.id === Number(value)); onChange(entry.id, { screenId: Number(value), screenKey: screen?.screenKey ?? entry.screenKey, screenLabel: screen?.displayName ?? entry.screenLabel }); }} /> : <><span className="font-medium text-[#344247]">{entry.screenLabel}</span><code className="mt-1 block text-[11px] text-[#60716c]">{entry.screenKey}</code></>}</td><td className="px-4 py-3">{editing ? <input className={inputClass} value={entry.variableName} onChange={(event) => onChange(entry.id, { variableName: event.target.value })} /> : <code className="font-mono text-xs font-semibold text-[#45665b]">{entry.variableName}</code>}</td><td className="px-4 py-3">{editing ? <><textarea value={entry.draftText} onChange={(event) => onChange(entry.id, { draftText: event.target.value })} className="min-h-24 w-full rounded-lg border border-[#d8d1c5] bg-white px-2.5 py-2 text-sm leading-5 outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /><input className={`mt-2 ${inputClass}`} value={entry.description ?? ''} placeholder="관리 메모" onChange={(event) => onChange(entry.id, { description: event.target.value })} /></> : <><p className="max-w-[390px] whitespace-pre-wrap leading-6 text-[#344247]">{entry.draftText}</p>{entry.description && <p className="mt-2 text-xs text-[#78817b]">{entry.description}</p>}</>}</td><td className="px-4 py-3">{editing ? <div className="grid grid-cols-2 gap-2"><input className={inputClass} value={entry.locale} placeholder="ko" onChange={(event) => onChange(entry.id, { locale: event.target.value })} /><input className={inputClass} type="number" value={entry.maxLength ?? ''} placeholder="글자 수" onChange={(event) => onChange(entry.id, { maxLength: event.target.value === '' ? null : Number(event.target.value) })} /><input className={`col-span-2 ${inputClass}`} value={entry.templateVariables.join(', ')} placeholder="치환 변수" onChange={(event) => onChange(entry.id, { templateVariables: vars(event.target.value) })} /></div> : <><p className="text-xs text-[#5f6c67]">{entry.locale} · {entry.maxLength === null ? '길이 제한 없음' : `${entry.draftText.length} / ${entry.maxLength}자`}</p>{entry.templateVariables.length > 0 && <p className="mt-1 font-mono text-[11px] text-[#75807a]">{entry.templateVariables.join(', ')}</p>}</>}{overflow && <p className="mt-2 text-xs font-semibold text-[#b35b43]">글자 수 제한을 초과했어요.</p>}</td><td className="px-4 py-3"><Status active={entry.isActive} /><div className="mt-2">{unsaved ? <DraftBadge tone="warning">저장 전</DraftBadge> : unpublished ? <DraftBadge tone="pending">수정됨</DraftBadge> : <DraftBadge tone="published">{latestVersion ? `v${latestVersion} 반영` : '반영됨'}</DraftBadge>}</div></td></tr>; })}</tbody></table></div>; }
