import Link from 'next/link';
import { prisma } from '@/lib/db';
import MessageTemplateManager from '@/components/MessageTemplateManager';

export const dynamic = 'force-dynamic';

export default async function AdminMessageTemplatesPage() {
  const templates = await prisma.messageTemplate.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });

  return (
    <div>
      <Link href="/admin" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 mb-3 hover:gap-2 transition-all">
        ← Back to businesses
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-0.5">Message templates</h1>
      <p className="text-gray-600 text-sm mb-3">
        The WhatsApp message text behind each AiSensy campaign, curated here so businesses can see what a campaign
        actually says — right on their own Flyer templates page — before picking it for a flyer template, without
        needing access to AiSensy&apos;s dashboard themselves.
      </p>
      <MessageTemplateManager templates={templates} />
    </div>
  );
}
