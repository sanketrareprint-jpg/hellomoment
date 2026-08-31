import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/auth';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !verifyAdminSessionToken(token)) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="hellomoment.in" width={30} height={30} className="rounded-lg" />
            <div className="text-lg font-bold text-brand-700">
              hellomoment<span className="text-gray-400">.in</span>
            </div>
            <span className="ml-2 text-xs font-medium uppercase tracking-wide text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
              Admin
            </span>
          </div>
          <AdminLogoutButton />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
