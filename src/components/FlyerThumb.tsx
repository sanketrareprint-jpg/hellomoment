'use client';

import { useEffect, useState } from 'react';

export default function FlyerThumb({ url, recipient }: { url: string; recipient: string }) {
  const [open, setOpen] = useState(false);

  // Close on Escape while the preview is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const downloadName = `flyer-${recipient.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'flyer'}.jpg`;

  return (
    <>
      <div className="relative w-12 h-12 group">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-12 h-12 rounded overflow-hidden border border-gray-200"
          title="Preview flyer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Flyer" className="w-12 h-12 object-cover" />
        </button>
        <a
          href={url}
          download={downloadName}
          onClick={(e) => e.stopPropagation()}
          className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title="Download flyer"
        >
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
            />
          </svg>
        </a>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Flyer" className="w-full rounded-lg shadow-2xl" />
            <div className="flex items-center justify-center gap-3 mt-4">
              <a href={url} download={downloadName} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
                Download
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
