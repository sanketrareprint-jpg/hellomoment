import { getCurrentBusiness } from '@/lib/session';
import SettingsForm from '@/components/SettingsForm';

export default async function SettingsPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <SettingsForm
        initial={{
          name: business.name,
          ownerWhatsapp: business.ownerWhatsapp,
          timezone: business.timezone,
          aisensyApiKey: business.aisensyApiKey ?? '',
          aisensyBirthdayCampaign: business.aisensyBirthdayCampaign ?? '',
          aisensyAnniversaryCampaign: business.aisensyAnniversaryCampaign ?? '',
          aisensyFestivalCampaign: business.aisensyFestivalCampaign ?? '',
          logoUrl: business.logoUrl ?? '',
          phoneDisplay: business.phoneDisplay ?? '',
          addressText: business.addressText ?? '',
          productsText: business.productsText ?? '',
          firmNameScript: (business.firmNameScript as 'ENGLISH' | 'MARATHI') ?? 'ENGLISH',
          firmNameMarathi: business.firmNameMarathi ?? '',
        }}
      />
    </div>
  );
}
