import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import TemplatePlaceholderEditor, { TemplateFormValues, BrandInfo } from '@/components/TemplatePlaceholderEditor';
import { defaultsFor } from '@/lib/flyerPlaceholders';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const template = await prisma.flyerTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.businessId !== business.id) notFound();

  const rawFrames = await prisma.businessFrame.findMany({
    where: { businessId: business.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      overlayUrl: true,
      overlayHue: true,
      isDefault: true,
      canvasWidth: true,
      canvasHeight: true,
      logoPlaceholder: true,
      firmNamePlaceholder: true,
      phonePlaceholder: true,
      emailPlaceholder: true,
      addressPlaceholder: true,
      websitePlaceholder: true,
      productsPlaceholder: true,
      customTextPlaceholders: true,
    },
  });
  // Parsed here (JSON strings in the DB) so the client editor can lay the
  // frame's own logo/text out on its preview exactly like sendWish.ts does
  // when a default Frame overrides a template's own branding placeholders.
  const businessFrames = rawFrames.map((f) => ({
    id: f.id,
    name: f.name,
    overlayUrl: f.overlayUrl,
    overlayHue: f.overlayHue,
    isDefault: f.isDefault,
    canvasWidth: f.canvasWidth,
    canvasHeight: f.canvasHeight,
    logoPlaceholder: f.logoPlaceholder ? JSON.parse(f.logoPlaceholder) : null,
    firmNamePlaceholder: f.firmNamePlaceholder ? JSON.parse(f.firmNamePlaceholder) : null,
    phonePlaceholder: f.phonePlaceholder ? JSON.parse(f.phonePlaceholder) : null,
    emailPlaceholder: f.emailPlaceholder ? JSON.parse(f.emailPlaceholder) : null,
    addressPlaceholder: f.addressPlaceholder ? JSON.parse(f.addressPlaceholder) : null,
    websitePlaceholder: f.websitePlaceholder ? JSON.parse(f.websitePlaceholder) : null,
    productsPlaceholder: f.productsPlaceholder ? JSON.parse(f.productsPlaceholder) : null,
    customTextPlaceholders: f.customTextPlaceholders ? JSON.parse(f.customTextPlaceholders) : null,
  }));

  // Scaled to *this* template's own canvas size — not a fixed 1080×1080
  // guess — so a field a business is switching on for the first time (e.g.
  // Designation, never dragged before) lands in a sensible spot relative to
  // the actual background image instead of wherever a mismatched canvas
  // size would put it.
  const defaults = defaultsFor(template.canvasWidth, template.canvasHeight);

  const namePlaceholder = template.namePlaceholder ? JSON.parse(template.namePlaceholder) : null;
  const designationPlaceholder = template.designationPlaceholder ? JSON.parse(template.designationPlaceholder) : null;
  const datePlaceholder = template.datePlaceholder ? JSON.parse(template.datePlaceholder) : null;
  const rawPhotoPlaceholder = template.photoPlaceholder ? JSON.parse(template.photoPlaceholder) : null;
  // Older templates were saved with a single `size` (square only) before
  // width/height existed — fill both in from it so the editor always has
  // concrete width/height to work with.
  const photoPlaceholder = rawPhotoPlaceholder
    ? {
        ...rawPhotoPlaceholder,
        width: rawPhotoPlaceholder.width ?? rawPhotoPlaceholder.size,
        height: rawPhotoPlaceholder.height ?? rawPhotoPlaceholder.size,
      }
    : null;
  const logoPlaceholder = template.logoPlaceholder ? JSON.parse(template.logoPlaceholder) : null;
  const firmNamePlaceholder = template.firmNamePlaceholder ? JSON.parse(template.firmNamePlaceholder) : null;
  const phonePlaceholder = template.phonePlaceholder ? JSON.parse(template.phonePlaceholder) : null;
  const emailPlaceholder = template.emailPlaceholder ? JSON.parse(template.emailPlaceholder) : null;
  const addressPlaceholder = template.addressPlaceholder ? JSON.parse(template.addressPlaceholder) : null;
  const websitePlaceholder = template.websitePlaceholder ? JSON.parse(template.websitePlaceholder) : null;
  const productsPlaceholder = template.productsPlaceholder ? JSON.parse(template.productsPlaceholder) : null;

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit flyer template</h1>
      <TemplatePlaceholderEditor
        business={brand}
        frames={businessFrames}
        showBranding={template.source === 'STARTER'}
        initial={{
          id: template.id,
          name: template.name,
          occasion: template.occasion as TemplateFormValues['occasion'],
          isDefault: template.isDefault,
          aisensyCampaignName: template.aisensyCampaignName ?? '',
          backgroundUrl: template.backgroundUrl,
          canvasWidth: template.canvasWidth,
          canvasHeight: template.canvasHeight,
          useName: Boolean(namePlaceholder),
          namePlaceholder: { ...defaults.namePlaceholder, ...(namePlaceholder ?? {}) },
          useDesignation: Boolean(designationPlaceholder),
          designationPlaceholder: { ...defaults.designationPlaceholder, ...(designationPlaceholder ?? {}) },
          useDate: Boolean(datePlaceholder),
          datePlaceholder: { ...defaults.datePlaceholder, ...(datePlaceholder ?? {}) },
          usePhoto: Boolean(photoPlaceholder),
          photoPlaceholder: { ...defaults.photoPlaceholder, ...(photoPlaceholder ?? {}) },
          useLogo: Boolean(logoPlaceholder),
          logoPlaceholder: { ...defaults.logoPlaceholder, ...(logoPlaceholder ?? {}) },
          useFirmName: Boolean(firmNamePlaceholder),
          firmNamePlaceholder: { ...defaults.firmNamePlaceholder, ...(firmNamePlaceholder ?? {}) },
          usePhone: Boolean(phonePlaceholder),
          phonePlaceholder: { ...defaults.phonePlaceholder, ...(phonePlaceholder ?? {}) },
          useEmail: Boolean(emailPlaceholder),
          emailPlaceholder: { ...defaults.emailPlaceholder, ...(emailPlaceholder ?? {}) },
          useAddress: Boolean(addressPlaceholder),
          addressPlaceholder: { ...defaults.addressPlaceholder, ...(addressPlaceholder ?? {}) },
          useWebsite: Boolean(websitePlaceholder),
          websitePlaceholder: { ...defaults.websitePlaceholder, ...(websitePlaceholder ?? {}) },
          useProducts: Boolean(productsPlaceholder),
          productsPlaceholder: { ...defaults.productsPlaceholder, ...(productsPlaceholder ?? {}) },
          phoneTextOverride: template.phoneTextOverride ?? '',
          emailTextOverride: template.emailTextOverride ?? '',
          addressTextOverride: template.addressTextOverride ?? '',
          websiteTextOverride: template.websiteTextOverride ?? '',
          productsTextOverride: template.productsTextOverride ?? '',
        }}
      />
    </div>
  );
}
