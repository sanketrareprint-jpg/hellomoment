import { prisma } from '@/lib/db';
import BannerManager from '@/components/BannerManager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const allBanners = await prisma.dashboardBanner.findMany({ orderBy: { order: 'asc' } });
  const pick = (placement: string, device: string) =>
    allBanners.filter((b) => b.placement === placement && b.device === device);

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
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Desktop</h3>
              <BannerManager banners={pick('DASHBOARD', 'DESKTOP')} placement="DASHBOARD" device="DESKTOP" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Mobile</h3>
              <BannerManager banners={pick('DASHBOARD', 'MOBILE')} placement="DASHBOARD" device="MOBILE" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-0.5">Landing page banners</h2>
          <p className="text-gray-600 text-sm mb-3">Shown on the public landing page, before anyone logs in.</p>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Desktop</h3>
              <BannerManager banners={pick('LANDING', 'DESKTOP')} placement="LANDING" device="DESKTOP" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Mobile</h3>
              <BannerManager banners={pick('LANDING', 'MOBILE')} placement="LANDING" device="MOBILE" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
