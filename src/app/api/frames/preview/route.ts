import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { generateFlyer, type PhotoPlaceholder } from '@/lib/flyer';
import { servedUrlToAbsolutePath, STORAGE_DIR } from '@/lib/uploads';
import { frameLayoutFor, scaleLogoPlaceholder, scaleTextPlaceholder } from '@/lib/framePlaceholders';
import type { TextPlaceholder, LogoPlaceholder } from '@/lib/flyerPlaceholders';
import { formatDateForDisplay } from '@/lib/dateUtils';
import { brandFirmNameText } from '@/lib/sendWish';

// Same shape as POST/PUT /api/frames — the editor sends whatever is
// currently on screen (not necessarily saved yet), so "Generate preview"
// reflects live edits without forcing a save first.
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

const previewSchema = z.object({
  overlayUrl: z.string().nullable().optional(),
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

// A sample contact used only for this preview render — never saved anywhere.
const SAMPLE_NAME = 'Priya Sharma';

/**
 * Renders this frame (as currently being edited, not necessarily saved) onto
 * the business's default birthday template using the exact same compositing
 * pipeline as a real send (see sendWish.ts's renderFlyer) — so what this
 * returns is pixel-for-pixel what a customer would actually receive, not an
 * HTML/CSS approximation like the editor's live preview. Lets a business
 * (or us) catch any drift between the two.
 */
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = previewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  // Cast the zod-validated shape to the stricter runtime types below — same
  // trust boundary as JSON.parse(defaultFrame.xPlaceholder) in sendWish.ts's
  // renderFlyer, which these mirror exactly.
  const frame = parsed.data as {
    overlayUrl?: string | null;
    canvasWidth: number;
    canvasHeight: number;
    logoPlaceholder?: LogoPlaceholder | null;
    firmNamePlaceholder?: TextPlaceholder | null;
    phonePlaceholder?: TextPlaceholder | null;
    emailPlaceholder?: TextPlaceholder | null;
    addressPlaceholder?: TextPlaceholder | null;
    websitePlaceholder?: TextPlaceholder | null;
    productsPlaceholder?: TextPlaceholder | null;
  };

  const template = await prisma.flyerTemplate.findFirst({
    where: { businessId: business.id, occasion: 'BIRTHDAY', isDefault: true },
  });
  if (!template) {
    return NextResponse.json(
      { error: 'No default birthday template. Set one as default under Flyer templates.' },
      { status: 400 }
    );
  }

  // Frame placeholders are authored against the frame's own canvas (its
  // overlay graphic's native size) — scale/anchor them onto the template's
  // canvas exactly the way a real send does (see sendWish.ts's renderFlyer).
  const { scale: frameScale, topOffset: frameTopOffset } = frameLayoutFor(
    template.canvasWidth,
    template.canvasHeight,
    frame.canvasWidth,
    frame.canvasHeight
  );

  const logoPlaceholder: LogoPlaceholder | null = frame.logoPlaceholder
    ? scaleLogoPlaceholder(frame.logoPlaceholder, frameScale, frameTopOffset)
    : null;
  const firmNamePlaceholder: TextPlaceholder | null = frame.firmNamePlaceholder
    ? scaleTextPlaceholder(frame.firmNamePlaceholder, frameScale, frameTopOffset)
    : null;
  const phonePlaceholder: TextPlaceholder | null = frame.phonePlaceholder
    ? scaleTextPlaceholder(frame.phonePlaceholder, frameScale, frameTopOffset)
    : null;
  const emailPlaceholder: TextPlaceholder | null = frame.emailPlaceholder
    ? scaleTextPlaceholder(frame.emailPlaceholder, frameScale, frameTopOffset)
    : null;
  const addressPlaceholder: TextPlaceholder | null = frame.addressPlaceholder
    ? scaleTextPlaceholder(frame.addressPlaceholder, frameScale, frameTopOffset)
    : null;
  const websitePlaceholder: TextPlaceholder | null = frame.websitePlaceholder
    ? scaleTextPlaceholder(frame.websitePlaceholder, frameScale, frameTopOffset)
    : null;
  const productsPlaceholder: TextPlaceholder | null = frame.productsPlaceholder
    ? scaleTextPlaceholder(frame.productsPlaceholder, frameScale, frameTopOffset)
    : null;
  const overlayPath = frame.overlayUrl ? servedUrlToAbsolutePath(frame.overlayUrl) : null;

  const designationPlaceholder = template.designationPlaceholder ? JSON.parse(template.designationPlaceholder) : null;

  const outputName = `preview-${uuid()}.jpg`;
  const outputPath = path.join(STORAGE_DIR, 'generated', outputName);

  await generateFlyer({
    backgroundPath: servedUrlToAbsolutePath(template.backgroundUrl),
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    overlayPath,
    namePlaceholder: template.namePlaceholder ? (JSON.parse(template.namePlaceholder) as TextPlaceholder) : null,
    name: SAMPLE_NAME,
    designationPlaceholder: designationPlaceholder as TextPlaceholder | null,
    designationText: null,
    datePlaceholder: template.datePlaceholder ? (JSON.parse(template.datePlaceholder) as TextPlaceholder) : null,
    dateText: formatDateForDisplay(new Date()),
    photoPlaceholder: template.photoPlaceholder ? (JSON.parse(template.photoPlaceholder) as PhotoPlaceholder) : null,
    photoPath: null, // falls back to the bundled generic avatar, same as a real send with no contact photo
    logoPlaceholder,
    logoPath: business.logoUrl ? servedUrlToAbsolutePath(business.logoUrl) : null,
    firmNamePlaceholder,
    firmNameText: brandFirmNameText(business),
    phonePlaceholder,
    phoneText: business.phoneDisplay || null,
    emailPlaceholder,
    emailText: business.emailDisplay || null,
    addressPlaceholder,
    addressText: business.addressText || null,
    websitePlaceholder,
    websiteText: business.websiteUrl || null,
    productsPlaceholder,
    productsText: business.productsText || null,
    outputPath,
  });

  return NextResponse.json({ url: `/api/files/generated/${outputName}` });
}
