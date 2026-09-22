import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { saveImageUpload } from '@/lib/uploads';

// Banners are managed only from the admin panel (Vrushali's own dashboard) —
// a business never uploads or edits these themselves, unlike their own
// flyer templates. `placement` splits this into two independent slots:
// "DASHBOARD" (top of every business's dashboard overview) and "LANDING"
// (public landing page), each with its own image set and ordering. `device`
// further splits each placement into "DESKTOP" and "MOBILE" image sets.

function parseDevice(value: unknown): 'DESKTOP' | 'MOBILE' | null {
  return value === 'DESKTOP' || value === 'MOBILE' ? value : null;
}

function parsePlacement(value: unknown): 'DASHBOARD' | 'LANDING' | null {
  return value === 'DASHBOARD' || value === 'LANDING' ? value : null;
}

export async function GET(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const placement = parsePlacement(req.nextUrl.searchParams.get('placement'));
  const device = parseDevice(req.nextUrl.searchParams.get('device'));
  const banners = await prisma.dashboardBanner.findMany({
    where: { ...(placement ? { placement } : {}), ...(device ? { device } : {}) },
    orderBy: { order: 'asc' },
  });
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
  const placement = parsePlacement(formData?.get('placement')) ?? 'DASHBOARD';
  const device = parseDevice(formData?.get('device')) ?? 'DESKTOP';

  try {
    const saved = await saveImageUpload(file, 'banners');
    const maxOrder = await prisma.dashboardBanner.aggregate({ where: { placement, device }, _max: { order: true } });
    const banner = await prisma.dashboardBanner.create({
      data: {
        imageUrl: saved.url,
        linkUrl,
        placement,
        device,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    return NextResponse.json({ banner });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
  }
}
