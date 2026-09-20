'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SettingsFormValues {
  name: string;
  email: string;
  ownerWhatsapp: string;
  timezone: string;
  websiteUrl: string;
  aisensyApiKey: string;
  aisensyBirthdayCampaign: string;
  aisensyAnniversaryCampaign: string;
  aisensyFestivalCampaign: string;
  logoUrl: string;
  phoneDisplay: string;
  emailDisplay: string;
  addressText: string;
  productsText: string;
  firmNameScript: 'ENGLISH' | 'MARATHI';
  firmNameMarathi: string;
}

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Dhaka',
  'Asia/Singapore',
  'Asia/Kathmandu',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
];

export default function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<SettingsFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // AiSensy/WhatsApp sending is fully automatic on hellomoment.in — it runs
  // on one shared platform account, so there is nothing for a business to
  // configure here. aisensyApiKey/aisensyBirthdayCampaign/etc. stay in
  // `form` (unchanged, resubmitted as-is on save) but are intentionally not
  // shown or editable anywhere in this UI.

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Logo upload failed');
      setForm((f) => ({ ...f, logoUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="compact-form space-y-3 max-w-xl">
      <div className="card p-3 space-y-2">
        <h2 className="font-semibold text-gray-900 text-sm">Business profile</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Business name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Owner WhatsApp number</label>
            <input
              className="input"
              required
              value={form.ownerWhatsapp}
              onChange={(e) => setForm({ ...form, ownerWhatsapp: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">Owner WhatsApp receives a copy of every wish sent to your contacts.</p>
        <div>
          <label className="label">Login email</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Timezone</label>
          <select className="input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-3 space-y-2">
        <h2 className="font-semibold text-gray-900 text-sm">Brand kit for flyers</h2>
        <p className="text-xs text-gray-500">Shown on flyer templates that choose to display them — logo, firm name, phone, email, address, website, products.</p>
        <div>
          <label className="label">Logo</label>
          <div className="flex items-center gap-2">
            {form.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="Logo preview" className="h-9 w-9 object-contain rounded border border-gray-200 bg-white" />
            )}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogoChange} className="text-xs" />
          </div>
          {uploadingLogo && <p className="text-xs text-gray-500 mt-0.5">Uploading…</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Phone on flyer</label>
            <input
              className="input"
              value={form.phoneDisplay}
              onChange={(e) => setForm({ ...form, phoneDisplay: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="label">Email on flyer</label>
            <input
              className="input"
              type="email"
              value={form.emailDisplay}
              onChange={(e) => setForm({ ...form, emailDisplay: e.target.value })}
              placeholder="sales@yourbusiness.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Address</label>
            <textarea
              className="input"
              rows={2}
              value={form.addressText}
              onChange={(e) => setForm({ ...form, addressText: e.target.value })}
              placeholder="Shop address"
            />
            <p className="text-xs text-gray-500 mt-0.5">Press Enter to control exactly where it breaks onto a new line on the flyer.</p>
          </div>
          <div>
            <label className="label">Website</label>
            <input
              className="input"
              type="text"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="www.yourbusiness.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Products / services</label>
            <textarea
              className="input"
              rows={2}
              value={form.productsText}
              onChange={(e) => setForm({ ...form, productsText: e.target.value })}
              placeholder="Sweets · Snacks · Catering"
            />
            <p className="text-xs text-gray-500 mt-0.5">Press Enter to control exactly where it breaks onto a new line on the flyer.</p>
          </div>
          <div>
            <label className="label">Firm name script</label>
            <select
              className="input"
              value={form.firmNameScript}
              onChange={(e) => setForm({ ...form, firmNameScript: e.target.value as 'ENGLISH' | 'MARATHI' })}
            >
              <option value="ENGLISH">English (CAPITALS)</option>
              <option value="MARATHI">Marathi (मराठी लिपी)</option>
            </select>
          </div>
        </div>
        {form.firmNameScript === 'MARATHI' && (
          <div>
            <label className="label">Firm name in Marathi</label>
            <input
              className="input"
              value={form.firmNameMarathi}
              onChange={(e) => setForm({ ...form, firmNameMarathi: e.target.value })}
              placeholder="उदा. रेअरप्रिंट"
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Settings saved.</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
