import type { Request } from 'express';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'application/pdf',
]);

export const ALLOWED_MIME_DOC = new Set(['application/pdf']);
export const ALLOWED_MIME_IMG = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

export const MAX_FILE_SIZE = MAX_SIZE;

export function detectBucketFromMime(mime: string, requested?: string): 'blog' | 'projects' | 'misc' {
  if (requested && ['blog', 'projects', 'misc'].includes(requested)) {
    return requested as 'blog' | 'projects' | 'misc';
  }
  if (mime.startsWith('image/')) return 'blog';
  return 'misc';
}

export function detectMediaType(mime: string): 'image' | 'document' | 'other' {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || mime.startsWith('text/')) return 'document';
  return 'other';
}

export function fileFilter(_req: Request, file: Express.Multer.File, cb: (err: Error | null, ok?: boolean) => void) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error(`Mime type ${file.mimetype} tidak diizinkan`));
  }
  cb(null, true);
}
