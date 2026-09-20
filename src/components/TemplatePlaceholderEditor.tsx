'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FONT_FAMILIES } from '@/lib/fontFamilies';
import { defaultsFor, type TemplateFormValues, type TextPlaceholder } from '@/lib/flyerPlaceholders';
import PlaceholderControls from '@/components/PlaceholderControls';
import FloatingNudgePad from '@/components/FloatingNudgePad';

export type { TemplateFormValues };

// A business's saved Frame (see the Frame/BusinessFrame Prisma models and
// /dashboard/frames) — its default, when set, overrides every template's own
// branding placeholders at send time (see src/lib/sendWish.ts), so this
// editor surfaces that here instead of leaving the "Your business branding"
// toolbar below looking like it always takes effect.
export interface FrameOption {
  id: string;
  name: string;
  overlayUrl: string | null;
  isDefault: boolean;
}

// The business's saved Brand kit (Settings → Brand kit for flyers), passed
// in so the editor can preview the *actual* logo/firm name/phone/address
// instead of generic placeholder boxes — a truer what-you'll-actually-send
// preview than a "Sample Name"-style stand-in would give.
export interface BrandInfo {
  logoUrl: string | null;
  name: string;
  phoneDisplay: string | null;
  emailDisplay: string | null;
  addressText: string | null;
  websiteUrl: string | null;
  productsText: string | null;
  firmNameScript: 'ENGLISH' | 'MARATHI';
  firmNameMarathi: string | null;
}

// Fields whose placeholder is a plain TextPlaceholder (font/size/color/align
// etc.) — i.e. everything except the photo box and the logo image, which
// each have their own shape.
type TextFieldKey = 'name' | 'designation' | 'date' | 'firmName' | 'phone' | 'email' | 'address' | 'website' | 'products';
type FieldKey = TextFieldKey | 'photo' | 'logo';

export const EMPTY_TEMPLATE: TemplateFormValues = {
  name: '',
  occasion: 'BIRTHDAY',
  isDefault: false,
  aisensyCampaignName: '',
  backgroundUrl: '',
  canvasWidth: 1080,
  canvasHeight: 1080,
  useName: true,
  useDate: true,
  usePhoto: true,
  // Name and logo default to on (nearly every flyer wants both), but — like
  // everything else here — the business can turn either off per template.
  // Designation / firm name / phone / address / products default to OFF:
  // most flyer artwork (including the bundled starter designs) already has
  // its own decorative footer, and stacking more text on top of it collided
  // with the art. The business can still switch any of these on per
  // template and drag them into a clear spot.
  useDesignation: false,
  useLogo: true,
  useFirmName: false,
  usePhone: false,
  useEmail: false,
  useAddress: false,
  useWebsite: false,
  useProducts: false,
  ...defaultsFor(1080, 1080),
};

// Upper bound on the preview canvas's width — on any screen wide enough to
// fit it (desktop, tablet), it renders at exactly this size. On a narrow
// phone screen it shrinks to fit instead (see previewWidth state below), so
// the flyer preview is always fully visible without horizontal scrolling.
const MAX_PREVIEW_WIDTH = 420;
type DragTarget = FieldKey | 'photo-resize' | null;

// One toolbar button per placeable element, icon-first like a Word/Photoshop
// tool strip — grouped into "Contact details" (comes from each contact's own
// record) and "Your business branding" (comes from Settings → Brand kit).
// Every field added here just needs a matching case in the small switch
// helpers below (isFieldOn/setFieldOn/getTextPlaceholder/setTextPlaceholder)
// — the toolbar, the single properties panel, and the live preview markers
// are all driven off this one list plus those switches.
const CONTACT_FIELDS: { key: FieldKey; label: string; icon: string }[] = [
  {
    key: 'name',
    label: 'Name',
    icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  },
  {
    key: 'designation',
    label: 'Designation',
    icon: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0',
  },
  {
    key: 'date',
    label: 'Date',
    icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  },
  {
    key: 'photo',
    label: 'Photo',
    icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5zM9 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  },
];

const BRAND_FIELDS: { key: FieldKey; label: string; icon: string }[] = [
  {
    key: 'logo',
    label: 'Logo',
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
  },
  {
    key: 'firmName',
    label: 'Firm name',
    icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21',
  },
  {
    key: 'phone',
    label: 'Phone',
    icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  },
  {
    key: 'email',
    label: 'Email',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  },
  {
    key: 'address',
    label: 'Address',
    icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  },
  {
    key: 'website',
    label: 'Website',
    icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 013 12c0-1.605.42-3.113 1.157-4.418',
  },
  {
    key: 'products',
    label: 'Products',
    icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z',
  },
];

