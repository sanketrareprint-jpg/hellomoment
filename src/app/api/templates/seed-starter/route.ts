import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { STORAGE_DIR } from '@/lib/uploads';
import { STARTERS } from '@/lib/starterTemplates';

/**
 * One-click starter set of ready-made flyer designs (background art + all
 * placeholders already positioned) so a new business doesn't have to
 * design or upload anything before they can send their first wish. The
 * background images themselves are bundled in the repo (assets/
 * starter-templates/), not user uploads — this route just copies one into
 * the business's own storage and creates the FlyerTemplate row, same as if
 * they'd uploaded it and placed everything by hand.
 *
 * Canvas is 1080x1080 for all of these — the placeholder positions below
 * are the exact same "business card corner" defaults used by
 * TemplatePlaceholderEditor.tsx, so an art background made against those
 * coordinates lines up correctly.
 *
 * The bundled art lives under assets/starter-templates/<birthday|anniversary>/,
 * one subfolder per occasion category — see OCCASION_SUBDIR below.
 */

const CANVAS = 1080;

function corePlaceholders() {
  const width = CANVAS;
  const height = CANVAS;
  return {
    namePlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.78),
      fontSize: Math.round(width * 0.05),
      color: '#ffffff',
      fontWeight: 700,
      align: 'center' as const,
      maxWidth: Math.round(width * 0.85),
      maxLines: 2,
    },
    datePlaceholder: {
      x: Math.round(width / 2),
      y: Math.round(height * 0.86),
      fontSize: Math.round(width * 0.03),
      color: '#ffffff',
      fontWeight: 400,
      align: 'center' as const,
      maxWidth: Math.round(width * 0.85),
      maxLines: 1,
    },
    photoPlaceholder: {
      x: Math.round(width * 0.36),
      y: Math.round(height * 0.12),
      size: Math.round(width * 0.28),
      shape: 'circle' as const,
    },
    logoPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.76),
      size: Math.round(width * 0.13),
    },
    firmNamePlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.895),
      fontSize: Math.round(width * 0.04),
      color: '#ffffff',
      fontWeight: 800,
      align: 'left' as const,
      maxWidth: Math.round(width * 0.55),
      maxLines: 1,
    },
    phonePlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.925),
      fontSize: Math.round(width * 0.026),
      color: '#ffffff',
      fontWeight: 400,
      align: 'left' as const,
      maxWidth: Math.round(width * 0.55),
      maxLines: 1,
    },
    addressPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.95),
      fontSize: Math.round(width * 0.022),
      color: '#ffffff',
      fontWeight: 400,
      align: 'left' as const,
      maxWidth: Math.round(width * 0.55),
      maxLines: 2,
    },
    productsPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.978),
      fontSize: Math.round(width * 0.02),
      color: '#ffffff',
      fontWeight: 600,
      align: 'left' as const,
      maxWidth: Math.round(width * 0.55),
      maxLines: 1,
    },
  };
}

const ASSET_DIR = path.join(process.cwd(), 'assets', 'starter-templates');

const OCCASION_SUBDIR: Record<'BIRTHDAY' | 'ANNIVERSARY', string> = {
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
};

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const existing = await prisma.flyerTemplate.findMany({
    where: { businessId: business.id },
    select: { id: true, name: true },
  });
  const existingByName = new Map(existing.map((t) => [t.name, t.id]));

  const created: string[] = [];
  const updated: string[] = [];

  // Auto-mark the first BIRTHDAY/ANNIVERSARY starter as the default — those
  // gate whether the daily send and "send test wish" work at all, so a
  // brand-new business should have a working default immediately.
  const hasDefault: Record<string, boolean> = {
    BIRTHDAY: Boolean(
      await prisma.flyerTemplate.findFirst({ where: { businessId: business.id, occasion: 'BIRTHDAY', isDefault: true } })
    ),
    ANNIVERSARY: Boolean(
      await prisma.flyerTemplate.findFirst({ where: { businessId: business.id, occasion: 'ANNIVERSARY', isDefault: true } })
    ),
  };

  for (const starter of STARTERS) {
    const sourcePath = path.join(ASSET_DIR, OCCASION_SUBDIR[starter.occasion], starter.file);
    const ext = path.extname(starter.file).replace('.', '') || 'jpg';
    const filename = `${uuid()}.${ext}`;
    const destDir = path.join(STORAGE_DIR, 'templates');
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(sourcePath, path.join(destDir, filename));
    const backgroundUrl = `/api/files/templates/${filename}`;

    const existingId = existingByName.get(starter.name);
    if (existingId) {
      // Already has this starter — just refresh the artwork to the latest
      // bundled design. Leave placeholders/default status untouched in
      // case the business customized them.
      await prisma.flyerTemplate.update({
        where: { id: existingId },
        data: { backgroundUrl, source: 'STARTER' },
      });
      updated.push(starter.name);
      continue;
    }

    const ph = corePlaceholders();
    const makeDefault = !hasDefault[starter.occasion];
    if (makeDefault) hasDefault[starter.occasion] = true;

    await prisma.flyerTemplate.create({
      data: {
        businessId: business.id,
        name: starter.name,
        occasion: starter.occasion,
        source: 'STARTER',
        backgroundUrl,
        canvasWidth: CANVAS,
        canvasHeight: CANVAS,
        isDefault: makeDefault,
        namePlaceholder: JSON.stringify(ph.namePlaceholder),
        datePlaceholder: JSON.stringify(ph.datePlaceholder),
        photoPlaceholder: JSON.stringify(ph.photoPlaceholder),
        logoPlaceholder: JSON.stringify(ph.logoPlaceholder),
        // Firm name / phone / address / products are left unset here on
        // purpose: these starter designs already have their own finished
        // footer art, so overlaying this text block by default collided
        // with it. The business can turn any of these on from the
        // template editor (Your business branding) if they want it.
      },
    });
    created.push(starter.name);
  }

  return NextResponse.json({ created, updated });
}
