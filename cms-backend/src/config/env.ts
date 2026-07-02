// src/config/env.ts
// Centralized, typed environment loader. Fail fast if required vars are missing.
import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4001),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL wajib diisi'),

  SUPABASE_URL: z.string().url('SUPABASE_URL harus URL valid'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY wajib diisi'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET minimal 16 karakter'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:5174'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Print all env issues in a readable way, then exit.
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';

export const corsOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
