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
  size: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  shape: z.enum(['circle', 'square', 'rounded', 'hexagon']).optional(),
  rotation: z.number().optional(),
  locked: z.boolean().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1),
  occasion: z.enum(['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL', 'OTHER']),
  backgroundUrl: z.string().min(1),
  canvasWidth: z.number().int().positive(),
  canvasHeight: z.number().int().positive(),
  namePlaceholder: placeholderSchema.nullable().optional(),
  designationPlaceholder: placeholderSchema.nullable().optional(),
  datePlaceholder: placeholderSchema.nullable().optional(),
  photoPlaceholder: placeholderSchema.nullable().optional(),
  logoPlaceholder: placeholderSchema.nullable().optional(),
  firmNamePlaceholder: placeholderSchema.nullable().optional(),
  phonePlaceholder: placeholderSchema.nullable().optional(),
  emailPlaceholder: placeholderSchema.nullable().optional(),
  addressPlaceholder: placeholderSchema.nullable().optional(),
  websitePlaceholder: placeholderSchema.nullable().optional(),
  productsPlaceholder: placeholderSchema.nullable().optional(),
  isDefault: z.boolean().optional(),
  aisensyCampaignName: z.string().optional().nullable(),
  phoneTextOverride: z.string().optional().nullable(),
  emailTextOverride: z.string().optional().nullable(),
  addressTextOverride: z.string().optional().nullable(),
  websiteTextOverride: z.string().optional().nullable(),
  productsTextOverride: z.string().optional().nullable(),
});

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
    designationPlaceholder,
    datePlaceholder,
    photoPlaceholder,
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

  if (isDefault) {
    await prisma.flyerTemplate.updateMany({
      where: { businessId: business.id, occasion: rest.occasion, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.flyerTemplate.create({
    data: {
      ...rest,
      businessId: business.id,
      isDefault: Boolean(isDefault),
      namePlaceholder: namePlaceholder ? JSON.stringify(namePlaceholder) : null,
      designationPlaceholder: designationPlaceholder ? JSON.stringify(designationPlaceholder) : null,
      datePlaceholder: datePlaceholder ? JSON.stringify(datePlaceholder) : null,
      photoPlaceholder: photoPlaceholder ? JSON.stringify(photoPlaceholder) : null,
      logoPlaceholder: logoPlaceholder ? JSON.stringify(logoPlaceholder) : null,
      firmNamePlaceholder: firmNamePlaceholder ? JSON.stringify(firmNamePlaceholder) : null,
      phonePlaceholder: phonePlaceholder ? JSON.stringify(phonePlaceholder) : null,
      emailPlaceholder: emailPlaceholder ? JSON.stringify(emailPlaceholder) : null,
      addressPlaceholder: addressPlaceholder ? JSON.stringify(addressPlaceholder) : null,
      websitePlaceholder: websitePlaceholder ? JSON.stringify(websitePlaceholder) : null,
      productsPlaceholder: productsPlaceholder ? JSON.stringify(productsPlaceholder) : null,
    },
  });
  return NextResponse.json({ template }, { status: 201 });
}
