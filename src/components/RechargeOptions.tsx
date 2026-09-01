'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MIN_RECHARGE_RUPEES, type RechargeTier } from '@/lib/pricing';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RechargeOptions({
  tiers,
  business,
}: {
  tiers: RechargeTier[];
  business: { name: string; email: string };
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(tiers[0]?.amountRupees ?? 500);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Uses MIN_RECHARGE_RUPEES (not the lowest tier button) so the custom-amount
  // field always matches whatever the server will actually accept — this is
  // currently lowered to ₹5 in src/lib/pricing.ts for live-mode testing.
  const minAmount = MIN_RECHARGE_RUPEES;
  const amountRupees = customAmount ? Number(customAmount) : selected;

  async function handleRecharge() {
    setError(null);
    setSuccess(false);
    if (!amountRupees || amountRupees < minAmount) {
      setError(`Minimum recharge is ₹${minAmount}`);
      return;
    }
    setLoading(true);
    try {
      const ready = await loadRazorpayScript();
      if (!ready || !window.Razorpay) {
        throw new Error('Could not load Razorpay checkout. Check your internet connection and try again.');
      }

      const orderRes = await fetch('/api/wallet/recharge/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountRupees: Math.round(amountRupees) }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Could not start payment');

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: 'INR',
        order_id: orderData.orderId,
        name: 'RareGreet',
        description: 'Wallet recharge',
        prefill: { name: business.name, email: business.email },
        theme: { color: '#db2777' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/wallet/recharge/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');
            setSuccess(true);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed. Contact support if the amount was deducted.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.on('payment.failed', () => {
        setError('Payment failed. No amount was deducted from your wallet.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {tiers.map((tier) => (
          <button
            key={tier.amountRupees}
            type="button"
            onClick={() => {
              setSelected(tier.amountRupees);
              setCustomAmount('');
            }}
            className={
              'text-left rounded-xl border-2 px-4 py-3 transition ' +
              (!customAmount && selected === tier.amountRupees
                ? 'border-brand-600 bg-brand-50'
                : 'border-gray-200 hover:border-brand-300')
            }
          >
            <div className="text-lg font-bold text-gray-900">₹{tier.amountRupees}</div>
            <div className="text-xs text-gray-500">₹{tier.pricePerMessageRupees}/message</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Or enter a custom amount (₹)</label>
          <input
            type="number"
            min={minAmount}
            step={1}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={`Min ₹${minAmount}`}
            className="input w-40"
          />
        </div>
        <button type="button" onClick={handleRecharge} disabled={loading} className="btn-primary">
          {loading ? 'Opening payment…' : `Recharge ₹${amountRupees || 0}`}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-700">Recharge successful — your balance has been updated.</div>}
    </div>
  );
}
