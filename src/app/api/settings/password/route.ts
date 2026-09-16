import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';

const schema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function PUT(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const valid = await verifyPassword(currentPassword, business.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.business.update({ where: { id: business.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
