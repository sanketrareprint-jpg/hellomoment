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
  // Multi-line text is opt-in and manual: a literal newline typed into the
  // underlying text (Settings, contact record, etc.) becomes a line break
  // here. There is no automatic width-based wrapping or truncation — the
  // business controls line breaks themselves and checks the live preview.
  rotation?: number; // degrees, clockwise, about the placeholder's own center
}

export interface PhotoPlaceholder {
  x: number;
  y: number;
  // Preferred: independent width/height, so the photo box can be a
  // non-square rectangle. `size` is kept for older templates saved before
  // width/height existed — used as a fallback for whichever of the two is
  // missing.
  size?: number; // legacy: diameter (circle) or side length (square/rounded/hexagon)
  width?: number;
  height?: number;
  shape?: 'circle' | 'square' | 'rounded' | 'hexagon';
  borderColor?: string;
  borderWidth?: number;
  rotation?: number; // degrees, clockwise, about the box's own center
}

export interface LogoPlaceholder {
  x: number;
  y: number;
  size: number; // the logo is scaled to fit inside this size×size box (aspect ratio preserved, not cropped)
  rotation?: number; // degrees, clockwise, about the box's own center
}

export interface GenerateFlyerOptions {
  backgroundPath: string; // absolute filesystem path to the template background
  canvasWidth: number;
  canvasHeight: number;
  // A business's default Frame's decorative overlay graphic (see the Frame/
  // BusinessFrame Prisma models and src/lib/sendWish.ts), composited right
  // on top of the background — before the photo/logo/text below — so a
  // frame's border/badge art sits *behind* everything it's meant to be
  // decorating rather than covering it up. Stretched to exactly
  // canvasWidth×canvasHeight, since a frame is designed to line up with the
  // full flyer canvas.
  overlayPath?: string | null;
  namePlaceholder?: TextPlaceholder | null;
  name?: string | null; // if the contact has a Title (e.g. "Mr."), callers prefix it into this string themselves — there's no separate title placeholder
  designationPlaceholder?: TextPlaceholder | null;
  designationText?: string | null;
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
  emailPlaceholder?: TextPlaceholder | null;
  emailText?: string | null;
  addressPlaceholder?: TextPlaceholder | null;
  addressText?: string | null;
  websitePlaceholder?: TextPlaceholder | null;
  websiteText?: string | null;
  productsPlaceholder?: TextPlaceholder | null;
  productsText?: string | null;

  outputPath: string; // absolute filesystem path to write the composited JPEG
}

/**
 * Rotates an already-rendered RGBA PNG buffer clockwise by `degrees` about
 * its own center, expanding the canvas (transparent background) so nothing
 * gets clipped — sharp's default `rotate()` behavior. Returns the offset to
 * add to the buffer's originally-intended (left, top) so the *center* of the
 * rotated result lands on the same point the *center* of the unrotated
 * buffer would have: for a box positioned at (left, top) sized w×h rotated
 * to w'×h', that center-preserving offset is always ((w-w')/2, (h-h')/2)
 * regardless of how (left, top) was derived (alignment, etc.) — because
 * rotating about a fixed center always shifts the bounding box by exactly
 * half of its size delta on each axis.
 */
async function rotateBuffer(
  data: Buffer,
  width: number,
  height: number,
  degrees: number
): Promise<{ data: Buffer; width: number; height: number; offsetX: number; offsetY: number }> {
  if (!degrees) return { data, width, height, offsetX: 0, offsetY: 0 };
  const rotated = await sharp(data)
    .rotate(degrees, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });
  return {
    data: rotated.data,
    width: rotated.info.width,
    height: rotated.info.height,
    offsetX: (width - rotated.info.width) / 2,
    offsetY: (height - rotated.info.height) / 2,
  };
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
// Bundled generic placeholder photo (flat gray head-and-shoulders silhouette,
// original artwork — not a third-party icon) composited in place of a contact's
// photo whenever the template has a photo placeholder but this send has no real
// photo to use, so the flyer never ships with a blank hole where a photo goes.
const DEFAULT_AVATAR_PATH = path.join(process.cwd(), 'assets', 'images', 'default-avatar.png');
const FONT_FILE_REGULAR = path.join(FONT_DIR, 'FreeSans.ttf');
const FONT_FILE_BOLD = path.join(FONT_DIR, 'FreeSansBold.ttf');

