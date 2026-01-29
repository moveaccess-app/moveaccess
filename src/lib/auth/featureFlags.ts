/**
 * Feature Flags de Autenticação
 * Controla qual implementação usar (mock vs Supabase)
 */

// ============================================
// FEATURE FLAGS
// ============================================

/**
 * USE_SUPABASE_AUTH
 * 
 * true  = Usa Supabase Auth (produção)
 * false = Usa authMock (desenvolvimento/demo)
 * 
 * Pode ser controlado via variável de ambiente:
 * NEXT_PUBLIC_USE_SUPABASE_AUTH=true
 */
export const USE_SUPABASE_AUTH = 
  process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH === 'true' || 
  process.env.NODE_ENV === 'production';

/**
 * DEBUG_AUTH
 * 
 * true = Logs de debug no console para troubleshooting
 */
export const DEBUG_AUTH = 
  process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true' ||
  process.env.NODE_ENV === 'development';
