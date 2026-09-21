'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FONT_FAMILIES } from '@/lib/fontFamilies';
import { frameDefaultsFor, type FrameFormValues } from '@/lib/framePlaceholders';
import PlaceholderControls from '@/components/PlaceholderControls';
import FloatingNudgePad from '@/components/FloatingNudgePad';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';
import type { TextPlaceholder } from '@/lib/flyerPlaceholders';

export type { FrameFormValues };

type TextFieldKey = 'firmName' | 'phone' | 'email' | 'address' | 'website' | 'products';
type FieldKey = TextFieldKey | 'logo';

export const EMPTY_FRAME: FrameFormValues = {
  name: '',
  isDefault: false,
  overlayUrl: '',
  overlayHue: 0,
  canvasWidth: 5400,
  canvasHeight: 1080,
  // Logo, firm name, email, website and address are the fields a business
  // most commonly wants on every flyer — on by default. Phone and products
  // are still available but start off, same reasoning as the per-template
  // editor (avoids the toolbar looking cluttered before a business has
  // picked spots for anything).
  useLogo: true,
  useFirmName: true,
  usePhone: false,
  useEmail: true,
  useAddress: true,
  useWebsite: true,
  useProducts: false,
  ...frameDefaultsFor(5400, 1080),
};

const MAX_PREVIEW_WIDTH = 720;
type DragTarget = FieldKey | null;

// Quick-pick swatches for the overlay recolor control — evenly spread
// hue-rotate degrees (0 = the overlay's original, uploaded color) rendered
// as actual thumbnails of the overlay graphic so what's shown is exactly
// what picking it will look like, not an abstract color chip.
const OVERLAY_HUE_PRESETS = [0, 45, 90, 135, 180, 225, 270, 315];

// Same fields/icons as BRAND_FIELDS in TemplatePlaceholderEditor.tsx —
// duplicated rather than imported (that file has other client-only state
// wired to its own toolbar) so this editor's toolbar stays self-contained.
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

