import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { RECHARGE_TIERS, COINS_PER_SEND } from '@/lib/pricing';
import RechargeOptions from '@/components/RechargeOptions';

export const dynamic = 'force-dynamic';

const TXN_PAGE_SIZE = 30;

export default async function WalletPage({ searchParams }: { searchParams: { page?: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const page = Math.max(1, Number(searchParams.page ?? '1'));

  const [transactions, total, trialCoinTransactions] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * TXN_PAGE_SIZE,
      take: TXN_PAGE_SIZE,
    }),
    prisma.walletTransaction.count({ where: { businessId: business.id } }),
    prisma.trialCoinTransaction.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / TXN_PAGE_SIZE));
  const hasTrialCoinActivity = business.trialCoins > 0 || trialCoinTransactions.length > 0;

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

      {hasTrialCoinActivity && (
        <div className="card p-5 mb-6 border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <h2 className="text-sm font-semibold text-gray-900">Trial coins</h2>
            <div className="text-lg font-bold text-amber-700">{business.trialCoins} coin{business.trialCoins === 1 ? '' : 's'}</div>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            A free trial credit, separate from your ₹ balance above — spent first on every send
            ({COINS_PER_SEND} coins/message) before your wallet is touched.
          </p>
          {trialCoinTransactions.length > 0 && (
            <div className="overflow-x-auto -mx-5 px-5 pt-3 border-t border-amber-100">
              <table className="w-full text-sm">
                <thead className="text-gray-500 text-left">
                  <tr>
                    <th className="pr-4 py-1 font-medium">When</th>
                    <th className="pr-4 py-1 font-medium">Coins</th>
                    <th className="pr-4 py-1 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {trialCoinTransactions.map((txn) => (
                    <tr key={txn.id}>
                      <td className="pr-4 py-1.5 text-gray-600 whitespace-nowrap">
                        {new Date(txn.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: business.timezone || 'Asia/Kolkata',
                        })}
                      </td>
                      <td
                        className={
                          'pr-4 py-1.5 font-medium whitespace-nowrap ' +
                          (txn.type === 'DEBIT' ? 'text-gray-900' : 'text-amber-700')
                        }
                      >
                        {txn.type === 'DEBIT' ? '−' : '+'}{txn.coins}
                      </td>
                      <td className="pr-4 py-1.5 text-gray-500">{txn.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                      (txn.type === 'DEBIT' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700')
                    }
                  >
                    {txn.type}
                  </span>
                </td>
                <td
                  className={
                    'px-4 py-3 font-medium whitespace-nowrap ' +
                    (txn.type === 'DEBIT' ? 'text-gray-900' : 'text-green-700')
                  }
                >
                  {txn.type === 'DEBIT' ? '−' : '+'}₹{(txn.amountPaise / 100).toFixed(2)}
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
