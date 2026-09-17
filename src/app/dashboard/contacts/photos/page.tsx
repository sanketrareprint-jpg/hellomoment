'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

interface ContactHit {
  id: string;
  name: string;
  whatsapp: string;
  photoUrl: string | null;
  anniversaryPhotoUrl: string | null;
}

interface PhotoItem {
  key: string;
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploadedUrl: string | null;
  uploadError: string | null;
  query: string;
  results: ContactHit[];
  searching: boolean;
  selected: ContactHit | null;
  autoMatched: boolean;
  target: 'photoUrl' | 'anniversaryPhotoUrl';
  saved: boolean;
  saveError: string | null;
}

function makeKey() {
  return Math.random().toString(36).slice(2);
}

// Turns a filename like "Rahul_Sharma.jpg" or "9876543210.jpg" into a
// plain search string: "Rahul Sharma" / "9876543210".
function guessFromFilename(file: File): string {
  const base = file.name.replace(/\.[^./]+$/, '');
  return base.replace(/[_-]+/g, ' ').trim();
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

// A filename guess counts as a confident match only if it clearly points
// to one specific contact — an exact name match, or the digits in the
// filename match the end of a contact's WhatsApp number. Anything weaker
// is left for the person to confirm by hand rather than risk pairing the
// wrong photo with the wrong customer.
function isConfidentMatch(guess: string, contact: ContactHit): boolean {
  const normGuess = normalize(guess);
  if (!normGuess) return false;
  if (normalize(contact.name) === normGuess) return true;
  const guessDigits = digitsOnly(guess);
  const contactDigits = digitsOnly(contact.whatsapp);
  if (guessDigits.length >= 8 && contactDigits.endsWith(guessDigits)) return true;
  return false;
}

export default function BulkPhotoAssignPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [saving, setSaving] = useState(false);

  async function uploadOne(item: PhotoItem) {
    const fd = new FormData();
    fd.append('file', item.file);
    try {
      const res = await fetch('/api/uploads/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setItems((prev) =>
        prev.map((i) => (i.key === item.key ? { ...i, uploading: false, uploadedUrl: data.url } : i)),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.key === item.key
            ? { ...i, uploading: false, uploadError: err instanceof Error ? err.message : 'Upload failed' }
            : i,
        ),
      );
    }
  }

  // Tries to pair a freshly-added photo with a contact automatically by
  // matching its filename against contact names/numbers. Runs in parallel
  // with the upload so a whole folder of already-named photos can finish
  // matched with zero typing.
  async function tryAutoMatch(item: PhotoItem) {
    const guess = guessFromFilename(item.file);
    if (!guess) return;
    try {
      const res = await fetch(`/api/contacts?q=${encodeURIComponent(guess)}`);
      const data = await res.json();
      const hits: ContactHit[] = data.contacts ?? [];
      const confident = hits.filter((c) => isConfidentMatch(guess, c));
      if (confident.length === 1) {
        setItems((prev) =>
          prev.map((i) =>
            i.key === item.key ? { ...i, selected: confident[0], query: confident[0].name, autoMatched: true } : i,
          ),
        );
      } else {
        // Not confident enough to auto-select, but pre-fill the search box
        // with the guess so there's less to type by hand.
        setItems((prev) => (prev.some((i) => i.key === item.key && i.query) ? prev : prev.map((i) => (i.key === item.key ? { ...i, query: guess, results: hits } : i))));
      }
    } catch {
      // Silently fall back to manual search — this is a convenience pass only.
    }
  }

  function onFilesChosen(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const newItems: PhotoItem[] = Array.from(fileList).map((file) => ({
      key: makeKey(),
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
      uploadedUrl: null,
      uploadError: null,
      query: '',
      results: [],
      searching: false,
      selected: null,
      autoMatched: false,
      target: 'photoUrl',
      saved: false,
      saveError: null,
    }));
    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => {
      uploadOne(item);
      tryAutoMatch(item);
    });
    if (fileRef.current) fileRef.current.value = '';
  }

  async function searchContacts(key: string, q: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, query: q, searching: true } : i)));
    if (!q.trim()) {
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, results: [], searching: false } : i)));
      return;
    }
    try {
      const res = await fetch(`/api/contacts?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setItems((prev) =>
        prev.map((i) => (i.key === key ? { ...i, results: data.contacts ?? [], searching: false } : i)),
      );
    } catch {
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, searching: false } : i)));
    }
  }

  function selectContact(key: string, contact: ContactHit) {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, selected: contact, results: [], query: contact.name, autoMatched: false } : i,
      ),
    );
  }

  function clearMatch(key: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, selected: null, query: '', autoMatched: false } : i)));
  }

  function setTarget(key: string, target: 'photoUrl' | 'anniversaryPhotoUrl') {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, target } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  async function saveAll() {
    setSaving(true);
    const toSave = items.filter((i) => i.uploadedUrl && i.selected && !i.saved);
    await Promise.all(
      toSave.map(async (item) => {
        try {
          const res = await fetch(`/api/contacts/${item.selected!.id}/photo`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [item.target]: item.uploadedUrl }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Save failed');
          setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, saved: true, saveError: null } : i)));
        } catch (err) {
          setItems((prev) =>
            prev.map((i) =>
              i.key === item.key ? { ...i, saveError: err instanceof Error ? err.message : 'Save failed' } : i,
            ),
          );
        }
      }),
    );
    setSaving(false);
  }

  const readyToSave = items.filter((i) => i.uploadedUrl && i.selected && !i.saved).length;
  const savedCount = items.filter((i) => i.saved).length;
  const autoMatchedCount = items.filter((i) => i.autoMatched && !i.saved).length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Add photos to contacts</h1>
      <p className="text-gray-600 mb-6">
        Select all the customer photos you have at once. If a photo&rsquo;s filename is the customer&rsquo;s name or
        WhatsApp number (e.g. &ldquo;Rahul Sharma.jpg&rdquo;), it&rsquo;s matched automatically — otherwise search for
        the right contact below. Renaming photos to the customer&rsquo;s name before selecting them is the fastest
        way through a big batch.
      </p>

      <div className="card p-6 mb-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => onFilesChosen(e.target.files)}
        />
        <p className="text-xs text-gray-500 mt-2">JPG, PNG, or WebP. Up to 10MB each.</p>
      </div>

      {autoMatchedCount > 0 && (
        <p className="text-sm text-brand-700 mb-4">
          ✓ {autoMatchedCount} photo{autoMatchedCount === 1 ? '' : 's'} matched automatically by filename — check
          them below, then save.
        </p>
      )}

      {items.length > 0 && (
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div key={item.key} className="card p-4 flex gap-4 items-start">
              <img src={item.previewUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100" />

              <div className="flex-1 min-w-0">
                {item.uploading && <p className="text-sm text-gray-500">Uploading…</p>}
                {item.uploadError && <p className="text-sm text-red-600">{item.uploadError}</p>}

                {item.uploadedUrl && !item.saved && (
                  <>
                    {!item.selected && (
                      <div className="relative">
                        <input
                          className="input"
                          placeholder="Search contact by name or WhatsApp number…"
                          value={item.query}
                          onChange={(e) => searchContacts(item.key, e.target.value)}
                        />
                        {item.results.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                            {item.results.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => selectContact(item.key, c)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                              >
                                <span className="font-medium text-gray-900">{c.name}</span>{' '}
                                <span className="text-gray-500">{c.whatsapp}</span>
                                {(c.photoUrl || c.anniversaryPhotoUrl) && (
                                  <span className="text-xs text-amber-600 ml-2">already has a photo</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {item.selected && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className={item.autoMatched ? 'text-brand-700' : 'text-green-700'}>
                          {item.autoMatched ? '⚡ Auto-matched to' : '✓ Matched to'} <strong>{item.selected.name}</strong>{' '}
                          <span className="text-gray-500">{item.selected.whatsapp}</span>
                        </span>
                        <button type="button" onClick={() => clearMatch(item.key)} className="text-gray-400 hover:text-gray-600 underline">
                          not this contact?
                        </button>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`target-${item.key}`}
                            checked={item.target === 'photoUrl'}
                            onChange={() => setTarget(item.key, 'photoUrl')}
                          />
                          Birthday photo
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`target-${item.key}`}
                            checked={item.target === 'anniversaryPhotoUrl'}
                            onChange={() => setTarget(item.key, 'anniversaryPhotoUrl')}
                          />
                          Anniversary photo
                        </label>
                      </div>
                    )}
                  </>
                )}

                {item.saved && <p className="text-sm text-green-700">✓ Saved to {item.selected?.name}</p>}
                {item.saveError && <p className="text-sm text-red-600">{item.saveError}</p>}
              </div>

              {!item.saved && (
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="text-gray-400 hover:text-gray-600 text-sm shrink-0"
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={saveAll} disabled={saving || readyToSave === 0} className="btn-primary">
          {saving ? 'Saving…' : `Save ${readyToSave > 0 ? readyToSave : ''} match${readyToSave === 1 ? '' : 'es'}`}
        </button>
        {savedCount > 0 && <span className="text-sm text-gray-600">{savedCount} saved so far</span>}
        <Link href="/dashboard/contacts" className="btn-secondary">
          Back to contacts
        </Link>
      </div>
    </div>
  );
}
