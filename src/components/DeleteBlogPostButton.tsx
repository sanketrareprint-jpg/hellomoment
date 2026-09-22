'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteBlogPostButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="text-red-600 font-medium text-sm disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        const ok = confirm(`Delete "${title}"? This removes it from the blog immediately. This can't be undone.`);
        if (!ok) return;
        setBusy(true);
        await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
