import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

/**
 * Lightweight endpoint just for the "Set as default" button on the
 * templates grid — avoids having to round-trip the full template schema
 * (all placeholder JSON blobs etc.) through PUT /api/templates/[id] just
 * to flip one boolean. Same "only one default per occasion" rule as that
 * route's isDefault handling.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const template = await prisma.flyerTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.flyerTemplate.updateMany({
    where: { businessId: business.id, occasion: template.occasion, isDefault: true, id: { not: template.id } },
    data: { isDefault: false },
  });
  const updated = await prisma.flyerTemplate.update({
    where: { id: template.id },
    data: { isDefault: true },
  });

  return NextResponse.json({ template: updated });
}
