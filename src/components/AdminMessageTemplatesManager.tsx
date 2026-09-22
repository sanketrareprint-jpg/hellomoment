'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MessageTemplateEditor, { type MessageTemplateDraft } from '@/components/MessageTemplateEditor';
import {
  OCCASION_LABELS,
  renderPreview,
  validateTemplateBody,
  type MessageTemplateOccasion,
  type MessageTemplateStatus,
  type MessageVariable,
} from '@/lib/messageTemplateVars';

export interface AdminMessageTemplateRow {
  id: string;
  category: 'GENERAL' | 'SPECIAL' | 'CUSTOM';
  name: string;
  occasion: MessageTemplateOccasion;
  body: string;
  variables: MessageVariable[];
  aisensyCampaignName: string | null;
  isActive: boolean;
  order: number;
  status: MessageTemplateStatus;
  rejectionReason: string | null;
  businessName: string | null;
  businessId: string | null;
  submittedAt: string | null;
  pricePaise: number;
  paymentMethod: string | null;
}

type AdminDraft = MessageTemplateDraft & {
  category: 'GENERAL' | 'SPECIAL';
  aisensyCampaignName: string;
  isActive: boolean;
  order: number;
};

const EMPTY: AdminDraft = {
  name: '',
  occasion: 'ANY',
  body: '',
  variables: [],
  category: 'GENERAL',
  aisensyCampaignName: '',
  isActive: true,
  order: 0,
};

