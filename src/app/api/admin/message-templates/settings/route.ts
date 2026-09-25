import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAdmin } from '@/lib/session';
import { rupeesToPaise } from '@/lib/pricing';
import { setCustomTemplatePricePaise } from '@/lib/messageTemplates';

const schema = z.object({ customTemplatePriceRupees: z.number().min(0).max(100000) });

/** Sets the price a business pays to submit one custom message template. */
export async function PUT(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid price' }, { status: 400 });

  await setCustomTemplatePricePaise(rupeesToPaise(parsed.data.customTemplatePriceRupees));
  return NextResponse.json({ ok: true });
}
