import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { generateFlyer, type PhotoPlaceholder } from '@/lib/flyer';
import { servedUrlToAbsolutePath, STORAGE_DIR } from '@/lib/uploads';
import { frameLayoutFor, scaleLogoPlaceholder, scaleTextPlaceholder, scaleCustomTextPlaceholder } from '@/lib/framePlaceholders';
import type { TextPlaceholder, LogoPlaceholder, CustomTextPlaceholder } from '@/lib/flyerPlaceholders';
import { formatDateForDisplay } from '@/lib/dateUtils';
import { brandFirmNameText } from '@/lib/sendWish';

// Takes only a saved template's id — the editor saves the template first,
// then calls this with its id (see TemplatePlaceholderEditor.tsx's
// generateFinalPreview), the same pattern /api/frames/preview uses for
// frames. Guarantees this renders the exact same persisted placeholders a
// real send reads (see sendWish.ts's renderFlyer).
const previewSchema = z.object({
  templateId: z.string().min(1),
});

// A sample contact used only for this preview render — never saved anywhere.
const SAMPLE_NAME = 'Priya Sharma';

/**
 * Renders a business's saved FlyerTemplate with a sample contact using the
 * exact same compositing pipeline (background + branding merge) as a real
 * send — see sendWish.ts's renderFlyer, which this mirrors including its
 * "a business's default Frame overrides a STARTER template's own branding
 * placeholders" rule — so what this returns is pixel-for-pixel what a
 * customer would actually receive, not the editor's HTML/CSS approximation.
 */
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = previewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const template = await prisma.flyerTemplate.findUnique({ where: { id: parsed.data.templateId } });
  if (!template || template.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Only for STARTER templates — a CUSTOM template is the business's own
  // uploaded artwork, which a real send never overlays a Frame onto (see
  // sendWish.ts's renderFlyer and TemplatePlaceholderEditor.tsx's
  // frameActive gate).
  const defaultFrame =
    template.source === 'STARTER'
      ? await prisma.businessFrame.findFirst({ where: { businessId: business.id, isDefault: true } })
      : null;

  let logoPlaceholder: LogoPlaceholder | null = template.logoPlaceholder ? JSON.parse(template.logoPlaceholder) : null;
  let firmNamePlaceholder: TextPlaceholder | null = template.firmNamePlaceholder
    ? JSON.parse(template.firmNamePlaceholder)
    : null;
  let phonePlaceholder: TextPlaceholder | null = template.phonePlaceholder ? JSON.parse(template.phonePlaceholder) : null;
  let emailPlaceholder: TextPlaceholder | null = template.emailPlaceholder ? JSON.parse(template.emailPlaceholder) : null;
  let addressPlaceholder: TextPlaceholder | null = template.addressPlaceholder
    ? JSON.parse(template.addressPlaceholder)
    : null;
  let websitePlaceholder: TextPlaceholder | null = template.websitePlaceholder
    ? JSON.parse(template.websitePlaceholder)
    : null;
  let productsPlaceholder: TextPlaceholder | null = template.productsPlaceholder
    ? JSON.parse(template.productsPlaceholder)
    : null;
  let customTexts: { placeholder: TextPlaceholder; text: string }[] = [];
  let overlayPath: string | null = null;
  let overlayHue = 0;

  if (defaultFrame) {
    const { scale: frameScale, topOffset: frameTopOffset } = frameLayoutFor(
      template.canvasWidth,
      template.canvasHeight,
      defaultFrame.canvasWidth,
      defaultFrame.canvasHeight
    );

    logoPlaceholder = defaultFrame.logoPlaceholder
      ? scaleLogoPlaceholder(JSON.parse(defaultFrame.logoPlaceholder), frameScale, frameTopOffset)
      : null;
    firmNamePlaceholder = defaultFrame.firmNamePlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.firmNamePlaceholder), frameScale, frameTopOffset)
      : null;
    phonePlaceholder = defaultFrame.phonePlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.phonePlaceholder), frameScale, frameTopOffset)
      : null;
    emailPlaceholder = defaultFrame.emailPlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.emailPlaceholder), frameScale, frameTopOffset)
      : null;
    addressPlaceholder = defaultFrame.addressPlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.addressPlaceholder), frameScale, frameTopOffset)
      : null;
    websitePlaceholder = defaultFrame.websitePlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.websitePlaceholder), frameScale, frameTopOffset)
      : null;
    productsPlaceholder = defaultFrame.productsPlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.productsPlaceholder), frameScale, frameTopOffset)
      : null;
    const customTextPlaceholders: CustomTextPlaceholder[] = defaultFrame.customTextPlaceholders
      ? JSON.parse(defaultFrame.customTextPlaceholders)
      : [];
    customTexts = customTextPlaceholders.map((p) => {
      const scaled = scaleCustomTextPlaceholder(p, frameScale, frameTopOffset);
      return { placeholder: scaled, text: scaled.text };
    });
    overlayPath = defaultFrame.overlayUrl ? servedUrlToAbsolutePath(defaultFrame.overlayUrl) : null;
    overlayHue = defaultFrame.overlayHue;
  }

  // Same "Frame active -> ignore this template's own text overrides, use
  // the one shared Business field" rule as sendWish.ts's renderFlyer.
  const phoneText = (!defaultFrame && template.phoneTextOverride) || business.phoneDisplay || null;
  const emailText = (!defaultFrame && template.emailTextOverride) || business.emailDisplay || null;
  const addressText = (!defaultFrame && template.addressTextOverride) || business.addressText || null;
  const websiteText = (!defaultFrame && template.websiteTextOverride) || business.websiteUrl || null;
  const productsText = (!defaultFrame && template.productsTextOverride) || business.productsText || null;

  const designationPlaceholder = template.designationPlaceholder ? JSON.parse(template.designationPlaceholder) : null;

  const outputName = `preview-${uuid()}.jpg`;
  const outputPath = path.join(STORAGE_DIR, 'generated', outputName);

  await generateFlyer({
    backgroundPath: servedUrlToAbsolutePath(template.backgroundUrl),
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    overlayPath,
    overlayHue,
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
    phoneText,
    emailPlaceholder,
    emailText,
    addressPlaceholder,
    addressText,
    websitePlaceholder,
    websiteText,
    productsPlaceholder,
    productsText,
    customTexts,
    outputPath,
  });

  return NextResponse.json({ url: `/api/files/generated/${outputName}` });
}
