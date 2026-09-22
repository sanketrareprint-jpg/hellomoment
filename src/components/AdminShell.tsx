'use client';

import { useState } from 'react';
import AdminNav from '@/components/AdminNav';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:h-screen lg:flex lg:overflow-hidden">
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
        <AdminLogoutButton />
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
          ' lg:translate-x-0 lg:static lg:z-auto lg:h-screen lg:overflow-y-auto'
        }
      >
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="raregreet.com" width={30} height={30} className="rounded-lg shadow-sm" />
            <div className="text-lg font-bold text-brand-700 leading-tight">
              raregreet<span className="text-gray-400">.com</span>
              <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Admin</div>
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
        <AdminNav onNavigate={() => setOpen(false)} />
        <div className="hidden lg:block px-3 py-4 border-t border-gray-100">
          <AdminLogoutButton />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col lg:h-screen">
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
