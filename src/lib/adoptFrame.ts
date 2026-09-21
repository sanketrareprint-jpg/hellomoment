import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { STORAGE_DIR, servedUrlToAbsolutePath } from '@/lib/uploads';

/**
 * Copies one admin-curated Frame into a business's own BusinessFrame row,
 * same "copy on add" pattern as seedStarterTemplatesForBusiness (see
 * src/lib/seedStarterTemplates.ts) — the overlay graphic file is physically
 * copied too, so the business's own frame keeps working unchanged even if
 * the admin Frame it came from is later edited or removed. A business's
 * very first frame automatically becomes their default, so branding starts
 * applying to their flyers immediately without an extra click.
 */
export async function adoptFrameForBusiness(businessId: string, frameId: string) {
  const frame = await prisma.frame.findUnique({ where: { id: frameId } });
  if (!frame || !frame.isActive) return null;

  let overlayUrl: string | null = null;
  if (frame.overlayUrl) {
    const destDir = path.join(STORAGE_DIR, 'frames');
    await fs.mkdir(destDir, { recursive: true });
    const ext = path.extname(frame.overlayUrl).replace('.', '') || 'png';
    const filename = `${uuid()}.${ext}`;
    await fs.copyFile(servedUrlToAbsolutePath(frame.overlayUrl), path.join(destDir, filename));
    overlayUrl = `/api/files/frames/${filename}`;
  }

  const hasAny = await prisma.businessFrame.findFirst({ where: { businessId } });

  return prisma.businessFrame.create({
    data: {
      businessId,
      frameId: frame.id,
      name: frame.name,
      overlayUrl,
      overlayHue: frame.overlayHue,
      canvasWidth: frame.canvasWidth,
      canvasHeight: frame.canvasHeight,
      isDefault: !hasAny,
      logoPlaceholder: frame.logoPlaceholder,
      firmNamePlaceholder: frame.firmNamePlaceholder,
      phonePlaceholder: frame.phonePlaceholder,
      emailPlaceholder: frame.emailPlaceholder,
      addressPlaceholder: frame.addressPlaceholder,
      websitePlaceholder: frame.websitePlaceholder,
      productsPlaceholder: frame.productsPlaceholder,
    },
  });
}
