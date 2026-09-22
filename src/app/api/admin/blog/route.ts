import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { contentToLines } from '@/lib/blogPosts';
import { slugify } from '@/lib/slug';

export async function GET(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const posts = await prisma.blogPost.findMany({ orderBy: { publishedAt: 'desc' } });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const content = typeof body.content === 'string' ? contentToLines(body.content) : '';
  if (!title || !description || !content) {
    return NextResponse.json({ error: 'Title, description and content are required.' }, { status: 400 });
  }

  const slug = (typeof body.slug === 'string' && body.slug.trim() ? slugify(body.slug) : slugify(title)) || slugify(title);
  if (!slug) {
    return NextResponse.json({ error: 'Could not derive a slug — enter one manually.' }, { status: 400 });
  }

  const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'Marketing';
  const readTime = typeof body.readTime === 'string' && body.readTime.trim() ? body.readTime.trim() : '3 min read';
  const isPublished = typeof body.isPublished === 'boolean' ? body.isPublished : true;
  const publishedAt = typeof body.publishedAt === 'string' && !Number.isNaN(Date.parse(body.publishedAt))
    ? new Date(body.publishedAt)
    : new Date();

  try {
    const post = await prisma.blogPost.create({
      data: { title, slug, description, content, category, readTime, isPublished, publishedAt },
    });
    return NextResponse.json({ post });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: `A post with slug "${slug}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not create the post.' }, { status: 400 });
  }
}
