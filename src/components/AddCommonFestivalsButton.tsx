'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Curated NAMES only — no dates. Most Indian festivals shift date every
 * year on the lunar calendar, and we'd rather ask the business for the
 * correct date than silently guess wrong. "fixed" ones are noted as a
 * hint since they land on the same Gregorian date every year; everything
 * else needs to be checked against a current calendar/panchang.
 */
const COMMON_FESTIVALS: { name: string; hint: string }[] = [
  { name: "New Year's Day", hint: 'always Jan 1' },
  { name: 'Makar Sankranti', hint: 'usually mid-Jan' },
  { name: 'Republic Day', hint: 'always Jan 26' },
  { name: 'Holi', hint: 'date shifts yearly' },
  { name: 'Gudi Padwa', hint: 'date shifts yearly' },
  { name: 'Eid ul-Fitr', hint: 'date shifts yearly' },
  { name: 'Eid ul-Adha (Bakri Eid)', hint: 'date shifts yearly' },
  { name: 'Independence Day', hint: 'always Aug 15' },
  { name: 'Raksha Bandhan', hint: 'date shifts yearly' },
  { name: 'Ganesh Chaturthi', hint: 'date shifts yearly' },
  { name: 'Gandhi Jayanti', hint: 'always Oct 2' },
  { name: 'Navratri (Ghatasthapana)', hint: 'date shifts yearly' },
  { name: 'Dussehra', hint: 'date shifts yearly' },
  { name: 'Diwali (Lakshmi Puja)', hint: 'date shifts yearly' },
  { name: 'Christmas', hint: 'always Dec 25' },
];

export default function AddCommonFestivalsButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: string[]; skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const festivals = COMMON_FESTIVALS.map((f) => ({ name: f.name, date: dates[f.name] })).filter(
      (f): f is { name: string; date: string } => Boolean(f.date)
    );
    if (festivals.length === 0) {
      setError('Fill in a date for at least one festival (or leave the rest blank to skip them).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/festivals/seed-common', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ festivals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data);
      setDates({});
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        + Add common Indian festivals
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-gray-700">
        Fill in the actual date for whichever festivals you want to add (check a current calendar/panchang for the
        exact date — we don&rsquo;t guess these for you, since most of them shift every year). Leave any you don&rsquo;t
        want blank to skip them.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {COMMON_FESTIVALS.map((f) => (
          <div key={f.name} className="flex items-center justify-between gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2">
            <div>
              <div className="text-sm font-medium text-gray-900">{f.name}</div>
              <div className="text-xs text-gray-400">{f.hint}</div>
            </div>
            <input
              type="date"
              className="input w-40"
              value={dates[f.name] ?? ''}
              onChange={(e) => setDates((d) => ({ ...d, [f.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-gray-600">
          {result.created.length > 0 && <>Added {result.created.length}: {result.created.join(', ')}. </>}
          {result.skipped.length > 0 && <>Already had {result.skipped.length}: {result.skipped.join(', ')}.</>}
          {' '}They&rsquo;re added <strong>paused</strong> — open each one, pick a flyer template, then switch it
          Active when you&rsquo;re ready.
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Adding…' : 'Add festivals'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </form>
  );
}
