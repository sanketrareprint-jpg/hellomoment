'use client';

// One toolbar button per placeable element (logo/firm name/phone/…), shared
// by FramePlaceholderEditor and TemplatePlaceholderEditor so the two
// editors' toolbars render pixel-identical instead of each keeping its own
// slightly-drifted copy of this markup.
export default function PlaceholderToolbarButton({
  def,
  on,
  selected,
  locked,
  onClick,
}: {
  def: { label: string; icon: string };
  on: boolean;
  selected: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={def.label}
      className={[
        'relative flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1 text-[9px] font-medium leading-tight transition-colors',
        selected
          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
          : on
            ? 'border-brand-200 bg-brand-50/60 text-brand-700 hover:border-brand-400'
            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50',
      ].join(' ')}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={def.icon} />
      </svg>
      <span>{def.label}</span>
      {on && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-500" />}
      {locked && (
        <svg className="absolute top-0.5 left-0.5 w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1.5a4.5 4.5 0 00-4.5 4.5v3H6a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 006 21h12a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0018 9h-1.5V6A4.5 4.5 0 0012 1.5zm-3 7.5V6a3 3 0 116 0v3H9z" />
        </svg>
      )}
    </button>
  );
}
