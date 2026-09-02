import type { Context, Hono } from 'hono';
import type { Pool, PoolClient } from 'pg';

import type { CodexRegistry } from './codex.js';

type UserContext = { id: string; displayName: string };
type Variables = { user: UserContext };
type PublicLevel = 'foundation' | '5.0' | '5.5' | '6.0' | '6.5' | '7.0';
type SessionType = 'learning' | 'test' | 'promotion_test' | 'placement_test';
type TaskType = 'task1' | 'task2' | 'foundation';
type IELTSWritingTask = 'task1' | 'task2';
type LearningMode = 'standard' | 'reinforcement';
type FocusSkill = {
  code: string;
  taskScope: 'task1' | 'task2' | 'both' | 'foundation';
};

const WRITING_RULE_VERSION = 'v3';

const levelOrder: PublicLevel[] = [
  'foundation',
  '5.0',
  '5.5',
  '6.0',
  '6.5',
  '7.0',
];
const task1Formats = [
  ['bar_chart', 31],
  ['line_chart', 21],
  ['pie_chart', 16],
  ['table', 13],
  ['diagram', 10],
  ['map', 9],
] as const;
const task2Formats = [
  ['two_views', 34],
  ['opinion', 33],
  ['advantages_disadvantages', 20],
  ['two_part', 7],
  ['causes_solutions', 6],
] as const;

const skills = [
  ['t1_trend_description', '증가·감소 표현', 'task1'],
  ['t1_comparison', '수치 비교', 'task1'],
  ['t1_overview', 'Overview 작성', 'task1'],
  ['t1_map_direction', '지도·방향 표현', 'task1'],
  ['t1_process_description', '과정·다이어그램 설명', 'task1'],
  ['t2_position', '의견 제시', 'task2'],
  ['t2_reasoning', '이유와 설명 전개', 'task2'],
  ['t2_example', '예시 활용', 'task2'],
  ['t2_counterargument', '대조·반론 처리', 'task2'],
  ['grammar_sentence_structure', '문장 구조 정확성', 'both'],
  ['grammar_linking', '논리 연결', 'both'],
  ['lexical_precision', '어휘 선택의 정확성', 'both'],
] as const;

const assessmentExpectations: Record<
  string,
  { label: string; task1: string; task2: string }
> = {
  foundation: {
    label: 'FOUNDATION',
    task1:
      '자료에서 사실을 찾아 정확한 기초 문장 3개를 만든다. 완전한 IELTS 답안이나 Band 판정은 하지 않는다.',
    task2:
      '의견, 이유, 예시를 기초 문장으로 정확히 연결한다. 완전한 IELTS 답안이나 Band 판정은 하지 않는다.',
  },
  '5.0A': {
    label: '5.0A',
    task1:
      '제시 템플릿을 활용해 수치·변화 표현을 정확히 쓴다. 단순 문장의 정확성이 우선이며 짧은 답안이 허용된다.',
    task2:
      '제시 템플릿으로 의견과 한 가지 이유를 연결한다. 기본 문장 구조와 핵심 동사 패턴의 정확성이 우선이다.',
  },
  '5.0B': {
    label: '5.0B',
    task1:
      '기본 Overview 또는 비교 문장을 포함하고, 선택한 수치가 자료와 일치해야 한다. 단순 연결은 허용하되 반복 오류는 감점한다.',
    task2:
      '분명한 입장과 이유·간단한 설명을 갖춘다. 문단 구조를 시도하고 기본 연결어를 정확히 사용해야 한다.',
  },
  '5.0C': {
    label: '5.0C',
    task1:
      '공식 Band 5 수준을 목표로 한다. 전체 추세를 언급하고 핵심 특징 2개 이상을 자료에 맞게 설명한다. 세부 나열만 하거나 Overview가 없으면 크게 감점한다. 기본 비교·증감 어휘와 단순·일부 복문을 의미가 전달되도록 쓴다.',
    task2:
      '공식 Band 5 수준을 목표로 한다. 질문의 모든 부분에 답하고 명확한 입장, 이유 2개, 최소 한 번의 설명 또는 예시를 갖춘다. 조직은 보이지만 다소 기계적인 연결과 제한된 어휘·복문 오류는 허용한다.',
  },
  '5.0D': {
    label: '5.0D',
    task1:
      'Band 5를 안정적으로 넘어서는 단계다. Overview와 핵심 비교를 분명히 하고, 자료 오류 없이 선택한 특징을 충분히 뒷받침한다. 반복적 문법 오류나 기계적 나열은 높은 점수를 제한한다.',
    task2:
      'Band 5를 안정적으로 넘어서는 단계다. 입장과 각 근거를 설명·예시로 발전시키며 문단 흐름을 유지한다. 어휘 반복을 줄이고 간단한 복문을 통제해야 한다.',
  },
  '5.5A': {
    label: '5.5A',
    task1:
      'Band 5.5에 가까운 수행을 요구한다. 핵심 추세와 비교를 선별해 명확히 제시하고, 데이터 설명을 기계적으로 나열하지 않는다.',
    task2:
      'Band 5.5에 가까운 수행을 요구한다. 모든 요구에 답하고 근거를 충분히 전개한다. 문단별 중심 생각과 연결이 분명해야 한다.',
  },
  '5.5B': {
    label: '5.5B',
    task1:
      'Band 6 진입 기준이다. 명확한 Overview, 적절한 범주화와 비교, 대체로 정확한 자료 전달이 필요하다. 어휘와 문장 구조에 어느 정도 유연성을 보여야 한다.',
    task2:
      'Band 6 진입 기준이다. 분명한 입장과 관련성 있는 근거를 충분히 발전시키고, 일관된 문단 구조와 대체로 정확한 어휘·문법을 보여야 한다.',
  },
  '6.0A': {
    label: '6.0A',
    task1:
      '공식 Band 6 수준을 목표로 한다. 핵심 특징을 적절히 선택하고 명확한 Overview와 비교를 제시한다. 정보 순서와 연결은 대체로 논리적이어야 하며, 어휘는 적절하고 문법 오류가 의미를 방해하면 안 된다.',
    task2:
      '공식 Band 6 수준을 목표로 한다. 질문 전부에 답하며 입장과 주된 생각을 충분히 발전시킨다. 논리적 문단 구성, 적절한 연결, 대체로 정확한 어휘·복문 사용이 필요하다.',
  },
  '6.0B': {
    label: '6.0B',
    task1:
      'Band 6을 안정적으로 수행한다. 여러 특징의 관계와 예외를 정확히 다루며, 비교와 범주화가 자연스럽다. 부정확한 데이터 해석·반복적 언어는 높은 점수를 제한한다.',
    task2:
      'Band 6을 안정적으로 수행한다. 근거를 구체적으로 발전시키고 반대 관점 또는 한계를 필요할 때 적절히 처리한다. 어휘 선택과 복문 정확성에 더 높은 통제를 요구한다.',
  },
  '6.5A': {
    label: '6.5A',
    task1:
      'Band 7로 가는 준비 단계다. 가장 중요한 추세를 선별해 Overview에서 명확히 강조하고, 비교를 정확하고 효율적으로 전개한다. 제한된 오류만 허용한다.',
    task2:
      'Band 7로 가는 준비 단계다. 입장을 일관되게 유지하고 근거를 충분히 확장한다. 문단 간 흐름, 정확한 어휘 선택, 다양한 문장 구조를 요구한다.',
  },
  '6.5B': {
    label: '6.5B',
    task1:
      'Band 7에 가까운 수행을 요구한다. Overview, 범주화, 핵심 차이를 모두 명확히 보여 주고 일부 누락만 허용한다. 유연한 연결과 비교적 정교한 데이터 언어가 필요하다.',
    task2:
      'Band 7에 가까운 수행을 요구한다. 질문 요구를 모두 다루고, 논리를 충분히 발전시키며, 응집 장치를 과도하게 사용하지 않는다. 정확하고 유연한 어휘·문법을 요구한다.',
  },
  '7.0A': {
    label: '7.0A',
    task1:
      '공식 Band 7 수준을 목표로 한다. 자료의 핵심 추세·차이·예외를 선별한 명확한 Overview와 정확한 범주화가 필수다. 세부는 비교를 뒷받침해야 하며, 누락은 최소여야 한다. 어휘는 유연하고 정확해야 하고, 다양한 문장 구조의 오류는 드물며 의미를 방해하면 안 된다.',
    task2:
      '공식 Band 7 수준을 목표로 한다. 모든 질문 요구에 직접 답하고 일관된 입장을 유지하며, 논거를 충분히 발전시킨다. 아이디어는 논리적으로 진행되고 문단·응집 장치는 유연하게 사용되어야 한다. 어휘는 비교적 정확하고 유연해야 하며, 다양한 복문 구조를 대체로 정확히 통제해야 한다.',
  },
  '7.0B': {
    label: '7.0B',
    task1:
      'Band 7을 안정적으로 넘는 수행을 요구한다. 핵심 특징의 선택과 설명이 매우 정확하고 효율적이며, 데이터 언어·응집·문법에서 체계적 오류가 없어야 한다.',
    task2:
      'Band 7을 안정적으로 넘는 수행을 요구한다. 견해와 근거를 깊이 있고 균형 있게 발전시키며, 정밀한 어휘와 폭넓은 문장 구조를 자연스럽게 통제해야 한다.',
  },
};

