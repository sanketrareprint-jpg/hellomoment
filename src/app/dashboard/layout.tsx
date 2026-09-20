import { redirect } from 'next/navigation';
import { getCurrentBusiness } from '@/lib/session';
import { getFamilyBusinesses, getWalletOwner } from '@/lib/businessFamily';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusiness();
  if (!business) redirect('/login');

  const companies = await getFamilyBusinesses(business);

  // The ₹ wallet and trial coins are shared across the whole family (see
  // src/lib/businessFamily.ts) — this also gives us the root account's real
  // login email to show under the company switcher, instead of a member
  // company's synthesized one.
  const walletOwner = await getWalletOwner(business);

  return (
    <DashboardShell
      businessName={business.name}
      businessEmail={walletOwner.email}
      walletBalancePaise={walletOwner.walletBalancePaise}
      trialCoins={walletOwner.trialCoins}
      companies={companies}
      activeBusinessId={business.id}
    >
      {children}
    </DashboardShell>
  );
}
