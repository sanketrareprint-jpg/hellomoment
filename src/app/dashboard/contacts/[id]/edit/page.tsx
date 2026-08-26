import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/session';
import ContactForm, { ContactFormValues } from '@/components/ContactForm';
import SendTestWishButton from '@/components/SendTestWishButton';

function toDateInput(d: Date | null): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const contact = await prisma.contact.findUnique({ where: { id: params.id } });
  if (!contact || contact.businessId !== business.id) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit contact</h1>
      <ContactForm
        initial={{
          id: contact.id,
          name: contact.name,
          relationship: contact.relationship as ContactFormValues['relationship'],
          whatsapp: contact.whatsapp,
          dob: toDateInput(contact.dob),
          anniversary: toDateInput(contact.anniversary),
          photoUrl: contact.photoUrl ?? '',
          notes: contact.notes ?? '',
        }}
      />
      <div className="mt-6">
        <SendTestWishButton contactId={contact.id} hasDob={Boolean(contact.dob)} hasAnniversary={Boolean(contact.anniversary)} />
      </div>
    </div>
  );
}
