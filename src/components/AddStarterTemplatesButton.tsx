'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * One-click add of 16 ready-made flyer designs — 4 styles each for
 * Birthday, Anniversary, Diwali, and Raksha Bandhan — with everything
 * (background art, name/photo/branding placement) already set up, so a
 * business can pick a look they like without designing or uploading
 * anything.
 */
export default function AddStarterTemplatesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: string[]; skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/templates/seed-starter', { method: 'POST' });
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
        {loading ? 'Adding…' : '+ Add starter flyer designs'}
      </button>
      {result && (
        <p className="text-sm text-gray-600 mt-2">
          {result.created.length > 0 && <>Added {result.created.length}: {result.created.join(', ')}. </>}
          {result.skipped.length > 0 && <>Already had {result.skipped.length}: {result.skipped.join(', ')}.</>}
          {' '}Your logo, name, and branding are already placed on each — edit any of them any time.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
