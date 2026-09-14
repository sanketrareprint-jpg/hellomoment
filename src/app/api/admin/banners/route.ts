import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { saveImageUpload } from '@/lib/uploads';

// Dashboard banners are managed only from the admin panel (Vrushali's own
// dashboard) — a business never uploads or edits these themselves, unlike
// their own flyer templates. This is the site-wide "slider banner" shown at
// the top of every business's dashboard overview.

export async function GET(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const banners = await prisma.dashboardBanner.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
  }
  const linkUrlRaw = formData?.get('linkUrl');
  const linkUrl = typeof linkUrlRaw === 'string' && linkUrlRaw.trim() ? linkUrlRaw.trim() : null;

  try {
    const saved = await saveImageUpload(file, 'banners');
    const maxOrder = await prisma.dashboardBanner.aggregate({ _max: { order: true } });
    const banner = await prisma.dashboardBanner.create({
      data: {
        imageUrl: saved.url,
        linkUrl,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    return NextResponse.json({ banner });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
  }
}
