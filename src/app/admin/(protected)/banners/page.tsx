import { prisma } from '@/lib/db';
import BannerManager from '@/components/BannerManager';
import { getAllBannerSlideSeconds } from '@/lib/bannerTiming';

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { placement: 'LANDING', title: 'Landing page banners' },
  { placement: 'DASHBOARD', title: 'Dashboard banners' },
] as const;

const DEVICES = [
  { device: 'DESKTOP', label: 'Desktop' },
  { device: 'MOBILE', label: 'Mobile' },
] as const;

export default async function AdminBannersPage() {
  const [allBanners, slideSeconds] = await Promise.all([
    prisma.dashboardBanner.findMany({ orderBy: { order: 'asc' } }),
    getAllBannerSlideSeconds(),
  ]);

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ placement, title }) => (
        <section key={placement} className="card overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 px-5 py-3 border-b border-gray-200">{title}</h2>
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {DEVICES.map(({ device, label }) => (
              <div key={device} className="p-5">
                <h3 className="font-semibold text-gray-800 mb-3">{label}</h3>
                <BannerManager
                  banners={allBanners.filter((b) => b.placement === placement && b.device === device)}
                  placement={placement}
                  device={device}
                  slideSeconds={slideSeconds[`${placement}.${device}`]}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
