import Link from 'next/link';
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton';
import SiteFooter from '@/components/SiteFooter';
import { getAllBlogPosts } from '@/lib/blogPosts';

export const metadata = {
  title: 'Blog — raregreet.com',
  description:
    'Ideas and guides on keeping customers close with automated WhatsApp birthday, anniversary and festival greetings.',
};

function SiteHeader() {
  return (
    <header className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-y-3 px-4 sm:px-6 py-4 sm:py-6">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <img src="/logo.png" alt="raregreet.com" width={36} height={36} className="rounded-lg" />
        <div className="text-lg sm:text-xl font-bold text-brand-700 whitespace-nowrap">
          raregreet<span className="text-gray-400">.com</span>
        </div>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link href="/login" className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
          Log in
        </Link>
        <Link href="/register" className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
          <span className="sm:hidden">Get started</span>
          <span className="hidden sm:inline">Get started free</span>
        </Link>
      </nav>
    </header>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const dynamic = 'force-dynamic';

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <SiteHeader />

      <section className="max-w-4xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Blog</h1>
        <p className="text-gray-600 mb-10">
          Ideas on keeping customers close, without extra work every day.
        </p>

        <div className="grid gap-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card p-6 block hover:shadow-md">
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="font-medium text-brand-600">{post.category}</span>
                <span>&middot;</span>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span>&middot;</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-600 leading-relaxed">{post.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFloatButton />
    </main>
  );
}
