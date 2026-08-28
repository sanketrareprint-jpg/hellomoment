'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import DeleteTemplateButton from '@/components/DeleteTemplateButton';

const OCCASION_LABEL: Record<string, string> = {
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  FESTIVAL: 'Festival',
};

export interface TemplateRow {
  id: string;
  name: string;
  occasion: string;
  backgroundUrl: string;
  isDefault: boolean;
}

export default function TemplatesGrid({ templates }: { templates: TemplateRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || (OCCASION_LABEL[t.occasion] ?? t.occasion).toLowerCase().includes(q)
    );
  }, [templates, query]);

  return (
    <div>
      <div className="relative max-w-sm mb-5">
        <input
          className="input pl-9"
          type="search"
          placeholder="Search templates by name or occasion…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <svg
          className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">No templates match &ldquo;{query}&rdquo;.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <div key={t.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.backgroundUrl} alt={t.name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  {t.isDefault && (
                    <span className="text-xs font-medium bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{OCCASION_LABEL[t.occasion] ?? t.occasion}</p>
                <div className="flex gap-3 mt-3">
                  <Link href={`/dashboard/templates/${t.id}/edit`} className="text-brand-600 font-medium text-sm">
                    Edit
                  </Link>
                  <DeleteTemplateButton id={t.id} name={t.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
