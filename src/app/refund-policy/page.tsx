import Link from 'next/link';

export const metadata = { title: 'Refund & Delivery Policy — raregreet.com' };

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="text-sm text-gray-600 space-y-2 leading-relaxed">{children}</div>
    </div>
  );
}

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Refund &amp; Delivery Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>

        <Section title="Delivery — digital service, no physical shipping">
          <p>
            RareGreet is a fully digital service. There is no physical product to ship. When a wallet recharge
            payment is successfully completed, your wallet balance is credited automatically and instantly — you
            can start using it right away from your dashboard.
          </p>
        </Section>

        <Section title="Wallet recharges">
          <p>
            Wallet recharges are generally non-refundable once your balance has been credited, since the balance
            is usable immediately and does not expire.
          </p>
        </Section>

        <Section title="Failed or duplicate payments">
          <p>
            If a payment was deducted from your bank/UPI/card but your RareGreet wallet balance was not credited
            (for example, due to a technical issue), email us at{' '}
            <a href="mailto:sales@raregreet.com" className="text-brand-600">sales@raregreet.com</a> with your
            payment reference. We will investigate and either credit your wallet or process a refund to your
            original payment method.
          </p>
        </Section>

        <Section title="Refund timeline">
          <p>
            Approved refunds are processed back to your original payment method via Razorpay and typically appear
            within 5–7 business days, depending on your bank.
          </p>
        </Section>

        <Section title="Account closure">
          <p>
            If you close your RareGreet account, any unused wallet balance is forfeited. If you&rsquo;d like to
            discuss this before closing your account, contact us first.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any refund or billing question, reach us at{' '}
            <a href="mailto:sales@raregreet.com" className="text-brand-600">sales@raregreet.com</a>.
          </p>
        </Section>
      </section>

      <SiteFooter />
    </main>
  );
}
