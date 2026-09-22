import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { seedStarterTemplatesForBusiness } from '@/lib/seedStarterTemplates';
import AddStarterTemplatesButton from '@/components/AddStarterTemplatesButton';
import TemplatesGrid, { type TemplateRow } from '@/components/TemplatesGrid';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';
import type { FlyerTemplate } from '@prisma/client';

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

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: { folder?: string };
}) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  // Keeps the "Starter templates" folder live: picks up anything admin
  // added, updated or removed from the shared library since this business
  // last looked, with no "Add / refresh" click needed. Cheap when nothing
  // changed (see seedStarterTemplatesForBusiness) — safe to run on every
  // page load. Swallowed on failure so a transient file-copy issue never
  // takes down the whole Templates page.
  try {
    await seedStarterTemplatesForBusiness(business.id);
  } catch (err) {
    console.error('Failed to auto-sync starter templates', err);
  }

  const templates = await prisma.flyerTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });

  // So the grid below can overlay this business's own Brand kit onto each
  // template's own mapped branding placeholders (see FlyerPreviewThumbnail)
  // instead of showing just the flat background artwork.
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

  function toTemplateRow(t: FlyerTemplate): TemplateRow {
    return {
      id: t.id,
      name: t.name,
      occasion: t.occasion,
      backgroundUrl: t.backgroundUrl,
      canvasWidth: t.canvasWidth,
      canvasHeight: t.canvasHeight,
      isDefault: t.isDefault,
      logoPlaceholder: t.logoPlaceholder ? JSON.parse(t.logoPlaceholder) : null,
      firmNamePlaceholder: t.firmNamePlaceholder ? JSON.parse(t.firmNamePlaceholder) : null,
      phonePlaceholder: t.phonePlaceholder ? JSON.parse(t.phonePlaceholder) : null,
      emailPlaceholder: t.emailPlaceholder ? JSON.parse(t.emailPlaceholder) : null,
      addressPlaceholder: t.addressPlaceholder ? JSON.parse(t.addressPlaceholder) : null,
      websitePlaceholder: t.websitePlaceholder ? JSON.parse(t.websitePlaceholder) : null,
      productsPlaceholder: t.productsPlaceholder ? JSON.parse(t.productsPlaceholder) : null,
      phoneTextOverride: t.phoneTextOverride,
      emailTextOverride: t.emailTextOverride,
      addressTextOverride: t.addressTextOverride,
      websiteTextOverride: t.websiteTextOverride,
      productsTextOverride: t.productsTextOverride,
    };
  }

  const starterTemplates = templates.filter((t) => t.source === 'STARTER').map(toTemplateRow);
  const myTemplates = templates.filter((t) => t.source !== 'STARTER').map(toTemplateRow);

  const folder = searchParams.folder === 'my' || searchParams.folder === 'starter' ? searchParams.folder : null;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flyer templates</h1>
        <p className="text-gray-600 mt-1">Upload a background once; name, date and photo are filled in automatically.</p>
      </div>

      {!folder ? (
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
          <Link
            href="/dashboard/templates?folder=my"
            className="group relative overflow-hidden rounded-2xl p-7 flex flex-col items-center text-center gap-3 bg-gradient-to-br from-brand-500 to-fuchsia-600 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
            <span className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
            <span className="relative w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <FolderIcon className="w-8 h-8" />
            </span>
            <span className="relative font-bold text-lg text-white">My templates</span>
            <span className="relative text-sm text-white/80">Designs you've uploaded</span>
            <span className="relative mt-1 text-xs font-semibold bg-white/20 text-white rounded-full px-3 py-1">
              {myTemplates.length} template{myTemplates.length === 1 ? '' : 's'}
            </span>
          </Link>

          <Link
            href="/dashboard/templates?folder=starter"
            className="group relative overflow-hidden rounded-2xl p-7 flex flex-col items-center text-center gap-3 bg-gradient-to-br from-amber-400 to-orange-600 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
            <span className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
            <span className="relative w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <FolderIcon className="w-8 h-8" />
            </span>
            <span className="relative font-bold text-lg text-white">Starter templates</span>
            <span className="relative text-sm text-white/80">Ready-made designs</span>
            <span className="relative mt-1 text-xs font-semibold bg-white/20 text-white rounded-full px-3 py-1">
              {starterTemplates.length} template{starterTemplates.length === 1 ? '' : 's'}
            </span>
          </Link>
        </div>
      ) : (
        <div className="card p-5">
          <Link
            href="/dashboard/templates"
            className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-4 hover:gap-2 transition-all"
          >
            ← All folders
          </Link>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">{folder === 'my' ? 'My templates' : 'Starter templates'}</h2>
            {folder === 'my' ? (
              <Link href="/dashboard/templates/new" className="btn-primary">
                + New template
              </Link>
            ) : (
              <AddStarterTemplatesButton />
            )}
          </div>

          {folder === 'my' ? (
            myTemplates.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No templates of your own yet.{' '}
                <Link href="/dashboard/templates/new" className="text-brand-600 font-medium">
                  Create one
                </Link>{' '}
                by uploading your own flyer background.
              </p>
            ) : (
              <TemplatesGrid templates={myTemplates} business={brand} />
            )
          ) : starterTemplates.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Click <strong>+ Add / refresh starter flyer designs</strong> above for ready-made birthday and
              anniversary flyers — no designing or uploading needed.
            </p>
          ) : (
            <TemplatesGrid templates={starterTemplates} business={brand} />
          )}
        </div>
      )}
    </div>
  );
}
