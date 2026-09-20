'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * One-click import of the 8 original bundled flyer designs into the
 * admin-curated starter template library, so switching to a DB-driven
 * library doesn't lose the artwork that used to live only in code
 * (src/lib/starterTemplates.ts + assets/starter-templates/). Safe to click
 * more than once — matches by name and skips anything already imported.
 */
export default function ImportBundledStarterTemplatesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: string[]; skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/starter-templates/import-bundled', { method: 'POST' });
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
        {loading ? 'Importing…' : '+ Import bundled designs'}
      </button>
      {result && (
        <p className="text-sm text-gray-600 mt-2">
          {result.created.length > 0
            ? `Imported ${result.created.length} design${result.created.length === 1 ? '' : 's'}.`
            : 'Nothing new to import — already in your library.'}
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
