import Link from 'next/link';
import { RECHARGE_TIERS, MIN_RECHARGE_RUPEES } from '@/lib/pricing';

export const metadata = { title: 'Pricing — raregreet.com' };

function SiteHeader() {
  return (
    <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="raregreet.com" width={36} height={36} className="rounded-lg" />
        <div className="text-xl font-bold text-brand-700">
          raregreet<span className="text-gray-400">.com</span>
        </div>
      </Link>
      <nav className="flex gap-3">
        <Link href="/login" className="btn-secondary">
          Log in
        </Link>
        <Link href="/register" className="btn-primary">
          Get started free
        </Link>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-10 mt-16 border-t border-gray-100">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-3">About us</div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 justify-center">
        <Link href="/contact" className="hover:text-brand-600">Contact</Link>
        <Link href="/pricing" className="hover:text-brand-600">Pricing</Link>
        <Link href="/terms" className="hover:text-brand-600">Terms &amp; Conditions</Link>
        <Link href="/privacy" className="hover:text-brand-600">Privacy Policy</Link>
        <Link href="/refund-policy" className="hover:text-brand-600">Refund &amp; Delivery Policy</Link>
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">
        &copy; {new Date().getFullYear()} RAREPRINT IN, operating raregreet.com. All rights reserved.
      </p>
    </footer>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <SiteHeader />

      <section className="max-w-4xl mx-auto text-center px-6 pt-10 pb-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">Simple, pay-as-you-go pricing</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          No monthly subscription. Recharge your wallet whenever you like, and every WhatsApp wish we send just
          draws down your balance — one message, one send. Bigger recharges unlock a cheaper rate per message.
        </p>
      </section>

      <section className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6 px-6 pt-6 pb-16">
        {RECHARGE_TIERS.map((tier, i) => (
          <div key={tier.amountRupees} className={'card p-6 text-center ' + (i === 1 ? 'ring-2 ring-brand-500' : '')}>
            {i === 1 && (
              <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">Most popular</div>
            )}
            <div className="text-3xl font-extrabold text-gray-900">₹{tier.amountRupees}</div>
            <div className="text-sm text-gray-500 mt-1">recharge</div>
            <div className="mt-4 text-lg font-semibold text-brand-700">₹{tier.pricePerMessageRupees}/message</div>
            <p className="mt-3 text-sm text-gray-600">
              That's about {Math.floor((tier.amountRupees * 100) / (tier.pricePerMessageRupees * 100))} WhatsApp
              wishes sent automatically — birthdays, anniversaries, and festivals.
            </p>
          </div>
        ))}
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-3">How it works</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Recharge any amount ₹{MIN_RECHARGE_RUPEES} or above — the recharge amount decides your rate per message from then on.</li>
            <li>Every automatic birthday, anniversary, or festival wish we generate and send costs exactly one message from your balance.</li>
            <li>Your balance doesn't expire — use it whenever your contacts' special days come up.</li>
            <li>No setup fees, no monthly charges. You only pay for messages you actually send.</li>
            <li>Payments are processed securely by Razorpay.</li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
