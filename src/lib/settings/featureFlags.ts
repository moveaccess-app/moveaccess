/**
 * Feature Flags - Settings Module
 */

// Feature flag para usar Supabase no módulo Settings
export const USE_SUPABASE_SETTINGS = 
  typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_USE_SUPABASE_SETTINGS === 'true'
    : false;

// Debug mode
export const DEBUG_SETTINGS = 
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_DEBUG_SETTINGS === 'true' || process.env.NODE_ENV === 'development'
    : false;
