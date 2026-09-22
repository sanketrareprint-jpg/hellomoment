import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { getTodayInTimezone, daysUntilNextOccurrence, formatDateForDisplay } from '@/lib/dateUtils';
import Link from 'next/link';
import DashboardBannerSlider from '@/components/DashboardBannerSlider';
import { getAllBannerSlideSeconds } from '@/lib/bannerTiming';
import DashboardTemplatesByCategory, { type DashboardTemplateRow } from '@/components/DashboardTemplatesByCategory';
import type { BrandInfo, FrameOption } from '@/components/TemplatePlaceholderEditor';
import { isTemplateUsableBy } from '@/lib/messageTemplates';
import { OCCASION_LABELS, parseVariables, renderPreview } from '@/lib/messageTemplateVars';

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [contactCount, templateCount, rawTemplates, festivalCount, recentLogs, contacts, banners, rawDefaultFrame, rawMessageTemplates, messageSelections] = await Promise.all([
    prisma.contact.count({ where: { businessId: business.id } }),
    prisma.flyerTemplate.count({ where: { businessId: business.id } }),
    prisma.flyerTemplate.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.festival.count({ where: { businessId: business.id, active: true } }),
    prisma.sendLog.findMany({
      where: { businessId: business.id },
      orderBy: { sentAt: 'desc' },
      take: 5,
      include: { contact: true, festival: true },
    }),
    prisma.contact.findMany({ where: { businessId: business.id } }),
    prisma.dashboardBanner.findMany({
      where: { isActive: true, placement: 'DASHBOARD' },
      orderBy: { order: 'asc' },
      select: { id: true, imageUrl: true, linkUrl: true, device: true },
    }),
    prisma.businessFrame.findFirst({ where: { businessId: business.id, isDefault: true } }),
    // Same set the Message templates page offers: active admin-made ones plus
    // this business's own custom ones (filtered to usable ones below).
    prisma.messageTemplate.findMany({
      where: {
        OR: [
          { businessId: null, isActive: true, category: { in: ['GENERAL', 'SPECIAL'] } },
          { businessId: business.id, category: 'CUSTOM' },
        ],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.messageTemplateSelection.findMany({ where: { businessId: business.id }, include: { messageTemplate: true } }),
  ]);

  // Separate desktop / mobile banner sets; phones fall back to the desktop
  // set until a mobile banner is added.
  const desktopBanners = banners.filter((b) => b.device !== 'MOBILE');
  const hasMobileBanners = banners.some((b) => b.device === 'MOBILE');
  const mobileBanners = hasMobileBanners ? banners.filter((b) => b.device === 'MOBILE') : desktopBanners;
  const slideSeconds = banners.length > 1 ? await getAllBannerSlideSeconds() : null;
  const availableMessageTemplates = rawMessageTemplates
    .filter((t) => isTemplateUsableBy(t, business.id))
    .map((t) => {
      const variables = parseVariables(t.variables);
      const samples = Object.fromEntries(variables.map((v) => [String(v.index), v.sample ?? '']));
      return {
        id: t.id,
        name: t.name,
        category: t.category,
        occasion: t.occasion as keyof typeof OCCASION_LABELS,
        text: renderPreview(t.body, variables, samples),
        inUseFor: messageSelections
          .filter((s) => s.messageTemplateId === t.id)
          .map((s) => OCCASION_LABELS[s.occasion as keyof typeof OCCASION_LABELS]),
      };
    });

  // Placeholders are JSON strings in the DB — parsed here so the dashboard
  // cards can draw each template with its sample name/date/photo and the
  // default Frame's branding, the same way the template editor previews it.
  const parse = (json: string | null) => (json ? JSON.parse(json) : null);
  const templates: DashboardTemplateRow[] = rawTemplates.map((t) => {
    const rawPhoto = parse(t.photoPlaceholder);
    return {
      id: t.id,
      name: t.name,
      occasion: t.occasion,
      source: t.source,
      backgroundUrl: t.backgroundUrl,
      canvasWidth: t.canvasWidth,
      canvasHeight: t.canvasHeight,
      namePlaceholder: parse(t.namePlaceholder),
      designationPlaceholder: parse(t.designationPlaceholder),
      datePlaceholder: parse(t.datePlaceholder),
      // Older templates saved a single square `size` before width/height existed.
      photoPlaceholder: rawPhoto
        ? { ...rawPhoto, width: rawPhoto.width ?? rawPhoto.size, height: rawPhoto.height ?? rawPhoto.size }
        : null,
      logoPlaceholder: parse(t.logoPlaceholder),
      firmNamePlaceholder: parse(t.firmNamePlaceholder),
      phonePlaceholder: parse(t.phonePlaceholder),
      emailPlaceholder: parse(t.emailPlaceholder),
      addressPlaceholder: parse(t.addressPlaceholder),
      websitePlaceholder: parse(t.websitePlaceholder),
      productsPlaceholder: parse(t.productsPlaceholder),
      phoneTextOverride: t.phoneTextOverride,
      emailTextOverride: t.emailTextOverride,
      addressTextOverride: t.addressTextOverride,
      websiteTextOverride: t.websiteTextOverride,
      productsTextOverride: t.productsTextOverride,
    };
  });

  const defaultFrame: FrameOption | null = rawDefaultFrame
    ? {
        id: rawDefaultFrame.id,
        name: rawDefaultFrame.name,
        overlayUrl: rawDefaultFrame.overlayUrl,
        overlayHue: rawDefaultFrame.overlayHue,
        isDefault: rawDefaultFrame.isDefault,
        canvasWidth: rawDefaultFrame.canvasWidth,
        canvasHeight: rawDefaultFrame.canvasHeight,
        logoPlaceholder: parse(rawDefaultFrame.logoPlaceholder),
        firmNamePlaceholder: parse(rawDefaultFrame.firmNamePlaceholder),
        phonePlaceholder: parse(rawDefaultFrame.phonePlaceholder),
        emailPlaceholder: parse(rawDefaultFrame.emailPlaceholder),
        addressPlaceholder: parse(rawDefaultFrame.addressPlaceholder),
        websitePlaceholder: parse(rawDefaultFrame.websitePlaceholder),
        productsPlaceholder: parse(rawDefaultFrame.productsPlaceholder),
        customTextPlaceholders: parse(rawDefaultFrame.customTextPlaceholders),
      }
    : null;

  const brand: BrandInfo = {
    logoUrl: business.logoUrl,
    name: business.name,
    phoneDisplay: business.phoneDisplay,
    emailDisplay: business.emailDisplay,
    addressText: business.addressText,
    websiteUrl: business.websiteUrl,
    productsText: business.productsText,
    firmNameScript: business.firmNameScript as 'ENGLISH' | 'MARATHI',
    firmNameMarathi: business.firmNameMarathi,
  };

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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {desktopBanners.length > 0 && (
        <div className="hidden sm:block">
          <DashboardBannerSlider banners={desktopBanners} intervalSeconds={slideSeconds?.['DASHBOARD.DESKTOP']} />
        </div>
      )}
      {mobileBanners.length > 0 && (
        <div className="sm:hidden">
          <DashboardBannerSlider
            banners={mobileBanners}
            aspectClass={hasMobileBanners ? 'aspect-[2/1]' : undefined}
            intervalSeconds={slideSeconds?.[hasMobileBanners ? 'DASHBOARD.MOBILE' : 'DASHBOARD.DESKTOP']}
          />
        </div>
      )}

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Contacts" value={contactCount} href="/dashboard/contacts" />
        <StatCard label="Flyer templates" value={templateCount} href="/dashboard/templates" />
        <StatCard label="Active festivals" value={festivalCount} href="/dashboard/festivals" />
      </div>

      <DashboardTemplatesByCategory templates={templates} defaultFrame={defaultFrame} business={brand} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900 text-sm">Message templates</h2>
          <Link href="/dashboard/message-templates" className="text-xs text-brand-600 font-medium">
            View all →
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          <Link
            href="/dashboard/message-templates?create=1"
            className="card shrink-0 w-44 sm:w-52 snap-start flex flex-col items-center justify-center gap-2 p-4 border-dashed text-brand-600 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <span className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-3xl leading-none">+</span>
            <span className="text-xs font-medium text-center">Create custom message template</span>
          </Link>
          {availableMessageTemplates.map((t) => (
            <Link
              key={t.id}
              href="/dashboard/message-templates"
              className="card shrink-0 w-64 sm:w-72 snap-start p-3 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                  <div className="text-xs text-gray-500">{OCCASION_LABELS[t.occasion] ?? t.occasion}</div>
                </div>
                <span
                  className={
                    'text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 whitespace-nowrap ' +
                    (t.category === 'SPECIAL'
                      ? 'bg-fuchsia-100 text-fuchsia-700'
                      : t.category === 'CUSTOM'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-brand-50 text-brand-700')
                  }
                >
                  {t.category === 'SPECIAL' ? 'Special' : t.category === 'CUSTOM' ? 'Custom' : 'General'}
                </span>
              </div>
              <p className="flex-1 rounded-lg bg-[#e7ffdb] border border-green-200 px-2 py-1.5 text-xs leading-relaxed text-gray-800 whitespace-pre-wrap break-words line-clamp-6">
                {t.text}
              </p>
              {t.inUseFor.length > 0 && <p className="text-xs text-green-700 mt-2">In use for: {t.inUseFor.join(', ')}</p>}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-2">Upcoming this week</h2>
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

        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-2">Recent sends</h2>
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
    <Link href={href} className="card p-3 hover:border-brand-300 transition-colors">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </Link>
  );
}
