import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

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
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;
  const template = await prisma.starterTemplate.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ template });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const existing = await prisma.starterTemplate.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
    ...rest
  } = parsed.data;

  const template = await prisma.starterTemplate.update({
    where: { id: params.id },
    data: {
      ...rest,
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
  return NextResponse.json({ template });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const data: { isActive?: boolean; order?: number } = {};
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.order === 'number') data.order = body.order;

  try {
    const template = await prisma.starterTemplate.update({ where: { id: params.id }, data });
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  try {
    await prisma.starterTemplate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
