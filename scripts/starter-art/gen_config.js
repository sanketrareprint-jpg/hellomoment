// Occasion metadata: icon type + headline copy. Palette (color) is applied
// separately per variant index so every occasion gets 4 visually distinct
// colorways without hand-authoring 68 unique palettes.
const OCCASIONS = {
  birthday: { icon: 'balloon', kicker: 'WISHING YOU JOY', headline: 'Happy Birthday', subtitle: 'Wishing you a day full of joy', paletteStart: 0 },
  anniversary: { icon: 'heart', kicker: 'CELEBRATING LOVE', headline: 'Happy Anniversary', subtitle: 'Here’s to many more years together', paletteStart: 3 },
  diwali: { icon: 'diya', kicker: 'FESTIVAL OF LIGHTS', headline: 'Happy Diwali', subtitle: 'May your life sparkle with joy', paletteStart: 3 },
  rakhi: { icon: 'rakhi', kicker: 'A BOND FOR LIFE', headline: 'Happy Raksha Bandhan', subtitle: 'Celebrating the thread that binds us', paletteStart: 0 },
  newyear: { icon: 'firework', kicker: 'NEW BEGINNINGS', headline: 'Happy New Year', subtitle: 'Wishing you joy all year through', paletteStart: 1 },
  sankranti: { icon: 'kite', kicker: 'SEASON OF HARVEST', headline: 'Happy Makar Sankranti', subtitle: 'Wishing you a joyful harvest season', paletteStart: 1 },
  republicday: { icon: 'chakra', kicker: 'PROUD & FREE', headline: 'Happy Republic Day', subtitle: 'Celebrating the spirit of our nation', paletteStart: 1 },
  holi: { icon: 'splash', kicker: 'COLOURS OF JOY', headline: 'Happy Holi', subtitle: 'May your life be full of colours', paletteStart: 0 },
  gudipadwa: { icon: 'flower', kicker: 'A NEW BEGINNING', headline: 'Happy Gudi Padwa', subtitle: 'Wishing you prosperity and joy', paletteStart: 3 },
  eidfitr: { icon: 'crescent', kicker: 'EID MUBARAK', headline: 'Happy Eid ul-Fitr', subtitle: 'Wishing you peace and happiness', paletteStart: 2 },
  eidadha: { icon: 'crescent', kicker: 'EID MUBARAK', headline: 'Happy Eid ul-Adha', subtitle: 'Wishing you peace and happiness', paletteStart: 2 },
  independenceday: { icon: 'chakra', kicker: 'JAI HIND', headline: 'Happy Independence Day', subtitle: 'Celebrating the spirit of freedom', paletteStart: 1 },
  ganeshchaturthi: { icon: 'flower', kicker: 'GANPATI BAPPA MORYA', headline: 'Happy Ganesh Chaturthi', subtitle: 'Wishing you wisdom and prosperity', paletteStart: 3 },
  gandhijayanti: { icon: 'flower', kicker: 'REMEMBERING THE MAHATMA', headline: 'Gandhi Jayanti', subtitle: 'Truth, peace and non-violence', paletteStart: 1 },
  navratri: { icon: 'flower', kicker: 'NINE NIGHTS OF DEVOTION', headline: 'Happy Navratri', subtitle: 'Wishing you strength and joy', paletteStart: 0 },
  dussehra: { icon: 'flower', kicker: 'VICTORY OF GOOD', headline: 'Happy Dussehra', subtitle: 'Wishing you triumph and joy', paletteStart: 3 },
  christmas: { icon: 'bauble', kicker: 'SEASON’S GREETINGS', headline: 'Merry Christmas', subtitle: 'Wishing you a joyful holiday season', paletteStart: 3 },
};

