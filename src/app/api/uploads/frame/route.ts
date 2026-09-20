import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireApiBusiness } from '@/lib/session';
import { saveImageUpload, trimOverlayPadding } from '@/lib/uploads';

// Uploads a business's own decorative frame overlay graphic (PNG/WebP/JPG —
// unlike flyer backgrounds, PNG with transparency is expected here, since
// this sits on top of every flyer as a border/badge, not as the base image).
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  try {
    const saved = await saveImageUpload(file, 'frames');
    let width: number | undefined;
    let height: number | undefined;
    try {
      // Trim any transparent padding baked into the uploaded artwork itself,
      // so the graphic reaches the file's own edges — see trimOverlayPadding.
      ({ width, height } = await trimOverlayPadding(saved.absolutePath));
    } catch {
      ({ width, height } = await sharp(saved.absolutePath).metadata());
    }
    return NextResponse.json({ url: saved.url, width: width ?? 1080, height: height ?? 1080 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
  }
}
