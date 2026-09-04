'use client';

import { ArchiveRestore, ChevronDown, ChevronLeft, ChevronRight, FilePlus2, LayoutPanelTop, LoaderCircle, Pencil, Save, Send, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { useStaticCopy } from '@/components/static-copy-provider';

type Screen = { id: number; screenKey: string; displayName: string; routePath: string | null; sortOrder: number; isActive: boolean };
type Entry = { id: number; screenId: number; screenKey: string; screenLabel: string; variableName: string; locale: string; description: string | null; textFormat: 'plain' | 'multiline'; sourceText?: string; draftText: string; templateVariables: string[]; maxLength: number | null; draftRevision: number; isActive: boolean; draftUpdatedAt: string };
type Publication = { id: number; version: number; status: 'building' | 'ready' | 'published' | 'failed'; copyCount: number; publishedAt: string | null; createdAt: string; restoredFromPublicationId: number | null; note: string | null };
type Payload = { screens: Screen[]; entries: Entry[]; publications: Publication[]; draftStatus?: { unpublishedEntryIds: number[] }; error?: string };

const blankScreen = { screenKey: '', displayName: '', routePath: '', sortOrder: '0' };
const blankEntry = { screenId: '', variableName: '', locale: 'ko', description: '', draftText: '', templateVariables: '', maxLength: '' };
const ITEMS_PER_PAGE = 10;
const inputClass = 'h-9 w-full rounded-lg border border-[#d8d1c5] bg-white px-2.5 text-sm text-[#344247] outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]';
const errorText = (body: unknown, fallback: string) => body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : fallback;
const dateText = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '아직 없음';
const vars = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

// A preview is a real route, not a list of copy strings.  Route-level copy is
// therefore shown together with the shared shell copy used by that route.
function previewScopeKeys(screenKey: string) {
  if (screenKey.startsWith('writing.') && screenKey !== 'writing.common') return ['common.shell', 'writing.common', screenKey];
  if (screenKey.startsWith('speaking.') && screenKey !== 'speaking.common') return ['common.shell', 'speaking.common', screenKey];
  if (screenKey === 'writing.common') return ['common.shell', 'writing.common'];
  if (screenKey === 'speaking.common') return ['common.shell', 'speaking.common'];
  if (screenKey === 'manage.copy') return ['common.shell', 'admin', 'manage.copy'];
  return screenKey === 'common.shell' || screenKey === 'home.landing' || screenKey === 'mypage' || screenKey === 'connect'
    ? [screenKey]
    : ['common.shell', screenKey];
}

export function ManageCopyClient() {
  const [activePanel, setActivePanel] = useState<'screens' | 'users'>('screens');
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
  const [draftPage, setDraftPage] = useState(1);
  const [screenPage, setScreenPage] = useState(1);
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [selectedMockupEntryId, setSelectedMockupEntryId] = useState<number | null>(null);
  const copyTitle = useStaticCopy('manage.copy', 'title', '서비스 문구 관리');
  const copyDescription = useStaticCopy('manage.copy', 'description', '문구는 소속 화면 아래에서 관리합니다.');
  const draftScreenFilterLabel = useStaticCopy('manage.copy', 'draft_screen_filter_label', '소속 화면');
  const draftScreenFilterAll = useStaticCopy('manage.copy', 'draft_screen_filter_all', '전체 화면');
  const draftScreenFilterCount = useStaticCopy('manage.copy', 'draft_screen_filter_count', '{count}개 문구 표시');
  const draftScreenFilterEmptyTitle = useStaticCopy('manage.copy', 'draft_screen_filter_empty_title', '이 화면에 등록된 문구가 없습니다.');
  const draftScreenFilterEmptyDescription = useStaticCopy('manage.copy', 'draft_screen_filter_empty_description', '다른 소속 화면을 선택하거나 새 문구를 등록하세요.');
  const draftPaginationPrevious = useStaticCopy('manage.copy', 'draft_pagination_previous', '이전');
  const draftPaginationNext = useStaticCopy('manage.copy', 'draft_pagination_next', '다음');
  const draftPaginationStatus = useStaticCopy('manage.copy', 'draft_pagination_status', '{current} / {total} 페이지');
  const screenPaginationLabel = useStaticCopy('manage.copy', 'screen_pagination_label', '소속 화면 페이지');
  const mockupEyebrow = useStaticCopy('manage.copy', 'mockup_eyebrow', 'COPY PREVIEW');
  const mockupTitle = useStaticCopy('manage.copy', 'mockup_title', '문구 위치 미리보기');
  const mockupDescription = useStaticCopy('manage.copy', 'mockup_description', '문구를 클릭하면 오른쪽에서 초안을 수정할 수 있습니다.');
  const mockupNoScreen = useStaticCopy('manage.copy', 'mockup_no_screen', '위 목록에서 소속 화면을 선택하세요.');
  const mockupEditTitle = useStaticCopy('manage.copy', 'mockup_edit_title', '문구 편집');
  const mockupEditEmpty = useStaticCopy('manage.copy', 'mockup_edit_empty', '목업의 문구를 선택하세요.');
  const mockupSource = useStaticCopy('manage.copy', 'mockup_source', '원문');
  const mockupDraft = useStaticCopy('manage.copy', 'mockup_draft', '초안');
  const mockupSave = useStaticCopy('manage.copy', 'mockup_save', '문구 저장');
  const screenManagement = useStaticCopy('manage.copy', 'screen_management', '화면 관리');
  const userManagement = useStaticCopy('manage.copy', 'user_management', '사용자 관리');
  const userManagementEyebrow = useStaticCopy('manage.copy', 'user_management_eyebrow', 'USERS');
  const userManagementTitle = useStaticCopy('manage.copy', 'user_management_title', '사용자 관리');
  const userManagementDescription = useStaticCopy('manage.copy', 'user_management_description', '사용자 권한과 계정 정보 관리는 다음 단계에서 추가합니다.');
  const activeCount = entries.filter((entry) => entry.isActive).length;
  const latest = publications[0];
  const unpublishedCount = unpublishedEntryIds.size;
  const orderedScreens = useMemo(() => [...screens].sort((a, b) => a.sortOrder - b.sortOrder || a.screenKey.localeCompare(b.screenKey)), [screens]);
  const totalScreenPages = Math.max(1, Math.ceil(orderedScreens.length / ITEMS_PER_PAGE));
  const currentScreenPage = Math.min(screenPage, totalScreenPages);
  const paginatedScreens = useMemo(
    () => orderedScreens.slice((currentScreenPage - 1) * ITEMS_PER_PAGE, currentScreenPage * ITEMS_PER_PAGE),
    [currentScreenPage, orderedScreens],
  );
  const filteredEntries = useMemo(
    () => draftScreenFilter === 'all' ? entries : entries.filter((entry) => entry.screenId === Number(draftScreenFilter)),
    [draftScreenFilter, entries],
  );
  const totalDraftPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE));
  const currentDraftPage = Math.min(draftPage, totalDraftPages);
  const paginatedEntries = useMemo(
    () => filteredEntries.slice((currentDraftPage - 1) * ITEMS_PER_PAGE, currentDraftPage * ITEMS_PER_PAGE),
    [currentDraftPage, filteredEntries],
  );
  const selectedScreen = selectedScreenId === null ? null : orderedScreens.find((screen) => screen.id === selectedScreenId) ?? null;
  const selectedScreenEntries = useMemo(
    () => selectedScreen === null ? [] : entries.filter((entry) => previewScopeKeys(selectedScreen.screenKey).includes(entry.screenKey)).sort((a, b) => a.screenKey.localeCompare(b.screenKey) || a.variableName.localeCompare(b.variableName)),
    [entries, selectedScreen],
  );
  const selectedMockupEntry = selectedMockupEntryId === null ? null : selectedScreenEntries.find((entry) => entry.id === selectedMockupEntryId) ?? null;
  useEffect(() => { setDraftPage(1); }, [draftScreenFilter]);
  useEffect(() => { setScreenPage((page) => Math.min(page, totalScreenPages)); }, [totalScreenPages]);
  useEffect(() => {
    if (selectedScreenEntries.length === 0) { setSelectedMockupEntryId(null); return; }
    if (!selectedScreenEntries.some((entry) => entry.id === selectedMockupEntryId)) setSelectedMockupEntryId(selectedScreenEntries[0].id);
  }, [selectedMockupEntryId, selectedScreenEntries]);

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

  function openMockup(screen: Screen) {
    if (screenEditing) return;
    setSelectedScreenId(screen.id);
    setSelectedMockupEntryId(entries.find((entry) => previewScopeKeys(screen.screenKey).includes(entry.screenKey))?.id ?? null);
    setDraftScreenFilter(String(screen.id));
    setDraftPage(1);
    window.requestAnimationFrame(() => document.getElementById('copy-mockup-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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

  const tabs = <nav aria-label="관리 메뉴" className="flex border-b border-[#dcd6ca]">
    <button type="button" role="tab" aria-selected={activePanel === 'screens'} onClick={() => setActivePanel('screens')} className={`border-b-2 px-5 py-3 text-sm font-bold transition-colors ${activePanel === 'screens' ? 'border-[#26353b] text-[#26353b]' : 'border-transparent text-[#77807a] hover:text-[#43514e]'}`}>{screenManagement}</button>
    <button type="button" role="tab" aria-selected={activePanel === 'users'} onClick={() => setActivePanel('users')} className={`border-b-2 px-5 py-3 text-sm font-bold transition-colors ${activePanel === 'users' ? 'border-[#26353b] text-[#26353b]' : 'border-transparent text-[#77807a] hover:text-[#43514e]'}`}>{userManagement}</button>
  </nav>;
  if (loading) return <section className="mt-8 overflow-x-auto pb-4"><div className="min-w-[1120px]">{tabs}<section className="mt-6 grid min-h-64 place-items-center rounded-3xl border border-[#dcd6ca] bg-[#fffdf8]"><span className="inline-flex items-center gap-2 text-sm text-[#6d756f]"><LoaderCircle className="size-4 animate-spin" />문구 관리 정보를 불러오는 중이에요.</span></section></div></section>;
  if (activePanel === 'users') return <section className="mt-8 overflow-x-auto pb-4"><div className="min-w-[1120px]">{tabs}<section className="mt-6 rounded-3xl border border-dashed border-[#d8d0c2] bg-[#fffdf8] px-8 py-20 text-center"><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">{userManagementEyebrow}</p><h2 className="mt-3 font-serif text-3xl text-[#26353b]">{userManagementTitle}</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#69736e]">{userManagementDescription}</p></section></div></section>;
  return <section className="mt-8 overflow-x-auto pb-4"><div className="min-w-[1120px]">{tabs}<div className="mt-6 space-y-6">
    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">STATIC COPY</p><h2 className="mt-2 font-serif text-2xl text-[#26353b] sm:text-3xl">{copyTitle}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69736e]">{copyDescription} 소속 화면 안에서만 변수명이 구분되므로, 여러 화면에 각각 <code className="rounded bg-[#f1eee7] px-1 py-0.5">title</code>을 둘 수 있어요.</p></div><button type="button" onClick={() => void publish()} disabled={publishing || !activeCount} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-5 text-sm font-semibold text-white disabled:opacity-45"><Send className="size-4" />{publishing ? '발행본 생성 중' : '발행본 만들기'}</button></div><div className="mt-5 grid gap-3 border-t border-[#ece7dd] pt-5 sm:grid-cols-3"><Metric label="소속 화면" value={String(screens.length)} /><Metric label="활성 문구" value={String(activeCount)} /><Metric label="최근 발행본" value={latest ? `v${latest.version}` : '—'} /></div></section>

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><SectionHead eyebrow="SCREENS" title="소속 화면" action={<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setScreenOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9d2c6] px-3.5 text-sm font-semibold text-[#43514e]"><LayoutPanelTop className="size-4" />화면 등록</button>{screenEditing ? <><button type="button" onClick={() => { void load(false); setScreenEditing(false); }} className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-semibold text-[#66706d]"><X className="size-4" />취소</button><button type="button" onClick={() => void saveScreens()} disabled={savingScreens} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-sm font-semibold text-white disabled:opacity-45"><Save className="size-4" />{savingScreens ? '저장 중' : '변경 저장'}</button></> : <button type="button" onClick={() => setScreenEditing(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-sm font-semibold text-white"><Pencil className="size-4" />수정</button>}</div>} />
      {screenOpen && <CreateScreen draft={screenDraft} onChange={setScreenDraft} onCancel={() => { setScreenOpen(false); setScreenDraft(blankScreen); }} onSubmit={() => void createScreen()} />}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#e3ddd2]"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-[#f5f2ea] text-xs font-bold tracking-[0.08em] text-[#66716d]"><tr><th className="px-4 py-3">화면 키</th><th className="px-4 py-3">화면 이름</th><th className="px-4 py-3">경로</th><th className="w-28 px-4 py-3">정렬</th><th className="w-24 px-4 py-3">상태</th></tr></thead><tbody>{orderedScreens.length ? paginatedScreens.map((screen) => <tr key={screen.id} role={screenEditing ? undefined : 'button'} tabIndex={screenEditing ? undefined : 0} onClick={() => openMockup(screen)} onKeyDown={(event) => { if (!screenEditing && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openMockup(screen); } }} className={`border-t border-[#eae4da] align-top ${screenEditing ? '' : 'cursor-pointer transition-colors hover:bg-[#faf7f0]'} ${selectedScreenId === screen.id ? 'bg-[#fff3e9]' : ''}`}><td className="px-4 py-3"><code className="font-mono text-xs font-semibold text-[#45665b]">{screen.screenKey}</code>{screenEditing && <p className="mt-1 text-[11px] text-[#8b918b]">코드 연결 기준</p>}</td><td className="px-4 py-3">{screenEditing ? <input className={inputClass} value={screen.displayName} onChange={(event) => patchScreen(screen.id, { displayName: event.target.value })} /> : <span className="font-medium text-[#344247]">{screen.displayName}</span>}</td><td className="px-4 py-3">{screenEditing ? <input className={inputClass} value={screen.routePath ?? ''} placeholder="/writing/practice" onChange={(event) => patchScreen(screen.id, { routePath: event.target.value || null })} /> : <code className="text-xs text-[#60716c]">{screen.routePath ?? '—'}</code>}</td><td className="px-4 py-3">{screenEditing ? <input className={inputClass} type="number" value={screen.sortOrder} onChange={(event) => patchScreen(screen.id, { sortOrder: Number(event.target.value) || 0 })} /> : screen.sortOrder}</td><td className="px-4 py-3">{screenEditing ? <Toggle checked={screen.isActive} label="활성" onChange={(isActive) => patchScreen(screen.id, { isActive })} /> : <Status active={screen.isActive} />}</td></tr>) : <EmptyRow colSpan={5} text="아직 등록된 소속 화면이 없습니다." />}</tbody></table></div>{orderedScreens.length > ITEMS_PER_PAGE && <PaginationControls ariaLabel={screenPaginationLabel} currentPage={currentScreenPage} totalPages={totalScreenPages} previousLabel={draftPaginationPrevious} nextLabel={draftPaginationNext} statusLabel={draftPaginationStatus} onPrevious={() => setScreenPage((page) => Math.max(1, page - 1))} onNext={() => setScreenPage((page) => Math.min(totalScreenPages, page + 1))} />}<p className="mt-3 text-xs text-[#7b847e]">화면 키는 코드와 연결되는 기준값이라 수정하지 않습니다. 화면 이름·경로·정렬·활성 상태는 표 안에서 바로 변경할 수 있어요.</p></section>

    <CopyMockupEditor screen={selectedScreen} entries={selectedScreenEntries} selectedEntry={selectedMockupEntry} onSelectEntry={setSelectedMockupEntryId} onChangeEntry={(draftText) => selectedMockupEntry && patchEntry(selectedMockupEntry.id, { draftText })} onSave={() => void saveEntries()} saving={savingEntries} canSave={entryDirty.size > 0} texts={{ eyebrow: mockupEyebrow, title: mockupTitle, description: mockupDescription, noScreen: mockupNoScreen, editTitle: mockupEditTitle, editEmpty: mockupEditEmpty, source: mockupSource, draft: mockupDraft, save: mockupSave }} />

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><SectionHead eyebrow="DRAFTS" title="문구 초안" action={<div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={!screens.length} onClick={() => setEntryOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9d2c6] px-3.5 text-sm font-semibold text-[#43514e] disabled:opacity-45"><FilePlus2 className="size-4" />새 문구</button>{entryEditing ? <><button type="button" onClick={() => { void load(false); setEntryEditing(false); }} className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-semibold text-[#66706d]"><X className="size-4" />취소</button><button type="button" onClick={() => void saveEntries()} disabled={savingEntries} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-sm font-semibold text-white disabled:opacity-45"><Save className="size-4" />{savingEntries ? '저장 중' : '변경 저장'}</button></> : <button type="button" disabled={!entries.length} onClick={() => setEntryEditing(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-sm font-semibold text-white disabled:opacity-45"><Pencil className="size-4" />수정</button>}</div>} />
      {entryOpen && <CreateEntry draft={entryDraft} screens={orderedScreens} onChange={setEntryDraft} onCancel={() => { setEntryOpen(false); setEntryDraft(blankEntry); }} onSubmit={() => void createEntry()} />}
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e7dfd2] bg-[#faf7f0] p-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex min-w-0 items-center gap-3 text-sm font-semibold text-[#43514e]"><span className="shrink-0">{draftScreenFilterLabel}</span><select value={draftScreenFilter} onChange={(event) => setDraftScreenFilter(event.target.value)} className="h-10 min-w-0 rounded-xl border border-[#d8d1c5] bg-white px-3 text-sm font-medium text-[#344247] outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]"><option value="all">{draftScreenFilterAll}</option>{orderedScreens.map((screen) => <option key={screen.id} value={screen.id}>{screen.displayName}</option>)}</select></label><span className="text-xs text-[#78817b]">{draftScreenFilterCount.replace('{count}', String(filteredEntries.length))}</span></div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-[#e7dfd2] bg-[#faf7f0] px-3 py-2.5 text-xs"><span className="font-semibold text-[#66716d]">현재 상태</span>{entryDirty.size > 0 && <DraftBadge tone="warning">저장 전 변경 {entryDirty.size}건</DraftBadge>}{unpublishedCount > 0 && <DraftBadge tone="pending">수정됨 {unpublishedCount}건</DraftBadge>}{entryDirty.size === 0 && unpublishedCount === 0 && <DraftBadge tone="published">{latest ? `발행본 v${latest.version} 반영됨` : '발행할 문구가 없습니다'}</DraftBadge>}<span className="text-[#858c85]">저장 전 → 수정됨 → 반영 완료 순서로 관리돼요.</span></div>
      {!entries.length ? <div className="mt-5 rounded-2xl border border-dashed border-[#d8d0c2] px-5 py-12 text-center"><SlidersHorizontal className="mx-auto size-5 text-[#9ba39d]" /><p className="mt-3 font-medium text-[#43514e]">아직 등록된 문구가 없습니다.</p><p className="mt-1 text-sm text-[#77807a]">소속 화면을 선택하고 title 같은 변수명으로 문구를 등록하세요.</p></div> : filteredEntries.length ? <><EntryTable entries={paginatedEntries} screens={orderedScreens} editing={entryEditing} dirtyEntryIds={entryDirty} unpublishedEntryIds={unpublishedEntryIds} latestVersion={latest?.version ?? null} onChange={patchEntry} /><PaginationControls ariaLabel="문구 초안 페이지" currentPage={currentDraftPage} totalPages={totalDraftPages} previousLabel={draftPaginationPrevious} nextLabel={draftPaginationNext} statusLabel={draftPaginationStatus} onPrevious={() => setDraftPage((page) => Math.max(1, page - 1))} onNext={() => setDraftPage((page) => Math.min(totalDraftPages, page + 1))} /></> : <div className="mt-5 rounded-2xl border border-dashed border-[#d8d0c2] px-5 py-12 text-center"><SlidersHorizontal className="mx-auto size-5 text-[#9ba39d]" /><p className="mt-3 font-medium text-[#43514e]">{draftScreenFilterEmptyTitle}</p><p className="mt-1 text-sm text-[#77807a]">{draftScreenFilterEmptyDescription}</p></div>}</section>

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><div role="button" tabIndex={0} onClick={() => setHistoryOpen((v) => !v)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setHistoryOpen((v) => !v); } }} aria-expanded={historyOpen} className="flex w-full cursor-pointer items-center justify-between text-left"><span><span className="block text-xs font-bold tracking-[0.16em] text-[#d76a47]">RELEASE HISTORY</span><span className="mt-1 block font-serif text-2xl text-[#26353b]">발행본 이력</span></span><ChevronDown className={`size-5 text-[#566560] transition-transform ${historyOpen ? 'rotate-180' : ''}`} /></div>{historyOpen && <div className="mt-5 space-y-3 border-t border-[#ece7dd] pt-5">{!publications.length ? <p className="text-sm text-[#77807a]">아직 만든 발행본이 없습니다.</p> : publications.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-[#e3ddd2] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong className="font-serif text-xl">v{item.version}</strong><span className="rounded-full bg-[#e9f3ed] px-2 py-0.5 text-[11px] font-bold text-[#3f7158]">{item.status === 'published' ? '사이트 반영 완료' : item.status === 'ready' ? '발행본 생성됨' : item.status === 'failed' ? '생성 실패' : item.status}</span></div><p className="mt-1 text-xs text-[#747c76]">{item.copyCount}개 문구 · {dateText(item.publishedAt ?? item.createdAt)}{item.restoredFromPublicationId ? ` · v${item.restoredFromPublicationId}에서 복원` : ''}</p></div><button type="button" onClick={() => void publish(item.id)} disabled={publishing} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#d9d2c6] px-3 text-xs font-semibold text-[#43514e] disabled:opacity-45"><ArchiveRestore className="size-3.5" />이 버전으로 되돌리기</button></article>)}</div>}</section>
  </div></div></section>;
}

function CopyMockupEditor({ screen, entries, selectedEntry, onSelectEntry, onChangeEntry, onSave, saving, canSave, texts }: { screen: Screen | null; entries: Entry[]; selectedEntry: Entry | null; onSelectEntry: (entryId: number) => void; onChangeEntry: (draftText: string) => void; onSave: () => void; saving: boolean; canSave: boolean; texts: { eyebrow: string; title: string; description: string; noScreen: string; editTitle: string; editEmpty: string; source: string; draft: string; save: string } }) {
  if (!screen) return <section id="copy-mockup-editor" className="rounded-3xl border border-dashed border-[#d8d0c2] bg-[#fffdf8] px-5 py-14 text-center"><div className="mx-auto h-3 w-24 animate-pulse rounded-full bg-[#e9e4da]" /><p className="mt-4 font-serif text-2xl text-[#344247]">{texts.noScreen}</p></section>;
  const titleEntry = entries.find((entry) => entry.variableName === 'title');
  const descriptionEntry = entries.find((entry) => entry.variableName === 'description');
  const navigationLabels = new Set(['BOARD', 'LIST', 'PRACTICE', 'TEST', '오답노트']);
  const tabEntries = entries.filter((entry) => navigationLabels.has(entry.draftText.trim()));
  const contentEntries = entries.filter((entry) => entry.id !== titleEntry?.id && entry.id !== descriptionEntry?.id && !tabEntries.some((tab) => tab.id === entry.id));
  const node = (entry: Entry, style = '') => <span key={entry.id} role="button" tabIndex={0} onClick={() => onSelectEntry(entry.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectEntry(entry.id); } }} className={`group relative cursor-pointer outline-none transition ${selectedEntry?.id === entry.id ? 'rounded ring-2 ring-[#d76a47] ring-offset-2' : 'hover:rounded hover:ring-2 hover:ring-[#e7b7a8] hover:ring-offset-2'} ${style}`}><span className="pointer-events-none absolute -top-2 left-2 z-10 rounded bg-[#26353b] px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white opacity-0 transition group-hover:opacity-100">{entry.variableName}</span>{entry.draftText}</span>;
  if (screen.screenKey === 'writing.board') return <WritingBoardRoutePreview screen={screen} entries={entries} node={node} selectedEntry={selectedEntry} onChangeEntry={onChangeEntry} onSave={onSave} saving={saving} canSave={canSave} texts={texts} />;
  return <ActualRouteScreenPreview screen={screen} entries={entries} node={node} selectedEntry={selectedEntry} onChangeEntry={onChangeEntry} onSave={onSave} saving={saving} canSave={canSave} texts={texts} />;
}

function WritingBoardScreenPreview({ screen, entries, node, selectedEntry, onChangeEntry, onSave, saving, canSave, texts }: { screen: Screen; entries: Entry[]; node: (entry: Entry, style?: string) => React.ReactNode; selectedEntry: Entry | null; onChangeEntry: (draftText: string) => void; onSave: () => void; saving: boolean; canSave: boolean; texts: { eyebrow: string; title: string; description: string; editTitle: string; editEmpty: string; source: string; draft: string; save: string } }) {
  const entry = (sourceText: string) => entries.find((item) => item.sourceText === sourceText);
  const levels = [
    ['FOUNDATION', '기본 문장 구조부터 바로 학습을 시작합니다.'],
    ['5.0+', 'Task 1 한 문항으로 시작 단계를 확인합니다.'],
    ['6.0+', 'Task 1과 Task 2로 현재 실력을 확인합니다.'],
    ['7.0+', 'Task 1과 Task 2를 심화 기준으로 확인합니다.'],
  ];
  const startEyebrow = entry('STARTING LEVEL');
  const startTitle = entry('시작 레벨을 설정하세요.');
  const startDescription = entry('내 실력에 맞는 Writing 단계로 학습을 시작합니다.');
  const startAction = entry('레벨 설정하기');
  const dialogTitle = entry('어디서 시작할까요?');
  const dialogDescription = entry('처음 선택한 레벨은 학습의 출발점이 됩니다.');
  return <section id="copy-mockup-editor" className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7"><div className="flex items-baseline justify-between border-b border-[#ece7dd] pb-5"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">{texts.eyebrow}</p><h2 className="mt-1 font-serif text-2xl text-[#26353b]">{texts.title}</h2><p className="mt-2 text-sm leading-6 text-[#69736e]">{texts.description}</p></div><code className="text-xs text-[#718079]">{screen.routePath ?? screen.screenKey}</code></div><div className="mt-5 grid grid-cols-[minmax(0,1fr)_20rem] gap-5"><div className="overflow-hidden rounded-2xl border border-[#ddd6ca] bg-[#f7f4ed]"><div className="border-b border-[#dcd6ca] bg-[#f7f4ed] px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-[#e9e4da]" /></div><div className="grid grid-cols-[9rem_minmax(0,1fr)]"><aside className="min-h-[620px] border-r border-[#e4ddd2] bg-[#fffdf8] p-5"><div className="space-y-4">{Array.from({ length: 6 }, (_, index) => <span key={index} className="block h-2.5 animate-pulse rounded-full bg-[#eee9e0]" />)}</div></aside><div className="p-9"><span className="block h-3 w-16 animate-pulse rounded-full bg-[#e9e4da]" /><span className="mt-3 block h-9 w-64 animate-pulse rounded bg-[#eee9e0]" /><span className="mt-3 block h-3 w-[30rem] animate-pulse rounded-full bg-[#eee9e0]" /><div className="mt-9 flex gap-2 border-b border-[#dcd6ca]"><span className="border-b-2 border-[#26353b] px-5 py-3 text-sm font-bold text-[#26353b]">BOARD</span><span className="px-5 py-3 text-sm font-semibold text-[#7b827e]">PRACTICE</span><span className="px-5 py-3 text-sm font-semibold text-[#7b827e]">오답노트</span></div><section className="mt-7 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-8 shadow-[0_18px_48px_rgba(35,44,43,0.05)]"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6"><div>{startEyebrow && node(startEyebrow, 'block text-sm font-semibold text-[#38634f]')}{startTitle && node(startTitle, 'mt-4 block font-serif text-3xl text-[#1d2935]')}{startDescription && node(startDescription, 'mt-3 block text-sm leading-6 text-[#69736e]')}</div>{startAction && <div className="rounded-xl bg-[#1d2935] px-5 py-3 text-sm font-semibold text-[#fffdf8]">{node(startAction, 'text-[#fffdf8]')}</div>}</div></section><section className="mt-5 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7 shadow-[0_18px_48px_rgba(35,44,43,0.05)]">{dialogTitle && node(dialogTitle, 'block font-serif text-3xl text-[#1d2935]')}{dialogDescription && node(dialogDescription, 'mt-2 block text-sm leading-6 text-[#707873]')}<div className="mt-6 space-y-3">{levels.map(([label, description]) => { const level = entry(label); const detail = entry(description); return <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#ded7ca] p-4"><div>{level ? node(level, 'block font-serif text-xl text-[#24333a]') : <span className="block h-6 w-20 animate-pulse rounded bg-[#eee9e0]" />}{detail ? node(detail, 'mt-1 block text-sm text-[#737b76]') : <span className="mt-2 block h-3 w-72 animate-pulse rounded bg-[#eee9e0]" />}</div><span className="text-[#d76a47]">→</span></div>; })}</div></section></div></div></div><aside className="rounded-2xl border border-[#e3ddd2] bg-[#faf7f0] p-4"><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">{texts.editTitle}</p>{selectedEntry ? <div className="mt-4"><code className="text-xs font-semibold text-[#45665b]">{selectedEntry.variableName}</code>{selectedEntry.description && <p className="mt-1 text-xs leading-5 text-[#78817b]">{selectedEntry.description}</p>}<div className="mt-4"><span className="text-xs font-semibold text-[#69736e]">{texts.source}</span><p className="mt-1 rounded-xl border border-[#e4ddd2] bg-white px-3 py-2 text-xs leading-5 text-[#6b756f]">{selectedEntry.sourceText ?? selectedEntry.draftText}</p></div><label className="mt-4 block text-xs font-semibold text-[#69736e]"><span>{texts.draft}</span><textarea value={selectedEntry.draftText} onChange={(event) => onChangeEntry(event.target.value)} className="mt-1.5 min-h-36 w-full rounded-xl border border-[#d8d1c5] bg-white px-3 py-2.5 text-sm leading-6 text-[#344247] outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label><button type="button" onClick={onSave} disabled={!canSave || saving} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-semibold text-white disabled:opacity-45"><Save className="size-4" />{saving ? '저장 중' : texts.save}</button></div> : <p className="mt-4 text-sm leading-6 text-[#78817b]">{texts.editEmpty}</p>}</aside></div></section>;
}
function WritingBoardRoutePreview({ screen, entries, node, selectedEntry, onChangeEntry, onSave, saving, canSave, texts }: { screen: Screen; entries: Entry[]; node: (entry: Entry, style?: string) => React.ReactNode; selectedEntry: Entry | null; onChangeEntry: (draftText: string) => void; onSave: () => void; saving: boolean; canSave: boolean; texts: { eyebrow: string; title: string; description: string; editTitle: string; editEmpty: string; source: string; draft: string; save: string } }) {
  const get = (sourceText: string, scope?: string) => entries.find((entry) => entry.sourceText === sourceText && (!scope || entry.screenKey === scope));
  const shell = (sourceText: string) => get(sourceText, 'common.shell');
  const writing = (sourceText: string) => get(sourceText, 'writing.common');
  const board = (sourceText: string) => get(sourceText, 'writing.board');
  const levels = [
    ['FOUNDATION', '기본 문장 구조부터 바로 학습을 시작합니다.'],
    ['5.0+', 'Task 1 한 문항으로 시작 단계를 확인합니다.'],
    ['6.0+', 'Task 1과 Task 2로 현재 실력을 확인합니다.'],
    ['7.0+', 'Task 1과 Task 2를 심화 기준으로 확인합니다.'],
  ] as const;
  const nav = [
    ['HOME', false], ['VOCA', false], ['READING', false], ['LISTENING', false], ['WRITING', true], ['SPEAKING', false],
  ] as const;
  const detail = (entry: Entry | undefined, className: string, fallbackWidth = 'w-28') => entry ? node(entry, className) : <span className={`block h-3 animate-pulse rounded bg-[#e9e4da] ${fallbackWidth}`} />;
  return <section id="copy-mockup-editor" className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7">
    <div className="flex items-baseline justify-between border-b border-[#ece7dd] pb-5"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">{texts.eyebrow}</p><h2 className="mt-1 font-serif text-2xl text-[#26353b]">{texts.title}</h2><p className="mt-2 text-sm leading-6 text-[#69736e]">{texts.description}</p></div><code className="text-xs text-[#718079]">{screen.routePath ?? screen.screenKey}</code></div>
    <div className="mt-5 grid grid-cols-[minmax(0,1fr)_20rem] gap-5">
      <main className="overflow-hidden rounded-2xl border border-[#ddd6ca] bg-[#f7f4ed]">
        <header className="flex h-16 items-center justify-between border-b border-[#dfd9ce] bg-[#fffdf8] px-6"><div>{detail(shell('EnPra'), 'font-serif text-xl text-[#25343a]')}</div><div className="size-8 animate-pulse rounded-full bg-[#eee9e0]" /></header>
        <div className="grid min-h-[650px] grid-cols-[10rem_minmax(0,1fr)]">
          <aside className="border-r border-[#e4ddd2] bg-[#fffdf8] px-4 py-7"><div className="mb-5 text-[10px] font-bold tracking-[0.16em] text-[#8a918b]">{detail(shell('Practice'), 'text-[10px] font-bold tracking-[0.16em] text-[#8a918b]')}</div><div className="space-y-1">{nav.map(([label, active]) => <div key={label} className={`rounded-xl px-3 py-2.5 text-xs font-semibold ${active ? 'bg-[#eeece6] text-[#25343a]' : 'text-[#6e7773]'}`}>{detail(shell(label), active ? 'text-xs font-semibold text-[#25343a]' : 'text-xs font-semibold text-[#6e7773]')}</div>)}</div></aside>
          <div className="p-9">
            {detail(writing('WRITING'), 'text-xs font-bold tracking-[0.14em] text-[#d76a47]')} 
            {detail(writing('나의 Writing 진단.'), 'mt-2 block font-serif text-4xl text-[#1f2d34]', 'w-64')}
            {detail(writing('학습과 테스트 기록을 바탕으로 현재 상태를 확인하고, 필요한 다음 학습으로 바로 이어가세요.'), 'mt-3 block max-w-xl text-sm leading-6 text-[#707873]', 'w-80')}
            <nav className="mt-9 flex gap-1 border-b border-[#d8d1c5]">{[['BOARD', 'border-b-2 border-[#26353b] text-[#26353b]'], ['PRACTICE', 'text-[#77807a]'], ['오답노트', 'text-[#77807a]']].map(([label, style]) => <span key={label} className={`px-5 py-3 text-sm font-bold ${style}`}>{detail(writing(label), 'text-sm font-bold')}</span>)}</nav>
            <section className="mt-7 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-8 shadow-[0_18px_48px_rgba(35,44,43,0.05)]"><div className="flex items-center justify-between gap-6"><div>{detail(board('STARTING LEVEL'), 'text-xs font-bold tracking-[0.14em] text-[#d76a47]')}{detail(board('시작 레벨을 설정하세요.'), 'mt-3 block font-serif text-3xl text-[#1f2d34]', 'w-60')}{detail(board('내 실력에 맞는 Writing 단계로 학습을 시작합니다.'), 'mt-3 block text-sm text-[#707873]', 'w-72')}</div><div className="rounded-xl bg-[#1d2935] px-5 py-3">{detail(board('레벨 설정하기'), 'text-sm font-semibold text-white')}</div></div></section>
            <section className="mt-5 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7 shadow-[0_18px_48px_rgba(35,44,43,0.05)]">{detail(board('어디서 시작할까요?'), 'font-serif text-3xl text-[#1d2935]', 'w-64')}{detail(board('처음 선택한 레벨은 학습의 출발점이 됩니다.'), 'mt-2 block text-sm text-[#707873]', 'w-72')}<div className="mt-6 space-y-3">{levels.map(([name, description]) => <div key={name} className="flex items-center justify-between rounded-2xl border border-[#ded7ca] p-4"><div>{detail(board(name), 'font-serif text-xl text-[#24333a]', 'w-20')}{detail(board(description), 'mt-1 block text-sm text-[#737b76]', 'w-72')}</div><span className="text-[#d76a47]">→</span></div>)}</div></section>
          </div>
        </div>
      </main>
      <aside className="rounded-2xl border border-[#e3ddd2] bg-[#faf7f0] p-4"><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">{texts.editTitle}</p>{selectedEntry ? <div className="mt-4"><code className="text-xs font-semibold text-[#45665b]">{selectedEntry.screenKey} · {selectedEntry.variableName}</code>{selectedEntry.description && <p className="mt-1 text-xs leading-5 text-[#78817b]">{selectedEntry.description}</p>}<div className="mt-4"><span className="text-xs font-semibold text-[#69736e]">{texts.source}</span><p className="mt-1 rounded-xl border border-[#e4ddd2] bg-white px-3 py-2 text-xs leading-5 text-[#6b756f]">{selectedEntry.sourceText ?? selectedEntry.draftText}</p></div><label className="mt-4 block text-xs font-semibold text-[#69736e]"><span>{texts.draft}</span><textarea value={selectedEntry.draftText} onChange={(event) => onChangeEntry(event.target.value)} className="mt-1.5 min-h-36 w-full rounded-xl border border-[#d8d1c5] bg-white px-3 py-2.5 text-sm leading-6 text-[#344247] outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label><button type="button" onClick={onSave} disabled={!canSave || saving} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-semibold text-white disabled:opacity-45"><Save className="size-4" />{saving ? '저장 중' : texts.save}</button></div> : <p className="mt-4 text-sm leading-6 text-[#78817b]">{texts.editEmpty}</p>}</aside>
    </div>
  </section>;
}

function ActualRouteScreenPreview({ screen, entries, node, selectedEntry, onChangeEntry, onSave, saving, canSave, texts }: { screen: Screen; entries: Entry[]; node: (entry: Entry, style?: string) => React.ReactNode; selectedEntry: Entry | null; onChangeEntry: (draftText: string) => void; onSave: () => void; saving: boolean; canSave: boolean; texts: { eyebrow: string; title: string; description: string; editTitle: string; editEmpty: string; source: string; draft: string; save: string } }) {
  const own = entries.filter((entry) => entry.screenKey === screen.screenKey);
  const by = (sourceText: string, scope = screen.screenKey) => entries.find((entry) => entry.screenKey === scope && entry.sourceText === sourceText);
  const shell = (sourceText: string) => by(sourceText, 'common.shell');
  const pick = (...textsToFind: string[]) => textsToFind.map((text) => by(text)).filter((entry): entry is Entry => Boolean(entry));
  const text = (entry: Entry | undefined, className: string, skeleton = 'w-32') => entry ? node(entry, className) : <span className={`block h-3 animate-pulse rounded bg-[#e9e4da] ${skeleton}`} />;
  const title = own.find((entry) => entry.variableName === 'title') ?? pick('ChatGPT 연결', 'Part 1 대화 연습.', '서비스 관리.', '나의 대시보드')[0];
  const description = own.find((entry) => entry.variableName === 'description') ?? pick('내 ChatGPT 계정 연결을 관리합니다.', '계정과 학습 기록을 관리하는 공간입니다.')[0];
  const shellItems = ['HOME', 'VOCA', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'];
  const subnav = screen.screenKey.startsWith('voca.') ? ['BOARD', 'LIST', 'PRACTICE', 'TEST'] : screen.screenKey.startsWith('writing.') ? ['BOARD', 'PRACTICE', '오답노트'] : [];
  const heroItems = screen.screenKey === 'voca.board'
    ? pick('TODAY\'S BOARD', '오늘의 단어 20개', '학습하기', '테스트', 'MEMORY CHECK', '외운 단어', 'LEARNING FLOW', '이번 주 학습 현황')
    : screen.screenKey === 'speaking.part1'
      ? pick('PART 1 · INTERVIEW', 'GET READY', 'Let’s talk about your home town. What kind of place is it?', 'YOUR RESPONSE', '녹음 시작', '답변 확인')
      : screen.screenKey === 'connect'
        ? pick('AI CONNECTION', 'ChatGPT 연결', '내 ChatGPT 계정 연결을 관리합니다.', '연결 관리', 'ChatGPT 연결하기', 'AI 응답 테스트')
        : screen.screenKey === 'admin' || screen.screenKey === 'manage.copy'
          ? pick('MANAGE', '서비스 관리.', '고정 문구의 초안, 발행본, 되돌리기 이력을 관리합니다.', '화면 관리', '사용자 관리', '문구 초안', '발행본 이력')
          : screen.screenKey === 'voca.list'
            ? pick('VOCABULARY LIBRARY', '저장된 단어 리스트.', '추가한 공통 목록과 내 개인 단어 목록을 기기와 관계없이 이어서 학습하세요.', '저장된 단어 리스트', '단어 목록 추가 메뉴 열기')
            : screen.screenKey === 'writing.placement'
              ? pick('STARTING LEVEL TEST', 'TEST COMPOSITION', '사전 설정된 진단 문제 · 힌트 없음', '진단 문제를 준비 중입니다.')
              : screen.screenKey === 'writing.ui' || screen.screenKey === 'writing.session'
                ? pick('SOURCE MATERIAL', 'Q.', 'Write your response.', 'MY ANSWER', 'HINT 5 · Paragraphs')
                : own.filter((entry) => !['title', 'description'].includes(entry.variableName)).slice(0, 8);
  const content = <div className="mt-7 grid gap-4 sm:grid-cols-2">{heroItems.length ? heroItems.map((entry, index) => <section key={entry.id} className={`rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 ${index === 0 ? 'sm:col-span-2' : ''}`}><div className="h-2.5 w-16 animate-pulse rounded-full bg-[#ece7dd]" />{node(entry, `${index === 0 ? 'mt-4 block font-serif text-3xl text-[#26353b]' : 'mt-4 block text-sm font-semibold leading-6 text-[#43514e]'}`)}<span className="mt-5 block h-3 w-4/5 animate-pulse rounded-full bg-[#eee9e0]" /><span className="mt-2 block h-3 w-2/3 animate-pulse rounded-full bg-[#eee9e0]" /></section>) : <section className="sm:col-span-2 rounded-3xl border border-dashed border-[#d8d1c5] p-8"><span className="block h-4 w-48 animate-pulse rounded bg-[#e9e4da]" /><span className="mt-4 block h-3 w-full animate-pulse rounded-full bg-[#eee9e0]" /><span className="mt-2 block h-3 w-4/5 animate-pulse rounded-full bg-[#eee9e0]" /></section>}</div>;
  if (screen.screenKey === 'home.landing') return <section id="copy-mockup-editor" className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7"><PreviewHeading screen={screen} texts={texts} /><div className="mt-5 grid grid-cols-[1.1fr_.9fr] gap-9 rounded-2xl bg-[#f7f4ed] p-10"><div>{text(by('TODAY\'S ENGLISH, YOUR WORDS'), 'text-xs font-bold tracking-[0.14em] text-[#d76a47]')}{text(by('영어를,'), 'mt-5 block font-serif text-5xl text-[#1d2935]', 'w-40')}{text(by('매일 한 문장씩.'), 'mt-1 block font-serif text-5xl text-[#1d2935]', 'w-56')}{text(own.find((entry) => entry.variableName === 'description'), 'mt-6 block text-base leading-7 text-[#5e6965]', 'w-80')}{text(by('ChatGPT로 학습 시작'), 'mt-8 inline-block rounded-xl bg-[#1d2935] px-5 py-3 text-sm font-bold text-white')}</div><section className="rounded-3xl border border-[#ded7ca] bg-[#fffdf8] p-7">{['오늘의 연습 흐름', '짧게 작성하기', '피드백 받기', '나만의 기록 만들기'].map((label) => <div key={label} className="mt-4 first:mt-0">{text(by(label), 'text-sm font-semibold text-[#344247]')}<span className="mt-2 block h-3 w-full animate-pulse rounded-full bg-[#eee9e0]" /></div>)}</section></div></section>;
  if (screen.screenKey === 'mypage') return <section id="copy-mockup-editor" className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7"><PreviewHeading screen={screen} texts={texts} /><div className="mt-5 max-w-2xl rounded-3xl border border-[#ded7ca] bg-[#fffdf8] p-8"><div className="size-12 animate-pulse rounded-2xl bg-[#e8f0eb]" />{text(by('MY PAGE'), 'mt-6 text-sm font-semibold text-[#d76a47]') }<span className="mt-3 block h-10 w-52 animate-pulse rounded bg-[#eee9e0]" />{text(by('계정과 학습 기록을 관리하는 공간입니다.'), 'mt-4 block text-sm text-[#69736e]')}</div></section>;
  return <section id="copy-mockup-editor" className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-7"><PreviewHeading screen={screen} texts={texts} /><div className="mt-5 grid grid-cols-[10rem_minmax(0,1fr)_20rem] overflow-hidden rounded-2xl border border-[#ddd6ca] bg-[#f7f4ed]"><div className="border-r border-[#e4ddd2] bg-[#fffdf8] px-4 py-7"><div className="mb-6">{text(shell('Practice'), 'text-[10px] font-bold tracking-[0.16em] text-[#8a918b]')}</div>{shellItems.map((label) => <div key={label} className={`rounded-xl px-3 py-2.5 ${label === (screen.screenKey.startsWith('voca') ? 'VOCA' : screen.screenKey.startsWith('writing') ? 'WRITING' : screen.screenKey.startsWith('speaking') ? 'SPEAKING' : screen.screenKey === 'admin' ? 'MANAGE' : '') ? 'bg-[#eeece6]' : ''}`}>{text(shell(label), 'text-xs font-semibold text-[#66716d]')}</div>)}</div><main className="min-h-[620px] bg-[#f7f4ed] p-9"><header className="border-b border-[#ded7ca] pb-5"><div className="flex items-center justify-between">{text(screen.screenKey.startsWith('voca') ? by('VOCA') : screen.screenKey.startsWith('writing') ? by('WRITING', 'writing.common') : screen.screenKey === 'speaking.part1' ? by('SPEAKING') : by('MANAGE'), 'text-xs font-bold tracking-[0.14em] text-[#d76a47]')}<div className="size-8 animate-pulse rounded-full bg-[#eee9e0]" /></div>{text(title, 'mt-2 block font-serif text-4xl text-[#26353b]', 'w-64')}{text(description, 'mt-3 block max-w-xl text-sm leading-6 text-[#69736e]', 'w-80')}{subnav.length > 0 && <nav className="mt-7 flex gap-1 border-b border-[#d8d1c5]">{subnav.map((label, index) => <span key={label} className={`px-4 py-3 text-xs font-bold ${index === 0 ? 'border-b-2 border-[#26353b] text-[#26353b]' : 'text-[#77807a]'}`}>{text(by(label, screen.screenKey.startsWith('writing') ? 'writing.common' : screen.screenKey), 'text-xs font-bold')}</span>)}</nav>}</header>{content}</main><PreviewEditor selectedEntry={selectedEntry} onChangeEntry={onChangeEntry} onSave={onSave} saving={saving} canSave={canSave} texts={texts} /></div></section>;
}

function PreviewHeading({ screen, texts }: { screen: Screen; texts: { eyebrow: string; title: string; description: string } }) { return <div className="flex items-baseline justify-between border-b border-[#ece7dd] pb-5"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">{texts.eyebrow}</p><h2 className="mt-1 font-serif text-2xl text-[#26353b]">{texts.title}</h2><p className="mt-2 text-sm text-[#69736e]">{texts.description}</p></div><code className="text-xs text-[#718079]">{screen.routePath ?? screen.screenKey}</code></div>; }
function PreviewEditor({ selectedEntry, onChangeEntry, onSave, saving, canSave, texts }: { selectedEntry: Entry | null; onChangeEntry: (draftText: string) => void; onSave: () => void; saving: boolean; canSave: boolean; texts: { editTitle: string; editEmpty: string; source: string; draft: string; save: string } }) { return <aside className="border-l border-[#e4ddd2] bg-[#faf7f0] p-4"><p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">{texts.editTitle}</p>{selectedEntry ? <div className="mt-4"><code className="text-xs font-semibold text-[#45665b]">{selectedEntry.screenKey} · {selectedEntry.variableName}</code>{selectedEntry.description && <p className="mt-1 text-xs leading-5 text-[#78817b]">{selectedEntry.description}</p>}<div className="mt-4"><span className="text-xs font-semibold text-[#69736e]">{texts.source}</span><p className="mt-1 rounded-xl border border-[#e4ddd2] bg-white px-3 py-2 text-xs leading-5 text-[#6b756f]">{selectedEntry.sourceText ?? selectedEntry.draftText}</p></div><label className="mt-4 block text-xs font-semibold text-[#69736e]"><span>{texts.draft}</span><textarea value={selectedEntry.draftText} onChange={(event) => onChangeEntry(event.target.value)} className="mt-1.5 min-h-36 w-full rounded-xl border border-[#d8d1c5] bg-white px-3 py-2.5 text-sm leading-6 text-[#344247] outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label><button type="button" onClick={onSave} disabled={!canSave || saving} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-semibold text-white disabled:opacity-45"><Save className="size-4" />{saving ? '저장 중' : texts.save}</button></div> : <p className="mt-4 text-sm leading-6 text-[#78817b]">{texts.editEmpty}</p>}</aside>; }

function PaginationControls({ ariaLabel, currentPage, totalPages, previousLabel, nextLabel, statusLabel, onPrevious, onNext }: { ariaLabel: string; currentPage: number; totalPages: number; previousLabel: string; nextLabel: string; statusLabel: string; onPrevious: () => void; onNext: () => void }) { return <nav aria-label={ariaLabel} className="mt-4 flex items-center justify-end gap-2"><button type="button" onClick={onPrevious} disabled={currentPage === 1} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d8d1c5] px-3 text-xs font-semibold text-[#4c5a56] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" />{previousLabel}</button><span className="min-w-24 text-center text-xs font-semibold text-[#69736e]">{statusLabel.replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}</span><button type="button" onClick={onNext} disabled={currentPage === totalPages} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d8d1c5] px-3 text-xs font-semibold text-[#4c5a56] disabled:cursor-not-allowed disabled:opacity-40">{nextLabel}<ChevronRight className="size-3.5" /></button></nav>; }
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