// Additional named font choices a business can pick per text placeholder
// (Font family dropdown in the template editor). Every one of these is a
// *static* (non-variable) TTF bundled in assets/fonts and loaded directly
// via sharp's `fontfile` option below — same reliable approach as the
// default HMFont, so nothing depends on fonts being installed on the
// Railway host. These are Latin-only (no Devanagari), unlike the default.
//
// IMPORTANT: `family` must be the font file's *real* internal family name
// (what `fc-scan` reports), because that is what Pango matches on when we
// build the font description in buildTextComposite. Passing `fontfile` only
// makes the file *available*; if the description names a family that no
// loaded font has (e.g. the old made-up "HMFont"), Pango silently falls back
// to a default face and the chosen font never shows up on the sent flyer.
const NAMED_FONT_FILES: Record<string, { family: string; regular: string; bold: string }> = {
  poppins: {
    family: 'Poppins',
    regular: path.join(FONT_DIR, 'Poppins-Regular.ttf'),
    bold: path.join(FONT_DIR, 'Poppins-Bold.ttf'),
  },
  playfair: {
    family: 'Playfair Display',
    regular: path.join(FONT_DIR, 'PlayfairDisplay-Regular.ttf'),
    bold: path.join(FONT_DIR, 'PlayfairDisplay-Bold.ttf'),
  },
  'dancing-script': {
    family: 'Dancing Script',
    regular: path.join(FONT_DIR, 'DancingScript-Regular.ttf'),
    bold: path.join(FONT_DIR, 'DancingScript-Bold.ttf'),
  },
  oswald: {
    family: 'Oswald',
    regular: path.join(FONT_DIR, 'Oswald-Regular.ttf'),
    bold: path.join(FONT_DIR, 'Oswald-Bold.ttf'),
  },
  arimo: {
    family: 'Arimo',
    regular: path.join(FONT_DIR, 'Arimo-Regular.ttf'),
    bold: path.join(FONT_DIR, 'Arimo-Bold.ttf'),
  },
  tinos: {
    family: 'Tinos',
    regular: path.join(FONT_DIR, 'Tinos-Regular.ttf'),
    bold: path.join(FONT_DIR, 'Tinos-Bold.ttf'),
  },
  carlito: {
    family: 'Carlito',
    regular: path.join(FONT_DIR, 'Carlito-Regular.ttf'),
    bold: path.join(FONT_DIR, 'Carlito-Bold.ttf'),
  },
  gelasio: {
    family: 'Gelasio',
    regular: path.join(FONT_DIR, 'Gelasio-Regular.ttf'),
    bold: path.join(FONT_DIR, 'Gelasio-Bold.ttf'),
  },
};

// Real internal family name of the bundled default (FreeSans) files.
const BUNDLED_FONT_REAL_FAMILY = 'FreeSans';

/**
 * Resolves a placeholder's saved fontFamily id + weight to (a) the exact
 * .ttf file to load and (b) the Pango font description to render it with.
 * Both halves must agree: the file is registered by `fontfile`, and the
 * description picks it by its real family name and weight.
 */
