import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { getTodayInTimezone, daysUntilNextOccurrence, formatDateForDisplay } from '@/lib/dateUtils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [contactCount, templateCount, festivalCount, recentLogs, contacts, recentTemplates] = await Promise.all([
    prisma.contact.count({ where: { businessId: business.id } }),
    prisma.flyerTemplate.count({ where: { businessId: business.id } }),
    prisma.festival.count({ where: { businessId: business.id, active: true } }),
    prisma.sendLog.findMany({
      where: { businessId: business.id },
      orderBy: { sentAt: 'desc' },
      take: 5,
      include: { contact: true, festival: true },
    }),
    prisma.contact.findMany({ where: { businessId: business.id } }),
    prisma.flyerTemplate.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, occasion: true, backgroundUrl: true },
    }),
  ]);

  const today = getTodayInTimezone(business.timezone);
  type Upcoming = { id: string; name: string; occasion: 'BIRTHDAY' | 'ANNIVERSARY'; days: number; date: Date };
  const upcoming: Upcoming[] = [];
  for (const c of contacts) {
    if (c.dob) {
      const days = daysUntilNextOccurrence({ month: c.dob.getUTCMonth() + 1, day: c.dob.getUTCDate() }, today);
      if (days <= 7) upcoming.push({ id: c.id, name: c.name, occasion: 'BIRTHDAY', days, date: c.dob });
    }
    if (c.anniversary) {
      const days = daysUntilNextOccurrence(
        { month: c.anniversary.getUTCMonth() + 1, day: c.anniversary.getUTCDate() },
        today
      );
      if (days <= 7) upcoming.push({ id: c.id, name: c.name, occasion: 'ANNIVERSARY', days, date: c.anniversary });
    }
  }
  upcoming.sort((a, b) => a.days - b.days);

  // WhatsApp sending itself is always ready (shared platform key) — the only
  // thing worth nudging a new business about is uploading a flyer template.
  const setupIncomplete = templateCount === 0;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to RareGreet 👋</h1>
        <p className="text-gray-600 mt-1">Make every customer moment memorable. ✨</p>
      </div>

      {setupIncomplete && (
        <div className="card p-4 border-amber-300 bg-amber-50 flex items-start gap-3">
          <span className="text-amber-500 text-lg">⚠️</span>
          <div className="text-sm text-amber-800">
            <p className="font-medium">Finish setting up raregreet.com</p>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {templateCount === 0 && (
                <li>
                  Upload a{' '}
                  <Link href="/dashboard/templates/new" className="underline font-medium">
                    flyer template
                  </Link>{' '}
                  for birthdays/anniversaries.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* "Upcoming (7 days)" used to be a 4th tile here too — removed since
          the "Upcoming this week" card below already shows the same thing,
          with actual names attached instead of just a count. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Contacts" value={contactCount} href="/dashboard/contacts" />
        <StatCard label="Flyer templates" value={templateCount} href="/dashboard/templates" />
        <StatCard label="Active festivals" value={festivalCount} href="/dashboard/festivals" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Promotional flyers</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Your flyer designs, ready to send for birthdays, anniversaries and festivals.
            </p>
          </div>
          {recentTemplates.length > 0 && (
            <Link href="/dashboard/templates" className="text-sm text-brand-600 font-medium whitespace-nowrap">
              View all →
            </Link>
          )}
        </div>

        {recentTemplates.length === 0 ? (
          <Link
            href="/dashboard/templates/new"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-10 text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-sm font-medium">Add your first promotional flyer</span>
          </Link>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {recentTemplates.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/templates/${t.id}/edit`}
                className="group relative aspect-square rounded-lg overflow-hidden border border-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.backgroundUrl}
                  alt={t.name}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] px-1.5 py-1 truncate">
                  {t.name}
                </span>
              </Link>
            ))}
            <Link
              href="/dashboard/templates/new"
              className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              <span className="text-xl leading-none">+</span>
              <span className="text-[10px] font-medium mt-1">Add flyer</span>
            </Link>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Upcoming this week</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing coming up in the next 7 days.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.map((u) => (
                <li key={`${u.id}-${u.occasion}`} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{u.name}</span>{' '}
                    <span className="text-gray-500">
                      &mdash; {u.occasion === 'BIRTHDAY' ? 'Birthday' : 'Anniversary'} &middot;{' '}
                      {formatDateForDisplay(u.date)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{u.days === 0 ? 'Today' : `in ${u.days}d`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Recent sends</h2>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No wishes sent yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentLogs.map((log) => (
                <li key={log.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{log.contact?.name ?? log.festival?.name ?? '—'}</span>{' '}
                    <span className="text-gray-500">&middot; {log.occasion.toLowerCase()}</span>
                  </div>
                  <span
                    className={
                      'text-xs font-medium rounded-full px-2 py-0.5 ' +
                      (log.status === 'SUCCESS'
                        ? 'bg-green-100 text-green-700'
                        : log.status === 'FAILED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600')
                    }
                  >
                    {log.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/logs" className="text-sm text-brand-600 font-medium mt-3 inline-block">
            View all logs →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card p-4 hover:border-brand-300 transition-colors">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </Link>
  );
}
