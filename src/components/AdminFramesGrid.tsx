'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface FrameRow {
  id: string;
  name: string;
  overlayUrl: string | null;
  isActive: boolean;
  order: number;
}

export default function AdminFramesGrid({ frames }: { frames: FrameRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => [...frames].sort((a, b) => a.order - b.order), [frames]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((f) => f.name.toLowerCase().includes(q));
  }, [sorted, query]);

  async function patch(id: string, data: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/frames/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete frame "${name}"? This can't be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/frames/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = filtered[index + direction];
    const current = filtered[index];
    if (!target || !current) return;
    patch(current.id, { order: target.order });
    patch(target.id, { order: current.order });
  }

  return (
    <div>
      <div className="relative max-w-sm mb-5">
        <input
          className="input pl-9"
          type="search"
          placeholder="Search frames by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <svg
          className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          {query ? `No frames match "${query}".` : 'No frames yet — add one above.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((f, i) => (
            <div key={f.id} className={'card overflow-hidden' + (f.isActive ? '' : ' opacity-60')}>
              <div
                // Sized to the overlay graphic itself (not a fixed-height
                // crop) so admin sees the whole frame at its real shape.
                className={'w-full flex items-center justify-center' + (f.overlayUrl ? '' : ' h-40')}
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
                  <img src={f.overlayUrl} alt={f.name} className="w-full h-auto block" />
                ) : (
                  <span className="text-xs text-gray-500">No overlay graphic</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{f.name}</h3>
                  {!f.isActive && (
                    <span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 whitespace-nowrap">
                      Hidden
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    disabled={i === 0 || busyId === f.id}
                    onClick={() => move(i, -1)}
                    className="btn-secondary px-2 py-1 text-xs"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === filtered.length - 1 || busyId === f.id}
                    onClick={() => move(i, 1)}
                    className="btn-secondary px-2 py-1 text-xs"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1">
                    <input
                      type="checkbox"
                      checked={f.isActive}
                      disabled={busyId === f.id}
                      onChange={(e) => patch(f.id, { isActive: e.target.checked })}
                    />
                    Offered to businesses
                  </label>
                </div>

                <div className="flex gap-3 mt-3">
                  <Link href={`/admin/frames/${f.id}/edit`} className="text-brand-600 font-medium text-sm">
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === f.id}
                    onClick={() => handleDelete(f.id, f.name)}
                    className="text-red-600 font-medium text-sm disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
