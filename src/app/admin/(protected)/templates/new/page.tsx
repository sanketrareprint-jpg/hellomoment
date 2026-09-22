import { prisma } from '@/lib/db';
import TemplatePlaceholderEditor from '@/components/TemplatePlaceholderEditor';

export default async function NewAdminTemplatePage() {
  // Offered as a "preview with a business's saved details" picker below —
  // these designs get copied into every business's own templates, where
  // each business's actual Brand kit fills them in; there's no specific
  // business to preview against by default, so the preview otherwise falls
  // back to generic placeholder text/blank logo.
  const businesses = await prisma.business.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New starter template</h1>
      <TemplatePlaceholderEditor
        showBranding
        showPerBusinessOptions={false}
        businesses={businesses}
        apiBase="/api/admin/starter-templates"
        uploadUrl="/api/admin/uploads/template"
        redirectPath="/admin/templates"
      />
    </div>
  );
}
