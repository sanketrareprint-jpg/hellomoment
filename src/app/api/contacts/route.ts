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
  name: z.string().min(1, 'Name is required'),
  relationship: z.enum(['CUSTOMER', 'FRIEND', 'FAMILY', 'OTHER']).default('CUSTOMER'),
  whatsapp: z.string().min(8, 'Enter a valid WhatsApp number'),
  dob: dateOnly,
  anniversary: dateOnly,
  photoUrl: z.string().optional().nullable(),
  anniversaryPhotoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = 25;

  const where = {
    businessId: business.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { whatsapp: { contains: q } },
          ],
        }
      : {}),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ contacts, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { ...parsed.data, businessId: business.id },
  });
  return NextResponse.json({ contact }, { status: 201 });
}
