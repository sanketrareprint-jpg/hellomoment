import FramePlaceholderEditor from '@/components/FramePlaceholderEditor';

export default function NewAdminFramePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New frame</h1>
      <FramePlaceholderEditor
        showPerBusinessOptions={false}
        apiBase="/api/admin/frames"
        uploadUrl="/api/admin/uploads/frame"
        redirectPath="/admin/frames"
      />
    </div>
  );
}
