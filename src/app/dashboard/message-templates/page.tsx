import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import { getWalletOwner } from '@/lib/businessFamily';
import { getCustomTemplatePricePaise, isTemplateUsableBy } from '@/lib/messageTemplates';
import { parseVariableValues, parseVariables, type SendOccasion } from '@/lib/messageTemplateVars';
import MessageTemplatesWorkspace, { type MessageTemplateRow } from '@/components/MessageTemplatesWorkspace';

export const dynamic = 'force-dynamic';

export default async function MessageTemplatesPage({ searchParams }: { searchParams: { create?: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [templates, selections, pricePaise, walletOwner] = await Promise.all([
    prisma.messageTemplate.findMany({
      where: {
        OR: [
          { businessId: null, isActive: true, category: { in: ['GENERAL', 'SPECIAL'] } },
          { businessId: business.id, category: 'CUSTOM' },
        ],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.messageTemplateSelection.findMany({ where: { businessId: business.id }, include: { messageTemplate: true } }),
    getCustomTemplatePricePaise(),
    getWalletOwner(business),
  ]);

  const rows: MessageTemplateRow[] = templates.map((t) => ({
    id: t.id,
    category: t.category as MessageTemplateRow['category'],
    name: t.name,
    occasion: t.occasion as MessageTemplateRow['occasion'],
    body: t.body,
    variables: parseVariables(t.variables),
    status: t.status as MessageTemplateRow['status'],
    rejectionReason: t.rejectionReason,
    paid: !!t.paidAt,
    usable: isTemplateUsableBy(t, business.id),
  }));

  // A selected admin template that was since deactivated isn't in `templates`
  // above — include it (as unusable) so the "in use" summary can say so.
  for (const s of selections) {
    const t = s.messageTemplate;
    if (!rows.some((r) => r.id === t.id)) {
      rows.push({
        id: t.id,
        category: t.category as MessageTemplateRow['category'],
        name: t.name,
        occasion: t.occasion as MessageTemplateRow['occasion'],
        body: t.body,
        variables: parseVariables(t.variables),
        status: t.status as MessageTemplateRow['status'],
        rejectionReason: t.rejectionReason,
        paid: !!t.paidAt,
        usable: false,
      });
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Message templates</h1>
      <p className="text-gray-600 mb-6">
        Choose the WhatsApp text that goes out with your flyer for each occasion — a ready-made message, a special
        offer you fill in, or your own custom message.
      </p>
      <MessageTemplatesWorkspace
        templates={rows}
        selections={selections.map((s) => ({
          occasion: s.occasion as SendOccasion,
          messageTemplateId: s.messageTemplateId,
          variableValues: parseVariableValues(s.variableValues),
        }))}
        pricePaise={pricePaise}
        walletBalancePaise={walletOwner.walletBalancePaise}
        business={{ name: business.name, email: walletOwner.email }}
        // Dashboard's "+ Create custom message template" card links here with ?create=1.
        openCreate={searchParams.create === '1'}
      />
    </div>
  );
}
