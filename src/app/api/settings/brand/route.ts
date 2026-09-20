import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

/**
 * A focused counterpart to PUT /api/settings for editing just the
 * flyer-facing brand kit text fields (phone/email/address/website/products/
 * Marathi firm name) inline — from the Frame editor's per-field panel, or
 * anywhere else that wants to save one of these without round-tripping the
 * full Settings form (which also carries name/email/timezone and their own
 * validation, like login-email uniqueness, that doesn't apply here). Only
 * whichever keys are present in the body are changed; these are the exact
 * same Business columns Settings → Brand kit writes, so a change here shows
 * up on every template and frame that uses it.
 */
const schema = z.object({
  phoneDisplay: z.string().nullable().optional(),
  emailDisplay: z.string().nullable().optional(),
  addressText: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  productsText: z.string().nullable().optional(),
  firmNameMarathi: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const data: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    data[key] = value && value.trim() ? value : null;
  }

  const updated = await prisma.business.update({ where: { id: business.id }, data });
  return NextResponse.json({
    phoneDisplay: updated.phoneDisplay,
    emailDisplay: updated.emailDisplay,
    addressText: updated.addressText,
    websiteUrl: updated.websiteUrl,
    productsText: updated.productsText,
    firmNameMarathi: updated.firmNameMarathi,
  });
}
