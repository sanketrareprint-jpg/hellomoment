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

  const starterTemplates = templates.filter((t) => t.source === 'STARTER');
  const myTemplates = templates.filter((t) => t.source !== 'STARTER');

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flyer templates</h1>
        <p className="text-gray-600 mt-1">Upload a background once; name, date and photo are filled in automatically.</p>
      </div>

      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-gray-900">Starter templates</h2>
          <AddStarterTemplatesButton />
        </div>
        {starterTemplates.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Click <strong>+ Add / refresh starter flyer designs</strong> above for ready-made birthday, anniversary,
            and festival flyers — no designing or uploading needed.
          </p>
        ) : (
          <TemplatesGrid templates={starterTemplates} />
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-gray-900">My templates</h2>
          <Link href="/dashboard/templates/new" className="btn-primary">
            + New template
          </Link>
        </div>
        {myTemplates.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No templates of your own yet.{' '}
            <Link href="/dashboard/templates/new" className="text-brand-600 font-medium">
              Create one
            </Link>{' '}
            by uploading your own flyer background.
          </p>
        ) : (
          <TemplatesGrid templates={myTemplates} />
        )}
      </div>
    </div>
  );
}
