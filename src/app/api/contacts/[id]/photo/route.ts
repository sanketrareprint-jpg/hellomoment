import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

// Narrow, single-purpose endpoint used by the bulk "Add photos" screen
// (/dashboard/contacts/photos): assigns an already-uploaded photo URL to
// one contact without having to resend the whole contact record the way
// the full PUT /api/contacts/[id] endpoint requires.
const schema = z
  .object({
    photoUrl: z.string().min(1).optional(),
    anniversaryPhotoUrl: z.string().min(1).optional(),
  })
  .refine((v) => v.photoUrl || v.anniversaryPhotoUrl, 'Nothing to update');

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const existing = await prisma.contact.findUnique({ where: { id: params.id } });
  if (!existing || existing.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const contact = await prisma.contact.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ contact });
}
