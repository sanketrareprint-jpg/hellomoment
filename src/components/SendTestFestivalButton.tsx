'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SendTestFestivalButton({
  festivalId,
  contacts,
}: {
  festivalId: string;
  contacts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    if (!contactId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/festivals/${festivalId}/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setMessage(
        data.log?.status === 'SUCCESS'
          ? 'Sent! Check the Send logs page for details.'
          : `Attempted — status: ${data.log?.status}. See Send logs for details.`
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setLoading(false);
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="card p-4 max-w-xl">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">Test this festival now</h3>
        <p className="text-xs text-gray-500">Add at least one contact first, then come back here to send yourself a test.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 max-w-xl">
      <h3 className="font-semibold text-gray-900 text-sm mb-2">Test this festival now</h3>
      <p className="text-xs text-gray-500 mb-3">
        Sends a real WhatsApp flyer immediately via AiSensy, to just the one contact you pick below — not your whole list — so you
        can check the wording, photo, and branding before the real date.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <select className="input max-w-xs" value={contactId} onChange={(e) => setContactId(e.target.value)}>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn-secondary" disabled={loading} onClick={send}>
          {loading ? 'Sending…' : 'Send test wish'}
        </button>
      </div>
      {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
    </div>
  );
}
