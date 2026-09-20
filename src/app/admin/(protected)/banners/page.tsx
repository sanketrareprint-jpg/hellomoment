import Link from 'next/link';
import { prisma } from '@/lib/db';
import BannerManager from '@/components/BannerManager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const allBanners = await prisma.dashboardBanner.findMany({ orderBy: { order: 'asc' } });
  const dashboardBanners = allBanners.filter((b) => b.placement === 'DASHBOARD');
  const landingBanners = allBanners.filter((b) => b.placement === 'LANDING');

  return (
    <div>
      <Link href="/admin" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-2 hover:gap-2 transition-all">
        ← Back to businesses
      </Link>
      <h1 className="text-lg font-bold text-gray-900 mb-0.5">Banners</h1>
      <p className="text-gray-600 text-xs mb-3">
        Promotional slider banners — like a website hero slider. Added and managed here only; businesses can&apos;t
        upload their own. The dashboard slider and the landing page slider are independent, each with its own images.
      </p>

      <div className="space-y-5">
        <section>
          <h2 className="text-sm font-bold text-gray-900">Dashboard banners</h2>
          <p className="text-gray-500 text-xs mb-2">Shown at the top of every business&apos;s dashboard overview.</p>
          <BannerManager banners={dashboardBanners} placement="DASHBOARD" />
        </section>

        <section>
          <h2 className="text-sm font-bold text-gray-900">Landing page banners</h2>
          <p className="text-gray-500 text-xs mb-2">Shown on the public landing page, before anyone logs in.</p>
          <BannerManager banners={landingBanners} placement="LANDING" />
        </section>
      </div>
    </div>
  );
}
