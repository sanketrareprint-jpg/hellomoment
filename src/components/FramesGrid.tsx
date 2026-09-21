'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeleteFrameButton from '@/components/DeleteFrameButton';

export interface BusinessFrameRow {
  id: string;
  name: string;
  overlayUrl: string | null;
  isDefault: boolean;
}

function FramePreview({ overlayUrl, name }: { overlayUrl: string | null; name: string }) {
  return (
    <div
      className="w-full h-40 flex items-center justify-center"
      style={{
        backgroundColor: '#e5e7eb',
        backgroundImage: overlayUrl
          ? undefined
          : 'linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
    >
      {overlayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={overlayUrl} alt={name} className="w-full h-40 object-cover" />
      ) : (
        <span className="text-xs text-gray-500">Positions only — no overlay graphic</span>
      )}
    </div>
  );
}

export default function FramesGrid({ frames }: { frames: BusinessFrameRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  async function setDefault(id: string) {
    setSettingDefault(id);
    try {
      const res = await fetch(`/api/frames/${id}/set-default`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Could not set as default');
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not set as default');
    } finally {
      setSettingDefault(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return frames;
    return frames.filter((f) => f.name.toLowerCase().includes(q));
  }, [frames, query]);

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

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">No frames match &ldquo;{query}&rdquo;.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((f) => (
            <div key={f.id} className="card overflow-hidden">
              <FramePreview overlayUrl={f.overlayUrl} name={f.name} />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{f.name}</h3>
                  {f.isDefault && (
                    <span className="text-xs font-medium bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-3 items-center flex-wrap">
                  <Link href={`/dashboard/frames/${f.id}/edit`} className="text-brand-600 font-medium text-sm">
                    Edit
                  </Link>
                  <DeleteFrameButton id={f.id} name={f.name} />
                  {!f.isDefault && (
                    <button
                      type="button"
                      className="text-brand-600 font-medium text-sm disabled:opacity-50"
                      disabled={settingDefault === f.id}
                      onClick={() => setDefault(f.id)}
                    >
                      {settingDefault === f.id ? 'Setting…' : 'Set as default'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
