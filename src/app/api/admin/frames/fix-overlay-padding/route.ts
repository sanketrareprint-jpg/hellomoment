import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { servedUrlToAbsolutePath, trimOverlayPadding, type OverlayTrimResult } from '@/lib/uploads';

const PLACEHOLDER_FIELDS = [
  'logoPlaceholder',
  'firmNamePlaceholder',
  'phonePlaceholder',
  'emailPlaceholder',
  'addressPlaceholder',
  'websitePlaceholder',
  'productsPlaceholder',
] as const;

interface OverlayRow {
  id: string;
  overlayUrl: string | null;
  canvasWidth: number;
  canvasHeight: number;
  logoPlaceholder: string | null;
  firmNamePlaceholder: string | null;
  phonePlaceholder: string | null;
  emailPlaceholder: string | null;
  addressPlaceholder: string | null;
  websitePlaceholder: string | null;
  productsPlaceholder: string | null;
}

// Builds the update payload for one row once its overlay file has been
// trimmed: the new canvas size, plus every placeholder's x/y remapped from
// the pre-trim canvas onto the trimmed one (see trimOverlayPadding). Returns
// null when there was nothing to trim, so the caller can skip the write.
function shiftedUpdateData(row: OverlayRow, trimmed: OverlayTrimResult): Record<string, unknown> | null {
  if (trimmed.offsetLeft === 0 && trimmed.offsetTop === 0 && trimmed.width === row.canvasWidth && trimmed.height === row.canvasHeight) {
    return null;
  }
  const data: Record<string, unknown> = { canvasWidth: trimmed.width, canvasHeight: trimmed.height };
  for (const field of PLACEHOLDER_FIELDS) {
    const raw = row[field];
    if (!raw) continue;
    const parsed = JSON.parse(raw) as { x: number; y: number };
    parsed.x = Math.max(0, Math.round(parsed.x + trimmed.offsetLeft));
    parsed.y = Math.max(0, Math.round(parsed.y + trimmed.offsetTop));
    data[field] = JSON.stringify(parsed);
  }
  return data;
}

// ONE-OFF admin data fix: frame overlay graphics uploaded before trimming was
// added at upload time (see src/lib/uploads.ts's trimOverlayPadding) can carry
// transparent padding baked into the file itself, so the banner visibly sits
// inset from a flyer's edges/bottom even though it's already scaled
// full-width and anchored flush to the bottom (see frameLayoutFor's and
// flyer.ts's own comments). Crops that padding off every existing Frame and
// BusinessFrame overlay file in place and shifts their placeholder
// coordinates to match the new, smaller canvas. Safe to run more than once —
// an already-trimmed overlay is skipped.
export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  let fixed = 0;
  let skipped = 0;
  const errors: string[] = [];

  const frames = await prisma.frame.findMany({ where: { overlayUrl: { not: null } } });
  for (const frame of frames) {
    try {
      const trimmed = await trimOverlayPadding(servedUrlToAbsolutePath(frame.overlayUrl!));
      const data = shiftedUpdateData(frame, trimmed);
      if (!data) {
        skipped += 1;
        continue;
      }
      await prisma.frame.update({ where: { id: frame.id }, data });
      fixed += 1;
    } catch (err) {
      errors.push(`Frame ${frame.id}: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  const businessFrames = await prisma.businessFrame.findMany({ where: { overlayUrl: { not: null } } });
  for (const businessFrame of businessFrames) {
    try {
      const trimmed = await trimOverlayPadding(servedUrlToAbsolutePath(businessFrame.overlayUrl!));
      const data = shiftedUpdateData(businessFrame, trimmed);
      if (!data) {
        skipped += 1;
        continue;
      }
      await prisma.businessFrame.update({ where: { id: businessFrame.id }, data });
      fixed += 1;
    } catch (err) {
      errors.push(`BusinessFrame ${businessFrame.id}: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  return NextResponse.json({ fixed, skipped, errors });
}
