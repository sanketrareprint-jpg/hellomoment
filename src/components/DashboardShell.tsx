'use client';

import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import DashboardNav from '@/components/DashboardNav';
import CompanySwitcher from '@/components/CompanySwitcher';

interface Company {
  id: string;
  name: string;
  isRoot: boolean;
}

interface DashboardShellProps {
  businessName: string;
  businessEmail: string;
  walletBalancePaise: number;
  trialCoins: number;
  companies: Company[];
  activeBusinessId: string;
  children: React.ReactNode;
}

export default function DashboardShell({
  businessName,
  businessEmail,
  walletBalancePaise,
  trialCoins,
  companies,
  activeBusinessId,
  children,
}: DashboardShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile top bar: shown below the lg breakpoint, replaces the always-on sidebar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/logo.png" alt="raregreet.com" width={26} height={26} className="rounded-lg shadow-sm shrink-0" />
          <div className="text-base font-bold text-brand-700 truncate">
            raregreet<span className="text-gray-400">.com</span>
          </div>
        </div>
        <Link
          href="/dashboard/wallet"
          className="shrink-0 rounded-full px-3 py-1 bg-gradient-to-br from-brand-50 to-fuchsia-50 border border-brand-100 text-xs font-bold text-brand-700 whitespace-nowrap"
        >
          ₹{(walletBalancePaise / 100).toFixed(2)}
        </Link>
      </div>

      {/* Backdrop, mobile only, closes the drawer on tap-outside */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: a slide-in drawer on mobile, a static column at lg and up */}
      <aside
        className={
          'fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out ' +
          (open ? 'translate-x-0' : '-translate-x-full') +
          ' lg:translate-x-0 lg:static lg:z-auto'
        }
      >
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="raregreet.com" width={30} height={30} className="rounded-lg shadow-sm" />
            <div className="text-lg font-bold text-brand-700">
              raregreet<span className="text-gray-400">.com</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-3 pt-4 pb-1">
          <CompanySwitcher
            businessName={businessName}
            businessEmail={businessEmail}
            companies={companies}
            activeId={activeBusinessId}
            onNavigate={() => setOpen(false)}
          />
        </div>
        <DashboardNav onNavigate={() => setOpen(false)} />
        <div className="px-3 py-4 border-t border-gray-100 space-y-2">
          <Link
            href="/dashboard/wallet"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-3 bg-gradient-to-br from-brand-50 to-fuchsia-50 border border-brand-100 hover:shadow-sm transition-shadow"
          >
            <div className="text-xs text-gray-500">Wallet balance</div>
            <div className="text-sm font-bold text-brand-700">₹{(walletBalancePaise / 100).toFixed(2)}</div>
            {trialCoins > 0 && (
              <div className="text-xs font-semibold text-amber-700 mt-0.5">{trialCoins} trial coins</div>
            )}
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop top bar: just the wallet balance, top-right — the sidebar has no top bar of its own at lg and up. */}
        <div className="hidden lg:flex justify-end px-8 py-3 border-b border-gray-100">
          <Link
            href="/dashboard/wallet"
            className="flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-gradient-to-br from-brand-50 to-fuchsia-50 border border-brand-100 hover:shadow-sm transition-shadow"
          >
            <span className="text-xs text-gray-500">Wallet</span>
            <span className="text-sm font-bold text-brand-700">₹{(walletBalancePaise / 100).toFixed(2)}</span>
            {trialCoins > 0 && (
              <span className="text-xs font-semibold text-amber-700">+{trialCoins} coins</span>
            )}
          </Link>
        </div>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
