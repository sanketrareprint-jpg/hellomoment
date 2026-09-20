'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SendTestWishButton({
  contactId,
  hasDob,
  hasAnniversary,
}: {
  contactId: string;
  hasDob: boolean;
  hasAnniversary: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<'BIRTHDAY' | 'ANNIVERSARY' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function send(occasion: 'BIRTHDAY' | 'ANNIVERSARY') {
    setLoading(occasion);
    setMessage(null);
    try {
      const res = await fetch(`/api/contacts/${contactId}/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasion }),
      });
      const data = await res.json().catch(() => null);
      if (!data) throw new Error('The server took too long to respond. It may still be sending — check Send logs in a moment.');
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setMessage(
        data.log?.status === 'SUCCESS' ? 'Sent! Check the Send logs page for details.' : `Attempted — status: ${data.log?.status}. See Send logs for details.`
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setLoading(null);
    }
  }

  if (!hasDob && !hasAnniversary) return null;

  return (
    <div className="card p-4 max-w-xl">
      <h3 className="font-semibold text-gray-900 text-sm mb-2">Test this contact&rsquo;s wish now</h3>
      <p className="text-xs text-gray-500 mb-3">
        Sends a real WhatsApp flyer immediately via AiSensy, using your default template — useful to confirm everything is wired up correctly.
      </p>
      <div className="flex gap-2">
        {hasDob && (
          <button type="button" className="btn-secondary" disabled={loading !== null} onClick={() => send('BIRTHDAY')}>
            {loading === 'BIRTHDAY' ? 'Sending…' : 'Send test birthday wish'}
          </button>
        )}
        {hasAnniversary && (
          <button type="button" className="btn-secondary" disabled={loading !== null} onClick={() => send('ANNIVERSARY')}>
            {loading === 'ANNIVERSARY' ? 'Sending…' : 'Send test anniversary wish'}
          </button>
        )}
      </div>
      {message && (
        <p className="text-sm text-gray-700 mt-2">
          {message}
          {/* No default template configured — point straight at the fix instead of a dead end. */}
          {/No default .* template/i.test(message) && (
            <>
              {' '}
              <Link href="/dashboard/templates" className="text-brand-600 font-medium hover:underline">
                Go to Flyer templates →
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
