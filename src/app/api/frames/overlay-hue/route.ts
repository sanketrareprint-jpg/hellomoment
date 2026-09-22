import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { servedUrlToAbsolutePath } from '@/lib/uploads';

/**
 * Renders a frame's overlay graphic through the exact same hue-shift Sharp
 * applies at send/preview time (see flyer.ts's generateFlyer), so the editor
 * canvas can show it recolored via <img src> instead of approximating the
 * shift with a CSS `hue-rotate()` filter — the two are different operations
 * and can visibly disagree on a multi-tone graphic (e.g. a metallic/gradient
 * banner), which was showing businesses one color while editing and a
 * different one in the actual generated flyer.
 *
 * Public by design, same as /api/files: overlay URLs are already
 * unguessable-UUID paths under STORAGE_DIR/frames with nothing sensitive in
 * them, and this only ever reads from that one subdirectory.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || '';
  const hue = Number(req.nextUrl.searchParams.get('hue') || '0');

  if (!url.startsWith('/api/files/frames/') || !Number.isInteger(hue) || hue < 0 || hue > 360) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const absolutePath = servedUrlToAbsolutePath(url);
  try {
    let image = sharp(absolutePath);
    if (hue) {
      image = image.modulate({ hue });
    }
    const buffer = await image.png().toBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        // Safe to cache hard: (url, hue) fully determines the output, and a
        // re-upload gets a fresh UUID filename rather than reusing this one.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
