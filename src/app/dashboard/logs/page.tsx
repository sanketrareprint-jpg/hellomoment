import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import FlyerThumb from '@/components/FlyerThumb';

export const dynamic = 'force-dynamic';

export default async function LogsPage({ searchParams }: { searchParams: { page?: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const pageSize = 30;

  const [logs, total] = await Promise.all([
    prisma.sendLog.findMany({
      where: { businessId: business.id },
      orderBy: { sentAt: 'desc' },
      include: { contact: true, festival: true, template: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sendLog.count({ where: { businessId: business.id } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const tz = business.timezone || 'Asia/Kolkata';

  // Mobile view groups logs under a date heading so each row only needs to
  // show its time (the table view below still shows full date+time per row
  // and is used from the sm breakpoint up, where there's room for it).
  type LogRow = (typeof logs)[number];
  const dateGroups: { key: string; label: string; items: LogRow[] }[] = [];
  for (const log of logs) {
    const sentAt = new Date(log.sentAt);
    const key = sentAt.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD, stable grouping key
    const label = sentAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz });
    const lastGroup = dateGroups[dateGroups.length - 1];
    if (lastGroup && lastGroup.key === key) {
      lastGroup.items.push(log);
    } else {
      dateGroups.push({ key, label, items: [log] });
    }
  }

  function statusClasses(status: string) {
    return (
      'text-xs font-medium rounded-full px-2 py-0.5 ' +
      (status === 'SUCCESS' ? 'bg-green-100 text-green-700' : status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Send logs</h1>
      <p className="text-gray-600 mb-6">Every flyer generated and WhatsApp send attempt, most recent first.</p>

      {/* Table view — sm and up, where a 6-column row comfortably fits. */}
      <div className="card overflow-x-auto hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Recipient</th>
              <th className="px-4 py-3 font-medium">Occasion</th>
              <th className="px-4 py-3 font-medium">Flyer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(log.sentAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    // Without this, the server's own clock (UTC on Railway)
                    // gets used instead of the business's actual timezone —
                    // a send at 8:21pm IST would otherwise show as 2:51pm.
                    timeZone: business.timezone || 'Asia/Kolkata',
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {log.contact?.name ?? (log.festival ? `All contacts — ${log.festival.name}` : '—')}
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{log.occasion.toLowerCase()}</td>
                <td className="px-4 py-3">
                  {log.flyerUrl ? (
                    <FlyerThumb url={log.flyerUrl} recipient={log.contact?.name ?? log.occasion} />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-xs">{log.errorMessage || '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No sends yet. They&rsquo;ll show up here once a birthday, anniversary, or festival triggers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view — below sm, grouped by date so each row only needs a time. */}
      <div className="sm:hidden space-y-6">
        {dateGroups.map((group) => (
          <div key={group.key}>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">{group.label}</h2>
            <div className="card divide-y divide-gray-100">
              {group.items.map((log) => (
                <div key={log.id} className="p-3 flex items-start gap-3">
                  {log.flyerUrl ? (
                    <div className="shrink-0">
                      <FlyerThumb url={log.flyerUrl} recipient={log.contact?.name ?? log.occasion} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {log.contact?.name ?? (log.festival ? `All contacts — ${log.festival.name}` : '—')}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: tz })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 capitalize">{log.occasion.toLowerCase()}</span>
                      <span className={statusClasses(log.status)}>{log.status}</span>
                    </div>
                    {log.errorMessage && (
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Details:</span> {log.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="card p-10 text-center text-gray-500">
            No sends yet. They&rsquo;ll show up here once a birthday, anniversary, or festival triggers.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/dashboard/logs?page=${p}`}
              className={'px-3 py-1 rounded-lg text-sm ' + (p === page ? 'bg-brand-600 text-white' : 'bg-white border border-gray-300')}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
