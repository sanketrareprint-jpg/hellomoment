import Link from 'next/link';
import { prisma } from '@/lib/db';
import BannerManager from '@/components/BannerManager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const banners = await prisma.dashboardBanner.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <Link href="/admin" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-3 hover:gap-2 transition-all">
        ← Back to businesses
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-0.5">Dashboard banners</h1>
      <p className="text-gray-600 text-sm mb-3">
        Promotional slider banners shown at the top of every business&apos;s dashboard overview — like a website hero
        slider. Added and managed here only; businesses can&apos;t upload their own.
      </p>
      <BannerManager banners={banners} />
    </div>
  );
}
