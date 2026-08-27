import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { STORAGE_DIR } from '@/lib/uploads';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * Streams a file out of STORAGE_DIR (uploaded photos, template backgrounds,
 * generated flyers). This exists instead of Next's automatic `public/`
 * static serving specifically so that STORAGE_DIR can be a single private
 * volume that also holds the SQLite database — see the comment in
 * src/lib/uploads.ts for why that split matters.
 *
 * Publicly readable by design (no auth check): AiSensy's servers need to
 * fetch these images by URL to attach them to a WhatsApp message, and a
 * flyer/photo URL is an unguessable UUID filename, not sensitive data.
 */
// Only these top-level subdirectories are ever servable. In particular this
// deliberately excludes the "data" subdirectory some deployments (see
// README) use for the SQLite database file within the same STORAGE_DIR
// volume — that must never become reachable by URL.
const ALLOWED_SUBDIRS = new Set(['photos', 'templates', 'generated', 'logos']);

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  if (!ALLOWED_SUBDIRS.has(params.path[0])) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ext = path.extname(params.path[params.path.length - 1] || '').toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Resolve safely and confirm the result is still inside STORAGE_DIR —
  // blocks "../../etc/passwd"-style path traversal via the URL segments.
  const resolved = path.join(STORAGE_DIR, ...params.path);
  const storageRoot = path.resolve(STORAGE_DIR);
  if (!path.resolve(resolved).startsWith(storageRoot + path.sep)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const data = await fs.readFile(resolved);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
