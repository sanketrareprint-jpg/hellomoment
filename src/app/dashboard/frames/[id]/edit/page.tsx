import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import FramePlaceholderEditor, { type FrameFormValues } from '@/components/FramePlaceholderEditor';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';
import { frameDefaultsFor } from '@/lib/framePlaceholders';

export default async function EditFramePage({ params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const frame = await prisma.businessFrame.findUnique({ where: { id: params.id } });
  if (!frame || frame.businessId !== business.id) notFound();

  const defaults = frameDefaultsFor(frame.canvasWidth, frame.canvasHeight);

  const logoPlaceholder = frame.logoPlaceholder ? JSON.parse(frame.logoPlaceholder) : null;
  const firmNamePlaceholder = frame.firmNamePlaceholder ? JSON.parse(frame.firmNamePlaceholder) : null;
  const phonePlaceholder = frame.phonePlaceholder ? JSON.parse(frame.phonePlaceholder) : null;
  const emailPlaceholder = frame.emailPlaceholder ? JSON.parse(frame.emailPlaceholder) : null;
  const addressPlaceholder = frame.addressPlaceholder ? JSON.parse(frame.addressPlaceholder) : null;
  const websitePlaceholder = frame.websitePlaceholder ? JSON.parse(frame.websitePlaceholder) : null;
  const productsPlaceholder = frame.productsPlaceholder ? JSON.parse(frame.productsPlaceholder) : null;

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

  const initial: FrameFormValues = {
    id: frame.id,
    name: frame.name,
    isDefault: frame.isDefault,
    overlayUrl: frame.overlayUrl ?? '',
    overlayHue: frame.overlayHue,
    canvasWidth: frame.canvasWidth,
    canvasHeight: frame.canvasHeight,
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
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit frame</h1>
      <FramePlaceholderEditor business={brand} initial={initial} redirectPath="/dashboard/frames?folder=my" />
    </div>
  );
}
