import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import FestivalForm from '@/components/FestivalForm';

export default async function EditFestivalPage({ params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [festival, templates] = await Promise.all([
    prisma.festival.findUnique({ where: { id: params.id } }),
    prisma.flyerTemplate.findMany({ where: { businessId: business.id, occasion: 'FESTIVAL' }, select: { id: true, name: true } }),
  ]);
  if (!festival || festival.businessId !== business.id) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit festival</h1>
      <FestivalForm
        templates={templates}
        initial={{
          id: festival.id,
          name: festival.name,
          date: festival.date.toISOString().slice(0, 10),
          recurring: festival.recurring,
          active: festival.active,
          templateId: festival.templateId ?? '',
          caption: festival.caption ?? '',
        }}
      />
    </div>
  );
}
