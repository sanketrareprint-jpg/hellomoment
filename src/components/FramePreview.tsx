'use client';

import { useEffect, useRef, useState } from 'react';
import { FONT_FAMILIES } from '@/lib/fontFamilies';
import type { LogoPlaceholder, TextPlaceholder } from '@/lib/flyerPlaceholders';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';

export interface FramePlaceholders {
  logoPlaceholder: LogoPlaceholder | null;
  firmNamePlaceholder: TextPlaceholder | null;
  phonePlaceholder: TextPlaceholder | null;
  emailPlaceholder: TextPlaceholder | null;
  addressPlaceholder: TextPlaceholder | null;
  websitePlaceholder: TextPlaceholder | null;
  productsPlaceholder: TextPlaceholder | null;
}

type TextFieldKey = 'firmName' | 'phone' | 'email' | 'address' | 'website' | 'products';

// Same icon set as BRAND_FIELDS in FramePlaceholderEditor.tsx — only these
// four fields get an icon next to their text, matching that editor's look.
const FIELD_ICONS: Partial<Record<TextFieldKey, string>> = {
  phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  email: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  address: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  website:
    'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 013 12c0-1.605.42-3.113 1.157-4.418',
};

/**
 * Read-only render of a Frame's overlay + field layout, filled with a
 * business's actual branding — the "auto preview" the Frame gallery shows
 * as a business types its details or switches which frame is selected (see
 * FrameGalleryWorkspace). Shares its display logic with the interactive
 * preview in FramePlaceholderEditor, minus dragging/selection, since here
 * the layout is fixed and only the business's own text/logo change live.
 */
export default function FramePreview({
  overlayUrl,
  canvasWidth,
  canvasHeight,
  placeholders,
  business,
  maxWidth = 320,
}: {
  overlayUrl: string | null;
  canvasWidth: number;
  canvasHeight: number;
  placeholders: FramePlaceholders;
  business?: BrandInfo;
  maxWidth?: number;
}) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(maxWidth);

  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(120, Math.min(maxWidth, el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxWidth]);

  const scale = width / canvasWidth;
  const height = canvasHeight * scale;

  function cssFontFamilyFor(id?: string) {
    return (FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES.find((f) => f.id === 'default'))!.cssFamily;
  }

  const firmNameText = business
    ? business.firmNameScript === 'MARATHI'
      ? business.firmNameMarathi || business.name
      : business.name.toUpperCase()
    : 'YOUR FIRM NAME';

  const textFor: Record<TextFieldKey, string> = {
    firmName: firmNameText,
    phone: business?.phoneDisplay || 'Your phone number',
    email: business?.emailDisplay || 'Your email',
    address: business?.addressText || 'Your address',
    website: business?.websiteUrl || 'www.yourbusiness.com',
    products: business?.productsText || 'Your products / services',
  };

  const textEntries: [TextFieldKey, TextPlaceholder | null][] = [
    ['firmName', placeholders.firmNamePlaceholder],
    ['phone', placeholders.phonePlaceholder],
    ['email', placeholders.emailPlaceholder],
    ['address', placeholders.addressPlaceholder],
    ['website', placeholders.websitePlaceholder],
    ['products', placeholders.productsPlaceholder],
  ];

  return (
    <div
      ref={columnRef}
      className="relative rounded-lg overflow-hidden border border-gray-300"
      style={{
        width,
        height: height || width,
        backgroundColor: '#e5e7eb',
        backgroundImage: overlayUrl
          ? undefined
          : 'linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
    >
      {overlayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={overlayUrl} alt="Frame overlay" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      )}

      {placeholders.logoPlaceholder && (
        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: placeholders.logoPlaceholder.x * scale,
            top: placeholders.logoPlaceholder.y * scale,
            width: placeholders.logoPlaceholder.size * scale,
            height: placeholders.logoPlaceholder.size * scale,
            transform: placeholders.logoPlaceholder.rotation ? `rotate(${placeholders.logoPlaceholder.rotation}deg)` : undefined,
          }}
        >
          {business?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain pointer-events-none" />
          )}
        </div>
      )}

      {textEntries.map(([key, p]) => {
        if (!p) return null;
        const fontPx = Math.max(1, p.fontSize * scale);
        const iconPath = FIELD_ICONS[key];
        return (
          <div
            key={key}
            className="absolute px-1 flex items-center gap-1"
            style={{
              left: p.x * scale,
              top: p.y * scale,
              transform: [
                p.align === 'center' ? 'translate(-50%, -50%)' : p.align === 'right' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
                p.rotation ? `rotate(${p.rotation}deg)` : null,
              ]
                .filter(Boolean)
                .join(' '),
              color: p.color,
            }}
          >
            {iconPath && (
              <svg width={fontPx} height={fontPx} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
            )}
            <span
              style={{
                fontSize: fontPx,
                fontWeight: p.fontWeight,
                fontFamily: cssFontFamilyFor(p.fontFamily),
                whiteSpace: 'pre',
                textAlign: p.align,
              }}
            >
              {textFor[key]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
