import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTodayInTimezone, isSameMonthDay } from '@/lib/dateUtils';
import { sendWishForContact, sendWishForFestival } from '@/lib/sendWish';

export const maxDuration = 300; // allow up to 5 minutes on platforms that respect this (e.g. Vercel Pro)

/**
 * The single daily trigger for the whole platform. An external scheduler
 * (cron job, GitHub Actions, Vercel Cron, etc — see README) should call
 * this once a day, either as:
 *
 *   POST /api/cron/daily     Authorization: Bearer <CRON_SECRET>
 *   GET  /api/cron/daily     Authorization: Bearer <CRON_SECRET>
 *
 * (GET is supported too because Vercel Cron issues GET requests; it
 * automatically sends this same Authorization header when CRON_SECRET is
 * set as a Vercel project env var.)
 *
 * It loops over every business, and for each one: finds contacts whose
 * birthday/anniversary is today (in that business's own timezone) and
 * festivals scheduled for today, generates each flyer, and sends it via
 * that business's own AiSensy account. Safe to call more than once on the
 * same day — already-sent wishes are skipped.
 */
export async function POST(req: NextRequest) {
  return handleDailyTrigger(req);
}

export async function GET(req: NextRequest) {
  return handleDailyTrigger(req);
}

async function handleDailyTrigger(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const businesses = await prisma.business.findMany();
  const summary = {
    businessesProcessed: 0,
    birthdaysSent: 0,
    anniversariesSent: 0,
    festivalSendsSent: 0,
    errors: [] as string[],
  };

  for (const business of businesses) {
    try {
      const today = getTodayInTimezone(business.timezone);
      const todayStartUtc = new Date(Date.UTC(today.year, today.month - 1, today.day));

      const contacts = await prisma.contact.findMany({
        where: { businessId: business.id, OR: [{ dob: { not: null } }, { anniversary: { not: null } }] },
      });

      for (const contact of contacts) {
        if (contact.dob && isSameMonthDay(contact.dob, today, today.year)) {
          const alreadySent = await prisma.sendLog.findFirst({
            where: {
              businessId: business.id,
              contactId: contact.id,
              occasion: 'BIRTHDAY',
              status: 'SUCCESS',
              sentAt: { gte: todayStartUtc },
            },
          });
          if (!alreadySent) {
            const template = await prisma.flyerTemplate.findFirst({
              where: { businessId: business.id, occasion: 'BIRTHDAY', isDefault: true },
            });
            if (template) {
              await sendWishForContact({ business, contact, template, occasion: 'BIRTHDAY', todayYear: today.year });
              summary.birthdaysSent += 1;
            } else {
              summary.errors.push(`${business.name}: no default BIRTHDAY template — skipped ${contact.name}`);
            }
          }
        }

        if (contact.anniversary && isSameMonthDay(contact.anniversary, today, today.year)) {
          const alreadySent = await prisma.sendLog.findFirst({
            where: {
              businessId: business.id,
              contactId: contact.id,
              occasion: 'ANNIVERSARY',
              status: 'SUCCESS',
              sentAt: { gte: todayStartUtc },
            },
          });
          if (!alreadySent) {
            const template = await prisma.flyerTemplate.findFirst({
              where: { businessId: business.id, occasion: 'ANNIVERSARY', isDefault: true },
            });
            if (template) {
              await sendWishForContact({ business, contact, template, occasion: 'ANNIVERSARY', todayYear: today.year });
              summary.anniversariesSent += 1;
            } else {
              summary.errors.push(`${business.name}: no default ANNIVERSARY template — skipped ${contact.name}`);
            }
          }
        }
      }

      const festivals = await prisma.festival.findMany({
        where: { businessId: business.id, active: true },
        include: { template: true },
      });

      for (const festival of festivals) {
        const matches = festival.recurring
          ? isSameMonthDay(festival.date, today, today.year)
          : festival.date.getUTCFullYear() === today.year &&
            festival.date.getUTCMonth() + 1 === today.month &&
            festival.date.getUTCDate() === today.day;
        if (!matches) continue;

        const template =
          festival.template ??
          (await prisma.flyerTemplate.findFirst({
            where: { businessId: business.id, occasion: 'FESTIVAL', isDefault: true },
          }));
        if (!template) {
          summary.errors.push(`${business.name}: no template for festival "${festival.name}" — skipped`);
          continue;
        }

        const alreadySentContactIds = new Set(
          (
            await prisma.sendLog.findMany({
              where: {
                businessId: business.id,
                festivalId: festival.id,
                status: 'SUCCESS',
                sentAt: { gte: todayStartUtc },
              },
              select: { contactId: true },
            })
          ).map((l) => l.contactId)
        );

        const allContacts = await prisma.contact.findMany({ where: { businessId: business.id } });
        const pending = allContacts.filter((c) => !alreadySentContactIds.has(c.id));
        if (pending.length === 0) continue;

        await sendWishForFestival({ business, festival, template, contacts: pending });
        summary.festivalSendsSent += pending.length;
      }

      summary.businessesProcessed += 1;
    } catch (err) {
      summary.errors.push(`${business.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json(summary);
}
