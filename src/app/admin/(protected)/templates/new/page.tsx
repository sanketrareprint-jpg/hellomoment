import TemplatePlaceholderEditor from '@/components/TemplatePlaceholderEditor';

export default function NewAdminTemplatePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New starter template</h1>
      {/* Branding placeholders (logo/firm name/phone/address/products) are
          shown here because these designs get copied into every business's
          own templates, where each business's actual brand kit fills them
          in — there's no specific business to preview against here, so the
          preview falls back to generic placeholder text/blank logo. */}
      <TemplatePlaceholderEditor
        showBranding
        showPerBusinessOptions={false}
        apiBase="/api/admin/starter-templates"
        uploadUrl="/api/admin/uploads/template"
        redirectPath="/admin/templates"
      />
    </div>
  );
}
