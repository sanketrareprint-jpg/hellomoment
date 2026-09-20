import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { rootIdOf } from '@/lib/businessFamily';
import { signSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth';

const schema = z.object({ businessId: z.string().min(1) });

// Switches the active company within the current login's family, without a
// password — see src/lib/businessFamily.ts. The target must be the root or
// a member sharing the same root as whatever business the session is
// currently on; anything else is rejected, so this can never be used to
// hop into an unrelated business.
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const target = await prisma.business.findUnique({ where: { id: parsed.data.businessId } });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const currentRootId = rootIdOf(business);
  const targetRootId = rootIdOf(target);
  if (targetRootId !== currentRootId) {
    return NextResponse.json({ error: 'That company is not linked to your account' }, { status: 403 });
  }

  const token = signSession({ businessId: target.id });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
