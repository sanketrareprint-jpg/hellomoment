'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ImportResult {
  totalRows: number;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export default function ImportContactsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/contacts/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk import contacts</h1>
      <p className="text-gray-600 mb-6">Upload a CSV or Excel (.xlsx) file to add many contacts at once.</p>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">File format</h2>
        <p className="text-sm text-gray-600 mb-2">
          Include a header row with these column names (any order, case-insensitive):
        </p>
        <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono overflow-x-auto">
          name, whatsapp, dob, anniversary, relationship, notes
        </div>
        <ul className="text-sm text-gray-600 mt-3 list-disc list-inside space-y-1">
          <li>
            <strong>name</strong> and <strong>whatsapp</strong> are required; everything else is optional.
          </li>
          <li>Dates can be YYYY-MM-DD or DD/MM/YYYY.</li>
          <li>
            <strong>relationship</strong> should be one of CUSTOMER, FRIEND, FAMILY, OTHER (defaults to CUSTOMER).
          </li>
          <li>We also recognize common alternate headers like &quot;Phone&quot;, &quot;Birthday&quot;, &quot;Mobile Number&quot;.</li>
        </ul>
      </div>

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Importing…' : 'Import contacts'}
          </button>
          <Link href="/dashboard/contacts" className="btn-secondary">
            Back to contacts
          </Link>
        </div>
      </form>

      {result && (
        <div className="card p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-2">Import complete</h2>
          <p className="text-sm text-gray-700">
            {result.created} of {result.totalRows} rows imported successfully.
            {result.skipped > 0 && ` ${result.skipped} row(s) were skipped.`}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Issues:</p>
              <ul className="text-sm text-red-600 space-y-1 max-h-64 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/dashboard/contacts" className="text-brand-600 font-medium mt-4 inline-block">
            View contacts →
          </Link>
        </div>
      )}
    </div>
  );
}
