import Link from 'next/link';

const PAGES = [
  { href: '/contact', label: 'Contact' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund-policy', label: 'Refund & Delivery Policy' },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">About us</h1>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">About RareGreet</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          RareGreet.com is a WhatsApp greeting automation platform that helps businesses build lasting relationships
          with their customers. We send personalized, branded birthday, anniversary, and festival greetings on your
          behalf — automatically, on time, every time — so you never miss a moment that matters to your customers.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-3">More information</h2>
        <ul className="space-y-2">
          {PAGES.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="text-brand-600 font-medium text-sm hover:underline">
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
