// src/lib/supabase.ts
// Server-side Supabase client. Service role key NEVER leaves backend.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Polyfill WebSocket for @supabase/realtime-js on Node 20 (no native WS).
// Must run BEFORE createClient() so the realtime constructor sees it.
import ws from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis;
if (typeof g.WebSocket === 'undefined') {
  g.WebSocket = ws as unknown as typeof globalThis.WebSocket;
}

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}
