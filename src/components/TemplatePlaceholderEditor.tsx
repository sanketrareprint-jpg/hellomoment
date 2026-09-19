'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FONT_FAMILIES, type FontFamilyId } from '@/lib/fontFamilies';

type Align = 'left' | 'center' | 'right';

interface TextPlaceholder {
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

interface PhotoPlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'circle' | 'square' | 'rounded' | 'hexagon';
}

interface LogoPlaceholder {
  x: number;
  y: number;
  size: number;
}

// The business's saved Brand kit (Settings → Brand kit for flyers), passed
// in so the editor can preview the *actual* logo/firm name/phone/address
// instead of generic placeholder boxes — a truer what-you'll-actually-send
// preview than a "Sample Name"-style stand-in would give.
export interface BrandInfo {
  logoUrl: string | null;
  name: string;
  phoneDisplay: string | null;
  addressText: string | null;
  productsText: string | null;
  firmNameScript: 'ENGLISH' | 'MARATHI';
  firmNameMarathi: string | null;
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

// Fields whose placeholder is a plain TextPlaceholder (font/size/color/align
// etc.) — i.e. everything except the photo box and the logo image, which
// each have their own shape.
type TextFieldKey = 'name' | 'designation' | 'date' | 'firmName' | 'phone' | 'address' | 'products';
type FieldKey = TextFieldKey | 'photo' | 'logo';

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
  useAddress: false,
  useProducts: false,
  ...defaultsFor(1080, 1080),
};

