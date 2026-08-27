import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

const placeholderSchema = z.object({
  x: z.number(),
  y: z.number(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
  fontFamily: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  maxWidth: z.number().optional(),
  maxLines: z.number().optional(),
  size: z.number().optional(),
  shape: z.enum(['circle', 'square']).optional(),
});

const templateSchema = z.object({
  name: z.string().min(1),
  occasion: z.enum(['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL']),
  backgroundUrl: z.string().min(1),
  canvasWidth: z.number().int().positive(),
  canvasHeight: z.number().int().positive(),
  namePlaceholder: placeholderSchema,
  datePlaceholder: placeholderSchema.nullable().optional(),
  photoPlaceholder: placeholderSchema.nullable().optional(),
  logoPlaceholder: placeholderSchema.nullable().optional(),
  firmNamePlaceholder: placeholderSchema.nullable().optional(),
  phonePlaceholder: placeholderSchema.nullable().optional(),
  addressPlaceholder: placeholderSchema.nullable().optional(),
  productsPlaceholder: placeholderSchema.nullable().optional(),
  isDefault: z.boolean().optional(),
  aisensyCampaignName: z.string().optional().nullable(),
});

// Mirrors the client's default logo position/size in TemplatePlaceholderEditor.tsx
function defaultLogoPlaceholder(width: number, height: number) {
  return {
    x: Math.round(width * 0.42),
    y: Math.round(height * 0.02),
    size: Math.round(width * 0.16),
  };
}

export async function GET(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const templates = await prisma.flyerTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const {
    namePlaceholder,
    datePlaceholder,
    photoPlaceholder,
    logoPlaceholder,
    firmNamePlaceholder,
    phonePlaceholder,
    addressPlaceholder,
    productsPlaceholder,
    isDefault,
    ...rest
  } = parsed.data;

  if (isDefault) {
    await prisma.flyerTemplate.updateMany({
      where: { businessId: business.id, occasion: rest.occasion, isDefault: true },
      data: { isDefault: false },
    });
  }

  // Logo is compulsory on every flyer — a business's customers should
  // always be able to tell who sent the wish. Default a placeholder even if
  // the client didn't send one, so this can't be bypassed by calling the
  // API directly.
  const effectiveLogoPlaceholder = logoPlaceholder ?? defaultLogoPlaceholder(rest.canvasWidth, rest.canvasHeight);

  const template = await prisma.flyerTemplate.create({
    data: {
      ...rest,
      businessId: business.id,
      isDefault: Boolean(isDefault),
      namePlaceholder: JSON.stringify(namePlaceholder),
      datePlaceholder: datePlaceholder ? JSON.stringify(datePlaceholder) : null,
      photoPlaceholder: photoPlaceholder ? JSON.stringify(photoPlaceholder) : null,
      logoPlaceholder: JSON.stringify(effectiveLogoPlaceholder),
      firmNamePlaceholder: firmNamePlaceholder ? JSON.stringify(firmNamePlaceholder) : null,
      phonePlaceholder: phonePlaceholder ? JSON.stringify(phonePlaceholder) : null,
      addressPlaceholder: addressPlaceholder ? JSON.stringify(addressPlaceholder) : null,
      productsPlaceholder: productsPlaceholder ? JSON.stringify(productsPlaceholder) : null,
    },
  });
  return NextResponse.json({ template }, { status: 201 });
}
