'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeleteTemplateButton from '@/components/DeleteTemplateButton';

// The Edit / Delete / Set default links under each card on the Flyer
// templates page — same actions (and set-default call) as TemplatesGrid.
export default function TemplateCardActions({ id, name, isDefault }: { id: string; name: string; isDefault: boolean }) {
  const router = useRouter();
  const [settingDefault, setSettingDefault] = useState(false);

  async function setDefault() {
    setSettingDefault(true);
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
      setSettingDefault(false);
    }
  }

  return (
    <div className="flex gap-2 items-center flex-wrap text-xs">
      <Link href={`/dashboard/templates/${id}/edit`} className="text-brand-600 font-medium">
        Edit
      </Link>
      <DeleteTemplateButton id={id} name={name} />
      {!isDefault && (
        <button
          type="button"
          className="text-brand-600 font-medium disabled:opacity-50"
          disabled={settingDefault}
          onClick={setDefault}
        >
          {settingDefault ? 'Setting…' : 'Set default'}
        </button>
      )}
    </div>
  );
}
