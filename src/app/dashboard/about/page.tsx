export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">About &amp; Contact</h1>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">About RareGreet</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          RareGreet.com is a WhatsApp greeting automation platform that helps businesses build lasting relationships
          with their customers. We send personalized, branded birthday, anniversary, and festival greetings on your
          behalf — automatically, on time, every time — so you never miss a moment that matters to your customers.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Contact us</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Have a question about billing, your account, or anything else? We&rsquo;re happy to help.
        </p>
        <a href="mailto:sales.raregreet@gmail.com" className="text-brand-600 font-medium text-sm">
          sales.raregreet@gmail.com
        </a>
      </div>
    </div>
  );
}
