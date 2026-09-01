import { VocaAddMenu } from '@/components/voca-add-menu';

type VocaHeaderProps = {
  description: string;
  title: string;
};

export function VocaHeader({ description, title }: VocaHeaderProps) {
  return (
    <div className="flex flex-nowrap items-start justify-between gap-3 sm:gap-5">
      <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#d76a47] sm:text-sm">VOCA</p><h1 className="mt-1 font-serif text-2xl tracking-tight sm:text-5xl">{title}</h1><p className="mt-3 text-sm leading-6 text-[#69736e]">{description}</p></div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5"><VocaAddMenu /></div>
    </div>
  );
}
