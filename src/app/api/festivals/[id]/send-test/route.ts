import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { sendWishForFestival } from '@/lib/sendWish';

const schema = z.object({ contactId: z.string().min(1) });

/**
 * Lets a business send one real festival wish right now, to just ONE
 * contact they pick — not the whole contact list — so they can verify a
 * festival's flyer/template/AiSensy setup works before it goes out to
 * everyone automatically on the real date.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const festival = await prisma.festival.findUnique({
    where: { id: params.id },
    include: { template: true },
  });
  if (!festival || festival.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Pick a contact to test with' }, { status: 400 });
  const { contactId } = parsed.data;

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact || contact.businessId !== business.id) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  const template =
    festival.template ??
    (await prisma.flyerTemplate.findFirst({
      where: { businessId: business.id, occasion: 'FESTIVAL', isDefault: true },
    }));
  if (!template) {
    return NextResponse.json(
      { error: 'No template for this festival — set one on the festival, or set a default festival template under Flyer templates.' },
      { status: 400 }
    );
  }

  await sendWishForFestival({ business, festival, template, contacts: [contact] });

  const lastLog = await prisma.sendLog.findFirst({
    where: { businessId: business.id, festivalId: festival.id, contactId: contact.id },
    orderBy: { sentAt: 'desc' },
  });

  return NextResponse.json({ ok: true, log: lastLog });
}
