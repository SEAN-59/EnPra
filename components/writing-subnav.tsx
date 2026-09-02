type WritingSubnavProps = {
  activeItem: 'BOARD' | 'PRACTICE' | 'NOTEBOOK';
};

const items: Array<{ label: WritingSubnavProps['activeItem']; href: string }> = [
  { label: 'BOARD', href: '/writing' },
  { label: 'PRACTICE', href: '/writing/practice' },
  { label: '오답노트', href: '/writing/notebook' },
];

export function WritingSubnav({ activeItem }: WritingSubnavProps) {
  return (
    <nav aria-label="Writing 하위 메뉴" className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
      <div className="flex w-max min-w-full items-end gap-2 border-b border-[#dcd6ca]">
        {items.map(({ label, href }) => {
          const active = label === activeItem;
          return <a key={label} href={href} className={active ? 'relative -mb-px rounded-t-2xl border border-b-[#fffdf8] border-[#dcd6ca] bg-[#fffdf8] px-5 py-3 text-sm font-bold tracking-wide text-[#1d2935] shadow-[0_-4px_16px_rgba(35,44,43,0.03)]' : 'rounded-t-2xl border border-transparent px-5 py-3 text-sm font-semibold tracking-wide text-[#7b827e] hover:bg-[#eee9df] hover:text-[#3e4b50]'}>{label}</a>;
        })}
      </div>
    </nav>
  );
}
