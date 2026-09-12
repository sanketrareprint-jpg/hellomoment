import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentBusiness } from '@/lib/session';
import LogoutButton from '@/components/LogoutButton';
import DashboardNav from '@/components/DashboardNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusiness();
  if (!business) redirect('/login');

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-white/80 backdrop-blur border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="raregreet.com" width={30} height={30} className="rounded-lg shadow-sm" />
            <div className="text-lg font-bold text-brand-700">
              raregreet<span className="text-gray-400">.com</span>
            </div>
          </div>
        </div>
        <DashboardNav />
        <div className="px-3 py-4 border-t border-gray-100 space-y-2">
          <Link
            href="/dashboard/wallet"
            className="block rounded-xl px-3 py-3 bg-gradient-to-br from-brand-50 to-fuchsia-50 border border-brand-100 hover:shadow-sm transition-shadow"
          >
            <div className="text-xs text-gray-500">Wallet balance</div>
            <div className="text-sm font-bold text-brand-700">
              ₹{(business.walletBalancePaise / 100).toFixed(2)}
            </div>
            {business.trialCoins > 0 && (
              <div className="text-xs font-semibold text-amber-700 mt-0.5">{business.trialCoins} trial coins</div>
            )}
          </Link>
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
