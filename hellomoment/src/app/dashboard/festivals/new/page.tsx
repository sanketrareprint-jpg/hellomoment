import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import FestivalForm from '@/components/FestivalForm';

export default async function NewFestivalPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const templates = await prisma.flyerTemplate.findMany({
    where: { businessId: business.id, occasion: 'FESTIVAL' },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add festival</h1>
      <FestivalForm templates={templates} />
    </div>
  );
}
