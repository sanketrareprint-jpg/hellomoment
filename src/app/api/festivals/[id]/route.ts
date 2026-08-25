import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

const festivalSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  recurring: z.boolean(),
  active: z.boolean(),
  templateId: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
});

async function loadOwnedFestival(businessId: string, id: string) {
  const festival = await prisma.festival.findUnique({ where: { id } });
  if (!festival || festival.businessId !== businessId) return null;
  return festival;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;
  const festival = await loadOwnedFestival(business.id, params.id);
  if (!festival) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ festival });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;
  const existing = await loadOwnedFestival(business.id, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = festivalSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { date, templateId, ...rest } = parsed.data;

  const festival = await prisma.festival.update({
    where: { id: params.id },
    data: { ...rest, date: new Date(`${date}T00:00:00.000Z`), templateId: templateId || null },
  });
  return NextResponse.json({ festival });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;
  const existing = await loadOwnedFestival(business.id, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.festival.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
