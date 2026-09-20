import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { saveImageUpload } from '@/lib/uploads';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  // Replacing/adding the mobile-only image comes in as multipart (it's a
  // file), separate from the plain-JSON field updates below.
  if ((req.headers.get('content-type') || '').includes('multipart/form-data')) {
    const formData = await req.formData().catch(() => null);
    const file = formData?.get('mobileFile');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }
    try {
      const saved = await saveImageUpload(file, 'banners');
      const banner = await prisma.dashboardBanner.update({
        where: { id: params.id },
        data: { mobileImageUrl: saved.url },
      });
      return NextResponse.json({ banner });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const data: { isActive?: boolean; order?: number; linkUrl?: string | null; mobileImageUrl?: string | null } = {};
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.order === 'number') data.order = body.order;
  if (typeof body.linkUrl === 'string' || body.linkUrl === null) data.linkUrl = body.linkUrl?.trim() || null;
  if (body.mobileImageUrl === null) data.mobileImageUrl = null;

  try {
    const banner = await prisma.dashboardBanner.update({ where: { id: params.id }, data });
    return NextResponse.json({ banner });
  } catch {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  try {
    await prisma.dashboardBanner.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }
}
