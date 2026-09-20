import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiBusiness } from '@/lib/session';
import { adoptFrameForBusiness } from '@/lib/adoptFrame';

const schema = z.object({ frameId: z.string().min(1) });

/** "+ Add to my frames" on the Frame gallery — copies an admin Frame into this business's own BusinessFrame library. */
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const frame = await adoptFrameForBusiness(business.id, parsed.data.frameId);
  if (!frame) return NextResponse.json({ error: 'Frame not found' }, { status: 404 });

  return NextResponse.json({ frame }, { status: 201 });
}
