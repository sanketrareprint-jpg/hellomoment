'use client';

import { FONT_FAMILIES } from '@/lib/fontFamilies';
import { type Align, type TextPlaceholder } from '@/lib/flyerPlaceholders';

// Shared font/size/color/alignment/weight/rotation editor for one text
// placeholder — used by both TemplatePlaceholderEditor (flyer templates) and
// FramePlaceholderEditor (reusable branding frames), so the "advanced
// editing options" a business gets stay identical between the two.
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
  return (
    <div className={compact ? '' : 'card p-5'}>
      {title && <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>}
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="label">Font</label>
          <select
            className="input"
            value={placeholder.fontFamily ?? 'default'}
            onChange={(e) => onChange({ ...placeholder, fontFamily: e.target.value as TextPlaceholder['fontFamily'] })}
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
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
          <label className="label">Alignment</label>
          <select
            className="input"
            value={placeholder.align}
            onChange={(e) => onChange({ ...placeholder, align: e.target.value as Align })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="label">Bold</label>
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
