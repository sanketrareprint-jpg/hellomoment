import Link from 'next/link';
import { prisma } from '@/lib/db';
import AdminStarterTemplatesGrid from '@/components/AdminStarterTemplatesGrid';
import ImportBundledStarterTemplatesButton from '@/components/ImportBundledStarterTemplatesButton';

export const dynamic = 'force-dynamic';

export default async function AdminTemplatesPage() {
  const templates = await prisma.starterTemplate.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-0.5">
        <h1 className="text-xl font-bold text-gray-900">Flyer templates</h1>
        <div className="flex gap-2">
          <ImportBundledStarterTemplatesButton />
          <Link href="/admin/templates/new" className="btn-primary">
            + New template
          </Link>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-3">
        Ready-made flyer designs offered to every business via &ldquo;Add / refresh starter flyer designs&rdquo; on
        their own Templates page. Upload a background, then drag the name/date/photo/branding markers into place —
        same editor a business uses for their own templates.
      </p>

      <AdminStarterTemplatesGrid templates={templates} />
    </div>
  );
}
