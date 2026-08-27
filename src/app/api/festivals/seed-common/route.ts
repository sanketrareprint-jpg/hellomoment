import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

/**
 * One-click starter set of common Indian festivals. Dates below are the
 * business's own confirmed 2026 dates (not a guess) — see
 * festival_dates_2026_2028.md for the source table covering the next two
 * years as well, since most of these shift every year on the lunar
 * calendar and this app has no lunar calendar calculation built in.
 *
 * The daily cron only ever compares month+day for a *recurring* festival
 * (see isSameMonthDay in dateUtils.ts) — never the year — so these will
 * keep firing correctly through 2026 on these dates, then need a manual
 * date correction (Festivals → click the name → change Date → Save) once a
 * year for every "lunar" one going forward. "fixed" ones need no upkeep.
 */
const COMMON_FESTIVALS: { name: string; date: string; kind: 'fixed' | 'lunar' }[] = [
  { name: "New Year's Day", date: '2026-01-01', kind: 'fixed' },
  { name: 'Makar Sankranti', date: '2026-01-14', kind: 'fixed' },
  { name: 'Republic Day', date: '2026-01-26', kind: 'fixed' },
  { name: 'Holi', date: '2026-03-04', kind: 'lunar' },
  { name: 'Gudi Padwa', date: '2026-03-19', kind: 'lunar' },
  { name: 'Eid ul-Fitr', date: '2026-03-21', kind: 'lunar' },
  { name: 'Eid ul-Adha (Bakri Eid)', date: '2026-05-27', kind: 'lunar' },
  { name: 'Independence Day', date: '2026-08-15', kind: 'fixed' },
  { name: 'Raksha Bandhan', date: '2026-08-28', kind: 'lunar' },
  { name: 'Ganesh Chaturthi', date: '2026-09-14', kind: 'lunar' },
  { name: 'Gandhi Jayanti', date: '2026-10-02', kind: 'fixed' },
  { name: 'Navratri (Ghatasthapana)', date: '2026-10-11', kind: 'lunar' },
  { name: 'Dussehra', date: '2026-10-20', kind: 'lunar' },
  { name: 'Diwali (Lakshmi Puja)', date: '2026-11-08', kind: 'lunar' },
  { name: 'Christmas', date: '2026-12-25', kind: 'fixed' },
];

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const existing = await prisma.festival.findMany({
    where: { businessId: business.id },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((f) => f.name.trim().toLowerCase()));

  const toCreate = COMMON_FESTIVALS.filter((f) => !existingNames.has(f.name.trim().toLowerCase()));

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
    skipped: COMMON_FESTIVALS.filter((f) => existingNames.has(f.name.trim().toLowerCase())).map((f) => f.name),
  });
}
