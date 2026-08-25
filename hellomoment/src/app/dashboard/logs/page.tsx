import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';

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

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Send logs</h1>
      <p className="text-gray-600 mb-6">Every flyer generated and WhatsApp send attempt, most recent first.</p>

      <div className="card overflow-hidden">
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
                  {new Date(log.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {log.contact?.name ?? (log.festival ? `All contacts — ${log.festival.name}` : '—')}
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{log.occasion.toLowerCase()}</td>
                <td className="px-4 py-3">
                  {log.flyerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={log.flyerUrl} alt="Flyer" className="w-12 h-12 rounded object-cover border border-gray-200" />
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
