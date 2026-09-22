import { prisma } from './db';
import type { BlogPost as BlogPostRow } from '@prisma/client';

export { slugify } from './slug';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  readTime: string;
  category: string;
  isPublished: boolean;
  /**
   * Simple markdown-ish body: each string is one block. A block starting
   * with "## " renders as a subheading, one starting with "- " starts a
   * bullet list item, everything else is a paragraph. Kept this minimal
   * on purpose instead of pulling in an MDX pipeline for a handful of posts.
   */
  content: string[];
}

function toBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: row.publishedAt.toISOString(),
    readTime: row.readTime,
    category: row.category,
    isPublished: row.isPublished,
    content: linesToContent(row.content),
  };
}

/** Splits stored content (one block per line) back into the block array the blog pages render. */
export function linesToContent(stored: string): string[] {
  return stored
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Joins the admin textarea's lines back into the stored, one-block-per-line format. */
export function contentToLines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

/** Public blog index/sitemap — published posts only, newest first. */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
  });
  return rows.map(toBlogPost);
}

/** Public blog post page — returns null for a missing or unpublished slug. */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const row = await prisma.blogPost.findUnique({ where: { slug } });
  if (!row || !row.isPublished) return null;
  return toBlogPost(row);
}
