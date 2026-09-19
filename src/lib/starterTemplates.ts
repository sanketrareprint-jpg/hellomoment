// The bundled ready-made flyer designs offered via "Add starter flyer
// designs" (src/app/api/templates/seed-starter/route.ts) and used to find
// stale rows in src/app/api/admin/templates/cleanup-old-starters/route.ts.
// Lives outside any route.ts file because Next.js validates a route
// module's exports against a fixed set of recognized names (GET, POST,
// etc.) and rejects any other export at build time.
export const STARTERS: { name: string; occasion: 'BIRTHDAY' | 'ANNIVERSARY'; file: string }[] = [
  // Birthday — Modern Luxury: 4 arched-frame styles, deep emerald green +
  // metallic gold foil, floating starburst accents, subtle paper texture
  { name: 'Starter — Birthday: Emerald Luxury — Round Arch', occasion: 'BIRTHDAY', file: 'birthday-1.jpg' },
  { name: 'Starter — Birthday: Emerald Luxury — Gothic Arch', occasion: 'BIRTHDAY', file: 'birthday-2.jpg' },
  { name: 'Starter — Birthday: Emerald Luxury — Flat Arch', occasion: 'BIRTHDAY', file: 'birthday-3.jpg' },
  { name: 'Starter — Birthday: Emerald Luxury — Ogee Arch', occasion: 'BIRTHDAY', file: 'birthday-4.jpg' },
  // Anniversary — Modern Editorial: 4 deckled-paper placeholder styles,
  // warm terracotta/cream/olive palette, botanical line art, grain texture
  { name: 'Starter — Anniversary: Editorial Terracotta — Torn Paper', occasion: 'ANNIVERSARY', file: 'anniversary-1.jpg' },
  { name: 'Starter — Anniversary: Editorial Terracotta — Soft Rounded', occasion: 'ANNIVERSARY', file: 'anniversary-2.jpg' },
  { name: 'Starter — Anniversary: Editorial Terracotta — Arched Paper', occasion: 'ANNIVERSARY', file: 'anniversary-3.jpg' },
  { name: 'Starter — Anniversary: Editorial Terracotta — Scalloped', occasion: 'ANNIVERSARY', file: 'anniversary-4.jpg' },
];
