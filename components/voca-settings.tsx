'use client';
import { Settings2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  vocaTestLabels,
  type VocaPreferences,
  type VocaTestType,
} from '@/lib/voca-learning';

export function VocaSettings({
  preferences,
  onSave,
}: {
  preferences: VocaPreferences;
  onSave: (preferences: VocaPreferences) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const field =
    'mt-2 h-12 w-full rounded-xl border border-[#dcd6ca] bg-white px-4 text-base';
  return (
    <>
      <button
        type="button"
        aria-label="단어 학습 설정 열기"
        onClick={() => {
          setDraft(preferences);
          setError('');
          dialog.current?.showModal();
        }}
        className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#dcd6ca] bg-[#fffdf8] px-4 text-sm font-semibold"
      >
        <Settings2 className="size-4" />
        학습 설정
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="voca-settings-title"
        className="m-auto w-[min(480px,calc(100vw-32px))] rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 text-[#203b35] shadow-xl backdrop:bg-black/30"
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (saving) return;
            setSaving(true);
            setError('');
            try {
              await onSave(draft);
              dialog.current?.close();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : '설정을 저장하지 못했습니다.',
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="voca-settings-title" className="text-2xl font-semibold">
              학습 설정
            </h2>
            <button
              type="button"
              aria-label="설정 닫기"
              onClick={() => dialog.current?.close()}
              className="grid size-12 place-items-center rounded-xl"
            >
              <X className="size-6" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#666]">
            다음 학습부터 적용해요. 진행 중인 학습 구성은 유지돼요.
          </p>
          <label className="mt-6 block text-sm font-semibold">
            한 번에 학습할 단어 수
            <input
              className={field}
              type="number"
              min={1}
              max={100}
              required
              value={draft.studyCount}
              onChange={(event) =>
                setDraft({ ...draft, studyCount: Number(event.target.value) })
              }
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            카드 첫 화면
            <select
              className={field}
              value={draft.firstSide}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  firstSide: event.target.value as 'english' | 'korean',
                })
              }
            >
              <option value="english">영어 먼저 보기</option>
              <option value="korean">해석 먼저 보기</option>
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold">
            기본 테스트 문제 수
            <input
              className={field}
              type="number"
              min={1}
              max={100}
              required
              value={draft.testCount}
              onChange={(event) =>
                setDraft({ ...draft, testCount: Number(event.target.value) })
              }
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            기본 테스트 유형
            <select
              className={field}
              value={draft.testType}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  testType: event.target.value as VocaTestType,
                })
              }
            >
              {Object.entries(vocaTestLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            disabled={saving}
            type="submit"
            className="mt-6 h-12 w-full rounded-xl bg-[#203b35] font-semibold text-white disabled:opacity-50"
          >
            {saving ? '저장하고 있어요…' : '설정 저장하기'}
          </button>
        </form>
      </dialog>
    </>
  );
}
