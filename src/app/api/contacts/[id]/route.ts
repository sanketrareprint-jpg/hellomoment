import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

const dateOnly = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use YYYY-MM-DD format')
  .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : null));

const contactSchema = z.object({
  name: z.string().min(1),
  relationship: z.enum(['CUSTOMER', 'FRIEND', 'FAMILY', 'OTHER']),
  whatsapp: z.string().min(8),
  dob: dateOnly,
  anniversary: dateOnly,
  photoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function loadOwnedContact(businessId: string, id: string) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact || contact.businessId !== businessId) return null;
  return contact;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const contact = await loadOwnedContact(business.id, params.id);
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ contact });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const existing = await loadOwnedContact(business.id, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const contact = await prisma.contact.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ contact });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const existing = await loadOwnedContact(business.id, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.contact.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
