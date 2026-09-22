import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('APPROVE'), aisensyCampaignName: z.string().trim().min(1, 'Enter the AiSensy campaign name') }),
  z.object({ action: z.literal('REJECT'), rejectionReason: z.string().trim().min(1, 'Give a reason for rejecting') }),
]);

/**
 * Approves (with the AiSensy campaign created for it) or rejects a
 * business's submitted custom message template.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const template = await prisma.messageTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.category !== 'CUSTOM') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (template.status === 'DRAFT') {
    return NextResponse.json({ error: 'This template has not been submitted yet.' }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const data =
    parsed.data.action === 'APPROVE'
      ? { status: 'APPROVED', aisensyCampaignName: parsed.data.aisensyCampaignName, rejectionReason: null, reviewedAt: new Date() }
      : { status: 'REJECTED', rejectionReason: parsed.data.rejectionReason, reviewedAt: new Date() };

  const updated = await prisma.messageTemplate.update({ where: { id: template.id }, data });
  return NextResponse.json({ template: updated });
}
