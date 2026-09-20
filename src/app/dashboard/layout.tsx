import { redirect } from 'next/navigation';
import { getCurrentBusiness } from '@/lib/session';
import { getFamilyBusinesses, rootIdOf } from '@/lib/businessFamily';
import { prisma } from '@/lib/db';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusiness();
  if (!business) redirect('/login');

  const companies = await getFamilyBusinesses(business);

  // The email shown under the company switcher is the *login* — always the
  // root account's real email, never a member company's synthesized one
  // (see src/lib/businessFamily.ts).
  const loginEmail = business.ownerBusinessId
    ? (await prisma.business.findUnique({ where: { id: rootIdOf(business) }, select: { email: true } }))?.email ?? business.email
    : business.email;

  return (
    <DashboardShell
      businessName={business.name}
      businessEmail={loginEmail}
      walletBalancePaise={business.walletBalancePaise}
      trialCoins={business.trialCoins}
      companies={companies}
      activeBusinessId={business.id}
    >
      {children}
    </DashboardShell>
  );
}
