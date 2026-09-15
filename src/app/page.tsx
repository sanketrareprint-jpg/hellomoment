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

// Real product capabilities — shown in their own grid below the 3-step
// walkthrough above, distinct from it. Copy describes raregreet.com's
// actual features only.
const CAPABILITIES = [
  {
    title: 'Sent on real WhatsApp',
    body: 'Flyers go out through your own WhatsApp Business account — not a generic bot number — so they land the way a message from you would.',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    title: '68 ready-made designs',
    body: 'Starter flyers for every major birthday, anniversary and festival occasion, organized separately from your own uploads — usable the moment you sign up.',
    icon: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  },
  {
    title: 'Your full brand kit, every send',
    body: 'Logo, phone number, address, and your products or services line — even your firm name in Marathi script — placed automatically on every flyer.',
    icon: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM7 11h.01M7 15h4m5-7v8',
  },
  {
    title: 'Photo on every flyer',
    body: 'Each contact\'s photo drops into a frame you position once — circle, square, rounded or hexagon — filled in automatically for every send.',
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  },
  {
    title: 'Bulk import from a spreadsheet',
    body: 'Already have your customer list somewhere? Import it all in one go — name, WhatsApp number, birthday, anniversary and photo — instead of typing each one in.',
    icon: 'M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6M4 6h16M9 6v14',
  },
  {
    title: 'Pay only for what you send',
    body: 'No monthly subscription. Recharge your wallet whenever you like — every wish just draws down your balance, and bigger recharges unlock a cheaper rate per message.',
    icon: 'M3 10h18M7 15h1m4 0h1M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z',
  },
  {
    title: 'See who\'s celebrating this week',
    body: 'Your dashboard surfaces every birthday and anniversary coming up in the next 7 days, plus a log of everything already sent.',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  {
    title: 'Your data stays yours',
    body: 'Every business\'s contacts, templates and sends are kept completely separate — nobody else on raregreet.com can see them.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
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

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <p className="text-center text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">How it works</p>
        <div className="grid sm:grid-cols-3 gap-6">
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
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Everything you need, built in</h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto">
            No separate design tool, no separate contacts spreadsheet, no separate WhatsApp API setup to manage.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((f) => (
            <div key={f.title} className="card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={f.icon} />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
              <p className="mt-1.5 text-sm text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>
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
