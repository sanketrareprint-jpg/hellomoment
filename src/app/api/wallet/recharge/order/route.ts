import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { createRazorpayOrder } from '@/lib/razorpay';
import { MIN_RECHARGE_RUPEES, rateForRechargeAmount, rupeesToPaise } from '@/lib/pricing';

const schema = z.object({
  amountRupees: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { amountRupees } = parsed.data;
  if (amountRupees < MIN_RECHARGE_RUPEES) {
    return NextResponse.json({ error: `Minimum recharge is ₹${MIN_RECHARGE_RUPEES}` }, { status: 400 });
  }

  const amountPaise = rupeesToPaise(amountRupees);
  const ratePaise = rateForRechargeAmount(amountRupees);

  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder({
      amountPaise,
      // Razorpay caps receipt at 40 chars — keep it short but traceable.
      receipt: `wal_${business.id.slice(-12)}_${Date.now()}`,
      notes: { businessId: business.id, businessName: business.name },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not start payment. Try again.' },
      { status: 502 }
    );
  }

  await prisma.rechargeOrder.create({
    data: {
      businessId: business.id,
      amountPaise,
      ratePaise,
      razorpayOrderId: razorpayOrder.id,
      status: 'CREATED',
    },
  });

  return NextResponse.json({
    orderId: razorpayOrder.id,
    amountPaise,
    keyId: process.env.RAZORPAY_KEY_ID,
    business: { name: business.name, email: business.email, phone: business.ownerWhatsapp },
  });
}
