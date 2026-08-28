import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { STORAGE_DIR } from '@/lib/uploads';

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

const STARTERS: { name: string; occasion: 'BIRTHDAY' | 'ANNIVERSARY' | 'FESTIVAL'; file: string }[] = [
  { name: 'Starter — Birthday balloons', occasion: 'BIRTHDAY', file: 'birthday.jpg' },
  { name: 'Starter — Anniversary hearts', occasion: 'ANNIVERSARY', file: 'anniversary.jpg' },
  { name: 'Starter — Diwali diyas', occasion: 'FESTIVAL', file: 'diwali.jpg' },
  { name: 'Starter — Raksha Bandhan', occasion: 'FESTIVAL', file: 'rakshabandhan.jpg' },
];

const ASSET_DIR = path.join(process.cwd(), 'assets', 'starter-templates');

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const existing = await prisma.flyerTemplate.findMany({
    where: { businessId: business.id },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((t) => t.name));

  const created: string[] = [];
  const skipped: string[] = [];

  // Only auto-mark a starter as the default for BIRTHDAY/ANNIVERSARY —
  // those gate whether the daily send and "send test wish" work at all,
  // so a brand-new business should have a working default immediately.
  // Festival templates are picked per-festival instead, so we leave those
  // for the business to choose deliberately.
  const hasDefault: Record<string, boolean> = {
    BIRTHDAY: Boolean(
      await prisma.flyerTemplate.findFirst({ where: { businessId: business.id, occasion: 'BIRTHDAY', isDefault: true } })
    ),
    ANNIVERSARY: Boolean(
      await prisma.flyerTemplate.findFirst({ where: { businessId: business.id, occasion: 'ANNIVERSARY', isDefault: true } })
    ),
  };

  for (const starter of STARTERS) {
    if (existingNames.has(starter.name)) {
      skipped.push(starter.name);
      continue;
    }

    const sourcePath = path.join(ASSET_DIR, starter.file);
    const ext = path.extname(starter.file).replace('.', '') || 'jpg';
    const filename = `${uuid()}.${ext}`;
    const destDir = path.join(STORAGE_DIR, 'templates');
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(sourcePath, path.join(destDir, filename));
    const backgroundUrl = `/api/files/templates/${filename}`;

    const ph = corePlaceholders();
    const makeDefault = starter.occasion !== 'FESTIVAL' && !hasDefault[starter.occasion];
    if (makeDefault) hasDefault[starter.occasion] = true;

    await prisma.flyerTemplate.create({
      data: {
        businessId: business.id,
        name: starter.name,
        occasion: starter.occasion,
        backgroundUrl,
        canvasWidth: CANVAS,
        canvasHeight: CANVAS,
        isDefault: makeDefault,
        namePlaceholder: JSON.stringify(ph.namePlaceholder),
        datePlaceholder: JSON.stringify(ph.datePlaceholder),
        photoPlaceholder: JSON.stringify(ph.photoPlaceholder),
        logoPlaceholder: JSON.stringify(ph.logoPlaceholder),
        firmNamePlaceholder: JSON.stringify(ph.firmNamePlaceholder),
        phonePlaceholder: JSON.stringify(ph.phonePlaceholder),
        addressPlaceholder: JSON.stringify(ph.addressPlaceholder),
        productsPlaceholder: JSON.stringify(ph.productsPlaceholder),
      },
    });
    created.push(starter.name);
  }

  return NextResponse.json({ created, skipped });
}
