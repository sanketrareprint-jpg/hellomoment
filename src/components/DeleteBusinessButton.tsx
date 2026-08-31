'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteBusinessButton({
  id,
  name,
  counts,
}: {
  id: string;
  name: string;
  counts: { contacts: number; templates: number; sendLogs: number };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="text-red-600 font-medium text-sm disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        const ok = confirm(
          `Delete "${name}"? This permanently removes the business and everything it has — ` +
            `${counts.contacts} contact(s), ${counts.templates} template(s), ${counts.sendLogs} send log(s). ` +
            `They will no longer be able to log in. This can't be undone.`,
        );
        if (!ok) return;
        setBusy(true);
        await fetch(`/api/admin/businesses/${id}`, { method: 'DELETE' });
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
