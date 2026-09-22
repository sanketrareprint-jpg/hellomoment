import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { seedStarterTemplatesForBusiness } from '@/lib/seedStarterTemplates';
import AddStarterTemplatesButton from '@/components/AddStarterTemplatesButton';
import TemplatesGrid, { type TemplateRow } from '@/components/TemplatesGrid';
import DashboardTemplatesByCategory, { type DashboardTemplateRow } from '@/components/DashboardTemplatesByCategory';
import type { BrandInfo, FrameOption } from '@/components/TemplatePlaceholderEditor';
import type { FlyerTemplate } from '@prisma/client';

export const dynamic = 'force-dynamic';

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

  const [templates, rawDefaultFrame] = await Promise.all([
    prisma.flyerTemplate.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.businessFrame.findFirst({ where: { businessId: business.id, isDefault: true } }),
  ]);

  // Same rows + default Frame the dashboard builds (src/app/dashboard/page.tsx),
  // so the scrolling rows below show each flyer with the selected frame on it.
  const parse = (json: string | null) => (json ? JSON.parse(json) : null);
  const scrollTemplates: DashboardTemplateRow[] = templates.map((t) => {
    const rawPhoto = parse(t.photoPlaceholder);
    return {
      id: t.id,
      name: t.name,
      occasion: t.occasion,
      source: t.source,
      backgroundUrl: t.backgroundUrl,
      canvasWidth: t.canvasWidth,
      canvasHeight: t.canvasHeight,
      namePlaceholder: parse(t.namePlaceholder),
      designationPlaceholder: parse(t.designationPlaceholder),
      datePlaceholder: parse(t.datePlaceholder),
      // Older templates saved a single square `size` before width/height existed.
      photoPlaceholder: rawPhoto
        ? { ...rawPhoto, width: rawPhoto.width ?? rawPhoto.size, height: rawPhoto.height ?? rawPhoto.size }
        : null,
      logoPlaceholder: parse(t.logoPlaceholder),
      firmNamePlaceholder: parse(t.firmNamePlaceholder),
      phonePlaceholder: parse(t.phonePlaceholder),
      emailPlaceholder: parse(t.emailPlaceholder),
      addressPlaceholder: parse(t.addressPlaceholder),
      websitePlaceholder: parse(t.websitePlaceholder),
      productsPlaceholder: parse(t.productsPlaceholder),
      phoneTextOverride: t.phoneTextOverride,
      emailTextOverride: t.emailTextOverride,
      addressTextOverride: t.addressTextOverride,
      websiteTextOverride: t.websiteTextOverride,
      productsTextOverride: t.productsTextOverride,
    };
  });

  const defaultFrame: FrameOption | null = rawDefaultFrame
    ? {
        id: rawDefaultFrame.id,
        name: rawDefaultFrame.name,
        overlayUrl: rawDefaultFrame.overlayUrl,
        overlayHue: rawDefaultFrame.overlayHue,
        isDefault: rawDefaultFrame.isDefault,
        canvasWidth: rawDefaultFrame.canvasWidth,
        canvasHeight: rawDefaultFrame.canvasHeight,
        logoPlaceholder: parse(rawDefaultFrame.logoPlaceholder),
        firmNamePlaceholder: parse(rawDefaultFrame.firmNamePlaceholder),
        phonePlaceholder: parse(rawDefaultFrame.phonePlaceholder),
        emailPlaceholder: parse(rawDefaultFrame.emailPlaceholder),
        addressPlaceholder: parse(rawDefaultFrame.addressPlaceholder),
        websitePlaceholder: parse(rawDefaultFrame.websitePlaceholder),
        productsPlaceholder: parse(rawDefaultFrame.productsPlaceholder),
        customTextPlaceholders: parse(rawDefaultFrame.customTextPlaceholders),
      }
    : null;

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
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Flyer templates</h1>
        <p className="text-gray-600 mt-1 text-sm">Upload a background once; name, date and photo are filled in automatically.</p>
      </div>

      {!folder ? (
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <Link href="/dashboard/templates/new" className="btn-primary">
              + New template
            </Link>
            <Link href="/dashboard/templates?folder=my" className="text-sm text-brand-600 font-medium">
              Manage my templates ({myTemplates.length})
            </Link>
            <Link href="/dashboard/templates?folder=starter" className="text-sm text-brand-600 font-medium">
              Manage starter templates ({starterTemplates.length})
            </Link>
          </div>
          {scrollTemplates.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No templates yet.{' '}
              <Link href="/dashboard/templates/new" className="text-brand-600 font-medium">
                Create one
              </Link>{' '}
              by uploading your own flyer background.
            </p>
          ) : (
            <DashboardTemplatesByCategory
              templates={scrollTemplates}
              defaultFrame={defaultFrame}
              business={brand}
              showViewAll={false}
            />
          )}
        </div>
      ) : (
        <div className="card p-4">
          <Link
            href="/dashboard/templates"
            className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-3 hover:gap-2 transition-all"
          >
            ← All templates
          </Link>

          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
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
