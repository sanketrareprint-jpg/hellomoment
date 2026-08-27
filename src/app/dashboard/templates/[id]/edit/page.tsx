import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import TemplatePlaceholderEditor, { EMPTY_TEMPLATE, TemplateFormValues, BrandInfo } from '@/components/TemplatePlaceholderEditor';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const template = await prisma.flyerTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.businessId !== business.id) notFound();

  const namePlaceholder = JSON.parse(template.namePlaceholder);
  const datePlaceholder = template.datePlaceholder ? JSON.parse(template.datePlaceholder) : null;
  const photoPlaceholder = template.photoPlaceholder ? JSON.parse(template.photoPlaceholder) : null;
  const logoPlaceholder = template.logoPlaceholder ? JSON.parse(template.logoPlaceholder) : null;
  const firmNamePlaceholder = template.firmNamePlaceholder ? JSON.parse(template.firmNamePlaceholder) : null;
  const phonePlaceholder = template.phonePlaceholder ? JSON.parse(template.phonePlaceholder) : null;
  const addressPlaceholder = template.addressPlaceholder ? JSON.parse(template.addressPlaceholder) : null;
  const productsPlaceholder = template.productsPlaceholder ? JSON.parse(template.productsPlaceholder) : null;

  const brand: BrandInfo = {
    logoUrl: business.logoUrl,
    name: business.name,
    phoneDisplay: business.phoneDisplay,
    addressText: business.addressText,
    productsText: business.productsText,
    firmNameScript: business.firmNameScript as 'ENGLISH' | 'MARATHI',
    firmNameMarathi: business.firmNameMarathi,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit flyer template</h1>
      <TemplatePlaceholderEditor
        business={brand}
        initial={{
          id: template.id,
          name: template.name,
          occasion: template.occasion as TemplateFormValues['occasion'],
          isDefault: template.isDefault,
          aisensyCampaignName: template.aisensyCampaignName ?? '',
          backgroundUrl: template.backgroundUrl,
          canvasWidth: template.canvasWidth,
          canvasHeight: template.canvasHeight,
          namePlaceholder: { ...EMPTY_TEMPLATE.namePlaceholder, ...namePlaceholder },
          useDate: Boolean(datePlaceholder),
          datePlaceholder: { ...EMPTY_TEMPLATE.datePlaceholder, ...(datePlaceholder ?? {}) },
          usePhoto: Boolean(photoPlaceholder),
          photoPlaceholder: { ...EMPTY_TEMPLATE.photoPlaceholder, ...(photoPlaceholder ?? {}) },
          // Logo is compulsory — force true even for older templates saved
          // before this was enforced (their logoPlaceholder may be null).
          useLogo: true,
          logoPlaceholder: { ...EMPTY_TEMPLATE.logoPlaceholder, ...(logoPlaceholder ?? {}) },
          useFirmName: Boolean(firmNamePlaceholder),
          firmNamePlaceholder: { ...EMPTY_TEMPLATE.firmNamePlaceholder, ...(firmNamePlaceholder ?? {}) },
          usePhone: Boolean(phonePlaceholder),
          phonePlaceholder: { ...EMPTY_TEMPLATE.phonePlaceholder, ...(phonePlaceholder ?? {}) },
          useAddress: Boolean(addressPlaceholder),
          addressPlaceholder: { ...EMPTY_TEMPLATE.addressPlaceholder, ...(addressPlaceholder ?? {}) },
          useProducts: Boolean(productsPlaceholder),
          productsPlaceholder: { ...EMPTY_TEMPLATE.productsPlaceholder, ...(productsPlaceholder ?? {}) },
        }}
      />
    </div>
  );
}
