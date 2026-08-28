import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

/**
 * Public, unauthenticated endpoint behind the shareable "Add your details"
 * link (see /join/[businessId]). A business sends this link straight to
 * their customers so those customers can add themselves as a contact
 * without the business having to prepare a CSV/XLSX file. Deliberately
 * narrow: it can only ever CREATE (or update-by-whatsapp-number) a contact
 * under the businessId in the URL — it can't read, edit, or delete
 * anything else, so there's nothing sensitive for a stranger with the link
 * to reach beyond adding their own name/number/dates.
 */

const dateOnly = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use YYYY-MM-DD format')
  .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : null));

const publicContactSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(200),
  whatsapp: z.string().min(8, 'Enter a valid WhatsApp number').max(20),
  dob: dateOnly,
  anniversary: dateOnly,
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = publicContactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { businessId, name, whatsapp, dob, anniversary } = parsed.data;

  if (!dob && !anniversary) {
    return NextResponse.json({ error: 'Add at least a birthday or an anniversary date' }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    return NextResponse.json({ error: 'This link is not valid — please check with the business that sent it to you.' }, { status: 404 });
  }

  // If this WhatsApp number already submitted before for this same
  // business, update their existing entry instead of creating a duplicate
  // — someone re-using the link to fix a typo shouldn't end up with two
  // contact rows.
  const existing = await prisma.contact.findFirst({ where: { businessId, whatsapp } });

  const contact = existing
    ? await prisma.contact.update({
        where: { id: existing.id },
        data: { name, dob, anniversary },
      })
    : await prisma.contact.create({
        data: { businessId, name, whatsapp, dob, anniversary, relationship: 'CUSTOMER' },
      });

  return NextResponse.json({ ok: true, contactId: contact.id }, { status: 201 });
}
