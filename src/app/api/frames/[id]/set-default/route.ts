import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

/**
 * Lightweight endpoint for the "Set as default" button on the Frames grid —
 * avoids round-tripping the full frame schema (all placeholder JSON blobs)
 * through PUT /api/frames/[id] just to flip one boolean. Unlike
 * FlyerTemplate.isDefault (one per occasion), a BusinessFrame's default is
 * global to the business — only one at a time, applied to every flyer sent.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const frame = await prisma.businessFrame.findUnique({ where: { id: params.id } });
  if (!frame || frame.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.businessFrame.updateMany({
    where: { businessId: business.id, isDefault: true, id: { not: frame.id } },
    data: { isDefault: false },
  });
  const updated = await prisma.businessFrame.update({
    where: { id: frame.id },
    data: { isDefault: true },
  });

  return NextResponse.json({ frame: updated });
}
