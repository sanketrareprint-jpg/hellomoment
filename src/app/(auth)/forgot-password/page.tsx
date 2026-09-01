'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSent(true);
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
          <img src="/logo.png" alt="raregreet.com" width={36} height={36} className="rounded-lg" />
          <div className="text-xl font-bold text-brand-700">
            raregreet<span className="text-gray-400">.com</span>
          </div>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Forgot password</h1>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If an account exists for <span className="font-medium">{email}</span>, we&rsquo;ve sent a link to reset
              your password. It expires in 1 hour — check your inbox (and spam folder).
            </p>
            <Link href="/login" className="text-brand-600 font-medium text-sm">
              ← Back to log in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Enter the email you signed up with and we&rsquo;ll send you a link to reset your password.
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-6 text-sm text-gray-600 text-center">
              <Link href="/login" className="text-brand-600 font-medium">
                ← Back to log in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
