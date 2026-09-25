'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardFlyerPreview from '@/components/DashboardFlyerPreview';
import type { DashboardTemplateRow } from '@/components/DashboardTemplatesByCategory';
import type { BrandInfo, FrameOption } from '@/components/TemplatePlaceholderEditor';

/**
 * A festival flyer card on the dashboard: clicking it opens the flyer full
 * size with a "raregreet.com" watermark over it, plus a Download button that
 * charges 5 coins / ₹5 and saves the clean, unwatermarked flyer (see
 * /api/templates/[id]/download).
 */
export default function FestivalFlyerCard({
  template,
  defaultFrame,
  business,
}: {
  template: DashboardTemplateRow;
  defaultFrame: FrameOption | null;
  business: BrandInfo;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No contact is involved in a download, so the full-size view leaves off
  // the sample name/designation/date/photo — matching the downloaded file.
  const cleanTemplate = {
    ...template,
    namePlaceholder: null,
    designationPlaceholder: null,
    datePlaceholder: null,
    photoPlaceholder: null,
  };

  async function download() {
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch(`/api/templates/${template.id}/download`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Download failed');
      const fileRes = await fetch(data.url);
      const blob = await fileRes.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${template.name}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      // Refresh so the wallet / coins shown in the header drop right away.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card overflow-hidden shrink-0 w-44 sm:w-52 snap-start hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
      >
        <DashboardFlyerPreview template={template} defaultFrame={defaultFrame} business={business} />
        <p className="text-xs font-medium text-gray-700 truncate px-2 py-1.5">{template.name}</p>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => !downloading && setOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-3 w-full max-w-md max-h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{template.name}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={downloading}
                className="text-gray-500 hover:text-gray-800 text-xl leading-none px-1"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="relative select-none">
              <DashboardFlyerPreview template={cleanTemplate} defaultFrame={defaultFrame} business={business} />
              <div className="absolute inset-0 overflow-hidden pointer-events-none flex flex-col justify-around items-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="text-white/80 font-bold text-2xl sm:text-3xl tracking-wide -rotate-[30deg] whitespace-nowrap"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
                  >
                    raregreet.com &nbsp; raregreet.com
                  </span>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

            <button type="button" onClick={download} disabled={downloading} className="btn-primary w-full mt-3">
              {downloading ? 'Preparing…' : 'Download (5 coins / ₹5)'}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-1">
              The downloaded flyer has no watermark.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
