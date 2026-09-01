import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const schema = z.object({ email: z.string().email() });

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  // Always return the same generic response whether or not the email is
  // registered — otherwise this form could be used to find out which
  // email addresses have a RareGreet account.
  const genericResponse = NextResponse.json({
    ok: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  });

  const business = await prisma.business.findUnique({ where: { email } });
  if (!business) return genericResponse;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.passwordResetToken.create({
    data: {
      businessId: business.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${rawToken}`;

  try {
    await sendEmail({
      to: business.email,
      subject: 'Reset your RareGreet password',
      html: `
        <p>Hi ${business.name},</p>
        <p>Someone requested a password reset for your RareGreet account. Click below to set a new password — this link expires in 1 hour.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
      `,
      text: `Reset your RareGreet password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    });
  } catch (err) {
    // Don't let a delivery failure leak whether the account exists either —
    // but do log it server-side so a real problem (e.g. a missing/invalid
    // RESEND_API_KEY, or the sending-restriction described in
    // src/lib/email.ts) shows up in Railway logs instead of failing silently.
    console.error('Failed to send password reset email:', err);
  }

  return genericResponse;
}
