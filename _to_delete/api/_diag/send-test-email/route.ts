import { NextRequest, NextResponse } from 'next/server';
import { requireApiBusiness } from '@/lib/session';
import { sendEmail } from '@/lib/email';

// TEMPORARY diagnostic route — verifies RESEND_API_KEY / email delivery end
// to end and reports the real error instead of swallowing it, unlike the
// actual forgot-password route (which must stay silent for security).
// Safe to delete after use.
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  try {
    await sendEmail({
      to: business.email,
      subject: 'RareGreet test email',
      html: '<p>This is a test email to confirm Resend is wired up correctly.</p>',
      text: 'This is a test email to confirm Resend is wired up correctly.',
    });
    return NextResponse.json({ ok: true, sentTo: business.email });
  } catch (err: any) {
    return NextResponse.json({ ok: false, sentTo: business.email, error: String(err?.message || err) }, { status: 500 });
  }
}
