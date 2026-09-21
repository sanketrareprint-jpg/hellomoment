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
 * A Frame's overlay graphic and its placeholders are authored against the
 * frame's own canvas — its overlay image's native pixel size (see
 * FramePlaceholderEditor's onOverlayChange, which sets canvasWidth/Height
 * from the uploaded file's own dimensions). That's typically a short, wide
 * banner meant to sit along the bottom of *any* flyer a business sends,
 * regardless of that flyer's own canvas size — so it must land there scaled
 * uniformly by width (preserving the banner's own aspect ratio; never
 * stretched to fill a taller/shorter canvas, which is what distorted both
 * the overlay art and its text badly on a portrait template) and anchored
 * to the flyer's bottom edge, the same way the overlay graphic itself is
 * displayed (see flyer.ts's overlay compositing and the frame preview in
 * TemplatePlaceholderEditor.tsx).
 */
export function frameLayoutFor(
  canvasWidth: number,
  canvasHeight: number,
  frameCanvasWidth: number,
  frameCanvasHeight: number
): { scale: number; topOffset: number } {
  const scale = canvasWidth / frameCanvasWidth;
  return { scale, topOffset: canvasHeight - frameCanvasHeight * scale };
}

/**
 * Scales a text placeholder saved against a Frame's own canvas size onto a
 * different canvas size (a FlyerTemplate's), per frameLayoutFor above —
 * `scale` and `topOffset` come from it.
 */
export function scaleTextPlaceholder(p: TextPlaceholder, scale: number, topOffset: number): TextPlaceholder {
  return {
    ...p,
    x: Math.round(p.x * scale),
    y: Math.round(p.y * scale + topOffset),
    fontSize: Math.round(p.fontSize * scale),
    ...(p.letterSpacing !== undefined ? { letterSpacing: Math.round(p.letterSpacing * scale) } : {}),
  };
}

/** Same idea as scaleTextPlaceholder, for a logo box's position + size. */
export function scaleLogoPlaceholder(p: LogoPlaceholder, scale: number, topOffset: number): LogoPlaceholder {
  return { ...p, x: Math.round(p.x * scale), y: Math.round(p.y * scale + topOffset), size: Math.round(p.size * scale) };
}

export interface FramePlaceholderSet {
  logoPlaceholder: LogoPlaceholder | null;
  firmNamePlaceholder: TextPlaceholder | null;
  phonePlaceholder: TextPlaceholder | null;
  emailPlaceholder: TextPlaceholder | null;
  addressPlaceholder: TextPlaceholder | null;
  websitePlaceholder: TextPlaceholder | null;
  productsPlaceholder: TextPlaceholder | null;
}

/**
 * Scales one frame's whole field layout onto another frame's own canvas
 * size, per frameLayoutFor above — used by the admin "apply this layout to
 * every frame" action (see /api/admin/frames/apply-layout) so one frame's
 * field positions can be pushed onto every other frame in the library even
 * when their overlay graphics aren't the same pixel size.
 */
export function scaleFramePlaceholderSet(
  set: FramePlaceholderSet,
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number
): FramePlaceholderSet {
  const { scale, topOffset } = frameLayoutFor(toWidth, toHeight, fromWidth, fromHeight);
  return {
    logoPlaceholder: set.logoPlaceholder ? scaleLogoPlaceholder(set.logoPlaceholder, scale, topOffset) : null,
    firmNamePlaceholder: set.firmNamePlaceholder ? scaleTextPlaceholder(set.firmNamePlaceholder, scale, topOffset) : null,
    phonePlaceholder: set.phonePlaceholder ? scaleTextPlaceholder(set.phonePlaceholder, scale, topOffset) : null,
    emailPlaceholder: set.emailPlaceholder ? scaleTextPlaceholder(set.emailPlaceholder, scale, topOffset) : null,
    addressPlaceholder: set.addressPlaceholder ? scaleTextPlaceholder(set.addressPlaceholder, scale, topOffset) : null,
    websitePlaceholder: set.websitePlaceholder ? scaleTextPlaceholder(set.websitePlaceholder, scale, topOffset) : null,
    productsPlaceholder: set.productsPlaceholder ? scaleTextPlaceholder(set.productsPlaceholder, scale, topOffset) : null,
  };
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
