'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteTemplateButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="text-red-600 font-medium text-sm disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        if (!confirm(`Delete template "${name}"? This can't be undone.`)) return;
        setBusy(true);
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
