'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ContactFormValues {
  id?: string;
  name: string;
  relationship: 'CUSTOMER' | 'FRIEND' | 'FAMILY' | 'OTHER';
  whatsapp: string;
  dob: string; // YYYY-MM-DD or ''
  anniversary: string; // YYYY-MM-DD or ''
  photoUrl: string;
  anniversaryPhotoUrl: string;
  notes: string;
}

const EMPTY: ContactFormValues = {
  name: '',
  relationship: 'CUSTOMER',
  whatsapp: '',
  dob: '',
  anniversary: '',
  photoUrl: '',
  anniversaryPhotoUrl: '',
  notes: '',
};

export default function ContactForm({ initial }: { initial?: ContactFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<ContactFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAnniversary, setUploadingAnniversary] = useState(false);

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((f) => ({ ...f, photoUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onAnniversaryPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAnniversary(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((f) => ({ ...f, anniversaryPhotoUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingAnniversary(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = initial?.id ? `/api/contacts/${initial.id}` : '/api/contacts';
      const method = initial?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dob: form.dob || null,
          anniversary: form.anniversary || null,
          photoUrl: form.photoUrl || null,
          anniversaryPhotoUrl: form.anniversaryPhotoUrl || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      router.push('/dashboard/contacts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4 max-w-xl">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
          {form.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs">No photo</span>
          )}
        </div>
        <div>
          <label className="label">Photo (birthday &amp; festival flyers)</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhotoChange} />
          {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
          {form.anniversaryPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.anniversaryPhotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs">No photo</span>
          )}
        </div>
        <div>
          <label className="label">Anniversary photo (optional)</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onAnniversaryPhotoChange} />
          {uploadingAnniversary && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
          <p className="mt-1 text-xs text-gray-500">
            e.g. a couple&rsquo;s photo — used only on the anniversary flyer. Leave blank to reuse the photo above.
          </p>
        </div>
      </div>

      <div>
        <label className="label">Name</label>
        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Relationship</label>
          <select
            className="input"
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value as ContactFormValues['relationship'] })}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="FRIEND">Friend</option>
            <option value="FAMILY">Family</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="label">WhatsApp number</label>
          <input
            className="input"
            required
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date of birth</label>
          <input
            className="input"
            type="date"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500">If exact year is unknown, pick any past year — only month/day is used to trigger the wish.</p>
        </div>
        <div>
          <label className="label">Anniversary</label>
          <input
            className="input"
            type="date"
            value={form.anniversary}
            onChange={(e) => setForm({ ...form, anniversary: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading || uploading || uploadingAnniversary} className="btn-primary">
          {loading ? 'Saving…' : initial?.id ? 'Save changes' : 'Add contact'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push('/dashboard/contacts')}>
          Cancel
        </button>
      </div>
    </form>
  );
}
