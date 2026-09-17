import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

// TEMPORARY one-off cleanup route: strips the firm name / phone / address /
// products placeholders that were auto-added to starter templates before
// that default was turned off. Safe to delete after running once.
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const result = await prisma.flyerTemplate.updateMany({
    where: { businessId: business.id, name: { startsWith: 'Starter — ' } },
    data: {
      firmNamePlaceholder: null,
      phonePlaceholder: null,
      addressPlaceholder: null,
      productsPlaceholder: null,
    },
  });

  return NextResponse.json({ updated: result.count });
}
