'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MessageTemplateEditor, { type MessageTemplateDraft } from '@/components/MessageTemplateEditor';
import {
  OCCASION_LABELS,
  SEND_OCCASIONS,
  inputVariables,
  renderPreview,
  templateFitsOccasion,
  validateTemplateBody,
  type MessageTemplateCategory,
  type MessageTemplateOccasion,
  type MessageTemplateStatus,
  type MessageVariable,
  type SendOccasion,
} from '@/lib/messageTemplateVars';

export interface MessageTemplateRow {
  id: string;
  category: MessageTemplateCategory;
  name: string;
  occasion: MessageTemplateOccasion;
  body: string;
  variables: MessageVariable[];
  status: MessageTemplateStatus;
  rejectionReason: string | null;
  paid: boolean;
  usable: boolean;
}

export interface MessageTemplateSelectionRow {
  occasion: SendOccasion;
  messageTemplateId: string;
  variableValues: Record<string, string>;
}

type Tab = 'GENERAL' | 'SPECIAL' | 'CUSTOM';

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'GENERAL', label: 'General', hint: 'Ready-made messages — every detail is filled in automatically. Just pick one.' },
  {
    key: 'SPECIAL',
    label: 'Special offers',
    hint: 'Ready-made messages with blanks you fill in yourself — like your offer, discount, or coupon code.',
  },
  {
    key: 'CUSTOM',
    label: 'My custom templates',
    hint: 'Write your own message. It is reviewed and approved before you can send it.',
  },
];

