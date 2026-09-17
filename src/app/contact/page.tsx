import Link from 'next/link';
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton';

export const metadata = { title: 'Contact — raregreet.com' };

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
            <div className="text-xs text-gray-500">WhatsApp</div>
            <a href="https://wa.me/919270299601" className="text-brand-600 font-medium">
              WhatsApp: +91 92702 99601
            </a>
          </div>
          <div>
            <div className="text-xs text-gray-500">Address</div>
            <div className="text-sm text-gray-700">
              RAREPRINT IN, Behind Nutan Gym, Tukdoji Square, Ghutkala Ward, Chandrapur, Maharashtra
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Response time</div>
            <div className="text-sm text-gray-700">We typically reply within 24 hours.</div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFloatButton />
    </main>
  );
}
