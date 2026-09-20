'use client';

import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import DashboardNav from '@/components/DashboardNav';
import CompanySwitcher from '@/components/CompanySwitcher';

// Shown in the header on every dashboard tab — same WhatsApp number used
// site-wide (see src/app/dashboard/contact-us/page.tsx) — so help with
// setting up a template, or anything else, is always one tap away.
const HELP_WHATSAPP_NUMBER = '919270299601'; // +91 92702 99601
const HELP_WHATSAPP_MESSAGE = "Hi! I need help with raregreet.com.";

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
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://wa.me/${HELP_WHATSAPP_NUMBER}?text=${encodeURIComponent(HELP_WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Need help? Chat with us on WhatsApp"
            className="p-2 rounded-full text-[#25D366] hover:bg-green-50"
          >
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M16.001 3C9.373 3 4 8.373 4 15.001c0 2.386.63 4.62 1.732 6.556L4 29l7.653-1.706A11.94 11.94 0 0016.001 27C22.629 27 28 21.629 28 15.001 28 8.373 22.629 3 16.001 3zm0 21.8a9.74 9.74 0 01-4.97-1.36l-.357-.211-4.541 1.012 1.032-4.428-.234-.372A9.75 9.75 0 1125.75 15c0 5.38-4.372 9.8-9.749 9.8zm5.36-7.34c-.294-.147-1.74-.858-2.01-.956-.27-.098-.467-.147-.663.147-.196.294-.76.956-.932 1.152-.171.196-.343.22-.637.073-.294-.147-1.242-.458-2.366-1.462-.874-.78-1.464-1.744-1.635-2.038-.171-.294-.018-.453.129-.6.132-.132.294-.343.441-.514.147-.171.196-.294.294-.49.098-.196.049-.368-.024-.515-.073-.147-.663-1.6-.909-2.19-.24-.575-.483-.497-.663-.506l-.564-.01c-.196 0-.515.073-.784.368-.27.294-1.03 1.006-1.03 2.456 0 1.45 1.055 2.85 1.202 3.046.147.196 2.077 3.17 5.032 4.445.703.303 1.251.484 1.678.62.705.224 1.347.192 1.855.117.566-.084 1.74-.712 1.985-1.4.245-.688.245-1.278.172-1.4-.073-.122-.27-.196-.564-.343z" />
            </svg>
          </a>
          <Link
            href="/dashboard/wallet"
            className="rounded-full px-3 py-1 bg-gradient-to-br from-brand-50 to-fuchsia-50 border border-brand-100 text-xs font-bold text-brand-700 whitespace-nowrap"
          >
            ₹{(walletBalancePaise / 100).toFixed(2)}
          </Link>
        </div>
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
        <div className="hidden lg:flex items-center justify-between px-8 py-3 border-b border-gray-100">
          <a
            href={`https://wa.me/${HELP_WHATSAPP_NUMBER}?text=${encodeURIComponent(HELP_WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#25D366] transition-colors"
          >
            <svg viewBox="0 0 32 32" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
              <path d="M16.001 3C9.373 3 4 8.373 4 15.001c0 2.386.63 4.62 1.732 6.556L4 29l7.653-1.706A11.94 11.94 0 0016.001 27C22.629 27 28 21.629 28 15.001 28 8.373 22.629 3 16.001 3zm0 21.8a9.74 9.74 0 01-4.97-1.36l-.357-.211-4.541 1.012 1.032-4.428-.234-.372A9.75 9.75 0 1125.75 15c0 5.38-4.372 9.8-9.749 9.8zm5.36-7.34c-.294-.147-1.74-.858-2.01-.956-.27-.098-.467-.147-.663.147-.196.294-.76.956-.932 1.152-.171.196-.343.22-.637.073-.294-.147-1.242-.458-2.366-1.462-.874-.78-1.464-1.744-1.635-2.038-.171-.294-.018-.453.129-.6.132-.132.294-.343.441-.514.147-.171.196-.294.294-.49.098-.196.049-.368-.024-.515-.073-.147-.663-1.6-.909-2.19-.24-.575-.483-.497-.663-.506l-.564-.01c-.196 0-.515.073-.784.368-.27.294-1.03 1.006-1.03 2.456 0 1.45 1.055 2.85 1.202 3.046.147.196 2.077 3.17 5.032 4.445.703.303 1.251.484 1.678.62.705.224 1.347.192 1.855.117.566-.084 1.74-.712 1.985-1.4.245-.688.245-1.278.172-1.4-.073-.122-.27-.196-.564-.343z" />
            </svg>
            Need help? WhatsApp <span className="font-semibold text-gray-700">+91 92702 99601</span>
          </a>
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
