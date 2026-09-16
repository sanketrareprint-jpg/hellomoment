import { redirect } from 'next/navigation';
import { getCurrentBusiness } from '@/lib/session';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusiness();
  if (!business) redirect('/login');

  return (
    <DashboardShell
      businessName={business.name}
      businessEmail={business.email}
      walletBalancePaise={business.walletBalancePaise}
      trialCoins={business.trialCoins}
    >
      {children}
    </DashboardShell>
  );
}
