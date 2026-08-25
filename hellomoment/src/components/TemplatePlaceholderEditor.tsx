'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Align = 'left' | 'center' | 'right';

interface TextPlaceholder {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: number;
  align: Align;
  maxWidth: number;
  maxLines: number;
}

interface PhotoPlaceholder {
  x: number;
  y: number;
  size: number;
  shape: 'circle' | 'square';
}

export interface TemplateFormValues {
  id?: string;
  name: string;
  occasion: 'BIRTHDAY' | 'ANNIVERSARY' | 'FESTIVAL';
  isDefault: boolean;
  aisensyCampaignName: string;
  backgroundUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  namePlaceholder: TextPlaceholder;
  useDate: boolean;
  datePlaceholder: TextPlaceholder;
  usePhoto: boolean;
  photoPlaceholder: PhotoPlaceholder;
}

function defaultsFor(width: number, height: number): Pick<
  TemplateFormValues,
  'namePlaceholder' | 'datePlaceholder' | 'photoPlaceholder'
> {
  return {
    namePlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.78),
      fontSize: Math.round(width * 0.05),
      color: '#ffffff',
      fontWeight: 700,
      align: 'center',
      maxWidth: Math.round(width * 0.85),
      maxLines: 2,
    },
    datePlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.86),
      fontSize: Math.round(width * 0.03),
      color: '#ffffff',
      fontWeight: 400,
      align: 'center',
      maxWidth: Math.round(width * 0.85),
      maxLines: 1,
    },
    photoPlaceholder: {
      x: Math.round(width * 0.36),
      y: Math.round(height * 0.12),
      size: Math.round(width * 0.28),
      shape: 'circle',
    },
  };
}

export const EMPTY_TEMPLATE: TemplateFormValues = {
  name: '',
  occasion: 'BIRTHDAY',
  isDefault: false,
  aisensyCampaignName: '',
  backgroundUrl: '',
  canvasWidth: 1080,
  canvasHeight: 1080,
  useDate: true,
  usePhoto: true,
  ...defaultsFor(1080, 1080),
};

const PREVIEW_WIDTH = 420;
type DragTarget = 'name' | 'date' | 'photo' | null;

