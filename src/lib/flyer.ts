import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Composites a business's uploaded flyer background with everything that
 * changes per send: the contact's name, an optional date/caption line, an
 * optional circular photo, and (new) the business's own branding — logo,
 * firm name, phone, address, products — pulled from their Brand kit
 * (Settings) and positioned per-template. Everything else (design, colors,
 * decorations) lives in the background image the business uploaded once.
 */

export type Align = 'left' | 'center' | 'right';

export interface TextPlaceholder {
  x: number;
  y: number;
  fontSize: number;
  color: string; // any CSS color, e.g. "#ffffff"
  fontWeight?: number | string; // e.g. 400, 600, 700
  fontFamily?: string; // defaults to our bundled font (see BUNDLED_FONT_FAMILY below)
  align?: Align;
  maxWidth?: number; // wraps onto multiple lines if the text would exceed this
  maxLines?: number; // default 2
}

export interface PhotoPlaceholder {
  x: number;
  y: number;
  size: number; // diameter (circle) or side length (square)
  shape?: 'circle' | 'square';
  borderColor?: string;
  borderWidth?: number;
}

export interface LogoPlaceholder {
  x: number;
  y: number;
  size: number; // the logo is scaled to fit inside this size×size box (aspect ratio preserved, not cropped)
}

export interface GenerateFlyerOptions {
  backgroundPath: string; // absolute filesystem path to the template background
  canvasWidth: number;
  canvasHeight: number;
  namePlaceholder: TextPlaceholder;
  name: string;
  datePlaceholder?: TextPlaceholder | null;
  dateText?: string | null;
  photoPlaceholder?: PhotoPlaceholder | null;
  photoPath?: string | null; // absolute filesystem path to the contact's photo, if any

  // Business branding — each is independent; omit either half of a pair
  // (placeholder or text/path) to skip that element.
  logoPlaceholder?: LogoPlaceholder | null;
  logoPath?: string | null;
  firmNamePlaceholder?: TextPlaceholder | null;
  firmNameText?: string | null;
  phonePlaceholder?: TextPlaceholder | null;
  phoneText?: string | null;
  addressPlaceholder?: TextPlaceholder | null;
  addressText?: string | null;
  productsPlaceholder?: TextPlaceholder | null;
  productsText?: string | null;

