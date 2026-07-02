import type { Request, Response } from "express";
import { fail, ok, created } from "../lib/apiResponse.js";
import { HttpError } from "../middlewares/errorHandler.js";
import {
  listMedia,
  uploadMedia,
  deleteMedia,
} from "../services/media.service.js";
import { MediaQuerySchema } from "../schemas/media.schema.js";

export async function uploadHandler(req: Request, res: Response) {
  const file = req.file;
  if (!file) throw new HttpError(400, "NO_FILE", 'Field "file" wajib diisi');
  const requestedBucket =
    typeof req.body.bucket === "string" ? req.body.bucket : undefined;
  const result = await uploadMedia(file, requestedBucket);
  return created(res, result);
}

export async function listHandler(req: Request, res: Response) {
  const parsed = MediaQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return fail(
      res,
      400,
      "VALIDATION_ERROR",
      "Query tidak valid",
      parsed.error.flatten(),
    );
  const data = await listMedia(parsed.data);
  return ok(res, data.items, data.pagination);
}

export async function deleteHandler(req: Request, res: Response) {
  const bucket = req.params.bucket;
  const path = req.params[0];
  if (!bucket || !path) {
    throw new HttpError(400, "INVALID_PATH", "Bucket dan path wajib diisi");
  }
  await deleteMedia(bucket, path);
  return ok(res, { deleted: true });
}
