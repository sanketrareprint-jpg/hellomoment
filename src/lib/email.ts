/**
 * Sends transactional email via Resend's plain REST API (a single POST with
 * API-key auth) instead of pulling in the `resend` npm package — see
 * https://resend.com/docs/api-reference/emails/send-email
 *
 * IMPORTANT — sender restriction while testing: until a custom domain is
 * verified in the Resend dashboard, the default `onboarding@resend.dev`
 * sender can only deliver to the email address the Resend ACCOUNT itself
 * signed up with — sending to anyone else fails with a 403. Verify a domain
 * (e.g. raregreet.com) in Resend and set EMAIL_FROM to an address at that
 * domain before relying on this for real customers. See .env.example.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — add it in Railway → Variables before sending email.`);
  }
  return value;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }): Promise<void> {
  const apiKey = requireEnv('RESEND_API_KEY');
  const from = process.env.EMAIL_FROM || 'RareGreet <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Email send failed (${res.status}): ${body}`);
  }
}
