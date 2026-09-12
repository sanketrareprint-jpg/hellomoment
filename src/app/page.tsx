import Link from 'next/link';
import { getCurrentBusiness } from '@/lib/session';
import { redirect } from 'next/navigation';

const FEATURES = [
  {
    title: '1. Add your people',
    body: 'Add customers, friends or contacts one by one, or bulk-import them all from a spreadsheet — name, WhatsApp number, DOB, anniversary and photo.',
    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 10-8 0',
  },
  {
    title: '2. Design once',
    body: 'Upload a flyer background you like for birthdays, anniversaries and each festival. Position where the name, date and photo should appear — raregreet.com fills those in automatically for every send.',
    icon: 'M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm4 3h.01M6 17l4-4a2 2 0 012.8 0l1.2 1.2M14 13l1-1a2 2 0 012.8 0L20 14',
  },
  {
    title: '3. It sends itself',
    body: 'Every day, raregreet.com checks who’s celebrating, generates their personalized flyer, and sends it on WhatsApp via your AiSensy account — to them and to you.',
    icon: 'M14 5l7 7m0 0l-7 7m7-7H3',
  },
];

export default async function LandingPage() {
  const business = await getCurrentBusiness();
  if (business) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white overflow-hidden">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="raregreet.com" width={36} height={36} className="rounded-lg shadow-sm" />
          <div className="text-xl font-bold text-brand-700">raregreet<span className="text-gray-400">.com</span></div>
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-brand-600">
            Pricing
          </Link>
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Get started free
          </Link>
        </nav>
      </header>

      <section className="relative max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-brand-200/40 to-fuchsia-200/30 blur-3xl -z-10" />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Never miss a customer&rsquo;s{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-fuchsia-600">
            birthday, anniversary,
          </span>{' '}
          or festival again
        </h1>
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
          Add your customers once. raregreet.com automatically designs a personalized flyer with their name, date
          and photo, and sends it on WhatsApp &mdash; to them and to you &mdash; the moment it&rsquo;s their day.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/register" className="btn-primary text-base px-6 py-3">
            Create your free account
          </Link>
          <Link href="/login" className="btn-secondary text-base px-6 py-3">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6 px-6 pb-24">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-white flex items-center justify-center mb-4 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={f.icon} />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-gray-100">
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
    </main>
  );
}
