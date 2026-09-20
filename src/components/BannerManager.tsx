'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface BannerRow {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
}

export default function BannerManager({
  banners,
  placement,
}: {
  banners: BannerRow[];
  placement: 'DASHBOARD' | 'LANDING';
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Choose an image first.');
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('placement', placement);
      if (linkUrl.trim()) formData.set('linkUrl', linkUrl.trim());
      const res = await fetch('/api/admin/banners', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setFile(null);
      setLinkUrl('');
      const input = document.getElementById(`banner-file-input-${placement}`) as HTMLInputElement | null;
      if (input) input.value = '';
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function patchBanner(id: string, data: Record<string, unknown>) {
    setRowBusyId(id);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this banner? This cannot be undone.')) return;
    setRowBusyId(id);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRowBusyId(null);
    }
  }

  function moveBanner(index: number, direction: -1 | 1) {
    const target = banners[index + direction];
    const current = banners[index];
    if (!target || !current) return;
    // Swap the two orders.
    patchBanner(current.id, { order: target.order });
    patchBanner(target.id, { order: current.order });
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Add a banner</h2>
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="label">Banner image</label>
            <input
              id={`banner-file-input-${placement}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Wide banner image (e.g. 1200×400px works well). JPG, PNG or WebP, max 10MB.</p>
          </div>
          <div>
            <label className="label">Link (optional)</label>
            <input
              className="input"
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">If set, the banner opens this link when clicked.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Uploading…' : '+ Add banner'}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">
          Banners ({banners.length}) — shown as a slider on{' '}
          {placement === 'DASHBOARD' ? "every business's dashboard" : 'the landing page'}
        </h2>
        {banners.length === 0 ? (
          <p className="text-sm text-gray-500">No banners yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {banners.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt="Banner" className="w-32 h-16 object-cover rounded border border-gray-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{b.linkUrl || 'No link'}</p>
                  <p className="text-xs text-gray-400">Order {b.order}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    disabled={i === 0 || rowBusyId === b.id}
                    onClick={() => moveBanner(i, -1)}
                    className="btn-secondary px-2 py-1 text-xs"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === banners.length - 1 || rowBusyId === b.id}
                    onClick={() => moveBanner(i, 1)}
                    className="btn-secondary px-2 py-1 text-xs"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={b.isActive}
                      disabled={rowBusyId === b.id}
                      onChange={(e) => patchBanner(b.id, { isActive: e.target.checked })}
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    disabled={rowBusyId === b.id}
                    onClick={() => handleDelete(b.id)}
                    className="btn-danger px-2 py-1 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
