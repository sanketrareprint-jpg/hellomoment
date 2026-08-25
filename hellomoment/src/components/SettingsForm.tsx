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
