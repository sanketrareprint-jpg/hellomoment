import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/auth';
import AdminShell from '@/components/AdminShell';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !verifyAdminSessionToken(token)) {
    redirect('/admin/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
