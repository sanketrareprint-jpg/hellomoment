'use client';

import { FONT_FAMILIES, resolveCssFontFamily } from '@/lib/fontFamilies';
import { type Align, type TextPlaceholder } from '@/lib/flyerPlaceholders';

// Shared font/size/color/alignment/weight/rotation editor for one text
// placeholder — used by both TemplatePlaceholderEditor (flyer templates) and
// FramePlaceholderEditor (reusable branding frames), so the "advanced
// editing options" a business gets stay byte-for-byte identical between the
// two. Styled as a small MS Word-style ribbon: icon toggle buttons for
// Bold/Italic/Underline/Strikethrough and for alignment, instead of a
// dropdown for everything, plus letter spacing and opacity — the same
// character-formatting controls a Word toolbar offers, sized down to fit
// this editor's compact sidebar.

function ToggleIconButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={
        'flex h-7 w-7 items-center justify-center rounded-md border text-[13px] leading-none transition-colors ' +
        (active
          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50')
      }
    >
      {children}
    </button>
  );
}

const ALIGN_OPTIONS: { value: Align; title: string; icon: React.ReactNode }[] = [
  {
    value: 'left',
    title: 'Align left',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M3.75 6h16.5M3.75 12h10.5M3.75 18h13.5" />
      </svg>
    ),
  },
  {
    value: 'center',
    title: 'Align center',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M3.75 6h16.5M7 12h10M5 18h14" />
      </svg>
    ),
  },
  {
    value: 'right',
    title: 'Align right',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M3.75 6h16.5M9.75 12h10.5M6.75 18h13.5" />
      </svg>
    ),
  },
];

export default function PlaceholderControls({
  title,
  placeholder,
  onChange,
  compact,
}: {
  title: string;
  placeholder: TextPlaceholder;
  onChange: (p: TextPlaceholder) => void;
  compact?: boolean;
}) {
  const isBold = placeholder.fontWeight >= 600;

  return (
    <div className={compact ? '' : 'card p-5'}>
      {title && <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>}

      <div>
        <label className="label">Font</label>
        <select
          className="input"
          style={{ fontFamily: resolveCssFontFamily(placeholder.fontFamily) }}
          value={placeholder.fontFamily ?? 'default'}
          onChange={(e) => onChange({ ...placeholder, fontFamily: e.target.value as TextPlaceholder['fontFamily'] })}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.id} style={{ fontFamily: f.cssFamily }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Word-style character-formatting ribbon: Bold/Italic/Underline/
          Strikethrough toggles, then alignment, as one row of small icon
          buttons instead of dropdowns/checkboxes. */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <ToggleIconButton
          active={isBold}
          onClick={() => onChange({ ...placeholder, fontWeight: isBold ? 400 : 700 })}
          title={isBold ? 'Bold (on) — click for Normal weight' : 'Bold'}
        >
          <span className="font-bold">B</span>
        </ToggleIconButton>
        <ToggleIconButton
          active={Boolean(placeholder.italic)}
          onClick={() => onChange({ ...placeholder, italic: !placeholder.italic })}
          title="Italic"
        >
          <span className="italic font-serif">I</span>
        </ToggleIconButton>
        <ToggleIconButton
          active={Boolean(placeholder.underline)}
          onClick={() => onChange({ ...placeholder, underline: !placeholder.underline })}
          title="Underline"
        >
          <span className="underline">U</span>
        </ToggleIconButton>
        <ToggleIconButton
          active={Boolean(placeholder.strikethrough)}
          onClick={() => onChange({ ...placeholder, strikethrough: !placeholder.strikethrough })}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </ToggleIconButton>

        <span className="mx-0.5 h-5 w-px bg-gray-200" aria-hidden="true" />

        {ALIGN_OPTIONS.map((opt) => (
          <ToggleIconButton
            key={opt.value}
            active={placeholder.align === opt.value}
            onClick={() => onChange({ ...placeholder, align: opt.value })}
            title={opt.title}
          >
            {opt.icon}
          </ToggleIconButton>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <div>
          <label className="label">Font size</label>
          <input
            className="input"
            type="number"
            value={placeholder.fontSize}
            onChange={(e) => onChange({ ...placeholder, fontSize: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Color</label>
          <input
            className="input"
            type="color"
            value={placeholder.color}
            onChange={(e) => onChange({ ...placeholder, color: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Bold weight</label>
          <select
            className="input"
            value={placeholder.fontWeight}
            onChange={(e) => onChange({ ...placeholder, fontWeight: Number(e.target.value) })}
          >
            <option value={400}>Normal</option>
            <option value={600}>Semi-bold</option>
            <option value={700}>Bold</option>
            <option value={800}>Extra bold</option>
          </select>
        </div>
        <div>
          <label className="label">Letter spacing</label>
          <input
            className="input"
            type="number"
            step={0.5}
            value={placeholder.letterSpacing ?? 0}
            onChange={(e) => onChange({ ...placeholder, letterSpacing: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Opacity (%)</label>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={Math.round((placeholder.opacity ?? 1) * 100)}
            onChange={(e) => onChange({ ...placeholder, opacity: Math.max(0, Math.min(100, Number(e.target.value))) / 100 })}
          />
        </div>
        <div>
          <label className="label">Rotation (degrees)</label>
          <input
            className="input"
            type="number"
            min={-180}
            max={180}
            value={placeholder.rotation ?? 0}
            onChange={(e) => onChange({ ...placeholder, rotation: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
