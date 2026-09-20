import { getCurrentBusiness } from '@/lib/session';
import SettingsForm from '@/components/SettingsForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default async function SettingsPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-3">Settings</h1>
      <SettingsForm
        initial={{
          name: business.name,
          email: business.email,
          ownerWhatsapp: business.ownerWhatsapp,
          timezone: business.timezone,
          websiteUrl: business.websiteUrl ?? '',
          aisensyApiKey: business.aisensyApiKey ?? '',
          aisensyBirthdayCampaign: business.aisensyBirthdayCampaign ?? '',
          aisensyAnniversaryCampaign: business.aisensyAnniversaryCampaign ?? '',
          aisensyFestivalCampaign: business.aisensyFestivalCampaign ?? '',
          logoUrl: business.logoUrl ?? '',
          phoneDisplay: business.phoneDisplay ?? '',
          emailDisplay: business.emailDisplay ?? '',
          addressText: business.addressText ?? '',
          productsText: business.productsText ?? '',
          firmNameScript: (business.firmNameScript as 'ENGLISH' | 'MARATHI') ?? 'ENGLISH',
          firmNameMarathi: business.firmNameMarathi ?? '',
        }}
      />
      <div className="max-w-xl mt-3">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
