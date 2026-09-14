import Link from 'next/link';
import { prisma } from '@/lib/db';
import BannerManager from '@/components/BannerManager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const banners = await prisma.dashboardBanner.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <Link href="/admin" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-4 hover:gap-2 transition-all">
        ← Back to businesses
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard banners</h1>
      <p className="text-gray-600 mb-6">
        Promotional slider banners shown at the top of every business&apos;s dashboard overview — like a website hero
        slider. Added and managed here only; businesses can&apos;t upload their own.
      </p>
      <BannerManager banners={banners} />
    </div>
  );
}
