// src/routes/health.routes.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ok, fail } from '../lib/apiResponse.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const uptime = process.uptime();
    const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

    // DB check
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, latencyMs: Date.now() - dbStart };
    } catch (e) {
      checks.database = { ok: false, error: (e as Error).message };
    }

    const allOk = Object.values(checks).every((c) => c.ok);
    if (!allOk) {
      return fail(res, 503, 'DEGRADED', 'Beberapa service tidak sehat', { checks });
    }
    return ok(res, { status: 'ok', uptime, checks });
  })
);
