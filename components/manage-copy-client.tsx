'use client';

import { ArchiveRestore, ChevronDown, FilePlus2, LayoutPanelTop, LoaderCircle, Save, Send, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { useStaticCopy } from '@/components/static-copy-provider';

type Screen = { id: number; screenKey: string; displayName: string; routePath: string | null; sortOrder: number; isActive: boolean };
type Entry = { id: number; screenId: number; screenKey: string; screenLabel: string; variableName: string; locale: string; description: string | null; textFormat: 'plain' | 'multiline'; draftText: string; templateVariables: string[]; maxLength: number | null; draftRevision: number; isActive: boolean; draftUpdatedAt: string };
type Publication = { id: number; version: number; status: 'building' | 'ready' | 'published' | 'failed'; copyCount: number; publishedAt: string | null; createdAt: string; restoredFromPublicationId: number | null; note: string | null };
type Payload = { screens: Screen[]; entries: Entry[]; publications: Publication[]; error?: string };

const blankScreen = { screenKey: '', displayName: '', routePath: '', sortOrder: '0' };
const blankEntry = { screenId: '', variableName: '', locale: 'ko', description: '', draftText: '', templateVariables: '', maxLength: '' };
const errorText = (body: unknown, fallback: string) => body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : fallback;
const dateText = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '아직 없음';
const vars = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export function ManageCopyClient() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [screenOpen, setScreenOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [screenDraft, setScreenDraft] = useState(blankScreen);
  const [entryDraft, setEntryDraft] = useState(blankEntry);
  const [historyOpen, setHistoryOpen] = useState(false);
  const copyTitle = useStaticCopy('manage.copy', 'title', '서비스 문구 관리');
  const copyDescription = useStaticCopy('manage.copy', 'description', '문구는 소속 화면 아래에서 관리합니다.');

  const activeCount = entries.filter((entry) => entry.isActive).length;
  const grouped = useMemo(() => screens.map((screen) => ({ screen, entries: entries.filter((entry) => entry.screenId === screen.id) })).filter((group) => group.entries.length), [screens, entries]);

  async function load(showError = true) {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/copy', { cache: 'no-store' });
      const body = await response.json() as Payload;
      if (!response.ok) throw new Error(errorText(body, '문구 관리 정보를 불러오지 못했습니다.'));
      setScreens(body.screens); setEntries(body.entries); setPublications(body.publications);
    } catch (error) {
      if (showError) toast.add({ title: '문구 관리 정보를 불러오지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function updateEntry(id: number, patch: Partial<Entry>) { setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry)); }

  async function createScreen() {
    try {
      const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-screen', ...screenDraft, sortOrder: Number(screenDraft.sortOrder) }) });
      const body = await response.json() as { screen?: Screen; error?: string };
      if (!response.ok || !body.screen) throw new Error(errorText(body, '소속 화면을 등록하지 못했습니다.'));
      setScreens((current) => [...current, body.screen!].sort((a, b) => a.sortOrder - b.sortOrder || a.screenKey.localeCompare(b.screenKey)));
      setEntryDraft((current) => ({ ...current, screenId: String(body.screen!.id) }));
      setScreenDraft(blankScreen); setScreenOpen(false);
      toast.add({ title: '소속 화면을 등록했어요.', description: '이 화면 안에서는 title 같은 변수명을 자유롭게 사용할 수 있습니다.', type: 'success' });
    } catch (error) { toast.add({ title: '소속 화면을 등록하지 못했어요.', description: error instanceof Error ? error.message : '입력값을 확인해 주세요.', type: 'error', priority: 'high' }); }
  }

  async function createEntry() {
    try {
      const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-entry', ...entryDraft, screenId: Number(entryDraft.screenId), templateVariables: vars(entryDraft.templateVariables), maxLength: entryDraft.maxLength === '' ? null : Number(entryDraft.maxLength), textFormat: 'plain' }) });
      const body = await response.json() as { entry?: Entry; error?: string };
      if (!response.ok || !body.entry) throw new Error(errorText(body, '새 문구를 등록하지 못했습니다.'));
      setEntries((current) => [...current, body.entry!]); setEntryDraft(blankEntry); setEntryOpen(false);
      toast.add({ title: '새 문구 초안을 등록했어요.', description: '발행본을 만들기 전까지 서비스 화면에는 반영되지 않습니다.', type: 'success' });
    } catch (error) { toast.add({ title: '새 문구를 등록하지 못했어요.', description: error instanceof Error ? error.message : '입력값을 확인해 주세요.', type: 'error', priority: 'high' }); }
  }

  async function saveEntry(entry: Entry) {
    setSavingId(entry.id);
    try {
      const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-entry', entryId: entry.id, draftRevision: entry.draftRevision, screenId: entry.screenId, locale: entry.locale, description: entry.description ?? '', textFormat: entry.textFormat, draftText: entry.draftText, templateVariables: entry.templateVariables, maxLength: entry.maxLength, isActive: entry.isActive }) });
      const body = await response.json() as { entry?: Entry; error?: string };
      if (!response.ok || !body.entry) throw new Error(errorText(body, '문구를 저장하지 못했습니다.'));
      updateEntry(entry.id, body.entry); toast.add({ title: '초안을 저장했어요.', description: '아직 서비스 화면에는 반영되지 않습니다.', type: 'success' });
    } catch (error) {
      toast.add({ title: '초안을 저장하지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
      if (error instanceof Error && error.message.includes('새로고침')) void load(false);
    } finally { setSavingId(null); }
  }

  async function publish(publicationId?: number) {
    setPublishing(true);
    try {
      const note = window.prompt(publicationId ? '되돌린 이유를 기록할까요? (선택)' : '이번 발행본에 남길 메모가 있나요? (선택)') ?? '';
      const response = await fetch('/api/admin/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(publicationId ? { action: 'restore-publication', publicationId, note } : { action: 'create-publication', note }) });
      const body = await response.json() as { publication?: Publication; error?: string };
      if (!response.ok || !body.publication) throw new Error(errorText(body, '발행본을 만들지 못했습니다.'));
      setPublications((current) => [body.publication!, ...current]);
      toast.add({ title: `발행본 v${body.publication.version}을 만들었어요.`, description: '화면별 정적 JSON이 준비되었습니다.', type: 'success', priority: 'high' });
    } catch (error) { toast.add({ title: '발행본을 만들지 못했어요.', description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.', type: 'error', priority: 'high' });
    } finally { setPublishing(false); }
  }

  if (loading) return <section className="mt-8 grid min-h-64 place-items-center rounded-3xl border border-[#dcd6ca] bg-[#fffdf8]"><span className="inline-flex items-center gap-2 text-sm text-[#6d756f]"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />문구 관리 정보를 불러오는 중이에요.</span></section>;
  const latest = publications[0];
  return <section className="mt-8 space-y-6">
    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">STATIC COPY</p><h2 className="mt-2 font-serif text-2xl text-[#26353b] sm:text-3xl">{copyTitle}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69736e]">{copyDescription} 그래서 라이팅 학습하기와 VOCA에도 각각 <code className="rounded bg-[#f1eee7] px-1 py-0.5">title</code>을 둘 수 있어요.</p></div><button type="button" onClick={() => void publish()} disabled={publishing || !activeCount} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1d2935] px-5 text-sm font-semibold text-white disabled:opacity-45"><Send className="size-4" aria-hidden="true" />{publishing ? '발행본 생성 중' : '발행본 만들기'}</button></div><div className="mt-5 grid gap-3 border-t border-[#ece7dd] pt-5 sm:grid-cols-3"><Metric label="소속 화면" value={String(screens.length)} /><Metric label="활성 문구" value={String(activeCount)} /><Metric label="최근 발행본" value={latest ? `v${latest.version}` : '—'} /></div><p className="mt-4 rounded-xl border border-[#eadfce] bg-[#fffaf3] px-3 py-2 text-xs leading-5 text-[#756c60]">발행본 JSON은 화면 키가 최상단에 오도록 생성됩니다. 사이트는 이 발행본을 캐시된 정적 JSON으로 읽습니다.</p></section>

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><SectionHead eyebrow="SCREENS" title="소속 화면" action={<button type="button" onClick={() => setScreenOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9d2c6] px-4 text-sm font-semibold text-[#43514e]"><LayoutPanelTop className="size-4" />화면 등록</button>} />{screenOpen && <section className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf4] p-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="화면 변수명" value={screenDraft.screenKey} placeholder="writing.practice" onChange={(screenKey) => setScreenDraft((v) => ({ ...v, screenKey }))} /><Field label="화면명" value={screenDraft.displayName} placeholder="라이팅 학습하기" onChange={(displayName) => setScreenDraft((v) => ({ ...v, displayName }))} /><Field label="경로" value={screenDraft.routePath} placeholder="/writing/practice" onChange={(routePath) => setScreenDraft((v) => ({ ...v, routePath }))} /><Field label="정렬 순서" type="number" value={screenDraft.sortOrder} placeholder="0" onChange={(sortOrder) => setScreenDraft((v) => ({ ...v, sortOrder }))} /></div><Actions onCancel={() => { setScreenOpen(false); setScreenDraft(blankScreen); }} onSubmit={() => void createScreen()} label="화면 등록" /></section>}<div className="mt-5 flex flex-wrap gap-2">{screens.length ? screens.map((screen) => <span key={screen.id} className="rounded-xl border border-[#e3ddd2] bg-[#fffefb] px-3 py-2 text-xs"><strong className="font-mono text-[#45665b]">{screen.screenKey}</strong><span className="mx-1.5 text-[#b1aba0]">·</span><span className="text-[#69736e]">{screen.displayName}</span></span>) : <p className="text-sm text-[#77807a]">먼저 문구를 묶을 화면을 등록해 주세요.</p>}</div></section>

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><SectionHead eyebrow="DRAFTS" title="문구 초안" action={<button type="button" disabled={!screens.length} onClick={() => setEntryOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9d2c6] px-4 text-sm font-semibold text-[#43514e] disabled:opacity-45"><FilePlus2 className="size-4" />새 문구</button>} />{entryOpen && <section className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf4] p-4"><div className="grid gap-3 sm:grid-cols-2"><ScreenSelect value={entryDraft.screenId} screens={screens} onChange={(screenId) => setEntryDraft((v) => ({ ...v, screenId }))} /><Field label="변수명" value={entryDraft.variableName} placeholder="title" onChange={(variableName) => setEntryDraft((v) => ({ ...v, variableName }))} /><Field label="언어" value={entryDraft.locale} placeholder="ko" onChange={(locale) => setEntryDraft((v) => ({ ...v, locale }))} /><Field label="글자 수 제한" type="number" value={entryDraft.maxLength} placeholder="선택" onChange={(maxLength) => setEntryDraft((v) => ({ ...v, maxLength }))} /></div><Field className="mt-3" label="관리 메모" value={entryDraft.description} placeholder="표시 위치와 목적" onChange={(description) => setEntryDraft((v) => ({ ...v, description }))} /><Field className="mt-3" label="치환 변수 (쉼표로 구분)" value={entryDraft.templateVariables} placeholder="display_name, count" onChange={(templateVariables) => setEntryDraft((v) => ({ ...v, templateVariables }))} /><CopyText value={entryDraft.draftText} onChange={(draftText) => setEntryDraft((v) => ({ ...v, draftText }))} /><Actions onCancel={() => { setEntryOpen(false); setEntryDraft(blankEntry); }} onSubmit={() => void createEntry()} label="초안 등록" /></section>}{!entries.length ? <div className="mt-5 rounded-2xl border border-dashed border-[#d8d0c2] px-5 py-12 text-center"><SlidersHorizontal className="mx-auto size-5 text-[#9ba39d]" /><p className="mt-3 font-medium text-[#43514e]">아직 등록된 문구가 없습니다.</p><p className="mt-1 text-sm text-[#77807a]">소속 화면을 선택하고 title 같은 변수명으로 문구를 등록하세요.</p></div> : <div className="mt-5 space-y-5">{grouped.map(({ screen, entries: group }) => <section key={screen.id}><div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-[#edf2ef] px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-[#45665b]">{screen.screenKey}</span><span className="text-xs text-[#818983]">{screen.displayName} · {group.length}개</span></div><div className="space-y-3">{group.map((entry) => <EntryEditor key={entry.id} entry={entry} screens={screens} saving={savingId === entry.id} onChange={(patch) => updateEntry(entry.id, patch)} onSave={() => void saveEntry(entry)} />)}</div></section>)}</div>}</section>

    <section className="rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 sm:p-7"><button type="button" onClick={() => setHistoryOpen((v) => !v)} className="flex w-full items-center justify-between text-left"><span><span className="block text-xs font-bold tracking-[0.16em] text-[#d76a47]">RELEASE HISTORY</span><span className="mt-1 block font-serif text-2xl text-[#26353b]">발행본 이력</span></span><ChevronDown className={`size-5 transition-transform ${historyOpen ? 'rotate-180' : ''}`} /></button>{historyOpen && <div className="mt-5 space-y-3 border-t border-[#ece7dd] pt-5">{!publications.length ? <p className="text-sm text-[#77807a]">아직 만든 발행본이 없습니다.</p> : publications.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-[#e3ddd2] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong className="font-serif text-xl">v{item.version}</strong><span className="rounded-full bg-[#e9f3ed] px-2 py-0.5 text-[11px] font-bold text-[#3f7158]">{item.status === 'published' ? '사이트 반영 완료' : item.status === 'ready' ? '발행본 생성됨' : item.status === 'failed' ? '생성 실패' : item.status}</span></div><p className="mt-1 text-xs text-[#747c76]">{item.copyCount}개 문구 · {dateText(item.publishedAt ?? item.createdAt)}{item.restoredFromPublicationId ? ` · v${item.restoredFromPublicationId}에서 복원` : ''}</p></div><button type="button" onClick={() => void publish(item.id)} disabled={publishing} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#d9d2c6] px-3 text-xs font-semibold text-[#43514e] disabled:opacity-45"><ArchiveRestore className="size-3.5" />이 버전으로 되돌리기</button></article>)}</div>}</section>
  </section>;
}

function SectionHead({ eyebrow, title, action }: { eyebrow: string; title: string; action: React.ReactNode }) { return <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.16em] text-[#d76a47]">{eyebrow}</p><h2 className="mt-1 font-serif text-2xl text-[#26353b]">{title}</h2></div>{action}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#f5f2ea] px-4 py-3"><span className="block text-xs font-semibold text-[#7a827c]">{label}</span><strong className="mt-1 block font-serif text-2xl text-[#2a393d]">{value}</strong></div>; }
function Field({ label, value, placeholder, onChange, type = 'text', className = '' }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; type?: 'text' | 'number'; className?: string }) { return <label className={`block text-xs font-semibold text-[#65706a] ${className}`}><span>{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#dcd6ca] bg-white px-3 text-sm outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label>; }
function ScreenSelect({ value, screens, onChange }: { value: string; screens: Screen[]; onChange: (value: string) => void }) { return <label className="block text-xs font-semibold text-[#65706a]"><span>소속 화면</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#dcd6ca] bg-white px-3 text-sm outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]"><option value="">선택하세요</option>{screens.filter((screen) => screen.isActive).map((screen) => <option key={screen.id} value={screen.id}>{screen.displayName} · {screen.screenKey}</option>)}</select></label>; }
function CopyText({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <label className="mt-3 block text-xs font-semibold text-[#65706a]"><span>문구</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="사용자에게 보이는 문구를 입력하세요." className="mt-1.5 min-h-24 w-full rounded-xl border border-[#dcd6ca] bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#cf7355] focus:ring-2 focus:ring-[#f3d7ca]" /></label>; }
function Actions({ onCancel, onSubmit, label }: { onCancel: () => void; onSubmit: () => void; label: string }) { return <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} className="h-10 px-4 text-sm font-semibold text-[#66706d]">취소</button><button type="button" onClick={onSubmit} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-semibold text-white"><Save className="size-4" />{label}</button></div>; }
function EntryEditor({ entry, screens, saving, onChange, onSave }: { entry: Entry; screens: Screen[]; saving: boolean; onChange: (patch: Partial<Entry>) => void; onSave: () => void }) { const overflow = entry.maxLength !== null && entry.draftText.length > entry.maxLength; return <article className={`rounded-2xl border p-4 ${entry.isActive ? 'border-[#e1dbcf] bg-[#fffefb]' : 'border-[#e5ddd5] bg-[#f7f4ef] opacity-75'}`}><div className="flex justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-[#48665c]">{entry.variableName}</p><p className="mt-1 text-xs text-[#7a827c]">초안 v{entry.draftRevision} · {dateText(entry.draftUpdatedAt)}</p></div><label className="inline-flex items-center gap-2 text-xs font-semibold text-[#6e7771]"><input type="checkbox" checked={entry.isActive} onChange={(event) => onChange({ isActive: event.target.checked })} className="size-4 accent-[#436b59]" />활성</label></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ScreenSelect value={String(entry.screenId)} screens={screens} onChange={(value) => { const screen = screens.find((item) => item.id === Number(value)); onChange({ screenId: Number(value), screenKey: screen?.screenKey ?? entry.screenKey, screenLabel: screen?.displayName ?? entry.screenLabel }); }} /><Field label="언어" value={entry.locale} placeholder="ko" onChange={(locale) => onChange({ locale })} /><Field label="글자 수 제한" type="number" value={entry.maxLength === null ? '' : String(entry.maxLength)} placeholder="선택" onChange={(value) => onChange({ maxLength: value === '' ? null : Number(value) })} /><Field label="치환 변수" value={entry.templateVariables.join(', ')} placeholder="display_name, count" onChange={(value) => onChange({ templateVariables: vars(value) })} /></div><Field className="mt-3" label="관리 메모" value={entry.description ?? ''} placeholder="표시 위치와 목적" onChange={(description) => onChange({ description })} /><CopyText value={entry.draftText} onChange={(draftText) => onChange({ draftText })} /><div className="mt-3 flex items-center justify-between gap-3"><span className={`text-xs ${overflow ? 'font-semibold text-[#b35b43]' : 'text-[#87908a]'}`}>{entry.draftText.length}{entry.maxLength !== null ? ` / ${entry.maxLength}` : '자'}</span><button type="button" disabled={saving || overflow} onClick={onSave} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1d2935] px-3.5 text-xs font-semibold text-white disabled:opacity-45"><Save className="size-3.5" />{saving ? '저장 중' : '초안 저장'}</button></div></article>; }
