import Link from 'next/link';
import { notFound } from 'next/navigation';
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton';
import SiteFooter from '@/components/SiteFooter';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/blogPosts';

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

type ContentBlock = { type: 'h2'; text: string } | { type: 'ul'; items: string[] } | { type: 'p'; text: string };

/** Groups raw content lines into headings/paragraphs/lists, merging consecutive "- " lines into one list. */
function groupBlocks(lines: string[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const line of lines) {
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (line.startsWith('- ')) {
      const last = blocks[blocks.length - 1];
      if (last?.type === 'ul') {
        last.items.push(line.slice(2));
      } else {
        blocks.push({ type: 'ul', items: [line.slice(2)] });
      }
    } else {
      blocks.push({ type: 'p', text: line });
    }
  }
  return blocks;
}

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} — raregreet.com Blog`,
    description: post.description,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <SiteHeader />

      <article className="max-w-2xl mx-auto px-6 pt-6 pb-20">
        <Link href="/blog" className="text-sm text-brand-600 font-medium hover:underline">
          &larr; Back to blog
        </Link>

        <div className="flex items-center gap-3 text-xs text-gray-500 mt-6 mb-3">
          <span className="font-medium text-brand-600">{post.category}</span>
          <span>&middot;</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>&middot;</span>
          <span>{post.readTime}</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-6">{post.title}</h1>

        <div className="card p-6 space-y-4 text-gray-700 leading-relaxed">
          {groupBlocks(post.content).map((block, i) => {
            if (block.type === 'h2') {
              return (
                <h2 key={i} className="text-lg font-bold text-gray-900 pt-2">
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'ul') {
              return (
                <ul key={i} className="list-disc pl-5 space-y-1.5">
                  {block.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              );
            }
            return <p key={i}>{block.text}</p>;
          })}
        </div>

        <div className="card p-6 mt-8 bg-brand-50/50 border-brand-100">
          <p className="text-gray-700 mb-3">
            Ready to send birthday, anniversary and festival wishes on WhatsApp automatically?
          </p>
          <Link href="/register" className="btn-primary text-sm px-4 py-2 inline-flex">
            Get started free
          </Link>
        </div>
      </article>

      <SiteFooter />
      <WhatsAppFloatButton />
    </main>
  );
}
