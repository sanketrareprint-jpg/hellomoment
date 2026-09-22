'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditableBusiness {
  id: string;
  name: string;
  email: string;
  ownerWhatsapp: string;
  timezone: string;
  walletRatePaise: number;
  phoneDisplay: string | null;
  emailDisplay: string | null;
  addressText: string | null;
  productsText: string | null;
  websiteUrl: string | null;
  firmNameScript: string;
  firmNameMarathi: string | null;
  aisensyApiKey: string | null;
  aisensyBirthdayCampaign: string | null;
  aisensyAnniversaryCampaign: string | null;
  aisensyFestivalCampaign: string | null;
}

function toFormValue(v: string | null | undefined) {
  return v ?? '';
}

export default function AdminBusinessEditPanel({ business }: { business: EditableBusiness }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: business.name,
    email: business.email,
    ownerWhatsapp: business.ownerWhatsapp,
    timezone: business.timezone,
    walletRatePaise: String(business.walletRatePaise),
    phoneDisplay: toFormValue(business.phoneDisplay),
    emailDisplay: toFormValue(business.emailDisplay),
    addressText: toFormValue(business.addressText),
    productsText: toFormValue(business.productsText),
    websiteUrl: toFormValue(business.websiteUrl),
    firmNameScript: business.firmNameScript,
    firmNameMarathi: toFormValue(business.firmNameMarathi),
    aisensyApiKey: toFormValue(business.aisensyApiKey),
    aisensyBirthdayCampaign: toFormValue(business.aisensyBirthdayCampaign),
    aisensyAnniversaryCampaign: toFormValue(business.aisensyAnniversaryCampaign),
    aisensyFestivalCampaign: toFormValue(business.aisensyFestivalCampaign),
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const rate = Number(form.walletRatePaise);
    if (!form.name.trim() || !form.email.trim() || !form.ownerWhatsapp.trim() || !form.timezone.trim()) {
      setError('Business name, email, WhatsApp, and timezone are required.');
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      setError('Wallet rate must be a non-negative number.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          ownerWhatsapp: form.ownerWhatsapp.trim(),
          timezone: form.timezone.trim(),
          walletRatePaise: Math.round(rate),
          phoneDisplay: form.phoneDisplay.trim(),
          emailDisplay: form.emailDisplay.trim(),
          addressText: form.addressText.trim(),
          productsText: form.productsText.trim(),
          websiteUrl: form.websiteUrl.trim(),
          firmNameScript: form.firmNameScript,
          firmNameMarathi: form.firmNameMarathi.trim(),
          aisensyApiKey: form.aisensyApiKey.trim(),
          aisensyBirthdayCampaign: form.aisensyBirthdayCampaign.trim(),
          aisensyAnniversaryCampaign: form.aisensyAnniversaryCampaign.trim(),
          aisensyFestivalCampaign: form.aisensyFestivalCampaign.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save changes');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary whitespace-nowrap">
        Edit business details
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm">Edit business details</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-600 space-y-1">
              Business name
              <input className="input w-full" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Login email
              <input className="input w-full" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Owner WhatsApp
              <input className="input w-full" value={form.ownerWhatsapp} onChange={(e) => update('ownerWhatsapp', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Timezone
              <input className="input w-full" value={form.timezone} onChange={(e) => update('timezone', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Wallet rate (paise/message)
              <input
                type="number"
                min={0}
                className="input w-full"
                value={form.walletRatePaise}
                onChange={(e) => update('walletRatePaise', e.target.value)}
              />
            </label>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Brand kit (flyers)</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-600 space-y-1">
              Phone on flyer
              <input className="input w-full" value={form.phoneDisplay} onChange={(e) => update('phoneDisplay', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Email on flyer
              <input className="input w-full" value={form.emailDisplay} onChange={(e) => update('emailDisplay', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1 sm:col-span-2">
              Address
              <input className="input w-full" value={form.addressText} onChange={(e) => update('addressText', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1 sm:col-span-2">
              Products / services
              <input className="input w-full" value={form.productsText} onChange={(e) => update('productsText', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Website
              <input className="input w-full" value={form.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Firm name script
              <select className="input w-full" value={form.firmNameScript} onChange={(e) => update('firmNameScript', e.target.value)}>
                <option value="ENGLISH">English</option>
                <option value="MARATHI">Marathi</option>
              </select>
            </label>
            {form.firmNameScript === 'MARATHI' && (
              <label className="text-xs text-gray-600 space-y-1 sm:col-span-2">
                Firm name (Marathi)
                <input className="input w-full" value={form.firmNameMarathi} onChange={(e) => update('firmNameMarathi', e.target.value)} />
              </label>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AiSensy (WhatsApp API)</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-600 space-y-1 sm:col-span-2">
              API key
              <input className="input w-full" value={form.aisensyApiKey} onChange={(e) => update('aisensyApiKey', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Birthday campaign
              <input className="input w-full" value={form.aisensyBirthdayCampaign} onChange={(e) => update('aisensyBirthdayCampaign', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Anniversary campaign
              <input className="input w-full" value={form.aisensyAnniversaryCampaign} onChange={(e) => update('aisensyAnniversaryCampaign', e.target.value)} />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              Festival campaign
              <input className="input w-full" value={form.aisensyFestivalCampaign} onChange={(e) => update('aisensyFestivalCampaign', e.target.value)} />
            </label>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary whitespace-nowrap">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary whitespace-nowrap">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
