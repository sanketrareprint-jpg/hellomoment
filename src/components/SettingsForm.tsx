'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SettingsFormValues {
  name: string;
  ownerWhatsapp: string;
  timezone: string;
  aisensyApiKey: string;
  aisensyBirthdayCampaign: string;
  aisensyAnniversaryCampaign: string;
  aisensyFestivalCampaign: string;
  logoUrl: string;
  phoneDisplay: string;
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
    <form onSubmit={onSubmit} className="space-y-6 max-w-xl">
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Business profile</h2>
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
          <p className="mt-1 text-xs text-gray-500">Receives a copy of every wish sent to your contacts.</p>
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
          <p className="mt-1 text-xs text-gray-500">Birthdays/anniversaries/festivals trigger at local midnight in this timezone.</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Brand kit for flyers</h2>
        <p className="text-sm text-gray-600">
          These details are saved once here and can be shown on any flyer template — logo, firm name, phone,
          address, products. Each template you design decides where (or whether) to show them; you don&rsquo;t
          need to re-enter anything when you create a new festival template.
        </p>
        <div>
          <label className="label">Logo</label>
          <div className="flex items-center gap-3">
            {form.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="Logo preview" className="h-14 w-14 object-contain rounded border border-gray-200 bg-white" />
            )}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogoChange} />
          </div>
          {uploadingLogo && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
          <p className="mt-1 text-xs text-gray-500">A PNG with a transparent background looks best.</p>
        </div>
        <div>
          <label className="label">Phone number to show on the flyer</label>
          <input
            className="input"
            value={form.phoneDisplay}
            onChange={(e) => setForm({ ...form, phoneDisplay: e.target.value })}
            placeholder="e.g. +91 98765 43210"
          />
        </div>
        <div>
          <label className="label">Address</label>
          <input
            className="input"
            value={form.addressText}
            onChange={(e) => setForm({ ...form, addressText: e.target.value })}
            placeholder="Shop address to print on the flyer"
          />
        </div>
        <div>
          <label className="label">Products / services line</label>
          <input
            className="input"
            value={form.productsText}
            onChange={(e) => setForm({ ...form, productsText: e.target.value })}
            placeholder="e.g. Sweets · Snacks · Catering"
          />
        </div>
        <div>
          <label className="label">Firm name script on the flyer</label>
          <select
            className="input"
            value={form.firmNameScript}
            onChange={(e) => setForm({ ...form, firmNameScript: e.target.value as 'ENGLISH' | 'MARATHI' })}
          >
            <option value="ENGLISH">English (shown in CAPITAL letters)</option>
            <option value="MARATHI">Marathi (मराठी लिपी)</option>
          </select>
          {form.firmNameScript === 'MARATHI' && (
            <div className="mt-2">
              <label className="label">Firm name in Marathi</label>
              <input
                className="input"
                value={form.firmNameMarathi}
                onChange={(e) => setForm({ ...form, firmNameMarathi: e.target.value })}
                placeholder="उदा. रेअरप्रिंट"
              />
              <p className="mt-1 text-xs text-gray-500">
                Type your firm name in Marathi script here — we print this exactly as typed.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">AiSensy WhatsApp integration</h2>
        <p className="text-sm text-gray-600">
          Connect your AiSensy account so hellomoment.in can send wishes on your behalf. Find your API key under
          Manage → API Key in your AiSensy dashboard. Each campaign name below must already exist and be{' '}
          <strong>Live</strong> in AiSensy.
        </p>
        <div>
          <label className="label">AiSensy API key</label>
          <input
            className="input"
            type="password"
            value={form.aisensyApiKey}
            onChange={(e) => setForm({ ...form, aisensyApiKey: e.target.value })}
            placeholder="Paste your AiSensy API key"
          />
        </div>
        <div>
          <label className="label">Birthday campaign name</label>
          <input
            className="input"
            value={form.aisensyBirthdayCampaign}
            onChange={(e) => setForm({ ...form, aisensyBirthdayCampaign: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Anniversary campaign name</label>
          <input
            className="input"
            value={form.aisensyAnniversaryCampaign}
            onChange={(e) => setForm({ ...form, aisensyAnniversaryCampaign: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Default festival campaign name</label>
          <input
            className="input"
            value={form.aisensyFestivalCampaign}
            onChange={(e) => setForm({ ...form, aisensyFestivalCampaign: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500">A specific flyer template can override this per-festival.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Settings saved.</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