const STATUS_STYLES: Record<MessageTemplateStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export default function AdminMessageTemplatesManager({
  templates,
  pricePaise,
}: {
  templates: AdminMessageTemplateRow[];
  pricePaise: number;
}) {
  const router = useRouter();
  const [section, setSection] = useState<'SUBMISSIONS' | 'LIBRARY'>('SUBMISSIONS');
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [editing, setEditing] = useState<{ id: string | null; draft: AdminDraft } | null>(null);
  const [price, setPrice] = useState(String(pricePaise / 100));
  const [campaignInputs, setCampaignInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const library = templates.filter((t) => t.category !== 'CUSTOM');
  const submissions = templates.filter(
    (t) => t.category === 'CUSTOM' && t.status !== 'DRAFT' && (filter === 'ALL' || t.status === filter)
  );

  async function run(fn: () => Promise<void>, success?: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (success) setNotice(success);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  function savePrice(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(price);
    if (!Number.isFinite(n) || n < 0) {
      setError('Enter a valid price.');
      return;
    }
    run(() => call('/api/admin/message-templates/settings', 'PUT', { customTemplatePriceRupees: n }), 'Price saved.');
  }

  function saveLibrary() {
    if (!editing) return;
    const bodyError = validateTemplateBody(editing.draft.body, editing.draft.variables);
    if (bodyError) {
      setError(bodyError);
      return;
    }
    run(async () => {
      if (editing.id) await call(`/api/admin/message-templates/${editing.id}`, 'PUT', editing.draft);
      else await call('/api/admin/message-templates', 'POST', editing.draft);
      setEditing(null);
    }, 'Template saved.');
  }

  function remove(t: AdminMessageTemplateRow) {
    if (!confirm(`Delete "${t.name}"? Businesses using it go back to the default message.`)) return;
    run(() => call(`/api/admin/message-templates/${t.id}`, 'DELETE'), 'Template deleted.');
  }

  function approve(t: AdminMessageTemplateRow) {
    const aisensyCampaignName = (campaignInputs[t.id] ?? t.aisensyCampaignName ?? '').trim();
    if (!aisensyCampaignName) {
      setError('Enter the AiSensy campaign name created for this template before approving.');
      return;
    }
    run(
      () => call(`/api/admin/message-templates/${t.id}/review`, 'POST', { action: 'APPROVE', aisensyCampaignName }),
      `"${t.name}" approved.`
    );
  }

  function reject(t: AdminMessageTemplateRow) {
    const rejectionReason = prompt(`Why is "${t.name}" rejected? The business will see this.`);
    if (!rejectionReason?.trim()) return;
    run(
      () => call(`/api/admin/message-templates/${t.id}/review`, 'POST', { action: 'REJECT', rejectionReason }),
      `"${t.name}" rejected.`
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={savePrice} className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Custom template price (₹)</label>
          <input className="input w-40" type="number" min={0} step="1" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          Save price
        </button>
        <p className="text-xs text-gray-500">
          What a business pays to submit one custom message template for approval. 0 = free.
        </p>
      </form>

      {notice && <div className="text-sm text-green-700">{notice}</div>}
      {error && !editing && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-1 border-b border-gray-200">
        {(
          [
            ['SUBMISSIONS', 'Custom template submissions'],
            ['LIBRARY', 'General & special templates'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px ' +
              (section === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700')
            }
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'SUBMISSIONS' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  'text-xs font-medium rounded-full px-3 py-1 border ' +
                  (filter === f ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300')
                }
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {submissions.length === 0 ? (
            <div className="card p-6 text-sm text-gray-500 text-center">Nothing here.</div>
          ) : (
            submissions.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">
                      {t.businessName ?? 'Unknown business'} · {OCCASION_LABELS[t.occasion]}
                      {t.submittedAt && ` · submitted ${new Date(t.submittedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`}
                      {` · paid ${t.pricePaise > 0 ? `₹${(t.pricePaise / 100).toFixed(2)}` : 'nothing'}`}
                      {t.paymentMethod && t.pricePaise > 0 && ` (${t.paymentMethod.toLowerCase()})`}
                    </div>
                  </div>
                  <span className={'text-xs font-medium rounded-full px-2 py-0.5 ' + STATUS_STYLES[t.status]}>{t.status}</span>
                </div>
                <pre className="mt-2 text-sm text-gray-800 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-2">{t.body}</pre>
                {t.variables.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
                    {t.variables.map((v) => (
                      <li key={v.index}>
                        <span className="font-mono">{`{{${v.index}}}`}</span> {v.label} — {v.source.replace('_', ' ').toLowerCase()}
                        {v.sample && ` (e.g. "${v.sample}")`}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Sample:{' '}
                  {renderPreview(t.body, t.variables, Object.fromEntries(t.variables.map((v) => [String(v.index), v.sample ?? ''])))}
                </div>
                {t.status === 'REJECTED' && t.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1">Rejected: {t.rejectionReason}</p>
                )}
                <div className="flex flex-wrap items-end gap-2 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">AiSensy campaign name</label>
                    <input
                      className="input w-56"
                      value={campaignInputs[t.id] ?? t.aisensyCampaignName ?? ''}
                      onChange={(e) => setCampaignInputs({ ...campaignInputs, [t.id]: e.target.value })}
                      placeholder="Live campaign for this text"
                    />
                  </div>
                  <button type="button" className="btn-primary" disabled={busy} onClick={() => approve(t)}>
                    {t.status === 'APPROVED' ? 'Update' : 'Approve'}
                  </button>
                  {t.status !== 'REJECTED' && (
                    <button type="button" className="btn-secondary" disabled={busy} onClick={() => reject(t)}>
                      Reject
                    </button>
                  )}
                  <button type="button" className="btn-danger" disabled={busy} onClick={() => remove(t)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === 'LIBRARY' && (
        <div className="space-y-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setError(null);
              setEditing({ id: null, draft: EMPTY });
            }}
          >
            + Add template
          </button>
          {library.length === 0 ? (
            <div className="card p-6 text-sm text-gray-500 text-center">No general or special templates yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {library.map((t) => (
                <div key={t.id} className="card p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <span
                      className={
                        'text-[11px] font-medium rounded-full px-2 py-0.5 ' +
                        (t.category === 'SPECIAL' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-brand-50 text-brand-700')
                      }
                    >
                      {t.category === 'SPECIAL' ? 'Special' : 'General'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {OCCASION_LABELS[t.occasion]} · campaign {t.aisensyCampaignName} · order {t.order}
                    {!t.isActive && ' · hidden'}
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap flex-1">
                    {renderPreview(t.body, t.variables, Object.fromEntries(t.variables.map((v) => [String(v.index), v.sample ?? ''])))}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setError(null);
                        setEditing({
                          id: t.id,
                          draft: {
                            name: t.name,
                            occasion: t.occasion,
                            body: t.body,
                            variables: t.variables,
                            category: t.category === 'SPECIAL' ? 'SPECIAL' : 'GENERAL',
                            aisensyCampaignName: t.aisensyCampaignName ?? '',
                            isActive: t.isActive,
                            order: t.order,
                          },
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="btn-danger" disabled={busy} onClick={() => remove(t)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">{editing.id ? 'Edit template' : 'Add template'}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={editing.draft.category}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, category: e.target.value as AdminDraft['category'] } })
                  }
                >
                  <option value="GENERAL">General — all variables auto-filled</option>
                  <option value="SPECIAL">Special — business fills in some variables</option>
                </select>
              </div>
              <div>
                <label className="label">AiSensy campaign name</label>
                <input
                  className="input"
                  value={editing.draft.aisensyCampaignName}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, aisensyCampaignName: e.target.value } })}
                  placeholder="Live campaign using this exact text"
                />
              </div>
              <div>
                <label className="label">Display order</label>
                <input
                  className="input"
                  type="number"
                  value={editing.draft.order}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, order: Number(e.target.value) || 0 } })}
                />
              </div>
            </div>
            <MessageTemplateEditor
              value={editing.draft}
              onChange={(d) => setEditing({ ...editing, draft: { ...editing.draft, ...d } })}
            />
            <p className="text-xs text-gray-500">
              The AiSensy campaign&apos;s template must have an image header (for the flyer) and exactly this body text,
              with the same {'{{n}}'} variables in the same order.
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editing.draft.isActive}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, isActive: e.target.checked } })}
              />
              Active (offered to businesses)
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" className="btn-primary" disabled={busy} onClick={saveLibrary}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
