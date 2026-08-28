import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { formatDateForDisplay } from '@/lib/dateUtils';
import DeleteContactButton from '@/components/DeleteContactButton';
import ShareJoinLink from '@/components/ShareJoinLink';

export const dynamic = 'force-dynamic';

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

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.contact.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
