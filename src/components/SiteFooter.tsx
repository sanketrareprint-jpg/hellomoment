import Link from 'next/link';

/**
 * Shared footer used across every public page (homepage, contact, pricing,
 * privacy, terms, refund policy, about). Replaces the identical footer
 * that used to be copy-pasted into each page file, so there's one place
 * to update contact details or links going forward.
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-3">
            <img src="/logo.png" alt="raregreet.com" width={32} height={32} className="rounded-lg" />
            <div className="text-lg font-bold text-brand-700">
              raregreet<span className="text-gray-400">.com</span>
            </div>
          </Link>
          <p className="text-sm text-gray-600 mb-4">
            Automated birthday, anniversary &amp; festival wishes on WhatsApp — help your business stay in touch with
            every customer, without lifting a finger.
          </p>
          <div className="space-y-1.5 text-sm text-gray-500">
            <a href="mailto:sales@raregreet.com" className="flex items-center gap-2 hover:text-brand-600">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              sales@raregreet.com
            </a>
            <a href="https://wa.me/919270299601" className="flex items-center gap-2 hover:text-brand-600">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +91 92702 99601
            </a>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>RAREPRINT IN, Behind Nutan Gym, Tukdoji Square, Ghutkala Ward, Chandrapur, Maharashtra</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Product</div>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <Link href="/#features" className="hover:text-brand-600">Features</Link>
            <Link href="/pricing" className="hover:text-brand-600">Pricing</Link>
            <Link href="/#how-it-works" className="hover:text-brand-600">How It Works</Link>
            <a href="https://wa.me/919270299601?text=Hi%2C%20I%27d%20like%20to%20see%20a%20demo%20of%20raregreet.com" className="hover:text-brand-600">
              Demo
            </a>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Company</div>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <Link href="/about" className="hover:text-brand-600">About us</Link>
            <Link href="/contact" className="hover:text-brand-600">Contact</Link>
            <Link href="/terms" className="hover:text-brand-600">Terms &amp; Conditions</Link>
            <Link href="/privacy" className="hover:text-brand-600">Privacy Policy</Link>
            <Link href="/refund-policy" className="hover:text-brand-600">Refund &amp; Delivery Policy</Link>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-8">
        &copy; {new Date().getFullYear()} RAREPRINT IN, operating raregreet.com. All rights reserved.
      </p>
    </footer>
  );
}
