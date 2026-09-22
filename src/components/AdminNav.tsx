'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: { href: string; label: string; icon: string }[] = [
  { href: '/admin', label: 'Businesses', icon: 'M3 12l2-2m0 0l7-7 7 7m-9-2v10a1 1 0 001 1h3m6-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/templates', label: 'Flyer templates', icon: 'M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm4 3h.01M6 17l4-4a2 2 0 012.8 0l1.2 1.2M14 13l1-1a2 2 0 012.8 0L20 14' },
  { href: '/admin/frames', label: 'Frames', icon: 'M3 3h18v18H3V3zm4 0v18m10-18v18M3 8h4m10 0h4M3 16h4m10 0h4' },
  { href: '/admin/banners', label: 'Banners', icon: 'M3 4h18v4H3V4zm0 6h18v10H3V10zm4 3h4v4H7v-4z' },
];

export default function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV.map((item) => {
        const isActive = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={
              isActive
                ? 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm bg-gradient-to-r from-brand-600 to-fuchsia-600'
                : 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors'
            }
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
