import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { STORAGE_DIR, servedUrlToAbsolutePath } from '@/lib/uploads';

/**
 * Copies every active admin-curated StarterTemplate into a business's own
 * FlyerTemplate library, same as if they'd uploaded it and placed everything
 * by hand. Called automatically whenever a business opens their Templates
 * page (src/app/dashboard/templates/page.tsx) so new or updated designs
 * show up without anyone clicking anything, and also to seed a brand-new
 * business/company at signup. The "Add / refresh starter flyer designs"
 * button (src/app/api/templates/seed-starter/route.ts) just calls this
 * on demand too, for a business that wants to force an immediate check.
 *
 * Cheap to call on every page load: a starter already copied and not
 * changed since (backgroundUrl, placeholders) is skipped entirely — no file
 * copy, no write — so this only does real work the moment admin actually
 * adds, updates or removes a design.
 *
 * Also cleans up copies whose admin original is gone. Going forward that's
 * handled by FlyerTemplate.starterTemplateId's DB-level cascade the instant
 * admin deletes a StarterTemplate — but rows copied before that link
 * existed (or before this cleanup pass shipped) can be orphaned already,
 * with no cascade left to fire. Anything not matched to a currently-known
 * StarterTemplate (active or not — deactivating one only stops new offers,
 * it doesn't orphan existing copies) is treated as belonging to a design
 * admin deleted, and removed here.
 */
export async function seedStarterTemplatesForBusiness(businessId: string) {
  const allStarters = await prisma.starterTemplate.findMany();
  const starters = allStarters.filter((s) => s.isActive).sort((a, b) => a.order - b.order);
  const allStarterIds = new Set(allStarters.map((s) => s.id));
  const allStarterNames = new Set(allStarters.map((s) => s.name));

  const existing = await prisma.flyerTemplate.findMany({
    where: { businessId, source: 'STARTER' },
    select: { id: true, name: true, starterTemplateId: true, updatedAt: true },
  });
  const existingByStarterId = new Map(
    existing.filter((t) => t.starterTemplateId).map((t) => [t.starterTemplateId as string, t])
  );
  // Rows copied before starterTemplateId existed, or whose link was lost
  // because the matching starter was itself re-created — matched by name so
  // they still get linked up (and stop being re-created as duplicates) the
  // next time this runs.
  const existingByName = new Map(existing.filter((t) => !t.starterTemplateId).map((t) => [t.name, t]));

  const created: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];
  const matchedIds = new Set<string>();

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
    // "Others" flyers are never sent automatically, so none is ever made default.
    OTHER: true,
  };

  const destDir = path.join(STORAGE_DIR, 'templates');
  await fs.mkdir(destDir, { recursive: true });

  for (const starter of starters) {
    const match = existingByStarterId.get(starter.id) ?? existingByName.get(starter.name);

    if (match) {
      matchedIds.add(match.id);
      const needsLink = match.starterTemplateId !== starter.id;
      const needsArtworkRefresh = starter.updatedAt > match.updatedAt;
      if (!needsLink && !needsArtworkRefresh) continue; // already in sync — skip the file copy entirely

      if (needsArtworkRefresh) {
        // Refresh the artwork to the latest admin-curated design. Leave
        // placeholders/default status untouched in case the business
        // customized them.
        const ext = path.extname(starter.backgroundUrl).replace('.', '') || 'jpg';
        const filename = `${uuid()}.${ext}`;
        await fs.copyFile(servedUrlToAbsolutePath(starter.backgroundUrl), path.join(destDir, filename));
        const backgroundUrl = `/api/files/templates/${filename}`;
        await prisma.flyerTemplate.update({
          where: { id: match.id },
          data: { backgroundUrl, source: 'STARTER', starterTemplateId: starter.id },
        });
        updated.push(starter.name);
      } else {
        // Artwork's already current — just backfill the link to the admin
        // original (e.g. a row copied before this link existed).
        await prisma.flyerTemplate.update({ where: { id: match.id }, data: { starterTemplateId: starter.id } });
      }
      continue;
    }

    const ext = path.extname(starter.backgroundUrl).replace('.', '') || 'jpg';
    const filename = `${uuid()}.${ext}`;
    await fs.copyFile(servedUrlToAbsolutePath(starter.backgroundUrl), path.join(destDir, filename));
    const backgroundUrl = `/api/files/templates/${filename}`;

    const makeDefault = !hasDefault[starter.occasion];
    if (makeDefault) hasDefault[starter.occasion] = true;

    const createdRow = await prisma.flyerTemplate.create({
      data: {
        businessId,
        name: starter.name,
        occasion: starter.occasion,
        source: 'STARTER',
        starterTemplateId: starter.id,
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
      select: { id: true },
    });
    matchedIds.add(createdRow.id);
    created.push(starter.name);
  }

  // Anything left over belongs to a starter admin has deleted — a row whose
  // starterTemplateId no longer resolves, or a never-linked row whose name
  // doesn't match any StarterTemplate (active or not) left at all.
  const stale = existing.filter((t) => {
    if (matchedIds.has(t.id)) return false;
    return t.starterTemplateId ? !allStarterIds.has(t.starterTemplateId) : !allStarterNames.has(t.name);
  });
  if (stale.length > 0) {
    await prisma.flyerTemplate.deleteMany({ where: { id: { in: stale.map((t) => t.id) } } });
    removed.push(...stale.map((t) => t.name));
  }

  return { created, updated, removed };
}
