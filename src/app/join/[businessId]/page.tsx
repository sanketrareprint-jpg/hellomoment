import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import PublicJoinForm from '@/components/PublicJoinForm';

export const dynamic = 'force-dynamic';

/**
 * Public, no-login-required page a business shares as a link with their own
 * customers, so those customers can add their own name/WhatsApp/birthday
 * directly — no CSV/XLSX needed from the business at all. Only ever reads
 * the business's own public-facing branding fields (name/logo), never
 * anything private (email, AiSensy key, etc).
 */
export default async function JoinPage({ params }: { params: { businessId: string } }) {
  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    select: { id: true, name: true, logoUrl: true, firmNameScript: true, firmNameMarathi: true },
  });
  if (!business) notFound();

  const displayName =
    business.firmNameScript === 'MARATHI' && business.firmNameMarathi ? business.firmNameMarathi : business.name;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          {business.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={displayName} className="h-16 w-16 object-contain mx-auto rounded" />
          )}
          <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-600">
            Add your details below so we can send you a little something on your birthday and anniversary. 🎉
          </p>
        </div>
        <PublicJoinForm businessId={business.id} />
        <p className="text-center text-xs text-gray-400">Powered by raregreet.com</p>
      </div>
    </div>
  );
}
