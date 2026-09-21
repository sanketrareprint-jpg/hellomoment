import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { scaleFramePlaceholderSet, type FramePlaceholderSet } from '@/lib/framePlaceholders';

const schema = z.object({ sourceFrameId: z.string().min(1) });

/**
 * "Apply these field positions to every frame in the library" — takes one
 * already-saved Frame's field layout and pushes it (scaled per-frame, see
 * scaleFramePlaceholderSet) onto every other Frame, so admin can position
 * fields once instead of repeating the same drag-and-drop on each overlay
 * graphic they upload.
 */
export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const source = await prisma.frame.findUnique({ where: { id: parsed.data.sourceFrameId } });
  if (!source) return NextResponse.json({ error: 'Source frame not found' }, { status: 404 });

  const sourceSet: FramePlaceholderSet = {
    logoPlaceholder: source.logoPlaceholder ? JSON.parse(source.logoPlaceholder) : null,
    firmNamePlaceholder: source.firmNamePlaceholder ? JSON.parse(source.firmNamePlaceholder) : null,
    phonePlaceholder: source.phonePlaceholder ? JSON.parse(source.phonePlaceholder) : null,
    emailPlaceholder: source.emailPlaceholder ? JSON.parse(source.emailPlaceholder) : null,
    addressPlaceholder: source.addressPlaceholder ? JSON.parse(source.addressPlaceholder) : null,
    websitePlaceholder: source.websitePlaceholder ? JSON.parse(source.websitePlaceholder) : null,
    productsPlaceholder: source.productsPlaceholder ? JSON.parse(source.productsPlaceholder) : null,
  };

  const targets = await prisma.frame.findMany({ where: { id: { not: source.id } } });

  await prisma.$transaction(
    targets.map((t) => {
      const scaled = scaleFramePlaceholderSet(sourceSet, source.canvasWidth, source.canvasHeight, t.canvasWidth, t.canvasHeight);
      return prisma.frame.update({
        where: { id: t.id },
        data: {
          logoPlaceholder: scaled.logoPlaceholder ? JSON.stringify(scaled.logoPlaceholder) : null,
          firmNamePlaceholder: scaled.firmNamePlaceholder ? JSON.stringify(scaled.firmNamePlaceholder) : null,
          phonePlaceholder: scaled.phonePlaceholder ? JSON.stringify(scaled.phonePlaceholder) : null,
          emailPlaceholder: scaled.emailPlaceholder ? JSON.stringify(scaled.emailPlaceholder) : null,
          addressPlaceholder: scaled.addressPlaceholder ? JSON.stringify(scaled.addressPlaceholder) : null,
          websitePlaceholder: scaled.websitePlaceholder ? JSON.stringify(scaled.websitePlaceholder) : null,
          productsPlaceholder: scaled.productsPlaceholder ? JSON.stringify(scaled.productsPlaceholder) : null,
        },
      });
    })
  );

  return NextResponse.json({ updated: targets.length });
}