const STATUS_STYLES: Record<MessageTemplateStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<MessageTemplateStatus, string> = {
  DRAFT: 'Draft — not submitted',
  PENDING: 'Pending approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const EMPTY_DRAFT: MessageTemplateDraft = { name: '', occasion: 'ANY', body: '', variables: [] };

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function rupees(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function MessageTemplatesWorkspace({
  templates,
  selections,
  pricePaise,
  walletBalancePaise,
  business,
}: {
  templates: MessageTemplateRow[];
  selections: MessageTemplateSelectionRow[];
  pricePaise: number;
  walletBalancePaise: number;
  business: { name: string; email: string };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('GENERAL');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // "Use this template" dialog
  const [using, setUsing] = useState<MessageTemplateRow | null>(null);
  const [useOccasion, setUseOccasion] = useState<SendOccasion>('FESTIVAL');
  const [useValues, setUseValues] = useState<Record<string, string>>({});

  // Custom template editor dialog (id null = new)
  const [editing, setEditing] = useState<{ id: string | null; draft: MessageTemplateDraft } | null>(null);

  // Pay & submit dialog
  const [paying, setPaying] = useState<MessageTemplateRow | null>(null);

  const byId = new Map(templates.map((t) => [t.id, t]));
  // Unusable admin templates are only here so the "in use" summary can name
  // a since-removed pick; they aren't offered in the grid.
  const visible = templates.filter((t) => t.category === tab && (t.usable || t.category === 'CUSTOM'));

  function openUse(t: MessageTemplateRow) {
    const occasion = SEND_OCCASIONS.find((o) => templateFitsOccasion(t.occasion, o)) ?? 'FESTIVAL';
    const existing = selections.find((s) => s.occasion === occasion && s.messageTemplateId === t.id);
    setUsing(t);
    setUseOccasion(occasion);
    setUseValues(existing?.variableValues ?? {});
    setError(null);
  }

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

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  function saveSelection() {
    if (!using) return;
    run(async () => {
      await call('/api/message-templates/selection', 'PUT', {
        occasion: useOccasion,
        messageTemplateId: using.id,
        variableValues: useValues,
      });
      setNotice(`"${using.name}" will now be sent with your ${OCCASION_LABELS[useOccasion].toLowerCase()} flyers.`);
      setUsing(null);
    });
  }

  function resetSelection(occasion: SendOccasion) {
    run(async () => {
      await call('/api/message-templates/selection', 'PUT', { occasion, messageTemplateId: null });
      setNotice(`${OCCASION_LABELS[occasion]} flyers are back to the default message.`);
    });
  }

  function saveCustom() {
    if (!editing) return;
    const bodyError = validateTemplateBody(editing.draft.body, editing.draft.variables);
    if (bodyError) {
      setError(bodyError);
      return;
    }
    run(async () => {
      if (editing.id) {
        await call(`/api/message-templates/custom/${editing.id}`, 'PUT', editing.draft);
      } else {
        await call('/api/message-templates/custom', 'POST', editing.draft);
      }
      setEditing(null);
      setTab('CUSTOM');
      setNotice('Saved as a draft. Click "Pay & submit" to send it for approval.');
    });
  }

  function deleteCustom(t: MessageTemplateRow) {
    const warning = t.paid ? ' You have already paid for it — the payment is not refunded.' : '';
    if (!confirm(`Delete "${t.name}"?${warning}`)) return;
    run(async () => {
      await call(`/api/message-templates/custom/${t.id}`, 'DELETE');
    });
  }

  function submitWithWallet(t: MessageTemplateRow) {
    run(async () => {
      await call(`/api/message-templates/custom/${t.id}/submit`, 'POST', { method: 'WALLET' });
      setPaying(null);
      setNotice(`"${t.name}" was submitted for approval.`);
    });
  }

  async function submitOnline(t: MessageTemplateRow) {
    setBusy(true);
    setError(null);
    try {
      const data = await call(`/api/message-templates/custom/${t.id}/submit`, 'POST', { method: 'RAZORPAY' });
      if (data.submitted) {
        setPaying(null);
        setNotice(`"${t.name}" was submitted for approval.`);
        router.refresh();
        setBusy(false);
        return;
      }
      const ready = await loadRazorpayScript();
      if (!ready || !window.Razorpay) throw new Error('Could not load Razorpay checkout. Check your connection and try again.');
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amountPaise,
        currency: 'INR',
        order_id: data.orderId,
        name: 'RareGreet',
        description: `Custom message template: ${t.name}`,
        prefill: { name: business.name, email: business.email },
        theme: { color: '#db2777' },
        handler: async (response: unknown) => {
          try {
            await call(`/api/message-templates/custom/${t.id}/verify`, 'POST', response);
            setPaying(null);
            setNotice(`Payment received — "${t.name}" was submitted for approval.`);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed. Contact support if you were charged.');
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', () => {
        setError('Payment failed. You were not charged.');
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  const customCounts = {
    approved: templates.filter((t) => t.category === 'CUSTOM' && t.status === 'APPROVED').length,
    pending: templates.filter((t) => t.category === 'CUSTOM' && t.status === 'PENDING').length,
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="card p-3 border-green-200 bg-green-50 text-sm text-green-800 flex justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-green-700">
            ×
          </button>
        </div>
      )}
      {error && !using && !editing && !paying && <div className="text-sm text-red-600">{error}</div>}

      <div className="card p-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Message sent with your flyers</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {SEND_OCCASIONS.map((occasion) => {
            const sel = selections.find((s) => s.occasion === occasion);
            const t = sel ? byId.get(sel.messageTemplateId) : undefined;
            return (
              <div key={occasion} className="rounded-xl border border-gray-200 p-3">
                <div className="text-xs text-gray-500">{OCCASION_LABELS[occasion]}</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{t ? t.name : 'Default message'}</div>
                {t && !t.usable && <div className="text-xs text-red-600">No longer available — default is used</div>}
                {t && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => resetSelection(occasion)}
                    className="text-xs text-brand-600 font-medium mt-1 hover:underline"
                  >
                    Reset to default
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={
                  'px-3 py-2 text-sm font-medium border-b-2 -mb-px ' +
                  (tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700')
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'CUSTOM' && (
            <button
              type="button"
              className="btn-primary mb-2"
              onClick={() => {
                setError(null);
                setEditing({ id: null, draft: EMPTY_DRAFT });
              }}
            >
              + Create custom template
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {TABS.find((t) => t.key === tab)?.hint}
          {tab === 'CUSTOM' && (
            <>
              {' '}
              {pricePaise > 0 ? `Submitting costs ${rupees(pricePaise)} per template.` : 'Submitting is currently free.'}{' '}
              {customCounts.approved} approved · {customCounts.pending} pending.
            </>
          )}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="card p-6 text-sm text-gray-500 text-center">
          {tab === 'CUSTOM' ? "You haven't created a custom template yet." : 'No templates here yet — check back soon.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((t) => {
            const inUseFor = selections.filter((s) => s.messageTemplateId === t.id).map((s) => OCCASION_LABELS[s.occasion]);
            const samples = Object.fromEntries(t.variables.map((v) => [String(v.index), v.sample ?? '']));
            return (
              <div key={t.id} className="card p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-brand-50 text-brand-700 whitespace-nowrap">
                    {OCCASION_LABELS[t.occasion]}
                  </span>
                </div>
                {t.category === 'CUSTOM' && (
                  <span className={'self-start text-[11px] font-medium rounded-full px-2 py-0.5 mb-1 ' + STATUS_STYLES[t.status]}>
                    {STATUS_LABELS[t.status]}
                  </span>
                )}
                {t.status === 'REJECTED' && t.rejectionReason && (
                  <p className="text-xs text-red-600 mb-1">Reason: {t.rejectionReason}</p>
                )}
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-5 flex-1">
                  {renderPreview(t.body, t.variables, samples)}
                </p>
                {inputVariables(t.variables).length > 0 && t.category !== 'CUSTOM' && (
                  <p className="text-xs text-gray-400 mt-2">
                    You fill in: {inputVariables(t.variables).map((v) => v.label).join(', ')}
                  </p>
                )}
                {inUseFor.length > 0 && <p className="text-xs text-green-700 mt-2">In use for: {inUseFor.join(', ')}</p>}

                <div className="flex flex-wrap gap-2 mt-3">
                  {t.usable && (
                    <button type="button" className="btn-primary" disabled={busy} onClick={() => openUse(t)}>
                      Use this
                    </button>
                  )}
                  {t.category === 'CUSTOM' && (t.status === 'DRAFT' || t.status === 'REJECTED') && (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy}
                        onClick={() => {
                          setError(null);
                          setPaying(t);
                        }}
                      >
                        {t.paid ? 'Resubmit' : 'Pay & submit'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => {
                          setError(null);
                          setEditing({
                            id: t.id,
                            draft: { name: t.name, occasion: t.occasion, body: t.body, variables: t.variables },
                          });
                        }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                  {t.category === 'CUSTOM' && (
                    <button type="button" className="btn-secondary" disabled={busy} onClick={() => deleteCustom(t)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {using && (
        <Modal title={`Use "${using.name}"`} onClose={() => setUsing(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Send this message with my</label>
              <select
                className="input"
                value={useOccasion}
                onChange={(e) => setUseOccasion(e.target.value as SendOccasion)}
              >
                {SEND_OCCASIONS.filter((o) => templateFitsOccasion(using.occasion, o)).map((o) => (
                  <option key={o} value={o}>
                    {OCCASION_LABELS[o]} flyers
                  </option>
                ))}
              </select>
            </div>
            {inputVariables(using.variables).map((v) => (
              <div key={v.index}>
                <label className="label">{v.label}</label>
                <input
                  className="input"
                  value={useValues[String(v.index)] ?? ''}
                  onChange={(e) => setUseValues({ ...useValues, [String(v.index)]: e.target.value })}
                  placeholder={v.sample ? `e.g. ${v.sample}` : ''}
                />
              </div>
            ))}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Preview</div>
              <div className="rounded-xl bg-[#e7ffdb] border border-green-200 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                {renderPreview(using.body, using.variables, useValues, {
                  contactName: 'Priya',
                  occasionWord: useOccasion === 'FESTIVAL' ? 'Diwali' : OCCASION_LABELS[useOccasion],
                  businessName: business.name,
                  dateText: '25 August',
                })}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" className="btn-primary" disabled={busy} onClick={saveSelection}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setUsing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit custom template' : 'Create custom template'} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <MessageTemplateEditor value={editing.draft} onChange={(draft) => setEditing({ ...editing, draft })} />
            <p className="text-xs text-gray-500">
              Variables &quot;Filled in by the business&quot; are typed in by you each time you pick this template (e.g. a
              new offer). {pricePaise > 0 && `Submitting for approval costs ${rupees(pricePaise)}.`}
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" className="btn-primary" disabled={busy} onClick={saveCustom}>
                {busy ? 'Saving…' : 'Save draft'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {paying && (
        <Modal title={paying.paid ? `Resubmit "${paying.name}"` : `Pay & submit "${paying.name}"`} onClose={() => setPaying(null)}>
          <div className="space-y-4">
            {paying.paid || pricePaise === 0 ? (
              <p className="text-sm text-gray-600">
                {paying.paid ? "You've already paid for this template — resubmitting is free." : 'Submitting is currently free.'}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Submitting a custom template for approval costs <strong>{rupees(pricePaise)}</strong>. Once approved,
                you can start sending it with your flyers.
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-wrap gap-3">
              {paying.paid || pricePaise === 0 ? (
                <button type="button" className="btn-primary" disabled={busy} onClick={() => submitWithWallet(paying)}>
                  {busy ? 'Submitting…' : 'Submit for approval'}
                </button>
              ) : (
                <>
                  <button type="button" className="btn-primary" disabled={busy} onClick={() => submitOnline(paying)}>
                    {busy ? 'Please wait…' : `Pay ${rupees(pricePaise)} online`}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy || walletBalancePaise < pricePaise}
                    onClick={() => submitWithWallet(paying)}
                    title={walletBalancePaise < pricePaise ? 'Not enough wallet balance' : undefined}
                  >
                    Pay from wallet ({rupees(walletBalancePaise)})
                  </button>
                </>
              )}
              <button type="button" className="btn-secondary" onClick={() => setPaying(null)}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