export default function FramePlaceholderEditor({
  initial,
  business,
  showPerBusinessOptions = true,
  showOverlayUpload = true,
  apiBase = '/api/frames',
  uploadUrl = '/api/uploads/frame',
  redirectPath = '/dashboard/frames',
}: {
  initial?: FrameFormValues;
  // Passed in so the live preview shows the *actual* logo/firm name/phone
  // etc. a business has saved (Settings → Brand kit) — same prop shape as
  // TemplatePlaceholderEditor, so nothing about the field text differs
  // between "positioned per template" and "positioned in a reusable frame".
  business?: BrandInfo;
  // "Use as default" only makes sense on a business's own copy — admin's
  // shared Frame gallery has no notion of a per-business default.
  showPerBusinessOptions?: boolean;
  // Admin always designs the overlay graphic; a business editing their own
  // adopted copy usually just repositions text, but can still swap it.
  showOverlayUpload?: boolean;
  apiBase?: string;
  uploadUrl?: string;
  redirectPath?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FrameFormValues>(initial ?? EMPTY_FRAME);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Shown briefly next to "Save changes" — saving no longer navigates away
  // (see onSubmit below), so this is the only feedback that the click did
  // something.
  const [justSaved, setJustSaved] = useState(false);
  const [selected, setSelected] = useState<FieldKey | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  // Admin-only: after saving, push this frame's field layout onto every
  // other frame in the library (see /api/admin/frames/apply-layout) — lets
  // admin position fields once instead of repeating it per uploaded overlay.
  const [applyToAllFrames, setApplyToAllFrames] = useState(false);
  // "Generate preview" below renders the *actual* flyer — same compositing
  // pipeline a real send uses (see /api/frames/preview and sendWish.ts) —
  // onto the business's default birthday template, as opposed to the
  // HTML/CSS placeholder preview further down which only stands in for
  // "whichever template the frame ends up on top of". Keeping both lets a
  // mismatch between the two (a rendering bug) be caught here directly.
  const [finalPreview, setFinalPreview] = useState<{ loading: boolean; url: string | null; error: string | null }>({
    loading: false,
    url: null,
    error: null,
  });
  const previewRef = useRef<HTMLDivElement>(null);
  const previewColumnRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<DragTarget>(null);
  // The gap between the pointer's canvas position at pointerdown and the
  // value being dragged (an anchor x/y or a center) — captured once so every
  // later pointermove offsets from it instead of snapping that value
  // straight to the pointer (which jumped the element to the cursor on the
  // very first, often sub-pixel, move of a click).
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Whether an element is locked in place (drag disabled) lives on its own
  // placeholder object — the same `locked` flag saved to the DB alongside
  // its x/y/font/etc — so a frame reopens with locks exactly as they were
  // left, instead of resetting every time.
  function isLocked(key: FieldKey): boolean {
    if (key === 'logo') return Boolean(form.logoPlaceholder.locked);
    return Boolean(getTextPlaceholder(key).locked);
  }

  function toggleLock(key: FieldKey) {
    if (key === 'logo') {
      setForm((f) => ({ ...f, logoPlaceholder: { ...f.logoPlaceholder, locked: !f.logoPlaceholder.locked } }));
      return;
    }
    const current = getTextPlaceholder(key);
    setTextPlaceholder(key, { ...current, locked: !current.locked });
  }

  // Local edits to the actual branding TEXT (as opposed to its position/
  // style, which lives in `form` above) — e.g. typing a new address right
  // here instead of going to Settings first. These are Business-level
  // fields (Settings → Brand kit), shared by every template and frame, so
  // they're saved through their own endpoint (see saveBrandText below)
  // rather than through this form's own "Save changes" button, and layered
  // on top of the `business` prop so the preview reflects them immediately.
  const [brandOverride, setBrandOverride] = useState<Partial<BrandInfo>>({});
  const [brandSaving, setBrandSaving] = useState<FieldKey | null>(null);
  const [brandSavedAt, setBrandSavedAt] = useState<Partial<Record<FieldKey, number>>>({});
  const [brandSaveError, setBrandSaveError] = useState<string | null>(null);

  const effectiveBusiness: BrandInfo | undefined = business ? { ...business, ...brandOverride } : business;

  // Shrinks the preview canvas to fit its column on narrow screens (e.g. a
  // phone, where the column is narrower than MAX_PREVIEW_WIDTH) instead of
  // overflowing and forcing a horizontal scroll. `scale` derives from this,
  // so drag math (onPointerMove, which reads the same rendered box via
  // getBoundingClientRect) stays correct at any size.
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

  function cssFontFamilyFor(id?: string) {
    return (FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES.find((f) => f.id === 'default'))!.cssFamily;
  }

  const firmNamePreviewText = effectiveBusiness
    ? effectiveBusiness.firmNameScript === 'MARATHI'
      ? effectiveBusiness.firmNameMarathi || effectiveBusiness.name
      : effectiveBusiness.name.toUpperCase()
    : 'YOUR FIRM NAME';

  // Only these five fields are safe to edit right here: each is a plain
  // flyer-display string with no other meaning. Firm name (English) isn't
  // included — the flyer shows the business's actual account name
  // (uppercased), so editing it lives in Settings instead of a placement
  // editor; the Marathi firm name has no such double duty and is editable.
  type EditableBrandKey = 'phoneDisplay' | 'emailDisplay' | 'addressText' | 'websiteUrl' | 'productsText' | 'firmNameMarathi';

  function brandKeyFor(key: FieldKey): EditableBrandKey | null {
    switch (key) {
      case 'phone':
        return 'phoneDisplay';
      case 'email':
        return 'emailDisplay';
      case 'address':
        return 'addressText';
      case 'website':
        return 'websiteUrl';
      case 'products':
        return 'productsText';
      case 'firmName':
        return effectiveBusiness?.firmNameScript === 'MARATHI' ? 'firmNameMarathi' : null;
      default:
        return null;
    }
  }

  function updateBrandDraft(key: FieldKey, value: string) {
    const brandKey = brandKeyFor(key);
    if (!brandKey) return;
    setBrandOverride((prev) => ({ ...prev, [brandKey]: value }));
    setBrandSavedAt((prev) => ({ ...prev, [key]: undefined }));
  }

  async function saveBrandText(key: FieldKey) {
    const brandKey = brandKeyFor(key);
    if (!brandKey || !effectiveBusiness) return;
    const value = effectiveBusiness[brandKey] ?? '';
    setBrandSaving(key);
    setBrandSaveError(null);
    try {
      const res = await fetch('/api/settings/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [brandKey]: value }),
      });
      if (!res.ok) throw new Error('Could not save this text');
      setBrandSavedAt((prev) => ({ ...prev, [key]: Date.now() }));
    } catch (err) {
      setBrandSaveError(err instanceof Error ? err.message : 'Could not save this text');
    } finally {
      setBrandSaving(null);
    }
  }

  function isFieldOn(key: FieldKey): boolean {
    switch (key) {
      case 'logo':
        return form.useLogo;
      case 'firmName':
        return form.useFirmName;
      case 'phone':
        return form.usePhone;
      case 'email':
        return form.useEmail;
      case 'address':
        return form.useAddress;
      case 'website':
        return form.useWebsite;
      case 'products':
        return form.useProducts;
    }
  }

  function setFieldOn(key: FieldKey, value: boolean) {
    setForm((f) => {
      switch (key) {
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

  function missingBrandDataNote(key: FieldKey): string | null {
    if (key === 'logo' && !effectiveBusiness?.logoUrl) return 'Add a logo in Settings → Brand kit for flyers — until you do, this spot stays blank on your flyers.';
    if (key === 'phone' && !effectiveBusiness?.phoneDisplay) return 'Type a phone number below.';
    if (key === 'email' && !effectiveBusiness?.emailDisplay) return 'Type an email below.';
    if (key === 'address' && !effectiveBusiness?.addressText) return 'Type an address below.';
    if (key === 'website' && !effectiveBusiness?.websiteUrl) return 'Type a website below.';
    if (key === 'products' && !effectiveBusiness?.productsText) return 'Type a products/services line below.';
    return null;
  }

  function previewTextFor(key: TextFieldKey): string {
    switch (key) {
      case 'firmName':
        return firmNamePreviewText;
      case 'phone':
        return effectiveBusiness?.phoneDisplay || 'Your phone number';
      case 'email':
        return effectiveBusiness?.emailDisplay || 'Your email';
      case 'address':
        return effectiveBusiness?.addressText || 'Your address';
      case 'website':
        return effectiveBusiness?.websiteUrl || 'www.yourbusiness.com';
      case 'products':
        return effectiveBusiness?.productsText || 'Your products / services';
    }
  }

  async function onOverlayChange(e: React.ChangeEvent<HTMLInputElement>) {
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
        overlayUrl: data.url,
        overlayHue: 0,
        canvasWidth: data.width,
        canvasHeight: data.height,
        ...frameDefaultsFor(data.width, data.height),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function clearOverlay() {
    setForm((f) => ({ ...f, overlayUrl: '' }));
  }

  function startDrag(target: DragTarget) {
    return (e: React.PointerEvent) => {
      if (target && isLocked(target)) {
        setSelected(target);
        return;
      }
      e.preventDefault();
      dragTarget.current = target;
      if (target) setSelected(target);

      if (target && previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        const px = (e.clientX - rect.left) / scale;
        const py = (e.clientY - rect.top) / scale;
        let trackedX = px;
        let trackedY = py;
        if (target === 'logo') {
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
    if (selected === 'logo') {
      setForm((f) => ({ ...f, logoPlaceholder: { ...f.logoPlaceholder, x: f.logoPlaceholder.x + dx, y: f.logoPlaceholder.y + dy } }));
      return;
    }
    const key = selected as TextFieldKey;
    const p = getTextPlaceholder(key);
    setTextPlaceholder(key, { ...p, x: p.x + dx, y: p.y + dy });
  }

  // Persists the current form state (create or update, matching onSubmit's
  // own POST/PUT choice) and returns the saved frame's id. Shared by
  // onSubmit and generateFinalPreview so a preview can never be generated
  // from an unsaved layout — see generateFinalPreview's own comment.
  async function saveFrame(): Promise<string> {
    if (!form.name.trim()) {
      throw new Error('Please give this frame a name.');
    }
    const payload = {
      name: form.name,
      overlayUrl: form.overlayUrl || null,
      overlayHue: form.overlayHue,
      canvasWidth: form.canvasWidth,
      canvasHeight: form.canvasHeight,
      ...(showPerBusinessOptions ? { isDefault: form.isDefault } : {}),
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

    // Stay on this page instead of bouncing back to the list — just swap
    // a freshly-created frame's URL over to its own edit page (so a
    // second save PUTs instead of re-POSTing a duplicate).
    if (!form.id) {
      setForm((f) => ({ ...f, id: data.frame.id }));
      router.replace(`${redirectPath.split('?')[0]}/${data.frame.id}/edit`);
    }
    return form.id ?? data.frame.id;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const savedId = await saveFrame();

      if (!showPerBusinessOptions && applyToAllFrames) {
        const applyRes = await fetch('/api/admin/frames/apply-layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceFrameId: savedId }),
        });
        const applyData = await applyRes.json().catch(() => null);
        if (!applyRes.ok) throw new Error(applyData?.error || 'Saved this frame, but could not apply its layout to the others');
      }

      router.refresh();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Renders the *actual* flyer — same compositing pipeline a real send uses
  // (see /api/frames/preview and sendWish.ts) — onto the business's default
  // birthday template. Saves the current form state first (via saveFrame)
  // and asks the preview endpoint to render that saved frame by id, so this
  // can never show a layout a real send wouldn't actually produce — a
  // mismatch that used to happen whenever this was generated from unsaved
  // edits while a real send kept reading the last-saved (different) layout.
  async function generateFinalPreview() {
    setFinalPreview({ loading: true, url: null, error: null });
    try {
      const frameId = await saveFrame();
      const res = await fetch('/api/frames/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate preview');
      setFinalPreview({ loading: false, url: data.url, error: null });
      router.refresh();
    } catch (err) {
      setFinalPreview({ loading: false, url: null, error: err instanceof Error ? err.message : 'Could not generate preview' });
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
          'relative flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-1.5 text-[10px] font-medium leading-tight transition-colors',
          isSelected
            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
            : on
              ? 'border-brand-200 bg-brand-50/60 text-brand-700 hover:border-brand-400'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50',
        ].join(' ')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const selectedDef = selected ? BRAND_FIELDS.find((d) => d.key === selected) : null;
  const selectedNote = selected ? missingBrandDataNote(selected) : null;

  return (
    <>
    <FloatingNudgePad
      visible={Boolean(selected) && !isLocked(selected as FieldKey)}
      label={selectedDef?.label}
      onNudge={nudgeSelected}
    />
    {finalPreview.url && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={() => setFinalPreview((s) => ({ ...s, url: null }))}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Preview (default birthday template)</h3>
            <button
              type="button"
              onClick={() => setFinalPreview((s) => ({ ...s, url: null }))}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Generating this saved your current changes, then rendered this frame exactly as a customer would receive
            it — not the placeholder preview below.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={finalPreview.url} alt="Final flyer preview" className="w-full rounded-md border border-gray-200" />
        </div>
      </div>
    )}
    <form onSubmit={onSubmit} className="compact-form grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
      <div className="space-y-2">
        <div className="card p-2 space-y-1.5">
          <div>
            <label className="label">Frame name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Gold corner badge"
            />
          </div>
          {showPerBusinessOptions && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Use as my default frame (applied to every flyer I send)
            </label>
          )}
          {showOverlayUpload && (
            <div>
              <label className="label">Decorative overlay graphic (optional)</label>
              <input type="file" accept="image/webp" onChange={onOverlayChange} />
              <p className="text-xs text-gray-500 mt-1">
                WebP in a 5:1 (width:height) ratio works best — it&rsquo;s drawn on top of every flyer&rsquo;s own
                background, behind the text/logo below. Leave this blank for a plain frame that just positions your
                branding text.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium text-gray-600">File requirements:</span> .webp format only &middot; max
                10MB (10,240KB) &middot; e.g. 1500&times;300px or any size in the same 5:1 ratio &mdash; a larger
                upload just takes longer to save, it&rsquo;s scaled to fit automatically.
              </p>
              {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              {form.overlayUrl && (
                <button type="button" onClick={clearOverlay} className="text-xs text-red-600 font-medium mt-1">
                  Remove overlay graphic
                </button>
              )}
            </div>
          )}
          {form.overlayUrl && (
            <div>
              <div className="flex items-center justify-between">
                <label className="label mb-0">Overlay color</label>
                {form.overlayHue !== 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, overlayHue: 0 }))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Reset to original
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 mb-1.5">
                Shifts the overlay graphic&rsquo;s existing colors — same gradient/design, different color combination.
                No need to upload a separate image per color.
              </p>
              <div className="flex items-center gap-2 mb-1.5">
                {OVERLAY_HUE_PRESETS.map((hue) => (
                  <button
                    key={hue}
                    type="button"
                    title={hue === 0 ? 'Original color' : `Shift ${hue}°`}
                    onClick={() => setForm((f) => ({ ...f, overlayHue: hue }))}
                    className={
                      'w-7 h-7 rounded-full border-2 overflow-hidden flex-shrink-0 ' +
                      (form.overlayHue === hue ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200')
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.overlayUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: hue ? `hue-rotate(${hue}deg)` : undefined }}
                    />
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={359}
                value={form.overlayHue}
                onChange={(e) => setForm((f) => ({ ...f, overlayHue: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="card p-2 space-y-2">
          <div>
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Business branding</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {BRAND_FIELDS.map((def) => (
                <ToolbarButton key={def.key} def={def} />
              ))}
            </div>
          </div>

          {selected && selectedDef && (
            <div className="border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between mb-1.5">
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

              {brandKeyFor(selected) && effectiveBusiness && (
                <div className="mb-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Text shown on the flyer</label>
                    {brandSaving === selected ? (
                      <span className="text-xs text-gray-400">Saving…</span>
                    ) : brandSavedAt[selected] ? (
                      <span className="text-xs text-green-600">Saved</span>
                    ) : null}
                  </div>
                  <textarea
                    className="input"
                    rows={2}
                    value={effectiveBusiness[brandKeyFor(selected)!] ?? ''}
                    onChange={(e) => updateBrandDraft(selected, e.target.value)}
                    onBlur={() => saveBrandText(selected)}
                    placeholder="Type the text to show on the flyer…"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter to start a new line. Saved straight to Settings → Brand kit, so it updates on every
                    template and frame too.
                  </p>
                </div>
              )}

              {selected === 'firmName' && effectiveBusiness && effectiveBusiness.firmNameScript !== 'MARATHI' && (
                <p className="text-xs text-gray-500 mb-2">
                  Shown in capitals, from your business name in{' '}
                  <a href="/dashboard/settings" className="text-brand-600 font-medium">
                    Settings
                  </a>
                  .
                </p>
              )}

              {brandSaveError && <p className="text-xs text-red-600 mb-1.5">{brandSaveError}</p>}

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

              {isFieldOn(selected) && selected !== 'logo' && (
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

        {!showPerBusinessOptions && (
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={applyToAllFrames}
              onChange={(e) => setApplyToAllFrames(e.target.checked)}
            />
            <span>
              Apply these field positions to every frame in the library — saves this frame, then copies its logo/firm
              name/phone/email/address/website/products layout (scaled to fit) onto every other frame, so businesses
              don&rsquo;t need it repositioned per design.
            </span>
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading || uploading} className="btn-primary">
            {loading ? 'Saving…' : form.id ? 'Save changes' : 'Create frame'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push(redirectPath)}>
            Cancel
          </button>
          {justSaved && <span className="text-sm text-green-600 font-medium">Saved</span>}
        </div>
      </div>

      <div ref={previewColumnRef} className="lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">
            Drag the labeled markers to position them. This preview stands in for whichever flyer template the frame
            ends up on top of.
          </p>
          <div className="flex items-center gap-3 ml-2">
            {business && (
              <button
                type="button"
                onClick={generateFinalPreview}
                disabled={finalPreview.loading}
                title="Saves your current changes, then renders the actual flyer with this frame"
                className="text-xs font-medium text-brand-600 hover:underline whitespace-nowrap disabled:opacity-60"
              >
                {finalPreview.loading ? 'Saving & generating…' : 'Save & generate preview'}
              </button>
            )}
            <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              Show grid
            </label>
          </div>
        </div>
        {finalPreview.error && <p className="text-xs text-red-600 mb-2">{finalPreview.error}</p>}
        <div
          ref={previewRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative rounded-lg overflow-hidden border border-gray-300 select-none touch-none"
          style={{
            width: previewWidth,
            height: previewHeight || previewWidth,
            backgroundColor: '#e5e7eb',
            backgroundImage: form.overlayUrl
              ? undefined
              : 'linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          {form.overlayUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.overlayUrl}
              alt="Frame overlay"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ filter: form.overlayHue ? `hue-rotate(${form.overlayHue}deg)` : undefined }}
            />
          )}

          {showGrid && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px), ' +
                    'linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)',
                  backgroundSize: `${previewWidth / 10}px ${(previewHeight || previewWidth) / 10}px`,
                }}
              />
              <div className="absolute inset-y-0 left-1/2 w-px bg-red-500/60" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-red-500/60" />
            </div>
          )}

          {isFieldOn('logo') && (
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

          {(['firmName', 'phone', 'email', 'address', 'website', 'products'] as TextFieldKey[]).map((key) => {
            if (!isFieldOn(key)) return null;
            const p = getTextPlaceholder(key);
            const fontPx = Math.max(1, p.fontSize * scale);
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
                  outline: selected === key ? `1px dashed ${isLocked(key) ? 'rgba(180,83,9,0.9)' : 'rgba(0,0,0,0.5)'}` : undefined,
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
