import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { formatDateForDisplay } from '@/lib/dateUtils';
import DeleteFestivalButton from '@/components/DeleteFestivalButton';
import AddCommonFestivalsButton from '@/components/AddCommonFestivalsButton';

export const dynamic = 'force-dynamic';

export default async function FestivalsPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const festivals = await prisma.festival.findMany({
    where: { businessId: business.id },
    orderBy: { date: 'asc' },
    include: { template: true },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Festivals</h1>
          <p className="text-gray-600 mt-1">Custom occasions you want to wish all your contacts for &mdash; Diwali, Eid, New Year, or anything else.</p>
        </div>
        <Link href="/dashboard/festivals/new" className="btn-primary">
          + Add festival
        </Link>
      </div>

      <div className="card p-4 mb-6 bg-amber-50 border-amber-200">
        <AddCommonFestivalsButton />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Repeats yearly</th>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {festivals.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/dashboard/festivals/${f.id}/edit`}>{f.name}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDateForDisplay(f.date)}</td>
                <td className="px-4 py-3 text-gray-600">{f.recurring ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-gray-600">{f.template?.name ?? 'Default festival template'}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'text-xs font-medium rounded-full px-2 py-0.5 ' +
                      (f.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')
                    }
                  >
                    {f.active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link href={`/dashboard/festivals/${f.id}/edit`} className="text-brand-600 font-medium">
                    Edit
                  </Link>
                  <DeleteFestivalButton id={f.id} name={f.name} />
                </td>
              </tr>
            ))}
            {festivals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No festivals yet.{' '}
                  <Link href="/dashboard/festivals/new" className="text-brand-600 font-medium">
                    Add your first one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
