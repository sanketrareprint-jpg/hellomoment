import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireApiBusiness } from '@/lib/session';
import { saveImageUpload } from '@/lib/uploads';

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
    const metadata = await sharp(saved.absolutePath).metadata();
    return NextResponse.json({
      url: saved.url,
      width: metadata.width ?? 1080,
      height: metadata.height ?? 1080,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
  }
}
