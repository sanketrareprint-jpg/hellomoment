'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * One-click add of 68 ready-made flyer designs — 4 styles each for
 * Birthday, Anniversary, and every festival on the common Indian festival
 * list (Diwali, Raksha Bandhan, New Year, Makar Sankranti, Republic Day,
 * Holi, Gudi Padwa, Eid ul-Fitr, Eid ul-Adha, Independence Day, Ganesh
 * Chaturthi, Gandhi Jayanti, Navratri, Dussehra, Christmas) — with
 * everything (background art, name/photo/branding placement) already set
 * up, so a business can pick a look they like without designing or
 * uploading anything. Clicking it again after the bundled artwork has
 * been updated refreshes the background image on any starter designs the
 * business already has (their placeholder positions and default status
 * are left alone), so this doubles as a "get the latest designs" button.
 */
export default function AddStarterTemplatesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: string[]; updated: string[] } | null>(null);
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
        {loading ? 'Adding…' : '+ Add / refresh starter flyer designs'}
      </button>
      {result && (
        <p className="text-sm text-gray-600 mt-2">
          {result.created.length > 0 && <>Added {result.created.length} new design{result.created.length === 1 ? '' : 's'}. </>}
          {result.updated.length > 0 && <>Refreshed the artwork on {result.updated.length} existing design{result.updated.length === 1 ? '' : 's'}. </>}
          Your logo, name, and branding are already placed on each — edit any of them any time.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