export default function TemplatePlaceholderEditor({
  initial,
  business,
  frames = [],
  showBranding = true,
  showPerBusinessOptions = true,
  apiBase = '/api/templates',
  uploadUrl = '/api/uploads/template',
  redirectPath = '/dashboard/templates',
}: {
  initial?: TemplateFormValues;
  business?: BrandInfo;
  // This business's saved Frames, if any — offered in the branding section
  // below as the recommended alternative to manually positioning each field.
  frames?: FrameOption[];
  // Business branding (logo/firm name/phone/address/products) only makes
  // sense to overlay on a bundled Starter template — a business's own
  // uploaded artwork ("My templates") already has its branding drawn into
  // the image, so offering these fields there would just duplicate it.
  showBranding?: boolean;
  // "Use as default" and the AiSensy campaign override are per-business
  // settings decided when a business copies/edits its own FlyerTemplate row
  // — they don't apply to admin's global StarterTemplate library, so the
  // admin template editor hides both.
  showPerBusinessOptions?: boolean;
  // Where this editor reads/writes from — defaults to the business-owned
  // FlyerTemplate API; the admin StarterTemplate library passes its own
  // endpoints and redirect instead.
  apiBase?: string;
  uploadUrl?: string;
  redirectPath?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<TemplateFormValues>(initial ?? EMPTY_TEMPLATE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Advanced options (currently just the AiSensy campaign override) are
  // hidden by default — almost no business ever needs this, so showing it
  // on every template just confuses people. Auto-open it if a template
  // being edited already has a value set, so it isn't silently hidden.
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initial?.aisensyCampaignName));
  // Which single toolbar item is "selected" — its settings show in the one
  // shared properties panel below the toolbar, Word/Photoshop-style,
  // instead of every field's settings being permanently expanded at once.
  const [selected, setSelected] = useState<FieldKey | null>(null);
  // Purely a visual aid for lining elements up while dragging — never saved,
  // doesn't affect the actual generated flyer.
  const [showGrid, setShowGrid] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewColumnRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<DragTarget>(null);
  // The gap between the pointer's canvas position at pointerdown and the
  // value being dragged (an anchor x/y, a center, or a resize corner) —
  // captured once so every later pointermove offsets from it instead of
  // snapping that value straight to the pointer (which jumped the element
  // to the cursor on the very first, often sub-pixel, move of a click).
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // This business's default Frame, if any. When set, it overrides every
  // template's own branding placeholders at send time regardless of what's
  // configured below (see src/lib/sendWish.ts) — so the manual toolbar stays
  // collapsed behind an "advanced" toggle by default rather than looking
  // like positioning these fields here still matters.
  const defaultFrame = frames.find((f) => f.isDefault) ?? null;
  const [manualBrandingOpen, setManualBrandingOpen] = useState(false);
  const brandFieldKeySet = new Set(BRAND_FIELDS.map((d) => d.key));

  // Whether an element is locked in place (drag disabled) lives on its own
  // placeholder object — the same `locked` flag saved to the DB alongside
  // its x/y/font/etc — so a template/frame reopens with locks exactly as
  // they were left, instead of resetting every time.
  function isLocked(key: FieldKey): boolean {
    if (key === 'photo') return Boolean(form.photoPlaceholder.locked);
    if (key === 'logo') return Boolean(form.logoPlaceholder.locked);
    return Boolean(getTextPlaceholder(key).locked);
  }

  function toggleLock(key: FieldKey) {
    if (key === 'photo') {
      setForm((f) => ({ ...f, photoPlaceholder: { ...f.photoPlaceholder, locked: !f.photoPlaceholder.locked } }));
      return;
    }
    if (key === 'logo') {
      setForm((f) => ({ ...f, logoPlaceholder: { ...f.logoPlaceholder, locked: !f.logoPlaceholder.locked } }));
      return;
    }
    const current = getTextPlaceholder(key);
    setTextPlaceholder(key, { ...current, locked: !current.locked });
  }

  // Shrinks the preview canvas to fit its column on narrow screens (e.g. a
  // phone in the mobile drawer layout, where the column is narrower than
  // MAX_PREVIEW_WIDTH) instead of overflowing and forcing a horizontal
  // scroll. `scale` derives from this, so drag math (onPointerMove, which
  // reads the same rendered box via getBoundingClientRect) stays correct at
  // any size.
  const [previewWidth, setPreviewWidth] = useState(MAX_PREVIEW_WIDTH);
  useEffect(() => {
    const el = previewColumnRef.current;
    if (!el) return;
    const update = () => setPreviewWidth(Math.max(120, Math.min(MAX_PREVIEW_WIDTH, el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = previewWidth / form.canvasWidth;
  const previewHeight = form.canvasHeight * scale;

  // Resolves a placeholder's chosen font to the matching CSS font-family for
  // the live preview only — the actual flyer PNG is always rendered
  // server-side from the bundled .ttf files in assets/fonts (see flyer.ts).
  // `id` is undefined for every placeholder whose Font dropdown was never
  // touched (defaultsFor() never sets fontFamily) — resolveFont() in
  // flyer.ts treats that the same as the 'default' bundled font, so this
  // must too. Falling back to CSS 'inherit' here (as this used to) pulled in
  // the *editor page's own* UI font instead, which is exactly why fonts in
  // the preview didn't match the real sent flyer.
  function cssFontFamilyFor(id?: string) {
    return (FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES.find((f) => f.id === 'default'))!.cssFamily;
  }

  const firmNamePreviewText = business
    ? business.firmNameScript === 'MARATHI'
      ? business.firmNameMarathi || business.name
      : business.name.toUpperCase()
    : 'YOUR FIRM NAME';

  // --- Small generic switches shared by the toolbar, the properties panel
  // and the live preview, so every field lives in exactly one place above
  // (CONTACT_FIELDS / BRAND_FIELDS) instead of being hand-wired N times. ---

  function isFieldOn(key: FieldKey): boolean {
    switch (key) {
      case 'name':
        return form.useName;
      case 'designation':
        return form.useDesignation;
      case 'date':
        return form.useDate;
      case 'photo':
        return form.usePhoto;
      case 'logo':
        return showBranding && form.useLogo;
      case 'firmName':
        return showBranding && form.useFirmName;
      case 'phone':
        return showBranding && form.usePhone;
      case 'email':
        return showBranding && form.useEmail;
      case 'address':
        return showBranding && form.useAddress;
      case 'website':
        return showBranding && form.useWebsite;
      case 'products':
        return showBranding && form.useProducts;
      default:
        return false;
    }
  }

  function setFieldOn(key: FieldKey, value: boolean) {
    setForm((f) => {
      switch (key) {
        case 'name':
          return { ...f, useName: value };
        case 'designation':
          return { ...f, useDesignation: value };
        case 'date':
          return { ...f, useDate: value };
        case 'photo':
          return { ...f, usePhoto: value };
        case 'logo':
          return { ...f, useLogo: value };
        case 'firmName':
          return { ...f, useFirmName: value };
        case 'phone':
          return { ...f, usePhone: value };
        case 'email':
          return { ...f, useEmail: value };
        case 'address':
          return { ...f, useAddress: value };
        case 'website':
          return { ...f, useWebsite: value };
        case 'products':
          return { ...f, useProducts: value };
        default:
          return f;
      }
    });
  }

  function getTextPlaceholder(key: TextFieldKey): TextPlaceholder {
    switch (key) {
      case 'name':
        return form.namePlaceholder;
      case 'designation':
        return form.designationPlaceholder;
      case 'date':
        return form.datePlaceholder;
      case 'firmName':
        return form.firmNamePlaceholder;
      case 'phone':
        return form.phonePlaceholder;
      case 'email':
        return form.emailPlaceholder;
      case 'address':
        return form.addressPlaceholder;
      case 'website':
        return form.websitePlaceholder;
      case 'products':
        return form.productsPlaceholder;
    }
  }

  function setTextPlaceholder(key: TextFieldKey, p: TextPlaceholder) {
    setForm((f) => {
      switch (key) {
        case 'name':
          return { ...f, namePlaceholder: p };
        case 'designation':
          return { ...f, designationPlaceholder: p };
        case 'date':
          return { ...f, datePlaceholder: p };
        case 'firmName':
          return { ...f, firmNamePlaceholder: p };
        case 'phone':
          return { ...f, phonePlaceholder: p };
        case 'email':
          return { ...f, emailPlaceholder: p };
        case 'address':
          return { ...f, addressPlaceholder: p };
        case 'website':
          return { ...f, websitePlaceholder: p };
        case 'products':
          return { ...f, productsPlaceholder: p };
        default:
          return f;
      }
    });
  }

  // A field a business hasn't filled in yet (Settings → Brand kit) can still
  // be switched on and dragged into place, but there's nothing real to show
  // for it — surfaced as a note in the properties panel rather than
  // disabling the button outright, so it stays discoverable.
  function missingBrandDataNote(key: FieldKey): string | null {
    if (key === 'name')
      return 'If a contact has a Title saved (e.g. "Mr.", "Dr."), it\'s shown automatically right before their name here — contacts without one just show their name.';
    if (key === 'logo' && !business?.logoUrl) return 'Add a logo in Settings → Brand kit for flyers — until you do, this spot stays blank on your flyers.';
    if (key === 'phone' && !business?.phoneDisplay) return 'Add a phone number in Settings → Brand kit for flyers first.';
    if (key === 'email' && !business?.emailDisplay) return 'Add an email in Settings → Brand kit for flyers first.';
    if (key === 'address' && !business?.addressText) return 'Add an address in Settings → Brand kit for flyers first.';
    if (key === 'website' && !business?.websiteUrl) return 'Add a website in Settings → Brand kit for flyers first.';
    if (key === 'products' && !business?.productsText) return 'Add a products/services line in Settings → Brand kit for flyers first.';
    return null;
  }

  function previewTextFor(key: TextFieldKey): string {
    switch (key) {
      case 'name':
        return 'Mr. Sample Name';
      case 'designation':
        return 'Manager';
      case 'date':
        return '25 August';
      case 'firmName':
        return firmNamePreviewText;
      case 'phone':
        return business?.phoneDisplay || 'Your phone number';
      case 'email':
        return business?.emailDisplay || 'Your email';
      case 'address':
        return business?.addressText || 'Your address';
      case 'website':
        return business?.websiteUrl || 'www.yourbusiness.com';
      case 'products':
        return business?.productsText || 'Your products / services';
    }
  }

  async function onBackgroundChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(uploadUrl, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((f) => ({
        ...f,
        backgroundUrl: data.url,
        canvasWidth: data.width,
        canvasHeight: data.height,
        ...defaultsFor(data.width, data.height),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function startDrag(target: DragTarget) {
    return (e: React.PointerEvent) => {
      // A locked element ignores drags entirely (the resize handle counts
      // as part of the photo box it belongs to) — but still selects, so its
      // properties panel (and the Unlock button in it) stays reachable.
      const lockKey = target === 'photo-resize' ? 'photo' : target;
      if (lockKey && isLocked(lockKey)) {
        setSelected(lockKey);
        return;
      }
      e.preventDefault();
      dragTarget.current = target;
      // Touching a marker also selects it, opening its properties panel
      // below — same as clicking its toolbar button — so you don't have to
      // hunt for the matching toolbar icon after clicking a field directly
      // on the flyer preview. Not for the photo box's resize handle, which
      // isn't its own field.
      if (target && target !== 'photo-resize') setSelected(target);

      if (target && previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        const px = (e.clientX - rect.left) / scale;
        const py = (e.clientY - rect.top) / scale;
        let trackedX = px;
        let trackedY = py;
        if (target === 'photo') {
          trackedX = form.photoPlaceholder.x + form.photoPlaceholder.width / 2;
          trackedY = form.photoPlaceholder.y + form.photoPlaceholder.height / 2;
        } else if (target === 'photo-resize') {
          trackedX = form.photoPlaceholder.x + form.photoPlaceholder.width;
          trackedY = form.photoPlaceholder.y + form.photoPlaceholder.height;
        } else if (target === 'logo') {
          trackedX = form.logoPlaceholder.x + form.logoPlaceholder.size / 2;
          trackedY = form.logoPlaceholder.y + form.logoPlaceholder.size / 2;
        } else {
          const p = getTextPlaceholder(target as TextFieldKey);
          trackedX = p.x;
          trackedY = p.y;
        }
        dragOffset.current = { dx: trackedX - px, dy: trackedY - py };
      }
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragTarget.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const px = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const py = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    // Offset by the gap captured at pointerdown so the element moves with
    // the pointer instead of snapping to it.
    const trackedX = px / scale + dragOffset.current.dx;
    const trackedY = py / scale + dragOffset.current.dy;

    const target = dragTarget.current;
    if (target === 'photo') {
      setForm((f) => ({
        ...f,
        photoPlaceholder: {
          ...f.photoPlaceholder,
          x: Math.round(trackedX - f.photoPlaceholder.width / 2),
          y: Math.round(trackedY - f.photoPlaceholder.height / 2),
        },
      }));
      return;
    }
    if (target === 'photo-resize') {
      setForm((f) => ({
        ...f,
        photoPlaceholder: {
          ...f.photoPlaceholder,
          width: Math.max(20, Math.round(trackedX - f.photoPlaceholder.x)),
          height: Math.max(20, Math.round(trackedY - f.photoPlaceholder.y)),
        },
      }));
      return;
    }
    if (target === 'logo') {
      setForm((f) => ({
        ...f,
        logoPlaceholder: {
          ...f.logoPlaceholder,
          x: Math.round(trackedX - f.logoPlaceholder.size / 2),
          y: Math.round(trackedY - f.logoPlaceholder.size / 2),
        },
      }));
      return;
    }
    if (target) {
      const key = target as TextFieldKey;
      setTextPlaceholder(key, { ...getTextPlaceholder(key), x: Math.round(trackedX), y: Math.round(trackedY) });
    }
  }

  function onPointerUp() {
    dragTarget.current = null;
  }

  // Moves the selected element by an exact (dx, dy) in canvas pixels — the
  // floating nudge pad's arrows, used instead of dragging when a finger
  // would otherwise cover the element while placing it.
  function nudgeSelected(dx: number, dy: number) {
    if (!selected || isLocked(selected)) return;
    if (selected === 'photo') {
      setForm((f) => ({ ...f, photoPlaceholder: { ...f.photoPlaceholder, x: f.photoPlaceholder.x + dx, y: f.photoPlaceholder.y + dy } }));
      return;
    }
    if (selected === 'logo') {
      setForm((f) => ({ ...f, logoPlaceholder: { ...f.logoPlaceholder, x: f.logoPlaceholder.x + dx, y: f.logoPlaceholder.y + dy } }));
      return;
    }
    const key = selected as TextFieldKey;
    const p = getTextPlaceholder(key);
    setTextPlaceholder(key, { ...p, x: p.x + dx, y: p.y + dy });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.backgroundUrl) {
      setError('Please upload a flyer background image first.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        occasion: form.occasion,
        backgroundUrl: form.backgroundUrl,
        canvasWidth: form.canvasWidth,
        canvasHeight: form.canvasHeight,
        ...(showPerBusinessOptions
          ? { isDefault: form.isDefault, aisensyCampaignName: form.aisensyCampaignName || null }
          : {}),
        namePlaceholder: form.useName ? form.namePlaceholder : null,
        designationPlaceholder: form.useDesignation ? form.designationPlaceholder : null,
        datePlaceholder: form.useDate ? form.datePlaceholder : null,
        photoPlaceholder: form.usePhoto ? form.photoPlaceholder : null,
        logoPlaceholder: isFieldOn('logo') ? form.logoPlaceholder : null,
        firmNamePlaceholder: isFieldOn('firmName') ? form.firmNamePlaceholder : null,
        phonePlaceholder: isFieldOn('phone') ? form.phonePlaceholder : null,
        emailPlaceholder: isFieldOn('email') ? form.emailPlaceholder : null,
        addressPlaceholder: isFieldOn('address') ? form.addressPlaceholder : null,
        websitePlaceholder: isFieldOn('website') ? form.websitePlaceholder : null,
        productsPlaceholder: isFieldOn('products') ? form.productsPlaceholder : null,
      };
      const url = form.id ? `${apiBase}/${form.id}` : apiBase;
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function selectAndEnable(key: FieldKey) {
    setSelected(key);
    if (!isFieldOn(key)) setFieldOn(key, true);
  }

  function ToolbarButton({ def }: { def: { key: FieldKey; label: string; icon: string } }) {
    const on = isFieldOn(def.key);
    const isSelected = selected === def.key;
    return (
      <button
        type="button"
        onClick={() => selectAndEnable(def.key)}
        title={def.label}
        className={[
          'relative flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1 text-[9px] font-medium leading-tight transition-colors',
          isSelected
            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
            : on
              ? 'border-brand-200 bg-brand-50/60 text-brand-700 hover:border-brand-400'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50',
        ].join(' ')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={def.icon} />
        </svg>
        <span>{def.label}</span>
        {on && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-500" />}
        {isLocked(def.key) && (
          <svg className="absolute top-0.5 left-0.5 w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1.5a4.5 4.5 0 00-4.5 4.5v3H6a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 006 21h12a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0018 9h-1.5V6A4.5 4.5 0 0012 1.5zm-3 7.5V6a3 3 0 116 0v3H9z" />
          </svg>
        )}
      </button>
    );
  }

  const selectedDef = selected ? [...CONTACT_FIELDS, ...BRAND_FIELDS].find((d) => d.key === selected) : null;
  const selectedNote = selected ? missingBrandDataNote(selected) : null;

  return (
    <>
    <FloatingNudgePad
      visible={Boolean(selected) && !isLocked(selected as FieldKey)}
      label={selectedDef?.label}
      onNudge={nudgeSelected}
    />
    <form onSubmit={onSubmit} className="compact-form grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <div className="card p-1.5 space-y-1">
          <div>
            <label className="label">Template name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Birthday — Gold theme"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Occasion</label>
              <select
                className="input"
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value as TemplateFormValues['occasion'] })}
              >
                <option value="BIRTHDAY">Birthday</option>
                <option value="ANNIVERSARY">Anniversary</option>
                <option value="FESTIVAL">Festival</option>
              </select>
            </div>
            {showPerBusinessOptions && (
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-1.5 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  Use as default for this occasion
                </label>
              </div>
            )}
          </div>
          {showPerBusinessOptions &&
            (!showAdvanced ? (
              <button
                type="button"
                onClick={() => setShowAdvanced(true)}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                + Advanced options (optional)
              </button>
            ) : (
              <div>
                <label className="label">AiSensy campaign name (optional)</label>
                <input
                  className="input"
                  value={form.aisensyCampaignName}
                  onChange={(e) => setForm({ ...form, aisensyCampaignName: e.target.value })}
                  placeholder="Leave blank to use your Settings default"
                />
              </div>
            ))}
          <div>
            <label className="label">Flyer background image</label>
            <input type="file" accept="image/webp" onChange={onBackgroundChange} className="text-xs" />
            <p className="text-xs text-gray-500 mt-0.5">WebP only.</p>
            {uploading && <p className="text-xs text-gray-500 mt-0.5">Uploading…</p>}
            {form.backgroundUrl && (
              <p className="text-xs text-gray-500 mt-0.5">
                Current image is {form.canvasWidth}×{form.canvasHeight}px — only choose a file here if you want to
                replace it with a different background.
              </p>
            )}
          </div>
        </div>

        <div className="card p-1.5 space-y-1.5">
          <div>
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Contact details</h3>
            <div className="grid grid-cols-5 gap-1">
              {CONTACT_FIELDS.map((def) => (
                <ToolbarButton key={def.key} def={def} />
              ))}
            </div>
          </div>

          {showBranding && (
            <div>
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Your business branding</h3>

              {defaultFrame ? (
                <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-white border border-brand-200 flex-shrink-0 flex items-center justify-center">
                      {defaultFrame.overlayUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={defaultFrame.overlayUrl} alt={defaultFrame.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-brand-800">Using Frame &ldquo;{defaultFrame.name}&rdquo;</p>
                      <p className="text-[11px] text-brand-700 leading-snug">
                        Its logo/firm name/contact placement applies automatically to every flyer, including this
                        template — the fields below are ignored while it&rsquo;s your default.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <Link href="/dashboard/frames?folder=my" className="text-[11px] font-medium text-brand-700 hover:text-brand-800">
                      Manage frames →
                    </Link>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                      onClick={() => setManualBrandingOpen((v) => !v)}
                    >
                      {manualBrandingOpen ? 'Hide manual positioning' : 'Position manually instead (advanced)'}
                    </button>
                  </div>
                </div>
              ) : frames.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 mb-1.5 text-[11px] text-amber-800 leading-snug">
                  You have {frames.length} saved frame{frames.length === 1 ? '' : 's'} but none is set as default.{' '}
                  <Link href="/dashboard/frames?folder=my" className="font-medium underline">
                    Set a default frame
                  </Link>{' '}
                  to apply its branding automatically to every flyer instead of positioning fields below.
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-1.5 mb-1.5 text-[11px] text-gray-600 leading-snug">
                  Tip:{' '}
                  <Link href="/dashboard/frames/new" className="font-medium text-brand-600">
                    create a reusable Frame
                  </Link>{' '}
                  to position your branding once and apply it to every flyer automatically, instead of positioning
                  each field below.
                </div>
              )}

              {(!defaultFrame || manualBrandingOpen) && (
                <div className="grid grid-cols-5 gap-1">
                  {BRAND_FIELDS.map((def) => (
                    <ToolbarButton key={def.key} def={def} />
                  ))}
                </div>
              )}
            </div>
          )}

          {selected && selectedDef && (!brandFieldKeySet.has(selected) || !defaultFrame || manualBrandingOpen) && (
            <div className="border-t border-gray-100 pt-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{selectedDef.label}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleLock(selected)}
                    title={isLocked(selected) ? 'Unlock — allow dragging again' : 'Lock in place — stop accidental dragging'}
                    className={
                      'flex items-center gap-1 text-xs font-medium ' +
                      (isLocked(selected) ? 'text-amber-700' : 'text-gray-500 hover:text-gray-700')
                    }
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isLocked(selected) ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                      )}
                    </svg>
                    {isLocked(selected) ? 'Locked' : 'Lock'}
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={isFieldOn(selected)}
                      onChange={(e) => setFieldOn(selected, e.target.checked)}
                    />
                    Show on flyer
                  </label>
                </div>
              </div>

              {isLocked(selected) && (
                <p className="text-xs text-amber-600 mb-1.5">
                  Locked — drag on the preview is disabled. Click Unlock above to move it again.
                </p>
              )}

              {selectedNote && <p className="text-xs text-amber-600 mb-1.5">{selectedNote}</p>}

              {isFieldOn(selected) && selected === 'photo' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Width (px)</label>
                    <input
                      className="input"
                      type="number"
                      value={form.photoPlaceholder.width}
                      onChange={(e) =>
                        setForm({ ...form, photoPlaceholder: { ...form.photoPlaceholder, width: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Height (px)</label>
                    <input
                      className="input"
                      type="number"
                      value={form.photoPlaceholder.height}
                      onChange={(e) =>
                        setForm({ ...form, photoPlaceholder: { ...form.photoPlaceholder, height: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Shape</label>
                    <select
                      className="input"
                      value={form.photoPlaceholder.shape}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          photoPlaceholder: {
                            ...form.photoPlaceholder,
                            shape: e.target.value as 'circle' | 'square' | 'rounded' | 'hexagon',
                          },
                        })
                      }
                    >
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="rounded">Rounded square</option>
                      <option value="hexagon">Hexagon</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Rotation (degrees)</label>
                    <input
                      className="input"
                      type="number"
                      min={-180}
                      max={180}
                      value={form.photoPlaceholder.rotation ?? 0}
                      onChange={(e) =>
                        setForm({ ...form, photoPlaceholder: { ...form.photoPlaceholder, rotation: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <p className="col-span-2 text-xs text-gray-500">
                    Tip: drag the dot at the photo box&rsquo;s bottom-right corner in the preview to stretch it freely.
                  </p>
                </div>
              )}

              {isFieldOn(selected) && selected === 'logo' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Size (px)</label>
                    <input
                      className="input"
                      type="number"
                      value={form.logoPlaceholder.size}
                      onChange={(e) =>
                        setForm({ ...form, logoPlaceholder: { ...form.logoPlaceholder, size: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Rotation (degrees)</label>
                    <input
                      className="input"
                      type="number"
                      min={-180}
                      max={180}
                      value={form.logoPlaceholder.rotation ?? 0}
                      onChange={(e) =>
                        setForm({ ...form, logoPlaceholder: { ...form.logoPlaceholder, rotation: Number(e.target.value) } })
                      }
                    />
                  </div>
                </div>
              )}

              {isFieldOn(selected) && selected !== 'photo' && selected !== 'logo' && (
                <PlaceholderControls
                  title=""
                  placeholder={getTextPlaceholder(selected)}
                  onChange={(p) => setTextPlaceholder(selected, p)}
                  compact
                />
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading || uploading} className="btn-primary">
            {loading ? 'Saving…' : form.id ? 'Save changes' : 'Create template'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push(redirectPath)}>
            Cancel
          </button>
        </div>
      </div>

      {/* top-0, not top-4: this column is a CSS Grid item with
          align-self:start, so its *containing block* for sticky purposes is
          the grid row's full height (matching whichever column is taller),
          not its own shrunk box. A nonzero `top` offset is satisfied
          immediately, with no scrolling, the moment that row becomes taller
          than this column — e.g. the instant the left column's properties
          panel opens below the toolbar — which read as the whole flyer
          preview (and its markers) suddenly jumping down when a field was
          selected. top-0 has nothing to "jump" to (it's already satisfied
          at the column's natural position), so it keeps this column
          pinned near the top while scrolling without that snap. */}
      <div ref={previewColumnRef} className="lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-600">
            Drag the labeled markers on the flyer to position them. Numbers below give exact control.
          </p>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap ml-2">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            Show grid
          </label>
        </div>
        <div
          ref={previewRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative rounded-lg overflow-hidden border border-gray-300 bg-gray-100 select-none touch-none"
          style={{ width: previewWidth, height: previewHeight || previewWidth }}
        >
          {form.backgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.backgroundUrl} alt="Flyer background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              Upload a background to start positioning
            </div>
          )}

          {showGrid && form.backgroundUrl && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.55) 1px, transparent 1px), ' +
                    'linear-gradient(to bottom, rgba(255,255,255,0.55) 1px, transparent 1px)',
                  backgroundSize: `${previewWidth / 10}px ${(previewHeight || previewWidth) / 10}px`,
                  mixBlendMode: 'difference',
                }}
              />
              <div className="absolute inset-y-0 left-1/2 w-px bg-red-500/80" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-red-500/80" />
            </div>
          )}

          {form.usePhoto && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('photo')}
              className={
                'absolute border-2 border-dashed border-brand-500 bg-brand-500/20 flex items-center justify-center text-[10px] font-medium text-brand-700 ' +
                (isLocked('photo') ? 'cursor-not-allowed' : 'cursor-move')
              }
              style={{
                left: form.photoPlaceholder.x * scale,
                top: form.photoPlaceholder.y * scale,
                width: form.photoPlaceholder.width * scale,
                height: form.photoPlaceholder.height * scale,
                borderRadius:
                  form.photoPlaceholder.shape === 'circle'
                    ? '9999px'
                    : form.photoPlaceholder.shape === 'rounded'
                      ? '18%'
                      : '4px',
                clipPath:
                  form.photoPlaceholder.shape === 'hexagon'
                    ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                    : undefined,
                transform: form.photoPlaceholder.rotation ? `rotate(${form.photoPlaceholder.rotation}deg)` : undefined,
              }}
            >
              Photo
              {!isLocked('photo') && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    startDrag('photo-resize')(e);
                  }}
                  className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white cursor-nwse-resize"
                  title="Drag to stretch"
                />
              )}
            </div>
          )}

          {isFieldOn('logo') && form.backgroundUrl && (
            // Shown as a dashed marker box even without a real logo image to
            // preview (no business logo saved yet, or — in the admin starter
            // template library — no specific business at all) so it stays
            // draggable into place just like every other field, the same
            // way the Photo box above doesn't need a real photo either.
            <div
              onPointerDown={startDrag('logo')}
              className={
                'absolute border-2 border-dashed flex items-center justify-center overflow-hidden bg-white/10 text-[10px] font-medium text-amber-700 ' +
                (selected === 'logo' ? 'border-amber-500' : 'border-transparent hover:border-amber-300') +
                ' ' +
                (isLocked('logo') ? 'cursor-not-allowed' : 'cursor-move')
              }
              style={{
                left: form.logoPlaceholder.x * scale,
                top: form.logoPlaceholder.y * scale,
                width: form.logoPlaceholder.size * scale,
                height: form.logoPlaceholder.size * scale,
                transform: form.logoPlaceholder.rotation ? `rotate(${form.logoPlaceholder.rotation}deg)` : undefined,
              }}
            >
              {business?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain pointer-events-none" />
              ) : (
                'Logo'
              )}
            </div>
          )}

          {(['name', 'designation', 'date', 'firmName', 'phone', 'email', 'address', 'website', 'products'] as TextFieldKey[]).map((key) => {
            if (!isFieldOn(key) || !form.backgroundUrl) return null;
            const p = getTextPlaceholder(key);
            // No artificial floor: flyer.ts never enforces a minimum font
            // size server-side, so clamping this preview to one (10/9/8px)
            // made any field whose configured fontSize maps below that at
            // this preview's scale render visibly larger here than what
            // actually gets sent — measured at ~34% oversized for a real
            // template's Name field. The preview must track fontSize*scale
            // with no floor to stay proportionally accurate.
            const fontPx = Math.max(1, p.fontSize * scale);
            // Phone/email/address/website get the same outline icon used for
            // their toolbar button, sized and colored to match the text next
            // to it — same icon shown on the actual sent flyer (see flyer.ts).
            const iconPath =
              key === 'phone' || key === 'email' || key === 'address' || key === 'website'
                ? BRAND_FIELDS.find((d) => d.key === key)?.icon
                : null;
            return (
              <div
                key={key}
                onPointerDown={startDrag(key)}
                className={'absolute px-1 flex items-center gap-1 ' + (isLocked(key) ? 'cursor-not-allowed' : 'cursor-move')}
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
                  outline: selected === key ? `1px dashed ${isLocked(key) ? 'rgba(217,119,6,0.9)' : 'rgba(255,255,255,0.8)'}` : undefined,
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
                {/* No auto-wrap/truncation here either — matches flyer.ts exactly:
                    a literal newline the business typed (Enter, in Settings or the
                    contact record) becomes a line break via `white-space: pre`;
                    anything else renders at its natural width, even past this box.
                    (`pre-line` would still soft-wrap at whitespace once the box's
                    shrink-to-fit width gets squeezed near the container edge —
                    `pre` is the one value that both keeps newlines and never wraps.) */}
                <span
                  style={{
                    fontSize: fontPx,
                    fontWeight: p.fontWeight,
                    fontFamily: cssFontFamilyFor(p.fontFamily),
                    whiteSpace: 'pre',
                    textAlign: p.align,
                  }}
                >
                  {previewTextFor(key)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </form>
    </>
  );
}
