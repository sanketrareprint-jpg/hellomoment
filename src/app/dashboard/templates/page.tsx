import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import AddStarterTemplatesButton from '@/components/AddStarterTemplatesButton';
import TemplatesGrid from '@/components/TemplatesGrid';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const templates = await prisma.flyerTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flyer templates</h1>
          <p className="text-gray-600 mt-1">Upload a background once; name, date and photo are filled in automatically.</p>
        </div>
        <div className="flex gap-3">
          <AddStarterTemplatesButton />
          <Link href="/dashboard/templates/new" className="btn-primary">
            + New template
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          No templates yet. Click <strong>+ Add starter flyer designs</strong> above for ready-made birthday,
          anniversary, and festival flyers, or{' '}
          <Link href="/dashboard/templates/new" className="text-brand-600 font-medium">
            create your own
          </Link>
          .
        </div>
      ) : (
        <TemplatesGrid templates={templates} />
      )}
    </div>
  );
}
