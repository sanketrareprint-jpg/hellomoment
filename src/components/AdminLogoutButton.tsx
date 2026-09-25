'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogoutButton({ className = 'btn-secondary' }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
