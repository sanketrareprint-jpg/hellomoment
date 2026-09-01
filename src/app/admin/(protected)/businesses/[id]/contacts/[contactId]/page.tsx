import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const OCCASION_LABEL: Record<string, string> = {
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  FESTIVAL: 'Festival',
};

const STATUS_STYLE: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  SKIPPED: 'bg-gray-100 text-gray-600',
};

/**
 * A WhatsApp-style timeline of everything ever sent to one contact — what
 * was sent, for which occasion, whether it actually delivered, and the
 * actual flyer image, in chronological order. Lets the account owner (or
 * platform admin) answer "what did we send this person, and when?" without
 * digging through raw send logs.
 */
export default async function AdminContactTimelinePage({
  params,
}: {
  params: { id: string; contactId: string };
}) {
  const contact = await prisma.contact.findUnique({ where: { id: params.contactId } });
  if (!contact || contact.businessId !== params.id) notFound();

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) notFound();

  const sendLogs = await prisma.sendLog.findMany({
    where: { contactId: contact.id },
    orderBy: { sentAt: 'asc' },
    include: { festival: true, template: true },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href={`/admin/businesses/${business.id}`} className="text-sm text-brand-600 font-medium">
          ← {business.name}
        </Link>
      </div>

      <div className="card p-5 flex items-center gap-4">
        {contact.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={contact.photoUrl} alt={contact.name} className="h-16 w-16 rounded-full object-cover border border-gray-200" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-medium">
            {contact.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{contact.name}</h1>
          <p className="text-sm text-gray-500">
            {contact.whatsapp} · {contact.relationship}
            {contact.dob && ` · Birthday ${new Date(contact.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
            {contact.anniversary &&
              ` · Anniversary ${new Date(contact.anniversary).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">
          Send history ({sendLogs.length}) — oldest first, like a chat thread
        </h2>

        {sendLogs.length === 0 ? (
          <div className="card p-8 text-center text-gray-500 text-sm">Nothing has been sent to this contact yet.</div>
        ) : (
          <div className="space-y-4">
            {sendLogs.map((log) => (
              <div key={log.id} className="card p-4 flex gap-4">
                {log.flyerUrl && (
                  <a href={log.flyerUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={log.flyerUrl}
                      alt="Sent flyer"
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                    />
                  </a>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      {OCCASION_LABEL[log.occasion] ?? log.occasion}
                      {log.festival && ` — ${log.festival.name}`}
                    </span>
                    <span className={'text-xs font-medium rounded-full px-2 py-0.5 shrink-0 ' + (STATUS_STYLE[log.status] ?? 'bg-gray-100 text-gray-600')}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(log.sentAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {log.template?.name && `Template: ${log.template.name} · `}
                    Sent to customer: {log.sentToContact ? 'yes' : 'no'} · Sent to owner: {log.sentToOwner ? 'yes' : 'no'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
