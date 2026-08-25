import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, signSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email and password' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const business = await prisma.business.findUnique({ where: { email: email.toLowerCase() } });
  if (!business) {
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
  }
  const valid = await verifyPassword(password, business.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
  }

  const token = signSession({ businessId: business.id });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
