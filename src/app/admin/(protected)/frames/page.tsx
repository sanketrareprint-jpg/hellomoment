import Link from 'next/link';
import { prisma } from '@/lib/db';
import AdminFramesGrid from '@/components/AdminFramesGrid';
import FixFrameOverlayPaddingButton from '@/components/FixFrameOverlayPaddingButton';

export const dynamic = 'force-dynamic';

export default async function AdminFramesPage() {
  const frames = await prisma.frame.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-0.5">
        <h1 className="text-xl font-bold text-gray-900">Branding frames</h1>
        <div className="flex gap-2">
          <FixFrameOverlayPaddingButton />
          <Link href="/admin/frames/new" className="btn-primary">
            + New frame
          </Link>
        </div>
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
