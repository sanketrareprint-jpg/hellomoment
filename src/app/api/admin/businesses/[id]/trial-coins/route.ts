import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { getWalletOwner } from '@/lib/businessFamily';

// Grants free trial coins to a business — the mechanism behind "give this
// customer a free trial". Trial coins are a completely separate balance
// from the ₹ wallet (see Business.trialCoins / TrialCoinTransaction in
// prisma/schema.prisma): they're spent first on every send, at
// COINS_PER_SEND coins/message (src/lib/pricing.ts), before the wallet is
// ever touched, and they never affect the business's locked-in walletRatePaise.
//
// Like the wallet, trial coins are shared across every company under one
// login — granting coins to a member company credits the shared root pool.
const schema = z.object({
  coins: z.number().int().positive().max(100000),
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
  const { coins, note } = parsed.data;

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const walletOwner = await getWalletOwner(business);

  const baseDescription = note && note.length > 0 ? note : 'Free trial coins added by admin';
  const description =
    walletOwner.id === business.id ? baseDescription : `${baseDescription} — ${business.name}`;

  const [updated] = await prisma.$transaction([
    prisma.business.update({
      where: { id: walletOwner.id },
      data: { trialCoins: { increment: coins } },
    }),
    prisma.trialCoinTransaction.create({
      data: {
        businessId: walletOwner.id,
        type: 'GRANT',
        coins,
        description,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, trialCoins: updated.trialCoins });
}
