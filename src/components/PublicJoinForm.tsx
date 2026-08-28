'use client';

import { useState } from 'react';

export default function PublicJoinForm({ businessId }: { businessId: string }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/public/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          name,
          whatsapp,
          dob: dob || null,
          anniversary: anniversary || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-center space-y-2">
        <div className="text-3xl">🎉</div>
        <p className="font-semibold text-gray-900">You&rsquo;re all set!</p>
        <p className="text-sm text-gray-600">
          Thanks, {name || 'friend'} — you&rsquo;ll get a special wish on your special days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <label className="label">Your name</label>
        <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      </div>
      <div>
        <label className="label">WhatsApp number</label>
        <input
          className="input"
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+91 98765 43210"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date of birth</label>
          <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div>
          <label className="label">Anniversary</label>
          <input className="input" type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-gray-500">Add at least one date so we know when to send you a wish. Both is fine too!</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Submitting…' : 'Submit my details'}
      </button>
    </form>
  );
}
