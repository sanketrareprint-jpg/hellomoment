import Link from 'next/link';
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'About us — raregreet.com' };

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

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <SiteHeader />

      <section className="max-w-2xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-6">About us</h1>

        <div className="card p-6 space-y-4 text-gray-700 leading-relaxed">
          <p>
            raregreet.com is built for small and growing businesses — shops, studios, clinics, showrooms — who want
            their customers to feel remembered without the daily effort of tracking birthdays and anniversaries by
            hand.
          </p>
          <p>
            You add your customers once, design a flyer you like, and raregreet.com takes care of the rest: the
            right message, with the customer&rsquo;s name, date and photo, goes out on WhatsApp automatically on
            their birthday, anniversary, or a festival you&rsquo;ve set up — every time, without you lifting a
            finger.
          </p>
          <p>
            We&rsquo;re run by <strong>RAREPRINT IN</strong>, based in Chandrapur, Maharashtra. If you have questions
            about how raregreet.com can fit your business, we&rsquo;re happy to talk —{' '}
            <a href="https://wa.me/919270299601" className="text-brand-600 font-medium hover:underline">
              message us on WhatsApp
            </a>{' '}
            or{' '}
            <Link href="/contact" className="text-brand-600 font-medium hover:underline">
              reach out here
            </Link>
            .
          </p>
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFloatButton />
    </main>
  );
}
