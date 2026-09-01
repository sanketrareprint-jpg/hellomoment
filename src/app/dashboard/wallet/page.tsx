import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { RECHARGE_TIERS } from '@/lib/pricing';
import RechargeOptions from '@/components/RechargeOptions';

export const dynamic = 'force-dynamic';

const TXN_PAGE_SIZE = 30;

export default async function WalletPage({ searchParams }: { searchParams: { page?: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const page = Math.max(1, Number(searchParams.page ?? '1'));

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * TXN_PAGE_SIZE,
      take: TXN_PAGE_SIZE,
    }),
    prisma.walletTransaction.count({ where: { businessId: business.id } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / TXN_PAGE_SIZE));

  const balanceRupees = business.walletBalancePaise / 100;
  const rateRupees = business.walletRatePaise / 100;
  const messagesLeft = business.walletRatePaise > 0 ? Math.floor(business.walletBalancePaise / business.walletRatePaise) : 0;
  const lowBalance = business.walletBalancePaise < business.walletRatePaise;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Wallet</h1>
      <p className="text-gray-600 mb-6">
        Every birthday, anniversary, and festival wish costs one message from your balance. Recharge any time — a
        bigger recharge unlocks a cheaper rate per message.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs text-gray-500 mb-1">Current balance</div>
          <div className="text-2xl font-bold text-gray-900">₹{balanceRupees.toFixed(2)}</div>
          {lowBalance && (
            <div className="text-xs text-red-600 font-medium mt-1">
              Too low to send — recharge to resume sends.
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500 mb-1">Your rate</div>
          <div className="text-2xl font-bold text-gray-900">₹{rateRupees.toFixed(2)}<span className="text-sm font-normal text-gray-500">/message</span></div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500 mb-1">Messages left at this rate</div>
          <div className="text-2xl font-bold text-gray-900">{messagesLeft}</div>
        </div>
      </div>

      <div className="card p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recharge wallet</h2>
        <RechargeOptions tiers={RECHARGE_TIERS} business={{ name: business.name, email: business.email }} />
      </div>

      <h2 className="text-sm font-semibold text-gray-900 mb-3">Transaction history</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(txn.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: business.timezone || 'Asia/Kolkata',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'text-xs font-medium rounded-full px-2 py-0.5 ' +
                      (txn.type === 'RECHARGE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')
                    }
                  >
                    {txn.type}
                  </span>
                </td>
                <td
                  className={
                    'px-4 py-3 font-medium whitespace-nowrap ' +
                    (txn.type === 'RECHARGE' ? 'text-green-700' : 'text-gray-900')
                  }
                >
                  {txn.type === 'RECHARGE' ? '+' : '−'}₹{(txn.amountPaise / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-500">{txn.description || '—'}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  No wallet activity yet. Recharge above to get started.
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
              href={`/dashboard/wallet?page=${p}`}
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
