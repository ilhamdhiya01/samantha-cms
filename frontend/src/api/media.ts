import { apiClient, unwrap } from "./client";

export interface MediaItem {
  id: number;
  bucket: string;
  path: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaType: "image" | "document" | "other";
  createdAt: string;
}

export async function listMedia(
  params: { bucket?: string; page?: number; pageSize?: number } = {},
) {
  const res = await apiClient.get("/media", { params });
  return {
    items: unwrap<MediaItem[]>(res.data),
    meta: (res.data as { meta?: Record<string, unknown> }).meta ?? {},
  };
}

export async function uploadMedia(file: File, bucket?: string) {
  const fd = new FormData();
  fd.append("file", file);
  if (bucket) fd.append("bucket", bucket);
  const res = await apiClient.post("/media/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<MediaItem>(res.data);
}

export async function deleteMedia(bucket: string, path: string) {
  await apiClient.delete(`/media/${bucket}/${path}`);
}
