// Form value types + defaults for a reusable branding Frame (see prisma
// schema's Frame/BusinessFrame models). Deliberately the branding-only
// subset of TemplateFormValues (see flyerPlaceholders.ts) — a Frame never
// has its own name/date/photo placeholders, only the business-branding
// ones, since it's meant to be composited onto *every* flyer a business
// sends regardless of occasion or which FlyerTemplate that is.

import { defaultsFor, type LogoPlaceholder, type TextPlaceholder } from '@/lib/flyerPlaceholders';

export interface FrameFormValues {
  id?: string;
  name: string;
  isDefault: boolean;
  overlayUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  useLogo: boolean;
  logoPlaceholder: LogoPlaceholder;
  useFirmName: boolean;
  firmNamePlaceholder: TextPlaceholder;
  usePhone: boolean;
  phonePlaceholder: TextPlaceholder;
  useEmail: boolean;
  emailPlaceholder: TextPlaceholder;
  useAddress: boolean;
  addressPlaceholder: TextPlaceholder;
  useWebsite: boolean;
  websitePlaceholder: TextPlaceholder;
  useProducts: boolean;
  productsPlaceholder: TextPlaceholder;
}

/**
 * Scales a text placeholder saved against a Frame's own canvas size onto a
 * different canvas size (a FlyerTemplate's) — needed because one Frame is
 * applied across every flyer a business sends, and those flyers' background
 * images aren't guaranteed to all be the same size as the Frame was designed
 * against. x/y each scale by their own axis; fontSize scales by the average
 * of both axes so it doesn't stretch unevenly on a non-square resize.
 */
export function scaleTextPlaceholder(p: TextPlaceholder, scaleX: number, scaleY: number): TextPlaceholder {
  const scale = (scaleX + scaleY) / 2;
  return { ...p, x: Math.round(p.x * scaleX), y: Math.round(p.y * scaleY), fontSize: Math.round(p.fontSize * scale) };
}

/** Same idea as scaleTextPlaceholder, for a logo box's position + size. */
export function scaleLogoPlaceholder(p: LogoPlaceholder, scaleX: number, scaleY: number): LogoPlaceholder {
  const scale = (scaleX + scaleY) / 2;
  return { ...p, x: Math.round(p.x * scaleX), y: Math.round(p.y * scaleY), size: Math.round(p.size * scale) };
}

/** The 7 branding placeholder defaults, scaled to (width, height) — reuses the same starting layout as a flyer template's own branding cluster. */
export function frameDefaultsFor(width: number, height: number) {
  const d = defaultsFor(width, height);
  return {
    logoPlaceholder: d.logoPlaceholder,
    firmNamePlaceholder: d.firmNamePlaceholder,
    phonePlaceholder: d.phonePlaceholder,
    emailPlaceholder: d.emailPlaceholder,
    addressPlaceholder: d.addressPlaceholder,
    websitePlaceholder: d.websitePlaceholder,
    productsPlaceholder: d.productsPlaceholder,
  };
}
