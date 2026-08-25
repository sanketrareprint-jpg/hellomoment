import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'hellomoment.in — never miss a birthday or anniversary again',
  description:
    'hellomoment.in automatically sends personalized WhatsApp birthday, anniversary, and festival flyers to your customers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
