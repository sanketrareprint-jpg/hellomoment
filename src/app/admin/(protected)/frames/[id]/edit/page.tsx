import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import FramePlaceholderEditor, { type FrameFormValues } from '@/components/FramePlaceholderEditor';
import { frameDefaultsFor } from '@/lib/framePlaceholders';

export default async function EditAdminFramePage({ params }: { params: { id: string } }) {
  const frame = await prisma.frame.findUnique({ where: { id: params.id } });
  if (!frame) notFound();

  const defaults = frameDefaultsFor(frame.canvasWidth, frame.canvasHeight);

  const logoPlaceholder = frame.logoPlaceholder ? JSON.parse(frame.logoPlaceholder) : null;
  const firmNamePlaceholder = frame.firmNamePlaceholder ? JSON.parse(frame.firmNamePlaceholder) : null;
  const phonePlaceholder = frame.phonePlaceholder ? JSON.parse(frame.phonePlaceholder) : null;
  const emailPlaceholder = frame.emailPlaceholder ? JSON.parse(frame.emailPlaceholder) : null;
  const addressPlaceholder = frame.addressPlaceholder ? JSON.parse(frame.addressPlaceholder) : null;
  const websitePlaceholder = frame.websitePlaceholder ? JSON.parse(frame.websitePlaceholder) : null;
  const productsPlaceholder = frame.productsPlaceholder ? JSON.parse(frame.productsPlaceholder) : null;

  const initial: FrameFormValues = {
    id: frame.id,
    name: frame.name,
    isDefault: false,
    overlayUrl: frame.overlayUrl ?? '',
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
      <FramePlaceholderEditor
        showPerBusinessOptions={false}
        apiBase="/api/admin/frames"
        uploadUrl="/api/admin/uploads/frame"
        redirectPath="/admin/frames"
        initial={initial}
      />
    </div>
  );
}
