// Form value types + defaults for a reusable branding Frame (see prisma
// schema's Frame/BusinessFrame models). Deliberately the branding-only
// subset of TemplateFormValues (see flyerPlaceholders.ts) — a Frame never
// has its own name/date/photo placeholders, only the business-branding
// ones, since it's meant to be composited onto *every* flyer a business
// sends regardless of occasion or which FlyerTemplate that is.

import type { LogoPlaceholder, TextPlaceholder } from '@/lib/flyerPlaceholders';

export interface FrameFormValues {
  id?: string;
  name: string;
  isDefault: boolean;
  overlayUrl: string;
  overlayHue: number;
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
  return { ...p, x: Math.round(p.x * scale), y: Math.round(p.y * scale + topOffset), fontSize: Math.round(p.fontSize * scale) };
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

/**
 * The 7 branding placeholder defaults, scaled to a Frame's own (width,
 * height) — its own bespoke layout, NOT flyerPlaceholders.ts's defaultsFor.
 * That function's percentages/font sizes are tuned for a tall *portrait*
 * flyer canvas (e.g. 1080x1350) where the branding cluster only occupies
 * the bottom ~24% of a canvas much taller than it is wide, so font sizes
 * sized off *width* still leave plenty of vertical room. A Frame's own
 * canvas is the opposite shape — a short, wide banner (recommended 5:1
 * width:height, see FramePlaceholderEditor's overlay upload note) meant to
 * be read as one horizontal strip, not a tall stack — so reusing those
 * percentages badly overflowed past the banner's bottom edge (most visibly
 * the logo, sized off *width*, coming out taller than the entire banner).
 * Every size/position below is instead a fraction of HEIGHT (the banner's
 * constrained dimension), laid out as two columns — logo+firm name/phone on
 * the left, email/website on the right, address between them — so a fresh
 * frame's fields land fully inside the canvas and can actually be seen and
 * dragged, instead of bleeding off the bottom edge.
 */
export function frameDefaultsFor(width: number, height: number) {
  const dark = '#111111';
  return {
    // Vertically centered with a 12% margin top and bottom (0.12 + 0.76 +
    // 0.12 = 1), so it never extends past the banner's own edges.
    logoPlaceholder: {
      x: Math.round(width * 0.015),
      y: Math.round(height * 0.12),
      size: Math.round(height * 0.76),
      rotation: 0,
    } as LogoPlaceholder,
    firmNamePlaceholder: {
      x: Math.round(width * 0.18),
      y: Math.round(height * 0.28),
      fontSize: Math.round(height * 0.26),
      color: dark,
      fontWeight: 800,
      align: 'left',
      rotation: 0,
    } as TextPlaceholder,
    phonePlaceholder: {
      x: Math.round(width * 0.18),
      y: Math.round(height * 0.55),
      fontSize: Math.round(height * 0.16),
      color: dark,
      fontWeight: 400,
      align: 'left',
      rotation: 0,
    } as TextPlaceholder,
    // Address sits below firm name/phone, on the same (left) side.
    addressPlaceholder: {
      x: Math.round(width * 0.18),
      y: Math.round(height * 0.74),
      fontSize: Math.round(height * 0.14),
      color: dark,
      fontWeight: 400,
      align: 'left',
      rotation: 0,
    } as TextPlaceholder,
    // Email/website mirror phone's row on the opposite (right) side, so the
    // two columns read as a clean left/right split within the banner.
    emailPlaceholder: {
      x: Math.round(width * 0.985),
      y: Math.round(height * 0.3),
      fontSize: Math.round(height * 0.16),
      color: dark,
      fontWeight: 400,
      align: 'right',
      rotation: 0,
    } as TextPlaceholder,
    websitePlaceholder: {
      x: Math.round(width * 0.985),
      y: Math.round(height * 0.55),
      fontSize: Math.round(height * 0.16),
      color: dark,
      fontWeight: 400,
      align: 'right',
      rotation: 0,
    } as TextPlaceholder,
    productsPlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.86),
      fontSize: Math.round(height * 0.12),
      color: dark,
      fontWeight: 600,
      align: 'center',
      rotation: 0,
    } as TextPlaceholder,
  };
}
