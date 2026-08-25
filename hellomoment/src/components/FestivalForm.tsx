'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface FestivalFormValues {
  id?: string;
  name: string;
  date: string; // YYYY-MM-DD
  recurring: boolean;
  active: boolean;
  templateId: string;
  caption: string;
}

const EMPTY: FestivalFormValues = { name: '', date: '', recurring: true, active: true, templateId: '', caption: '' };

export default function FestivalForm({
  initial,
  templates,
}: {
  initial?: FestivalFormValues;
  templates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FestivalFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = initial?.id ? `/api/festivals/${initial.id}` : '/api/festivals';
      const method = initial?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, templateId: form.templateId || null, caption: form.caption || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      router.push('/dashboard/festivals');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4 max-w-xl">
      <div>
        <label className="label">Festival name</label>
        <input
          className="input"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Diwali"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} />
            Repeats every year on this month/day
          </label>
        </div>
      </div>

      <div>
        <label className="label">Flyer template</label>
        <select className="input" value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}>
          <option value="">Use default festival template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Custom message caption (optional)</label>
        <textarea
          className="input"
          rows={2}
          value={form.caption}
          onChange={(e) => setForm({ ...form, caption: e.target.value })}
          placeholder="e.g. May this Diwali bring you joy and prosperity!"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        Active (will send automatically on this date)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : initial?.id ? 'Save changes' : 'Add festival'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push('/dashboard/festivals')}>
          Cancel
        </button>
      </div>
    </form>
  );
}
