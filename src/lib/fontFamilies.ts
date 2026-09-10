// Shared, plain-data list of the flyer font choices — used by the
// (server-only) flyer generator to pick the right bundled .ttf file, and by
// the (client) template editor to render the dropdown and preview text with
// a matching web font. No Node built-ins here so this file is safe to
// import from either side.
export type FontFamilyId = 'default' | 'poppins' | 'playfair' | 'dancing-script' | 'oswald';

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
    cssFamily: 'inherit',
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
];

/** The Google Fonts CSS2 URL that loads every non-default face for the browser preview. */
export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Playfair+Display:wght@400;700&family=Dancing+Script:wght@400;700&family=Oswald:wght@400;700&display=swap';
