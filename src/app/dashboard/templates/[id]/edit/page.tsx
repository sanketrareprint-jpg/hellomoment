import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import TemplatePlaceholderEditor, { EMPTY_TEMPLATE, TemplateFormValues } from '@/components/TemplatePlaceholderEditor';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const template = await prisma.flyerTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.businessId !== business.id) notFound();

  const namePlaceholder = JSON.parse(template.namePlaceholder);
  const datePlaceholder = template.datePlaceholder ? JSON.parse(template.datePlaceholder) : null;
  const photoPlaceholder = template.photoPlaceholder ? JSON.parse(template.photoPlaceholder) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit flyer template</h1>
      <TemplatePlaceholderEditor
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
        }}
      />
    </div>
  );
}
