import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Composites a business's uploaded flyer background with the one thing
 * that changes per send: the contact's name, an optional date/caption
 * line, and an optional circular photo. Everything else (design, colors,
 * decorations) lives in the background image the business uploaded once.
 */

export type Align = 'left' | 'center' | 'right';

export interface TextPlaceholder {
  x: number;
  y: number;
  fontSize: number;
  color: string; // any CSS color, e.g. "#ffffff"
  fontWeight?: number | string; // e.g. 400, 600, 700
  fontFamily?: string; // must be installed on the server; falls back to sans-serif
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

function buildTextSvg(
  canvasWidth: number,
  canvasHeight: number,
  entries: { placeholder: TextPlaceholder; text: string }[]
): Buffer {
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
        placeholder.fontFamily || 'sans-serif'
      )}" font-weight="${placeholder.fontWeight ?? 600}" fill="${escapeXml(
        placeholder.color
      )}" text-anchor="${textAnchorFor(placeholder.align)}">${tspans}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">${textNodes}</svg>`;
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

  const textEntries: { placeholder: TextPlaceholder; text: string }[] = [
    { placeholder: opts.namePlaceholder, text: opts.name },
  ];
  if (opts.datePlaceholder && opts.dateText) {
    textEntries.push({ placeholder: opts.datePlaceholder, text: opts.dateText });
  }
  composites.push({
    input: buildTextSvg(opts.canvasWidth, opts.canvasHeight, textEntries),
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
