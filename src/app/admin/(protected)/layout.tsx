import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/auth';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !verifyAdminSessionToken(token)) {
    redirect('/admin/login');
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto px-6 py-5">{children}</main>
    </div>
  );
}
