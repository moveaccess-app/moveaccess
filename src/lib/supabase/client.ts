import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Singletons para evitar múltiplas instâncias
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;
let simpleClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Client SSR para uso geral (recomendado para Server Components)
 */
export function createClient() {
  if (browserClient) {
    return browserClient;
  }
  
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return browserClient;
}

/**
 * Client simples para auth (evita problemas com SSR)
 */
export function createSimpleClient() {
  if (simpleClient) {
    return simpleClient;
  }

  simpleClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    }
  );
  
  return simpleClient;
}
