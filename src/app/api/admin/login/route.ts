import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signAdminSession, ADMIN_SESSION_COOKIE, ADMIN_SESSION_COOKIE_OPTIONS } from '@/lib/auth';

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: 'Admin login is not set up yet — set ADMIN_PASSWORD in your environment variables first.' },
      { status: 500 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter the admin password' }, { status: 400 });
  }

  if (parsed.data.password !== adminPassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const token = signAdminSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, ADMIN_SESSION_COOKIE_OPTIONS);
  return res;
}
