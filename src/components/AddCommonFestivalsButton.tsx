'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * One-click add of the business's confirmed 2026 Indian festival list (see
 * seed-common/route.ts for the source dates). Created paused (inactive) so
 * nothing sends until the business links a flyer template to each one and
 * switches it on.
 */
export default function AddCommonFestivalsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: string[]; skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/festivals/seed-common', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={onClick} disabled={loading} className="btn-secondary">
        {loading ? 'Adding…' : '+ Add common Indian festivals'}
      </button>
      {result && (
        <p className="text-sm text-gray-600 mt-2">
          {result.created.length > 0 && <>Added {result.created.length}: {result.created.join(', ')}. </>}
          {result.skipped.length > 0 && <>Already had {result.skipped.length}: {result.skipped.join(', ')}.</>}
          {' '}They&rsquo;re added <strong>paused</strong> — open each one, pick a flyer template, then switch it
          Active when you&rsquo;re ready. Next year, update each lunar festival&rsquo;s date using your saved
          festival_dates_2026_2028.md reference.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
