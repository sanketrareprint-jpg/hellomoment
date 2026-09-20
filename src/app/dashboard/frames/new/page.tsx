import { getCurrentBusiness } from '@/lib/session';
import FramePlaceholderEditor from '@/components/FramePlaceholderEditor';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';

export default async function NewFramePage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New frame</h1>
      <FramePlaceholderEditor business={brand} redirectPath="/dashboard/frames?folder=my" />
    </div>
  );
}