function resolveFont(
  fontWeight: number | string | undefined,
  fontFamily: string | undefined,
  fontSize: number
): { fontfile: string; description: string } {
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight, 10) : fontWeight;
  const isBold = Boolean(weight && weight >= 600);
  const named = fontFamily ? NAMED_FONT_FILES[fontFamily] : undefined;
  const family = named ? named.family : BUNDLED_FONT_REAL_FAMILY;
  const fontfile = named
    ? isBold
      ? named.bold
      : named.regular
    : isBold
      ? FONT_FILE_BOLD
      : FONT_FILE_REGULAR;
  // Always state the weight explicitly. Several fonts (both weights are
  // registered in the same process over time) share one family name, so an
  // unqualified description could otherwise resolve to the other weight.
  const description = `${family} ${isBold ? 'Bold' : 'Normal'} ${Math.round(fontSize)}`;
  return { fontfile, description };
}

// Outline icons shown next to the phone/email/address/website text on a
// flyer — the exact same Heroicons paths as the matching toolbar buttons in
// TemplatePlaceholderEditor.tsx (BRAND_FIELDS), duplicated here rather than
// imported because that file is a 'use client' component. Kept in sync by
// hand; if any icon there ever changes, update it here too.
const ICON_PATHS: Record<'phone' | 'email' | 'address' | 'website', string> = {
  phone:
    'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  email:
    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  address: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  website:
    'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 013 12c0-1.605.42-3.113 1.157-4.418',
};

/**
 * Renders the phone/address icon at the same pixel size as the text it sits
 * next to (so "the icon size follows the text size") and in the exact same
 * color, then composites icon + text side by side onto one transparent
 * canvas — which buildTextComposite below then positions/aligns as a single
 * block, exactly like a plain text placeholder would be.
 */
async function buildIconTextComposite(
  icon: 'phone' | 'email' | 'address' | 'website',
  color: string,
  fontSize: number,
  textData: Buffer,
  textWidth: number,
  textHeight: number
): Promise<{ data: Buffer; width: number; height: number }> {
  const iconSize = Math.round(fontSize);
  const gap = Math.round(iconSize * 0.25);
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${escapeXml(
    color
  )}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON_PATHS[icon]}"/></svg>`;
  const iconBuffer = await sharp(Buffer.from(iconSvg)).png().toBuffer();

  const width = iconSize + gap + textWidth;
  const height = Math.max(iconSize, textHeight);

  const data = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: iconBuffer, left: 0, top: Math.round((height - iconSize) / 2) },
      { input: textData, left: iconSize + gap, top: Math.round((height - textHeight) / 2) },
    ])
    .png()
    .toBuffer();

  return { data, width, height };
}

/**
 * Renders one text placeholder (possibly multiple wrapped lines) to its own
 * small transparent PNG via sharp's native text renderer, using our bundled
 * font *file* directly (see resolveFont above) rather than a font family
 * name the host has to resolve. The (x, y) on the placeholder is treated as
 * the visual center of the rendered block — matching exactly how the
 * template editor's live preview already positions these markers
 * (`translate(-50%, -50%)` etc. in TemplatePlaceholderEditor.tsx) — so what
 * a business drags into place in the editor is what actually gets sent.
 *
 * `icon`, when set, prepends the matching outline icon (see ICON_PATHS)
 * before the text — used for phone/address, same as the editor preview.
 */
