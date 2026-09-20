'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SendTestMessageButton({
  contactId,
  hasDob,
  hasAnniversary,
}: {
  contactId: string;
  hasDob: boolean;
  hasAnniversary: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!hasDob && !hasAnniversary) return null;

  const occasion = hasDob ? 'BIRTHDAY' : 'ANNIVERSARY';

  return (
    <button
      type="button"
      className="text-brand-600 font-medium disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/contacts/${contactId}/send-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ occasion }),
          });
          const data = await res.json().catch(() => null);
          if (!data) throw new Error('The server took too long to respond. It may still be sending — check Send logs in a moment.');
          if (!res.ok) throw new Error(data.error || 'Send failed');
          alert(
            data.log?.status === 'SUCCESS'
              ? 'Sent! Check the Send logs page for details.'
              : `Attempted — status: ${data.log?.status}. See Send logs for details.`,
          );
          router.refresh();
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Send failed');
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Sending…' : 'Send test'}
    </button>
  );
}
