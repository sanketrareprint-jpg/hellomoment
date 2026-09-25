import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { getWalletOwner } from '@/lib/businessFamily';
import { createRazorpayOrder } from '@/lib/razorpay';
import { getCustomTemplatePricePaise } from '@/lib/messageTemplates';

const schema = z.object({ method: z.enum(['RAZORPAY', 'WALLET']) });

/**
 * Pays for (if not already paid) and submits a custom message template for
 * admin approval. Price comes from the admin-set AppSetting. A template that
 * was paid for once (e.g. then rejected and edited) is resubmitted free.
 * - WALLET: debits the shared ₹ wallet immediately and submits.
 * - RAZORPAY: returns a Razorpay order; ./verify submits once paid.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const template = await prisma.messageTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.category !== 'CUSTOM' || template.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (template.status !== 'DRAFT' && template.status !== 'REJECTED') {
    return NextResponse.json({ error: 'This template has already been submitted.' }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Choose a payment method' }, { status: 400 });

  const submitNow = { status: 'PENDING', submittedAt: new Date(), rejectionReason: null, reviewedAt: null };

  const pricePaise = await getCustomTemplatePricePaise();
  if (template.paidAt || pricePaise === 0) {
    await prisma.messageTemplate.update({
      where: { id: template.id },
      data: template.paidAt ? submitNow : { ...submitNow, pricePaise: 0, paymentMethod: 'FREE', paidAt: new Date() },
    });
    return NextResponse.json({ ok: true, submitted: true });
  }

  // The ₹ wallet is shared across every company under the same login.
  const walletOwner = await getWalletOwner(business);

  if (parsed.data.method === 'WALLET') {
    // Conditional decrement so two concurrent submits can't overdraw the wallet.
    const debited = await prisma.business.updateMany({
      where: { id: walletOwner.id, walletBalancePaise: { gte: pricePaise } },
      data: { walletBalancePaise: { decrement: pricePaise } },
    });
    if (debited.count === 0) {
      return NextResponse.json(
        { error: `Wallet balance is too low — you need ₹${(pricePaise / 100).toFixed(2)}. Recharge or pay online instead.` },
        { status: 400 }
      );
    }
    const fromOther = walletOwner.id === business.id ? '' : ` — ${business.name}`;
    await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          businessId: walletOwner.id,
          type: 'DEBIT',
          amountPaise: pricePaise,
          description: `Custom message template "${template.name}"${fromOther}`,
        },
      }),
      prisma.messageTemplate.update({
        where: { id: template.id },
        data: { ...submitNow, pricePaise, paymentMethod: 'WALLET', paidAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true, submitted: true });
  }

  let order;
  try {
    order = await createRazorpayOrder({
      amountPaise: pricePaise,
      // Razorpay caps receipt at 40 chars.
      receipt: `mtpl_${template.id.slice(-12)}_${Date.now()}`,
      notes: { businessId: business.id, messageTemplateId: template.id },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not start payment. Try again.' },
      { status: 502 }
    );
  }

  await prisma.messageTemplate.update({
    where: { id: template.id },
    data: { razorpayOrderId: order.id, pricePaise },
  });

  return NextResponse.json({
    orderId: order.id,
    amountPaise: pricePaise,
    keyId: process.env.RAZORPAY_KEY_ID,
    business: { name: walletOwner.name, email: walletOwner.email },
  });
}
