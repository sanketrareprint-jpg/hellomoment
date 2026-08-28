import { NextRequest, NextResponse } from 'next/server';
import { saveImageUpload } from '@/lib/uploads';

/**
 * Public, unauthenticated photo upload used only by the customer
 * self-registration form (/join/[businessId]). Deliberately narrow: it
 * just saves an image file the same way the logged-in photo upload does
 * (same type/size checks in saveImageUpload — JPG/PNG/WebP, 10MB max) and
 * hands back a URL; nothing here reads or writes any business data.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  try {
    const saved = await saveImageUpload(file, 'photos');
    return NextResponse.json({ url: saved.url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
  }
}