export default function TemplatePlaceholderEditor({ initial }: { initial?: TemplateFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<TemplateFormValues>(initial ?? EMPTY_TEMPLATE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<DragTarget>(null);

  const scale = PREVIEW_WIDTH / form.canvasWidth;
  const previewHeight = form.canvasHeight * scale;

  async function onBackgroundChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads/template', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((f) => ({
        ...f,
        backgroundUrl: data.url,
        canvasWidth: data.width,
        canvasHeight: data.height,
        ...defaultsFor(data.width, data.height),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function startDrag(target: DragTarget) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      dragTarget.current = target;
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragTarget.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const px = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const py = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    const x = Math.round(px / scale);
    const y = Math.round(py / scale);

    setForm((f) => {
      if (dragTarget.current === 'name') return { ...f, namePlaceholder: { ...f.namePlaceholder, x, y } };
      if (dragTarget.current === 'date') return { ...f, datePlaceholder: { ...f.datePlaceholder, x, y } };
      if (dragTarget.current === 'photo')
        return {
          ...f,
          photoPlaceholder: {
            ...f.photoPlaceholder,
            x: Math.round(x - f.photoPlaceholder.size / 2),
            y: Math.round(y - f.photoPlaceholder.size / 2),
          },
        };
      return f;
    });
  }

  function onPointerUp() {
    dragTarget.current = null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.backgroundUrl) {
      setError('Please upload a flyer background image first.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        occasion: form.occasion,
        backgroundUrl: form.backgroundUrl,
        canvasWidth: form.canvasWidth,
        canvasHeight: form.canvasHeight,
        isDefault: form.isDefault,
        aisensyCampaignName: form.aisensyCampaignName || null,
        namePlaceholder: form.namePlaceholder,
        datePlaceholder: form.useDate ? form.datePlaceholder : null,
        photoPlaceholder: form.usePhoto ? form.photoPlaceholder : null,
      };
      const url = form.id ? `/api/templates/${form.id}` : '/api/templates';
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      router.push('/dashboard/templates');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Template name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Birthday — Gold theme"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Occasion</label>
              <select
                className="input"
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value as TemplateFormValues['occasion'] })}
              >
                <option value="BIRTHDAY">Birthday</option>
                <option value="ANNIVERSARY">Anniversary</option>
                <option value="FESTIVAL">Festival</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Use as default for this occasion
              </label>
            </div>
          </div>
          <div>
            <label className="label">AiSensy campaign name (optional override)</label>
            <input
              className="input"
              value={form.aisensyCampaignName}
              onChange={(e) => setForm({ ...form, aisensyCampaignName: e.target.value })}
              placeholder="Leave blank to use your Settings default"
            />
          </div>
          <div>
            <label className="label">Flyer background image</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onBackgroundChange} />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
            {form.backgroundUrl && (
              <p className="text-xs text-gray-500 mt-1">
                {form.canvasWidth}×{form.canvasHeight}px
              </p>
            )}
          </div>
        </div>

        <PlaceholderControls
          title="Name text"
          placeholder={form.namePlaceholder}
          onChange={(p) => setForm({ ...form, namePlaceholder: p })}
        />

        <div className="card p-5 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <input type="checkbox" checked={form.useDate} onChange={(e) => setForm({ ...form, useDate: e.target.checked })} />
            Print the date on the flyer
          </label>
          {form.useDate && (
            <PlaceholderControls
              title=""
              placeholder={form.datePlaceholder}
              onChange={(p) => setForm({ ...form, datePlaceholder: p })}
              compact
            />
          )}
        </div>

        <div className="card p-5 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <input type="checkbox" checked={form.usePhoto} onChange={(e) => setForm({ ...form, usePhoto: e.target.checked })} />
            Overlay the contact&rsquo;s photo
          </label>
          {form.usePhoto && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Size (px)</label>
                <input
                  className="input"
                  type="number"
                  value={form.photoPlaceholder.size}
                  onChange={(e) =>
                    setForm({ ...form, photoPlaceholder: { ...form.photoPlaceholder, size: Number(e.target.value) } })
                  }
                />
              </div>
              <div>
                <label className="label">Shape</label>
                <select
                  className="input"
                  value={form.photoPlaceholder.shape}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      photoPlaceholder: { ...form.photoPlaceholder, shape: e.target.value as 'circle' | 'square' },
                    })
                  }
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading || uploading} className="btn-primary">
            {loading ? 'Saving…' : form.id ? 'Save changes' : 'Create template'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push('/dashboard/templates')}>
            Cancel
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">
          Drag the labeled markers on the flyer to position them. Numbers below give exact control.
        </p>
        <div
          ref={previewRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative rounded-lg overflow-hidden border border-gray-300 bg-gray-100 select-none touch-none"
          style={{ width: PREVIEW_WIDTH, height: previewHeight || PREVIEW_WIDTH }}
        >
          {form.backgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.backgroundUrl} alt="Flyer background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              Upload a background to start positioning
            </div>
          )}

          {form.usePhoto && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('photo')}
              className="absolute border-2 border-dashed border-brand-500 bg-brand-500/20 cursor-move flex items-center justify-center text-[10px] font-medium text-brand-700"
              style={{
                left: form.photoPlaceholder.x * scale,
                top: form.photoPlaceholder.y * scale,
                width: form.photoPlaceholder.size * scale,
                height: form.photoPlaceholder.size * scale,
                borderRadius: form.photoPlaceholder.shape === 'circle' ? '9999px' : '4px',
              }}
            >
              Photo
            </div>
          )}

          {form.backgroundUrl && (
            <div
              onPointerDown={startDrag('name')}
              className="absolute cursor-move px-1 whitespace-nowrap"
              style={{
                left: form.namePlaceholder.x * scale,
                top: form.namePlaceholder.y * scale,
                transform:
                  form.namePlaceholder.align === 'center'
                    ? 'translate(-50%, -50%)'
                    : form.namePlaceholder.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                fontSize: Math.max(10, form.namePlaceholder.fontSize * scale),
                fontWeight: form.namePlaceholder.fontWeight,
                color: form.namePlaceholder.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              Sample Name
            </div>
          )}

          {form.useDate && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('date')}
              className="absolute cursor-move px-1 whitespace-nowrap"
              style={{
                left: form.datePlaceholder.x * scale,
                top: form.datePlaceholder.y * scale,
                transform:
                  form.datePlaceholder.align === 'center'
                    ? 'translate(-50%, -50%)'
                    : form.datePlaceholder.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                fontSize: Math.max(9, form.datePlaceholder.fontSize * scale),
                fontWeight: form.datePlaceholder.fontWeight,
                color: form.datePlaceholder.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              25 August
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

function PlaceholderControls({
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
      <div className="grid grid-cols-2 gap-3">
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
          <label className="label">Max width (px)</label>
          <input
            className="input"
            type="number"
            value={placeholder.maxWidth}
            onChange={(e) => onChange({ ...placeholder, maxWidth: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Max lines</label>
          <input
            className="input"
            type="number"
            min={1}
            max={4}
            value={placeholder.maxLines}
            onChange={(e) => onChange({ ...placeholder, maxLines: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
