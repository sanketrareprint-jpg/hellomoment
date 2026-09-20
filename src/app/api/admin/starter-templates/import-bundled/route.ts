import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { STORAGE_DIR } from '@/lib/uploads';
import { STARTERS } from '@/lib/starterTemplates';

/**
 * One-click import of the original 8 bundled flyer designs (assets/
 * starter-templates/) into the admin-curated StarterTemplate library, so
 * switching "Add / refresh starter flyer designs" over to a DB-driven
 * library (see seed-starter/route.ts) doesn't lose the existing artwork.
 * Safe to click more than once — matches by name and only creates rows
 * that don't already exist. Once every business's starter designs come
 * from templates added/edited here, this route (and the bundled assets +
 * STARTERS list it reads from) can be deleted.
 */

const CANVAS = 1080;

function corePlaceholders(photoShape: 'circle' | 'square' | 'rounded' | 'hexagon' = 'circle') {
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
      shape: photoShape,
    },
    logoPlaceholder: {
      x: Math.round(width * 0.05),
      y: Math.round(height * 0.76),
      size: Math.round(width * 0.13),
    },
  };
}

const ASSET_DIR = path.join(process.cwd(), 'assets', 'starter-templates');

const OCCASION_SUBDIR: Record<'BIRTHDAY' | 'ANNIVERSARY', string> = {
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
};

export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const existing = await prisma.starterTemplate.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((t) => t.name));

  const maxOrder = await prisma.starterTemplate.aggregate({ _max: { order: true } });
  let nextOrder = (maxOrder._max.order ?? -1) + 1;

  const created: string[] = [];
  const skipped: string[] = [];

  for (const starter of STARTERS) {
    if (existingNames.has(starter.name)) {
      skipped.push(starter.name);
      continue;
    }

    const sourcePath = path.join(ASSET_DIR, OCCASION_SUBDIR[starter.occasion], starter.file);
    const ext = path.extname(starter.file).replace('.', '') || 'jpg';
    const filename = `${uuid()}.${ext}`;
    const destDir = path.join(STORAGE_DIR, 'templates');
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(sourcePath, path.join(destDir, filename));
    const backgroundUrl = `/api/files/templates/${filename}`;

    const ph = corePlaceholders(starter.photoShape ?? 'circle');
    await prisma.starterTemplate.create({
      data: {
        name: starter.name,
        occasion: starter.occasion,
        backgroundUrl,
        canvasWidth: CANVAS,
        canvasHeight: CANVAS,
        order: nextOrder++,
        namePlaceholder: JSON.stringify(ph.namePlaceholder),
        datePlaceholder: JSON.stringify(ph.datePlaceholder),
        photoPlaceholder: JSON.stringify(ph.photoPlaceholder),
        logoPlaceholder: JSON.stringify(ph.logoPlaceholder),
      },
    });
    created.push(starter.name);
  }

  return NextResponse.json({ created, skipped });
}
