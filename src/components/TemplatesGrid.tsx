'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeleteTemplateButton from '@/components/DeleteTemplateButton';
import FlyerPreviewThumbnail from '@/components/FlyerPreviewThumbnail';
import type { BrandInfo } from '@/components/TemplatePlaceholderEditor';
import type { LogoPlaceholder, TextPlaceholder } from '@/lib/flyerPlaceholders';

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
  canvasWidth: number;
  canvasHeight: number;
  isDefault: boolean;
  // This template's own branding placeholders — already "mapped" per
  // template in the DB — used to overlay the logged-in business's real
  // Brand kit onto the thumbnail below instead of just the flat artwork.
  logoPlaceholder: LogoPlaceholder | null;
  firmNamePlaceholder: TextPlaceholder | null;
  phonePlaceholder: TextPlaceholder | null;
  emailPlaceholder: TextPlaceholder | null;
  addressPlaceholder: TextPlaceholder | null;
  websitePlaceholder: TextPlaceholder | null;
  productsPlaceholder: TextPlaceholder | null;
  phoneTextOverride: string | null;
  emailTextOverride: string | null;
  addressTextOverride: string | null;
  websiteTextOverride: string | null;
  productsTextOverride: string | null;
}

export default function TemplatesGrid({ templates, business }: { templates: TemplateRow[]; business: BrandInfo }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  async function setDefault(id: string) {
    setSettingDefault(id);
    try {
      const res = await fetch(`/api/templates/${id}/set-default`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Could not set as default');
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not set as default');
    } finally {
      setSettingDefault(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || (OCCASION_LABEL[t.occasion] ?? t.occasion).toLowerCase().includes(q)
    );
  }, [templates, query]);

  return (
    <div>
      <div className="relative max-w-sm mb-3">
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
        <div className="card p-6 text-center text-gray-500 text-sm">No templates match &ldquo;{query}&rdquo;.</div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {filtered.map((t) => (
            <div key={t.id} className="card overflow-hidden flex flex-col">
              <div className="w-full h-36 bg-gray-100 overflow-hidden">
                <FlyerPreviewThumbnail
                  className="w-full h-full"
                  backgroundUrl={t.backgroundUrl}
                  canvasWidth={t.canvasWidth}
                  canvasHeight={t.canvasHeight}
                  business={business}
                  logoPlaceholder={t.logoPlaceholder}
                  firmNamePlaceholder={t.firmNamePlaceholder}
                  phonePlaceholder={t.phonePlaceholder}
                  emailPlaceholder={t.emailPlaceholder}
                  addressPlaceholder={t.addressPlaceholder}
                  websitePlaceholder={t.websitePlaceholder}
                  productsPlaceholder={t.productsPlaceholder}
                  phoneTextOverride={t.phoneTextOverride}
                  emailTextOverride={t.emailTextOverride}
                  addressTextOverride={t.addressTextOverride}
                  websiteTextOverride={t.websiteTextOverride}
                  productsTextOverride={t.productsTextOverride}
                />
              </div>
              <div className="p-2.5">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{t.name}</h3>
                  {t.isDefault && (
                    <span className="shrink-0 text-[10px] font-medium bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{OCCASION_LABEL[t.occasion] ?? t.occasion}</p>
                <div className="flex gap-2 mt-1.5 items-center flex-wrap text-xs">
                  <Link href={`/dashboard/templates/${t.id}/edit`} className="text-brand-600 font-medium">
                    Edit
                  </Link>
                  <DeleteTemplateButton id={t.id} name={t.name} />
                  {!t.isDefault && (
                    <button
                      type="button"
                      className="text-brand-600 font-medium disabled:opacity-50"
                      disabled={settingDefault === t.id}
                      onClick={() => setDefault(t.id)}
                    >
                      {settingDefault === t.id ? 'Setting…' : 'Set default'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
