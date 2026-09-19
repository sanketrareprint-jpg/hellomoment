/**
 * Generates the 8 starter flyer background images (assets/starter-templates/*.jpg):
 * 4 "Modern Luxury" birthday designs (deep emerald + gold foil, arched
 * frame, floating starburst accents, paper-grain texture) and 4 "Modern
 * Editorial" anniversary designs (warm terracotta/cream/olive, deckled-edge
 * paper placeholder, continuous-line botanical sprigs, paper-grain texture).
 *
 * Text (kicker/headline/subtitle) is rendered via sharp's `text` + `fontfile` input
 * (same mechanism src/lib/flyer.ts uses for the live name/date overlays) so it
 * doesn't depend on system fontconfig resolving family names — it loads our own
 * bundled TTFs directly, guaranteeing consistent rendering everywhere this script runs.
 *
 * Output goes under <outDir>/<birthday|anniversary>/, matching the subfolder
 * each occasion is served from (see src/app/api/templates/seed-starter/route.ts).
 *
 * Usage: node generate-starter-art.js [outDir] [only=birthday,anniversary]
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const {
  LUXURY_PALETTE,
  OCCASION_BIRTHDAY_LUXURY,
  ARCH_STYLES,
  EDITORIAL_PALETTE,
  OCCASION_ANNIVERSARY_EDITORIAL,
  DECKLE_STYLES,
  WATERCOLOR_PALETTES,
  OCCASION_BIRTHDAY_WATERCOLOR,
} = require('./gen_config.js');

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const FONT_DIR = path.join(PROJECT_ROOT, 'assets', 'fonts');
const OUT_DIR = process.argv[2] || path.join(PROJECT_ROOT, 'assets', 'starter-templates');
const ONLY = (process.argv[3] || '').replace(/^only=/, '').split(',').filter(Boolean);

const W = 1080;
const H = 1080;
const CIRCLE_CX = 540;
const CIRCLE_CY = 281; // matches corePlaceholders(): x=0.36W,y=0.12H,size=0.28W -> center (0.36+0.14)W=0.5W, (0.12+0.14)H=0.26H
const CIRCLE_R = 151;

const FONT = {
  playfairBold: path.join(FONT_DIR, 'PlayfairDisplay-Bold.ttf'),
  poppinsBold: path.join(FONT_DIR, 'Poppins-Bold.ttf'),
  poppinsRegular: path.join(FONT_DIR, 'Poppins-Regular.ttf'),
  scriptBold: path.join(FONT_DIR, 'DancingScript-Bold.ttf'),
  scriptRegular: path.join(FONT_DIR, 'DancingScript-Regular.ttf'),
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

// ---------- shared decorative SVG shape builders ----------

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

// Minimalist floating four-point starburst — a single thin diamond-cross.
function iconStarburst(gold) {
  return `
    <line x1="0" y1="-30" x2="0" y2="30" stroke="${gold}" stroke-width="1.4" opacity="0.85"/>
    <line x1="-30" y1="0" x2="30" y2="0" stroke="${gold}" stroke-width="1.4" opacity="0.85"/>
    <path d="M0,-9 L3,0 L0,9 L-3,0 Z" fill="${gold}"/>`;
}

function scatterStarbursts(gold) {
  // Positions chosen to avoid the photo circle (top-center) and the ribbon
  // banner + text block (lower-middle band).
  const spots = [
    { x: 156, y: 300, s: 1.0, r: -8 },
    { x: 924, y: 300, s: 1.0, r: 8 },
    { x: 210, y: 700, s: 0.85, r: 4 },
    { x: 860, y: 700, s: 0.85, r: -4 },
    { x: 130, y: 860, s: 0.7, r: 0 },
    { x: 950, y: 860, s: 0.7, r: 0 },
  ];
  return spots
    .map((p) => `<g transform="translate(${p.x},${p.y}) scale(${p.s}) rotate(${p.r})">${iconStarburst(gold)}</g>`)
    .join('\n');
}

// Delicate continuous-line botanical sprig — a single stroked stem with
// alternating open leaf loops, unfilled (stroke only) for the "editorial
// line art" look.
function iconLeafSprig(color) {
  return `
    <g fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
      <path d="M0,44 C -3,20 3,-12 0,-44"/>
      <path d="M0,-30 C 11,-36 21,-31 25,-20 C 14,-21 6,-25 0,-30"/>
      <path d="M0,-10 C -11,-17 -21,-13 -25,-3 C -14,-3 -6,-7 0,-10"/>
      <path d="M0,10 C 11,3 21,7 25,18 C 14,18 6,13 0,10"/>
      <path d="M0,30 C -11,23 -21,27 -25,38 C -14,38 -6,33 0,30"/>
    </g>`;
}

// ---------- "Modern Luxury" birthday design: arched frame, gold foil double
// lines, floating starburst accents, subtle paper-grain texture. ----------

const FRAME_HALF_W = CIRCLE_R + 45;
const FRAME_BOTTOM = CIRCLE_CY + CIRCLE_R + 55;
const ARCH_SPRING_Y = CIRCLE_CY - CIRCLE_R + 40;
const ARCH_TOP_Y = CIRCLE_CY - CIRCLE_R - 150;

function archTopPath(style, cx, left, right, springY, archTop) {
  switch (style) {
    case 'pointArch':
      return `M ${left},${springY} Q ${left},${archTop} ${cx},${archTop} Q ${right},${archTop} ${right},${springY}`;
    case 'flatArch': {
      const shallowTop = springY - (springY - archTop) * 0.35;
      return `M ${left},${springY} A ${right - cx},${springY - shallowTop} 0 0 1 ${right},${springY}`;
    }
    case 'ogeeArch': {
      // Onion-dome profile: flares outward past the frame edges to a
      // "shoulder", then curves back inward to a pinched point — distinct
      // from roundArch's single smooth curve.
      const bulge = 30;
      const shoulderY = springY - (springY - archTop) * 0.42;
      const apexEase = 22;
      const outerLeft = left - bulge;
      const outerRight = right + bulge;
      return (
        `M ${left},${springY} ` +
        `C ${left - bulge * 0.6},${springY - (springY - shoulderY) * 0.5} ${outerLeft},${shoulderY + (springY - shoulderY) * 0.15} ${outerLeft},${shoulderY} ` +
        `C ${outerLeft},${shoulderY - (shoulderY - archTop) * 0.55} ${cx - apexEase},${archTop} ${cx},${archTop} ` +
        `C ${cx + apexEase},${archTop} ${outerRight},${shoulderY - (shoulderY - archTop) * 0.55} ${outerRight},${shoulderY} ` +
        `C ${outerRight},${shoulderY + (springY - shoulderY) * 0.15} ${right + bulge * 0.6},${springY - (springY - shoulderY) * 0.5} ${right},${springY}`
      );
    }
    case 'roundArch':
    default:
      return `M ${left},${springY} A ${right - cx},${springY - archTop} 0 0 1 ${right},${springY}`;
  }
}

function archFrame(gold, style) {
  const cx = CIRCLE_CX;
  const left = cx - FRAME_HALF_W;
  const right = cx + FRAME_HALF_W;
  const outerTop = archTopPath(style, cx, left, right, ARCH_SPRING_Y, ARCH_TOP_Y);
  const outerPath = `${outerTop} L ${right},${FRAME_BOTTOM} L ${left},${FRAME_BOTTOM} Z`;

  // Inset a second arch outline just inside the first — the "double foil
  // line" effect — instead of drawing an actually-thicker single stroke.
  const inset = 10;
  const innerLeft = left + inset;
  const innerRight = right - inset;
  const innerTop = archTopPath(style, cx, innerLeft, innerRight, ARCH_SPRING_Y, ARCH_TOP_Y + inset);
  const innerPath = `${innerTop} L ${innerRight},${FRAME_BOTTOM - inset} L ${innerLeft},${FRAME_BOTTOM - inset} Z`;

  return `
    <path d="${outerPath}" fill="black" opacity="0.22" filter="url(#blur18)" transform="translate(0,10)"/>
    <path d="${outerPath}" fill="none" stroke="${gold}" stroke-width="3" opacity="0.9"/>
    <path d="${innerPath}" fill="none" stroke="${gold}" stroke-width="1.2" opacity="0.55"/>
    ${photoFrame(gold)}
  `;
}

function buildLuxuryBirthdaySvg(archStyle) {
  const { top, bottom, gold } = LUXURY_PALETTE;
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="${top}"/>
        <stop offset="1" stop-color="${bottom}"/>
      </linearGradient>
      <filter id="blur18" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
      <filter id="paperNoise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise"/>
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/>
      </filter>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" filter="url(#paperNoise)"/>

    ${bokeh(920, 140, 160, '#ffffff', 0.04)}
    ${bokeh(120, 980, 220, '#ffffff', 0.04)}
    ${bokeh(980, 950, 120, gold, 0.08)}
    ${bokeh(80, 200, 90, gold, 0.06)}

    ${scatterStarbursts(gold)}

    ${archFrame(gold, archStyle)}

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

// ---------- "Modern Editorial" anniversary design: deckled-edge paper
// placeholder, continuous-line botanical sprigs, grainy texture, minimalist
// cream/terracotta/olive palette with dark ink text (a light background, so
// it carries its own text colors instead of the luxury design's white/gold
// convention). ----------

// Deterministic PRNG (not Math.random()) so re-running the generator always
// produces the same "torn paper" jitter for a given seed.
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Closed path approximating a torn deckled-paper edge: samples points along
// a rectangle's (optionally rounded-corner) perimeter and jitters each one
// outward/inward along that edge's normal.
function deckledRectPath(cx, cy, halfW, halfH, seed, { amplitude = 7, step = 16, cornerRadius = 0 } = {}) {
  const rand = seededRandom(seed);
  const pts = [];
  const addEdge = (x0, y0, x1, y1, nx, ny) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const jitter = (rand() - 0.5) * 2 * amplitude;
      pts.push([x + nx * jitter, y + ny * jitter]);
    }
  };
  const left = cx - halfW;
  const right = cx + halfW;
  const top = cy - halfH;
  const bottom = cy + halfH;
  addEdge(left + cornerRadius, top, right - cornerRadius, top, 0, -1);
  addEdge(right, top + cornerRadius, right, bottom - cornerRadius, 1, 0);
  addEdge(right - cornerRadius, bottom, left + cornerRadius, bottom, 0, 1);
  addEdge(left, bottom - cornerRadius, left, top + cornerRadius, -1, 0);
  return `M ${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]},${p[1]}`).join(' ') + ' Z';
}

// Same torn-edge treatment, but around an ellipse — for the organic "blob"
// variant, distinct from the rectangular ones.
function deckledEllipsePath(cx, cy, rx, ry, seed, { amplitude = 8, points = 40 } = {}) {
  const rand = seededRandom(seed);
  const pts = [];
  for (let i = 0; i < points; i++) {
    const a = (Math.PI * 2 * i) / points;
    const jitter = (rand() - 0.5) * 2 * amplitude;
    const r = 1 + jitter / Math.max(rx, ry);
    pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]);
  }
  return `M ${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]},${p[1]}`).join(' ') + ' Z';
}

// A smooth (un-jittered) semi-ellipse arch top, joined to deckled straight
// side + bottom edges — a torn paper card with a clean arched top edge.
function deckledArchPath(cx, springY, halfW, archTop, bottom, seed, { amplitude = 7, step = 16 } = {}) {
  const pts = [];
  const archSteps = 24;
  for (let i = 0; i <= archSteps; i++) {
    const t = i / archSteps;
    const angle = Math.PI - t * Math.PI; // left (PI) -> apex (PI/2) -> right (0)
    pts.push([cx + halfW * Math.cos(angle), springY - (springY - archTop) * Math.sin(angle)]);
  }
  const rand = seededRandom(seed);
  const addEdge = (x0, y0, x1, y1, nx, ny) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const jitter = (rand() - 0.5) * 2 * amplitude;
      pts.push([x + nx * jitter, y + ny * jitter]);
    }
  };
  const left = cx - halfW;
  const right = cx + halfW;
  addEdge(right, springY, right, bottom, 1, 0);
  addEdge(right, bottom, left, bottom, 0, 1);
  addEdge(left, bottom, left, springY, -1, 0);
  return `M ${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]},${p[1]}`).join(' ') + ' Z';
}

const PAPER_HALF_W = CIRCLE_R + 55;
const PAPER_HALF_H = CIRCLE_R + 75;

function buildDeckledPaper(style, paperColor) {
  const cx = CIRCLE_CX;
  const cy = CIRCLE_CY;
  let d;
  switch (style) {
    case 'deckleRounded':
      d = deckledRectPath(cx, cy, PAPER_HALF_W, PAPER_HALF_H, 1002, { amplitude: 5, step: 20, cornerRadius: 34 });
      break;
    case 'deckleArch':
      d = deckledArchPath(cx, cy - CIRCLE_R + 40, PAPER_HALF_W, cy - CIRCLE_R - 90, cy + PAPER_HALF_H - 20, 1003);
      break;
    case 'deckleBlob':
      d = deckledEllipsePath(cx, cy + 10, PAPER_HALF_W + 15, PAPER_HALF_H + 15, 1004, { amplitude: 10, points: 44 });
      break;
    case 'deckleRect':
    default:
      d = deckledRectPath(cx, cy, PAPER_HALF_W, PAPER_HALF_H, 1001, { amplitude: 8, step: 14 });
  }
  return `
    <path d="${d}" fill="black" opacity="0.10" filter="url(#blur18)" transform="translate(0,10)"/>
    <path d="${d}" fill="${paperColor}" stroke="#00000022" stroke-width="1"/>
  `;
}

// A restrained ring around the photo circle in a dark ink tone — the shared
// photoFrame()'s white ring would have almost no contrast against this
// design's light cream background.
function photoFrameEditorial(ink) {
  return `
    <circle cx="${CIRCLE_CX}" cy="${CIRCLE_CY}" r="${CIRCLE_R + 10}" fill="none" stroke="${ink}" stroke-width="1" opacity="0.45"/>
    <circle cx="${CIRCLE_CX}" cy="${CIRCLE_CY}" r="${CIRCLE_R}" fill="none" stroke="${ink}" stroke-width="2.5"/>
    <circle cx="${CIRCLE_CX}" cy="${CIRCLE_CY}" r="${CIRCLE_R}" fill="rgba(0,0,0,0.03)"/>
  `;
}

function buildEditorialAnniversarySvg(deckleStyle) {
  const { top, bottom, ink, terracotta, olive, paper } = EDITORIAL_PALETTE;
  const leafSpots = [
    { x: 130, y: 860, s: 0.95, r: -14 },
    { x: 950, y: 860, s: 0.95, r: 14 },
    { x: 145, y: 210, s: 0.6, r: 200 },
    { x: 935, y: 210, s: 0.6, r: 160 },
  ];
  const leaves = leafSpots
    .map((p) => `<g transform="translate(${p.x},${p.y}) scale(${p.s}) rotate(${p.r})">${iconLeafSprig(olive)}</g>`)
    .join('\n');

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.25" y2="1">
        <stop offset="0" stop-color="${top}"/>
        <stop offset="1" stop-color="${bottom}"/>
      </linearGradient>
      <filter id="blur18" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
      <filter id="paperNoise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise"/>
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0.05 0"/>
      </filter>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" filter="url(#paperNoise)"/>

    ${leaves}

    ${buildDeckledPaper(deckleStyle, paper)}
    ${photoFrameEditorial(ink)}

    <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${terracotta}" stroke-width="1" opacity="0.35"/>
  </svg>`;
}

// ---------- "Watercolor Script" birthday design: soft pastel gradient,
// watercolor botanical corner branches, wavy hand-drawn squiggle accents, a
// soft organic color blob behind a rounded-square photo frame (instead of
// the other birthday styles' circle), a thin heart-outline doodle, and
// hand-lettered script typography with the headline above the photo and
// the subtitle below it — a different split-layout from LUXURY/EDITORIAL,
// which both stack kicker+headline+subtitle as one block below the photo.
// ----------

const PHOTO_LEFT = CIRCLE_CX - CIRCLE_R;
const PHOTO_TOP = CIRCLE_CY - CIRCLE_R;
const PHOTO_SIZE = CIRCLE_R * 2;
const PHOTO_RADIUS = PHOTO_SIZE * 0.18; // matches flyer.ts's 'rounded' mask exactly

// A short hand-drawn-looking wavy line, used as a corner accent.
function wavySquiggle(color) {
  return `<path d="M0,0 C20,-18 40,18 60,0 C80,-18 100,18 120,0 C140,-18 160,18 180,0" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.85"/>`;
}

function leafBlob(cx, cy, w, h, rotate, color, opacity) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${h}" fill="${color}" opacity="${opacity}" transform="rotate(${rotate} ${cx} ${cy})"/>`;
}

// A loose diagonal spray of overlapping leaf blobs — a painterly branch
// silhouette built from plain filled ellipses at varied size/opacity rather
// than a single hard-edged shape.
function watercolorLeafBranch(leaf, leafLight) {
  const leaves = [
    [0, 0, 34, 16, -20, leaf, 0.85],
    [30, -22, 30, 14, 10, leafLight, 0.75],
    [-28, -20, 28, 13, -55, leaf, 0.7],
    [55, -10, 26, 12, 30, leafLight, 0.65],
    [-10, -45, 24, 11, -15, leaf, 0.6],
    [70, -40, 22, 10, 55, leafLight, 0.55],
    [15, 20, 20, 10, -80, leaf, 0.5],
  ];
  return `<g>${leaves.map(([cx, cy, w, h, r, c, o]) => leafBlob(cx, cy, w, h, r, c, o)).join('')}</g>`;
}

// Small scattered dots over the color blob — a "glitter" texture.
function glitterDots(cx, cy, r, color) {
  const pts = [
    [-0.5, -0.3, 3],
    [0.3, -0.5, 2],
    [0.5, 0.2, 2.5],
    [-0.3, 0.4, 2],
    [0.1, -0.1, 1.8],
    [-0.6, 0.1, 2.2],
    [0.6, -0.2, 1.6],
  ];
  return pts.map(([dx, dy, rr]) => `<circle cx="${cx + dx * r}" cy="${cy + dy * r}" r="${rr}" fill="${color}" opacity="0.6"/>`).join('');
}

// Thin open heart outline (stroke only, no fill) — a small doodle accent
// near the photo corner, distinct from the filled iconHeart shape used
// elsewhere in this file.
function heartOutline(color) {
  return `<path d="M0,10 C-14,-6 -14,-20 -3,-20 C4,-20 0,-11 0,-8 C0,-11 -4,-20 3,-20 C14,-20 14,-6 0,10 Z" fill="none" stroke="${color}" stroke-width="2" opacity="0.8"/>`;
}

// A thick white "instant photo" style border with a soft shadow, matching
// the exact rounded-rect geometry flyer.ts uses for shape:'rounded' so the
// decorative frame lines up perfectly with the actual photo crop.
function photoFrameWatercolor() {
  const pad = 10;
  return `
    <rect x="${PHOTO_LEFT - pad - 4}" y="${PHOTO_TOP - pad - 4 + 10}" width="${PHOTO_SIZE + 2 * (pad + 4)}" height="${PHOTO_SIZE + 2 * (pad + 4)}" rx="${PHOTO_RADIUS + pad + 4}" fill="black" opacity="0.12" filter="url(#blur18)"/>
    <rect x="${PHOTO_LEFT - pad}" y="${PHOTO_TOP - pad}" width="${PHOTO_SIZE + 2 * pad}" height="${PHOTO_SIZE + 2 * pad}" rx="${PHOTO_RADIUS + pad}" fill="#ffffff"/>
    <rect x="${PHOTO_LEFT}" y="${PHOTO_TOP}" width="${PHOTO_SIZE}" height="${PHOTO_SIZE}" rx="${PHOTO_RADIUS}" fill="rgba(0,0,0,0.05)"/>
  `;
}

function buildWatercolorBirthdaySvg(palette) {
  const { bgTop, bgBottom, leaf, leafLight, accent, blob } = palette;
  const blobCx = CIRCLE_CX - 40;
  const blobCy = CIRCLE_CY + 10;
  const blobR = CIRCLE_R + 50;
  const blobPath = deckledEllipsePath(blobCx, blobCy, blobR, blobR, 2001, { amplitude: blobR * 0.05, points: 30 });

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bgTop}"/>
        <stop offset="1" stop-color="${bgBottom}"/>
      </linearGradient>
      <filter id="blur18" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <g transform="translate(70,60) rotate(-8)">${wavySquiggle(accent)}</g>
    <g transform="translate(830,990) rotate(4)">${wavySquiggle(accent)}</g>

    <g transform="translate(890,120) scale(1.3) rotate(35)">${watercolorLeafBranch(leaf, leafLight)}</g>
    <g transform="translate(150,940) scale(1.3) rotate(215)">${watercolorLeafBranch(leaf, leafLight)}</g>

    <path d="${blobPath}" fill="${blob}" opacity="0.55"/>
    ${glitterDots(blobCx - blobR * 0.5, blobCy - blobR * 0.4, blobR, accent)}

    ${photoFrameWatercolor()}

    <g transform="translate(${PHOTO_LEFT + PHOTO_SIZE - 16},${PHOTO_TOP + PHOTO_SIZE + 6})">${heartOutline(accent)}</g>
  </svg>`;
}

async function renderOne({ file, occasionKey, subdir, archStyle, deckleStyle, watercolorPalette }) {
  const isLuxury = occasionKey === 'birthdayLuxury';
  const isEditorial = occasionKey === 'anniversaryEditorial';
  const isWatercolor = occasionKey === 'birthdayWatercolor';

  if (isWatercolor) {
    const occ = OCCASION_BIRTHDAY_WATERCOLOR;
    const headline = await textBuffer({
      text: occ.headline,
      fontfile: FONT.scriptBold,
      fontFamily: 'Dancing Script',
      size: 92,
      color: watercolorPalette.ink,
    });
    const subtitle = await textBuffer({
      text: occ.subtitle,
      fontfile: FONT.scriptRegular,
      fontFamily: 'Dancing Script',
      size: 46,
      color: watercolorPalette.ink,
    });
    const centerX = (info) => Math.round(W / 2 - info.width / 2);
    const headlineTop = 70;
    const subtitleTop = PHOTO_TOP + PHOTO_SIZE + 40;

    const outPath = path.join(OUT_DIR, subdir, file);
    await sharp(Buffer.from(buildWatercolorBirthdaySvg(watercolorPalette)))
      .resize(W, H)
      .composite([
        { input: headline.data, left: centerX(headline.info), top: headlineTop },
        { input: subtitle.data, left: centerX(subtitle.info), top: subtitleTop },
      ])
      .jpeg({ quality: 92 })
      .toFile(outPath);
    return outPath;
  }

  const occ = isLuxury ? OCCASION_BIRTHDAY_LUXURY : OCCASION_ANNIVERSARY_EDITORIAL;
  const palette = isLuxury ? LUXURY_PALETTE : EDITORIAL_PALETTE;

  // Measure text FIRST so the ribbon banner can be sized to snugly wrap the
  // kicker + headline exactly, instead of guessing where they'll land.
  const kicker = await textBuffer({
    text: letterSpace(occ.kicker),
    fontfile: FONT.poppinsBold,
    fontFamily: 'Poppins',
    size: 22,
    color: isLuxury ? palette.gold : EDITORIAL_PALETTE.terracotta,
  });
  const headline = await textBuffer({
    text: occ.headline,
    fontfile: FONT.playfairBold,
    fontFamily: 'Playfair Display',
    size: 64,
    color: isLuxury ? '#ffffff' : EDITORIAL_PALETTE.ink,
  });
  const subtitle = await textBuffer({
    text: occ.subtitle,
    fontfile: FONT.poppinsRegular,
    fontFamily: 'Poppins',
    size: 25,
    color: isLuxury ? '#f5f0e6' : EDITORIAL_PALETTE.olive,
  });

  const centerX = (info) => Math.round(W / 2 - info.width / 2);

  // The editorial design has no ribbon banner and its deckled paper card
  // extends lower than the luxury design's arch frame, so its text block
  // starts further down to clear it.
  const blockTop = isLuxury ? 452 : 560;
  const kickerTop = blockTop;
  const headlineTop = kickerTop + kicker.info.height + 2;
  const headlineBottom = headlineTop + headline.info.height;
  const subtitleTop = headlineBottom + 26;

  const bannerY0 = kickerTop - 16;
  const bannerH = headlineBottom + 14 - bannerY0;

  const bgSvg = isLuxury ? buildLuxuryBirthdaySvg(archStyle) : buildEditorialAnniversarySvg(deckleStyle);

  const composites = [
    { input: kicker.data, left: centerX(kicker.info), top: kickerTop },
    { input: headline.data, left: centerX(headline.info), top: headlineTop },
    { input: subtitle.data, left: centerX(subtitle.info), top: subtitleTop },
  ];
  if (isLuxury) {
    const bannerSvg = ribbonBannerSvg(bannerY0, bannerH, palette.gold, palette.bottom);
    composites.unshift({ input: Buffer.from(bannerSvg), left: 0, top: 0 });
  }

  const outPath = path.join(OUT_DIR, subdir, file);
  await sharp(Buffer.from(bgSvg))
    .resize(W, H)
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(outPath);
  return outPath;
}

async function main() {
  for (const dir of ['birthday', 'anniversary']) {
    fs.mkdirSync(path.join(OUT_DIR, dir), { recursive: true });
  }

  const jobs = [];
  if (!ONLY.length || ONLY.includes('birthday')) {
    ARCH_STYLES.forEach((archStyle, idx) => {
      jobs.push({
        file: `birthday-${idx + 1}.jpg`,
        occasionKey: 'birthdayLuxury',
        subdir: 'birthday',
        archStyle,
      });
    });
    WATERCOLOR_PALETTES.forEach((watercolorPalette, idx) => {
      jobs.push({
        file: `birthday-${5 + idx}.jpg`,
        occasionKey: 'birthdayWatercolor',
        subdir: 'birthday',
        watercolorPalette,
      });
    });
  }
  if (!ONLY.length || ONLY.includes('anniversary')) {
    DECKLE_STYLES.forEach((deckleStyle, idx) => {
      jobs.push({
        file: `anniversary-${idx + 1}.jpg`,
        occasionKey: 'anniversaryEditorial',
        subdir: 'anniversary',
        deckleStyle,
      });
    });
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
