import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { detectBucketFromMime, detectMediaType } from "../config/storage.js";
import { HttpError } from "../middlewares/errorHandler.js";

export interface UploadResult {
  bucket: string;
  path: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaType: "image" | "document" | "other";
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 100);
}

export async function uploadMedia(
  file: Express.Multer.File,
  requestedBucket?: string,
): Promise<UploadResult> {
  if (!file) throw new HttpError(400, "NO_FILE", "File wajib di-upload");
  const bucket = detectBucketFromMime(file.mimetype, requestedBucket);
  const ext = file.originalname.includes(".")
    ? file.originalname.split(".").pop()!.toLowerCase()
    : "bin";
  const filename = `${randomUUID()}.${ext}`;
  const path = `${bucket}/${filename}`;

  const { error } = await getSupabaseAdmin()
    .storage.from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
  if (error)
    throw new HttpError(500, "UPLOAD_FAILED", `Upload gagal: ${error.message}`);

  const { data: pub } = getSupabaseAdmin()
    .storage.from(bucket)
    .getPublicUrl(path);
  const url = pub.publicUrl;

  const result: UploadResult = {
    bucket,
    path,
    url,
    filename: sanitize(file.originalname),
    mimeType: file.mimetype,
    size: file.size,
    mediaType: detectMediaType(file.mimetype),
  };

  await prisma.media.create({
    data: { ...result, uploadedBy: null },
  });

  return result;
}

export async function deleteMedia(bucket: string, path: string) {
  if (!bucket || !path) {
    throw new HttpError(400, "INVALID_PATH", "Bucket dan path wajib diisi");
  }
  const { error } = await getSupabaseAdmin()
    .storage.from(bucket)
    .remove([path]);
  if (error)
    throw new HttpError(500, "DELETE_FAILED", `Hapus gagal: ${error.message}`);
  await prisma.media.deleteMany({ where: { bucket, path } });
  return { bucket, path };
}

export async function listMedia(params: {
  bucket?: string;
  page: number;
  pageSize: number;
}) {
  const where = params.bucket ? { bucket: params.bucket } : {};
  const [total, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
  ]);
  return {
    items,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}
