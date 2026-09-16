export default function DashboardContactUsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contact us</h1>

      <div className="card p-6 space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Have a question about billing, your account, or anything else? We&rsquo;re happy to help.
        </p>
        <div>
          <a href="mailto:sales.raregreet@gmail.com" className="block text-brand-600 font-medium text-sm">
            sales.raregreet@gmail.com
          </a>
          <a href="https://wa.me/919270299601" className="block text-brand-600 font-medium text-sm mt-1">
            WhatsApp: +91 92702 99601
          </a>
        </div>
      </div>
    </div>
  );
}
