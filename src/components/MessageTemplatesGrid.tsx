'use client';

import { useMemo, useState } from 'react';

const OCCASION_LABEL: Record<string, string> = {
  ALL: 'Any occasion',
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  FESTIVAL: 'Festival',
};

export interface MessageTemplateRow {
  id: string;
  name: string;
  occasion: string;
  campaignName: string;
  bodyText: string;
}

/**
 * Read-only library of the WhatsApp message templates admin has curated —
 * lets a business see exactly what a campaign says before picking it for a
 * flyer template (Advanced options → Select a text template), the same way
 * AiSensy's own "Template Messages" screen shows a template's wording.
 * Businesses can't add or edit these here; only admin can (see
 * /admin/message-templates).
 */
export default function MessageTemplatesGrid({ templates }: { templates: MessageTemplateRow[] }) {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (OCCASION_LABEL[t.occasion] ?? t.occasion).toLowerCase().includes(q) ||
        t.campaignName.toLowerCase().includes(q)
    );
  }, [templates, query]);

  async function copyCampaignName(t: MessageTemplateRow) {
    try {
      await navigator.clipboard.writeText(t.campaignName);
      setCopiedId(t.id);
      setTimeout(() => setCopiedId((id) => (id === t.id ? null : id)), 1500);
    } catch {
      // Clipboard access can be denied by the browser — nothing to recover
      // from here, the campaign name is still shown on screen to copy by hand.
    }
  }

  return (
    <div>
      <div className="relative max-w-sm mb-5">
        <input
          className="input pl-9"
          type="search"
          placeholder="Search message templates…"
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
        <div className="card p-10 text-center text-gray-500">No message templates match &ldquo;{query}&rdquo;.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                <span className="text-xs font-medium bg-brand-100 text-brand-700 rounded-full px-2 py-0.5 whitespace-nowrap">
                  {OCCASION_LABEL[t.occasion] ?? t.occasion}
                </span>
              </div>
              <div className="mt-2 rounded-xl bg-[#dcf8c6] px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {t.bodyText}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500 truncate">
                  Campaign: <span className="font-mono">{t.campaignName}</span>
                </p>
                <button
                  type="button"
                  onClick={() => copyCampaignName(t)}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap"
                >
                  {copiedId === t.id ? 'Copied!' : 'Copy name'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-4">
        To use one, open a flyer template (or create a new one), expand <strong>+ Advanced options</strong>, and pick
        it from <strong>Select a text template</strong> — that fills in the AiSensy campaign name for you. You still
        need a &ldquo;Live&rdquo; campaign of that exact name and wording approved in your own AiSensy account.
      </p>
    </div>
  );
}