  outputPath: string; // absolute filesystem path to write the composited JPEG
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * A bundled, redistributable (GNU FreeFont, GPL-with-font-exception) font
 * with wide Unicode coverage — including Devanagari (Marathi/Hindi) as well
 * as Latin — is embedded directly into every generated flyer's SVG as a
 * base64 data URI. This is deliberate: it means text (including Marathi
 * firm names) always renders correctly regardless of what fonts happen to
 * be installed on the hosting server (e.g. Railway's build image), rather
 * than silently falling back to missing-glyph boxes for scripts the host
 * doesn't have a font for.
 */
export const BUNDLED_FONT_FAMILY = 'HMFont';
const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
let cachedFontFaceCss: string | null = null;

async function loadFontFaceCss(): Promise<string> {
  if (cachedFontFaceCss !== null) return cachedFontFaceCss;
  try {
    const [regular, bold] = await Promise.all([
      fs.readFile(path.join(FONT_DIR, 'FreeSans.ttf')),
      fs.readFile(path.join(FONT_DIR, 'FreeSansBold.ttf')),
    ]);
    cachedFontFaceCss =
      `<style>` +
      `@font-face{font-family:'${BUNDLED_FONT_FAMILY}';font-weight:400;src:url(data:font/ttf;base64,${regular.toString('base64')}) format('truetype');}` +
      `@font-face{font-family:'${BUNDLED_FONT_FAMILY}';font-weight:700;src:url(data:font/ttf;base64,${bold.toString('base64')}) format('truetype');}` +
      `</style>`;
  } catch {
    // Bundled font files missing for some reason — fall back to whatever
    // the host provides under this family name (won't crash the send).
    cachedFontFaceCss = '';
  }
  return cachedFontFaceCss;
}

/**
 * No canvas measureText available (we deliberately avoid node-canvas to
 * sidestep its native cairo build requirements), so we wrap using an
 * average-character-width heuristic. It's not pixel-perfect but is a safe,
 * conservative estimate that reliably prevents text overflowing the flyer.
 */
export function wrapText(text: string, maxWidth: number | undefined, fontSize: number, maxLines = 2): string[] {
  if (!maxWidth) return [text];
  const avgCharWidth = fontSize * 0.58;
  const maxCharsPerLine = Math.max(1, Math.floor(maxWidth / avgCharWidth));

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines - 1 && current.length > maxCharsPerLine) {
      // Truncate the final allowed line with an ellipsis rather than overflow.
      current = current.slice(0, Math.max(0, maxCharsPerLine - 1)).trimEnd() + '…';
      break;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function textAnchorFor(align: Align | undefined): string {
  if (align === 'center') return 'middle';
  if (align === 'right') return 'end';
  return 'start';
}

async function buildTextSvg(
  canvasWidth: number,
  canvasHeight: number,
  entries: { placeholder: TextPlaceholder; text: string }[]
): Promise<Buffer> {
  const fontFaceCss = await loadFontFaceCss();
  const textNodes = entries
    .map(({ placeholder, text }) => {
      const lines = wrapText(text, placeholder.maxWidth, placeholder.fontSize, placeholder.maxLines ?? 2);
      const lineHeight = placeholder.fontSize * 1.2;
      const tspans = lines
        .map(
          (line, i) =>
            `<tspan x="${placeholder.x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
        )
        .join('');
      return `<text x="${placeholder.x}" y="${placeholder.y}" font-size="${placeholder.fontSize}" font-family="${escapeXml(
        placeholder.fontFamily || BUNDLED_FONT_FAMILY
      )}" font-weight="${placeholder.fontWeight ?? 600}" fill="${escapeXml(
        placeholder.color
      )}" text-anchor="${textAnchorFor(placeholder.align)}">${tspans}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">${fontFaceCss}${textNodes}</svg>`;
  return Buffer.from(svg);
}

async function buildPhotoComposite(
  photoPath: string,
  placeholder: PhotoPlaceholder
): Promise<{ input: Buffer; left: number; top: number }> {
  const size = Math.round(placeholder.size);
  const shape = placeholder.shape ?? 'circle';

  let photo = sharp(photoPath).resize(size, size, { fit: 'cover' });

  if (shape === 'circle') {
    const maskSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${
        size / 2
      }" r="${size / 2}" fill="#fff"/></svg>`
    );
    photo = photo.composite([{ input: maskSvg, blend: 'dest-in' }]);
  }

  const photoBuffer = await photo.png().toBuffer();
  return { input: photoBuffer, left: Math.round(placeholder.x), top: Math.round(placeholder.y) };
}

/**
 * Business logos are scaled to *fit inside* their box (aspect ratio kept,
 * transparent padding on the shorter side) rather than cropped/cover-fit
 * like the contact photo — a stretched or cropped logo looks unprofessional.
 */
async function buildLogoComposite(
  logoPath: string,
  placeholder: LogoPlaceholder
): Promise<{ input: Buffer; left: number; top: number }> {
  const size = Math.round(placeholder.size);
  const logoBuffer = await sharp(logoPath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return { input: logoBuffer, left: Math.round(placeholder.x), top: Math.round(placeholder.y) };
}

export async function generateFlyer(opts: GenerateFlyerOptions): Promise<string> {
  await fs.mkdir(path.dirname(opts.outputPath), { recursive: true });

  const composites: { input: Buffer; left: number; top: number }[] = [];

  if (opts.photoPlaceholder && opts.photoPath) {
    try {
      await fs.access(opts.photoPath);
      composites.push(await buildPhotoComposite(opts.photoPath, opts.photoPlaceholder));
    } catch {
      // Photo file missing on disk — silently skip so the flyer still sends
      // with name/date rather than failing the whole send.
    }
  }

  if (opts.logoPlaceholder && opts.logoPath) {
    try {
      await fs.access(opts.logoPath);
      composites.push(await buildLogoComposite(opts.logoPath, opts.logoPlaceholder));
    } catch {
      // Logo file missing on disk — silently skip, same reasoning as photo above.
    }
  }

  const textEntries: { placeholder: TextPlaceholder; text: string }[] = [
    { placeholder: opts.namePlaceholder, text: opts.name },
  ];
  if (opts.datePlaceholder && opts.dateText) {
    textEntries.push({ placeholder: opts.datePlaceholder, text: opts.dateText });
  }
  if (opts.firmNamePlaceholder && opts.firmNameText) {
    textEntries.push({ placeholder: opts.firmNamePlaceholder, text: opts.firmNameText });
  }
  if (opts.phonePlaceholder && opts.phoneText) {
    textEntries.push({ placeholder: opts.phonePlaceholder, text: opts.phoneText });
  }
  if (opts.addressPlaceholder && opts.addressText) {
    textEntries.push({ placeholder: opts.addressPlaceholder, text: opts.addressText });
  }
  if (opts.productsPlaceholder && opts.productsText) {
    textEntries.push({ placeholder: opts.productsPlaceholder, text: opts.productsText });
  }
  composites.push({
    input: await buildTextSvg(opts.canvasWidth, opts.canvasHeight, textEntries),
    left: 0,
    top: 0,
  });

  await sharp(opts.backgroundPath)
    .resize(opts.canvasWidth, opts.canvasHeight, { fit: 'cover' })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(opts.outputPath);

  return opts.outputPath;
}
