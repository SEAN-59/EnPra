export const vocaTestLabels = {
  english_to_korean: '영어 → 해석 쓰기',
  korean_to_english: '해석 → 영어 쓰기',
  english_choice: '영어 → 해석 4지선다',
  korean_choice: '해석 → 영어 4지선다',
  mixed: '네 가지 유형 섞기',
} as const;
export type VocaTestType = keyof typeof vocaTestLabels;
export type VocaPreferences = {
  studyCount: number;
  testCount: number;
  firstSide: 'english' | 'korean';
  testType: VocaTestType;
};
export type VocaList = {
  id: number;
  title: string;
  scope: 'common' | 'personal';
  wordCount: number;
  knownCount: number;
  neededCount: number;
  studiedCount: number;
};
export type VocaWord = {
  id: number;
  word: string;
  pronunciationIpa?: string;
  meanings: Array<{ partOfSpeech: string; text: string }>;
};
export type VocaSession = {
  id: number;
  listId: number;
  kind: 'study' | 'test';
  scope: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  firstSide: 'english' | 'korean';
  testType: VocaTestType;
  total: number;
  answered: number;
  current:
    | (Partial<VocaWord> & {
        id: number;
        format?: Exclude<VocaTestType, 'mixed'>;
        prompt?: string;
        choices?: Array<{ key: string; label: string }>;
      })
    | null;
  result: {
    known: number;
    needed: number;
    correct: number;
    score: number | null;
    items: Array<
      VocaWord & {
        known?: boolean;
        answer?: string;
        answerLabel?: string;
        correct?: boolean;
        format?: VocaTestType;
      }
    >;
  } | null;
};
export type VocaOverview = {
  preferences: VocaPreferences;
  lists: VocaList[];
  totals: {
    total: number;
    known: number;
    needed: number;
    studied: number;
    tests: number;
  };
  sessions: VocaSession[];
  activity: Array<{ day: string; count: number }>;
};
export async function vocaRequest<T>(
  query: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`/api/vocabulary/learning${query}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(35_000),
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const raw = await response.text();
  let data: T & { error?: string };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('서버 응답을 확인하지 못했습니다. 다시 시도해 주세요.');
  }
  if (!response.ok)
    throw new Error(data.error ?? '단어 학습 요청을 처리하지 못했습니다.');
  return data;
}
export function vocaScopeCount(
  overview: VocaOverview,
  list: VocaList,
  scope: string,
  source?: VocaSession,
) {
  if (scope === 'new') return Math.max(0, list.wordCount - list.studiedCount);
  if (scope === 'needed')
    return source ? (source.result?.needed ?? 0) : list.neededCount;
  if (scope === 'recent')
    return (
      (
        source ??
        overview.sessions.find(
          (session) =>
            session.listId === list.id &&
            session.kind === 'study' &&
            session.status === 'completed',
        )
      )?.total ?? 0
    );
  return list.wordCount;
}
