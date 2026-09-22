'use client';

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
// Renders as an SVG overlay in the template's own canvas coordinate space
// (`viewBox`) on top of the background image — the SVG scales to whatever
// width the card renders at with no JS measurement needed, the same way
// the background image itself already does.
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

function FlyerText({ placeholder: p, text }: { placeholder: TextPlaceholder; text: string }) {
  if (!text) return null;
  const anchor = p.align === 'center' ? 'middle' : p.align === 'right' ? 'end' : 'start';
  const lineHeight = p.fontSize * 1.2;
  const transform = p.rotation ? `rotate(${p.rotation} ${p.x} ${p.y})` : undefined;
  return (
    <text
      x={p.x}
      y={p.y}
      textAnchor={anchor}
      fill={p.color}
      fontSize={p.fontSize}
      fontWeight={p.fontWeight}
      fontFamily={resolveCssFontFamily(p.fontFamily)}
      transform={transform}
    >
      {text.split('\n').map((line, i) => (
        <tspan key={i} x={p.x} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
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
  const firmNameText =
    business.firmNameScript === 'MARATHI' ? business.firmNameMarathi || business.name : business.name.toUpperCase();

  return (
    <div className={className} style={{ position: 'relative', width: '100%', aspectRatio: `${canvasWidth} / ${canvasHeight}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-contain" />
      <svg
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {logoPlaceholder && business.logoUrl && (
          <image
            href={business.logoUrl}
            x={logoPlaceholder.x}
            y={logoPlaceholder.y}
            width={logoPlaceholder.size}
            height={logoPlaceholder.size}
            preserveAspectRatio="xMidYMid meet"
            transform={
              logoPlaceholder.rotation
                ? `rotate(${logoPlaceholder.rotation} ${logoPlaceholder.x + logoPlaceholder.size / 2} ${logoPlaceholder.y + logoPlaceholder.size / 2})`
                : undefined
            }
          />
        )}
        {firmNamePlaceholder && <FlyerText placeholder={firmNamePlaceholder} text={firmNameText} />}
        {phonePlaceholder && (
          <FlyerText placeholder={phonePlaceholder} text={phoneTextOverride || business.phoneDisplay || ''} />
        )}
        {emailPlaceholder && (
          <FlyerText placeholder={emailPlaceholder} text={emailTextOverride || business.emailDisplay || ''} />
        )}
        {addressPlaceholder && (
          <FlyerText placeholder={addressPlaceholder} text={addressTextOverride || business.addressText || ''} />
        )}
        {websitePlaceholder && (
          <FlyerText placeholder={websitePlaceholder} text={websiteTextOverride || business.websiteUrl || ''} />
        )}
        {productsPlaceholder && (
          <FlyerText placeholder={productsPlaceholder} text={productsTextOverride || business.productsText || ''} />
        )}
      </svg>
    </div>
  );
}
