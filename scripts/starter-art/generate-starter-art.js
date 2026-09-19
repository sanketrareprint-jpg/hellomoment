/**
 * Regenerates the 68 starter flyer background images (assets/starter-templates/*.jpg)
 * with a richer, more polished design language: soft gradient + bokeh background,
 * a gold double-border frame, a properly drawn photo-circle frame with drop shadow,
 * a ribbon banner behind the headline, and a hand-drawn icon motif per occasion
 * (balloons, hearts, diyas, kites, etc.) instead of the old thin lollipop-style icons.
 *
 * Text (kicker/headline/subtitle) is rendered via sharp's `text` + `fontfile` input
 * (same mechanism src/lib/flyer.ts uses for the live name/date overlays) so it
 * doesn't depend on system fontconfig resolving family names — it loads our own
 * bundled TTFs directly, guaranteeing consistent rendering everywhere this script runs.
 *
 * Output goes under <outDir>/<birthday|anniversary|festivals>/, matching
 * the subfolder each occasion is served from (see OCCASION_SUBDIR below and
 * src/app/api/templates/seed-starter/route.ts).
 *
 * Usage: node generate-starter-art.js [outDir] [only=birthday,diwali,...]
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { OCCASIONS, PREFIX_TO_OCCASION, PALETTES } = require('./gen_config.js');

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const FONT_DIR = path.join(PROJECT_ROOT, 'assets', 'fonts');
const OUT_DIR = process.argv[2] || path.join(PROJECT_ROOT, 'assets', 'starter-templates');
const ONLY = (process.argv[3] || '').replace(/^only=/, '').split(',').filter(Boolean);

const OCCASION_SUBDIR = {
  birthday: 'birthday',
  anniversary: 'anniversary',
};
function subdirFor(prefix) {
  return OCCASION_SUBDIR[prefix] || 'festivals';
}

const W = 1080;
const H = 1080;
const CIRCLE_CX = 540;
const CIRCLE_CY = 281; // matches corePlaceholders(): x=0.36W,y=0.12H,size=0.28W -> center (0.36+0.14)W=0.5W, (0.12+0.14)H=0.26H
const CIRCLE_R = 151;

const FONT = {
  playfairBold: path.join(FONT_DIR, 'PlayfairDisplay-Bold.ttf'),
  poppinsBold: path.join(FONT_DIR, 'Poppins-Bold.ttf'),
  poppinsRegular: path.join(FONT_DIR, 'Poppins-Regular.ttf'),
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function letterSpace(s) {
  return s.split('').join(' ');
}

async function textBuffer({ text, fontfile, fontFamily, size, color, weight }) {
  const buf = await sharp({
    text: {
      text: `<span foreground="${color}" letter_spacing="${weight === 'wide' ? 3000 : 0}">${esc(text)}</span>`,
      font: `${fontFamily} ${size}`,
      fontfile,
      rgba: true,
      align: 'center',
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return buf;
}

// ---------- decorative SVG shape builders ----------

function cornerOrnament(x, y, rotate, gold) {
  // A tasteful quarter-mandala: three arcs of dots radiating from a corner.
  let dots = '';
  const radii = [40, 66, 92];
  radii.forEach((r) => {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI / 2 / (count - 1)) * i;
      const dx = r * Math.cos(a);
      const dy = r * Math.sin(a);
      dots += `<circle cx="${dx}" cy="${dy}" r="${r === 40 ? 3.2 : 2.4}" fill="${gold}" opacity="${r === 40 ? 0.95 : 0.55}"/>`;
    }
  });
  return `<g transform="translate(${x},${y}) rotate(${rotate})">
    <path d="M0,0 A96,96 0 0 1 96,96" stroke="${gold}" stroke-width="1.4" fill="none" opacity="0.55"/>
    ${dots}
  </g>`;
}

function bokeh(cx, cy, r, color, opacity) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
}

function sparkle(cx, cy, size, color) {
  const s = size;
  return `<g transform="translate(${cx},${cy})" opacity="0.9">
    <path d="M0,-${s} L${s * 0.22},-${s * 0.22} L${s},0 L${s * 0.22},${s * 0.22} L0,${s} L-${s * 0.22},${s * 0.22} L-${s},0 L-${s * 0.22},-${s * 0.22} Z" fill="${color}"/>
  </g>`;
}

function photoFrame(gold) {
  return `
    <ellipse cx="${CIRCLE_CX}" cy="${CIRCLE_CY + 10}" rx="${CIRCLE_R + 4}" ry="${CIRCLE_R - 6}" fill="black" opacity="0.28" filter="url(#blur18)"/>
    <circle cx="${CIRCLE_CX}" cy="${CIRCLE_CY}" r="${CIRCLE_R + 14}" fill="none" stroke="${gold}" stroke-width="1.5" opacity="0.55"/>
    <circle cx="${CIRCLE_CX}" cy="${CIRCLE_CY}" r="${CIRCLE_R}" fill="none" stroke="#ffffff" stroke-width="4"/>
    <circle cx="${CIRCLE_CX}" cy="${CIRCLE_CY}" r="${CIRCLE_R}" fill="rgba(255,255,255,0.06)"/>
    <circle cx="${CIRCLE_CX - CIRCLE_R * 0.35}" cy="${CIRCLE_CY - CIRCLE_R * 0.55}" r="${CIRCLE_R * 0.28}" fill="white" opacity="0.10"/>
  `;
}

// Standalone full-canvas SVG containing just the ribbon banner shape, sized
// to exactly [y0, y0+h] — rendered as its own layer so it can be positioned
// AFTER the real text heights are measured (see renderOne), instead of
// guessing where the text will land.
function ribbonBannerSvg(y0, h, gold, dark) {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="110" y="${y0}" width="860" height="${h}" fill="${dark}" opacity="0.32" rx="3"/>
    <polygon points="110,${y0} 152,${y0 + h / 2} 110,${y0 + h}" fill="${dark}" opacity="0.32"/>
    <polygon points="970,${y0} 928,${y0 + h / 2} 970,${y0 + h}" fill="${dark}" opacity="0.32"/>
    <rect x="110" y="${y0}" width="860" height="2" fill="${gold}" opacity="0.65"/>
    <rect x="110" y="${y0 + h - 2}" width="860" height="2" fill="${gold}" opacity="0.65"/>
  </svg>`;
}

// ---------- per-occasion icon motifs (each returns an SVG <g> at 0,0, use transform to place) ----------

function iconBalloon(color, gold) {
  return `
    <g>
      <ellipse cx="0" cy="0" rx="22" ry="28" fill="${color}"/>
      <ellipse cx="-7" cy="-9" rx="7" ry="10" fill="white" opacity="0.25"/>
      <path d="M-4,27 L0,34 L4,27 Z" fill="${color}"/>
      <path d="M0,34 C 10,55 -10,70 0,95" stroke="${gold}" stroke-width="1.3" fill="none" opacity="0.8"/>
    </g>`;
}

function iconHeart(color) {
  return `
    <path d="M0,14 C-24,-10 -24,-32 -4,-32 C 6,-32 0,-20 0,-16 C 0,-20 -6,-32 4,-32 C 24,-32 24,-10 0,14 Z" fill="${color}"/>
    <ellipse cx="-8" cy="-20" rx="5" ry="7" fill="white" opacity="0.2"/>`;
}

function iconDiya(gold, flame) {
  return `
    <path d="M-26,4 C-26,20 26,20 26,4 C 26,-4 -26,-4 -26,4 Z" fill="${gold}"/>
    <path d="M-26,4 C-26,10 26,10 26,4" fill="none" stroke="black" stroke-width="1" opacity="0.15"/>
    <ellipse cx="0" cy="-18" rx="7" ry="16" fill="${flame}"/>
    <ellipse cx="0" cy="-15" rx="3.2" ry="8" fill="#fff6d8"/>
    <circle cx="0" cy="-18" r="20" fill="${flame}" opacity="0.16"/>`;
}

function iconRakhi(gold, accent) {
  return `
    <circle cx="0" cy="0" r="16" fill="none" stroke="${gold}" stroke-width="4"/>
    <circle cx="0" cy="0" r="6" fill="${accent}"/>
    <path d="M-11,11 L-18,34 M0,15 L0,40 M11,11 L18,34" stroke="${gold}" stroke-width="2" opacity="0.85"/>`;
}

function iconFirework(color, gold) {
  let rays = '';
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const r1 = 6,
      r2 = 26;
    rays += `<line x1="${r1 * Math.cos(a)}" y1="${r1 * Math.sin(a)}" x2="${r2 * Math.cos(a)}" y2="${r2 * Math.sin(a)}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`;
    rays += `<circle cx="${(r2 + 6) * Math.cos(a)}" cy="${(r2 + 6) * Math.sin(a)}" r="2" fill="${gold}"/>`;
  }
  return `<g>${rays}</g>`;
}

function iconKite(color, gold) {
  return `
    <polygon points="0,-30 20,0 0,10 -20,0" fill="${color}"/>
    <line x1="0" y1="-30" x2="0" y2="10" stroke="${gold}" stroke-width="1" opacity="0.7"/>
    <line x1="-20" y1="0" x2="20" y2="0" stroke="${gold}" stroke-width="1" opacity="0.7"/>
    <path d="M0,10 C 6,22 -6,26 0,38 C 6,50 -6,54 0,66" stroke="${gold}" stroke-width="1.3" fill="none" opacity="0.8"/>`;
}

function iconChakra(color) {
  let spokes = '';
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    spokes += `<line x1="0" y1="0" x2="${24 * Math.cos(a)}" y2="${24 * Math.sin(a)}" stroke="${color}" stroke-width="1.4" opacity="0.85"/>`;
  }
  return `<circle cx="0" cy="0" r="26" fill="none" stroke="${color}" stroke-width="2"/>${spokes}<circle cx="0" cy="0" r="3" fill="${color}"/>`;
}

function iconCrescent(gold) {
  // Robust crescent via two full-circle sub-paths + evenodd fill (the
  // overlap becomes a "hole", leaving a lune on the left) — avoids the
  // degenerate-arc pitfalls of a single two-arc crescent path.
  const circle = (cx, r) => `M ${cx - r},0 A ${r},${r} 0 1 0 ${cx + r},0 A ${r},${r} 0 1 0 ${cx - r},0 `;
  const d = circle(0, 20) + circle(10, 17);
  return `
    <path d="${d}" fill="${gold}" fill-rule="evenodd"/>
    <path d="M28,-10 L31,-2 L39,-2 L32,3 L35,11 L28,6 L21,11 L24,3 L17,-2 L25,-2 Z" fill="${gold}"/>`;
}

function iconFlower(color, gold) {
  let petals = '';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    petals += `<ellipse cx="${18 * Math.cos(a)}" cy="${18 * Math.sin(a)}" rx="12" ry="18" fill="${color}" opacity="0.9" transform="rotate(${(a * 180) / Math.PI} ${18 * Math.cos(a)} ${18 * Math.sin(a)})"/>`;
  }
  return `<g>${petals}<circle cx="0" cy="0" r="9" fill="${gold}"/></g>`;
}

function iconBauble(color, gold) {
  return `
    <rect x="-4" y="-30" width="8" height="8" rx="2" fill="${gold}"/>
    <path d="M0,-22 C -4,-22 -4,-18 0,-18 C 4,-18 4,-22 0,-22" fill="none" stroke="${gold}" stroke-width="2"/>
    <circle cx="0" cy="4" r="24" fill="${color}"/>
    <ellipse cx="-8" cy="-4" rx="7" ry="10" fill="white" opacity="0.22"/>
    <rect x="-24" y="-2" width="48" height="6" fill="${gold}" opacity="0.85"/>`;
}

function iconSplash(colors) {
  let dots = '';
  const positions = [
    [-18, -20, 7],
    [16, -14, 5],
    [0, 10, 8],
    [-22, 8, 4],
    [20, 14, 5],
    [2, -26, 4],
  ];
  positions.forEach((p, i) => {
    dots += `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="${colors[i % colors.length]}" opacity="0.92"/>`;
  });
  return `<g>${dots}</g>`;
}

function buildIcon(type, palette) {
  const { gold, light } = palette;
  switch (type) {
    case 'balloon':
      return iconBalloon(light, gold);
    case 'heart':
      return iconHeart(light);
    case 'diya':
      return iconDiya(gold, '#ffb454');
    case 'rakhi':
      return iconRakhi(gold, light);
    case 'firework':
      return iconFirework('#ffffff', gold);
    case 'kite':
      return iconKite(light, gold);
    case 'chakra':
      return iconChakra(gold);
    case 'crescent':
      return iconCrescent(gold);
    case 'flower':
      return iconFlower(light, gold);
    case 'bauble':
      return iconBauble(light, gold);
    case 'splash':
      return iconSplash(['#ffd166', '#06d6a0', '#ef476f', '#118ab2', '#ffffff']);
    default:
      return iconHeart(light);
  }
}

function scatterIcons(type, palette) {
  // Positions chosen to avoid the photo circle (top-center) and the ribbon
  // banner + text block (lower-middle band), same layout every occasion uses.
  const spots = [
    { x: 156, y: 300, s: 1.0, r: -8 },
    { x: 924, y: 300, s: 1.0, r: 8 },
    { x: 210, y: 700, s: 0.85, r: 4 },
    { x: 860, y: 700, s: 0.85, r: -4 },
    { x: 130, y: 860, s: 0.7, r: 0 },
    { x: 950, y: 860, s: 0.7, r: 0 },
  ];
  return spots
    .map((p) => `<g transform="translate(${p.x},${p.y}) scale(${p.s}) rotate(${p.r})">${buildIcon(type, palette)}</g>`)
    .join('\n');
}

function buildBackgroundSvg(palette, iconType) {
  const { top, bottom, gold } = palette;
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="${top}"/>
        <stop offset="1" stop-color="${bottom}"/>
      </linearGradient>
      <filter id="blur18" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
      <filter id="blur40" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="40"/>
      </filter>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    ${bokeh(920, 140, 160, '#ffffff', 0.05)}
    ${bokeh(120, 980, 220, '#ffffff', 0.05)}
    ${bokeh(980, 950, 120, gold, 0.10)}
    ${bokeh(80, 200, 90, gold, 0.08)}

    ${scatterIcons(iconType, palette)}

    ${photoFrame(gold)}

    ${sparkle(940, 470, 8, gold)}
    ${sparkle(150, 500, 6, gold)}
    ${sparkle(880, 640, 5, '#ffffff')}

    <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${gold}" stroke-width="2" opacity="0.8"/>
    <rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="${gold}" stroke-width="1" opacity="0.45"/>

    ${cornerOrnament(56, 56, 0, gold)}
    ${cornerOrnament(1024, 56, 90, gold)}
    ${cornerOrnament(1024, 1024, 180, gold)}
    ${cornerOrnament(56, 1024, 270, gold)}
  </svg>`;
}

async function renderOne({ file, occasionKey, variantIndex, subdir }) {
  const occ = OCCASIONS[occasionKey];
  if (!occ) throw new Error(`Unknown occasion key: ${occasionKey}`);
  const paletteIndex = ((occ.paletteStart || 0) + variantIndex) % PALETTES.length;
  const palette = PALETTES[paletteIndex];

  // Measure text FIRST so the ribbon banner can be sized to snugly wrap the
  // kicker + headline exactly, instead of guessing where they'll land.
  const kicker = await textBuffer({
    text: letterSpace(occ.kicker),
    fontfile: FONT.poppinsBold,
    fontFamily: 'Poppins',
    size: 22,
    color: palette.gold,
  });
  const headline = await textBuffer({
    text: occ.headline,
    fontfile: FONT.playfairBold,
    fontFamily: 'Playfair Display',
    size: 64,
    color: '#ffffff',
  });
  const subtitle = await textBuffer({
    text: occ.subtitle,
    fontfile: FONT.poppinsRegular,
    fontFamily: 'Poppins',
    size: 25,
    color: '#f5f0e6',
  });

  const centerX = (info) => Math.round(W / 2 - info.width / 2);

  const blockTop = 452;
  const kickerTop = blockTop;
  const headlineTop = kickerTop + kicker.info.height + 2;
  const headlineBottom = headlineTop + headline.info.height;
  const subtitleTop = headlineBottom + 26;

  const bannerY0 = kickerTop - 16;
  const bannerH = headlineBottom + 14 - bannerY0;

  const bgSvg = buildBackgroundSvg(palette, occ.icon);
  const bannerSvg = ribbonBannerSvg(bannerY0, bannerH, palette.gold, palette.bottom);

  const composites = [
    { input: Buffer.from(bannerSvg), left: 0, top: 0 },
    { input: kicker.data, left: centerX(kicker.info), top: kickerTop },
    { input: headline.data, left: centerX(headline.info), top: headlineTop },
    { input: subtitle.data, left: centerX(subtitle.info), top: subtitleTop },
  ];

  const outPath = path.join(OUT_DIR, subdir, file);
  await sharp(Buffer.from(bgSvg))
    .resize(W, H)
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(outPath);
  return outPath;
}

async function main() {
  // Build the 68-entry list the same way seed-starter/route.ts does (prefix-N.jpg).
  const COUNTS = {
    birthday: 4,
    anniversary: 4,
    diwali: 4,
    rakhi: 4,
    newyear: 4,
    sankranti: 4,
    republicday: 4,
    holi: 4,
    gudipadwa: 4,
    eidfitr: 4,
    eidadha: 4,
    independenceday: 4,
    ganeshchaturthi: 4,
    gandhijayanti: 4,
    navratri: 4,
    dussehra: 4,
    christmas: 4,
  };

  for (const dir of new Set([...Object.keys(OCCASION_SUBDIR), 'festivals'])) {
    fs.mkdirSync(path.join(OUT_DIR, dir), { recursive: true });
  }

  const jobs = [];
  for (const [prefix, occasionKey] of Object.entries(PREFIX_TO_OCCASION)) {
    if (ONLY.length && !ONLY.includes(prefix)) continue;
    const n = COUNTS[prefix];
    const subdir = subdirFor(prefix);
    for (let i = 1; i <= n; i++) {
      jobs.push({ file: `${prefix}-${i}.jpg`, occasionKey, variantIndex: i - 1, subdir });
    }
  }

  console.log(`Rendering ${jobs.length} images to ${OUT_DIR} ...`);
  for (const job of jobs) {
    await renderOne(job);
    console.log('  ok:', path.join(job.subdir, job.file));
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
