'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FramePlaceholders } from '@/components/FramePreview';
import FramePlaceholderEditor, { type FrameFormValues } from '@/components/FramePlaceholderEditor';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';
import { frameDefaultsFor } from '@/lib/framePlaceholders';

export interface GalleryFrameRow {
  id: string;
  name: string;
  overlayUrl: string | null;
  overlayHue?: number | null;
  canvasWidth: number;
  canvasHeight: number;
  placeholders: FramePlaceholders;
}

// A business's own copy of a gallery frame (a BusinessFrame row, e.g. as
// returned by POST /api/frames/adopt) → the editor's form values — same mapping as the Edit frame page
// (src/app/dashboard/frames/[id]/edit/page.tsx).
function editorValuesFor(frame: Record<string, any>): FrameFormValues {
  const defaults = frameDefaultsFor(frame.canvasWidth, frame.canvasHeight);
  const parse = (json: string | null) => (json ? JSON.parse(json) : null);
  const logo = parse(frame.logoPlaceholder);
  const firmName = parse(frame.firmNamePlaceholder);
  const phone = parse(frame.phonePlaceholder);
  const email = parse(frame.emailPlaceholder);
  const address = parse(frame.addressPlaceholder);
  const website = parse(frame.websitePlaceholder);
  const products = parse(frame.productsPlaceholder);
  return {
    id: frame.id,
    name: frame.name,
    isDefault: frame.isDefault,
    overlayUrl: frame.overlayUrl ?? '',
    overlayHue: frame.overlayHue,
    canvasWidth: frame.canvasWidth,
    canvasHeight: frame.canvasHeight,
    useLogo: Boolean(logo),
    logoPlaceholder: { ...defaults.logoPlaceholder, ...(logo ?? {}) },
    useFirmName: Boolean(firmName),
    firmNamePlaceholder: { ...defaults.firmNamePlaceholder, ...(firmName ?? {}) },
    usePhone: Boolean(phone),
    phonePlaceholder: { ...defaults.phonePlaceholder, ...(phone ?? {}) },
    useEmail: Boolean(email),
    emailPlaceholder: { ...defaults.emailPlaceholder, ...(email ?? {}) },
    useAddress: Boolean(address),
    addressPlaceholder: { ...defaults.addressPlaceholder, ...(address ?? {}) },
    useWebsite: Boolean(website),
    websitePlaceholder: { ...defaults.websitePlaceholder, ...(website ?? {}) },
    useProducts: Boolean(products),
    productsPlaceholder: { ...defaults.productsPlaceholder, ...(products ?? {}) },
    customTexts: parse(frame.customTextPlaceholders) ?? [],
  };
}

/**
 * The Frame gallery: opens the frame editor directly on the business's own
 * copy of the selected gallery frame, with a full-height preview. A frame
 * the business hasn't added yet shows a single "Use this frame" button,
 * which adds it (POST /api/frames/adopt) and opens it in the editor.
 */
export default function FrameGalleryWorkspace({
  frames,
  business,
  copies,
}: {
  frames: GalleryFrameRow[];
  business: BrandInfo;
  // Gallery frame id → this business's latest copy of it, if any.
  copies: Record<string, Record<string, any>>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(frames[0]?.id ?? null);
  const [localCopies, setLocalCopies] = useState(copies);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = frames.find((f) => f.id === selectedId) ?? null;
  const copy = selected ? localCopies[selected.id] : undefined;

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
      if (data?.frame) setLocalCopies((prev) => ({ ...prev, [id]: data.frame }));
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
      {frames.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {frames.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedId(f.id)}
              className={
                'rounded-full px-3 py-1 text-sm border ' +
                (selectedId === f.id ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50')
              }
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {selected && copy ? (
        <FramePlaceholderEditor
          key={copy.id}
          business={business}
          initial={editorValuesFor(copy)}
          redirectPath="/dashboard/frames?folder=my"
          fullHeightPreview
        />
      ) : selected ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-700">{selected.name}</p>
          <button
            type="button"
            disabled={adoptingId === selected.id}
            onClick={() => adopt(selected.id)}
            className="btn-primary"
          >
            {adoptingId === selected.id ? 'Adding…' : 'Use this frame'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
