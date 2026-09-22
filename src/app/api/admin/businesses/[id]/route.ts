import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

// Deleting a Business cascades (see prisma/schema.prisma onDelete: Cascade)
// to all of its contacts, flyer templates, festivals, and send logs — this
// permanently removes the business and everything it ever sent.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const existing = await prisma.business.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.business.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// Lets an admin edit a business's own account/brand-kit/AiSensy details from
// the admin panel, rather than only viewing them — every optional string
// field is cleared (set to null) when sent as an empty string.
const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().email().max(200).optional(),
  ownerWhatsapp: z.string().trim().min(1).max(30).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  walletRatePaise: z.number().int().min(0).max(100000).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  phoneDisplay: z.string().trim().max(30).optional(),
  emailDisplay: z.string().trim().max(200).optional(),
  addressText: z.string().trim().max(500).optional(),
  productsText: z.string().trim().max(300).optional(),
  websiteUrl: z.string().trim().max(200).optional(),
  firmNameScript: z.enum(['ENGLISH', 'MARATHI']).optional(),
  firmNameMarathi: z.string().trim().max(200).optional(),
  aisensyApiKey: z.string().trim().max(500).optional(),
  aisensyBirthdayCampaign: z.string().trim().max(200).optional(),
  aisensyAnniversaryCampaign: z.string().trim().max(200).optional(),
  aisensyFestivalCampaign: z.string().trim().max(200).optional(),
});

const NULLABLE_FIELDS = [
  'logoUrl',
  'phoneDisplay',
  'emailDisplay',
  'addressText',
  'productsText',
  'websiteUrl',
  'firmNameMarathi',
  'aisensyApiKey',
  'aisensyBirthdayCampaign',
  'aisensyAnniversaryCampaign',
  'aisensyFestivalCampaign',
] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const existing = await prisma.business.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const data: Record<string, string | number | null> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    if (typeof value === 'string' && value === '' && (NULLABLE_FIELDS as readonly string[]).includes(key)) {
      data[key] = null;
    } else {
      data[key] = value;
    }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const updated = await prisma.business.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, business: updated });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'That email is already used by another business.' }, { status: 409 });
    }
    throw err;
  }
}
