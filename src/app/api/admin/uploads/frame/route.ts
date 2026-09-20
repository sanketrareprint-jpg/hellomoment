import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireApiAdmin } from '@/lib/session';
import { saveImageUpload } from '@/lib/uploads';

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
