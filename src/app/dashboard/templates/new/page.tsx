import { getCurrentBusiness } from '@/lib/session';
import TemplatePlaceholderEditor, { BrandInfo } from '@/components/TemplatePlaceholderEditor';

export default async function NewTemplatePage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New flyer template</h1>
      <TemplatePlaceholderEditor business={brand} />
    </div>
  );
}
