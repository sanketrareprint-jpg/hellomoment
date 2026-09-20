import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { getWalletOwner } from '@/lib/businessFamily';

// Admin-granted wallet credit — for free trial offers, goodwill top-ups, or
// anything else that didn't come through a paid Razorpay recharge. Recorded
// as a WalletTransaction just like a real recharge so it shows up in the
// business's own wallet history, but tagged ADJUSTMENT (not RECHARGE) so the
// two stay distinguishable in an audit. Unlike a paid recharge, this never
// changes the business's locked-in walletRatePaise — only the balance.
//
// The wallet is shared across every company under one login, so crediting a
// member company here credits the shared root wallet — same as a real
// recharge or a send debit.
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
  const walletOwner = await getWalletOwner(business);

  const baseDescription = note && note.length > 0 ? note : 'Free trial credit added by admin';
  const description =
    walletOwner.id === business.id ? baseDescription : `${baseDescription} — ${business.name}`;

  const [updated] = await prisma.$transaction([
    prisma.business.update({
      where: { id: walletOwner.id },
      data: { walletBalancePaise: { increment: amountPaise } },
    }),
    prisma.walletTransaction.create({
      data: {
        businessId: walletOwner.id,
        type: 'ADJUSTMENT',
        amountPaise,
        description,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, walletBalancePaise: updated.walletBalancePaise });
}
