'use client';

import { useState } from 'react';

export default function ShareJoinLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, non-HTTPS, etc) — the link is
      // still selectable/readable in the input, so this isn't fatal.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input className="input flex-1" readOnly value={link} onFocus={(e) => e.target.select()} />
      <button type="button" className="btn-secondary shrink-0" onClick={onCopy}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
