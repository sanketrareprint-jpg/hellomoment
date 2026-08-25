import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, signSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth';

const schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  ownerWhatsapp: z.string().min(8, 'Enter a valid WhatsApp number'),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { businessName, email, password, ownerWhatsapp } = parsed.data;

  const existing = await prisma.business.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  // New businesses start with a sensible default AiSensy campaign name
  // pre-filled for all three occasions, editable anytime in Settings —
  // most businesses use one shared "generic wish" campaign rather than
  // creating three separate AiSensy campaigns.
  const DEFAULT_AISENSY_CAMPAIGN = 'hellomomentwishes';

  const passwordHash = await hashPassword(password);
  const business = await prisma.business.create({
    data: {
      name: businessName,
      email: email.toLowerCase(),
      passwordHash,
      ownerWhatsapp,
      aisensyBirthdayCampaign: DEFAULT_AISENSY_CAMPAIGN,
      aisensyAnniversaryCampaign: DEFAULT_AISENSY_CAMPAIGN,
      aisensyFestivalCampaign: DEFAULT_AISENSY_CAMPAIGN,
    },
  });

  const token = signSession({ businessId: business.id });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
