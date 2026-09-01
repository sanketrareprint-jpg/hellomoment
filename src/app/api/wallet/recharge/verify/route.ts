import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { verifyRazorpaySignature } from '@/lib/razorpay';

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await prisma.rechargeOrder.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  if (!order || order.businessId !== business.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Already processed — most likely the client retried after a network
  // blip. Don't verify or credit twice; just confirm success.
  if (order.status === 'PAID') {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  let signatureValid: boolean;
  try {
    signatureValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Verification failed' }, { status: 502 });
  }

  if (!signatureValid) {
    await prisma.rechargeOrder.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    return NextResponse.json({ error: 'Payment could not be verified' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.rechargeOrder.update({
      where: { id: order.id },
      data: { status: 'PAID', paidAt: new Date() },
    }),
    prisma.business.update({
      where: { id: business.id },
      data: {
        walletBalancePaise: { increment: order.amountPaise },
        walletRatePaise: order.ratePaise,
      },
    }),
    prisma.walletTransaction.create({
      data: {
        businessId: business.id,
        type: 'RECHARGE',
        amountPaise: order.amountPaise,
        description: `Wallet recharge — ₹${(order.ratePaise / 100).toFixed(2)}/message rate`,
        rechargeOrderId: order.id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
