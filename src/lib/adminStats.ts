import { prisma } from '@/lib/db';

// All "today"/"this month" bucketing is done in IST (Asia/Kolkata) since
// that's the timezone every business and the admin (Vrushali) operate in,
// regardless of where the server itself happens to run.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function istStartOfDay(date: Date): Date {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

function istStartOfMonth(date: Date, monthOffset = 0): Date {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  const startOfMonthUTC = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + monthOffset, 1));
  return new Date(startOfMonthUTC.getTime() - IST_OFFSET_MS);
}

function bucketSum<T>(
  items: T[],
  getTime: (item: T) => number,
  getAmount: (item: T) => number,
  starts: Date[],
  ends: Date[]
): number[] {
  const sums = new Array(starts.length).fill(0);
  for (const item of items) {
    const t = getTime(item);
    for (let i = 0; i < starts.length; i++) {
      if (t >= starts[i].getTime() && t < ends[i].getTime()) {
        sums[i] += getAmount(item);
        break;
      }
    }
  }
  return sums;
}

const dayLabelFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const monthLabelFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });

const OCCASION_META: Record<string, { label: string; color: string }> = {
  BIRTHDAY: { label: 'Birthday', color: '#2a78d6' },
  ANNIVERSARY: { label: 'Anniversary', color: '#eb6834' },
  FESTIVAL: { label: 'Festival', color: '#1baf7a' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  SUCCESS: { label: 'Success', color: '#0ca30c' },
  FAILED: { label: 'Failed', color: '#d03b3b' },
  SKIPPED: { label: 'Skipped', color: '#fab219' },
};

export async function getAdminDashboardStats() {
  const now = new Date();
  const todayStart = istStartOfDay(now);

  const NUM_DAYS = 7;
  const dayStarts = Array.from({ length: NUM_DAYS }, (_, i) => istStartOfDay(new Date(now.getTime() - (NUM_DAYS - 1 - i) * DAY_MS)));
  const dayEnds = dayStarts.map((start, i) => (i + 1 < NUM_DAYS ? dayStarts[i + 1] : new Date(start.getTime() + DAY_MS)));

  const NUM_MONTHS = 6;
  const monthStarts = Array.from({ length: NUM_MONTHS }, (_, i) => istStartOfMonth(now, -(NUM_MONTHS - 1 - i)));
  const monthEnds = monthStarts.map((start, i) => (i + 1 < NUM_MONTHS ? monthStarts[i + 1] : istStartOfMonth(now, 1)));

  const [
    totalStarterTemplates,
    totalFlyerTemplateCopies,
    totalFrames,
    totalBusinessFrameCopies,
    todayRecharge,
    todayCoinsSpent,
    todayWalletSpend,
    signupsInRange,
    rechargesInRange,
    sendsByOccasionRaw,
    sendsByStatusRaw,
  ] = await Promise.all([
    prisma.starterTemplate.count(),
    prisma.flyerTemplate.count(),
    prisma.frame.count(),
    prisma.businessFrame.count(),
    prisma.rechargeOrder.aggregate({ where: { status: 'PAID', paidAt: { gte: todayStart } }, _sum: { amountPaise: true } }),
    prisma.trialCoinTransaction.aggregate({ where: { type: 'DEBIT', createdAt: { gte: todayStart } }, _sum: { coins: true } }),
    prisma.walletTransaction.aggregate({ where: { type: 'DEBIT', createdAt: { gte: todayStart } }, _sum: { amountPaise: true } }),
    prisma.business.findMany({ where: { createdAt: { gte: monthStarts[0] } }, select: { createdAt: true } }),
    prisma.rechargeOrder.findMany({
      where: { status: 'PAID', paidAt: { gte: dayStarts[0] } },
      select: { paidAt: true, amountPaise: true },
    }),
    prisma.sendLog.groupBy({ by: ['occasion'], _count: { _all: true } }),
    prisma.sendLog.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const monthlySignupCounts = bucketSum(signupsInRange, (b) => b.createdAt.getTime(), () => 1, monthStarts, monthEnds);
  const dailyRechargeSums = bucketSum(
    rechargesInRange.filter((r) => r.paidAt),
    (r) => r.paidAt!.getTime(),
    (r) => r.amountPaise,
    dayStarts,
    dayEnds
  );

  return {
    totalStarterTemplates,
    totalFlyerTemplateCopies,
    totalFrames,
    totalBusinessFrameCopies,
    todayRechargePaise: todayRecharge._sum.amountPaise ?? 0,
    todayCoinsSpent: todayCoinsSpent._sum.coins ?? 0,
    todayWalletSpendPaise: todayWalletSpend._sum.amountPaise ?? 0,
    monthlySignups: monthStarts.map((start, i) => ({ label: monthLabelFmt.format(start), value: monthlySignupCounts[i] })),
    dailyRechargePaise: dayStarts.map((start, i) => ({ label: dayLabelFmt.format(start), value: dailyRechargeSums[i] / 100 })),
    sendsByOccasion: Object.entries(OCCASION_META).map(([key, meta]) => ({
      label: meta.label,
      color: meta.color,
      value: sendsByOccasionRaw.find((r) => r.occasion === key)?._count._all ?? 0,
    })),
    sendsByStatus: Object.entries(STATUS_META).map(([key, meta]) => ({
      label: meta.label,
      color: meta.color,
      value: sendsByStatusRaw.find((r) => r.status === key)?._count._all ?? 0,
    })),
    totalSendAttempts: sendsByStatusRaw.reduce((sum, r) => sum + r._count._all, 0),
  };
}
