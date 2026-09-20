import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { getFamilyBusinesses, rootIdOf } from '@/lib/businessFamily';
import { hashPassword, signSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth';
import { SIGNUP_TRIAL_COINS } from '@/lib/pricing';

// "Companies" under one login — see src/lib/businessFamily.ts for the model.
// GET lists every company in the current login's family (for the dashboard
// switcher); POST adds a new one and switches to it.

export async function GET(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const companies = await getFamilyBusinesses(business);
  return NextResponse.json({ companies, activeId: business.id });
}

const schema = z.object({
  name: z.string().min(2, 'Company name is required'),
  ownerWhatsapp: z.string().min(8, 'Enter a valid WhatsApp number'),
});

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { name, ownerWhatsapp } = parsed.data;

  const rootId = rootIdOf(business);
  const root = await prisma.business.findUnique({ where: { id: rootId } });
  if (!root) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Every Business row still needs a unique login email + a password hash
  // (existing NOT NULL/unique columns) even though nobody ever logs into a
  // member company directly — it's always reached via switch, below. A
  // random suffix off the root account's own email keeps it recognizably
  // grouped in the admin panel without any chance of colliding with a real
  // signup email.
  const [localPart, domain] = root.email.split('@');
  const synthEmail = `${localPart}+co-${crypto.randomBytes(4).toString('hex')}@${domain || 'raregreet.internal'}`;
  const randomPassword = crypto.randomBytes(24).toString('hex');
  const passwordHash = await hashPassword(randomPassword);

  const DEFAULT_AISENSY_CAMPAIGN = 'hellomomentwishes';

  const company = await prisma.business.create({
    data: {
      name,
      email: synthEmail,
      passwordHash,
      ownerWhatsapp,
      ownerBusinessId: rootId,
      aisensyBirthdayCampaign: DEFAULT_AISENSY_CAMPAIGN,
      aisensyAnniversaryCampaign: DEFAULT_AISENSY_CAMPAIGN,
      aisensyFestivalCampaign: DEFAULT_AISENSY_CAMPAIGN,
      trialCoins: SIGNUP_TRIAL_COINS,
    },
  });

  await prisma.trialCoinTransaction.create({
    data: {
      businessId: company.id,
      type: 'GRANT',
      coins: SIGNUP_TRIAL_COINS,
      description: 'Welcome trial coins',
    },
  });

  const token = signSession({ businessId: company.id });
  const res = NextResponse.json({ ok: true, businessId: company.id });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
