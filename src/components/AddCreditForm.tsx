'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Quick-pick amounts for common trial/goodwill grants. Admin can still type
// any custom amount instead.
const PRESET_AMOUNTS = [50, 100, 250, 500];

export default function AddCreditForm({ businessId, rateRupees }: { businessId: string; rateRupees: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | ''>(PRESET_AMOUNTS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const amountRupees = typeof amount === 'number' ? amount : Number(amount);
  const messages = rateRupees > 0 && amountRupees > 0 ? Math.floor(amountRupees / rateRupees) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!amountRupees || amountRupees <= 0) {
      setError('Enter an amount greater than ₹0');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountRupees, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add credit');
      setSuccess(`₹${amountRupees.toFixed(2)} credited.`);
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={
              'rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition ' +
              (amount === preset ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-brand-300')
            }
          >
            ₹{preset}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="input w-32"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. 30-day free trial"
            maxLength={200}
            className="input w-full"
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary whitespace-nowrap">
          {busy ? 'Adding…' : 'Add credit'}
        </button>
      </div>

      {rateRupees > 0 && amountRupees > 0 && (
        <div className="text-xs text-gray-500">≈ {messages} message{messages === 1 ? '' : 's'} at this business's current rate (₹{rateRupees.toFixed(2)}/message).</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-700">{success}</div>}
    </form>
  );
}
