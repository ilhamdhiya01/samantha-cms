// src/middlewares/authJwt.ts
// Verifies Bearer token. Attaches `req.admin = { id, email }`.
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { fail } from "../lib/apiResponse.js";

export interface AdminPayload {
  id: number;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function authJwt(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return fail(res, 401, "UNAUTHORIZED", "Token tidak ditemukan");
  }
  const token = header.slice(7).trim();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminPayload & {
      iat: number;
      exp: number;
    };
    req.admin = { id: decoded.id, email: decoded.email };
    return next();
  } catch {
    return fail(
      res,
      401,
      "INVALID_TOKEN",
      "Token tidak valid atau sudah kedaluwarsa",
    );
  }
}
