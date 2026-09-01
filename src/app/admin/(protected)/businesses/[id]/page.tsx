import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import DeleteBusinessButton from '@/components/DeleteBusinessButton';

export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-gray-900 mt-0.5">{value ?? <span className="text-gray-400">—</span>}</div>
    </div>
  );
}

const CONTACTS_PAGE_SIZE = 50;
const SEND_LOGS_PAGE_SIZE = 50;

export default async function AdminBusinessDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { cpage?: string; cq?: string; spage?: string; sq?: string };
}) {
  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { contacts: true, templates: true, sendLogs: true, festivals: true } },
    },
  });
  if (!business) notFound();

  const contactsPage = Math.max(1, Number(searchParams.cpage ?? '1'));
  const contactsQuery = (searchParams.cq ?? '').trim();
  const sendLogsPage = Math.max(1, Number(searchParams.spage ?? '1'));
  const sendLogsQuery = (searchParams.sq ?? '').trim();

  const contactsWhere = {
    businessId: business.id,
    ...(contactsQuery
      ? { OR: [{ name: { contains: contactsQuery } }, { whatsapp: { contains: contactsQuery } }, { relationship: { contains: contactsQuery } }] }
      : {}),
  };

  const sendLogsWhere = {
    businessId: business.id,
    ...(sendLogsQuery
      ? { OR: [{ contact: { name: { contains: sendLogsQuery } } }, { occasion: { contains: sendLogsQuery } }, { status: { contains: sendLogsQuery } }] }
      : {}),
  };

  const [contactsTotal, contacts, sendLogsTotal, sendLogs, sendStatusCounts] = await Promise.all([
    prisma.contact.count({ where: contactsWhere }),
    prisma.contact.findMany({
      where: contactsWhere,
      orderBy: { createdAt: 'desc' },
      skip: (contactsPage - 1) * CONTACTS_PAGE_SIZE,
      take: CONTACTS_PAGE_SIZE,
    }),
    prisma.sendLog.count({ where: sendLogsWhere }),
    prisma.sendLog.findMany({
      where: sendLogsWhere,
      orderBy: { sentAt: 'desc' },
      skip: (sendLogsPage - 1) * SEND_LOGS_PAGE_SIZE,
      take: SEND_LOGS_PAGE_SIZE,
      include: { contact: true, festival: true },
    }),
    prisma.sendLog.groupBy({
      by: ['status'],
      where: { businessId: business.id },
      _count: { _all: true },
    }),
  ]);

  const contactsTotalPages = Math.max(1, Math.ceil(contactsTotal / CONTACTS_PAGE_SIZE));
  const sendLogsTotalPages = Math.max(1, Math.ceil(sendLogsTotal / SEND_LOGS_PAGE_SIZE));
  const statusMap = Object.fromEntries(sendStatusCounts.map((s) => [s.status, s._count._all]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-brand-600 font-medium">
            ← All businesses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{business.name}</h1>
          <p className="text-gray-500 text-sm">
            Signed up {new Date(business.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>
        <DeleteBusinessButton
          id={business.id}
          name={business.name}
          counts={{
            contacts: business._count.contacts,
            templates: business._count.templates,
            sendLogs: business._count.sendLogs,
          }}
          redirectTo="/admin"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Account</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Business name" value={business.name} />
            <Field label="Login email" value={business.email} />
            <Field label="Owner WhatsApp" value={business.ownerWhatsapp} />
            <Field label="Timezone" value={business.timezone} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Brand kit (used on flyers)</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Logo"
              value={
                business.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded border border-gray-200" />
                ) : null
              }
            />
            <Field label="Firm name script" value={business.firmNameScript === 'MARATHI' ? `Marathi — ${business.firmNameMarathi || '(not set)'}` : 'English'} />
            <Field label="Phone shown on flyer" value={business.phoneDisplay} />
            <Field label="Address" value={business.addressText} />
            <Field label="Products / services line" value={business.productsText} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">AiSensy (WhatsApp API)</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Status"
              value={
                <span
                  className={
                    'text-xs font-medium rounded-full px-2 py-0.5 ' +
                    (business.aisensyApiKey ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')
                  }
                >
                  {business.aisensyApiKey ? 'Connected' : 'Not set up'}
                </span>
              }
            />
            <Field label="Birthday campaign" value={business.aisensyBirthdayCampaign} />
            <Field label="Anniversary campaign" value={business.aisensyAnniversaryCampaign} />
            <Field label="Festival campaign" value={business.aisensyFestivalCampaign} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Usage</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contacts" value={business._count.contacts} />
            <Field label="Flyer templates" value={business._count.templates} />
            <Field label="Active festivals" value={business._count.festivals} />
            <Field label="Total sends" value={business._count.sendLogs} />
            <Field label="Successful sends" value={statusMap.SUCCESS ?? 0} />
            <Field label="Failed sends" value={statusMap.FAILED ?? 0} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden overflow-x-auto">
        <div className="px-5 py-3 border-b border-gray-100 space-y-2">
          <div className="font-semibold text-gray-900">
            Contacts ({contactsTotal} of {business._count.contacts} total) — click a name to see everything sent to them
          </div>
          <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="cq"
              defaultValue={contactsQuery}
              placeholder="Search contacts by name, WhatsApp, or relationship…"
              className="input max-w-md text-sm"
            />
            {contactsQuery && (
              <a href={`/admin/businesses/${business.id}`} className="text-sm text-gray-500 self-center">
                Clear
              </a>
            )}
          </form>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Name</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">WhatsApp</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Relationship</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Birthday</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Anniversary</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium whitespace-nowrap">
                  <Link href={`/admin/businesses/${business.id}/contacts/${c.id}`} className="text-brand-700 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{c.whatsapp}</td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{c.relationship}</td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {c.dob ? new Date(c.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {c.anniversary ? new Date(c.anniversary).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No contacts added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {contactsTotalPages > 1 && (
          <div className="flex gap-2 px-5 py-3 border-t border-gray-100">
            {Array.from({ length: contactsTotalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/admin/businesses/${business.id}?cpage=${p}${contactsQuery ? `&cq=${encodeURIComponent(contactsQuery)}` : ''}`}
                className={
                  'px-3 py-1 rounded-lg text-sm ' +
                  (p === contactsPage ? 'bg-brand-600 text-white' : 'bg-white border border-gray-300')
                }
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </div>

      <div id="send-logs" className="card overflow-hidden overflow-x-auto">
        <div className="px-5 py-3 border-b border-gray-100 space-y-2">
          <div className="font-semibold text-gray-900">
            Send logs ({sendLogsTotal} of {business._count.sendLogs} total)
          </div>
          <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="sq"
              defaultValue={sendLogsQuery}
              placeholder="Search sends by contact name, occasion, or status…"
              className="input max-w-md text-sm"
            />
            {sendLogsQuery && (
              <a href={`/admin/businesses/${business.id}`} className="text-sm text-gray-500 self-center">
                Clear
              </a>
            )}
          </form>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium whitespace-nowrap">To</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Occasion</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Status</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Sent at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sendLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                  {log.contact?.name ?? log.festival?.name ?? '—'}
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{log.occasion.toLowerCase()}</td>
                <td className="px-4 py-2 whitespace-nowrap">
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
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {new Date(log.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
            {sendLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No sends yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {sendLogsTotalPages > 1 && (
          <div className="flex gap-2 px-5 py-3 border-t border-gray-100">
            {Array.from({ length: sendLogsTotalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/admin/businesses/${business.id}?spage=${p}${sendLogsQuery ? `&sq=${encodeURIComponent(sendLogsQuery)}` : ''}#send-logs`}
                className={
                  'px-3 py-1 rounded-lg text-sm ' +
                  (p === sendLogsPage ? 'bg-brand-600 text-white' : 'bg-white border border-gray-300')
                }
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
