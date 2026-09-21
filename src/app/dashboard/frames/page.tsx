import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import FramesGrid from '@/components/FramesGrid';
import FrameGalleryWorkspace, { type GalleryFrameRow } from '@/components/FrameGalleryWorkspace';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';

export const dynamic = 'force-dynamic';

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
    </svg>
  );
}

export default async function FramesPage({ searchParams }: { searchParams: { folder?: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [myFrames, galleryFrames] = await Promise.all([
    prisma.businessFrame.findMany({ where: { businessId: business.id }, orderBy: { createdAt: 'desc' } }),
    prisma.frame.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] }),
  ]);

  const folder = searchParams.folder === 'my' || searchParams.folder === 'gallery' ? searchParams.folder : null;

  const brand: BrandInfo = {
    logoUrl: business.logoUrl,
    name: business.name,
    phoneDisplay: business.phoneDisplay,
    emailDisplay: business.emailDisplay,
    addressText: business.addressText,
    websiteUrl: business.websiteUrl,
    productsText: business.productsText,
    firmNameScript: business.firmNameScript as 'ENGLISH' | 'MARATHI',
    firmNameMarathi: business.firmNameMarathi,
  };

  const galleryFrameRows: GalleryFrameRow[] = galleryFrames.map((f) => ({
    id: f.id,
    name: f.name,
    overlayUrl: f.overlayUrl,
    overlayHue: f.overlayHue,
    canvasWidth: f.canvasWidth,
    canvasHeight: f.canvasHeight,
    placeholders: {
      logoPlaceholder: f.logoPlaceholder ? JSON.parse(f.logoPlaceholder) : null,
      firmNamePlaceholder: f.firmNamePlaceholder ? JSON.parse(f.firmNamePlaceholder) : null,
      phonePlaceholder: f.phonePlaceholder ? JSON.parse(f.phonePlaceholder) : null,
      emailPlaceholder: f.emailPlaceholder ? JSON.parse(f.emailPlaceholder) : null,
      addressPlaceholder: f.addressPlaceholder ? JSON.parse(f.addressPlaceholder) : null,
      websitePlaceholder: f.websitePlaceholder ? JSON.parse(f.websitePlaceholder) : null,
      productsPlaceholder: f.productsPlaceholder ? JSON.parse(f.productsPlaceholder) : null,
    },
  }));

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Frames</h1>
        <p className="text-gray-600 mt-1">
          Position your logo, firm name, email, website and address once, pick a default, and it&rsquo;s applied to
          every flyer you send — no need to set branding placement on each individual template.
        </p>
      </div>

      {!folder ? (
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
          <Link
            href="/dashboard/frames?folder=my"
            className="group relative overflow-hidden rounded-2xl p-7 flex flex-col items-center text-center gap-3 bg-gradient-to-br from-brand-500 to-fuchsia-600 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
            <span className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
            <span className="relative w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <FolderIcon className="w-8 h-8" />
            </span>
            <span className="relative font-bold text-lg text-white">My frames</span>
            <span className="relative text-sm text-white/80">Frames you&rsquo;ve added or created</span>
            <span className="relative mt-1 text-xs font-semibold bg-white/20 text-white rounded-full px-3 py-1">
              {myFrames.length} frame{myFrames.length === 1 ? '' : 's'}
            </span>
          </Link>

          <Link
            href="/dashboard/frames?folder=gallery"
            className="group relative overflow-hidden rounded-2xl p-7 flex flex-col items-center text-center gap-3 bg-gradient-to-br from-amber-400 to-orange-600 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
            <span className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
            <span className="relative w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <FolderIcon className="w-8 h-8" />
            </span>
            <span className="relative font-bold text-lg text-white">Frame gallery</span>
            <span className="relative text-sm text-white/80">Ready-made designs from raregreet</span>
            <span className="relative mt-1 text-xs font-semibold bg-white/20 text-white rounded-full px-3 py-1">
              {galleryFrames.length} frame{galleryFrames.length === 1 ? '' : 's'}
            </span>
          </Link>
        </div>
      ) : (
        <div className="card p-5">
          <Link
            href="/dashboard/frames"
            className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-4 hover:gap-2 transition-all"
          >
            ← All folders
          </Link>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">{folder === 'my' ? 'My frames' : 'Frame gallery'}</h2>
            {folder === 'my' && (
              <Link href="/dashboard/frames/new" className="btn-primary">
                + New frame
              </Link>
            )}
          </div>

          {folder === 'my' ? (
            myFrames.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No frames of your own yet.{' '}
                <Link href="/dashboard/frames/new" className="text-brand-600 font-medium">
                  Create one
                </Link>{' '}
                or add a ready-made design from the{' '}
                <Link href="/dashboard/frames?folder=gallery" className="text-brand-600 font-medium">
                  Frame gallery
                </Link>
                .
              </p>
            ) : (
              <FramesGrid frames={myFrames} />
            )
          ) : (
            <FrameGalleryWorkspace frames={galleryFrameRows} business={brand} />
          )}
        </div>
      )}
    </div>
  );
}
