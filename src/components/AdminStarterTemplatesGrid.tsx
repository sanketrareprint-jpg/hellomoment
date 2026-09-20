'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const OCCASION_LABEL: Record<string, string> = {
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  FESTIVAL: 'Festival',
};

export interface StarterTemplateRow {
  id: string;
  name: string;
  occasion: string;
  backgroundUrl: string;
  isActive: boolean;
  order: number;
}

export default function AdminStarterTemplatesGrid({ templates }: { templates: StarterTemplateRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => [...templates].sort((a, b) => a.order - b.order), [templates]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (t) => t.name.toLowerCase().includes(q) || (OCCASION_LABEL[t.occasion] ?? t.occasion).toLowerCase().includes(q)
    );
  }, [sorted, query]);

  async function patch(id: string, data: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/starter-templates/${id}`, {
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
    if (!confirm(`Delete template "${name}"? This can't be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/starter-templates/${id}`, { method: 'DELETE' });
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
          placeholder="Search templates by name or occasion…"
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
          {query ? `No templates match "${query}".` : 'No starter templates yet — add one above.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t, i) => (
            <div key={t.id} className={'card overflow-hidden' + (t.isActive ? '' : ' opacity-60')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.backgroundUrl} alt={t.name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                  {!t.isActive && (
                    <span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 whitespace-nowrap">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{OCCASION_LABEL[t.occasion] ?? t.occasion}</p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    disabled={i === 0 || busyId === t.id}
                    onClick={() => move(i, -1)}
                    className="btn-secondary px-2 py-1 text-xs"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === filtered.length - 1 || busyId === t.id}
                    onClick={() => move(i, 1)}
                    className="btn-secondary px-2 py-1 text-xs"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1">
                    <input
                      type="checkbox"
                      checked={t.isActive}
                      disabled={busyId === t.id}
                      onChange={(e) => patch(t.id, { isActive: e.target.checked })}
                    />
                    Offered to businesses
                  </label>
                </div>

                <div className="flex gap-3 mt-3">
                  <Link href={`/admin/templates/${t.id}/edit`} className="text-brand-600 font-medium text-sm">
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => handleDelete(t.id, t.name)}
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
