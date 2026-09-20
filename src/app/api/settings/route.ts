import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email('Enter a valid email'),
  ownerWhatsapp: z.string().min(8),
  timezone: z.string().min(1),
  websiteUrl: z.string().optional().nullable(),
  aisensyApiKey: z.string().optional().nullable(),
  aisensyBirthdayCampaign: z.string().optional().nullable(),
  aisensyAnniversaryCampaign: z.string().optional().nullable(),
  aisensyFestivalCampaign: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  phoneDisplay: z.string().optional().nullable(),
  emailDisplay: z.string().optional().nullable(),
  addressText: z.string().optional().nullable(),
  productsText: z.string().optional().nullable(),
  firmNameScript: z.enum(['ENGLISH', 'MARATHI']).optional(),
  firmNameMarathi: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  if (email !== business.email) {
    const existing = await prisma.business.findUnique({ where: { email } });
    if (existing && existing.id !== business.id) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
  }

  // Businesses paste their website in all sorts of forms ("https://…",
  // "http://www…", "www…", or a bare domain) — stripping any protocol
  // before storing means what ends up on the flyer never starts with
  // "https://"/"http://", whatever form they typed it in.
  const websiteUrl = parsed.data.websiteUrl?.trim().replace(/^https?:\/\//i, '') || null;

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      ...parsed.data,
      email,
      websiteUrl,
      aisensyApiKey: parsed.data.aisensyApiKey || null,
      aisensyBirthdayCampaign: parsed.data.aisensyBirthdayCampaign || null,
      aisensyAnniversaryCampaign: parsed.data.aisensyAnniversaryCampaign || null,
      aisensyFestivalCampaign: parsed.data.aisensyFestivalCampaign || null,
      logoUrl: parsed.data.logoUrl || null,
      phoneDisplay: parsed.data.phoneDisplay || null,
      emailDisplay: parsed.data.emailDisplay || null,
      addressText: parsed.data.addressText || null,
      productsText: parsed.data.productsText || null,
      firmNameMarathi: parsed.data.firmNameMarathi || null,
    },
  });
  return NextResponse.json({
    business: { ...updated, passwordHash: undefined },
  });
}
