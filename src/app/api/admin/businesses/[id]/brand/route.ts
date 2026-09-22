import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

// Lets the admin Starter Template editor preview a design filled in with one
// real business's saved Brand kit (Settings → Brand kit for flyers) instead
// of generic placeholder text — the StarterTemplate itself stays
// business-agnostic (this is read-only, nothing gets saved onto it).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    select: {
      logoUrl: true,
      name: true,
      phoneDisplay: true,
      emailDisplay: true,
      addressText: true,
      websiteUrl: true,
      productsText: true,
      firmNameScript: true,
      firmNameMarathi: true,
    },
  });
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ brand: business });
}
