import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentBusiness } from '@/lib/session';
import LogoutButton from '@/components/LogoutButton';

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/contacts', label: 'Contacts' },
  { href: '/dashboard/templates', label: 'Flyer templates' },
  { href: '/dashboard/festivals', label: 'Festivals' },
  { href: '/dashboard/logs', label: 'Send logs' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusiness();
  if (!business) redirect('/login');

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="text-lg font-bold text-brand-700">
            hellomoment<span className="text-gray-400">.in</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-2">
          <div className="px-1">
            <div className="text-xs font-medium text-gray-700 truncate">{business.name}</div>
            <div className="text-xs text-gray-500 truncate">{business.email}</div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 sm:p-8">{children}</main>
    </div>
  );
}
