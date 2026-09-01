import Link from 'next/link';

export const metadata = { title: 'Terms & Conditions — raregreet.com' };

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="text-sm text-gray-600 space-y-2 leading-relaxed">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>

        <Section title="1. Who we are">
          <p>
            raregreet.com (&ldquo;RareGreet&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by RAREPRINT IN.
            These Terms &amp; Conditions govern your access to and use of raregreet.com and the services offered
            through it (the &ldquo;Service&rdquo;).
          </p>
        </Section>

        <Section title="2. The Service">
          <p>
            RareGreet lets registered businesses upload their customers&rsquo; contact details and automatically
            send personalized, branded WhatsApp greetings — for birthdays, anniversaries, and festivals — on the
            business&rsquo;s behalf, using a connected WhatsApp Business API provider.
          </p>
        </Section>

        <Section title="3. Your account">
          <p>
            You must provide accurate information when registering, and are responsible for keeping your login
            credentials secure. You are responsible for all activity that happens under your account.
          </p>
        </Section>

        <Section title="4. Wallet, recharges &amp; pricing">
          <p>
            RareGreet is billed on a pay-as-you-go basis. You recharge a prepaid wallet through Razorpay; each
            automatic wish we send debits one message from your balance at your current rate (see our{' '}
            <Link href="/pricing" className="text-brand-600">Pricing page</Link>). Rates and tiers may change from
            time to time; changes will apply to future recharges, not to a rate you&rsquo;ve already locked in on
            an existing recharge. See our{' '}
            <Link href="/refund-policy" className="text-brand-600">Refund &amp; Delivery Policy</Link> for how
            recharges are handled.
          </p>
        </Section>

        <Section title="5. Acceptable use">
          <p>You agree not to use RareGreet to:</p>
          <ul className="list-disc list-inside">
            <li>Message contacts who have not consented to receive WhatsApp communications from your business;</li>
            <li>Send spam, unlawful, defamatory, or fraudulent content;</li>
            <li>Violate WhatsApp&rsquo;s own Business Policy or your WhatsApp API provider&rsquo;s terms; or</li>
            <li>Attempt to interfere with or disrupt the Service.</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these terms.</p>
        </Section>

        <Section title="6. Service availability">
          <p>
            We aim to keep RareGreet available and reliable, but we don&rsquo;t guarantee uninterrupted access.
            Sends depend in part on third-party services (including your WhatsApp API provider) outside our
            control.
          </p>
        </Section>

        <Section title="7. Intellectual property">
          <p>
            The RareGreet name, logo, and platform are the property of RAREPRINT IN. Content you upload (contacts,
            logos, flyer designs, brand details) remains yours — you grant us a license to use it solely to provide
            the Service to you.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>
            RareGreet is provided &ldquo;as is.&rdquo; To the extent permitted by law, RAREPRINT IN is not liable
            for indirect, incidental, or consequential damages arising from your use of the Service, including
            missed or delayed sends caused by third-party services.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            You may stop using RareGreet at any time. We may suspend or terminate accounts that violate these
            terms or applicable law.
          </p>
        </Section>

        <Section title="10. Changes to these terms">
          <p>
            We may update these terms from time to time. Continued use of RareGreet after a change means you
            accept the updated terms.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>These terms are governed by the laws of India.</p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these terms? Reach us at{' '}
            <a href="mailto:sales@raregreet.com" className="text-brand-600">sales@raregreet.com</a>.
          </p>
        </Section>
      </section>

      <SiteFooter />
    </main>
  );
}
