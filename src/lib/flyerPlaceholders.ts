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
  maxWidth: number;
  maxLines: number;
}

export interface PhotoPlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'circle' | 'square' | 'rounded' | 'hexagon';
}

export interface LogoPlaceholder {
  x: number;
  y: number;
  size: number;
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
  useAddress: boolean;
  addressPlaceholder: TextPlaceholder;
  useProducts: boolean;
  productsPlaceholder: TextPlaceholder;
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
  | 'addressPlaceholder'
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
      maxWidth: Math.round(width * 0.85),
      maxLines: 2,
    },
    designationPlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.825),
      fontSize: Math.round(width * 0.028),
      color: '#ffffff',
      fontWeight: 400,
      align: 'center',
      maxWidth: Math.round(width * 0.85),
      maxLines: 1,
    },
    datePlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.86),
      fontSize: Math.round(width * 0.03),
      color: '#ffffff',
      fontWeight: 400,
      align: 'center',
      maxWidth: Math.round(width * 0.85),
      maxLines: 1,
    },
    photoPlaceholder: {
      x: Math.round(width * 0.36),
      y: Math.round(height * 0.12),
      width: Math.round(width * 0.28),
      height: Math.round(width * 0.28),
      shape: 'circle',
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
    },
    firmNamePlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.895),
      fontSize: Math.round(width * 0.04),
      color: '#ffffff',
      fontWeight: 800,
      align: 'left',
      maxWidth: Math.round(width * 0.55),
      maxLines: 1,
    },
    phonePlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.925),
      fontSize: Math.round(width * 0.026),
      color: '#ffffff',
      fontWeight: 400,
      align: 'left',
      maxWidth: Math.round(width * 0.55),
      maxLines: 1,
    },
    addressPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.95),
      fontSize: Math.round(width * 0.022),
      color: '#ffffff',
      fontWeight: 400,
      align: 'left',
      maxWidth: Math.round(width * 0.55),
      maxLines: 2,
    },
    productsPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.978),
      fontSize: Math.round(width * 0.02),
      color: '#ffffff',
      fontWeight: 600,
      align: 'left',
      maxWidth: Math.round(width * 0.55),
      maxLines: 1,
    },
  };
}
