import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

const OCCASIONS = new Set(['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL', 'ALL']);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const data: {
    name?: string;
    occasion?: string;
    campaignName?: string;
    bodyText?: string;
    isActive?: boolean;
    order?: number;
  } = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.occasion === 'string' && OCCASIONS.has(body.occasion)) data.occasion = body.occasion;
  if (typeof body.campaignName === 'string' && body.campaignName.trim()) data.campaignName = body.campaignName.trim();
  if (typeof body.bodyText === 'string' && body.bodyText.trim()) data.bodyText = body.bodyText.trim();
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.order === 'number') data.order = body.order;

  try {
    const template = await prisma.messageTemplate.update({ where: { id: params.id }, data });
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  try {
    await prisma.messageTemplate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
}
