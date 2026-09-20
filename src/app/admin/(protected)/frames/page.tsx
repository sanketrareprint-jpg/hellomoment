import Link from 'next/link';
import { prisma } from '@/lib/db';
import AdminFramesGrid from '@/components/AdminFramesGrid';

export const dynamic = 'force-dynamic';

export default async function AdminFramesPage() {
  const frames = await prisma.frame.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });

  return (
    <div>
      <Link href="/admin" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-3 hover:gap-2 transition-all">
        ← Back to businesses
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-0.5">
        <h1 className="text-xl font-bold text-gray-900">Branding frames</h1>
        <Link href="/admin/frames/new" className="btn-primary">
          + New frame
        </Link>
      </div>
      <p className="text-gray-600 text-sm mb-3">
        Reusable logo/firm-name/email/website/address placements (with an optional decorative overlay graphic) offered
        to every business on their own Frames page. Once a business picks one as their default, it&rsquo;s applied to
        every flyer they send — birthday, anniversary or festival — instead of setting branding placement per
        template.
      </p>

      <AdminFramesGrid frames={frames} />
    </div>
  );
}
