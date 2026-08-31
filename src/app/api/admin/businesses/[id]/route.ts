import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

// Deleting a Business cascades (see prisma/schema.prisma onDelete: Cascade)
// to all of its contacts, flyer templates, festivals, and send logs — this
// permanently removes the business and everything it ever sent.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const existing = await prisma.business.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.business.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
