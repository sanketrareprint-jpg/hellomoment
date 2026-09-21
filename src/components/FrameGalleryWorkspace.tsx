'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FramePreview, { type FramePlaceholders } from '@/components/FramePreview';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';

export interface GalleryFrameRow {
  id: string;
  name: string;
  overlayUrl: string | null;
  overlayHue?: number | null;
  canvasWidth: number;
  canvasHeight: number;
  placeholders: FramePlaceholders;
}

type BrandFieldKey = 'name' | 'phoneDisplay' | 'emailDisplay' | 'addressText' | 'websiteUrl' | 'productsText' | 'firmNameMarathi';

const FIELDS: { key: BrandFieldKey; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: 'name', label: 'Business name', placeholder: 'e.g. Rareprint.in' },
  { key: 'phoneDisplay', label: 'Phone number', placeholder: 'e.g. 98765 43210' },
  { key: 'emailDisplay', label: 'Email', placeholder: 'e.g. hello@yourbusiness.com' },
  { key: 'addressText', label: 'Address', placeholder: 'e.g. Shop 3, Main Road, Your City', multiline: true },
  { key: 'websiteUrl', label: 'Website', placeholder: 'e.g. yourbusiness.com' },
  { key: 'productsText', label: 'Products / services', placeholder: 'e.g. Sweets · Snacks · Catering', multiline: true },
];

/**
 * The Frame gallery's "fill your details once, watch every design update
 * live" workspace — business details on one side, the selected frame's
 * preview on the other (via the read-only FramePreview), and the frame
 * collection to pick from. Field edits save straight to the business's own
 * Brand kit (PATCH /api/settings/brand) the same way FramePlaceholderEditor's
 * inline per-field editor does, so they show up on every template too, not
 * just here.
 */
export default function FrameGalleryWorkspace({ frames, business }: { frames: GalleryFrameRow[]; business: BrandInfo }) {
  const router = useRouter();
  const [draft, setDraft] = useState<BrandInfo>(business);
  const [savingKey, setSavingKey] = useState<BrandFieldKey | 'logo' | null>(null);
  const [savedAt, setSavedAt] = useState<Partial<Record<BrandFieldKey | 'logo', number>>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(frames[0]?.id ?? null);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const selected = frames.find((f) => f.id === selectedId) ?? null;

  async function patchBrand(patch: Partial<Record<BrandFieldKey | 'logoUrl', string>>) {
    const res = await fetch('/api/settings/brand', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'Could not save this field');
    return data;
  }

  function updateDraft(key: BrandFieldKey, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function commitField(key: BrandFieldKey) {
    setSavingKey(key);
    setError(null);
    try {
      await patchBrand({ [key]: draft[key] ?? '' });
      setSavedAt((s) => ({ ...s, [key]: Date.now() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this field');
    } finally {
      setSavingKey(null);
    }
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setDraft((d) => ({ ...d, logoUrl: data.url }));
      await patchBrand({ logoUrl: data.url });
      setSavedAt((s) => ({ ...s, logo: Date.now() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  }

  async function adopt(id: string) {
    setAdoptingId(id);
    setError(null);
    try {
      const res = await fetch('/api/frames/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameId: id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not add this frame');
      setAddedIds((prev) => new Set(prev).add(id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this frame');
    } finally {
      setAdoptingId(null);
    }
  }

  if (frames.length === 0) {
    return <p className="text-gray-500 text-sm">No frames have been added to the gallery yet — check back soon.</p>;
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,300px)_minmax(0,300px)_1fr] gap-5">
        <div>
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Frame preview</h3>
          {selected ? (
            <FramePreview
              overlayUrl={selected.overlayUrl}
              overlayHue={selected.overlayHue}
              canvasWidth={selected.canvasWidth}
              canvasHeight={selected.canvasHeight}
              placeholders={selected.placeholders}
              business={draft}
              maxWidth={300}
            />
          ) : (
            <p className="text-sm text-gray-500">Pick a design from the collection to preview it here.</p>
          )}
          {selected && (
            <button
              type="button"
              disabled={adoptingId === selected.id}
              onClick={() => adopt(selected.id)}
              className="btn-primary mt-3 w-full"
            >
              {adoptingId === selected.id ? 'Adding…' : addedIds.has(selected.id) ? 'Add another copy' : '+ Add in frame'}
            </button>
          )}
        </div>

        <div>
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Business details</h3>
          <div className="card p-3 space-y-2.5">
            <div>
              <label className="label">Logo</label>
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                  {draft.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-gray-400">None</span>
                  )}
                </div>
                <input type="file" accept="image/png,image/webp,image/jpeg" onChange={onLogoChange} className="text-xs" />
              </div>
              {uploadingLogo && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              {savedAt.logo && !uploadingLogo && <p className="text-xs text-green-600 mt-1">Saved</p>}
            </div>

            {FIELDS.map((field) => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="label mb-0">{field.label}</label>
                  {savingKey === field.key ? (
                    <span className="text-xs text-gray-400">Saving…</span>
                  ) : savedAt[field.key] ? (
                    <span className="text-xs text-green-600">Saved</span>
                  ) : null}
                </div>
                {field.multiline ? (
                  <textarea
                    className="input"
                    rows={2}
                    value={draft[field.key] ?? ''}
                    onChange={(e) => updateDraft(field.key, e.target.value)}
                    onBlur={() => commitField(field.key)}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    className="input"
                    value={draft[field.key] ?? ''}
                    onChange={(e) => updateDraft(field.key, e.target.value)}
                    onBlur={() => commitField(field.key)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
            <p className="text-xs text-gray-500">
              Saved straight to Settings → Brand kit — updates every template and frame, not just this preview.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Frame collection</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {frames.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedId(f.id)}
                className={
                  'card overflow-hidden text-left transition-shadow ' +
                  (selectedId === f.id ? 'ring-2 ring-brand-500' : 'hover:shadow-md')
                }
              >
                <div
                  className="w-full h-28 flex items-center justify-center"
                  style={{
                    backgroundColor: '#e5e7eb',
                    backgroundImage: f.overlayUrl
                      ? undefined
                      : 'linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  }}
                >
                  {f.overlayUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.overlayUrl}
                      alt={f.name}
                      className="w-full h-full object-contain"
                      style={{ filter: f.overlayHue ? `hue-rotate(${f.overlayHue}deg)` : undefined }}
                    />
                  ) : (
                    <span className="text-xs text-gray-500">Positions only</span>
                  )}
                </div>
                <div className="p-2.5">
                  <h4 className="font-medium text-gray-900 text-sm truncate">{f.name}</h4>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
