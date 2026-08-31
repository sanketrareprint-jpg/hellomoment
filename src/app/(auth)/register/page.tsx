'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ businessName: '', email: '', password: '', ownerWhatsapp: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="hellomoment.in" width={36} height={36} className="rounded-lg" />
          <div className="text-xl font-bold text-brand-700">
            hellomoment<span className="text-gray-400">.in</span>
          </div>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Create your business account</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Business / brand name</label>
            <input
              className="input"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="e.g. Rareprint Studio"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@business.com"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="label">Your WhatsApp number</label>
            <input
              className="input"
              required
              value={form.ownerWhatsapp}
              onChange={(e) => setForm({ ...form, ownerWhatsapp: e.target.value })}
              placeholder="e.g. +91 98765 43210"
            />
            <p className="mt-1 text-xs text-gray-500">
              You&rsquo;ll get a copy of every birthday/anniversary/festival wish sent to your customers.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
