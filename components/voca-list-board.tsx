"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  ListChecks,
  RotateCcw,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { useDocumentScrollLock } from "@/components/use-document-scroll-lock";

type VocabularyList = {
  id: number;
  title: string;
  scope: "common" | "personal";
  listType: "daily" | "custom" | "ai_generated";
  learningDate: string | null;
  wordCount: number;
};
type LearningStatus = "needed" | "completed" | null;
type VocabularyWord = {
  id: number;
  word: string;
  pronunciationIpa: string;
  learningStatus: LearningStatus;
  isImportant: boolean;
  meanings: Array<{ partOfSpeech: string; text: string }>;
};
type ListsResponse = { lists?: VocabularyList[]; error?: string };
type DetailResponse = {
  list?: VocabularyList;
  words?: VocabularyWord[];
  error?: string;
};
type WordStatusResponse = {
  wordId: number;
  learningStatus: LearningStatus;
  isImportant: boolean;
  error?: string;
};

function FittedWord({
  word,
  pronunciationIpa,
}: Pick<VocabularyWord, "word" | "pronunciationIpa">) {
  const wordRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const element = wordRef.current;
    if (!element) return;
    const fit = () => {
      const maximum = window.matchMedia("(min-width: 640px)").matches ? 36 : 24;
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

  return (
    <div className="min-w-0 flex-1">
      <h3
        ref={wordRef}
        className="w-full truncate font-serif font-semibold tracking-[-0.035em] text-[#293632]"
      >
        {word}
      </h3>
      <p className="mt-1 truncate text-xs font-medium tracking-[0.04em] text-[#8b938e] sm:text-sm">
        /{pronunciationIpa}/
      </p>
    </div>
  );
}

function partOfSpeechLabel(value: string) {
  const labels: Record<string, string> = {
    n: "n.",
    v: "v.",
    a: "a.",
    ad: "ad.",
    prep: "prep.",
    phrase: "phr.",
    conj: "conj.",
  };
  return labels[value] ?? value;
}

function MaterialSymbol({
  children,
  size = "text-[18px]",
}: {
  children: string;
  size?: "text-[14px]" | "text-[18px]";
}) {
  return (
    <span className={`material-symbols-rounded ${size}`} aria-hidden="true">
      {children}
    </span>
  );
}

function WordStatusButtons({
  word,
  pending,
  onChange,
}: {
  word: VocabularyWord;
  pending: boolean;
  onChange: (
    changes: Partial<Pick<VocabularyWord, "learningStatus" | "isImportant">>,
  ) => void;
}) {
  const buttonClass =
    "grid size-7 place-items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-50 sm:size-8";
  return (
    <div
      className="flex shrink-0 items-center gap-1"
      aria-label={`${word.word} 학습 상태`}
    >
      <button
        type="button"
        aria-label="학습 완료"
        title="학습 완료"
        aria-pressed={word.learningStatus === "completed"}
        disabled={pending}
        onClick={() =>
          onChange({
            learningStatus:
              word.learningStatus === "completed" ? null : "completed",
          })
        }
        className={`${buttonClass} ${word.learningStatus === "completed" ? "bg-[#e4f2e8] text-[#2c7750]" : "text-[#a5aca7] hover:bg-[#edf4ef] hover:text-[#40785a]"}`}
      >
        <MaterialSymbol>check_circle</MaterialSymbol>
      </button>
      <button
        type="button"
        aria-label="학습 필요"
        title="학습 필요"
        aria-pressed={word.learningStatus === "needed"}
        disabled={pending}
        onClick={() =>
          onChange({
            learningStatus: word.learningStatus === "needed" ? null : "needed",
          })
        }
        className={`${buttonClass} ${word.learningStatus === "needed" ? "bg-[#fff0e9] text-[#c86442]" : "text-[#a5aca7] hover:bg-[#fff3ed] hover:text-[#c86442]"}`}
      >
        <MaterialSymbol>pending_actions</MaterialSymbol>
      </button>
      <button
        type="button"
        aria-label="중요 단어"
        title="중요 단어"
        aria-pressed={word.isImportant}
        disabled={pending}
        onClick={() => onChange({ isImportant: !word.isImportant })}
        className={`${buttonClass} ${word.isImportant ? "bg-[#fff3c9] text-[#a97408]" : "text-[#a5aca7] hover:bg-[#fff7dd] hover:text-[#a97408]"}`}
      >
        <MaterialSymbol>star</MaterialSymbol>
      </button>
    </div>
  );
}

async function readResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || "요청을 처리하지 못했습니다.");
  }
}

