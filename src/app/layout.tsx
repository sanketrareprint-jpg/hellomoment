import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { GOOGLE_FONTS_HREF } from '@/lib/fontFamilies';

// Google Analytics (GA4) measurement ID for raregreet.com's property.
const GA_MEASUREMENT_ID = 'G-5XH0Q5S19J';

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

        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
