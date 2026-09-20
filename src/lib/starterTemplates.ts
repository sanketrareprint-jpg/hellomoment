// The bundled ready-made flyer designs offered via "Add starter flyer
// designs" (src/app/api/templates/seed-starter/route.ts) and used to find
// stale rows in src/app/api/admin/templates/cleanup-old-starters/route.ts.
// Lives outside any route.ts file because Next.js validates a route
// module's exports against a fixed set of recognized names (GET, POST,
// etc.) and rejects any other export at build time.
export const STARTERS: {
  name: string;
  occasion: 'BIRTHDAY' | 'ANNIVERSARY';
  file: string;
  // Defaults to 'circle' in corePlaceholders() when omitted.
  photoShape?: 'circle' | 'square' | 'rounded' | 'hexagon';
}[] = [
  // Birthday — Modern Luxury: 4 arched-frame styles, deep emerald green +
  // metallic gold foil, floating starburst accents, subtle paper texture
  { name: 'Starter — Birthday: Emerald Luxury — Round Arch', occasion: 'BIRTHDAY', file: 'birthday-1.jpg' },
  { name: 'Starter — Birthday: Emerald Luxury — Gothic Arch', occasion: 'BIRTHDAY', file: 'birthday-2.jpg' },
  { name: 'Starter — Birthday: Emerald Luxury — Flat Arch', occasion: 'BIRTHDAY', file: 'birthday-3.jpg' },
  { name: 'Starter — Birthday: Emerald Luxury — Ogee Arch', occasion: 'BIRTHDAY', file: 'birthday-4.jpg' },
  // Birthday — Watercolor Script: 4 pastel colorways, soft watercolor
  // botanical corners, hand-lettered script headline/subtitle, a rounded
  // photo frame (instead of the other birthday styles' circle), a soft
  // organic color blob behind it, and a thin heart-outline accent
  { name: 'Starter — Birthday: Watercolor Script — Blush Pink', occasion: 'BIRTHDAY', file: 'birthday-5.jpg', photoShape: 'rounded' },
  { name: 'Starter — Birthday: Watercolor Script — Sage Green', occasion: 'BIRTHDAY', file: 'birthday-6.jpg', photoShape: 'rounded' },
  { name: 'Starter — Birthday: Watercolor Script — Lavender', occasion: 'BIRTHDAY', file: 'birthday-7.jpg', photoShape: 'rounded' },
  { name: 'Starter — Birthday: Watercolor Script — Peach Cream', occasion: 'BIRTHDAY', file: 'birthday-8.jpg', photoShape: 'rounded' },
  // Anniversary — Modern Editorial: 4 deckled-paper placeholder styles,
  // warm terracotta/cream/olive palette, botanical line art, grain texture
  { name: 'Starter — Anniversary: Editorial Terracotta — Torn Paper', occasion: 'ANNIVERSARY', file: 'anniversary-1.jpg' },
  { name: 'Starter — Anniversary: Editorial Terracotta — Soft Rounded', occasion: 'ANNIVERSARY', file: 'anniversary-2.jpg' },
  { name: 'Starter — Anniversary: Editorial Terracotta — Arched Paper', occasion: 'ANNIVERSARY', file: 'anniversary-3.jpg' },
  { name: 'Starter — Anniversary: Editorial Terracotta — Scalloped', occasion: 'ANNIVERSARY', file: 'anniversary-4.jpg' },
];