export function VocaListBoard() {
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [selected, setSelected] = useState<VocabularyList | null>(null);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listMenuId, setListMenuId] = useState<number | null>(null);
  const [removingListId, setRemovingListId] = useState<number | null>(null);
  const [statusWordId, setStatusWordId] = useState<number | null>(null);
  useDocumentScrollLock(listMenuId !== null);

  async function selectList(list: VocabularyList) {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/vocabulary/list/${list.id}`, {
        cache: "no-store",
      });
      const result = await readResponse<DetailResponse>(response);
      if (!response.ok || !result.list)
        throw new Error(result.error ?? "단어 목록을 불러오지 못했습니다.");
      setSelected(result.list);
      setWords(result.words ?? []);
      window.history.replaceState(null, "", `/voca/list?list=${list.id}`);
    } catch (error) {
      toast.add({
        title: "단어 목록을 불러오지 못했어요.",
        description:
          error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요.",
        type: "error",
        priority: "high",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  async function removeList(list: VocabularyList) {
    const action = list.scope === "common" ? "내 목록에서 제거" : "목록 지우기";
    if (!window.confirm(`‘${list.title}’을 ${action}할까요?`)) return;
    setRemovingListId(list.id);
    try {
      const response = await fetch(`/api/vocabulary/list/${list.id}`, {
        method: "DELETE",
      });
      const result = await readResponse<{ error?: string }>(response);
      if (!response.ok)
        throw new Error(result.error ?? "단어 목록을 지우지 못했습니다.");
      setLists((current) => current.filter((item) => item.id !== list.id));
      setListMenuId(null);
      toast.add({
        title:
          list.scope === "common"
            ? "단어 목록을 내 목록에서 제거했어요."
            : "단어 목록을 지웠어요.",
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: "단어 목록을 지우지 못했어요.",
        description:
          error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요.",
        type: "error",
        priority: "high",
      });
    } finally {
      setRemovingListId(null);
    }
  }

  async function updateWordStatus(
    word: VocabularyWord,
    changes: Partial<Pick<VocabularyWord, "learningStatus" | "isImportant">>,
  ) {
    setStatusWordId(word.id);
    try {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", wordId: word.id, ...changes }),
      });
      const result = await readResponse<WordStatusResponse>(response);
      if (!response.ok)
        throw new Error(result.error ?? "단어 상태를 저장하지 못했습니다.");
      setWords((current) =>
        current.map((item) =>
          item.id === word.id
            ? {
                ...item,
                learningStatus: result.learningStatus,
                isImportant: result.isImportant,
              }
            : item,
        ),
      );
    } catch (error) {
      toast.add({
        title: "단어 상태를 저장하지 못했어요.",
        description:
          error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요.",
        type: "error",
        priority: "high",
      });
    } finally {
      setStatusWordId(null);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/vocabulary", { cache: "no-store" })
      .then(async (response) => {
        const result = await readResponse<ListsResponse>(response);
        if (!response.ok)
          throw new Error(result.error ?? "단어 목록을 불러오지 못했습니다.");
        if (!active) return;
        const nextLists = result.lists ?? [];
        setLists(nextLists);
        const requestedId = Number(
          new URLSearchParams(window.location.search).get("list"),
        );
        const requestedList = nextLists.find((list) => list.id === requestedId);
        if (requestedList) void selectList(requestedList);
      })
      .catch((error) => {
        if (active)
          toast.add({
            title: "단어 목록을 불러오지 못했어요.",
            description:
              error instanceof Error
                ? error.message
                : "잠시 후 다시 시도해 주세요.",
            type: "error",
            priority: "high",
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("generated") !== "1") return;
    const added = Number(params.get("added") ?? "0");
    if (params.get("partial") === "1") {
      toast.add({
        title: `${added}개 단어를 저장했어요.`,
        description: "중복 항목이 많아 요청한 수를 모두 채우지는 못했어요.",
        type: "warning",
      });
    } else {
      toast.add({
        title: `${added}개 AI 단어를 저장했어요.`,
        description: "새 개인 단어 목록을 열었습니다.",
        type: "success",
      });
    }
    params.delete("generated");
    params.delete("added");
    params.delete("partial");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `/voca/list${query ? `?${query}` : ""}`,
    );
  }, []);

  if (selected) {
    return (
      <section className="mt-7" aria-labelledby="word-list-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setWords([]);
                window.history.replaceState(null, "", "/voca/list");
              }}
              aria-label="단어 목록으로 돌아가기"
              className="inline-flex shrink-0 items-center text-[#596560] transition-colors hover:text-[#d76a47]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">
                {selected.scope === "common"
                  ? "COMMON VOCABULARY"
                  : "MY VOCABULARY"}
              </p>
              <h2
                id="word-list-title"
                className="mt-1 font-serif text-2xl sm:text-3xl"
              >
                {selected.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              toast.add({
                title: "이 목록으로 학습을 시작할 준비 중입니다.",
                type: "info",
              })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#1d2935] px-3 text-xs font-semibold text-[#fffdf8] transition-transform hover:bg-[#344451] active:scale-95"
          >
            학습하기 <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        {detailLoading ? (
          <p className="rounded-3xl border border-[#ded7ca] bg-[#fffdf8] px-5 py-12 text-center text-sm text-[#77807a]">
            단어를 불러오는 중입니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] shadow-[0_18px_48px_rgba(35,44,43,0.05)]">
            {words.map((item, index) => (
              <article
                key={item.id}
                className="grid grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-center gap-3 border-b border-[#e7e0d5] px-5 py-5 last:border-b-0 sm:gap-8 sm:px-7"
              >
                <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                  <span className="w-4 shrink-0 text-xs font-semibold text-[#a3aaa5] sm:w-5">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <FittedWord
                      word={item.word}
                      pronunciationIpa={item.pronunciationIpa}
                    />
                    <div className="mt-3 flex justify-start">
                      <WordStatusButtons
                        word={item}
                        pending={statusWordId === item.id}
                        onChange={(changes) => void updateWordStatus(item, changes)}
                      />
                    </div>
                  </div>
                </div>
                <div className="self-stretch border-l border-[#e9e1d6] pl-3 text-sm leading-6 text-[#59645e] sm:pl-7 sm:text-base sm:leading-7">
                  <div className="min-w-0 flex-1">
                    {item.meanings.map((meaning, meaningIndex) => (
                      <p
                        key={`${meaning.partOfSpeech}-${meaning.text}`}
                        className="flex gap-2"
                      >
                        <span className="w-9 shrink-0 font-semibold text-[#d76a47]">
                          {meaningIndex === 0 ||
                          item.meanings[meaningIndex - 1].partOfSpeech !==
                            meaning.partOfSpeech
                            ? partOfSpeechLabel(meaning.partOfSpeech)
                            : ""}
                        </span>
                        <span>{meaning.text}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mt-7 w-full" aria-labelledby="saved-list-title">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks className="size-4 text-[#d76a47]" aria-hidden="true" />
        <h2 id="saved-list-title" className="font-serif text-2xl">
          저장된 단어 리스트
        </h2>
      </div>
      {loading ? (
        <p className="rounded-2xl border border-[#ded7ca] bg-[#fffdf8] px-5 py-10 text-center text-sm text-[#77807a]">
          목록을 불러오는 중입니다.
        </p>
      ) : lists.length ? (
        <div className="space-y-3">
          {lists.map((list) => (
            <article
              key={list.id}
              className="flex items-center gap-2 rounded-2xl border border-[#ded7ca] bg-[#fffdf8] p-4 text-left shadow-[0_8px_20px_rgba(35,44,43,0.035)] transition-colors hover:border-[#e6b7a5] hover:bg-[#fff8f4]"
            >
              <button
                type="button"
                onClick={() => void selectList(list)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0eb] text-[#38634f]">
                  <BookOpenCheck className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{list.title}</span>
                    <span className="shrink-0 text-xs text-[#8a918b]">
                      {list.scope === "common" ? "공통" : "개인"}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-[#6e7772]">
                    {list.wordCount}개
                  </span>
                </span>
              </button>
              <div className="relative shrink-0">
                <button
                  type="button"
                  aria-label={`${list.title} 목록 설정`}
                  aria-expanded={listMenuId === list.id}
                  onClick={() =>
                    setListMenuId((current) =>
                      current === list.id ? null : list.id,
                    )
                  }
                  className="grid size-9 place-items-center rounded-xl text-[#69736e] transition-colors hover:bg-[#f1ede5] active:scale-95"
                >
                  <Settings className="size-4" aria-hidden="true" />
                </button>
                {listMenuId === list.id && (
                  <>
                    <button
                      type="button"
                      aria-label="목록 설정 닫기"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setListMenuId(null)}
                    />
                    <div className="absolute right-0 top-[calc(100%+0.35rem)] z-20 w-44 overflow-hidden rounded-xl border border-[#dcd6ca] bg-[#fffdf8] p-1.5 shadow-[0_14px_30px_rgba(29,41,53,0.14)]">
                      <button
                        type="button"
                        onClick={() => {
                          setListMenuId(null);
                          toast.add({
                            title: "학습현황 초기화는 준비 중입니다.",
                            type: "info",
                          });
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#4e5a55] hover:bg-[#f1ede5]"
                      >
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                        학습현황 초기화
                      </button>
                      <button
                        type="button"
                        disabled={removingListId === list.id}
                        onClick={() => void removeList(list)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#c3533e] hover:bg-[#fff0eb] disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        목록 지우기
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#d8d0c3] bg-[#fbf9f4] px-6 py-12 text-center">
          <BookOpenCheck
            className="mx-auto size-6 text-[#9ba39d]"
            aria-hidden="true"
          />
          <p className="mt-4 font-semibold text-[#52605b]">
            아직 불러온 단어 목록이 없습니다.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#7a827d]">
            VOCA 상단의 + 버튼에서 공통 목록을 추가하거나, 개인 단어 목록을
            만들어 보세요.
          </p>
        </div>
      )}
    </section>
  );
}
