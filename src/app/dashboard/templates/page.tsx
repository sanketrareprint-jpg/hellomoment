import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import DeleteTemplateButton from '@/components/DeleteTemplateButton';
import AddStarterTemplatesButton from '@/components/AddStarterTemplatesButton';

export const dynamic = 'force-dynamic';

const OCCASION_LABEL: Record<string, string> = {
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  FESTIVAL: 'Festival',
};

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t) => (
            <div key={t.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.backgroundUrl} alt={t.name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  {t.isDefault && (
                    <span className="text-xs font-medium bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{OCCASION_LABEL[t.occasion]}</p>
                <div className="flex gap-3 mt-3">
                  <Link href={`/dashboard/templates/${t.id}/edit`} className="text-brand-600 font-medium text-sm">
                    Edit
                  </Link>
                  <DeleteTemplateButton id={t.id} name={t.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