const PREVIEW_WIDTH = 420;
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
    key: 'address',
    label: 'Address',
    icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
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
}: {
  initial?: TemplateFormValues;
  business?: BrandInfo;
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
  const previewRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<DragTarget>(null);

  const scale = PREVIEW_WIDTH / form.canvasWidth;
  const previewHeight = form.canvasHeight * scale;

  // Resolves a placeholder's chosen font to the matching CSS font-family for
  // the live preview only — the actual flyer PNG is always rendered
  // server-side from the bundled .ttf files in assets/fonts (see flyer.ts).
  function cssFontFamilyFor(id?: string) {
    return FONT_FAMILIES.find((f) => f.id === id)?.cssFamily ?? 'inherit';
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
        return form.useLogo;
      case 'firmName':
        return form.useFirmName;
      case 'phone':
        return form.usePhone;
      case 'address':
        return form.useAddress;
      case 'products':
        return form.useProducts;
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
        case 'address':
          return { ...f, useAddress: value };
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
      case 'address':
        return form.addressPlaceholder;
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
        case 'address':
          return { ...f, addressPlaceholder: p };
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
    if (key === 'address' && !business?.addressText) return 'Add an address in Settings → Brand kit for flyers first.';
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
      case 'address':
        return business?.addressText || 'Your address';
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
      const res = await fetch('/api/uploads/template', { method: 'POST', body: fd });
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
      e.preventDefault();
      dragTarget.current = target;
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragTarget.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const px = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const py = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    const x = Math.round(px / scale);
    const y = Math.round(py / scale);

    const target = dragTarget.current;
    if (target === 'photo') {
      setForm((f) => ({
        ...f,
        photoPlaceholder: {
          ...f.photoPlaceholder,
          x: Math.round(x - f.photoPlaceholder.width / 2),
          y: Math.round(y - f.photoPlaceholder.height / 2),
        },
      }));
      return;
    }
    if (target === 'photo-resize') {
      setForm((f) => ({
        ...f,
        photoPlaceholder: {
          ...f.photoPlaceholder,
          width: Math.max(20, Math.round(x - f.photoPlaceholder.x)),
          height: Math.max(20, Math.round(y - f.photoPlaceholder.y)),
        },
      }));
      return;
    }
    if (target === 'logo') {
      setForm((f) => ({
        ...f,
        logoPlaceholder: {
          ...f.logoPlaceholder,
          x: Math.round(x - f.logoPlaceholder.size / 2),
          y: Math.round(y - f.logoPlaceholder.size / 2),
        },
      }));
      return;
    }
    if (target) {
      const key = target as TextFieldKey;
      setTextPlaceholder(key, { ...getTextPlaceholder(key), x, y });
    }
  }

  function onPointerUp() {
    dragTarget.current = null;
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
        isDefault: form.isDefault,
        aisensyCampaignName: form.aisensyCampaignName || null,
        namePlaceholder: form.useName ? form.namePlaceholder : null,
        designationPlaceholder: form.useDesignation ? form.designationPlaceholder : null,
        datePlaceholder: form.useDate ? form.datePlaceholder : null,
        photoPlaceholder: form.usePhoto ? form.photoPlaceholder : null,
        logoPlaceholder: form.useLogo ? form.logoPlaceholder : null,
        firmNamePlaceholder: form.useFirmName ? form.firmNamePlaceholder : null,
        phonePlaceholder: form.usePhone ? form.phonePlaceholder : null,
        addressPlaceholder: form.useAddress ? form.addressPlaceholder : null,
        productsPlaceholder: form.useProducts ? form.productsPlaceholder : null,
      };
      const url = form.id ? `/api/templates/${form.id}` : '/api/templates';
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      router.push('/dashboard/templates');
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
      </button>
    );
  }

  const selectedDef = selected ? [...CONTACT_FIELDS, ...BRAND_FIELDS].find((d) => d.key === selected) : null;
  const selectedNote = selected ? missingBrandDataNote(selected) : null;

  return (
    <form onSubmit={onSubmit} className="compact-form grid lg:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="card p-2 space-y-1.5">
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
          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Use as default for this occasion
              </label>
            </div>
          </div>
          {!showAdvanced ? (
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
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
          )}
          <div>
            <label className="label">Flyer background image</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onBackgroundChange} />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
            {form.backgroundUrl && (
              <p className="text-xs text-gray-500 mt-1">
                Current image is {form.canvasWidth}×{form.canvasHeight}px — only choose a file here if you want to
                replace it with a different background.
              </p>
            )}
          </div>
        </div>

        <div className="card p-2 space-y-2">
          <div>
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact details</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {CONTACT_FIELDS.map((def) => (
                <ToolbarButton key={def.key} def={def} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Your business branding</h3>
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
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={isFieldOn(selected)}
                    onChange={(e) => setFieldOn(selected, e.target.checked)}
                  />
                  Show on flyer
                </label>
              </div>

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

        <div className="flex gap-3">
          <button type="submit" disabled={loading || uploading} className="btn-primary">
            {loading ? 'Saving…' : form.id ? 'Save changes' : 'Create template'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push('/dashboard/templates')}>
            Cancel
          </button>
        </div>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <p className="text-sm text-gray-600 mb-2">
          Drag the labeled markers on the flyer to position them. Numbers below give exact control.
        </p>
        <div
          ref={previewRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative rounded-lg overflow-hidden border border-gray-300 bg-gray-100 select-none touch-none"
          style={{ width: PREVIEW_WIDTH, height: previewHeight || PREVIEW_WIDTH }}
        >
          {form.backgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.backgroundUrl} alt="Flyer background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              Upload a background to start positioning
            </div>
          )}

          {form.usePhoto && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('photo')}
              className="absolute border-2 border-dashed border-brand-500 bg-brand-500/20 cursor-move flex items-center justify-center text-[10px] font-medium text-brand-700"
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
              }}
            >
              Photo
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  startDrag('photo-resize')(e);
                }}
                className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white cursor-nwse-resize"
                title="Drag to stretch"
              />
            </div>
          )}

          {form.useLogo && form.backgroundUrl && business?.logoUrl && (
            <div
              onPointerDown={startDrag('logo')}
              className="absolute border-2 border-dashed border-amber-500 cursor-move flex items-center justify-center overflow-hidden bg-white/10"
              style={{
                left: form.logoPlaceholder.x * scale,
                top: form.logoPlaceholder.y * scale,
                width: form.logoPlaceholder.size * scale,
                height: form.logoPlaceholder.size * scale,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={business.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain pointer-events-none" />
            </div>
          )}

          {(['name', 'designation', 'date', 'firmName', 'phone', 'address', 'products'] as TextFieldKey[]).map((key) => {
            if (!isFieldOn(key) || !form.backgroundUrl) return null;
            const p = getTextPlaceholder(key);
            const minFontPx = key === 'name' ? 10 : key === 'date' ? 9 : 8;
            return (
              <div
                key={key}
                onPointerDown={startDrag(key)}
                className="absolute cursor-move px-1 whitespace-nowrap"
                style={{
                  left: p.x * scale,
                  top: p.y * scale,
                  transform:
                    p.align === 'center' ? 'translate(-50%, -50%)' : p.align === 'right' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
                  fontSize: Math.max(minFontPx, p.fontSize * scale),
                  fontWeight: p.fontWeight,
                  fontFamily: cssFontFamilyFor(p.fontFamily),
                  color: p.color,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  outline: selected === key ? '1px dashed rgba(255,255,255,0.8)' : undefined,
                }}
              >
                {previewTextFor(key)}
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}

function PlaceholderControls({
  title,
  placeholder,
  onChange,
  compact,
}: {
  title: string;
  placeholder: TextPlaceholder;
  onChange: (p: TextPlaceholder) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : 'card p-5'}>
      {title && <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>}
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="label">Font</label>
          <select
            className="input"
            value={placeholder.fontFamily ?? 'default'}
            onChange={(e) => onChange({ ...placeholder, fontFamily: e.target.value as TextPlaceholder['fontFamily'] })}
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Font size</label>
          <input
            className="input"
            type="number"
            value={placeholder.fontSize}
            onChange={(e) => onChange({ ...placeholder, fontSize: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Color</label>
          <input
            className="input"
            type="color"
            value={placeholder.color}
            onChange={(e) => onChange({ ...placeholder, color: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Alignment</label>
          <select
            className="input"
            value={placeholder.align}
            onChange={(e) => onChange({ ...placeholder, align: e.target.value as Align })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="label">Bold</label>
          <select
            className="input"
            value={placeholder.fontWeight}
            onChange={(e) => onChange({ ...placeholder, fontWeight: Number(e.target.value) })}
          >
            <option value={400}>Normal</option>
            <option value={600}>Semi-bold</option>
            <option value={700}>Bold</option>
            <option value={800}>Extra bold</option>
          </select>
        </div>
        <div>
          <label className="label">Max width (px)</label>
          <input
            className="input"
            type="number"
            value={placeholder.maxWidth}
            onChange={(e) => onChange({ ...placeholder, maxWidth: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Max lines</label>
          <input
            className="input"
            type="number"
            min={1}
            max={4}
            value={placeholder.maxLines}
            onChange={(e) => onChange({ ...placeholder, maxLines: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
