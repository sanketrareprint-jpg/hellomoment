import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

// A business's own branding frames — either adopted from the admin gallery
// (see /api/frames/adopt) or built from scratch here. Unlike FlyerTemplate's
// isDefault (one default *per occasion*), a BusinessFrame's isDefault is
// global to the business: exactly one frame is composited onto every flyer
// sent, whichever occasion or template that turns out to be (see
// src/lib/sendWish.ts).

const placeholderSchema = z.object({
  x: z.number(),
  y: z.number(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
  fontFamily: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  size: z.number().optional(),
  rotation: z.number().optional(),
  locked: z.boolean().optional(),
});

const frameSchema = z.object({
  name: z.string().min(1),
  overlayUrl: z.string().nullable().optional(),
  canvasWidth: z.number().int().positive(),
  canvasHeight: z.number().int().positive(),
  logoPlaceholder: placeholderSchema.nullable().optional(),
  firmNamePlaceholder: placeholderSchema.nullable().optional(),
  phonePlaceholder: placeholderSchema.nullable().optional(),
  emailPlaceholder: placeholderSchema.nullable().optional(),
  addressPlaceholder: placeholderSchema.nullable().optional(),
  websitePlaceholder: placeholderSchema.nullable().optional(),
  productsPlaceholder: placeholderSchema.nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const frames = await prisma.businessFrame.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ frames });
}

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = frameSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const {
    logoPlaceholder,
    firmNamePlaceholder,
    phonePlaceholder,
    emailPlaceholder,
    addressPlaceholder,
    websitePlaceholder,
    productsPlaceholder,
    isDefault,
    ...rest
  } = parsed.data;

  // A brand-new business has no frame at all yet — make their first one the
  // default automatically, same reasoning as the first starter template
  // auto-becoming a business's default flyer.
  const hasAny = await prisma.businessFrame.findFirst({ where: { businessId: business.id } });
  const makeDefault = Boolean(isDefault) || !hasAny;

  if (makeDefault) {
    await prisma.businessFrame.updateMany({
      where: { businessId: business.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const frame = await prisma.businessFrame.create({
    data: {
      ...rest,
      businessId: business.id,
      isDefault: makeDefault,
      logoPlaceholder: logoPlaceholder ? JSON.stringify(logoPlaceholder) : null,
      firmNamePlaceholder: firmNamePlaceholder ? JSON.stringify(firmNamePlaceholder) : null,
      phonePlaceholder: phonePlaceholder ? JSON.stringify(phonePlaceholder) : null,
      emailPlaceholder: emailPlaceholder ? JSON.stringify(emailPlaceholder) : null,
      addressPlaceholder: addressPlaceholder ? JSON.stringify(addressPlaceholder) : null,
      websitePlaceholder: websitePlaceholder ? JSON.stringify(websitePlaceholder) : null,
      productsPlaceholder: productsPlaceholder ? JSON.stringify(productsPlaceholder) : null,
    },
  });
  return NextResponse.json({ frame }, { status: 201 });
}
