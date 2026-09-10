import type { Metadata } from 'next';
import './globals.css';
import { GOOGLE_FONTS_HREF } from '@/lib/fontFamilies';

export const metadata: Metadata = {
  title: 'raregreet.com — never miss a birthday or anniversary again',
  description:
    'raregreet.com automatically sends personalized WhatsApp birthday, anniversary, and festival flyers to your customers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded only so the template editor's live preview can show the extra flyer font
            choices (Poppins/Playfair Display/Dancing Script/Oswald) as they'll actually look —
            the flyers businesses actually send are rendered server-side from bundled .ttf
            files in assets/fonts, independent of this stylesheet. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={GOOGLE_FONTS_HREF} rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
