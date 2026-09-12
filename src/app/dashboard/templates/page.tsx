import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import AddStarterTemplatesButton from '@/components/AddStarterTemplatesButton';
import TemplatesGrid from '@/components/TemplatesGrid';

export const dynamic = 'force-dynamic';

const FOLDER_ICON = (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
    />
  </svg>
);

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: { folder?: string };
}) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const templates = await prisma.flyerTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });

  const starterTemplates = templates.filter((t) => t.source === 'STARTER');
  const myTemplates = templates.filter((t) => t.source !== 'STARTER');

  const folder = searchParams.folder === 'my' || searchParams.folder === 'starter' ? searchParams.folder : null;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flyer templates</h1>
        <p className="text-gray-600 mt-1">Upload a background once; name, date and photo are filled in automatically.</p>
      </div>

      {!folder ? (
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
          <Link
            href="/dashboard/templates?folder=my"
            className="card p-6 flex flex-col items-center text-center gap-3 hover:border-brand-400 hover:shadow-md transition"
          >
            <span className="text-brand-600">{FOLDER_ICON}</span>
            <span className="font-semibold text-gray-900">My templates</span>
            <span className="text-sm text-gray-500">
              {myTemplates.length} template{myTemplates.length === 1 ? '' : 's'}
            </span>
          </Link>

          <Link
            href="/dashboard/templates?folder=starter"
            className="card p-6 flex flex-col items-center text-center gap-3 hover:border-brand-400 hover:shadow-md transition"
          >
            <span className="text-brand-600">{FOLDER_ICON}</span>
            <span className="font-semibold text-gray-900">Starter templates</span>
            <span className="text-sm text-gray-500">
              {starterTemplates.length} template{starterTemplates.length === 1 ? '' : 's'}
            </span>
          </Link>
        </div>
      ) : (
        <div className="card p-5">
          <Link href="/dashboard/templates" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-4">
            ← All folders
          </Link>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">{folder === 'my' ? 'My templates' : 'Starter templates'}</h2>
            {folder === 'my' ? (
              <Link href="/dashboard/templates/new" className="btn-primary">
                + New template
              </Link>
            ) : (
              <AddStarterTemplatesButton />
            )}
          </div>

          {folder === 'my' ? (
            myTemplates.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No templates of your own yet.{' '}
                <Link href="/dashboard/templates/new" className="text-brand-600 font-medium">
                  Create one
                </Link>{' '}
                by uploading your own flyer background.
              </p>
            ) : (
              <TemplatesGrid templates={myTemplates} />
            )
          ) : starterTemplates.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Click <strong>+ Add / refresh starter flyer designs</strong> above for ready-made birthday, anniversary,
              and festival flyers — no designing or uploading needed.
            </p>
          ) : (
            <TemplatesGrid templates={starterTemplates} />
          )}
        </div>
      )}
    </div>
  );
}
