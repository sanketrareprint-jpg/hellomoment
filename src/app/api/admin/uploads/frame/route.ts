import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireApiAdmin } from '@/lib/session';
import { saveImageUpload, trimOverlayPadding } from '@/lib/uploads';

// Same as /api/uploads/frame, but for the admin-only Frame gallery editor (a
// business isn't logged in when Vrushali is curating the shared frame
// library from /admin/frames).
export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

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
