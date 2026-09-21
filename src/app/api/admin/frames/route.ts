import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

// Admin-curated library of reusable branding frames — the source businesses
// pull from via the Frame gallery on their own Frames page (see
// src/app/api/frames/adopt/route.ts). Mirrors /api/admin/starter-templates,
// but for the global Frame table instead of StarterTemplate.

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
});

export async function GET(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const frames = await prisma.frame.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  return NextResponse.json({ frames });
}

export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

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
    ...rest
  } = parsed.data;

  const maxOrder = await prisma.frame.aggregate({ _max: { order: true } });

  const frame = await prisma.frame.create({
    data: {
      ...rest,
      order: (maxOrder._max.order ?? -1) + 1,
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
