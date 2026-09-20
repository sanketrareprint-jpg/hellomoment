'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  isRoot: boolean;
}

// "One login, several companies" — see src/lib/businessFamily.ts. Lets a
// business switch between every company linked to its login, and create a
// new one, without signing out or re-entering a password.
export default function CompanySwitcher({
  businessName,
  businessEmail,
  companies,
  activeId,
  onNavigate,
}: {
  businessName: string;
  businessEmail: string;
  companies: Company[];
  activeId: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function switchTo(id: string) {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/business/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not switch companies');
      setOpen(false);
      onNavigate?.();
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch companies');
    } finally {
      setLoading(false);
    }
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, ownerWhatsapp: newWhatsapp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create company');
      setOpen(false);
      setAdding(false);
      setNewName('');
      setNewWhatsapp('');
      onNavigate?.();
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create company');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-1 py-1 hover:bg-gray-50 text-left"
      >
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-700 truncate">{businessName}</div>
          <div className="text-xs text-gray-500 truncate">{businessEmail}</div>
        </div>
        {companies.length > 1 && (
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-64 rounded-xl border border-gray-200 bg-white shadow-lg z-10 overflow-hidden">
          {!adding ? (
            <>
              <div className="max-h-48 overflow-y-auto py-1">
                {companies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={loading}
                    onClick={() => switchTo(c.id)}
                    className={
                      'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 disabled:opacity-50 ' +
                      (c.id === activeId ? 'font-semibold text-brand-700' : 'text-gray-700')
                    }
                  >
                    <span className="truncate">{c.name}</span>
                    {c.id === activeId && <span className="text-brand-600 shrink-0">✓</span>}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-600 border-t border-gray-100 hover:bg-brand-50"
              >
                <span className="text-base leading-none">+</span> Add company
              </button>
            </>
          ) : (
            <form onSubmit={createCompany} className="p-3 space-y-2">
              <p className="text-xs text-gray-500">
                A new company with its own contacts, flyers and wallet — same login, no new password.
              </p>
              <input
                className="input"
                placeholder="Company name"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <input
                className="input"
                placeholder="Owner WhatsApp number"
                required
                value={newWhatsapp}
                onChange={(e) => setNewWhatsapp(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm py-1.5">
                  {loading ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="btn-secondary text-sm py-1.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {error && <p className="text-xs text-red-600 px-3 pb-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
