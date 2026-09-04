import { useStaticCopy } from '@/components/static-copy-provider';

export function SpeakingHeader() {
  const eyebrow = useStaticCopy('speaking.common', 'eyebrow', 'SPEAKING');
  const title = useStaticCopy('speaking.common', 'title', '나의 Speaking 진단.');
  const description = useStaticCopy('speaking.common', 'description', '말하기 학습과 테스트 기록을 바탕으로 다음 연습을 이어가세요.');

  return <header><p className="text-xs font-semibold text-[#d76a47] sm:text-sm">{eyebrow}</p><h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#69736e]">{description}</p></header>;
}
