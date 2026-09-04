'use client';

import { ArrowRight, ClipboardCheck, GraduationCap, Mic, RotateCcw, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useStaticCopy } from '@/components/static-copy-provider';
import { useDocumentScrollLock } from '@/components/use-document-scroll-lock';

type PracticeCardProps = {
  icon: 'learning' | 'test';
  title: string;
  description: string;
  partOne: string;
  partTwo: string;
  partThree: string;
  mode: 'learning' | 'test';
};

function PracticeCard({ icon, title, description, partOne, partTwo, partThree, mode }: PracticeCardProps) {
  const Icon = icon === 'learning' ? Mic : ClipboardCheck;

  return (
    <article className="rounded-2xl border border-[#dcd6ca] bg-[#fbf9f4] p-6">
      <Icon className="size-5 text-[#d76a47]" />
      <h3 className="mt-5 font-serif text-2xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#69736e]">{description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={`/speaking/part1?mode=${mode}`} className="inline-flex items-center gap-2 rounded-xl border border-[#e4d8cb] bg-white px-3.5 py-2.5 text-sm font-bold text-[#40504d] transition hover:border-[#e6b7a5] hover:bg-[#fff8f4]">{partOne}<ArrowRight className="size-4" /></a>
        <a href={`/speaking/part2?mode=${mode}`} className="inline-flex items-center gap-2 rounded-xl border border-[#e4d8cb] bg-white px-3.5 py-2.5 text-sm font-bold text-[#40504d] transition hover:border-[#e6b7a5] hover:bg-[#fff8f4]">{partTwo}<ArrowRight className="size-4" /></a>
        <a href={`/speaking/part3?mode=${mode}`} className="inline-flex items-center gap-2 rounded-xl border border-[#e4d8cb] bg-white px-3.5 py-2.5 text-sm font-bold text-[#40504d] transition hover:border-[#e6b7a5] hover:bg-[#fff8f4]">{partThree}<ArrowRight className="size-4" /></a>
      </div>
    </article>
  );
}

function PracticeDialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  useDocumentScrollLock(open);
  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="닫기" onClick={onClose} className="fixed inset-0 z-40 bg-[#1d2935]/25 backdrop-blur-[1px]" />
      <section role="dialog" aria-modal="true" aria-label={title} className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-lg -translate-y-1/2 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(29,41,53,0.2)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-3xl text-[#24333a]">{title}</h2>
          <button type="button" aria-label="닫기" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-[#69736e] hover:bg-[#f1ede5]"><X className="size-5" /></button>
        </div>
        {children}
      </section>
    </>
  );
}

export function SpeakingPractice() {
  const [dialog, setDialog] = useState<'promotion' | 'demotion' | null>(null);
  const eyebrow = useStaticCopy('speaking.practice', 'eyebrow', 'PRACTICE');
  const title = useStaticCopy('speaking.practice', 'title', '오늘의 Speaking.');
  const description = useStaticCopy('speaking.practice', 'description', '학습과 테스트 모두 실제 질문에 답하며 진행합니다.');
  const learning = useStaticCopy('speaking.practice', 'learning', '학습하기');
  const learningDescription = useStaticCopy('speaking.practice', 'learning_description', '힌트와 피드백을 사용해 답변을 확장하는 연습입니다.');
  const test = useStaticCopy('speaking.practice', 'test', '일반 테스트');
  const testDescription = useStaticCopy('speaking.practice', 'test_description', '힌트 없이 현재 단계의 말하기 실력을 확인합니다.');
  const partOne = useStaticCopy('speaking.practice', 'part_one', 'Part 1 연습');
  const partTwo = useStaticCopy('speaking.practice', 'part_two', 'Part 2 카드 연습');
  const partThree = useStaticCopy('speaking.practice', 'part_three', 'Part 3 심화 대화');
  const promotion = useStaticCopy('speaking.practice', 'promotion', '승급 테스트');
  const demotion = useStaticCopy('speaking.practice', 'demotion', '강등');
  const promotionDescription = useStaticCopy('speaking.practice', 'promotion_description', '승급 테스트는 Part 1, Part 2, Part 3을 순서대로 완료해 현재 단계보다 높은 수준을 소화할 수 있는지 확인합니다.');
  const promotionPending = useStaticCopy('speaking.practice', 'promotion_pending', '현재 Speaking은 음성 처리와 채점 연동 전 단계입니다. 연결 후 이 창에서 바로 승급 테스트를 시작합니다.');
  const demotionDescription = useStaticCopy('speaking.practice', 'demotion_description', '강등은 현재보다 낮은 공개 레벨을 직접 선택하는 방식으로 제공됩니다. 이전 학습 기록은 유지하고, 새 단계의 측정 점수만 다시 시작합니다.');
  const demotionPending = useStaticCopy('speaking.practice', 'demotion_pending', 'Speaking 레벨 데이터 연동 후 이 창에서 변경할 레벨을 선택할 수 있습니다.');

  return (
    <section className="mt-7 max-w-3xl rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-6 shadow-[0_18px_48px_rgba(35,44,43,0.05)] sm:p-8">
      <p className="text-xs font-bold tracking-[0.14em] text-[#d76a47]">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#69736e]">{description}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <PracticeCard icon="learning" title={learning} description={learningDescription} partOne={partOne} partTwo={partTwo} partThree={partThree} mode="learning" />
        <PracticeCard icon="test" title={test} description={testDescription} partOne={partOne} partTwo={partTwo} partThree={partThree} mode="test" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={() => setDialog('promotion')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d2935] px-4 text-sm font-bold text-[#fffdf8] transition active:scale-[.98] hover:bg-[#344451]"><GraduationCap className="size-4" />{promotion}</button>
        <button type="button" onClick={() => setDialog('demotion')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d7cfc2] px-4 text-sm font-semibold text-[#69736e] transition active:scale-[.98] hover:bg-[#f6f2ea]"><RotateCcw className="size-4" />{demotion}</button>
      </div>

      <PracticeDialog open={dialog === 'promotion'} title={promotion} onClose={() => setDialog(null)}>
        <p className="mt-4 text-sm leading-6 text-[#69736e]">{promotionDescription}</p>
        <p className="mt-4 rounded-2xl bg-[#fff4ee] p-4 text-sm leading-6 text-[#7b6357]">{promotionPending}</p>
      </PracticeDialog>
      <PracticeDialog open={dialog === 'demotion'} title={demotion} onClose={() => setDialog(null)}>
        <p className="mt-4 text-sm leading-6 text-[#69736e]">{demotionDescription}</p>
        <p className="mt-4 rounded-2xl bg-[#f1f5f1] p-4 text-sm leading-6 text-[#5e7066]">{demotionPending}</p>
      </PracticeDialog>
    </section>
  );
}
