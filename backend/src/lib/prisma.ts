// src/lib/prisma.ts
// Singleton Prisma client. Avoids exhausting connections in dev with HMR.
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { env, isProd } from "../config/env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: env.DIRECT_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: isProd ? ["error", "warn"] : ["query", "error", "warn"],
  });

globalForPrisma.prisma = prisma;
