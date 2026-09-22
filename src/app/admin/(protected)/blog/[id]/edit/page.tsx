import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import BlogPostForm from '@/components/BlogPostForm';

export const dynamic = 'force-dynamic';

export default async function AdminEditBlogPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  return (
    <div>
      <Link href="/admin/blog" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-3 hover:gap-2 transition-all">
        ← Back to blog posts
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-3">Edit blog post</h1>
      <BlogPostForm
        initial={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          description: post.description,
          contentText: post.content,
          category: post.category,
          readTime: post.readTime,
          isPublished: post.isPublished,
          publishedAtDate: post.publishedAt.toISOString().slice(0, 10),
        }}
      />
    </div>
  );
}
