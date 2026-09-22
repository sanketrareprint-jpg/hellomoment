'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminLogoutButton from '@/components/AdminLogoutButton';

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Businesses',
    match: (path: string) => path === '/admin' || path.startsWith('/admin/businesses'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="10" width="7" height="11" />
        <rect x="14" y="4" width="7" height="17" />
        <path d="M6 14h1M6 17h1M17 8h1M17 11h1M17 14h1" />
      </svg>
    ),
  },
  {
    href: '/admin/templates',
    label: 'Flyer templates',
    match: (path: string) => path.startsWith('/admin/templates'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    href: '/admin/frames',
    label: 'Frames',
    match: (path: string) => path.startsWith('/admin/frames'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-5-5-9 9" />
      </svg>
    ),
  },
  {
    href: '/admin/banners',
    label: 'Banners',
    match: (path: string) => path.startsWith('/admin/banners'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname() ?? '/admin';

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col bg-gradient-to-b from-brand-700 to-brand-900 text-white">
      <div className="flex items-center gap-2 px-4 py-4">
        <img src="/logo.png" alt="raregreet.com" width={28} height={28} className="rounded-lg" />
        <div className="leading-tight">
          <div className="text-sm font-bold">
            raregreet<span className="text-brand-200">.com</span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-brand-200">Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ' +
                (active ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-100 hover:bg-white/10 hover:text-white')
              }
            >
              <span className={'w-4 h-4 shrink-0 ' + (active ? 'text-brand-600' : 'text-brand-200')}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2.5 py-3 border-t border-white/10">
        <AdminLogoutButton className="w-full justify-center bg-white/10 text-white border border-white/20 hover:bg-white/20 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5" />
      </div>
    </aside>
  );
}
