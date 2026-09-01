import Link from 'next/link';
import { getCurrentBusiness } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const business = await getCurrentBusiness();
  if (business) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="raregreet.com" width={36} height={36} className="rounded-lg" />
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

      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Never miss a customer&rsquo;s <span className="text-brand-600">birthday, anniversary,</span> or festival
          again
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
        {[
          {
            title: '1. Add your people',
            body: 'Add customers, friends or contacts one by one, or bulk-import them all from a spreadsheet — name, WhatsApp number, DOB, anniversary and photo.',
          },
          {
            title: '2. Design once',
            body: 'Upload a flyer background you like for birthdays, anniversaries and each festival. Position where the name, date and photo should appear — raregreet.com fills those in automatically for every send.',
          },
          {
            title: '3. It sends itself',
            body: 'Every day, raregreet.com checks who’s celebrating, generates their personalized flyer, and sends it on WhatsApp via your AiSensy account — to them and to you.',
          },
        ].map((f) => (
          <div key={f.title} className="card p-6">
            <h3 className="font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-gray-100">
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
