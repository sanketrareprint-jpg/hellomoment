import { prisma } from '@/lib/db';
import { getCustomTemplatePricePaise } from '@/lib/messageTemplates';
import { parseVariables } from '@/lib/messageTemplateVars';
import AdminMessageTemplatesManager, { type AdminMessageTemplateRow } from '@/components/AdminMessageTemplatesManager';

export const dynamic = 'force-dynamic';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-2.5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

export default async function AdminMessageTemplatesPage() {
  const [templates, pricePaise, customCounts] = await Promise.all([
    prisma.messageTemplate.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { business: { select: { name: true } } },
    }),
    getCustomTemplatePricePaise(),
    prisma.messageTemplate.groupBy({ by: ['status'], where: { category: 'CUSTOM' }, _count: { _all: true } }),
  ]);

  const count = (status: string) => customCounts.find((c) => c.status === status)?._count._all ?? 0;
  const submitted = count('PENDING') + count('APPROVED') + count('REJECTED');

  const rows: AdminMessageTemplateRow[] = templates.map((t) => ({
    id: t.id,
    category: t.category as AdminMessageTemplateRow['category'],
    name: t.name,
    occasion: t.occasion as AdminMessageTemplateRow['occasion'],
    body: t.body,
    variables: parseVariables(t.variables),
    aisensyCampaignName: t.aisensyCampaignName,
    isActive: t.isActive,
    order: t.order,
    status: t.status as AdminMessageTemplateRow['status'],
    rejectionReason: t.rejectionReason,
    businessName: t.business?.name ?? null,
    businessId: t.businessId,
    submittedAt: t.submittedAt ? t.submittedAt.toISOString() : null,
    pricePaise: t.pricePaise,
    paymentMethod: t.paymentMethod,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-0.5">Message templates</h1>
      <p className="text-gray-600 text-sm mb-3">
        WhatsApp text sent with the flyer. Add general and special (fill-in-the-offer) templates for every business,
        and review custom templates businesses have paid to submit.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <StatCard label="Custom templates submitted" value={submitted} />
        <StatCard label="Pending approval" value={count('PENDING')} />
        <StatCard label="Approved" value={count('APPROVED')} />
        <StatCard label="Rejected" value={count('REJECTED')} />
        <StatCard label="General & special templates" value={rows.filter((r) => r.category !== 'CUSTOM').length} />
      </div>

      <AdminMessageTemplatesManager templates={rows} pricePaise={pricePaise} />
    </div>
  );
}
