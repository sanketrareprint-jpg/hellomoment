// Shared, plain-data list of the flyer font choices — used by the
// (server-only) flyer generator to pick the right bundled .ttf file, and by
// the (client) template editor to render the dropdown and preview text with
// a matching web font. No Node built-ins here so this file is safe to
// import from either side.
export type FontFamilyId =
  | 'default'
  | 'poppins'
  | 'playfair'
  | 'dancing-script'
  | 'oswald'
  | 'arimo'
  | 'tinos'
  | 'carlito'
  | 'gelasio'
  | 'lobster'
  | 'great-vibes'
  | 'pacifico'
  | 'bebas-neue'
  | 'abril-fatface'
  | 'anton'
  | 'archivo-black'
  | 'righteous'
  | 'amatic-sc'
  | 'kaushan-script'
  | 'sacramento'
  | 'allura'
  | 'courgette'
  | 'pt-serif'
  | 'pt-sans'
  | 'crimson-text'
  | 'space-mono'
  | 'ubuntu'
  | 'patrick-hand'
  | 'orbitron';

export interface FontFamilyOption {
  id: FontFamilyId;
  label: string;
  /** CSS font-family value for the live preview in the browser. */
  cssFamily: string;
  /** Whether this face has Devanagari glyphs (Marathi firm names etc). Only the bundled default does. */
  supportsDevanagari: boolean;
}

export const FONT_FAMILIES: FontFamilyOption[] = [
  {
    id: 'default',
    label: 'Default (English + Marathi)',
    // 'HMFontPreview' is the same bundled FreeSans .ttf server-side
    // rendering uses (see BUNDLED_FONT_FAMILY in src/lib/flyer.ts),
    // @font-face'd in globals.css from public/fonts — NOT 'inherit', which
    // used to just pick up whatever UI font the surrounding page (and thus
    // the viewer's own OS/browser) happened to be using, so the preview
    // never actually showed the font real flyers are sent with.
    cssFamily: "'HMFontPreview', sans-serif",
    supportsDevanagari: true,
  },
  {
    id: 'poppins',
    label: 'Poppins — modern (English only)',
    cssFamily: "'Poppins', sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'playfair',
    label: 'Playfair Display — elegant serif (English only)',
    cssFamily: "'Playfair Display', serif",
    supportsDevanagari: false,
  },
  {
    id: 'dancing-script',
    label: 'Dancing Script — handwritten (English only)',
    cssFamily: "'Dancing Script', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'oswald',
    label: 'Oswald — bold headline (English only)',
    cssFamily: "'Oswald', sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'arimo',
    label: 'Arimo — Arial-style (English only)',
    cssFamily: "'Arimo', Arial, sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'tinos',
    label: 'Tinos — Times New Roman-style (English only)',
    cssFamily: "'Tinos', 'Times New Roman', serif",
    supportsDevanagari: false,
  },
  {
    id: 'carlito',
    label: 'Carlito — Calibri-style (English only)',
    cssFamily: "'Carlito', Calibri, sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'gelasio',
    label: 'Gelasio — Georgia-style (English only)',
    cssFamily: "'Gelasio', Georgia, serif",
    supportsDevanagari: false,
  },
  {
    id: 'lobster',
    label: 'Lobster — bold script (English only)',
    cssFamily: "'Lobster', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'great-vibes',
    label: 'Great Vibes — elegant calligraphy (English only)',
    cssFamily: "'Great Vibes', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'pacifico',
    label: 'Pacifico — fun casual script (English only)',
    cssFamily: "'Pacifico', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'bebas-neue',
    label: 'Bebas Neue — bold condensed headline (English only)',
    cssFamily: "'Bebas Neue', sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'abril-fatface',
    label: 'Abril Fatface — dramatic display serif (English only)',
    cssFamily: "'Abril Fatface', serif",
    supportsDevanagari: false,
  },
  {
    id: 'anton',
    label: 'Anton — ultra-bold condensed headline (English only)',
    cssFamily: "'Anton', sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'archivo-black',
    label: 'Archivo Black — bold sans headline (English only)',
    cssFamily: "'Archivo Black', sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'righteous',
    label: 'Righteous — fun rounded display (English only)',
    cssFamily: "'Righteous', sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'amatic-sc',
    label: 'Amatic SC — quirky hand-drawn display (English only)',
    cssFamily: "'Amatic SC', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'kaushan-script',
    label: 'Kaushan Script — flowing brush script (English only)',
    cssFamily: "'Kaushan Script', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'sacramento',
    label: 'Sacramento — elegant thin script (English only)',
    cssFamily: "'Sacramento', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'allura',
    label: 'Allura — wedding calligraphy (English only)',
    cssFamily: "'Allura', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'courgette',
    label: 'Courgette — casual rounded script (English only)',
    cssFamily: "'Courgette', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'pt-serif',
    label: 'PT Serif — classic readable serif (English only)',
    cssFamily: "'PT Serif', serif",
    supportsDevanagari: false,
  },
  {
    id: 'pt-sans',
    label: 'PT Sans — clean modern sans (English only)',
    cssFamily: "'PT Sans', sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'crimson-text',
    label: 'Crimson Text — literary serif (English only)',
    cssFamily: "'Crimson Text', serif",
    supportsDevanagari: false,
  },
  {
    id: 'space-mono',
    label: 'Space Mono — distinctive monospace (English only)',
    cssFamily: "'Space Mono', monospace",
    supportsDevanagari: false,
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu — humanist modern sans (English only)',
    cssFamily: "'Ubuntu', sans-serif",
    supportsDevanagari: false,
  },
  {
    id: 'patrick-hand',
    label: 'Patrick Hand — casual handwriting (English only)',
    cssFamily: "'Patrick Hand', cursive",
    supportsDevanagari: false,
  },
  {
    id: 'orbitron',
    label: 'Orbitron — futuristic sci-fi display (English only)',
    cssFamily: "'Orbitron', sans-serif",
    supportsDevanagari: false,
  },
];

/** CSS font-family value for a given font id, falling back to the default face. */
export function resolveCssFontFamily(id?: string): string {
  return (FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES.find((f) => f.id === 'default'))!.cssFamily;
}

/** The Google Fonts CSS2 URL that loads every non-default face for the browser preview. */
export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Playfair+Display:wght@400;700&family=Dancing+Script:wght@400;700&family=Oswald:wght@400;700&family=Arimo:wght@400;700&family=Tinos:wght@400;700&family=Carlito:wght@400;700&family=Gelasio:wght@400;700&family=Lobster&family=Great+Vibes&family=Pacifico&family=Bebas+Neue&family=Abril+Fatface&family=Anton&family=Archivo+Black&family=Righteous&family=Amatic+SC:wght@400;700&family=Kaushan+Script&family=Sacramento&family=Allura&family=Courgette&family=PT+Serif:wght@400;700&family=PT+Sans:wght@400;700&family=Crimson+Text:wght@400;700&family=Space+Mono:wght@400;700&family=Ubuntu:wght@400;700&family=Patrick+Hand&family=Orbitron:wght@400;700&display=swap';
