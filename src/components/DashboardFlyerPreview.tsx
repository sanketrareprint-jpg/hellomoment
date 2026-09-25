'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveCssFontFamily } from '@/lib/fontFamilies';
import { frameLayoutFor, scaleCustomTextPlaceholder, scaleLogoPlaceholder, scaleTextPlaceholder } from '@/lib/framePlaceholders';
import type { CustomTextPlaceholder, LogoPlaceholder, PhotoPlaceholder, TextPlaceholder } from '@/lib/flyerPlaceholders';
import type { BrandInfo, FrameOption } from '@/components/TemplatePlaceholderEditor';

export interface DashboardFlyerTemplate {
  backgroundUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  source: string;
  namePlaceholder: TextPlaceholder | null;
  designationPlaceholder: TextPlaceholder | null;
  datePlaceholder: TextPlaceholder | null;
  photoPlaceholder: PhotoPlaceholder | null;
  logoPlaceholder: LogoPlaceholder | null;
  firmNamePlaceholder: TextPlaceholder | null;
  phonePlaceholder: TextPlaceholder | null;
  emailPlaceholder: TextPlaceholder | null;
  addressPlaceholder: TextPlaceholder | null;
  websitePlaceholder: TextPlaceholder | null;
  productsPlaceholder: TextPlaceholder | null;
  phoneTextOverride: string | null;
  emailTextOverride: string | null;
  addressTextOverride: string | null;
  websiteTextOverride: string | null;
  productsTextOverride: string | null;
}

type BrandIcon = 'phone' | 'email' | 'address' | 'website';

// Same Heroicons outline paths flyer.ts / TemplatePlaceholderEditor use for
// these fields (see the matching comment in FlyerPreviewThumbnail.tsx).
const ICON_PATHS: Record<BrandIcon, string> = {
  phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  email:
    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  address: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  website:
    'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 013 12c0-1.605.42-3.113 1.157-4.418',
};

interface TextField {
  key: string;
  placeholder: TextPlaceholder | null;
  text: string;
  icon?: BrandIcon;
}

/**
 * Read-only "what a customer receives" thumbnail for the dashboard's
 * template rows: the template background plus its sample name/designation/
 * date/photo, and — when the business has a default Frame — that frame's
 * overlay graphic and branding (logo/firm name/phone/email/...), laid out
 * like TemplatePlaceholderEditor's preview. Without a default Frame the
 * template's own branding placeholders are used instead.
 */
export default function DashboardFlyerPreview({
  template: t,
  defaultFrame,
  business,
}: {
  template: DashboardFlyerTemplate;
  defaultFrame: FrameOption | null;
  business: BrandInfo;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = width > 0 ? width / t.canvasWidth : 0;

  // Same rule as sendWish.ts: a Frame only ever applies to STARTER
  // templates — never overlay it on a business's own uploaded (CUSTOM) artwork.
  const frame = t.source === 'STARTER' ? defaultFrame : null;
  const { scale: frameScale, topOffset: frameTopOffset } = frame
    ? frameLayoutFor(t.canvasWidth, t.canvasHeight, frame.canvasWidth, frame.canvasHeight)
    : { scale: 1, topOffset: 0 };
  const scaleText = (p: TextPlaceholder | null) => (p ? scaleTextPlaceholder(p, frameScale, frameTopOffset) : null);

  const logoPlaceholder = frame
    ? frame.logoPlaceholder
      ? scaleLogoPlaceholder(frame.logoPlaceholder, frameScale, frameTopOffset)
      : null
    : t.logoPlaceholder;
  const customTexts: CustomTextPlaceholder[] = frame
    ? (frame.customTextPlaceholders ?? []).map((p) => scaleCustomTextPlaceholder(p, frameScale, frameTopOffset))
    : [];
  const overlaySrc = frame?.overlayUrl
    ? frame.overlayHue
      ? `/api/frames/overlay-hue?url=${encodeURIComponent(frame.overlayUrl)}&hue=${frame.overlayHue}`
      : frame.overlayUrl
    : null;

  const firmNameText =
    business.firmNameScript === 'MARATHI' ? business.firmNameMarathi || business.name : business.name.toUpperCase();
  // A Frame always uses the shared Brand kit text, never a template's own overrides (see sendWish.ts).
  const brandText = (override: string | null, shared: string | null, fallback: string) =>
    (!frame && override) || shared || fallback;

  const fields: TextField[] = [
    { key: 'name', placeholder: t.namePlaceholder, text: 'Mr. Sample Name' },
    { key: 'designation', placeholder: t.designationPlaceholder, text: 'Manager' },
    { key: 'date', placeholder: t.datePlaceholder, text: '25 August' },
    { key: 'firmName', placeholder: frame ? scaleText(frame.firmNamePlaceholder) : t.firmNamePlaceholder, text: firmNameText },
    {
      key: 'phone',
      placeholder: frame ? scaleText(frame.phonePlaceholder) : t.phonePlaceholder,
      text: brandText(t.phoneTextOverride, business.phoneDisplay, 'Your phone number'),
      icon: 'phone',
    },
    {
      key: 'email',
      placeholder: frame ? scaleText(frame.emailPlaceholder) : t.emailPlaceholder,
      text: brandText(t.emailTextOverride, business.emailDisplay, 'Your email'),
      icon: 'email',
    },
    {
      key: 'address',
      placeholder: frame ? scaleText(frame.addressPlaceholder) : t.addressPlaceholder,
      text: brandText(t.addressTextOverride, business.addressText, 'Your address'),
      icon: 'address',
    },
    {
      key: 'website',
      placeholder: frame ? scaleText(frame.websitePlaceholder) : t.websitePlaceholder,
      text: brandText(t.websiteTextOverride, business.websiteUrl, 'www.yourbusiness.com'),
      icon: 'website',
    },
    {
      key: 'products',
      placeholder: frame ? scaleText(frame.productsPlaceholder) : t.productsPlaceholder,
      text: brandText(t.productsTextOverride, business.productsText, 'Your products / services'),
    },
    ...customTexts.map((c) => ({ key: `custom-${c.id}`, placeholder: c, text: c.text })),
  ];

  const photo = t.photoPlaceholder;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-gray-100"
      style={{ aspectRatio: `${t.canvasWidth} / ${t.canvasHeight}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

      {scale > 0 && (
        <>
          {photo && (
            <div
              className="absolute bg-gray-300 flex items-end justify-center overflow-hidden pointer-events-none"
              style={{
                left: photo.x * scale,
                top: photo.y * scale,
                width: photo.width * scale,
                height: photo.height * scale,
                borderRadius: photo.shape === 'circle' ? '9999px' : photo.shape === 'rounded' ? '18%' : '4px',
                clipPath:
                  photo.shape === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' : undefined,
                transform: photo.rotation ? `rotate(${photo.rotation}deg)` : undefined,
              }}
            >
              {/* Generic head-and-shoulders silhouette, like the fallback avatar a real send uses. */}
              <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 text-gray-500" fill="currentColor">
                <circle cx="12" cy="8" r="4.5" />
                <path d="M3 24c0-5 4-8.5 9-8.5s9 3.5 9 8.5z" />
              </svg>
            </div>
          )}

          {overlaySrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={overlaySrc} alt="" className="absolute bottom-0 left-0 block w-full pointer-events-none" />
          )}

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

          {fields.map(({ key, placeholder: p, text, icon }) => {
            if (!p || !text) return null;
            const fontPx = Math.max(1, p.fontSize * scale);
            return (
              <div
                key={key}
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
                {icon && (
                  <svg
                    width={fontPx}
                    height={fontPx}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="flex-shrink-0"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[icon]} />
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
