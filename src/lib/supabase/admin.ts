// Server-side Supabase client with elevated privileges.
//
// Bypasses RLS — used exclusively for server-to-server operations
// where there is no user session (e.g., webhook handlers).
//
// NEVER expose this client to client-side code.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function resolveAdminKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
}

export function createAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = resolveAdminKey();

  if (!url || !adminKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL e uma credencial administrativa do Supabase ' +
      '(SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY) são obrigatórias ' +
      'para operações administrativas (webhook, reconciliação).'
    );
  }

  return createClient(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
