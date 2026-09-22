'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/slug';

export interface BlogPostFormValues {
  id: string;
  slug: string;
  title: string;
  description: string;
  contentText: string; // one block per line
  category: string;
  readTime: string;
  isPublished: boolean;
  publishedAtDate: string; // yyyy-mm-dd, for an <input type="date">
}

export default function BlogPostForm({ initial }: { initial?: BlogPostFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [contentText, setContentText] = useState(initial?.contentText ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Marketing');
  const [readTime, setReadTime] = useState(initial?.readTime ?? '3 min read');
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [publishedAtDate, setPublishedAtDate] = useState(
    initial?.publishedAtDate ?? new Date().toISOString().slice(0, 10),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !slug.trim() || !description.trim() || !contentText.trim()) {
      setError('Title, slug, description and content are all required.');
      return;
    }

    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        content: contentText,
        category: category.trim() || 'Marketing',
        readTime: readTime.trim() || '3 min read',
        isPublished,
        publishedAt: new Date(publishedAtDate).toISOString(),
      };
      const res = await fetch(isEdit ? `/api/admin/blog/${initial!.id}` : '/api/admin/blog', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      router.push('/admin/blog');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="label">Title</label>
        <input
          className="input"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="How Automated Birthday Wishes Bring Customers Back"
        />
      </div>

      <div>
        <label className="label">Slug</label>
        <input
          className="input font-mono text-sm"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="how-automated-birthday-wishes-bring-customers-back"
        />
        <p className="text-xs text-gray-500 mt-1">Shown in the URL: raregreet.com/blog/{slug || '<slug>'}</p>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One or two sentences shown on the blog index and in search results."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className="label">Read time</label>
          <input className="input" value={readTime} onChange={(e) => setReadTime(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={publishedAtDate}
            onChange={(e) => setPublishedAtDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Published (visible on the public blog)
          </label>
        </div>
      </div>

      <div>
        <label className="label">Content</label>
        <textarea
          className="input font-mono text-sm"
          rows={16}
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          placeholder={'One block per line.\n## A subheading\nA normal paragraph.\n- A bullet point\n- Another bullet point'}
        />
        <p className="text-xs text-gray-500 mt-1">
          One block per line. A line starting with <code className="font-mono">## </code> becomes a subheading, one
          starting with <code className="font-mono">- </code> becomes a bullet (consecutive bullet lines group into
          one list) — anything else is a paragraph.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create post'}
        </button>
      </div>
    </form>
  );
}
