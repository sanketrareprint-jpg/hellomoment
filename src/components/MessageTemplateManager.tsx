'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  isActive: boolean;
  order: number;
}

const EMPTY_FORM = { name: '', occasion: 'ALL', campaignName: '', bodyText: '' };

export default function MessageTemplateManager({ templates }: { templates: MessageTemplateRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.campaignName.trim() || !form.bodyText.trim()) {
      setError('Name, AiSensy campaign name and message text are all required.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/message-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function patchTemplate(id: string, data: Record<string, unknown>) {
    setRowBusyId(id);
    try {
      const res = await fetch(`/api/admin/message-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setRowBusyId(id);
    try {
      const res = await fetch(`/api/admin/message-templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRowBusyId(null);
    }
  }

  function moveTemplate(index: number, direction: -1 | 1) {
    const target = templates[index + direction];
    const current = templates[index];
    if (!target || !current) return;
    patchTemplate(current.id, { order: target.order });
    patchTemplate(target.id, { order: current.order });
  }

  function startEdit(t: MessageTemplateRow) {
    setEditingId(t.id);
    setEditForm({ name: t.name, occasion: t.occasion, campaignName: t.campaignName, bodyText: t.bodyText });
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim() || !editForm.campaignName.trim() || !editForm.bodyText.trim()) {
      setError('Name, AiSensy campaign name and message text are all required.');
      return;
    }
    await patchTemplate(id, editForm);
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Add a message template</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. hellomomentwishes"
              />
            </div>
            <div>
              <label className="label">Occasion</label>
              <select
                className="input"
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              >
                {Object.entries(OCCASION_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">AiSensy campaign name</label>
            <input
              className="input"
              value={form.campaignName}
              onChange={(e) => setForm({ ...form, campaignName: e.target.value })}
              placeholder="Exact campaign name businesses should create in their own AiSensy account"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is only a suggestion — each business needs a &ldquo;Live&rdquo; campaign of this exact name (and
              wording) approved in their own AiSensy account before sends using it will work.
            </p>
          </div>
          <div>
            <label className="label">Message text</label>
            <textarea
              className="input"
              rows={5}
              value={form.bodyText}
              onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
              placeholder={'🎉 Warm Wishes, [NAME]! 🎉\n\nWishing you a very Happy [occasion]! …'}
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste the approved WhatsApp template text here, exactly as it reads in AiSensy — shown to businesses as
              a preview when they pick this template.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Adding…' : '+ Add template'}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">
          Message templates ({templates.length}) — offered to every business from their Flyer templates page
        </h2>
        {templates.length === 0 ? (
          <p className="text-sm text-gray-500">No message templates yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {templates.map((t, i) => (
              <div key={t.id} className="border border-gray-200 rounded-lg p-3">
                {editingId === t.id ? (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Name</label>
                        <input
                          className="input"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">Occasion</label>
                        <select
                          className="input"
                          value={editForm.occasion}
                          onChange={(e) => setEditForm({ ...editForm, occasion: e.target.value })}
                        >
                          {Object.entries(OCCASION_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">AiSensy campaign name</label>
                      <input
                        className="input"
                        value={editForm.campaignName}
                        onChange={(e) => setEditForm({ ...editForm, campaignName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Message text</label>
                      <textarea
                        className="input"
                        rows={5}
                        value={editForm.bodyText}
                        onChange={(e) => setEditForm({ ...editForm, bodyText: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary px-3 py-1 text-xs"
                        disabled={rowBusyId === t.id}
                        onClick={() => saveEdit(t.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1 text-xs"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                        <span className="text-xs font-medium bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
                          {OCCASION_LABEL[t.occasion] ?? t.occasion}
                        </span>
                        {!t.isActive && (
                          <span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Campaign: <span className="font-mono">{t.campaignName}</span>
                      </p>
                      <div className="mt-2 rounded-xl bg-[#dcf8c6] px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap max-w-md">
                        {t.bodyText}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={i === 0 || rowBusyId === t.id}
                          onClick={() => moveTemplate(i, -1)}
                          className="btn-secondary px-2 py-1 text-xs"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={i === templates.length - 1 || rowBusyId === t.id}
                          onClick={() => moveTemplate(i, 1)}
                          className="btn-secondary px-2 py-1 text-xs"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={t.isActive}
                          disabled={rowBusyId === t.id}
                          onChange={(e) => patchTemplate(t.id, { isActive: e.target.checked })}
                        />
                        Active
                      </label>
                      <div className="flex gap-1.5">
                        <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => startEdit(t)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={rowBusyId === t.id}
                          onClick={() => handleDelete(t.id, t.name)}
                          className="btn-danger px-2 py-1 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