// file-prefix -> occasion key
const PREFIX_TO_OCCASION = {
  birthday: 'birthday',
  anniversary: 'anniversary',
  diwali: 'diwali',
  rakhi: 'rakhi',
  newyear: 'newyear',
  sankranti: 'sankranti',
  republicday: 'republicday',
  holi: 'holi',
  gudipadwa: 'gudipadwa',
  eidfitr: 'eidfitr',
  eidadha: 'eidadha',
  independenceday: 'independenceday',
  ganeshchaturthi: 'ganeshchaturthi',
  gandhijayanti: 'gandhijayanti',
  navratri: 'navratri',
  dussehra: 'dussehra',
  christmas: 'christmas',
};

// 4 curated colorways, rotated (per-occasion starting offset via paletteStart
// above) so every occasion gets 4 visually distinct colorways. `light` is a
// lighter tint of `top` used for icon fills so icons stay visible against
// the background instead of blending into it.
const PALETTES = [
  { top: '#e0447b', bottom: '#3a0d2e', light: '#f78fb3', gold: '#ffd98e', name: 'rose' }, // pink/rose
  { top: '#123a63', bottom: '#050b19', light: '#5e8ec2', gold: '#ffd98e', name: 'midnight' }, // deep blue
  { top: '#1d6e4a', bottom: '#052013', light: '#57b489', gold: '#f4dc9a', name: 'emerald' }, // green
  { top: '#8a1c2e', bottom: '#2a0509', light: '#d97186', gold: '#f0c674', name: 'crimson' }, // red/maroon
];

// Single fixed palette for the "Modern Luxury" birthday variants (deep
// emerald green + metallic gold foil), kept OUT of PALETTES above so it
// never shifts the % PALETTES.length rotation used by every other occasion.
const LUXURY_PALETTE = {
  top: '#0e3a2c',
  bottom: '#031310',
  light: '#3f7f66',
  gold: '#d8b968',
  name: 'emerald-gold-luxury',
};

// The 4 "Modern Luxury" birthday variants share one occasion brief but each
// gets a differently-shaped arch frame so the 4 templates read as distinct
// designs, per the "4 different blank birthday card templates" brief.
const OCCASION_BIRTHDAY_LUXURY = {
  icon: 'starburst',
  kicker: 'MODERN LUXURY',
  headline: 'Happy Birthday',
  subtitle: 'Wishing you an elegant celebration',
};

const ARCH_STYLES = ['roundArch', 'pointArch', 'flatArch', 'ogeeArch'];

// Single fixed palette for the "Modern Editorial" anniversary variants
// (warm terracotta, cream, olive) — kept OUT of PALETTES for the same
// reason as LUXURY_PALETTE above. Unlike every other design (dark
// gradient + light text), this one is a light cream background, so it
// carries its own text-ink colors instead of reusing the shared
// white-headline / gold-kicker convention.
const EDITORIAL_PALETTE = {
  top: '#f5ead9', // warm cream
  bottom: '#e6d0ad', // deeper warm cream/tan
  ink: '#4a3327', // deep espresso — headline text + photo ring
  terracotta: '#bd6640', // kicker text + botanical line accents + hairline border
  olive: '#6f7247', // botanical leaf line art + subtitle text
  paper: '#f1e4cc', // deckled-edge paper placeholder fill
  name: 'terracotta-cream-olive-editorial',
};

// The 4 "Modern Editorial" anniversary variants share one occasion brief
// (reusing OCCASIONS.anniversary's copy) but each gets a differently
// shaped deckled-edge paper placeholder so the 4 templates read as
// distinct designs, per the "4 different blank anniversary card
// templates" brief.
const DECKLE_STYLES = ['deckleRect', 'deckleRounded', 'deckleArch', 'deckleBlob'];

module.exports = {
  OCCASIONS,
  PREFIX_TO_OCCASION,
  PALETTES,
  LUXURY_PALETTE,
  OCCASION_BIRTHDAY_LUXURY,
  ARCH_STYLES,
  EDITORIAL_PALETTE,
  DECKLE_STYLES,
};
