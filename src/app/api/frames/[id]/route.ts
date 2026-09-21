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
  rotation: z.number().optional(),
  locked: z.boolean().optional(),
});

const frameSchema = z.object({
  name: z.string().min(1),
  overlayUrl: z.string().nullable().optional(),
  overlayHue: z.number().int().min(0).max(360).optional(),
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

async function loadOwnedFrame(businessId: string, id: string) {
  const frame = await prisma.businessFrame.findUnique({ where: { id } });
  if (!frame || frame.businessId !== businessId) return null;
  return frame;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;
  const frame = await loadOwnedFrame(business.id, params.id);
  if (!frame) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ frame });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;
  const existing = await loadOwnedFrame(business.id, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

  if (isDefault) {
    await prisma.businessFrame.updateMany({
      where: { businessId: business.id, isDefault: true, id: { not: params.id } },
      data: { isDefault: false },
    });
  }

  const frame = await prisma.businessFrame.update({
    where: { id: params.id },
    data: {
      ...rest,
      isDefault: Boolean(isDefault),
      logoPlaceholder: logoPlaceholder ? JSON.stringify(logoPlaceholder) : null,
      firmNamePlaceholder: firmNamePlaceholder ? JSON.stringify(firmNamePlaceholder) : null,
      phonePlaceholder: phonePlaceholder ? JSON.stringify(phonePlaceholder) : null,
      emailPlaceholder: emailPlaceholder ? JSON.stringify(emailPlaceholder) : null,
      addressPlaceholder: addressPlaceholder ? JSON.stringify(addressPlaceholder) : null,
      websitePlaceholder: websitePlaceholder ? JSON.stringify(websitePlaceholder) : null,
      productsPlaceholder: productsPlaceholder ? JSON.stringify(productsPlaceholder) : null,
    },
  });
  return NextResponse.json({ frame });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;
  const existing = await loadOwnedFrame(business.id, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.businessFrame.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