const stageQualityControls: Record<string, string> = {
  foundation:
    '유연하게 채점한다. 단어·표현 반복은 감점하지 않으며 고급 어휘, paraphrase, 복문을 요구하지 않는다. 자료 또는 주제에 맞는 완전한 기초 문장 3개와 기본 주어-동사 일치, 핵심 시제·전치사 오류가 의미를 막지 않는지만 본다. 연결어는 없어도 되고, 한두 개의 기본 연결만 정확하면 충분하다.',
  '5.0A':
    '템플릿 학습 단계다. 같은 표현·문장 틀의 반복은 허용한다. 고급 어휘나 복문을 요구하지 않고, 수치·변화·의견 표현의 기본 형태가 정확한지, 단순문이 완전한지만 우선 평가한다. 기본 연결어 하나를 정확히 쓰면 충분하다.',
  '5.0B':
    '기본 표현 반복은 허용하지만 같은 문장 틀과 연결어만 계속 쓰면 Coherence 또는 Lexical 점수를 제한한다. 쉬운 어휘를 정확히 쓰는 것이 고급 어휘를 무리하게 쓰는 것보다 낫다. 단순문 중심이어도 되지만 복문을 일부 시도하고, 기본 연결어를 틀리지 않아야 한다.',
  '5.0C':
    '제한적인 반복은 허용한다. 다만 대체 가능한 쉬운 핵심 단어·표현이나 같은 연결어를 불필요하게 계속 쓰면 감점한다. 질문 문구를 그대로 복사하지 말고 가능한 범위에서 바꿔 쓴다. 조직은 보이면 되며 다소 기계적인 연결은 허용한다. 단순문 정확성이 우선이지만 일부 복문을 시도해야 한다.',
  '5.0D':
    '반복되는 어휘·문장 틀·연결어를 줄여야 한다. 같은 의미의 기본 대체 표현을 상황에 맞게 활용하고, 문단 안에서 이유·설명·예시를 자연스럽게 연결해야 한다. 단순·복문을 섞되 복문 오류가 반복되면 높은 점수를 제한한다. 질문 문구의 단순 복사는 감점한다.',
  '5.5A':
    '불필요한 어휘와 연결어 반복은 Lexical·Coherence 점수를 제한한다. 정확한 기본 어휘에 더해 일부 적절한 대체 표현과 collocation을 보여야 한다. 문단별 중심 생각이 분명하고, 연결어는 논리 관계가 있을 때만 사용한다. 단순·복문을 섞어 쓰되 오류가 의미를 방해하면 안 된다.',
  '5.5B':
    '어휘 선택은 대체로 정확하고 적절해야 하며, 반복을 줄이기 위한 무리한 동의어 사용은 오히려 감점한다. 연결어 남용이나 기계적 문장 연결은 허용하지 않는다. reference·대명사·문장 구조 변화로 자연스럽게 이어야 하며, 복문 오류는 가끔만 허용한다.',
  '6.0A':
    '같은 쉬운 단어·표현·문장 틀의 불필요한 반복은 감점한다. 문맥에 맞는 paraphrase와 정확한 collocation을 사용하고, 연결어뿐 아니라 reference와 문단 구조로 응집을 만든다. 다양한 문장 구조를 사용하되 오류가 반복되거나 의미를 방해하면 높은 점수를 제한한다.',
  '6.0B':
    '표현의 범위와 정확성을 더 엄격히 본다. 핵심 전문 용어의 필요한 반복은 허용하지만, 대체 가능한 반복·어색한 동의어·연결어 남용은 감점한다. 복문과 다양한 구조를 대체로 통제해야 하며, 문단과 문장 사이의 흐름은 자연스러워야 한다.',
  '6.5A':
    '어휘는 정확성과 유연성을 모두 보여야 한다. 같은 표현을 반복하지 않고 적절한 paraphrase·collocation을 활용하되, 부정확한 고급어휘 사용은 감점한다. 응집 장치는 눈에 띄게 나열하지 않고 자연스럽게 사용한다. 다양한 문장 구조의 오류는 제한적이어야 한다.',
  '6.5B':
    '반복·과도한 연결어·질문 문구 복사는 높은 점수를 제한한다. 정확하고 비교적 폭넓은 어휘, 자연스러운 reference, 유연한 문장 연결이 필요하다. 복문을 포함한 다양한 구조를 대체로 정확히 통제해야 하며, 체계적 문법 오류는 허용하지 않는다.',
  '7.0A':
    '불필요한 어휘·표현·문장 틀 반복이 거의 없어야 한다. 문맥에 맞는 정교한 paraphrase와 정확한 collocation을 사용하되 과장되거나 부정확한 고급어휘는 감점한다. 연결어를 기계적으로 나열하지 않고 reference·문단 구조·문장 흐름으로 자연스러운 응집을 만든다. 단순·복문을 유연하게 사용하고 오류는 드물며 의미를 방해하면 안 된다.',
  '7.0B':
    'Band 7 이상 안정화 기준이다. 반복은 의도적 강조나 필수 용어를 제외하면 거의 없어야 하며, 폭넓고 정밀한 어휘와 자연스러운 collocation을 안정적으로 통제해야 한다. 응집 장치는 거의 눈에 띄지 않을 정도로 자연스럽고, 다양한 문장 구조의 체계적 오류·어색한 표현·기계적 문단 연결은 높은 점수를 제한한다.',
};

const stageConfig: Array<
  [PublicLevel, string | null, string, Record<string, unknown>]
> = [
  [
    'foundation',
    null,
    'foundation',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 78,
      challengeRatio: 0,
      targetSentenceCount: 3,
      expectation: assessmentExpectations.foundation,
    },
  ],
  [
    '5.0',
    '5.0_basic',
    '5.0A',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 78,
      challengeRatio: 0,
      targetWordCounts: { task1: 70, task2: 100 },
      expectation: assessmentExpectations['5.0A'],
    },
  ],
  [
    '5.0',
    '5.0_basic',
    '5.0B',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 80,
      challengeRatio: 0,
      targetWordCounts: { task1: 100, task2: 170 },
      expectation: assessmentExpectations['5.0B'],
    },
  ],
  [
    '5.0',
    null,
    '5.0C',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 82,
      challengeRatio: 0,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['5.0C'],
    },
  ],
  [
    '5.0',
    null,
    '5.0D',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 84,
      challengeRatio: 0,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['5.0D'],
    },
  ],
  [
    '5.5',
    null,
    '5.5A',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 80,
      challengeRatio: 0,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['5.5A'],
    },
  ],
  [
    '5.5',
    null,
    '5.5B',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 84,
      challengeRatio: 0,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['5.5B'],
    },
  ],
  [
    '6.0',
    null,
    '6.0A',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 80,
      challengeRatio: 10,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['6.0A'],
    },
  ],
  [
    '6.0',
    null,
    '6.0B',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 84,
      challengeRatio: 10,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['6.0B'],
    },
  ],
  [
    '6.5',
    null,
    '6.5A',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 82,
      challengeRatio: 25,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['6.5A'],
    },
  ],
  [
    '6.5',
    null,
    '6.5B',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 86,
      challengeRatio: 25,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['6.5B'],
    },
  ],
  [
    '7.0',
    null,
    '7.0A',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 84,
      challengeRatio: 30,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['7.0A'],
    },
  ],
  [
    '7.0',
    null,
    '7.0B',
    {
      minEvidence: 6,
      scoreWindowDays: 14,
      promotionScore: 88,
      challengeRatio: 30,
      targetWordCounts: { task1: 150, task2: 250 },
      expectation: assessmentExpectations['7.0B'],
    },
  ],
];

function configForStage(stage: string) {
  return stageConfig.find((row) => row[2] === stage)?.[3] ?? {};
}

function targetWordCountFor(stage: string, task: TaskType) {
  if (task === 'foundation') return null;
  const counts = configForStage(stage).targetWordCounts as
    | Partial<Record<IELTSWritingTask, unknown>>
    | undefined;
  return Math.max(0, number(counts?.[task], 0)) || null;
}

function expectationFor(stage: string, task: TaskType) {
  const expectation = configForStage(stage).expectation as
    | { label?: unknown; task1?: unknown; task2?: unknown }
    | undefined;
  if (task === 'foundation') return text(expectation?.task1, 4000);
  return text(expectation?.[task], 4000);
}

function qualityControlsFor(stage: string) {
  return stageQualityControls[stage] ?? stageQualityControls.foundation;
}

function pickWeighted<T extends ReadonlyArray<readonly [string, number]>>(
  items: T,
): T[number][0] {
  const pick = Math.random() * 100;
  let total = 0;
  for (const [value, weight] of items) {
    total += weight;
    if (pick <= total) return value;
  }
  return items[items.length - 1][0];
}

function stageFor(publicLevel: PublicLevel, group: string | null = null) {
  if (publicLevel === 'foundation') return 'foundation';
  if (publicLevel === '5.0') return group === '5.0_basic' ? '5.0A' : '5.0C';
  return `${publicLevel}A`;
}

function groupFor(stage: string) {
  return stage === '5.0A' || stage === '5.0B' ? '5.0_basic' : null;
}

function levelLabel(level: string, group?: string | null) {
  if (level === 'foundation') return 'FOUNDATION';
  return group === '5.0_basic' ? '5.0 기본반' : level;
}

function jsonObject(value: string): Record<string, unknown> {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start)
    throw new Error('AI 응답에서 JSON을 찾지 못했습니다.');
  const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('AI 응답 형식이 올바르지 않습니다.');
  return parsed as Record<string, unknown>;
}

