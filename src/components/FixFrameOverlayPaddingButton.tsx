'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * One-off admin fix: some frame overlay graphics were uploaded before
 * transparent-padding trimming was added at upload time (see
 * src/lib/uploads.ts's trimOverlayPadding), so the banner sits visibly inset
 * from a flyer's edges/bottom instead of flush against them even though it's
 * already scaled full-width and bottom-anchored. Crops that padding off
 * every existing frame's overlay file in place. Safe to click more than
 * once — an already-trimmed frame is skipped.
 */
export default function FixFrameOverlayPaddingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fixed: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/frames/fix-overlay-padding', { method: 'POST' });
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
        {loading ? 'Fixing…' : 'Fix overlay padding'}
      </button>
      {result && (
        <p className="text-sm text-gray-600 mt-2">
          {result.fixed > 0
            ? `Trimmed ${result.fixed} overlay${result.fixed === 1 ? '' : 's'}${
                result.skipped > 0 ? `, ${result.skipped} already flush` : ''
              }.`
            : 'Nothing to fix — every overlay already sits flush against its edges.'}
          {result.errors.length > 0 && ` (${result.errors.length} failed — see server logs.)`}
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
