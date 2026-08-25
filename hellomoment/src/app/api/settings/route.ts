import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

const schema = z.object({
  name: z.string().min(1),
  ownerWhatsapp: z.string().min(8),
  timezone: z.string().min(1),
  aisensyApiKey: z.string().optional().nullable(),
  aisensyBirthdayCampaign: z.string().optional().nullable(),
  aisensyAnniversaryCampaign: z.string().optional().nullable(),
  aisensyFestivalCampaign: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      ...parsed.data,
      aisensyApiKey: parsed.data.aisensyApiKey || null,
      aisensyBirthdayCampaign: parsed.data.aisensyBirthdayCampaign || null,
      aisensyAnniversaryCampaign: parsed.data.aisensyAnniversaryCampaign || null,
      aisensyFestivalCampaign: parsed.data.aisensyFestivalCampaign || null,
    },
  });
  return NextResponse.json({
    business: { ...updated, passwordHash: undefined },
  });
}
