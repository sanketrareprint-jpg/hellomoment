import { NextRequest, NextResponse } from 'next/server';
import { requireApiBusiness } from '@/lib/session';
import { saveImageUpload } from '@/lib/uploads';

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

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
