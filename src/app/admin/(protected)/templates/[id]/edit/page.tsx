import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import TemplatePlaceholderEditor, { TemplateFormValues } from '@/components/TemplatePlaceholderEditor';
import { defaultsFor } from '@/lib/flyerPlaceholders';

export default async function EditAdminTemplatePage({ params }: { params: { id: string } }) {
  const template = await prisma.starterTemplate.findUnique({ where: { id: params.id } });
  if (!template) notFound();

  // Scaled to *this* template's own canvas size — not a fixed 1080×1080
  // guess — so a field being switched on for the first time lands in a
  // sensible spot relative to the actual background image.
  const defaults = defaultsFor(template.canvasWidth, template.canvasHeight);

  const namePlaceholder = template.namePlaceholder ? JSON.parse(template.namePlaceholder) : null;
  const designationPlaceholder = template.designationPlaceholder ? JSON.parse(template.designationPlaceholder) : null;
  const datePlaceholder = template.datePlaceholder ? JSON.parse(template.datePlaceholder) : null;
  const rawPhotoPlaceholder = template.photoPlaceholder ? JSON.parse(template.photoPlaceholder) : null;
  // Older starter designs were saved with a single `size` (square only)
  // before width/height existed — fill both in from it so the editor
  // always has concrete width/height to work with.
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit starter template</h1>
      <TemplatePlaceholderEditor
        showBranding
        showPerBusinessOptions={false}
        apiBase="/api/admin/starter-templates"
        uploadUrl="/api/admin/uploads/template"
        redirectPath="/admin/templates"
        initial={{
          id: template.id,
          name: template.name,
          occasion: template.occasion as TemplateFormValues['occasion'],
          isDefault: false,
          aisensyCampaignName: '',
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
          // StarterTemplate has no per-template text overrides — these
          // designs get copied into each business's own FlyerTemplate,
          // where that feature actually applies.
          phoneTextOverride: '',
          emailTextOverride: '',
          addressTextOverride: '',
          websiteTextOverride: '',
          productsTextOverride: '',
        }}
      />
    </div>
  );
}
