// Placeholder types + defaults shared between the (server) template edit
// page and the (client) TemplatePlaceholderEditor. Kept out of that
// component's file specifically because it has 'use client' at the top —
// a server component that imports a named export from a client module and
// calls it directly (rather than rendering it as JSX) gets a non-callable
// client-reference proxy back, not the real function.

import type { FontFamilyId } from '@/lib/fontFamilies';

export type Align = 'left' | 'center' | 'right';

export interface TextPlaceholder {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: number;
  fontFamily?: FontFamilyId;
  align: Align;
  // Degrees, clockwise, rotated about the placeholder's own center. Optional
  // for backward compatibility with templates saved before rotation existed
  // — treated as 0 wherever it's missing.
  rotation?: number;
  // MS Word-style character formatting — every one optional, absent/false
  // meaning "off" so templates/frames saved before these existed keep
  // rendering exactly as they did.
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  // Extra tracking between letters, in the same px units as fontSize.
  // Negative values tighten, positive values loosen. 0/undefined = normal.
  letterSpacing?: number;
  // 0–1. undefined/1 = fully opaque.
  opacity?: number;
  // Whether this element is locked against dragging in the editor. Purely
  // an editing convenience (ignored by flyer.ts when rendering the actual
  // sent flyer) — saved alongside the rest of the placeholder so it's still
  // locked the next time this template/frame is reopened for editing.
  locked?: boolean;
}

export interface PhotoPlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'circle' | 'square' | 'rounded' | 'hexagon';
  rotation?: number;
  locked?: boolean;
}

export interface LogoPlaceholder {
  x: number;
  y: number;
  size: number;
  rotation?: number;
  locked?: boolean;
}

export interface TemplateFormValues {
  id?: string;
  name: string;
  occasion: 'BIRTHDAY' | 'ANNIVERSARY' | 'FESTIVAL';
  isDefault: boolean;
  aisensyCampaignName: string;
  backgroundUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  useName: boolean;
  namePlaceholder: TextPlaceholder;
  useDesignation: boolean;
  designationPlaceholder: TextPlaceholder;
  useDate: boolean;
  datePlaceholder: TextPlaceholder;
  usePhoto: boolean;
  photoPlaceholder: PhotoPlaceholder;
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
  // Per-template overrides for the phone/email/address/website/products
  // TEXT itself — '' means "no override, fall back to Settings → Brand
  // kit's shared text" (same as a default Frame always does). See the
  // FlyerTemplate.phoneTextOverride etc. comment in schema.prisma.
  phoneTextOverride: string;
  emailTextOverride: string;
  addressTextOverride: string;
  websiteTextOverride: string;
  productsTextOverride: string;
}

export function defaultsFor(width: number, height: number): Pick<
  TemplateFormValues,
  | 'namePlaceholder'
  | 'designationPlaceholder'
  | 'datePlaceholder'
  | 'photoPlaceholder'
  | 'logoPlaceholder'
  | 'firmNamePlaceholder'
  | 'phonePlaceholder'
  | 'emailPlaceholder'
  | 'addressPlaceholder'
  | 'websitePlaceholder'
  | 'productsPlaceholder'
> {
  return {
    namePlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.78),
      fontSize: Math.round(width * 0.05),
      color: '#ffffff',
      fontWeight: 700,
      align: 'center',
      rotation: 0,
    },
    designationPlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.825),
      fontSize: Math.round(width * 0.028),
      color: '#ffffff',
      fontWeight: 400,
      align: 'center',
      rotation: 0,
    },
    datePlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.86),
      fontSize: Math.round(width * 0.03),
      color: '#ffffff',
      fontWeight: 400,
      align: 'center',
      rotation: 0,
    },
    photoPlaceholder: {
      x: Math.round(width * 0.36),
      y: Math.round(height * 0.12),
      width: Math.round(width * 0.28),
      height: Math.round(width * 0.28),
      shape: 'circle',
      rotation: 0,
    },
    // Business branding block — grouped as one cluster in the bottom-left
    // corner (logo on top, firm name/phone/address/products stacked
    // left-aligned underneath), like a business card corner. Every element
    // is independently draggable, so this is just a sensible starting
    // point.
    logoPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.76),
      size: Math.round(width * 0.13),
      rotation: 0,
    },
    firmNamePlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.895),
      fontSize: Math.round(width * 0.04),
      color: '#ffffff',
      fontWeight: 800,
      align: 'left',
      rotation: 0,
    },
    phonePlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.925),
      fontSize: Math.round(width * 0.026),
      color: '#ffffff',
      fontWeight: 400,
      align: 'left',
      rotation: 0,
    },
    // Email/website mirror phone/address in size and style, but default to
    // the opposite (right) side of the flyer, right-aligned, so they don't
    // land stacked on top of the phone/address block — each is still
    // independently draggable like every other field.
    emailPlaceholder: {
      x: Math.round(width * 0.95),
      y: Math.round(height * 0.925),
      fontSize: Math.round(width * 0.026),
      color: '#ffffff',
      fontWeight: 400,
      align: 'right',
      rotation: 0,
    },
    addressPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.95),
      fontSize: Math.round(width * 0.022),
      color: '#ffffff',
      fontWeight: 400,
      align: 'left',
      rotation: 0,
    },
    websitePlaceholder: {
      x: Math.round(width * 0.95),
      y: Math.round(height * 0.95),
      fontSize: Math.round(width * 0.022),
      color: '#ffffff',
      fontWeight: 400,
      align: 'right',
      rotation: 0,
    },
    productsPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.978),
      fontSize: Math.round(width * 0.02),
      color: '#ffffff',
      fontWeight: 600,
      align: 'left',
      rotation: 0,
    },
  };
}
