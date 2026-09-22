'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveCssFontFamily } from '@/lib/fontFamilies';
import type { LogoPlaceholder, TextPlaceholder } from '@/lib/flyerPlaceholders';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';

// A read-only, to-scale thumbnail of a flyer template that overlays the
// logged-in business's own saved Brand kit (Settings → Brand kit for
// flyers) onto whichever branding fields this particular template has
// mapped — logo/firm name/phone/email/address/website/products — so a
// business browsing "My templates" or "Starter templates" sees its own
// real details filled in on every card, not just after opening the
// per-template editor. Deliberately never shown to the admin's shared
// Starter Template library, which has no one business to pull from.
//
// Positioning/sizing here deliberately mirrors two other places, not just
// "a reasonable-looking overlay": TemplatePlaceholderEditor's own live
// preview markers (same translate(-50%/-100%/0, -50%) anchor per align,
// same icon-prefixed flex row) and src/lib/flyer.ts's actual server render
// (same doc: "(x, y) is treated as the visual center of the rendered
// block"). Diverging from either — e.g. anchoring text at its baseline
// instead of its center, or dropping the icon — is what made the very
// first version of this component visibly misaligned/undersized next to
// the real design.
export interface FlyerPreviewThumbnailProps {
  backgroundUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  business: BrandInfo;
  logoPlaceholder?: LogoPlaceholder | null;
  firmNamePlaceholder?: TextPlaceholder | null;
  phonePlaceholder?: TextPlaceholder | null;
  emailPlaceholder?: TextPlaceholder | null;
  addressPlaceholder?: TextPlaceholder | null;
  websitePlaceholder?: TextPlaceholder | null;
  productsPlaceholder?: TextPlaceholder | null;
  phoneTextOverride?: string | null;
  emailTextOverride?: string | null;
  addressTextOverride?: string | null;
  websiteTextOverride?: string | null;
  productsTextOverride?: string | null;
  className?: string;
}

type BrandIcon = 'phone' | 'email' | 'address' | 'website';

// The exact same Heroicons outline paths flyer.ts prepends to phone/email/
// address/website text on the real sent flyer, and that
// TemplatePlaceholderEditor's own toolbar/live preview use for the same
// fields (BRAND_FIELDS) — duplicated here the same way flyer.ts already
// duplicates them from that component (it's a server file, this is a
// client one; kept in sync by hand — see the comment above ICON_PATHS in
// src/lib/flyer.ts).
const ICON_PATHS: Record<BrandIcon, string> = {
  phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  email:
    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  address: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  website:
    'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 013 12c0-1.605.42-3.113 1.157-4.418',
};

interface BrandField {
  placeholder?: TextPlaceholder | null;
  text: string;
  icon?: BrandIcon;
}

export default function FlyerPreviewThumbnail({
  backgroundUrl,
  canvasWidth,
  canvasHeight,
  business,
  logoPlaceholder,
  firmNamePlaceholder,
  phonePlaceholder,
  emailPlaceholder,
  addressPlaceholder,
  websitePlaceholder,
  productsPlaceholder,
  phoneTextOverride,
  emailTextOverride,
  addressTextOverride,
  websiteTextOverride,
  productsTextOverride,
  className,
}: FlyerPreviewThumbnailProps) {
  // Font sizes/positions are saved in the template's own canvas pixel
  // space (e.g. 1086×1448) — this card can render at any width depending
  // on the grid's column count and the viewport, so a live `scale` (this
  // rendered width ÷ canvasWidth) is tracked via ResizeObserver, the same
  // way TemplatePlaceholderEditor's own preview does, rather than relying
  // on any CSS unit to do that scaling on its own.
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedWidth, setRenderedWidth] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setRenderedWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = renderedWidth / canvasWidth;

  const firmNameText =
    business.firmNameScript === 'MARATHI' ? business.firmNameMarathi || business.name : business.name.toUpperCase();

  const fields: BrandField[] = [
    { placeholder: firmNamePlaceholder, text: firmNameText },
    { placeholder: phonePlaceholder, text: phoneTextOverride || business.phoneDisplay || '', icon: 'phone' },
    { placeholder: emailPlaceholder, text: emailTextOverride || business.emailDisplay || '', icon: 'email' },
    { placeholder: addressPlaceholder, text: addressTextOverride || business.addressText || '', icon: 'address' },
    { placeholder: websitePlaceholder, text: websiteTextOverride || business.websiteUrl || '', icon: 'website' },
    { placeholder: productsPlaceholder, text: productsTextOverride || business.productsText || '' },
  ];

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />

      {scale > 0 && (
        <>
          {logoPlaceholder && business.logoUrl && (
            <div
              className="absolute flex items-center justify-center overflow-hidden pointer-events-none"
              style={{
                left: logoPlaceholder.x * scale,
                top: logoPlaceholder.y * scale,
                width: logoPlaceholder.size * scale,
                height: logoPlaceholder.size * scale,
                transform: logoPlaceholder.rotation ? `rotate(${logoPlaceholder.rotation}deg)` : undefined,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={business.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
            </div>
          )}

          {fields.map(({ placeholder: p, text, icon }, i) => {
            if (!p || !text) return null;
            const fontPx = Math.max(1, p.fontSize * scale);
            const iconPath = icon ? ICON_PATHS[icon] : null;
            return (
              <div
                key={i}
                className="absolute px-1 flex items-center gap-1 pointer-events-none"
                style={{
                  left: p.x * scale,
                  top: p.y * scale,
                  transform: [
                    p.align === 'center'
                      ? 'translate(-50%, -50%)'
                      : p.align === 'right'
                        ? 'translate(-100%, -50%)'
                        : 'translate(0, -50%)',
                    p.rotation ? `rotate(${p.rotation}deg)` : null,
                  ]
                    .filter(Boolean)
                    .join(' '),
                  color: p.color,
                }}
              >
                {iconPath && (
                  <svg
                    width={fontPx}
                    height={fontPx}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="flex-shrink-0"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                  </svg>
                )}
                <span
                  style={{
                    fontSize: fontPx,
                    fontWeight: p.fontWeight,
                    fontFamily: resolveCssFontFamily(p.fontFamily),
                    whiteSpace: 'pre',
                    textAlign: p.align,
                  }}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
