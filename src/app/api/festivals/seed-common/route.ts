import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

/**
 * Bulk-creates festivals from names + dates the BUSINESS typed in the app
 * (see CommonFestivalsForm.tsx) — we deliberately do not guess/hardcode
 * festival dates ourselves here, since most Indian festivals (Diwali, Eid,
 * Holi, Raksha Bandhan, Ganesh Chaturthi, Navratri, Dussehra, Gudi Padwa,
 * etc) follow the lunar calendar and shift every year, and getting that
 * wrong would send wishes on the wrong day. The client offers a curated
 * list of common festival names with empty date fields for the business to
 * fill in (or skip) themselves.
 */
const schema = z.object({
  festivals: z
    .array(
      z.object({
        name: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const existing = await prisma.festival.findMany({
    where: { businessId: business.id },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((f) => f.name.trim().toLowerCase()));

  const toCreate = parsed.data.festivals.filter((f) => !existingNames.has(f.name.trim().toLowerCase()));

  if (toCreate.length > 0) {
    await prisma.festival.createMany({
      data: toCreate.map((f) => ({
        businessId: business.id,
        name: f.name,
        date: new Date(`${f.date}T00:00:00.000Z`),
        recurring: true,
        // Created paused on purpose — the business still needs to link a
        // flyer template before these should start sending automatically.
        active: false,
      })),
    });
  }

  return NextResponse.json({
    created: toCreate.map((f) => f.name),
    skipped: parsed.data.festivals.filter((f) => existingNames.has(f.name.trim().toLowerCase())).map((f) => f.name),
  });
}
