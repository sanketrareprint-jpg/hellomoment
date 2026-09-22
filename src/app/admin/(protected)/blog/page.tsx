import Link from 'next/link';
import { prisma } from '@/lib/db';
import DeleteBlogPostButton from '@/components/DeleteBlogPostButton';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { publishedAt: 'desc' } });

  return (
    <div>
      <Link href="/admin" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-3 hover:gap-2 transition-all">
        ← Back to businesses
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-0.5">
        <h1 className="text-xl font-bold text-gray-900">Blog posts</h1>
        <Link href="/admin/blog/new" className="btn-primary">
          + New post
        </Link>
      </div>
      <p className="text-gray-600 text-sm mb-3">
        Posts shown at raregreet.com/blog. A draft is saved here but not visible on the public site until published.
      </p>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Title</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Category</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Date</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Status</th>
              <th className="px-4 py-2 font-medium whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-2 font-medium text-gray-900 max-w-sm">
                  <div>{post.title}</div>
                  <div className="text-xs text-gray-400 font-normal">/blog/{post.slug}</div>
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{post.category}</td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {new Date(post.publishedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span
                    className={
                      'text-xs font-medium rounded-full px-2 py-0.5 ' +
                      (post.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')
                    }
                  >
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/blog/${post.id}/edit`} className="text-brand-600 hover:underline font-medium">
                      Edit
                    </Link>
                    <DeleteBlogPostButton id={post.id} title={post.title} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No blog posts yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
