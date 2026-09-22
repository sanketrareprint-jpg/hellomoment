import { prisma } from '@/lib/db';
import BannerManager from '@/components/BannerManager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const allBanners = await prisma.dashboardBanner.findMany({ orderBy: { order: 'asc' } });
  const dashboardBanners = allBanners.filter((b) => b.placement === 'DASHBOARD');
  const landingBanners = allBanners.filter((b) => b.placement === 'LANDING');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-0.5">Banners</h1>
      <p className="text-gray-600 text-sm mb-3">
        Promotional slider banners — like a website hero slider. Added and managed here only; businesses can&apos;t
        upload their own. The dashboard slider and the landing page slider are independent, each with its own images.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-0.5">Dashboard banners</h2>
          <p className="text-gray-600 text-sm mb-3">Shown at the top of every business&apos;s dashboard overview.</p>
          <BannerManager banners={dashboardBanners} placement="DASHBOARD" />
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-0.5">Landing page banners</h2>
          <p className="text-gray-600 text-sm mb-3">Shown on the public landing page, before anyone logs in.</p>
          <BannerManager banners={landingBanners} placement="LANDING" />
        </section>
      </div>
    </div>
  );
}
