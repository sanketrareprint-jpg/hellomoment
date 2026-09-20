import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { STORAGE_DIR, servedUrlToAbsolutePath } from '@/lib/uploads';

/**
 * Copies every active admin-curated StarterTemplate into a business's own
 * FlyerTemplate library, same as if they'd uploaded it and placed everything
 * by hand. Used both by the "Add / refresh starter flyer designs" button
 * (src/app/api/templates/seed-starter/route.ts) and to seed a brand-new
 * business/company automatically at signup, so nobody has to click that
 * button just to get a working default flyer.
 */
export async function seedStarterTemplatesForBusiness(businessId: string) {
  const starters = await prisma.starterTemplate.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  const existing = await prisma.flyerTemplate.findMany({
    where: { businessId },
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
      await prisma.flyerTemplate.findFirst({ where: { businessId, occasion: 'BIRTHDAY', isDefault: true } })
    ),
    ANNIVERSARY: Boolean(
      await prisma.flyerTemplate.findFirst({ where: { businessId, occasion: 'ANNIVERSARY', isDefault: true } })
    ),
    FESTIVAL: Boolean(
      await prisma.flyerTemplate.findFirst({ where: { businessId, occasion: 'FESTIVAL', isDefault: true } })
    ),
  };

  const destDir = path.join(STORAGE_DIR, 'templates');
  await fs.mkdir(destDir, { recursive: true });

  for (const starter of starters) {
    const existingId = existingByName.get(starter.name);

    const ext = path.extname(starter.backgroundUrl).replace('.', '') || 'jpg';
    const filename = `${uuid()}.${ext}`;
    await fs.copyFile(servedUrlToAbsolutePath(starter.backgroundUrl), path.join(destDir, filename));
    const backgroundUrl = `/api/files/templates/${filename}`;

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
        businessId,
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
        emailPlaceholder: starter.emailPlaceholder,
        addressPlaceholder: starter.addressPlaceholder,
        websitePlaceholder: starter.websitePlaceholder,
        productsPlaceholder: starter.productsPlaceholder,
      },
    });
    created.push(starter.name);
  }

  return { created, updated };
}
