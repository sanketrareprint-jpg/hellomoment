'use client';

import { useEffect, useState, useCallback } from 'react';

export interface SliderBanner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
}

// Auto-rotating promotional banner slider, like a website hero carousel —
// added/managed only from the admin panel (see /admin/banners), never by a
// business itself. Shown at the top of the dashboard overview.
export default function DashboardBannerSlider({
  banners,
  aspectClass = 'aspect-[3/1]',
  intervalSeconds = 5,
}: {
  banners: SliderBanner[];
  aspectClass?: string;
  intervalSeconds?: number;
}) {
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % banners.length) + banners.length) % banners.length);
    },
    [banners.length]
  );

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [banners.length, intervalSeconds]);

  if (banners.length === 0) return null;

  const current = banners[index] ?? banners[0];

  const Image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={current.imageUrl} alt="Promotional banner" className="w-full h-full object-cover" />
  );

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200/80 group">
      <div className={`w-full ${aspectClass} bg-gray-100`}>
        {current.linkUrl ? (
          <a href={current.linkUrl} target="_blank" rel="noopener noreferrer">
            {Image}
          </a>
        ) : (
          Image
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/60"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => goTo(i)}
                className={
                  'w-1.5 h-1.5 rounded-full transition-all ' + (i === index ? 'bg-white w-4' : 'bg-white/60')
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
