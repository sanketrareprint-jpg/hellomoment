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
  namePlaceholder?: TextPlaceholder | null;
  name?: string | null;
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
 * as Latin — is loaded directly from these two files by *file path* for
 * every piece of text on a flyer (via sharp's native text renderer, using
 * its `fontfile` option). This is deliberate: an earlier version of this
 * file embedded the font as a base64 @font-face inside a generated SVG
 * instead, which turned out to be unreliable — on the production host, all
 * text (including plain English names) came out as missing-glyph boxes,
 * because librsvg's CSS @font-face support can't be relied on and the host
 * has no system fonts installed as a fallback. Passing `fontfile` makes
 * sharp/Pango load our exact bundled file directly, regardless of what (if
 * anything) is installed system-wide.
 */
export const BUNDLED_FONT_FAMILY = 'HMFont';
const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
const FONT_FILE_REGULAR = path.join(FONT_DIR, 'FreeSans.ttf');
const FONT_FILE_BOLD = path.join(FONT_DIR, 'FreeSansBold.ttf');

function fontFileFor(fontWeight: number | string | undefined): string {
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight, 10) : fontWeight;
  return weight && weight >= 600 ? FONT_FILE_BOLD : FONT_FILE_REGULAR;
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

/**
 * Renders one text placeholder (possibly multiple wrapped lines) to its own
 * small transparent PNG via sharp's native text renderer, using our bundled
 * font *file* directly (see fontFileFor above) rather than a font family
 * name the host has to resolve. The (x, y) on the placeholder is treated as
 * the visual center of the rendered block — matching exactly how the
 * template editor's live preview already positions these markers
 * (`translate(-50%, -50%)` etc. in TemplatePlaceholderEditor.tsx) — so what
 * a business drags into place in the editor is what actually gets sent.
 */
async function buildTextComposite(
  placeholder: TextPlaceholder,
  text: string,
  canvasWidth: number,
  canvasHeight: number
): Promise<{ input: Buffer; left: number; top: number }> {
  const lines = wrapText(text, placeholder.maxWidth, placeholder.fontSize, placeholder.maxLines ?? 2);
  const markup = lines.map((line) => escapeXml(line)).join('\n');
  const fontfile = placeholder.fontFamily ? undefined : fontFileFor(placeholder.fontWeight);
  const fontDescription = `${placeholder.fontFamily || BUNDLED_FONT_FAMILY} ${Math.round(placeholder.fontSize)}`;

  const buffer = await sharp({
    text: {
      text: `<span foreground="${escapeXml(placeholder.color)}">${markup}</span>`,
      font: fontDescription,
      ...(fontfile ? { fontfile } : {}),
      rgba: true,
      align: placeholder.align === 'right' ? 'right' : placeholder.align === 'center' ? 'center' : 'left',
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });

  let { data } = buffer;
  let w = buffer.info.width;
  let h = buffer.info.height;

  // sharp refuses to composite an overlay that would extend past the base
  // canvas at the given offset, so clamp/crop defensively — an unusually
  // long name shouldn't be able to fail an entire send.
  if (w > canvasWidth || h > canvasHeight) {
    const cropWidth = Math.min(w, canvasWidth);
    const cropHeight = Math.min(h, canvasHeight);
    data = await sharp(data).extract({ left: 0, top: 0, width: cropWidth, height: cropHeight }).png().toBuffer();
    w = cropWidth;
    h = cropHeight;
  }

  const rawLeft =
    placeholder.align === 'center'
      ? Math.round(placeholder.x - w / 2)
      : placeholder.align === 'right'
        ? Math.round(placeholder.x - w)
        : Math.round(placeholder.x);
  const rawTop = Math.round(placeholder.y - h / 2);

  const left = Math.min(Math.max(0, rawLeft), Math.max(0, canvasWidth - w));
  const top = Math.min(Math.max(0, rawTop), Math.max(0, canvasHeight - h));

  return { input: data, left, top };
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

  const textEntries: { placeholder: TextPlaceholder; text: string }[] = [];
  if (opts.namePlaceholder && opts.name) {
    textEntries.push({ placeholder: opts.namePlaceholder, text: opts.name });
  }
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
  for (const { placeholder, text } of textEntries) {
    if (!text.trim()) continue;
    composites.push(await buildTextComposite(placeholder, text, opts.canvasWidth, opts.canvasHeight));
  }

  await sharp(opts.backgroundPath)
    .resize(opts.canvasWidth, opts.canvasHeight, { fit: 'cover' })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(opts.outputPath);

  return opts.outputPath;
}
