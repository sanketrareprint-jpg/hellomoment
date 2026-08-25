import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

const festivalSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  recurring: z.boolean().default(true),
  active: z.boolean().default(true),
  templateId: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const festivals = await prisma.festival.findMany({
    where: { businessId: business.id },
    orderBy: { date: 'asc' },
    include: { template: true },
  });
  return NextResponse.json({ festivals });
}

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = festivalSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { date, templateId, ...rest } = parsed.data;
  const festival = await prisma.festival.create({
    data: {
      ...rest,
      date: new Date(`${date}T00:00:00.000Z`),
      templateId: templateId || null,
      businessId: business.id,
    },
  });
  return NextResponse.json({ festival }, { status: 201 });
}
