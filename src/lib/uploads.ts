import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';

/**
 * All user-generated files (uploaded photos/template backgrounds, and
 * generated flyers) live under STORAGE_DIR — NOT under Next's `public/`
 * folder. This matters for deployment: a host like Railway gives you one
 * persistent volume per service, and that volume must NOT be mounted
 * inside `public/`, or anyone on the internet could guess a URL to your
 * SQLite database file. Files here are instead served through the
 * `/api/files/[...path]` route handler (see that file), which streams
 * them from STORAGE_DIR — so the volume stays private while individual
 * image files remain publicly linkable (which AiSensy needs, to fetch the
 * flyer image).
 *
 * Locally, STORAGE_DIR defaults to ./storage (gitignored) so development
 * works with zero configuration. In production, set STORAGE_DIR to your
 * mounted volume's path (e.g. "/app/storage" on Railway).
 */
export const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface SavedUpload {
  url: string; // servable URL path, e.g. /api/files/photos/<file>
  absolutePath: string; // filesystem path, for server-side processing (e.g. sharp)
}

/**
 * Saves an uploaded image File (from a multipart FormData) under
 * STORAGE_DIR/<subdir>/, returning both its servable URL and absolute
 * filesystem path. Rejects anything that isn't a recognized image type.
 */
export async function saveImageUpload(file: File, subdir: 'photos' | 'templates' | 'logos'): Promise<SavedUpload> {
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    throw new Error(`Unsupported image type: ${file.type || 'unknown'}. Use JPG, PNG, or WebP.`);
  }
  const MAX_BYTES = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 10MB).');
  }

  const filename = `${uuid()}.${ext}`;
  const dir = path.join(STORAGE_DIR, subdir);
  await fs.mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return { url: `/api/files/${subdir}/${filename}`, absolutePath };
}

/** Resolves a servable URL path (e.g. "/api/files/photos/x.jpg") back to an absolute filesystem path. */
export function servedUrlToAbsolutePath(url: string): string {
  const clean = url.replace(/^\/api\/files\//, '');
  return path.join(STORAGE_DIR, clean);
}