async function buildTextComposite(
  placeholder: TextPlaceholder,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  icon?: 'phone' | 'email' | 'address' | 'website'
): Promise<{ input: Buffer; left: number; top: number }> {
  // No auto-wrapping or truncation: lines break only where the source text
  // itself contains a newline (typed with Enter in Settings/the template
  // editor). Text wider than the placeholder's spot on the flyer simply
  // renders at its natural width — the business is expected to check the
  // live preview and break the line manually if needed.
  const lines = text.split('\n');
  const markup = lines.map((line) => escapeXml(line)).join('\n');
  const { fontfile, description: fontDescription } = resolveFont(
    placeholder.fontWeight,
    placeholder.fontFamily,
    placeholder.fontSize
  );

  const buffer = await sharp({
    text: {
      text: `<span foreground="${escapeXml(placeholder.color)}">${markup}</span>`,
      font: fontDescription,
      fontfile,
      rgba: true,
      align: placeholder.align === 'right' ? 'right' : placeholder.align === 'center' ? 'center' : 'left',
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });

  let { data } = buffer;
  let w = buffer.info.width;
  let h = buffer.info.height;

  if (icon) {
    const combined = await buildIconTextComposite(icon, placeholder.color, placeholder.fontSize, data, w, h);
    data = combined.data;
    w = combined.width;
    h = combined.height;
  }

  // Position (and rotation, next) is computed off the block's unrotated
  // size — rotating about a fixed center shifts the bounding box the same
  // way regardless of alignment, so this stays correct even after rotation
  // grows the canvas below.
  let rawLeft =
    placeholder.align === 'center'
      ? Math.round(placeholder.x - w / 2)
      : placeholder.align === 'right'
        ? Math.round(placeholder.x - w)
        : Math.round(placeholder.x);
  let rawTop = Math.round(placeholder.y - h / 2);

  if (placeholder.rotation) {
    const rotated = await rotateBuffer(data, w, h, placeholder.rotation);
    data = rotated.data;
    w = rotated.width;
    h = rotated.height;
    // rotateBuffer's offsetX/offsetY can be a half-pixel (it's a centering
    // delta divided by 2, and the pre/post-rotation size difference isn't
    // always even) — round straight after adding it, or sharp's composite()
    // rejects a non-integer left/top ("Expected integer for left but
    // received X.5 of type number") and the whole send fails.
    rawLeft = Math.round(rawLeft + rotated.offsetX);
    rawTop = Math.round(rawTop + rotated.offsetY);
  }

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

  const left = Math.round(Math.min(Math.max(0, rawLeft), Math.max(0, canvasWidth - w)));
  const top = Math.round(Math.min(Math.max(0, rawTop), Math.max(0, canvasHeight - h)));

  return { input: data, left, top };
}

async function buildPhotoComposite(
  photoPath: string,
  placeholder: PhotoPlaceholder
): Promise<{ input: Buffer; left: number; top: number }> {
  // width/height win when set; `size` (legacy, always square) is the
  // fallback for either dimension that's missing.
  const w = Math.round(placeholder.width ?? placeholder.size ?? 0);
  const h = Math.round(placeholder.height ?? placeholder.size ?? 0);
  const shape = placeholder.shape ?? 'circle';

  let photo = sharp(photoPath).resize(w, h, { fit: 'cover' });

  if (shape === 'circle') {
    // Non-square box → ellipse, so it still fills the whole box edge-to-edge.
    const maskSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><ellipse cx="${w / 2}" cy="${
        h / 2
      }" rx="${w / 2}" ry="${h / 2}" fill="#fff"/></svg>`
    );
    photo = photo.composite([{ input: maskSvg, blend: 'dest-in' }]);
  } else if (shape === 'rounded') {
    const radius = Math.round(Math.min(w, h) * 0.18);
    const maskSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
    );
    photo = photo.composite([{ input: maskSvg, blend: 'dest-in' }]);
  } else if (shape === 'hexagon') {
    const points = [
      [w * 0.25, 0],
      [w * 0.75, 0],
      [w, h * 0.5],
      [w * 0.75, h],
      [w * 0.25, h],
      [0, h * 0.5],
    ]
      .map(([x, y]) => `${x},${y}`)
      .join(' ');
    const maskSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><polygon points="${points}" fill="#fff"/></svg>`
    );
    photo = photo.composite([{ input: maskSvg, blend: 'dest-in' }]);
  }

  let photoBuffer = await photo.png().toBuffer();
  let left = Math.round(placeholder.x);
  let top = Math.round(placeholder.y);

  if (placeholder.rotation) {
    const rotated = await rotateBuffer(photoBuffer, w, h, placeholder.rotation);
    photoBuffer = rotated.data;
    left = Math.round(left + rotated.offsetX);
    top = Math.round(top + rotated.offsetY);
  }

  return { input: photoBuffer, left, top };
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
  let logoBuffer = await sharp(logoPath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  let left = Math.round(placeholder.x);
  let top = Math.round(placeholder.y);

  if (placeholder.rotation) {
    const rotated = await rotateBuffer(logoBuffer, size, size, placeholder.rotation);
    logoBuffer = rotated.data;
    left = Math.round(left + rotated.offsetX);
    top = Math.round(top + rotated.offsetY);
  }

  return { input: logoBuffer, left, top };
}

export async function generateFlyer(opts: GenerateFlyerOptions): Promise<string> {
  await fs.mkdir(path.dirname(opts.outputPath), { recursive: true });

  const composites: { input: Buffer; left: number; top: number }[] = [];

  if (opts.overlayPath) {
    try {
      const overlayBuffer = await sharp(opts.overlayPath)
        .resize(opts.canvasWidth, opts.canvasHeight, { fit: 'fill' })
        .png()
        .toBuffer();
      composites.push({ input: overlayBuffer, left: 0, top: 0 });
    } catch {
      // Overlay file missing on disk — skip it rather than fail the whole send.
    }
  }

  if (opts.photoPlaceholder) {
    // Prefer the contact's real photo; fall back to the bundled generic avatar
    // if there isn't one (or the file on disk has gone missing), so a template
    // built with a photo placeholder never renders with an empty gap there.
    let photoPath = opts.photoPath;
    if (photoPath) {
      try {
        await fs.access(photoPath);
      } catch {
        photoPath = null;
      }
    }
    photoPath = photoPath || DEFAULT_AVATAR_PATH;
    try {
      await fs.access(photoPath);
      composites.push(await buildPhotoComposite(photoPath, opts.photoPlaceholder));
    } catch {
      // Even the bundled fallback avatar is missing — skip entirely rather
      // than fail the whole send.
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

  const textEntries: { placeholder: TextPlaceholder; text: string; icon?: 'phone' | 'email' | 'address' | 'website' }[] = [];
  if (opts.namePlaceholder && opts.name) {
    textEntries.push({ placeholder: opts.namePlaceholder, text: opts.name });
  }
  if (opts.designationPlaceholder && opts.designationText) {
    textEntries.push({ placeholder: opts.designationPlaceholder, text: opts.designationText });
  }
  if (opts.datePlaceholder && opts.dateText) {
    textEntries.push({ placeholder: opts.datePlaceholder, text: opts.dateText });
  }
  if (opts.firmNamePlaceholder && opts.firmNameText) {
    textEntries.push({ placeholder: opts.firmNamePlaceholder, text: opts.firmNameText });
  }
  if (opts.phonePlaceholder && opts.phoneText) {
    textEntries.push({ placeholder: opts.phonePlaceholder, text: opts.phoneText, icon: 'phone' });
  }
  if (opts.emailPlaceholder && opts.emailText) {
    textEntries.push({ placeholder: opts.emailPlaceholder, text: opts.emailText, icon: 'email' });
  }
  if (opts.addressPlaceholder && opts.addressText) {
    textEntries.push({ placeholder: opts.addressPlaceholder, text: opts.addressText, icon: 'address' });
  }
  if (opts.websitePlaceholder && opts.websiteText) {
    textEntries.push({ placeholder: opts.websitePlaceholder, text: opts.websiteText, icon: 'website' });
  }
  if (opts.productsPlaceholder && opts.productsText) {
    textEntries.push({ placeholder: opts.productsPlaceholder, text: opts.productsText });
  }
  for (const { placeholder, text, icon } of textEntries) {
    if (!text.trim()) continue;
    composites.push(await buildTextComposite(placeholder, text, opts.canvasWidth, opts.canvasHeight, icon));
  }

  await sharp(opts.backgroundPath)
    .resize(opts.canvasWidth, opts.canvasHeight, { fit: 'cover' })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(opts.outputPath);

  return opts.outputPath;
}
