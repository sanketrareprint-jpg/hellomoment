import Link from 'next/link';

export const metadata = { title: 'Contact — raregreet.com' };

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

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <SiteHeader />

      <section className="max-w-2xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Contact us</h1>
        <p className="text-gray-600 mb-8">
          Questions about your account, billing, or anything else — we&rsquo;re happy to help.
        </p>

        <div className="card p-6 space-y-4">
          <div>
            <div className="text-xs text-gray-500">Email</div>
            <a href="mailto:sales@raregreet.com" className="text-brand-600 font-medium">
              sales@raregreet.com
            </a>
          </div>
          <div>
            <div className="text-xs text-gray-500">Response time</div>
            <div className="text-sm text-gray-700">We typically reply within 24–48 hours.</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Operated by</div>
            <div className="text-sm text-gray-700">RAREPRINT IN</div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
