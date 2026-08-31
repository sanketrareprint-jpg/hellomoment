import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { formatDateForDisplay, getTodayInTimezone } from '@/lib/dateUtils';
import DeleteContactButton from '@/components/DeleteContactButton';
import ShareJoinLink from '@/components/ShareJoinLink';

export const dynamic = 'force-dynamic';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

const RELATIONSHIPS = ['CUSTOMER', 'FRIEND', 'FAMILY', 'OTHER'] as const;

export default async function ContactsPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const q = searchParams.q?.trim();
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const pageSize = 25;

  const where = {
    businessId: business.id,
    ...(q ? { OR: [{ name: { contains: q } }, { whatsapp: { contains: q } }] } : {}),
  };

  // The stats row below always reflects ALL of this business's contacts
  // (not just the current search/page), so it's fetched separately with
  // only the fields it needs.
  const [contacts, total, allContacts] = await Promise.all([
    prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where: { businessId: business.id },
      select: { relationship: true, dob: true, anniversary: true, photoUrl: true, createdAt: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const today = getTodayInTimezone(business.timezone);
  const monthStart = new Date(Date.UTC(today.year, today.month - 1, 1));
  const birthdaysThisMonth = allContacts.filter((c) => c.dob && c.dob.getUTCMonth() + 1 === today.month).length;
  const anniversariesThisMonth = allContacts.filter(
    (c) => c.anniversary && c.anniversary.getUTCMonth() + 1 === today.month,
  ).length;
  const missingPhoto = allContacts.filter((c) => !c.photoUrl).length;
  const newThisMonth = allContacts.filter((c) => c.createdAt >= monthStart).length;
  const relationshipCounts = RELATIONSHIPS.map((r) => ({
    relationship: r,
    count: allContacts.filter((c) => c.relationship === r).length,
  })).filter((r) => r.count > 0);

  const appBaseUrl = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const joinLink = `${appBaseUrl}/join/${business.id}`;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">{total} people in your list</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/contacts/import" className="btn-secondary">
            Bulk import
          </Link>
          <Link href="/dashboard/contacts/new" className="btn-primary">
            + Add contact
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
        <StatCard label="Total contacts" value={allContacts.length} />
        <StatCard label="New this month" value={newThisMonth} />
        <StatCard label="Birthdays this month" value={birthdaysThisMonth} />
        <StatCard label="Anniversaries this month" value={anniversariesThisMonth} />
        <StatCard label="Missing a photo" value={missingPhoto} />
      </div>

      {relationshipCounts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {relationshipCounts.map((r) => (
            <span
              key={r.relationship}
              className="text-xs font-medium rounded-full px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-100 capitalize"
            >
              {r.count} {r.relationship.toLowerCase()}
              {r.count === 1 ? '' : 's'}
            </span>
          ))}
        </div>
      )}

      <div className="card p-4 mb-6 bg-brand-50 border-brand-200">
        <p className="font-medium text-gray-900 mb-1">Don&rsquo;t have a customer list yet?</p>
        <p className="text-sm text-gray-600 mb-3">
          Share this link with your customers (WhatsApp status, a group, a text) — they fill in their own name,
          WhatsApp number, and birthday/anniversary, and they&rsquo;re added here automatically. No spreadsheet
          needed.
        </p>
        <ShareJoinLink link={joinLink} />
      </div>

      <form className="mb-4" method="GET">
        <input
          className="input max-w-sm"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or WhatsApp number"
        />
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Relationship</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Birthday</th>
              <th className="px-4 py-3 font-medium">Anniversary</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/dashboard/contacts/${c.id}/edit`}>{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{c.relationship.toLowerCase()}</td>
                <td className="px-4 py-3 text-gray-600">{c.whatsapp}</td>
                <td className="px-4 py-3 text-gray-600">{c.dob ? formatDateForDisplay(c.dob) : '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {c.anniversary ? formatDateForDisplay(c.anniversary) : '—'}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link href={`/dashboard/contacts/${c.id}/edit`} className="text-brand-600 font-medium">
                    Edit
                  </Link>
                  <DeleteContactButton id={c.id} name={c.name} />
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No contacts yet.{' '}
                  <Link href="/dashboard/contacts/new" className="text-brand-600 font-medium">
                    Add your first one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/contacts?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`}
              className={
                'px-3 py-1 rounded-lg text-sm ' + (p === page ? 'bg-brand-600 text-white' : 'bg-white border border-gray-300')
              }
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
