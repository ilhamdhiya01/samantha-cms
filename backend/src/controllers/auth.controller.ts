// src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { ok, fail } from '../lib/apiResponse.js';
import { LoginInputSchema } from '../schemas/auth.schema.js';
import { HttpError } from '../middlewares/errorHandler.js';

export async function login(req: Request, res: Response) {
  const parsed = LoginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  }
  const { email, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    // Constant-time-ish: always run bcrypt to avoid timing oracle.
    await bcrypt.compare(password, '$2a$10$invalidsaltinvalidsaltinvalidsalti');
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  }

  const payload = { id: admin.id, email: admin.email };
  const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  const token = jwt.sign(payload, env.JWT_SECRET, signOptions);

  return ok(res, {
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name },
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function me(req: Request, res: Response) {
  if (!req.admin) throw new HttpError(401, 'UNAUTHORIZED', 'Tidak terautentikasi');
  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!admin) throw new HttpError(404, 'NOT_FOUND', 'Admin tidak ditemukan');
  return ok(res, admin);
}
