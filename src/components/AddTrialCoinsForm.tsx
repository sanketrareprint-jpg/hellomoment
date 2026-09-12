'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TRIAL_COIN_GRANT_PRESETS, COINS_PER_SEND } from '@/lib/pricing';

export default function AddTrialCoinsForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [coins, setCoins] = useState<number | ''>(TRIAL_COIN_GRANT_PRESETS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const coinsValue = typeof coins === 'number' ? coins : Number(coins);
  const sends = coinsValue > 0 ? Math.floor(coinsValue / COINS_PER_SEND) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!coinsValue || coinsValue <= 0 || !Number.isInteger(coinsValue)) {
      setError('Enter a whole number of coins greater than 0');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/trial-coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins: coinsValue, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add trial coins');
      setSuccess(`${coinsValue} trial coin${coinsValue === 1 ? '' : 's'} added.`);
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
        {TRIAL_COIN_GRANT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setCoins(preset)}
            className={
              'rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition ' +
              (coins === preset ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-700 hover:border-amber-300')
            }
          >
            {preset} coins
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Coins</label>
          <input
            type="number"
            min={1}
            step={1}
            value={coins}
            onChange={(e) => setCoins(e.target.value === '' ? '' : Number(e.target.value))}
            className="input w-32"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. 14-day free trial"
            maxLength={200}
            className="input w-full"
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary whitespace-nowrap">
          {busy ? 'Adding…' : 'Add trial coins'}
        </button>
      </div>

      {coinsValue > 0 && (
        <div className="text-xs text-gray-500">
          = {sends} free send{sends === 1 ? '' : 's'} ({COINS_PER_SEND} coins/message) — spent before their ₹ wallet.
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-700">{success}</div>}
    </form>
  );
}