function text(value: unknown, max = 12000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function number(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}
function bool(value: unknown) {
  return value === true;
}

function criterionRows(evaluation: Record<string, unknown>, task: TaskType) {
  const criteria =
    evaluation.criteria && typeof evaluation.criteria === 'object'
      ? (evaluation.criteria as Record<string, unknown>)
      : {};
  const fallback = Math.max(0, Math.min(100, number(evaluation.rawScore, 50)));
  const taskCriterion = task === 'task2' ? 'task_response' : 'task_achievement';
  return [
    {
      code: taskCriterion,
      score: Math.max(
        0,
        Math.min(100, number(criteria.taskAchievementOrResponse, fallback)),
      ),
      evidence: text(criteria.taskAchievementOrResponseEvidence, 1000),
    },
    {
      code: 'coherence_cohesion',
      score: Math.max(
        0,
        Math.min(100, number(criteria.coherenceCohesion, fallback)),
      ),
      evidence: text(criteria.coherenceCohesionEvidence, 1000),
    },
    {
      code: 'lexical_resource',
      score: Math.max(
        0,
        Math.min(100, number(criteria.lexicalResource, fallback)),
      ),
      evidence: text(criteria.lexicalResourceEvidence, 1000),
    },
    {
      code: 'grammatical_range_accuracy',
      score: Math.max(
        0,
        Math.min(100, number(criteria.grammaticalRangeAccuracy, fallback)),
      ),
      evidence: text(criteria.grammaticalRangeAccuracyEvidence, 1000),
    },
  ];
}

async function readBody(c: Context) {
  try {
    return await c.req.json<Record<string, unknown>>();
  } catch {
    throw new Error('요청 형식이 올바르지 않습니다.');
  }
}

async function requireConnected(codex: CodexRegistry, userId: string) {
  const account = await codex.get(userId).readAccount();
  if (account?.type !== 'chatgpt')
    throw new Error('먼저 ChatGPT OAuth 연결을 완료해 주세요.');
  return account;
}

async function queryProfile(pool: Pool, userId: string) {
  const result = await pool.query(
    `SELECT * FROM user_writing_profiles WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] as Record<string, unknown> | undefined;
}

async function getActiveSession(pool: Pool, userId: string) {
  const result = await pool.query(
    `SELECT id, session_type, status FROM writing_sessions WHERE user_id = $1 AND status IN ('generating', 'in_progress') ORDER BY id DESC LIMIT 1`,
    [userId],
  );
  return result.rows[0] as
    | { id: string | number; session_type: SessionType; status: string }
    | undefined;
}

async function ensureHintSet(
  pool: Pool,
  codex: CodexRegistry,
  user: UserContext,
  question: Record<string, unknown>,
  internalStage: string,
) {
  const existing = await pool.query(
    `SELECT id FROM writing_question_hint_sets WHERE question_id = $1 AND internal_stage = $2 AND rule_version = $3 AND status = 'ready'`,
    [question.id, internalStage, WRITING_RULE_VERSION],
  );
  if (existing.rows[0]) return Number(existing.rows[0].id);
  const skillRows = await pool.query(
    `SELECT skill_code FROM writing_question_skills WHERE question_id = $1 ORDER BY importance DESC, weight DESC`,
    [question.id],
  );
  const skillCodes = skillRows.rows.map((row) => row.skill_code).join(', ');
  const prompt = `EnPra Writing 학습 문제용 힌트를 만드세요. JSON만 반환하세요.\n현재 내부 단계: ${internalStage}\n이 단계의 기대치: ${expectationFor(internalStage, String(question.task_type) as TaskType)}\n문제: ${question.prompt}\n자료: ${JSON.stringify(question.material_json ?? {})}\n핵심 스킬: ${skillCodes}\n각 단계 수준에 맞추어 아래 4개 힌트를 한국어로 작성하세요. 예시 힌트는 답 전체를 보여주지 말고 시작 문장 또는 짧은 모델만 제시합니다.\n{\"hints\":[{\"type\":\"structure\",\"content\":\"\",\"skillCode\":\"\"},{\"type\":\"grammar\",\"content\":\"\",\"skillCode\":\"\"},{\"type\":\"vocabulary\",\"content\":\"\",\"skillCode\":\"\"},{\"type\":\"sample\",\"content\":\"\",\"skillCode\":\"\"}]}`;
  const generated = jsonObject(
    (await codex.get(user.id).runLearningPrompt(prompt)).text,
  );
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO writing_question_hint_sets (question_id, internal_stage, rule_version, status) VALUES ($1, $2, $3, 'ready') ON CONFLICT (question_id, internal_stage, rule_version) DO UPDATE SET status = 'ready' RETURNING id`,
      [question.id, internalStage, WRITING_RULE_VERSION],
    );
    const hintSetId = Number(inserted.rows[0].id);
    await client.query(
      `DELETE FROM writing_question_hints WHERE hint_set_id = $1`,
      [hintSetId],
    );
    const penalty: Record<string, number> = {
      structure: 5,
      grammar: 8,
      vocabulary: 6,
      sample: 15,
    };
    const fallbackSkill = skillRows.rows[0]?.skill_code ?? null;
    for (const [index, rawHint] of asArray(generated.hints)
      .slice(0, 4)
      .entries()) {
      if (!rawHint || typeof rawHint !== 'object') continue;
      const hint = rawHint as Record<string, unknown>;
      const type = ['structure', 'grammar', 'vocabulary', 'sample'].includes(
        text(hint.type, 40),
      )
        ? text(hint.type, 40)
        : 'structure';
      const content = text(hint.content, 3000);
      const requestedSkill = text(hint.skillCode, 120);
      const validSkill = skillRows.rows.some(
        (row) => row.skill_code === requestedSkill,
      )
        ? requestedSkill
        : fallbackSkill;
      if (content)
        await client.query(
          `INSERT INTO writing_question_hints (hint_set_id, skill_code, hint_type, hint_order, content, penalty_score) VALUES ($1, $2, $3, $4, $5, $6)`,
          [hintSetId, validSkill, type, index + 1, content, penalty[type]],
        );
    }
    await client.query('COMMIT');
    return hintSetId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createQuestion(
  pool: Pool,
  codex: CodexRegistry,
  user: UserContext,
  taskType: TaskType,
  exerciseType: string,
  difficulty: string,
  purpose = 'general',
  requiredSkillCodes: string[] = [],
) {
  const format =
    taskType === 'task1'
      ? pickWeighted(task1Formats)
      : taskType === 'task2'
        ? pickWeighted(task2Formats)
        : 'foundation_drill';
  const materialGuide =
    taskType === 'task1'
      ? `자료는 반드시 세부 유형에 맞는 아래 JSON 구조로 작성하세요. 숫자는 문자열이 아닌 숫자로 넣고 단위는 material.unit에 따로 넣으세요. 이 데이터는 코드가 SVG로 정확히 그리므로, 설명문이 아닌 위치·라벨·연결 관계를 빠짐없이 입력해야 합니다.\nbar_chart 또는 line_chart: {\"title\":\"\",\"description\":\"\",\"unit\":\"%|millions|…\",\"categories\":[\"2010\",\"2015\"],\"series\":[{\"name\":\"\",\"data\":[12,18]}]}\npie_chart 또는 table: {\"title\":\"\",\"description\":\"\",\"unit\":\"%|…\",\"rows\":[{\"label\":\"\",\"value\":35}]}\nmap: {\"title\":\"\",\"description\":\"\",\"mapPanels\":[{\"label\":\"Before\",\"features\":[{\"type\":\"road|river|path|area|building|bridge|label|arrow\",\"label\":\"Road|Bridge|실제 명칭\",\"x\":20,\"y\":18,\"width\":20,\"height\":12,\"points\":[[10,20],[70,20]],\"color\":\"#38634f\"}]}]}. 좌표는 가로·세로 모두 0~100 범위이며, 모든 요소와 라벨은 캔버스를 넘지 않게 배치하세요. road와 bridge는 반드시 label을 넣으세요. road·river·path·bridge·arrow는 points, area·building·label은 x/y와 필요시 width/height를 사용하세요. 도로는 실제 연결 관계가 분명할 때만 넣고, 교차·연결 위치를 points로 정확히 표현하세요. 다리는 반드시 type=bridge로 지정하세요. 비교 문제면 Before와 After를 모두 넣으세요.\ndiagram: {\"title\":\"\",\"description\":\"\",\"steps\":[{\"label\":\"\",\"description\":\"\"}]}. steps는 실제 공정 순서대로 입력하고, 각 단계의 핵심 변화가 보이도록 짧고 정확하게 작성하세요.\n자료는 문제 지시문과 모순되지 않도록 하고 분석 가능한 핵심 특징과 비교가 나타나게 만드세요.`
      : 'Task 2와 FOUNDATION은 자료 없이 material을 {}로 반환하세요.';
  const requestedSkills = requiredSkillCodes.filter((code) =>
    skills.some(([skillCode]) => skillCode === code),
  );
  const prompt = `EnPra IELTS Writing 문제를 하나 만드세요. JSON만 반환하세요.\n유형: ${taskType}; 세부 유형: ${format}; 난이도: ${difficulty}; 용도: ${purpose}; 연습 형식: ${exerciseType}.\nTask 1은 객관적 자료 분석만, Task 2는 논리적 에세이만 만드세요. FOUNDATION은 영어 3문장 연습 문제입니다.\n${materialGuide}\n{\"title\":\"\",\"prompt\":\"영문 문제 지시문\",\"material\":{},\"solutionContext\":{\"keyFacts\":[\"\"],\"commonMistakes\":[\"\"]},\"skills\":[{\"code\":\"t1_overview\",\"importance\":\"primary\",\"weight\":0.5}]}`;
  const generated = jsonObject(
    (
      await codex
        .get(user.id)
        .runLearningPrompt(
          requestedSkills.length
            ? `${prompt}\n이 문제는 보강 학습용 후보이기도 합니다. skills에는 반드시 다음 스킬 중 하나 이상을 primary로 포함하세요: ${requestedSkills.join(', ')}.`
            : prompt,
        )
    ).text,
  );
  const title =
    text(generated.title, 300) || `${taskType.toUpperCase()} practice`;
  const questionPrompt = text(generated.prompt, 12000);
  if (!questionPrompt) throw new Error('AI가 문제 본문을 만들지 못했습니다.');
  const material =
    generated.material && typeof generated.material === 'object'
      ? generated.material
      : {};
  const solutionContext =
    generated.solutionContext && typeof generated.solutionContext === 'object'
      ? generated.solutionContext
      : {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const question = await client.query(
      `INSERT INTO writing_questions (task_type, exercise_type, question_format, material_count, difficulty, purpose, title, prompt, material_json, solution_context, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active') RETURNING *`,
      [
        taskType,
        exerciseType,
        format,
        material && Object.keys(material).length ? 1 : 0,
        difficulty,
        purpose,
        title,
        questionPrompt,
        JSON.stringify(material),
        JSON.stringify(solutionContext),
      ],
    );
    const questionId = Number(question.rows[0].id);
    const allowed = new Set<string>(skills.map(([code]) => code));
    const provided = asArray(generated.skills).flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const item = entry as Record<string, unknown>;
      const code = text(item.code, 120);
      return allowed.has(code)
        ? [
            {
              code,
              importance:
                text(item.importance, 30) === 'supporting'
                  ? 'supporting'
                  : 'primary',
              weight: Math.max(0.1, Math.min(1, number(item.weight, 0.5))),
            },
          ]
        : [];
    });
    const defaults: Array<{
      code: string;
      importance: string;
      weight: number;
    }> =
      taskType === 'task1'
        ? [
            { code: 't1_overview', importance: 'primary', weight: 0.5 },
            { code: 't1_comparison', importance: 'primary', weight: 0.5 },
            {
              code: 'grammar_sentence_structure',
              importance: 'supporting',
              weight: 0.3,
            },
          ]
        : taskType === 'task2'
          ? [
              { code: 't2_position', importance: 'primary', weight: 0.5 },
              { code: 't2_reasoning', importance: 'primary', weight: 0.5 },
              {
                code: 'grammar_sentence_structure',
                importance: 'supporting',
                weight: 0.3,
              },
            ]
          : [
              {
                code: 'grammar_sentence_structure',
                importance: 'primary',
                weight: 0.6,
              },
              {
                code: 'grammar_linking',
                importance: 'supporting',
                weight: 0.4,
              },
            ];
    const selectedSkills: Array<{
      code: string;
      importance: string;
      weight: number;
    }> = provided.length ? provided : defaults;
    const requiredSkill = requestedSkills.find(
      (code) => !selectedSkills.some((skill) => skill.code === code),
    );
    if (requiredSkill)
      selectedSkills.unshift({
        code: requiredSkill,
        importance: 'primary',
        weight: 0.7,
      });
    for (const row of selectedSkills)
      await client.query(
        `INSERT INTO writing_question_skills (question_id, skill_code, importance, weight) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [questionId, row.code, row.importance, row.weight],
      );
    await client.query('COMMIT');
    return question.rows[0] as Record<string, unknown>;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function chooseQuestion(
  pool: Pool,
  codex: CodexRegistry,
  user: UserContext,
  taskType: TaskType,
  exerciseType: string,
  difficulty: string,
  purpose = 'general',
) {
  const result = await pool.query(
    `SELECT q.* FROM writing_questions q WHERE q.task_type = $1 AND q.exercise_type = $2 AND q.difficulty = $3 AND q.purpose = $4 AND q.status = 'active' AND NOT EXISTS (SELECT 1 FROM writing_session_items i JOIN writing_sessions s ON s.id = i.session_id WHERE s.user_id = $5 AND i.question_id = q.id AND s.created_at >= NOW() - INTERVAL '30 days') ORDER BY RANDOM() LIMIT 1`,
    [taskType, exerciseType, difficulty, purpose, user.id],
  );
  return (
    (result.rows[0] as Record<string, unknown> | undefined) ??
    createQuestion(
      pool,
      codex,
      user,
      taskType,
      exerciseType,
      difficulty,
      purpose,
    )
  );
}

async function chooseLearningQuestion(
  pool: Pool,
  codex: CodexRegistry,
  user: UserContext,
  taskType: TaskType,
  exerciseType: string,
  difficulty: string,
  learningMode: LearningMode,
) {
  const result = await pool.query(
    `SELECT q.* FROM writing_questions q WHERE q.task_type = $1 AND q.exercise_type = $2 AND q.difficulty = $3 AND q.purpose IN ('general', 'main_learning') AND q.status = 'active' AND NOT EXISTS (SELECT 1 FROM writing_session_items i JOIN writing_sessions s ON s.id = i.session_id WHERE s.user_id = $4 AND i.question_id = q.id AND s.session_type = 'learning' AND s.status = 'completed' AND COALESCE(s.learning_mode, 'standard') = $5) ORDER BY RANDOM() LIMIT 1`,
    [taskType, exerciseType, difficulty, user.id, learningMode],
  );
  return (
    (result.rows[0] as Record<string, unknown> | undefined) ??
    createQuestion(
      pool,
      codex,
      user,
      taskType,
      exerciseType,
      difficulty,
      'main_learning',
    )
  );
}

async function chooseReinforcementQuestion(
  pool: Pool,
  codex: CodexRegistry,
  user: UserContext,
  focusSkills: FocusSkill[],
  internalStage: string,
) {
  const taskTypes: TaskType[] =
    internalStage === 'foundation' ? ['foundation'] : ['task1', 'task2'];
  const skillCodes = focusSkills.map((skill) => skill.code);
  const challengeRatio = Number(
    configForStage(internalStage).challengeRatio ?? 0,
  );
  const difficulty =
    internalStage === 'foundation' || Math.random() * 100 >= challengeRatio
      ? 'standard'
      : 'challenge';
  const result = await pool.query(
    `SELECT q.*, COUNT(DISTINCT qs.skill_code)::INTEGER AS matched_skill_count FROM writing_questions q JOIN writing_question_skills qs ON qs.question_id = q.id WHERE q.task_type = ANY($1::text[]) AND q.purpose IN ('general', 'main_learning') AND q.status = 'active' AND qs.skill_code = ANY($3::text[]) AND NOT EXISTS (SELECT 1 FROM writing_session_items i JOIN writing_sessions s ON s.id = i.session_id WHERE s.user_id = $4 AND i.question_id = q.id AND s.session_type = 'learning' AND s.status = 'completed' AND COALESCE(s.learning_mode, 'standard') = 'reinforcement') GROUP BY q.id ORDER BY matched_skill_count DESC, CASE WHEN q.difficulty = $2 THEN 0 ELSE 1 END, RANDOM() LIMIT 1`,
    [taskTypes, difficulty, skillCodes, user.id],
  );
  if (result.rows[0]) return result.rows[0] as Record<string, unknown>;

  const focus = focusSkills.find((skill) =>
    taskTypes.some(
      (task) => skill.taskScope === task || skill.taskScope === 'both',
    ),
  );
  const fallbackTask: TaskType =
    internalStage === 'foundation'
      ? 'foundation'
      : focus?.taskScope === 'task2'
        ? 'task2'
        : 'task1';
  return createQuestion(
    pool,
    codex,
    user,
    fallbackTask,
    fallbackTask === 'foundation' ? 'foundation_guided' : fallbackTask,
    difficulty,
    'main_learning',
    focus ? [focus.code] : [],
  );
}

async function queryFocusSkills(pool: Pool, userId: string) {
  const result = await pool.query(
    `SELECT c.code, c.task_scope FROM user_writing_skill_states st JOIN writing_skill_catalog c ON c.code = st.skill_code WHERE st.user_id = $1 ORDER BY st.priority DESC, st.recent_effective_score_avg ASC LIMIT 5`,
    [userId],
  );
  return result.rows.map((row) => ({
    code: String(row.code),
    taskScope: row.task_scope as FocusSkill['taskScope'],
  })) satisfies FocusSkill[];
}

async function refreshSkillStates(pool: Pool, userId: string) {
  const profile = await queryProfile(pool, userId);
  if (!profile || profile.onboarding_status !== 'active') return;
  const stage = String(profile.current_internal_stage);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rows = await client.query(
      `SELECT sr.skill_code, AVG(sr.effective_score)::NUMERIC(5,2) AS average_score, COUNT(*)::INTEGER AS evidence_count, COUNT(*) FILTER (WHERE sr.effective_score < 70)::INTEGER AS reinforcement_count, MAX(sr.attempt_result_id)::BIGINT AS last_result_id FROM writing_attempt_skill_results sr JOIN writing_attempt_results r ON r.id = sr.attempt_result_id JOIN writing_session_items i ON i.id = r.session_item_id JOIN writing_sessions s ON s.id = i.session_id WHERE s.user_id = $1 AND s.internal_stage_snapshot = $2 AND r.affects_progress = TRUE AND r.evaluated_at >= NOW() - INTERVAL '14 days' GROUP BY sr.skill_code`,
      [userId, stage],
    );
    await client.query(
      `DELETE FROM user_writing_skill_states WHERE user_id = $1`,
      [userId],
    );
    for (const row of rows.rows)
      await client.query(
        `INSERT INTO user_writing_skill_states (user_id, skill_code, evaluation_public_level, evaluation_internal_stage, recent_effective_score_avg, recent_evidence_count, recent_reinforcement_count, priority, last_result_id, last_evaluated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
        [
          userId,
          row.skill_code,
          profile.current_public_level,
          stage,
          row.average_score,
          row.evidence_count,
          row.reinforcement_count,
          Math.max(1, Math.round(100 - Number(row.average_score))),
          row.last_result_id,
        ],
      );
    const top = await client.query(
      `SELECT c.name_ko FROM user_writing_skill_states st JOIN writing_skill_catalog c ON c.code = st.skill_code WHERE st.user_id = $1 ORDER BY st.priority DESC, st.recent_effective_score_avg ASC LIMIT 5`,
      [userId],
    );
    const summary = top.rows.length
      ? `현재는 ${top.rows.map((row) => row.name_ko).join(', ')}을(를) 우선 보강하면 좋습니다.`
      : '첫 학습을 시작하면 현재 강점과 보완할 부분을 진단해 드립니다.';
    await client.query(
      `UPDATE user_writing_profiles SET board_summary = $2, board_next_action = 'learning', metrics_refreshed_for_date = CURRENT_DATE, metrics_refreshed_at = NOW(), updated_at = NOW() WHERE user_id = $1`,
      [userId, summary],
    );
    const evidence = await client.query(
      `SELECT COUNT(*)::INTEGER AS count, AVG(r.effective_score) AS score FROM writing_attempt_results r JOIN writing_session_items i ON i.id=r.session_item_id JOIN writing_sessions s ON s.id=i.session_id WHERE s.user_id=$1 AND s.internal_stage_snapshot=$2 AND r.affects_progress=TRUE AND r.evaluated_at >= NOW() - INTERVAL '14 days'`,
      [userId, stage],
    );
    const count = Number(evidence.rows[0]?.count ?? 0);
    const score = Number(evidence.rows[0]?.score ?? 0);
    const currentRule = configForStage(stage);
    const minEvidence = Number(currentRule.minEvidence ?? 6);
    const promotionScore = Number(currentRule.promotionScore ?? 84);
    const siblings = stageConfig
      .filter(([level]) => level === profile.current_public_level)
      .map(([, , itemStage]) => itemStage);
    const currentIndex = siblings.indexOf(stage);
    const nextStage =
      count >= minEvidence && score >= promotionScore
        ? siblings[currentIndex + 1]
        : undefined;
    const previousStage =
      count >= minEvidence && score < 60 && currentIndex > 0
        ? siblings[currentIndex - 1]
        : undefined;
    const replacement = nextStage ?? previousStage;
    if (replacement) {
      await client.query(
        `UPDATE user_writing_profiles SET current_internal_stage=$2,current_level_group=$3,current_stage_started_at=NOW(),board_summary='새 내부 단계에 맞춰 학습 난이도를 조정했습니다.',metrics_refreshed_for_date=CURRENT_DATE,metrics_refreshed_at=NOW(),updated_at=NOW() WHERE user_id=$1`,
        [userId, replacement, groupFor(replacement)],
      );
      await client.query(
        `DELETE FROM user_writing_skill_states WHERE user_id=$1`,
        [userId],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function publicOverview(pool: Pool, userId: string) {
  const profile = await queryProfile(pool, userId);
  const active = await getActiveSession(pool, userId);
  if (!profile)
    return {
      profile: null,
      activeSession: active
        ? { id: Number(active.id), type: active.session_type }
        : null,
      topSkills: [],
    };
  if (
    profile.metrics_refreshed_for_date !==
      new Date().toISOString().slice(0, 10) &&
    profile.onboarding_status === 'active'
  )
    await refreshSkillStates(pool, userId);
  const current = (await queryProfile(pool, userId)) ?? profile;
  const states = await pool.query(
    `SELECT c.code, c.name_ko, st.recent_effective_score_avg, st.recent_evidence_count, st.recent_reinforcement_count, st.priority FROM user_writing_skill_states st JOIN writing_skill_catalog c ON c.code = st.skill_code WHERE st.user_id = $1 ORDER BY st.priority DESC, st.recent_effective_score_avg ASC LIMIT 5`,
    [userId],
  );
  return {
    profile: {
      onboardingStatus: current.onboarding_status,
      selectedStartLevel: current.selected_start_level,
      currentPublicLevel: current.current_public_level,
      currentLevelGroup: current.current_level_group,
      currentInternalStage: current.current_internal_stage,
      boardSummary: current.board_summary,
      boardNextAction: current.board_next_action,
    },
    activeSession: active
      ? { id: Number(active.id), type: active.session_type }
      : null,
    topSkills: states.rows.map((row) => ({
      code: row.code,
      name: row.name_ko,
      score: Number(row.recent_effective_score_avg),
      evidenceCount: Number(row.recent_evidence_count),
      reinforcementCount: Number(row.recent_reinforcement_count),
    })),
  };
}

async function applyPlacementResult(
  pool: Pool,
  userId: string,
  sessionId: number,
) {
  const session = await pool.query(
    `SELECT target_public_level, promotion_score FROM writing_sessions WHERE id = $1 AND user_id = $2 AND session_type = 'placement_test' AND status = 'completed'`,
    [sessionId, userId],
  );
  const row = session.rows[0] as Record<string, unknown> | undefined;
  if (!row) return;
  const level = row.target_public_level as PublicLevel;
  const score = Number(row.promotion_score ?? 0);
  const group = level === '5.0' && score < 80 ? '5.0_basic' : null;
  const stage =
    level === '5.0'
      ? score < 62
        ? '5.0A'
        : score < 80
          ? '5.0B'
          : score < 91
            ? '5.0C'
            : '5.0D'
      : stageFor(level, group);
  await pool.query(
    `INSERT INTO user_writing_profiles(user_id,onboarding_status,selected_start_level,current_public_level,current_level_group,current_internal_stage,current_stage_started_at,placement_completed_at,board_summary,board_next_action,metrics_refreshed_for_date,metrics_refreshed_at) VALUES($1,'active',$2,$2,$3,$4,NOW(),NOW(),'첫 학습을 시작하면 현재 강점과 보완할 부분을 진단해 드립니다.','learning',CURRENT_DATE,NOW()) ON CONFLICT(user_id) DO UPDATE SET onboarding_status='active',selected_start_level=EXCLUDED.selected_start_level,current_public_level=EXCLUDED.current_public_level,current_level_group=EXCLUDED.current_level_group,current_internal_stage=EXCLUDED.current_internal_stage,current_stage_started_at=NOW(),placement_completed_at=NOW(),board_summary=EXCLUDED.board_summary,board_next_action='learning',metrics_refreshed_for_date=CURRENT_DATE,metrics_refreshed_at=NOW(),updated_at=NOW()`,
    [userId, level, group, stage],
  );
  await pool.query(`DELETE FROM user_writing_skill_states WHERE user_id = $1`, [
    userId,
  ]);
  await pool.query(
    `INSERT INTO writing_level_change_history(user_id,to_public_level,to_level_group,change_type,source_session_id) VALUES($1,$2,$3,'initial_placement',$4)`,
    [userId, level, group, sessionId],
  );
}

function serializeQuestion(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    title: row.title,
    prompt: row.prompt,
    taskType: row.task_type,
    exerciseType: row.exercise_type,
    questionFormat: row.question_format,
    material: row.material_json ?? {},
    difficulty: row.difficulty,
  };
}

async function sessionPayload(pool: Pool, userId: string, sessionId: number) {
  const session = await pool.query(
    `SELECT * FROM writing_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId],
  );
  const row = session.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const items = await pool.query(
    `SELECT i.*, q.title, q.prompt, q.material_json, q.question_format, q.difficulty, r.id AS result_id, r.answer_text, r.feedback_json, r.effective_score, r.result_label, r.evaluation_status FROM writing_session_items i JOIN writing_questions q ON q.id = i.question_id LEFT JOIN writing_attempt_results r ON r.session_item_id = i.id WHERE i.session_id = $1 ORDER BY i.item_order`,
    [sessionId],
  );
  const current =
    items.rows.find((item) => item.status !== 'evaluated') ?? null;
  const currentItem = current
    ? {
        id: Number(current.id),
        order: Number(current.item_order),
        taskType: current.task_type,
        exerciseType: current.exercise_type,
        purpose: current.item_purpose,
        targetSentenceCount: current.target_sentence_count,
        targetWordCount: current.target_word_count,
        status: current.status,
        question: serializeQuestion(current),
        result: current.result_id
          ? {
              answerText: current.answer_text,
              feedback: current.feedback_json,
              effectiveScore: Number(current.effective_score),
              label: current.result_label,
            }
          : null,
      }
    : null;
  let hints: Array<Record<string, unknown>> = [];
  if (current?.hint_set_id) {
    const hintRows = await pool.query(
      `SELECT h.id, h.hint_type, h.hint_order, h.content FROM writing_question_hints h WHERE h.hint_set_id = $1 ORDER BY h.hint_order`,
      [current.hint_set_id],
    );
    const used = await pool.query(
      `SELECT hint_id FROM writing_hint_usage_events WHERE session_item_id = $1`,
      [current.id],
    );
    const usedIds = new Set(used.rows.map((entry) => Number(entry.hint_id)));
    hints = hintRows.rows.map((hint) => ({
      id: Number(hint.id),
      type: hint.hint_type,
      order: Number(hint.hint_order),
      content: hint.content,
      revealed: usedIds.has(Number(hint.id)),
    }));
  }
  return {
    id: Number(row.id),
    type: row.session_type,
    status: row.status,
    publicLevel: row.public_level_snapshot,
    levelGroup: row.level_group_snapshot,
    internalStage: row.internal_stage_snapshot,
    targetPublicLevel: row.target_public_level,
    targetLevelGroup: row.target_level_group,
    expectedItemCount: Number(row.expected_item_count),
    currentItem,
    completedItemCount: items.rows.filter((item) => item.status === 'evaluated')
      .length,
    hints,
    completed: current === null,
    promotionRecommendation: row.promotion_recommendation,
    promotionScore: row.promotion_score ? Number(row.promotion_score) : null,
  };
}

export async function initializeWritingDatabase(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS writing_level_rules (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, public_level TEXT NOT NULL, level_group TEXT, internal_stage TEXT NOT NULL, rule_version TEXT NOT NULL DEFAULT 'v1', config JSONB NOT NULL DEFAULT '{}'::jsonb, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (public_level, level_group, internal_stage, rule_version));
    CREATE TABLE IF NOT EXISTS writing_skill_catalog (code TEXT PRIMARY KEY, name_ko TEXT NOT NULL, task_scope TEXT NOT NULL CHECK (task_scope IN ('task1','task2','both','foundation')), is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS writing_questions (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, task_type TEXT NOT NULL CHECK (task_type IN ('task1','task2','foundation')), exercise_type TEXT NOT NULL, question_format TEXT NOT NULL, material_count SMALLINT NOT NULL DEFAULT 0 CHECK (material_count BETWEEN 0 AND 2), difficulty TEXT NOT NULL CHECK (difficulty IN ('standard','challenge')), purpose TEXT NOT NULL DEFAULT 'general', title TEXT NOT NULL, prompt TEXT NOT NULL, material_json JSONB NOT NULL DEFAULT '{}'::jsonb, solution_context JSONB NOT NULL DEFAULT '{}'::jsonb, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','retired')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS writing_question_skills (question_id BIGINT NOT NULL REFERENCES writing_questions(id) ON DELETE CASCADE, skill_code TEXT NOT NULL REFERENCES writing_skill_catalog(code) ON DELETE RESTRICT, importance TEXT NOT NULL CHECK (importance IN ('primary','supporting')), weight NUMERIC(4,3) NOT NULL CHECK (weight > 0 AND weight <= 1), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (question_id, skill_code));
    CREATE TABLE IF NOT EXISTS writing_question_hint_sets (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, question_id BIGINT NOT NULL REFERENCES writing_questions(id) ON DELETE CASCADE, internal_stage TEXT NOT NULL, rule_version TEXT NOT NULL DEFAULT 'v1', status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating','ready','error')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(question_id, internal_stage, rule_version));
    CREATE TABLE IF NOT EXISTS writing_question_hints (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, hint_set_id BIGINT NOT NULL REFERENCES writing_question_hint_sets(id) ON DELETE CASCADE, skill_code TEXT REFERENCES writing_skill_catalog(code) ON DELETE SET NULL, hint_type TEXT NOT NULL CHECK (hint_type IN ('structure','grammar','vocabulary','sample')), hint_order SMALLINT NOT NULL, content TEXT NOT NULL, penalty_score NUMERIC(5,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(hint_set_id, hint_order));
    CREATE TABLE IF NOT EXISTS user_writing_profiles (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, onboarding_status TEXT NOT NULL DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started','placement_in_progress','active')), selected_start_level TEXT, current_public_level TEXT, current_level_group TEXT, current_internal_stage TEXT, current_stage_started_at TIMESTAMPTZ, placement_completed_at TIMESTAMPTZ, board_summary VARCHAR(150), board_next_action TEXT, board_source_result_id BIGINT, last_learning_at TIMESTAMPTZ, last_test_at TIMESTAMPTZ, metrics_refreshed_for_date DATE, metrics_refreshed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS user_writing_skill_states (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, skill_code TEXT NOT NULL REFERENCES writing_skill_catalog(code) ON DELETE CASCADE, evaluation_public_level TEXT NOT NULL, evaluation_internal_stage TEXT NOT NULL, recent_effective_score_avg NUMERIC(5,2) NOT NULL, recent_evidence_count INTEGER NOT NULL, priority SMALLINT NOT NULL, last_result_id BIGINT, last_evaluated_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(user_id, skill_code));
    CREATE TABLE IF NOT EXISTS writing_sessions (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, session_type TEXT NOT NULL CHECK (session_type IN ('learning','test','promotion_test','placement_test')), status TEXT NOT NULL CHECK (status IN ('generating','in_progress','completed','abandoned')), public_level_snapshot TEXT, level_group_snapshot TEXT, internal_stage_snapshot TEXT, target_public_level TEXT, target_level_group TEXT, expected_item_count SMALLINT NOT NULL, rule_version TEXT NOT NULL DEFAULT 'v1', promotion_recommendation TEXT, promotion_score NUMERIC(5,2), generated_at TIMESTAMPTZ, started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ, abandoned_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE UNIQUE INDEX IF NOT EXISTS writing_sessions_one_active_per_user_idx ON writing_sessions(user_id) WHERE status IN ('generating','in_progress');
    CREATE TABLE IF NOT EXISTS writing_session_items (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, session_id BIGINT NOT NULL REFERENCES writing_sessions(id) ON DELETE CASCADE, question_id BIGINT NOT NULL REFERENCES writing_questions(id) ON DELETE RESTRICT, item_order SMALLINT NOT NULL, task_type TEXT, exercise_type TEXT NOT NULL, item_purpose TEXT NOT NULL, hint_set_id BIGINT REFERENCES writing_question_hint_sets(id) ON DELETE SET NULL, target_sentence_count SMALLINT, target_word_count SMALLINT, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','submitted','evaluated','abandoned')), assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ, UNIQUE(session_id,item_order));
    CREATE TABLE IF NOT EXISTS writing_attempt_results (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, session_item_id BIGINT NOT NULL UNIQUE REFERENCES writing_session_items(id) ON DELETE CASCADE, answer_text TEXT NOT NULL, answer_word_count INTEGER NOT NULL, answer_character_count INTEGER NOT NULL, submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), evaluation_status TEXT NOT NULL CHECK (evaluation_status IN ('evaluating','completed','failed')), evaluated_at TIMESTAMPTZ, raw_score NUMERIC(5,2), hint_penalty_score NUMERIC(5,2) NOT NULL DEFAULT 0, effective_score NUMERIC(5,2), result_label TEXT, error_count SMALLINT NOT NULL DEFAULT 0, feedback_json JSONB NOT NULL DEFAULT '{}'::jsonb, affects_progress BOOLEAN NOT NULL DEFAULT TRUE, feedback_released_at TIMESTAMPTZ, rule_version TEXT NOT NULL DEFAULT 'v1', evaluation_model TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS writing_attempt_criterion_results (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, attempt_result_id BIGINT NOT NULL REFERENCES writing_attempt_results(id) ON DELETE CASCADE, criterion_code TEXT NOT NULL CHECK (criterion_code IN ('task_achievement','task_response','coherence_cohesion','lexical_resource','grammatical_range_accuracy')), raw_score NUMERIC(5,2) NOT NULL CHECK (raw_score BETWEEN 0 AND 100), descriptor_target TEXT NOT NULL, evidence_summary TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(attempt_result_id,criterion_code));
    CREATE TABLE IF NOT EXISTS writing_attempt_skill_results (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, attempt_result_id BIGINT NOT NULL REFERENCES writing_attempt_results(id) ON DELETE CASCADE, skill_code TEXT NOT NULL REFERENCES writing_skill_catalog(code) ON DELETE RESTRICT, quality_score NUMERIC(5,2) NOT NULL, hint_penalty_score NUMERIC(5,2) NOT NULL DEFAULT 0, effective_score NUMERIC(5,2) NOT NULL, weight_applied NUMERIC(4,3) NOT NULL, evidence_summary TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(attempt_result_id,skill_code));
    CREATE TABLE IF NOT EXISTS writing_hint_usage_events (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, session_item_id BIGINT NOT NULL REFERENCES writing_session_items(id) ON DELETE CASCADE, hint_id BIGINT NOT NULL REFERENCES writing_question_hints(id) ON DELETE CASCADE, revealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(session_item_id,hint_id));
    CREATE TABLE IF NOT EXISTS writing_level_change_history (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, from_public_level TEXT, from_level_group TEXT, to_public_level TEXT NOT NULL, to_level_group TEXT, change_type TEXT NOT NULL CHECK (change_type IN ('initial_placement','promotion','manual_demotion')), source_session_id BIGINT REFERENCES writing_sessions(id) ON DELETE SET NULL, changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS writing_questions_lookup_idx ON writing_questions(task_type, exercise_type, difficulty, purpose) WHERE status = 'active';
    CREATE INDEX IF NOT EXISTS writing_session_items_session_idx ON writing_session_items(session_id,item_order);
    CREATE INDEX IF NOT EXISTS writing_attempt_results_progress_idx ON writing_attempt_results(affects_progress,evaluated_at DESC);
    CREATE INDEX IF NOT EXISTS writing_attempt_skill_results_skill_idx ON writing_attempt_skill_results(skill_code,effective_score);
  `);
  await pool.query(`
    ALTER TABLE writing_sessions ADD COLUMN IF NOT EXISTS learning_mode TEXT NOT NULL DEFAULT 'standard';
    ALTER TABLE user_writing_skill_states ADD COLUMN IF NOT EXISTS recent_reinforcement_count INTEGER NOT NULL DEFAULT 0;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'writing_sessions_learning_mode_check') THEN
        ALTER TABLE writing_sessions ADD CONSTRAINT writing_sessions_learning_mode_check CHECK (learning_mode IN ('standard', 'reinforcement'));
      END IF;
    END $$;
    CREATE TABLE IF NOT EXISTS writing_session_focus_skills (session_id BIGINT NOT NULL REFERENCES writing_sessions(id) ON DELETE CASCADE, skill_code TEXT NOT NULL REFERENCES writing_skill_catalog(code) ON DELETE RESTRICT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(session_id,skill_code));
    CREATE INDEX IF NOT EXISTS writing_session_focus_skills_skill_idx ON writing_session_focus_skills(skill_code,session_id);
  `);
  for (const [code, name, scope] of skills)
    await pool.query(
      `INSERT INTO writing_skill_catalog(code,name_ko,task_scope) VALUES($1,$2,$3) ON CONFLICT(code) DO UPDATE SET name_ko = EXCLUDED.name_ko, task_scope = EXCLUDED.task_scope, is_active = TRUE, updated_at = NOW()`,
      [code, name, scope],
    );
  for (const [level, group, stage, config] of stageConfig) {
    const persistedConfig = JSON.stringify({
      ...config,
      qualityControls: qualityControlsFor(stage),
    });
    await pool.query(
      `UPDATE writing_level_rules SET config=$5,is_active=TRUE,updated_at=NOW() WHERE public_level=$1 AND level_group IS NOT DISTINCT FROM $2 AND internal_stage=$3 AND rule_version=$4`,
      [level, group, stage, WRITING_RULE_VERSION, persistedConfig],
    );
    await pool.query(
      `INSERT INTO writing_level_rules(public_level,level_group,internal_stage,rule_version,config) SELECT $1,$2,$3,$4,$5 WHERE NOT EXISTS (SELECT 1 FROM writing_level_rules WHERE public_level=$1 AND level_group IS NOT DISTINCT FROM $2 AND internal_stage=$3 AND rule_version=$4)`,
      [level, group, stage, WRITING_RULE_VERSION, persistedConfig],
    );
  }
}

export function registerWritingRoutes(
  app: Hono<{ Variables: Variables }>,
  pool: Pool,
  codex: CodexRegistry,
) {
  app.get('/api/writing/overview', async (c) =>
    c.json(await publicOverview(pool, c.get('user').id)),
  );

  app.get('/api/writing/active', async (c) => {
    const active = await getActiveSession(pool, c.get('user').id);
    return c.json({
      activeSession: active
        ? { id: Number(active.id), type: active.session_type }
        : null,
    });
  });

  app.get('/api/writing/notebook', async (c) => {
    const rows = await pool.query(
      `SELECT r.id, r.answer_text, r.effective_score, r.result_label, r.error_count, r.feedback_json, r.evaluated_at, q.title, q.prompt, q.material_json, q.question_format, i.task_type FROM writing_attempt_results r JOIN writing_session_items i ON i.id=r.session_item_id JOIN writing_sessions s ON s.id=i.session_id JOIN writing_questions q ON q.id=i.question_id WHERE s.user_id=$1 AND r.affects_progress=TRUE AND r.evaluation_status='completed' AND r.error_count > 0 ORDER BY r.evaluated_at DESC LIMIT 100`,
      [c.get('user').id],
    );
    return c.json({
      entries: rows.rows.map((row) => ({
        id: Number(row.id),
        title: row.title,
        prompt: row.prompt,
        material: row.material_json,
        questionFormat: row.question_format,
        taskType: row.task_type,
        answer: row.answer_text,
        score: Number(row.effective_score),
        label: row.result_label,
        errorCount: Number(row.error_count),
        feedback: row.feedback_json,
        evaluatedAt: row.evaluated_at,
      })),
    });
  });

  app.get('/api/writing/sessions/:sessionId', async (c) => {
    const sessionId = Number(c.req.param('sessionId'));
    if (!Number.isSafeInteger(sessionId) || sessionId < 1)
      return c.json({ error: '올바른 학습 세션이 아닙니다.' }, 400);
    const payload = await sessionPayload(pool, c.get('user').id, sessionId);
    return payload
      ? c.json({ session: payload })
      : c.json({ error: '학습 세션을 찾을 수 없습니다.' }, 404);
  });

  app.post('/api/writing/placement', async (c) => {
    const user = c.get('user');
    const body = await readBody(c);
    const requested = text(body.level, 20) as PublicLevel;
    if (!['foundation', '5.0', '6.0', '7.0'].includes(requested))
      return c.json({ error: '올바른 시작 레벨을 선택해 주세요.' }, 400);
    const active = await getActiveSession(pool, user.id);
    if (active) return c.json({ activeSessionId: Number(active.id) }, 409);
    if (requested === 'foundation') {
      await pool.query(
        `INSERT INTO user_writing_profiles(user_id,onboarding_status,selected_start_level,current_public_level,current_internal_stage,current_stage_started_at,board_summary,board_next_action,metrics_refreshed_for_date,metrics_refreshed_at) VALUES($1,'active','foundation','foundation','foundation',NOW(),'첫 학습을 시작하면 현재 강점과 보완할 부분을 진단해 드립니다.','learning',CURRENT_DATE,NOW()) ON CONFLICT(user_id) DO UPDATE SET onboarding_status='active',selected_start_level='foundation',current_public_level='foundation',current_level_group=NULL,current_internal_stage='foundation',current_stage_started_at=NOW(),updated_at=NOW()`,
        [user.id],
      );
      await pool.query(
        `INSERT INTO writing_level_change_history(user_id,to_public_level,change_type) VALUES($1,'foundation','initial_placement')`,
        [user.id],
      );
      return c.json({ active: true, level: 'foundation' });
    }
    await requireConnected(codex, user.id);
    const taskTypes: TaskType[] =
      requested === '5.0' ? ['task1'] : ['task1', 'task2'];
    const placementStage = stageFor(requested);
    const session = await pool.query(
      `INSERT INTO writing_sessions(user_id,session_type,status,public_level_snapshot,internal_stage_snapshot,target_public_level,expected_item_count,rule_version) VALUES($1,'placement_test','generating',$2,$3,$2,$4,$5) RETURNING id`,
      [
        user.id,
        requested,
        placementStage,
        taskTypes.length,
        WRITING_RULE_VERSION,
      ],
    );
    const sessionId = Number(session.rows[0].id);
    try {
      for (const [index, taskType] of taskTypes.entries()) {
        const question = await chooseQuestion(
          pool,
          codex,
          user,
          taskType,
          taskType,
          'standard',
          'placement',
        );
        await pool.query(
          `INSERT INTO writing_session_items(session_id,question_id,item_order,task_type,exercise_type,item_purpose,target_word_count,status) VALUES($1,$2,$3,$4,$5,'placement_test',$6,'in_progress')`,
          [
            sessionId,
            question.id,
            index + 1,
            taskType,
            taskType,
            targetWordCountFor(placementStage, taskType),
          ],
        );
      }
      await pool.query(
        `UPDATE writing_sessions SET status='in_progress',generated_at=NOW(),updated_at=NOW() WHERE id=$1`,
        [sessionId],
      );
      return c.json({ sessionId });
    } catch (error) {
      await pool.query(
        `UPDATE writing_sessions SET status='abandoned',abandoned_at=NOW() WHERE id=$1`,
        [sessionId],
      );
      throw error;
    }
  });

  app.post('/api/writing/sessions', async (c) => {
    const user = c.get('user');
    const body = await readBody(c);
    const sessionType = text(body.sessionType, 40) as SessionType;
    const selectedTask = text(body.taskType, 20) as TaskType;
    const targetPublic = text(body.targetPublicLevel, 20) as PublicLevel;
    const targetGroup = text(body.targetLevelGroup, 40) || null;
    const force = bool(body.force);
    const learningMode =
      text(body.learningMode, 30) === 'reinforcement'
        ? 'reinforcement'
        : 'standard';
    if (!['learning', 'test', 'promotion_test'].includes(sessionType))
      return c.json({ error: '올바른 학습 요청이 아닙니다.' }, 400);
    const active = await getActiveSession(pool, user.id);
    if (active) return c.json({ activeSessionId: Number(active.id) }, 409);
    const profile = await queryProfile(pool, user.id);
    if (!profile || profile.onboarding_status !== 'active')
      return c.json({ error: '먼저 시작 레벨을 설정해 주세요.' }, 409);
    if (
      sessionType === 'learning' &&
      learningMode === 'standard' &&
      profile.current_public_level !== 'foundation' &&
      !['task1', 'task2'].includes(selectedTask)
    )
      return c.json({ error: 'Task 1 또는 Task 2를 선택해 주세요.' }, 400);
    if (sessionType === 'promotion_test') {
      if (
        !levelOrder.includes(targetPublic) ||
        levelOrder.indexOf(targetPublic) <=
          levelOrder.indexOf(profile.current_public_level as PublicLevel)
      )
        return c.json(
          { error: '현재보다 높은 목표 레벨을 선택해 주세요.' },
          400,
        );
      const stats = await pool.query(
        `SELECT AVG(recent_effective_score_avg) AS score, SUM(recent_evidence_count)::INTEGER AS count FROM user_writing_skill_states WHERE user_id=$1`,
        [user.id],
      );
      const currentScore = Number(stats.rows[0]?.score ?? 0);
      const evidenceCount = Number(stats.rows[0]?.count ?? 0);
      if (!force && (currentScore < 78 || evidenceCount < 6))
        return c.json({
          warning: true,
          message:
            '현재 등급보다 상위 등급에서는 학습이 어려울 수 있어요. 조금 더 현재 단계에서 학습한 뒤 도전하는 것을 권장합니다.',
        });
    }
    await requireConnected(codex, user.id);
    const focusSkills =
      sessionType === 'learning' && learningMode === 'reinforcement'
        ? await queryFocusSkills(pool, user.id)
        : [];
    if (
      sessionType === 'learning' &&
      learningMode === 'reinforcement' &&
      !focusSkills.length
    )
      return c.json(
        { error: '보강할 학습 항목이 아직 충분히 쌓이지 않았습니다.' },
        409,
      );
    const isFoundation = profile.current_public_level === 'foundation';
    const plan: Array<{
      task: TaskType | null;
      exercise: string;
      purpose: string;
      hint: boolean;
    }> =
      sessionType === 'promotion_test'
        ? [
            {
              task: 'task1',
              exercise: 'task1',
              purpose: 'promotion_test',
              hint: false,
            },
            {
              task: 'task1',
              exercise: 'task1',
              purpose: 'promotion_test',
              hint: false,
            },
            {
              task: 'task2',
              exercise: 'task2',
              purpose: 'promotion_test',
              hint: false,
            },
          ]
        : isFoundation
          ? [
              {
                task: 'foundation',
                exercise: 'foundation_guided',
                purpose: 'foundation_guided',
                hint: sessionType === 'learning',
              },
              {
                task: 'foundation',
                exercise: 'foundation_guided',
                purpose: 'foundation_guided',
                hint: sessionType === 'learning',
              },
              {
                task: 'foundation',
                exercise: 'foundation_open',
                purpose: 'foundation_open',
                hint: sessionType === 'learning',
              },
            ]
          : sessionType === 'test'
            ? [
                {
                  task: 'task1',
                  exercise: 'task1',
                  purpose: 'regular_test',
                  hint: false,
                },
                {
                  task: 'task2',
                  exercise: 'task2',
                  purpose: 'regular_test',
                  hint: false,
                },
              ]
            : learningMode === 'reinforcement'
              ? [
                  {
                    task: null,
                    exercise: 'reinforcement',
                    purpose: 'reinforcement_learning',
                    hint: true,
                  },
                ]
              : [
                  {
                    task: selectedTask,
                    exercise: selectedTask,
                    purpose: 'main_learning',
                    hint: true,
                  },
                ];
    const session = await pool.query(
      `INSERT INTO writing_sessions(user_id,session_type,learning_mode,status,public_level_snapshot,level_group_snapshot,internal_stage_snapshot,target_public_level,target_level_group,expected_item_count,rule_version) VALUES($1,$2,$3,'generating',$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        user.id,
        sessionType,
        sessionType === 'learning' ? learningMode : 'standard',
        profile.current_public_level,
        profile.current_level_group,
        profile.current_internal_stage,
        sessionType === 'promotion_test' ? targetPublic : null,
        sessionType === 'promotion_test' ? targetGroup : null,
        plan.length,
        WRITING_RULE_VERSION,
      ],
    );
    const sessionId = Number(session.rows[0].id);
    try {
      if (learningMode === 'reinforcement')
        for (const skill of focusSkills)
          await pool.query(
            `INSERT INTO writing_session_focus_skills(session_id,skill_code) VALUES($1,$2) ON CONFLICT DO NOTHING`,
            [sessionId, skill.code],
          );
      const challengeRatio = Number(
        configForStage(String(profile.current_internal_stage)).challengeRatio ??
          0,
      );
      for (const [index, entry] of plan.entries()) {
        const difficulty =
          entry.task === 'foundation' || Math.random() * 100 >= challengeRatio
            ? 'standard'
            : 'challenge';
        const question =
          sessionType === 'learning' && learningMode === 'reinforcement'
            ? await chooseReinforcementQuestion(
                pool,
                codex,
                user,
                focusSkills,
                String(profile.current_internal_stage),
              )
            : sessionType === 'learning'
              ? await chooseLearningQuestion(
                  pool,
                  codex,
                  user,
                  entry.task as TaskType,
                  entry.exercise,
                  difficulty,
                  learningMode,
                )
              : await chooseQuestion(
                  pool,
                  codex,
                  user,
                  entry.task as TaskType,
                  entry.exercise,
                  difficulty,
                  entry.purpose,
                );
        const questionTask = String(question.task_type) as TaskType;
        const questionExercise = String(question.exercise_type);
        const hintSetId = entry.hint
          ? await ensureHintSet(
              pool,
              codex,
              user,
              question,
              String(profile.current_internal_stage),
            )
          : null;
        const count = questionTask === 'foundation' ? 3 : null;
        const targetWords = targetWordCountFor(
          String(profile.current_internal_stage),
          questionTask,
        );
        await pool.query(
          `INSERT INTO writing_session_items(session_id,question_id,item_order,task_type,exercise_type,item_purpose,hint_set_id,target_sentence_count,target_word_count,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'in_progress')`,
          [
            sessionId,
            question.id,
            index + 1,
            questionTask === 'foundation' ? null : questionTask,
            questionExercise,
            entry.purpose,
            hintSetId,
            count,
            targetWords,
          ],
        );
      }
      await pool.query(
        `UPDATE writing_sessions SET status='in_progress',generated_at=NOW(),updated_at=NOW() WHERE id=$1`,
        [sessionId],
      );
      return c.json({ sessionId });
    } catch (error) {
      await pool.query(
        `UPDATE writing_sessions SET status='abandoned',abandoned_at=NOW() WHERE id=$1`,
        [sessionId],
      );
      throw error;
    }
  });

  app.post(
    '/api/writing/sessions/:sessionId/items/:itemId/hints/:hintId',
    async (c) => {
      const user = c.get('user');
      const sessionId = Number(c.req.param('sessionId'));
      const itemId = Number(c.req.param('itemId'));
      const hintId = Number(c.req.param('hintId'));
      const valid = await pool.query(
        `SELECT 1 FROM writing_session_items i JOIN writing_sessions s ON s.id=i.session_id JOIN writing_question_hint_sets hs ON hs.id=i.hint_set_id JOIN writing_question_hints h ON h.hint_set_id=hs.id WHERE s.id=$1 AND s.user_id=$2 AND i.id=$3 AND h.id=$4 AND s.session_type='learning'`,
        [sessionId, user.id, itemId, hintId],
      );
      if (!valid.rowCount)
        return c.json({ error: '열 수 없는 힌트입니다.' }, 404);
      await pool.query(
        `INSERT INTO writing_hint_usage_events(session_item_id,hint_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
        [itemId, hintId],
      );
      const hint = await pool.query(
        `SELECT content FROM writing_question_hints WHERE id=$1`,
        [hintId],
      );
      return c.json({ content: hint.rows[0]?.content ?? '' });
    },
  );

  app.post(
    '/api/writing/sessions/:sessionId/items/:itemId/submit',
    async (c) => {
      const user = c.get('user');
      const sessionId = Number(c.req.param('sessionId'));
      const itemId = Number(c.req.param('itemId'));
      const body = await readBody(c);
      const answer = text(body.answer, 30000);
      if (!answer) return c.json({ error: '답안을 입력해 주세요.' }, 400);
      const itemResult = await pool.query(
        `SELECT i.*,q.prompt,q.material_json,q.solution_context,s.session_type,s.internal_stage_snapshot,s.public_level_snapshot FROM writing_session_items i JOIN writing_sessions s ON s.id=i.session_id JOIN writing_questions q ON q.id=i.question_id WHERE s.id=$1 AND s.user_id=$2 AND i.id=$3 AND i.status IN ('pending','in_progress')`,
        [sessionId, user.id, itemId],
      );
      const item = itemResult.rows[0] as Record<string, unknown> | undefined;
      if (!item) return c.json({ error: '제출할 수 없는 문제입니다.' }, 409);
      await requireConnected(codex, user.id);
      const usedHints = await pool.query(
        `SELECT h.skill_code,h.penalty_score,h.hint_type FROM writing_hint_usage_events e JOIN writing_question_hints h ON h.id=e.hint_id WHERE e.session_item_id=$1`,
        [itemId],
      );
      const skillRows = await pool.query(
        `SELECT qs.skill_code,qs.weight FROM writing_question_skills qs WHERE qs.question_id=$1 ORDER BY qs.importance DESC,qs.weight DESC`,
        [item.question_id],
      );
      const task =
        item.task_type === 'task1'
          ? 'task1'
          : item.task_type === 'task2'
            ? 'task2'
            : 'foundation';
      const targetWords = number(item.target_word_count, 0);
      const taskCriterion =
        task === 'task2' ? 'Task Response' : 'Task Achievement';
      const stageExpectation = expectationFor(
        String(item.internal_stage_snapshot),
        task,
      );
      const qualityControls =
        item.rule_version === WRITING_RULE_VERSION
          ? qualityControlsFor(String(item.internal_stage_snapshot))
          : '이 세션이 시작된 당시의 단계별 채점 기준을 유지한다.';
      const prompt = `EnPra IELTS Writing 답안을 채점하세요. JSON만 반환하세요. 이것은 공식 IELTS 점수표 자체가 아니라, 공식 IELTS Writing public band descriptors의 4개 축을 내부 학습 단계에 적용한 0~100 수행 점수입니다.\n현재 내부 단계: ${item.internal_stage_snapshot}\n이 단계의 과제 기대치: ${stageExpectation}\n이 단계의 표현·응집·문법 기준: ${qualityControls}\n과제: ${task}; 핵심 과제 축: ${taskCriterion}; 목표 최소 분량: ${targetWords > 0 ? `${targetWords}단어` : '기초 3문장'}.\n문제: ${item.prompt}\n자료: ${JSON.stringify(item.material_json)}\n내부 정답 정보: ${JSON.stringify(item.solution_context)}\n사용자 답안: ${answer}\n평가 스킬: ${skillRows.rows.map((row) => row.skill_code).join(', ')}\n\n채점 원칙:\n1. 같은 답안이라도 현재 내부 단계의 기대치로 평가한다. 5.0C에서는 Band 5 목표를 충족하면 높은 점수를 받을 수 있지만, 7.0A에서는 Band 7 목표를 충족해야 같은 높은 점수를 받을 수 있다.\n2. ${task === 'task1' ? '자료를 정확히 읽고 Overview·핵심 특징·비교를 평가한다.' : task === 'task2' ? '질문의 모든 부분, 명확한 입장, 근거의 발전을 평가한다.' : '기초 문장의 정확성·연결·과제 충족을 평가한다.'}\n3. 분량이 목표보다 짧으면 ${taskCriterion}에 반영한다. 다만 단어 수만으로 점수를 높게 주지 말고 내용의 질과 정확성을 우선한다.\n4. Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy를 각각 독립적으로 평가한다. 힌트 감점은 서버가 별도로 처리하므로 여기서는 감점하지 않는다.\n5. rawScore는 아래 4개 기준 점수의 산술평균을 반올림해 작성한다.\n\n반드시 {\"rawScore\":0,\"resultLabel\":\"pass|partial|needs_practice\",\"errorCount\":0,\"criteria\":{\"taskAchievementOrResponse\":0,\"taskAchievementOrResponseEvidence\":\"\",\"coherenceCohesion\":0,\"coherenceCohesionEvidence\":\"\",\"lexicalResource\":0,\"lexicalResourceEvidence\":\"\",\"grammaticalRangeAccuracy\":0,\"grammaticalRangeAccuracyEvidence\":\"\"},\"feedback\":{\"correctedAnswer\":\"\",\"errors\":[{\"original\":\"\",\"correction\":\"\",\"reason\":\"\"}],\"synonyms\":[\"\"],\"usefulExpressions\":[\"\"],\"improvedAnswer\":\"\",\"keyLearning\":\"\",\"nextFocus\":\"\"},\"skills\":[{\"code\":\"\",\"qualityScore\":0,\"evidenceSummary\":\"\"}]} 형식으로 반환하세요.`;
      const evaluation = jsonObject(
        (await codex.get(user.id).runLearningPrompt(prompt)).text,
      );
      const criteria = criterionRows(evaluation, task);
      const rawScore = Math.round(
        criteria.reduce((sum, criterion) => sum + criterion.score, 0) /
          criteria.length,
      );
      const hintPenalty = usedHints.rows.reduce(
        (sum, row) => sum + Number(row.penalty_score),
        0,
      );
      const effectiveScore = Math.max(0, rawScore - hintPenalty);
      const resultLabel = ['pass', 'partial', 'needs_practice'].includes(
        text(evaluation.resultLabel, 30),
      )
        ? text(evaluation.resultLabel, 30)
        : effectiveScore >= 78
          ? 'pass'
          : effectiveScore >= 60
            ? 'partial'
            : 'needs_practice';
      const words = answer.trim().split(/\s+/).filter(Boolean).length;
      const affects = item.session_type !== 'placement_test';
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const feedback =
          evaluation.feedback && typeof evaluation.feedback === 'object'
            ? (evaluation.feedback as Record<string, unknown>)
            : {};
        const result = await client.query(
          `INSERT INTO writing_attempt_results(session_item_id,answer_text,answer_word_count,answer_character_count,evaluation_status,evaluated_at,raw_score,hint_penalty_score,effective_score,result_label,error_count,feedback_json,affects_progress,feedback_released_at,evaluation_model,rule_version) VALUES($1,$2,$3,$4,'completed',NOW(),$5,$6,$7,$8,$9,$10,$11,CASE WHEN $12 THEN NOW() ELSE NULL END,'gpt-5.6-luna',$13) RETURNING id`,
          [
            itemId,
            answer,
            words,
            [...answer].length,
            rawScore,
            hintPenalty,
            effectiveScore,
            resultLabel,
            Math.max(0, Math.round(number(evaluation.errorCount, 0))),
            JSON.stringify({ ...feedback, criteria, stageExpectation }),
            affects,
            item.session_type === 'learning',
            WRITING_RULE_VERSION,
          ],
        );
        const attemptId = Number(result.rows[0].id);
        const outputSkills = asArray(evaluation.skills);
        for (const criterion of criteria)
          await client.query(
            `INSERT INTO writing_attempt_criterion_results(attempt_result_id,criterion_code,raw_score,descriptor_target,evidence_summary) VALUES($1,$2,$3,$4,$5)`,
            [
              attemptId,
              criterion.code,
              criterion.score,
              `${item.internal_stage_snapshot} · ${taskCriterion}`,
              criterion.evidence,
            ],
          );
        for (const skill of skillRows.rows) {
          const output = outputSkills.find(
            (entry) =>
              entry &&
              typeof entry === 'object' &&
              text((entry as Record<string, unknown>).code, 120) ===
                skill.skill_code,
          ) as Record<string, unknown> | undefined;
          const quality = Math.max(
            0,
            Math.min(100, number(output?.qualityScore, rawScore)),
          );
          const penalty = usedHints.rows
            .filter((hint) => hint.skill_code === skill.skill_code)
            .reduce((sum, hint) => sum + Number(hint.penalty_score), 0);
          await client.query(
            `INSERT INTO writing_attempt_skill_results(attempt_result_id,skill_code,quality_score,hint_penalty_score,effective_score,weight_applied,evidence_summary) VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [
              attemptId,
              skill.skill_code,
              quality,
              penalty,
              Math.max(0, quality - penalty),
              skill.weight,
              text(output?.evidenceSummary, 1000),
            ],
          );
        }
        await client.query(
          `UPDATE writing_session_items SET status='evaluated',completed_at=NOW() WHERE id=$1`,
          [itemId],
        );
        const remaining = await client.query(
          `SELECT COUNT(*)::INTEGER AS count FROM writing_session_items WHERE session_id=$1 AND status<>'evaluated'`,
          [sessionId],
        );
        if (Number(remaining.rows[0].count) === 0) {
          const aggregate = await client.query(
            `SELECT AVG(effective_score) AS score FROM writing_attempt_results r JOIN writing_session_items i ON i.id=r.session_item_id WHERE i.session_id=$1`,
            [sessionId],
          );
          const avg = Number(aggregate.rows[0].score);
          const promotion = item.session_type === 'promotion_test';
          await client.query(
            `UPDATE writing_sessions SET status='completed',completed_at=NOW(),promotion_score=$2,promotion_recommendation=$3 WHERE id=$1`,
            [
              sessionId,
              avg,
              promotion ? (avg >= 80 ? 'ready' : 'not_recommended') : null,
            ],
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      if (affects) await refreshSkillStates(pool, user.id);
      else await applyPlacementResult(pool, user.id, sessionId);
      return c.json({
        submitted: true,
        result: {
          effectiveScore,
          label: resultLabel,
          feedback:
            evaluation.feedback && typeof evaluation.feedback === 'object'
              ? evaluation.feedback
              : {},
        },
        session: await sessionPayload(pool, user.id, sessionId),
      });
    },
  );

  app.post('/api/writing/sessions/:sessionId/abandon', async (c) => {
    const user = c.get('user');
    const sessionId = Number(c.req.param('sessionId'));
    const result = await pool.query(
      `UPDATE writing_sessions SET status='abandoned',abandoned_at=NOW(),updated_at=NOW() WHERE id=$1 AND user_id=$2 AND status IN ('generating','in_progress') RETURNING id`,
      [sessionId, user.id],
    );
    if (!result.rowCount)
      return c.json({ error: '포기할 수 없는 세션입니다.' }, 409);
    await pool.query(
      `UPDATE writing_session_items SET status='abandoned' WHERE session_id=$1 AND status<>'evaluated'`,
      [sessionId],
    );
    return c.json({ abandoned: true });
  });

  app.post('/api/writing/level-change', async (c) => {
    const user = c.get('user');
    const body = await readBody(c);
    const target = text(body.targetPublicLevel, 20) as PublicLevel;
    const group = text(body.targetLevelGroup, 40) || null;
    if (!levelOrder.includes(target))
      return c.json({ error: '올바른 레벨이 아닙니다.' }, 400);
    const active = await getActiveSession(pool, user.id);
    if (active) return c.json({ activeSessionId: Number(active.id) }, 409);
    const profile = await queryProfile(pool, user.id);
    if (
      !profile ||
      levelOrder.indexOf(target) >=
        levelOrder.indexOf(profile.current_public_level as PublicLevel)
    )
      return c.json({ error: '현재보다 낮은 레벨만 선택할 수 있습니다.' }, 400);
    const stage = stageFor(target, group);
    await pool.query(
      `UPDATE user_writing_profiles SET current_public_level=$2,current_level_group=$3,current_internal_stage=$4,current_stage_started_at=NOW(),metrics_refreshed_for_date=NULL,updated_at=NOW() WHERE user_id=$1`,
      [user.id, target, group, stage],
    );
    await pool.query(`DELETE FROM user_writing_skill_states WHERE user_id=$1`, [
      user.id,
    ]);
    await pool.query(
      `INSERT INTO writing_level_change_history(user_id,from_public_level,from_level_group,to_public_level,to_level_group,change_type) VALUES($1,$2,$3,$4,$5,'manual_demotion')`,
      [
        user.id,
        profile.current_public_level,
        profile.current_level_group,
        target,
        group,
      ],
    );
    return c.json({ changed: true, level: levelLabel(target, group) });
  });

  app.post('/api/writing/sessions/:sessionId/apply-promotion', async (c) => {
    const user = c.get('user');
    const sessionId = Number(c.req.param('sessionId'));
    const session = await pool.query(
      `SELECT * FROM writing_sessions WHERE id=$1 AND user_id=$2 AND session_type='promotion_test' AND status='completed' AND promotion_recommendation='ready'`,
      [sessionId, user.id],
    );
    const row = session.rows[0] as Record<string, unknown> | undefined;
    if (!row)
      return c.json({ error: '적용 가능한 승급 결과가 없습니다.' }, 409);
    const target = row.target_public_level as PublicLevel;
    const group = row.target_level_group as string | null;
    await pool.query(
      `UPDATE user_writing_profiles SET current_public_level=$2,current_level_group=$3,current_internal_stage=$4,current_stage_started_at=NOW(),metrics_refreshed_for_date=NULL,updated_at=NOW() WHERE user_id=$1`,
      [user.id, target, group, stageFor(target, group)],
    );
    await pool.query(`DELETE FROM user_writing_skill_states WHERE user_id=$1`, [
      user.id,
    ]);
    await pool.query(
      `INSERT INTO writing_level_change_history(user_id,from_public_level,from_level_group,to_public_level,to_level_group,change_type,source_session_id) VALUES($1,$2,$3,$4,$5,'promotion',$6)`,
      [
        user.id,
        row.public_level_snapshot,
        row.level_group_snapshot,
        target,
        group,
        sessionId,
      ],
    );
    return c.json({ promoted: true, level: levelLabel(target, group) });
  });
}
