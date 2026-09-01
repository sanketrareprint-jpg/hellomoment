'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Align = 'left' | 'center' | 'right';

interface TextPlaceholder {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: number;
  align: Align;
  maxWidth: number;
  maxLines: number;
}

interface PhotoPlaceholder {
  x: number;
  y: number;
  size: number;
  shape: 'circle' | 'square';
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

function defaultsFor(width: number, height: number): Pick<
  TemplateFormValues,
  | 'namePlaceholder'
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
      size: Math.round(width * 0.28),
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
  // Firm name / phone / address / products stay on by default too; if the
  // matching Brand kit field is still empty, the checkbox stays disabled
  // and nothing renders either way.
  useLogo: true,
  useFirmName: true,
  usePhone: true,
  useAddress: true,
  useProducts: true,
  ...defaultsFor(1080, 1080),
};

const PREVIEW_WIDTH = 420;
type DragTarget = 'name' | 'date' | 'photo' | 'logo' | 'firmName' | 'phone' | 'address' | 'products' | null;

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
  const previewRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<DragTarget>(null);

  const scale = PREVIEW_WIDTH / form.canvasWidth;
  const previewHeight = form.canvasHeight * scale;

  const firmNamePreviewText = business
    ? business.firmNameScript === 'MARATHI'
      ? business.firmNameMarathi || business.name
      : business.name.toUpperCase()
    : 'YOUR FIRM NAME';

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

    setForm((f) => {
      switch (dragTarget.current) {
        case 'name':
          return { ...f, namePlaceholder: { ...f.namePlaceholder, x, y } };
        case 'date':
          return { ...f, datePlaceholder: { ...f.datePlaceholder, x, y } };
        case 'photo':
          return {
            ...f,
            photoPlaceholder: {
              ...f.photoPlaceholder,
              x: Math.round(x - f.photoPlaceholder.size / 2),
              y: Math.round(y - f.photoPlaceholder.size / 2),
            },
          };
        case 'logo':
          return {
            ...f,
            logoPlaceholder: {
              ...f.logoPlaceholder,
              x: Math.round(x - f.logoPlaceholder.size / 2),
              y: Math.round(y - f.logoPlaceholder.size / 2),
            },
          };
        case 'firmName':
          return { ...f, firmNamePlaceholder: { ...f.firmNamePlaceholder, x, y } };
        case 'phone':
          return { ...f, phonePlaceholder: { ...f.phonePlaceholder, x, y } };
        case 'address':
          return { ...f, addressPlaceholder: { ...f.addressPlaceholder, x, y } };
        case 'products':
          return { ...f, productsPlaceholder: { ...f.productsPlaceholder, x, y } };
        default:
          return f;
      }
    });
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

  return (
    <form onSubmit={onSubmit} className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="card p-5 space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="label">AiSensy campaign name (optional override)</label>
            <input
              className="input"
              value={form.aisensyCampaignName}
              onChange={(e) => setForm({ ...form, aisensyCampaignName: e.target.value })}
              placeholder="Leave blank to use your Settings default"
            />
          </div>
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

        <div className="card p-5 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <input type="checkbox" checked={form.useName} onChange={(e) => setForm({ ...form, useName: e.target.checked })} />
            Print the contact&rsquo;s name on the flyer
          </label>
          {form.useName && (
            <PlaceholderControls
              title=""
              placeholder={form.namePlaceholder}
              onChange={(p) => setForm({ ...form, namePlaceholder: p })}
              compact
            />
          )}
        </div>

        <div className="card p-5 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <input type="checkbox" checked={form.useDate} onChange={(e) => setForm({ ...form, useDate: e.target.checked })} />
            Print the date on the flyer
          </label>
          {form.useDate && (
            <PlaceholderControls
              title=""
              placeholder={form.datePlaceholder}
              onChange={(p) => setForm({ ...form, datePlaceholder: p })}
              compact
            />
          )}
        </div>

        <div className="card p-5 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <input type="checkbox" checked={form.usePhoto} onChange={(e) => setForm({ ...form, usePhoto: e.target.checked })} />
            Overlay the contact&rsquo;s photo
          </label>
          {form.usePhoto && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Size (px)</label>
                <input
                  className="input"
                  type="number"
                  value={form.photoPlaceholder.size}
                  onChange={(e) =>
                    setForm({ ...form, photoPlaceholder: { ...form.photoPlaceholder, size: Number(e.target.value) } })
                  }
                />
              </div>
              <div>
                <label className="label">Shape</label>
                <select
                  className="input"
                  value={form.photoPlaceholder.shape}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      photoPlaceholder: { ...form.photoPlaceholder, shape: e.target.value as 'circle' | 'square' },
                    })
                  }
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Your business branding</h3>
          <p className="text-xs text-gray-500">
            Pulled automatically from Settings → Brand kit for flyers. Your logo always appears; the rest (firm
            name, phone, address, products) is optional — turn on whichever you need and drag them into place.
          </p>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <input type="checkbox" checked={form.useLogo} onChange={(e) => setForm({ ...form, useLogo: e.target.checked })} />
              Show your logo
            </label>
            {!business?.logoUrl && (
              <p className="text-xs text-amber-600">
                Add a logo in Settings → Brand kit for flyers — until you do, this spot stays blank on your flyers.
              </p>
            )}
            {form.useLogo && (
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
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                checked={form.useFirmName}
                onChange={(e) => setForm({ ...form, useFirmName: e.target.checked })}
              />
              Show firm name ({business?.firmNameScript === 'MARATHI' ? 'Marathi' : 'English caps'})
            </label>
            {form.useFirmName && (
              <PlaceholderControls
                title=""
                placeholder={form.firmNamePlaceholder}
                onChange={(p) => setForm({ ...form, firmNamePlaceholder: p })}
                compact
              />
            )}
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                checked={form.usePhone}
                disabled={!business?.phoneDisplay}
                onChange={(e) => setForm({ ...form, usePhone: e.target.checked })}
              />
              Show phone number
            </label>
            {!business?.phoneDisplay && (
              <p className="text-xs text-amber-600">Add a phone number in Settings → Brand kit for flyers first.</p>
            )}
            {form.usePhone && (
              <PlaceholderControls
                title=""
                placeholder={form.phonePlaceholder}
                onChange={(p) => setForm({ ...form, phonePlaceholder: p })}
                compact
              />
            )}
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                checked={form.useAddress}
                disabled={!business?.addressText}
                onChange={(e) => setForm({ ...form, useAddress: e.target.checked })}
              />
              Show address
            </label>
            {!business?.addressText && (
              <p className="text-xs text-amber-600">Add an address in Settings → Brand kit for flyers first.</p>
            )}
            {form.useAddress && (
              <PlaceholderControls
                title=""
                placeholder={form.addressPlaceholder}
                onChange={(p) => setForm({ ...form, addressPlaceholder: p })}
                compact
              />
            )}
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                checked={form.useProducts}
                disabled={!business?.productsText}
                onChange={(e) => setForm({ ...form, useProducts: e.target.checked })}
              />
              Show products / services line
            </label>
            {!business?.productsText && (
              <p className="text-xs text-amber-600">Add a products/services line in Settings → Brand kit for flyers first.</p>
            )}
            {form.useProducts && (
              <PlaceholderControls
                title=""
                placeholder={form.productsPlaceholder}
                onChange={(p) => setForm({ ...form, productsPlaceholder: p })}
                compact
              />
            )}
          </div>
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

      <div>
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
                width: form.photoPlaceholder.size * scale,
                height: form.photoPlaceholder.size * scale,
                borderRadius: form.photoPlaceholder.shape === 'circle' ? '9999px' : '4px',
              }}
            >
              Photo
            </div>
          )}

          {form.useLogo && form.backgroundUrl && (
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
              {business?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain pointer-events-none" />
              ) : (
                <span className="text-[10px] font-medium text-amber-700">Logo</span>
              )}
            </div>
          )}

          {form.useName && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('name')}
              className="absolute cursor-move px-1 whitespace-nowrap"
              style={{
                left: form.namePlaceholder.x * scale,
                top: form.namePlaceholder.y * scale,
                transform:
                  form.namePlaceholder.align === 'center'
                    ? 'translate(-50%, -50%)'
                    : form.namePlaceholder.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                fontSize: Math.max(10, form.namePlaceholder.fontSize * scale),
                fontWeight: form.namePlaceholder.fontWeight,
                color: form.namePlaceholder.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              Sample Name
            </div>
          )}

          {form.useDate && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('date')}
              className="absolute cursor-move px-1 whitespace-nowrap"
              style={{
                left: form.datePlaceholder.x * scale,
                top: form.datePlaceholder.y * scale,
                transform:
                  form.datePlaceholder.align === 'center'
                    ? 'translate(-50%, -50%)'
                    : form.datePlaceholder.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                fontSize: Math.max(9, form.datePlaceholder.fontSize * scale),
                fontWeight: form.datePlaceholder.fontWeight,
                color: form.datePlaceholder.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              25 August
            </div>
          )}

          {form.useFirmName && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('firmName')}
              className="absolute cursor-move px-1 whitespace-nowrap"
              style={{
                left: form.firmNamePlaceholder.x * scale,
                top: form.firmNamePlaceholder.y * scale,
                transform:
                  form.firmNamePlaceholder.align === 'center'
                    ? 'translate(-50%, -50%)'
                    : form.firmNamePlaceholder.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                fontSize: Math.max(9, form.firmNamePlaceholder.fontSize * scale),
                fontWeight: form.firmNamePlaceholder.fontWeight,
                color: form.firmNamePlaceholder.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {firmNamePreviewText}
            </div>
          )}

          {form.usePhone && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('phone')}
              className="absolute cursor-move px-1 whitespace-nowrap"
              style={{
                left: form.phonePlaceholder.x * scale,
                top: form.phonePlaceholder.y * scale,
                transform:
                  form.phonePlaceholder.align === 'center'
                    ? 'translate(-50%, -50%)'
                    : form.phonePlaceholder.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                fontSize: Math.max(8, form.phonePlaceholder.fontSize * scale),
                fontWeight: form.phonePlaceholder.fontWeight,
                color: form.phonePlaceholder.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {business?.phoneDisplay || 'Your phone number'}
            </div>
          )}

          {form.useAddress && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('address')}
              className="absolute cursor-move px-1 whitespace-nowrap"
              style={{
                left: form.addressPlaceholder.x * scale,
                top: form.addressPlaceholder.y * scale,
                transform:
                  form.addressPlaceholder.align === 'center'
                    ? 'translate(-50%, -50%)'
                    : form.addressPlaceholder.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                fontSize: Math.max(8, form.addressPlaceholder.fontSize * scale),
                fontWeight: form.addressPlaceholder.fontWeight,
                color: form.addressPlaceholder.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {business?.addressText || 'Your address'}
            </div>
          )}

          {form.useProducts && form.backgroundUrl && (
            <div
              onPointerDown={startDrag('products')}
              className="absolute cursor-move px-1 whitespace-nowrap"
              style={{
                left: form.productsPlaceholder.x * scale,
                top: form.productsPlaceholder.y * scale,
                transform:
                  form.productsPlaceholder.align === 'center'
                    ? 'translate(-50%, -50%)'
                    : form.productsPlaceholder.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                fontSize: Math.max(8, form.productsPlaceholder.fontSize * scale),
                fontWeight: form.productsPlaceholder.fontWeight,
                color: form.productsPlaceholder.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {business?.productsText || 'Your products / services'}
            </div>
          )}
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
      <div className="grid grid-cols-2 gap-3">
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
