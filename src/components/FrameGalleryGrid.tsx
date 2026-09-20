'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface GalleryFrameRow {
  id: string;
  name: string;
  overlayUrl: string | null;
}

export default function FrameGalleryGrid({ frames }: { frames: GalleryFrameRow[] }) {
  const router = useRouter();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function adopt(id: string) {
    setAddingId(id);
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
      setAddingId(null);
    }
  }

  if (frames.length === 0) {
    return <p className="text-gray-500 text-sm">No frames have been added to the gallery yet — check back soon.</p>;
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {frames.map((f) => (
          <div key={f.id} className="card overflow-hidden">
            <div
              className="w-full h-40 flex items-center justify-center"
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
                <img src={f.overlayUrl} alt={f.name} className="w-full h-40 object-cover" />
              ) : (
                <span className="text-xs text-gray-500">Positions only — no overlay graphic</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{f.name}</h3>
              <button
                type="button"
                disabled={addingId === f.id}
                onClick={() => adopt(f.id)}
                className="btn-secondary mt-3 text-sm disabled:opacity-50"
              >
                {addingId === f.id ? 'Adding…' : addedIds.has(f.id) ? 'Add another copy' : '+ Add to my frames'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
