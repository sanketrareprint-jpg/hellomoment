import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { contentToLines } from '@/lib/blogPosts';
import { slugify } from '@/lib/slug';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const data: {
    title?: string;
    slug?: string;
    description?: string;
    content?: string;
    category?: string;
    readTime?: string;
    isPublished?: boolean;
    publishedAt?: Date;
  } = {};

  if (typeof body.title === 'string') {
    if (!body.title.trim()) return NextResponse.json({ error: 'Title cannot be empty.' }, { status: 400 });
    data.title = body.title.trim();
  }
  if (typeof body.slug === 'string') {
    const slug = slugify(body.slug);
    if (!slug) return NextResponse.json({ error: 'Slug cannot be empty.' }, { status: 400 });
    data.slug = slug;
  }
  if (typeof body.description === 'string') {
    if (!body.description.trim()) return NextResponse.json({ error: 'Description cannot be empty.' }, { status: 400 });
    data.description = body.description.trim();
  }
  if (typeof body.content === 'string') {
    const content = contentToLines(body.content);
    if (!content) return NextResponse.json({ error: 'Content cannot be empty.' }, { status: 400 });
    data.content = content;
  }
  if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim();
  if (typeof body.readTime === 'string' && body.readTime.trim()) data.readTime = body.readTime.trim();
  if (typeof body.isPublished === 'boolean') data.isPublished = body.isPublished;
  if (typeof body.publishedAt === 'string' && !Number.isNaN(Date.parse(body.publishedAt))) {
    data.publishedAt = new Date(body.publishedAt);
  }

  try {
    const post = await prisma.blogPost.update({ where: { id: params.id }, data });
    return NextResponse.json({ post });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: `A post with slug "${data.slug}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  try {
    await prisma.blogPost.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }
}
