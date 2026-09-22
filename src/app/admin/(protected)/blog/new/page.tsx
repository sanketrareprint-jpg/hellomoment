import Link from 'next/link';
import BlogPostForm from '@/components/BlogPostForm';

export default function AdminNewBlogPostPage() {
  return (
    <div>
      <Link href="/admin/blog" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-3 hover:gap-2 transition-all">
        ← Back to blog posts
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-3">New blog post</h1>
      <BlogPostForm />
    </div>
  );
}
