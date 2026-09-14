import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const data: { isActive?: boolean; order?: number; linkUrl?: string | null } = {};
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.order === 'number') data.order = body.order;
  if (typeof body.linkUrl === 'string' || body.linkUrl === null) data.linkUrl = body.linkUrl?.trim() || null;

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
