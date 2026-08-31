type StudySubnavProps = {
  activeItem: 'BOARD' | 'LIST' | 'PRACTICE' | 'TEST';
};

const items: StudySubnavProps['activeItem'][] = ['BOARD', 'LIST', 'PRACTICE', 'TEST'];

export function StudySubnav({ activeItem }: StudySubnavProps) {
  return (
    <nav aria-label="VOCA 하위 메뉴" className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
      <div className="flex w-max min-w-full items-end gap-2 border-b border-[#dcd6ca]">
        {items.map((item) => {
          const active = item === activeItem;
          return <a key={item} href={item === 'BOARD' ? '/voca' : '/voca'} className={active ? 'relative -mb-px rounded-t-2xl border border-b-[#fffdf8] border-[#dcd6ca] bg-[#fffdf8] px-5 py-3 text-sm font-bold tracking-wide text-[#1d2935] shadow-[0_-4px_16px_rgba(35,44,43,0.03)]' : 'rounded-t-2xl border border-transparent px-5 py-3 text-sm font-semibold tracking-wide text-[#7b827e] hover:bg-[#eee9df] hover:text-[#3e4b50]'}>{item}</a>;
        })}
      </div>
    </nav>
  );
}
