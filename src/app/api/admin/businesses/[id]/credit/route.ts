import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

// Admin-granted wallet credit — for free trial offers, goodwill top-ups, or
// anything else that didn't come through a paid Razorpay recharge. Recorded
// as a WalletTransaction just like a real recharge so it shows up in the
// business's own wallet history, but tagged ADJUSTMENT (not RECHARGE) so the
// two stay distinguishable in an audit. Unlike a paid recharge, this never
// changes the business's locked-in walletRatePaise — only the balance.
const schema = z.object({
  amountRupees: z.number().positive().max(100000),
  note: z.string().trim().max(200).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { amountRupees, note } = parsed.data;
  const amountPaise = Math.round(amountRupees * 100);

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const description = note && note.length > 0 ? note : 'Free trial credit added by admin';

  const [updated] = await prisma.$transaction([
    prisma.business.update({
      where: { id: business.id },
      data: { walletBalancePaise: { increment: amountPaise } },
    }),
    prisma.walletTransaction.create({
      data: {
        businessId: business.id,
        type: 'ADJUSTMENT',
        amountPaise,
        description,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, walletBalancePaise: updated.walletBalancePaise });
}
