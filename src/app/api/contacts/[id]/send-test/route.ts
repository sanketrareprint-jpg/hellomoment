import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { sendWishForContact } from '@/lib/sendWish';
import { getTodayInTimezone } from '@/lib/dateUtils';

const schema = z.object({ occasion: z.enum(['BIRTHDAY', 'ANNIVERSARY']) });

/**
 * Lets a business send one real wish right now, outside the daily
 * schedule, so they can verify their AiSensy setup and flyer template
 * actually work end-to-end before relying on the automatic trigger.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const contact = await prisma.contact.findUnique({ where: { id: params.id } });
  if (!contact || contact.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid occasion' }, { status: 400 });
  const { occasion } = parsed.data;

  if (occasion === 'BIRTHDAY' && !contact.dob) {
    return NextResponse.json({ error: 'This contact has no date of birth set' }, { status: 400 });
  }
  if (occasion === 'ANNIVERSARY' && !contact.anniversary) {
    return NextResponse.json({ error: 'This contact has no anniversary set' }, { status: 400 });
  }

  const template = await prisma.flyerTemplate.findFirst({
    where: { businessId: business.id, occasion, isDefault: true },
  });
  if (!template) {
    return NextResponse.json(
      { error: `No default ${occasion.toLowerCase()} template. Set one as default under Flyer templates.` },
      { status: 400 }
    );
  }

  const today = getTodayInTimezone(business.timezone);
  await sendWishForContact({ business, contact, template, occasion, todayYear: today.year });

  const lastLog = await prisma.sendLog.findFirst({
    where: { businessId: business.id, contactId: contact.id },
    orderBy: { sentAt: 'desc' },
  });

  return NextResponse.json({ ok: true, log: lastLog });
}
