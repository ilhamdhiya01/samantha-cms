// src/middlewares/errorHandler.ts
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { fail } from "../lib/apiResponse.js";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function notFound(_req: Request, res: Response) {
  return fail(res, 404, "NOT_FOUND", "Endpoint tidak ditemukan");
}

function asMulterError(err: unknown): multer.MulterError | null {
  // multer exposes a `code` field on its error instances
  if (err instanceof multer.MulterError) return err;
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  ) {
    const code = (err as { code: string }).code;
    if (code === "LIMIT_FILE_SIZE" || code.startsWith("LIMIT_")) {
      return err as unknown as multer.MulterError;
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return fail(
      res,
      400,
      "VALIDATION_ERROR",
      "Payload tidak valid",
      err.flatten(),
    );
  }
  if (err instanceof HttpError) {
    return fail(res, err.status, err.code, err.message, err.details);
  }

  const mErr = asMulterError(err);
  if (mErr) {
    if (mErr.code === "LIMIT_FILE_SIZE") {
      return fail(
        res,
        413,
        "FILE_TOO_LARGE",
        "File lebih dari batas ukuran (5MB)",
      );
    }
    if (mErr.code === "LIMIT_UNEXPECTED_FILE") {
      return fail(
        res,
        400,
        "UPLOAD_ERROR",
        `Field upload tidak dikenal: ${mErr.field ?? "?"}`,
      );
    }
    return fail(res, 400, "UPLOAD_ERROR", mErr.message || "Upload gagal");
  }

  // Body parser / CORS errors may surface as Error with `type`. Express body-parser throws a 4xx-style error too.
  if (err instanceof SyntaxError && "body" in err) {
    return fail(res, 400, "INVALID_JSON", "Body request bukan JSON valid");
  }

  // eslint-disable-next-line no-console
  console.error("[unhandled-error]", err);
  return fail(res, 500, "INTERNAL_ERROR", "Terjadi kesalahan pada server");
}
