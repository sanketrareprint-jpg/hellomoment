import crypto from 'node:crypto';

/**
 * Talks to Razorpay directly over its plain REST API (Basic auth with your
 * key id/secret) instead of pulling in the `razorpay` npm package — order
 * creation and payment-signature verification are both simple enough that
 * one fewer dependency felt worth it. See:
 * https://razorpay.com/docs/api/orders/ and
 * https://razorpay.com/docs/payments/server-integration/nodejs/build-integration/#3-verify-payment-signature
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — add it in Railway → Variables before accepting a recharge.`);
  }
  return value;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/** amountPaise: integer, e.g. 50000 = ₹500.00. Razorpay's `amount` field is always the smallest currency unit (paise for INR). */
export async function createRazorpayOrder(opts: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const keyId = requireEnv('RAZORPAY_KEY_ID');
  const keySecret = requireEnv('RAZORPAY_KEY_SECRET');
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: 'INR',
      receipt: opts.receipt,
      notes: opts.notes ?? {},
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Razorpay order creation failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Verifies the signature Razorpay Checkout hands back to the client on
 * successful payment, per Razorpay's documented HMAC-SHA256 scheme:
 * signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret).
 * This is the step that actually proves the payment is real — never credit
 * a wallet from client-supplied order/payment IDs without it.
 */
export function verifyRazorpaySignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = requireEnv('RAZORPAY_KEY_SECRET');
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(opts.signature, 'utf8');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
