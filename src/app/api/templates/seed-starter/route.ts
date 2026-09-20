import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { STORAGE_DIR, servedUrlToAbsolutePath } from '@/lib/uploads';

/**
 * One-click starter set of ready-made flyer designs (background art + all
 * placeholders already positioned) so a new business doesn't have to design
 * or upload anything before they can send their first wish. The designs
 * themselves come from the admin-curated StarterTemplate library (see
 * /admin/templates and src/app/api/admin/starter-templates/*) — this route
 * just copies each active one into the business's own storage and creates
 * a FlyerTemplate row, same as if they'd uploaded it and placed everything
 * by hand. Copying (rather than pointing at the same file) means the
 * business keeps its own flyer even if admin later edits or removes the
 * starter design.
 */
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const starters = await prisma.starterTemplate.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

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
    FESTIVAL: Boolean(
      await prisma.flyerTemplate.findFirst({ where: { businessId: business.id, occasion: 'FESTIVAL', isDefault: true } })
    ),
  };

  const destDir = path.join(STORAGE_DIR, 'templates');
  await fs.mkdir(destDir, { recursive: true });

  for (const starter of starters) {
    const ext = path.extname(starter.backgroundUrl).replace('.', '') || 'jpg';
    const filename = `${uuid()}.${ext}`;
    await fs.copyFile(servedUrlToAbsolutePath(starter.backgroundUrl), path.join(destDir, filename));
    const backgroundUrl = `/api/files/templates/${filename}`;

    const existingId = existingByName.get(starter.name);
    if (existingId) {
      // Already has this starter — just refresh the artwork to the latest
      // admin-curated design. Leave placeholders/default status untouched
      // in case the business customized them.
      await prisma.flyerTemplate.update({
        where: { id: existingId },
        data: { backgroundUrl, source: 'STARTER' },
      });
      updated.push(starter.name);
      continue;
    }

    const makeDefault = !hasDefault[starter.occasion];
    if (makeDefault) hasDefault[starter.occasion] = true;

    await prisma.flyerTemplate.create({
      data: {
        businessId: business.id,
        name: starter.name,
        occasion: starter.occasion,
        source: 'STARTER',
        backgroundUrl,
        canvasWidth: starter.canvasWidth,
        canvasHeight: starter.canvasHeight,
        isDefault: makeDefault,
        namePlaceholder: starter.namePlaceholder,
        designationPlaceholder: starter.designationPlaceholder,
        datePlaceholder: starter.datePlaceholder,
        photoPlaceholder: starter.photoPlaceholder,
        logoPlaceholder: starter.logoPlaceholder,
        firmNamePlaceholder: starter.firmNamePlaceholder,
        phonePlaceholder: starter.phonePlaceholder,
        addressPlaceholder: starter.addressPlaceholder,
        productsPlaceholder: starter.productsPlaceholder,
      },
    });
    created.push(starter.name);
  }

  return NextResponse.json({ created, updated });
}
