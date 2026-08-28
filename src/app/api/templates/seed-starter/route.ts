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
  // Birthday — 4 styles
  { name: 'Starter — Birthday: Balloons & Confetti', occasion: 'BIRTHDAY', file: 'birthday-1.jpg' },
  { name: 'Starter — Birthday: Party Hats', occasion: 'BIRTHDAY', file: 'birthday-2.jpg' },
  { name: 'Starter — Birthday: Pastel Sprinkles', occasion: 'BIRTHDAY', file: 'birthday-3.jpg' },
  { name: 'Starter — Birthday: Starry Night', occasion: 'BIRTHDAY', file: 'birthday-4.jpg' },
  // Anniversary — 4 styles
  { name: 'Starter — Anniversary: Rose Hearts', occasion: 'ANNIVERSARY', file: 'anniversary-1.jpg' },
  { name: 'Starter — Anniversary: Gold Elegance', occasion: 'ANNIVERSARY', file: 'anniversary-2.jpg' },
  { name: 'Starter — Anniversary: Deep Romance', occasion: 'ANNIVERSARY', file: 'anniversary-3.jpg' },
  { name: 'Starter — Anniversary: Soft Blush', occasion: 'ANNIVERSARY', file: 'anniversary-4.jpg' },
  // Diwali — 4 styles
  { name: 'Starter — Diwali: Diya Lights', occasion: 'FESTIVAL', file: 'diwali-1.jpg' },
  { name: 'Starter — Diwali: Golden Rangoli', occasion: 'FESTIVAL', file: 'diwali-2.jpg' },
  { name: 'Starter — Diwali: Festive Lanterns', occasion: 'FESTIVAL', file: 'diwali-3.jpg' },
  { name: 'Starter — Diwali: Sparkle Gold', occasion: 'FESTIVAL', file: 'diwali-4.jpg' },
  // Raksha Bandhan — 4 styles
  { name: 'Starter — Raksha Bandhan: Rakhi Sun', occasion: 'FESTIVAL', file: 'rakhi-1.jpg' },
  { name: 'Starter — Raksha Bandhan: Thread of Love', occasion: 'FESTIVAL', file: 'rakhi-2.jpg' },
  { name: 'Starter — Raksha Bandhan: Golden Bond', occasion: 'FESTIVAL', file: 'rakhi-3.jpg' },
  { name: 'Starter — Raksha Bandhan: Pink Ribbon', occasion: 'FESTIVAL', file: 'rakhi-4.jpg' },
  // New Year — 4 styles
  { name: "Starter — New Year: Midnight Sky", occasion: 'FESTIVAL', file: 'newyear-1.jpg' },
  { name: "Starter — New Year: Purple Fireworks", occasion: 'FESTIVAL', file: 'newyear-2.jpg' },
  { name: "Starter — New Year: Pink Celebration", occasion: 'FESTIVAL', file: 'newyear-3.jpg' },
  { name: "Starter — New Year: Golden Countdown", occasion: 'FESTIVAL', file: 'newyear-4.jpg' },
  // Makar Sankranti — 4 styles
  { name: 'Starter — Makar Sankranti: Blue Sky Kites', occasion: 'FESTIVAL', file: 'sankranti-1.jpg' },
  { name: 'Starter — Makar Sankranti: Golden Harvest', occasion: 'FESTIVAL', file: 'sankranti-2.jpg' },
  { name: 'Starter — Makar Sankranti: Til-Gul', occasion: 'FESTIVAL', file: 'sankranti-3.jpg' },
  { name: 'Starter — Makar Sankranti: Sunrise Fields', occasion: 'FESTIVAL', file: 'sankranti-4.jpg' },
  // Republic Day — 4 styles
  { name: 'Starter — Republic Day: Tricolor', occasion: 'FESTIVAL', file: 'republicday-1.jpg' },
  { name: 'Starter — Republic Day: Night Fireworks', occasion: 'FESTIVAL', file: 'republicday-2.jpg' },
  { name: 'Starter — Republic Day: Sunrise Salute', occasion: 'FESTIVAL', file: 'republicday-3.jpg' },
  { name: 'Starter — Republic Day: Deep Green', occasion: 'FESTIVAL', file: 'republicday-4.jpg' },
  // Holi — 4 styles
  { name: 'Starter — Holi: Colour Splash', occasion: 'FESTIVAL', file: 'holi-1.jpg' },
  { name: 'Starter — Holi: Pink & Purple', occasion: 'FESTIVAL', file: 'holi-2.jpg' },
  { name: 'Starter — Holi: Teal & Violet', occasion: 'FESTIVAL', file: 'holi-3.jpg' },
  { name: 'Starter — Holi: Sunshine Yellow', occasion: 'FESTIVAL', file: 'holi-4.jpg' },
  // Gudi Padwa — 4 styles
  { name: 'Starter — Gudi Padwa: Saffron Gudi', occasion: 'FESTIVAL', file: 'gudipadwa-1.jpg' },
  { name: 'Starter — Gudi Padwa: Green Prosperity', occasion: 'FESTIVAL', file: 'gudipadwa-2.jpg' },
  { name: 'Starter — Gudi Padwa: Soft Gold', occasion: 'FESTIVAL', file: 'gudipadwa-3.jpg' },
  { name: 'Starter — Gudi Padwa: Deep Red', occasion: 'FESTIVAL', file: 'gudipadwa-4.jpg' },
  // Eid ul-Fitr — 4 styles
  { name: 'Starter — Eid ul-Fitr: Emerald Moon', occasion: 'FESTIVAL', file: 'eidfitr-1.jpg' },
  { name: 'Starter — Eid ul-Fitr: Midnight Blue', occasion: 'FESTIVAL', file: 'eidfitr-2.jpg' },
  { name: 'Starter — Eid ul-Fitr: Golden Crescent', occasion: 'FESTIVAL', file: 'eidfitr-3.jpg' },
  { name: 'Starter — Eid ul-Fitr: Deep Teal', occasion: 'FESTIVAL', file: 'eidfitr-4.jpg' },
  // Eid ul-Adha — 4 styles
  { name: 'Starter — Eid ul-Adha: Green Blessing', occasion: 'FESTIVAL', file: 'eidadha-1.jpg' },
  { name: 'Starter — Eid ul-Adha: Midnight Blue', occasion: 'FESTIVAL', file: 'eidadha-2.jpg' },
  { name: 'Starter — Eid ul-Adha: Golden Crescent', occasion: 'FESTIVAL', file: 'eidadha-3.jpg' },
  { name: 'Starter — Eid ul-Adha: Emerald Moon', occasion: 'FESTIVAL', file: 'eidadha-4.jpg' },
  // Independence Day — 4 styles
  { name: 'Starter — Independence Day: Green Pride', occasion: 'FESTIVAL', file: 'independenceday-1.jpg' },
  { name: 'Starter — Independence Day: Saffron Glow', occasion: 'FESTIVAL', file: 'independenceday-2.jpg' },
  { name: 'Starter — Independence Day: Night Sky', occasion: 'FESTIVAL', file: 'independenceday-3.jpg' },
  { name: 'Starter — Independence Day: Fresh White', occasion: 'FESTIVAL', file: 'independenceday-4.jpg' },
  // Ganesh Chaturthi — 4 styles
  { name: 'Starter — Ganesh Chaturthi: Warm Orange', occasion: 'FESTIVAL', file: 'ganeshchaturthi-1.jpg' },
  { name: 'Starter — Ganesh Chaturthi: Deep Red', occasion: 'FESTIVAL', file: 'ganeshchaturthi-2.jpg' },
  { name: 'Starter — Ganesh Chaturthi: Golden Sand', occasion: 'FESTIVAL', file: 'ganeshchaturthi-3.jpg' },
  { name: 'Starter — Ganesh Chaturthi: Maroon Modak', occasion: 'FESTIVAL', file: 'ganeshchaturthi-4.jpg' },
  // Gandhi Jayanti — 4 styles (respectful tone)
  { name: 'Starter — Gandhi Jayanti: Sand & Green', occasion: 'FESTIVAL', file: 'gandhijayanti-1.jpg' },
  { name: 'Starter — Gandhi Jayanti: Soft Green', occasion: 'FESTIVAL', file: 'gandhijayanti-2.jpg' },
  { name: 'Starter — Gandhi Jayanti: Warm Cream', occasion: 'FESTIVAL', file: 'gandhijayanti-3.jpg' },
  { name: 'Starter — Gandhi Jayanti: Soft Blue', occasion: 'FESTIVAL', file: 'gandhijayanti-4.jpg' },
  // Navratri — 4 styles
  { name: 'Starter — Navratri: Pink & Purple', occasion: 'FESTIVAL', file: 'navratri-1.jpg' },
  { name: 'Starter — Navratri: Devi Red', occasion: 'FESTIVAL', file: 'navratri-2.jpg' },
  { name: 'Starter — Navratri: Golden Orange', occasion: 'FESTIVAL', file: 'navratri-3.jpg' },
  { name: 'Starter — Navratri: Royal Violet', occasion: 'FESTIVAL', file: 'navratri-4.jpg' },
  // Dussehra — 4 styles
  { name: 'Starter — Dussehra: Deep Red', occasion: 'FESTIVAL', file: 'dussehra-1.jpg' },
  { name: 'Starter — Dussehra: Maroon Victory', occasion: 'FESTIVAL', file: 'dussehra-2.jpg' },
  { name: 'Starter — Dussehra: Golden Sand', occasion: 'FESTIVAL', file: 'dussehra-3.jpg' },
  { name: 'Starter — Dussehra: Burnt Orange', occasion: 'FESTIVAL', file: 'dussehra-4.jpg' },
  // Christmas — 4 styles
  { name: 'Starter — Christmas: Classic Red', occasion: 'FESTIVAL', file: 'christmas-1.jpg' },
  { name: 'Starter — Christmas: Emerald Green', occasion: 'FESTIVAL', file: 'christmas-2.jpg' },
  { name: 'Starter — Christmas: Midnight Blue', occasion: 'FESTIVAL', file: 'christmas-3.jpg' },
  { name: 'Starter — Christmas: Festive Pink', occasion: 'FESTIVAL', file: 'christmas-4.jpg' },
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
