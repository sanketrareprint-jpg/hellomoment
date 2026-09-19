import Link from 'next/link';
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Privacy Policy — raregreet.com' };

function SiteHeader() {
  return (
    <header className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-y-3 px-4 sm:px-6 py-4 sm:py-6">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <img src="/logo.png" alt="raregreet.com" width={36} height={36} className="rounded-lg" />
        <div className="text-lg sm:text-xl font-bold text-brand-700 whitespace-nowrap">
          raregreet<span className="text-gray-400">.com</span>
        </div>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link href="/login" className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
          Log in
        </Link>
        <Link href="/register" className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
          <span className="sm:hidden">Get started</span>
          <span className="hidden sm:inline">Get started free</span>
        </Link>
      </nav>
    </header>
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>

        <Section title="1. Information we collect">
          <p>We collect:</p>
          <ul className="list-disc list-inside">
            <li>Account information you provide: business name, login email, password (stored as a secure hash, never in plain text), owner WhatsApp number, and brand details;</li>
            <li>Contact information you upload about your own customers: name, WhatsApp number, relationship, birthday, anniversary, and photos, so we can generate and send greetings on your behalf;</li>
            <li>Payment records from Razorpay (amount, status, transaction ID) — we never see or store your card, UPI, or bank details ourselves;</li>
            <li>Usage and log data, such as which greetings were sent and when, to show you your send history.</li>
          </ul>
        </Section>

        <Section title="2. How we use it">
          <p>
            We use this information solely to operate the Service: generating and sending your customers&rsquo;
            greetings, processing wallet recharges, sending you account and transactional emails (like password
            resets), and improving the Service.
          </p>
        </Section>

        <Section title="3. Third-party service providers">
          <p>We share the minimum necessary data with trusted providers who help us run RareGreet:</p>
          <ul className="list-disc list-inside">
            <li>Your WhatsApp Business API provider (e.g. AiSensy) — to deliver the greetings you send;</li>
            <li>Razorpay — to process wallet recharge payments;</li>
            <li>Resend — to deliver account emails such as password resets;</li>
            <li>Railway — our hosting infrastructure provider.</li>
          </ul>
          <p>We do not sell your data or your customers&rsquo; data to anyone.</p>
        </Section>

        <Section title="4. Data storage &amp; security">
          <p>
            Your data is stored on secured servers. Passwords are hashed, not stored in plain text. While we take
            reasonable steps to protect your information, no online service can guarantee absolute security.
          </p>
        </Section>

        <Section title="5. Data retention">
          <p>
            We retain your account and contact data for as long as your account is active, so the Service can keep
            working correctly. You can request deletion of your account and associated data at any time.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>
            You can access, correct, or request deletion of your account information and the customer contacts
            you&rsquo;ve uploaded at any time from within your dashboard, or by emailing us.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            We use a single session cookie to keep you logged in. We don&rsquo;t use tracking or advertising
            cookies.
          </p>
        </Section>

        <Section title="8. Children's privacy">
          <p>RareGreet is intended for business use and is not directed at individuals under 18.</p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>We may update this policy from time to time; the &ldquo;Last updated&rdquo; date above will reflect the latest revision.</p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about this policy, or a request to access/delete your data? Email us at{' '}
            <a href="mailto:sales@raregreet.com" className="text-brand-600">sales@raregreet.com</a>.
          </p>
        </Section>
      </section>

      <SiteFooter />
      <WhatsAppFloatButton />
    </main>
  );
}
