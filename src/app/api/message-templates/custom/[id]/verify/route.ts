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

/** Confirms a Razorpay payment for a custom message template (see ../submit) and submits it for admin approval. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const template = await prisma.messageTemplate.findUnique({ where: { id: params.id } });
  if (
    !template ||
    template.category !== 'CUSTOM' ||
    template.businessId !== business.id ||
    template.razorpayOrderId !== razorpay_order_id
  ) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Already processed (client retried) — don't verify twice.
  if (template.paidAt) return NextResponse.json({ ok: true, alreadyProcessed: true });

  let valid: boolean;
  try {
    valid = verifyRazorpaySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Verification failed' }, { status: 502 });
  }
  if (!valid) return NextResponse.json({ error: 'Payment could not be verified' }, { status: 400 });

  await prisma.messageTemplate.update({
    where: { id: template.id },
    data: {
      paymentMethod: 'RAZORPAY',
      paidAt: new Date(),
      status: 'PENDING',
      submittedAt: new Date(),
      rejectionReason: null,
      reviewedAt: null,
    },
  });
  return NextResponse.json({ ok: true });
}
