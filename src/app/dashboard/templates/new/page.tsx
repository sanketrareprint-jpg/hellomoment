import { getCurrentBusiness } from '@/lib/session';
import TemplatePlaceholderEditor, { BrandInfo } from '@/components/TemplatePlaceholderEditor';

export default async function NewTemplatePage() {
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New flyer template</h1>
      {/* Templates created here are always "My templates" (source: CUSTOM) —
          the business's own uploaded artwork already has its branding drawn
          in, so the branding overlay options are for Starter templates only. */}
      <TemplatePlaceholderEditor business={brand} showBranding={false} />
    </div>
  );
}
