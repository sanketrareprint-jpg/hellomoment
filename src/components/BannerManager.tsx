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
  device,
}: {
  banners: BannerRow[];
  placement: 'DASHBOARD' | 'LANDING';
  device: 'DESKTOP' | 'MOBILE';
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [previewBanner, setPreviewBanner] = useState<BannerRow | null>(null);
  const inputId = `banner-file-input-${placement}-${device}`;

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
      formData.set('device', device);
      if (linkUrl.trim()) formData.set('linkUrl', linkUrl.trim());
      const res = await fetch('/api/admin/banners', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setFile(null);
      setLinkUrl('');
      const input = document.getElementById(inputId) as HTMLInputElement | null;
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
      if (previewBanner?.id === id) setPreviewBanner(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Add a banner</h2>
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="label">Banner image</label>
            <input
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {device === 'DESKTOP'
                ? 'Wide banner image (e.g. 1200×400px works well).'
                : 'Mobile banner image (e.g. 800×400px works well).'}{' '}
              JPG, PNG or WebP, max 10MB.
            </p>
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

      {banners.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {banners.map((b) => (
            <div key={b.id} className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.imageUrl}
                alt="Banner"
                className={`w-full object-cover ${device === 'DESKTOP' ? 'aspect-[3/1]' : 'aspect-[2/1]'}`}
              />
              {!b.isActive && (
                <button
                  type="button"
                  disabled={rowBusyId === b.id}
                  onClick={() => patchBanner(b.id, { isActive: true })}
                  className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-black/80"
                  title="Hidden from the site — click to show it again"
                >
                  Hidden · Show
                </button>
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewBanner(b)}
                  className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white"
                  title="Preview"
                  aria-label="Preview banner"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={rowBusyId === b.id}
                  onClick={() => handleDelete(b.id)}
                  className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-red-600 hover:bg-white"
                  title="Delete"
                  aria-label="Delete banner"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewBanner && (
        <BannerPreviewModal
          banner={previewBanner}
          placement={placement}
          device={device}
          onClose={() => setPreviewBanner(null)}
        />
      )}
    </div>
  );
}

// Compact mock of where the banner appears — a small dashboard / landing page
// skeleton in a desktop browser or phone frame, with the real image on top.
function BannerPreviewModal({
  banner,
  placement,
  device,
  onClose,
}: {
  banner: BannerRow;
  placement: 'DASHBOARD' | 'LANDING';
  device: 'DESKTOP' | 'MOBILE';
  onClose: () => void;
}) {
  const bar = 'rounded bg-gray-200';
  const bannerImg = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={banner.imageUrl}
      alt="Banner preview"
      className={`w-full object-cover rounded-md ${device === 'DESKTOP' ? 'aspect-[3/1]' : 'aspect-[2/1]'}`}
    />
  );
  const placeholders = (
    <div className="space-y-2 mt-3">
      <div className={`${bar} h-2.5 w-2/3`} />
      <div className="grid grid-cols-3 gap-2">
        <div className={`${bar} h-8`} />
        <div className={`${bar} h-8`} />
        <div className={`${bar} h-8`} />
      </div>
      <div className={`${bar} h-2.5 w-1/2`} />
      <div className={`${bar} h-12`} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900 text-sm">
            {placement === 'DASHBOARD' ? 'Dashboard' : 'Landing page'} · {device === 'DESKTOP' ? 'Desktop' : 'Mobile'}{' '}
            preview
          </p>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        {device === 'DESKTOP' ? (
          <div className="rounded-lg border border-gray-300 overflow-hidden">
            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1.5 border-b border-gray-200">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="ml-2 flex-1 rounded bg-white h-3" />
            </div>
            {placement === 'DASHBOARD' ? (
              <div className="flex h-72">
                <div className="w-24 bg-brand-700 p-2 space-y-2 flex-shrink-0">
                  <div className="h-3 w-3/4 rounded bg-white/60" />
                  <div className="h-2 rounded bg-white/30" />
                  <div className="h-2 rounded bg-white/30" />
                  <div className="h-2 rounded bg-white/30" />
                </div>
                <div className="flex-1 p-3 overflow-hidden">
                  <div className={`${bar} h-3 w-24 mb-2`} />
                  {bannerImg}
                  {placeholders}
                </div>
              </div>
            ) : (
              <div className="h-72 p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-20 rounded bg-brand-300" />
                  <div className="flex gap-2">
                    <div className={`${bar} h-3 w-10`} />
                    <div className="h-3 w-10 rounded bg-brand-500" />
                  </div>
                </div>
                <div className="px-8">{bannerImg}</div>
                {placeholders}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto w-56 rounded-[1.75rem] border-[6px] border-gray-800 overflow-hidden bg-white">
            <div className="h-4 bg-gray-800 flex justify-center">
              <span className="w-12 h-1.5 mt-1 rounded-full bg-gray-600" />
            </div>
            <div className="h-96 p-2 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="h-2.5 w-14 rounded bg-brand-300" />
                <div className={`${bar} h-2.5 w-6`} />
              </div>
              {placement === 'DASHBOARD' && <div className={`${bar} h-2.5 w-16 mb-2`} />}
              {bannerImg}
              {placeholders}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3 truncate">
          {banner.linkUrl ? `Opens: ${banner.linkUrl}` : 'No link'}
          {!banner.isActive && ' · Hidden from the site'}
        </p>
      </div>
    </div>
  );
}
