import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { generateFlyer } from '@/lib/flyer';
import { servedUrlToAbsolutePath, STORAGE_DIR } from '@/lib/uploads';
import { frameLayoutFor, scaleLogoPlaceholder, scaleTextPlaceholder, scaleCustomTextPlaceholder } from '@/lib/framePlaceholders';
import type { TextPlaceholder, LogoPlaceholder, CustomTextPlaceholder } from '@/lib/flyerPlaceholders';
import { brandFirmNameText } from '@/lib/sendWish';
import { getWalletOwner } from '@/lib/businessFamily';
import { COINS_PER_SEND } from '@/lib/pricing';

// Flat price of one clean (unwatermarked) festival flyer download — paid in
// trial coins first (same COINS_PER_SEND a send costs), else ₹5 from the
// shared wallet.
const DOWNLOAD_PRICE_PAISE = 500;

/**
 * Paid download of a flyer template (any occasion) as a clean, ready-to-share flyer —
 * the dashboard shows a watermarked preview (see FestivalFlyerCard.tsx) and
 * only this route produces the unwatermarked image, after charging for it.
 * Rendered like the dashboard preview: background + the business's default
 * Frame (applied over every template, as DashboardFlyerPreview does) and
 * branding. No contact is involved, so name/designation/date/photo are
 * left off.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const template = await prisma.flyerTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const defaultFrame = await prisma.businessFrame.findFirst({ where: { businessId: business.id, isDefault: true } });

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
    const scaleText = (json: string | null) =>
      json ? scaleTextPlaceholder(JSON.parse(json), frameScale, frameTopOffset) : null;

    logoPlaceholder = defaultFrame.logoPlaceholder
      ? scaleLogoPlaceholder(JSON.parse(defaultFrame.logoPlaceholder), frameScale, frameTopOffset)
      : null;
    firmNamePlaceholder = scaleText(defaultFrame.firmNamePlaceholder);
    phonePlaceholder = scaleText(defaultFrame.phonePlaceholder);
    emailPlaceholder = scaleText(defaultFrame.emailPlaceholder);
    addressPlaceholder = scaleText(defaultFrame.addressPlaceholder);
    websitePlaceholder = scaleText(defaultFrame.websitePlaceholder);
    productsPlaceholder = scaleText(defaultFrame.productsPlaceholder);
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

  // Same "Frame active -> ignore this template's own text overrides" rule as sendWish.ts.
  const phoneText = (!defaultFrame && template.phoneTextOverride) || business.phoneDisplay || null;
  const emailText = (!defaultFrame && template.emailTextOverride) || business.emailDisplay || null;
  const addressText = (!defaultFrame && template.addressTextOverride) || business.addressText || null;
  const websiteText = (!defaultFrame && template.websiteTextOverride) || business.websiteUrl || null;
  const productsText = (!defaultFrame && template.productsTextOverride) || business.productsText || null;

  const outputName = `${uuid()}.jpg`;
  const outputPath = path.join(STORAGE_DIR, 'generated', outputName);

  await generateFlyer({
    backgroundPath: servedUrlToAbsolutePath(template.backgroundUrl),
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    overlayPath,
    overlayHue,
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

  // Charge only once the flyer rendered, so a failed render never costs
  // anything. Trial coins first, then the ₹ wallet — both shared across the
  // login's companies (see getWalletOwner). Each debit is a conditional
  // update so two quick clicks can never overdraw.
  const walletOwner = await getWalletOwner(business);
  const description =
    `Festival flyer download: ${template.name}` + (walletOwner.id === business.id ? '' : ` — ${business.name}`);

  const coinDebit = await prisma.business.updateMany({
    where: { id: walletOwner.id, trialCoins: { gte: COINS_PER_SEND } },
    data: { trialCoins: { decrement: COINS_PER_SEND } },
  });
  if (coinDebit.count === 1) {
    await prisma.trialCoinTransaction.create({
      data: { businessId: walletOwner.id, type: 'DEBIT', coins: COINS_PER_SEND, description },
    });
  } else {
    const walletDebit = await prisma.business.updateMany({
      where: { id: walletOwner.id, walletBalancePaise: { gte: DOWNLOAD_PRICE_PAISE } },
      data: { walletBalancePaise: { decrement: DOWNLOAD_PRICE_PAISE } },
    });
    if (walletDebit.count !== 1) {
      return NextResponse.json(
        {
          error: `Not enough balance — downloading costs ${COINS_PER_SEND} coins or ₹${DOWNLOAD_PRICE_PAISE / 100}. Please recharge your wallet.`,
        },
        { status: 402 }
      );
    }
    await prisma.walletTransaction.create({
      data: { businessId: walletOwner.id, type: 'DEBIT', amountPaise: DOWNLOAD_PRICE_PAISE, description },
    });
  }

  return NextResponse.json({ url: `/api/files/generated/${outputName}` });
}
