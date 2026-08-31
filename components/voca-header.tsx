import { Sparkles } from 'lucide-react';

import { VocaSettings } from '@/components/voca-settings';
import { Button } from '@/components/ui/button';

type VocaHeaderProps = {
  description: string;
  title: string;
};

export function VocaHeader({ description, title }: VocaHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-sm font-semibold text-[#d76a47]">VOCA</p><h1 className="mt-1 font-serif text-4xl tracking-tight sm:text-5xl">{title}</h1><p className="mt-3 text-sm leading-6 text-[#69736e]">{description}</p></div>
      <div className="flex items-center gap-2"><Button className="h-11 rounded-xl bg-[#1d2935] px-4 text-[#fffdf8] hover:bg-[#344451]"><Sparkles className="size-4" aria-hidden="true" />AI로 단어 만들기</Button><VocaSettings /></div>
    </div>
  );
}
