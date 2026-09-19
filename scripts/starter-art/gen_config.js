// Single fixed palette for the "Modern Luxury" birthday designs (deep
// emerald green + metallic gold foil).
const LUXURY_PALETTE = {
  top: '#0e3a2c',
  bottom: '#031310',
  light: '#3f7f66',
  gold: '#d8b968',
  name: 'emerald-gold-luxury',
};

// The 4 "Modern Luxury" birthday designs share one occasion brief but each
// gets a differently-shaped arch frame so the 4 templates read as distinct
// designs, per the "4 different blank birthday card templates" brief.
const OCCASION_BIRTHDAY_LUXURY = {
  icon: 'starburst',
  kicker: 'MODERN LUXURY',
  headline: 'Happy Birthday',
  subtitle: 'Wishing you an elegant celebration',
};

const ARCH_STYLES = ['roundArch', 'pointArch', 'flatArch', 'ogeeArch'];

// Single fixed palette for the "Modern Editorial" anniversary designs
// (warm terracotta, cream, olive). Unlike LUXURY_PALETTE (dark gradient +
// light text), this is a light cream background, so it carries its own
// text-ink colors instead of a white-headline / gold-kicker convention.
const EDITORIAL_PALETTE = {
  top: '#f5ead9', // warm cream
  bottom: '#e6d0ad', // deeper warm cream/tan
  ink: '#4a3327', // deep espresso — headline text + photo ring
  terracotta: '#bd6640', // kicker text + botanical line accents + hairline border
  olive: '#6f7247', // botanical leaf line art + subtitle text
  paper: '#f1e4cc', // deckled-edge paper placeholder fill
  name: 'terracotta-cream-olive-editorial',
};

const OCCASION_ANNIVERSARY_EDITORIAL = {
  icon: 'leafSprig',
  kicker: 'CELEBRATING LOVE',
  headline: 'Happy Anniversary',
  subtitle: 'Here’s to many more years together',
};

// The 4 "Modern Editorial" anniversary designs share one occasion brief but
// each gets a differently shaped deckled-edge paper placeholder so the 4
// templates read as distinct designs, per the "4 different blank
// anniversary card templates" brief.
const DECKLE_STYLES = ['deckleRect', 'deckleRounded', 'deckleArch', 'deckleBlob'];

// 4 soft pastel colorways for the "Watercolor Script" birthday designs —
// each keeps the same layout (watercolor leaf corners, wavy squiggle
// accents, rounded photo frame, heart-outline doodle, script typography)
// but in a different color mood, the same "one motif, 4 colorways" pattern
// LUXURY/EDITORIAL use their arch/deckle shape for instead.
const WATERCOLOR_PALETTES = [
  {
    name: 'blush-pink',
    bgTop: '#fbe4d8',
    bgBottom: '#f6d3c2',
    leaf: '#7c9473',
    leafLight: '#a9c19c',
    accent: '#b5794f',
    ink: '#5b4636',
    blob: '#f3c9b0',
  },
  {
    name: 'sage-green',
    bgTop: '#eef1e4',
    bgBottom: '#dfe6cf',
    leaf: '#5d7052',
    leafLight: '#8ea67e',
    accent: '#a9835a',
    ink: '#43503a',
    blob: '#d8e2c4',
  },
  {
    name: 'lavender',
    bgTop: '#f1e7f3',
    bgBottom: '#e3d2ea',
    leaf: '#6f7d5a',
    leafLight: '#9db589',
    accent: '#a67a9e',
    ink: '#57415c',
    blob: '#e0c9e6',
  },
  {
    name: 'peach-cream',
    bgTop: '#fdf1df',
    bgBottom: '#f8e0bd',
    leaf: '#77875a',
    leafLight: '#a3b884',
    accent: '#b97a4a',
    ink: '#5a4626',
    blob: '#f4d3a1',
  },
];

// No kicker (the reference design has none) — just a hand-lettered
// headline above the photo and a smaller script subtitle below it.
const OCCASION_BIRTHDAY_WATERCOLOR = {
  headline: 'Happy Birthday',
  subtitle: 'I wish you a very happy life',
};

module.exports = {
  LUXURY_PALETTE,
  OCCASION_BIRTHDAY_LUXURY,
  ARCH_STYLES,
  EDITORIAL_PALETTE,
  OCCASION_ANNIVERSARY_EDITORIAL,
  DECKLE_STYLES,
  WATERCOLOR_PALETTES,
  OCCASION_BIRTHDAY_WATERCOLOR,
};
