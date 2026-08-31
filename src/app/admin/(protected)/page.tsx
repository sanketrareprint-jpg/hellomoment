import { prisma } from '@/lib/db';
import DeleteBusinessButton from '@/components/DeleteBusinessButton';

export const dynamic = 'force-dynamic';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const pageSize = 50;

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { ownerWhatsapp: { contains: q } },
        ],
      }
    : {};

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [businesses, total, totalBusinesses, newThisWeek, totalContacts, totalSends, lastSends] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { contacts: true, templates: true, sendLogs: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.business.count({ where }),
    prisma.business.count(),
    prisma.business.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.contact.count(),
    prisma.sendLog.count({ where: { status: 'SUCCESS' } }),
    prisma.sendLog.groupBy({ by: ['businessId'], _max: { sentAt: true } }),
  ]);

  const lastSendByBusiness = new Map(lastSends.map((row) => [row.businessId, row._max.sentAt]));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Signed-up businesses</h1>
      <p className="text-gray-600 mb-6">Every business that has registered on hellomoment.in.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total businesses" value={totalBusinesses} />
        <StatCard label="New in last 7 days" value={newThisWeek} />
        <StatCard label="Total contacts added" value={totalContacts} />
        <StatCard label="Flyers sent (success)" value={totalSends} />
      </div>

      <form className="mb-4" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by business name, email, or WhatsApp number…"
          className="input max-w-md"
        />
      </form>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Business</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Email</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">WhatsApp</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Signed up</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Contacts</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Templates</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Sends</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Last send</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">AiSensy</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {businesses.map((b) => {
              const lastSend = lastSendByBusiness.get(b.id);
              return (
                <tr key={b.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.email}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.ownerWhatsapp}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b._count.contacts}</td>
                  <td className="px-4 py-3 text-gray-600">{b._count.templates}</td>
                  <td className="px-4 py-3 text-gray-600">{b._count.sendLogs}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lastSend ? new Date(lastSend).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'text-xs font-medium rounded-full px-2 py-0.5 ' +
                        (b.aisensyApiKey ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')
                      }
                    >
                      {b.aisensyApiKey ? 'Connected' : 'Not set up'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DeleteBusinessButton
                      id={b.id}
                      name={b.name}
                      counts={{ contacts: b._count.contacts, templates: b._count.templates, sendLogs: b._count.sendLogs }}
                    />
                  </td>
                </tr>
              );
            })}
            {businesses.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                  {q ? 'No businesses match your search.' : 'No businesses have signed up yet.'}
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
              href={`/admin?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
