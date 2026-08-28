'use client';

import { useState } from 'react';

export default function PublicJoinForm({ businessId }: { businessId: string }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [anniversaryPhotoUrl, setAnniversaryPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingAnniversary, setUploadingAnniversary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function uploadTo(setter: (url: string) => void, setUploadingState: (v: boolean) => void, file: File) {
    setUploadingState(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/public/uploads/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Photo upload failed');
      setter(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setUploadingState(false);
    }
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadTo(setPhotoUrl, setUploading, file);
  }

  function onAnniversaryPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadTo(setAnniversaryPhotoUrl, setUploadingAnniversary, file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!photoUrl) {
      setError('Please add your photo before submitting.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/public/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          name,
          whatsapp,
          dob: dob || null,
          anniversary: anniversary || null,
          photoUrl: photoUrl || null,
          anniversaryPhotoUrl: anniversaryPhotoUrl || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-center space-y-2">
        <div className="text-3xl">🎉</div>
        <p className="font-semibold text-gray-900">You&rsquo;re all set!</p>
        <p className="text-sm text-gray-600">
          Thanks, {name || 'friend'} — you&rsquo;ll get a special wish on your special days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs text-center px-1">No photo</span>
          )}
        </div>
        <div>
          <label className="label">Your photo (required)</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhotoChange} />
          {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
        </div>
      </div>

      <div>
        <label className="label">Your name</label>
        <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      </div>
      <div>
        <label className="label">WhatsApp number</label>
        <input
          className="input"
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+91 98765 43210"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date of birth</label>
          <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div>
          <label className="label">Anniversary</label>
          <input className="input" type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-gray-500">Add at least one date so we know when to send you a wish. Both is fine too!</p>

      {anniversary && (
        <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
            {anniversaryPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={anniversaryPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-xs text-center px-1">No photo</span>
            )}
          </div>
          <div>
            <label className="label">Anniversary photo (optional)</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onAnniversaryPhotoChange} />
            {uploadingAnniversary && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
            <p className="mt-1 text-xs text-gray-500">e.g. a couple&rsquo;s photo — used just for your anniversary wish.</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading || uploading || uploadingAnniversary} className="btn-primary w-full">
        {loading ? 'Submitting…' : 'Submit my details'}
      </button>
    </form>
  );
}
