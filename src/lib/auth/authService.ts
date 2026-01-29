/**
 * Serviço de Autenticação - Switch
 * Alterna entre Mock e Supabase baseado em feature flag
 */

import { USE_SUPABASE_AUTH, DEBUG_AUTH } from './featureFlags';
import * as supabaseAuth from './authServiceSupabase';
import * as mockAuth from '@/mocks/authMock';

// Re-exportar tipos do Supabase (são os mais completos)
export type {
  UserType,
  StaffRole,
  PlanStatus,
  BaseUser,
  StaffUser,
  StudentUser,
  AuthUser,
  AuthSession,
  LoginResult,
} from './authServiceSupabase';

// ============================================
// DEBUG HELPER
// ============================================

function log(...args: unknown[]) {
  if (DEBUG_AUTH) {
    console.log('[AuthService]', ...args);
  }
}

// ============================================
// FUNÇÕES PÚBLICAS
// ============================================

/**
 * Login para staff (equipe)
 */
export async function loginStaff(
  email: string,
  password: string
): Promise<supabaseAuth.LoginResult> {
  log('loginStaff', { email, useSupabase: USE_SUPABASE_AUTH });

  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.loginStaff(email, password);
  }

  // Mock é síncrono, mas retornamos Promise para compatibilidade
  return mockAuth.loginStaff(email, password);
}

/**
 * Login para alunos
 */
export async function loginStudent(
  identifier: string,
  password: string
): Promise<supabaseAuth.LoginResult> {
  log('loginStudent', { identifier, useSupabase: USE_SUPABASE_AUTH });

  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.loginStudent(identifier, password);
  }

  return mockAuth.loginStudent(identifier, password);
}

/**
 * Obtém a sessão atual
 */
export async function getCurrentSession(): Promise<supabaseAuth.AuthSession | null> {
  log('getCurrentSession', { useSupabase: USE_SUPABASE_AUTH });

  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.getCurrentSession();
  }

  // Mock é síncrono - adaptar para retornar AuthSession compatível
  const mockSession = mockAuth.getSession();
  if (!mockSession) return null;

  // Converter formato do mock para formato esperado
  return {
    user: mockSession.user as supabaseAuth.AuthUser,
    access_token: mockSession.access_token,
    expires_at: mockSession.expires_at,
  };
}

/**
 * Obtém o usuário atual
 */
export async function getCurrentUser(): Promise<supabaseAuth.AuthUser | null> {
  log('getCurrentUser', { useSupabase: USE_SUPABASE_AUTH });

  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.getCurrentUser();
  }

  const user = mockAuth.getCurrentUser();
  return user as supabaseAuth.AuthUser | null;
}

/**
 * Obtém o tipo de usuário atual
 */
export async function getCurrentUserType(): Promise<supabaseAuth.UserType | null> {
  log('getCurrentUserType', { useSupabase: USE_SUPABASE_AUTH });

  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.getCurrentUserType();
  }

  return mockAuth.getCurrentUserType();
}

/**
 * Verifica se está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.isAuthenticated();
  }

  return mockAuth.isAuthenticated();
}

/**
 * Verifica se é staff
 */
export async function isStaff(): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.isStaff();
  }

  return mockAuth.isStaff();
}

/**
 * Verifica se é aluno
 */
export async function isStudent(): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.isStudent();
  }

  return mockAuth.isStudent();
}

/**
 * Faz logout
 */
export async function logout(): Promise<void> {
  log('logout', { useSupabase: USE_SUPABASE_AUTH });

  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.logout();
  }

  mockAuth.logout();
}

/**
 * Escuta mudanças de autenticação
 * Nota: Mock não suporta isso, então retorna no-op
 */
export function onAuthStateChange(
  callback: (session: supabaseAuth.AuthSession | null) => void
): () => void {
  log('onAuthStateChange', { useSupabase: USE_SUPABASE_AUTH });

  if (USE_SUPABASE_AUTH) {
    return supabaseAuth.onAuthStateChange(callback);
  }

  // Mock não tem listener, retorna no-op
  return () => {};
}

// ============================================
// EXPORT DA FLAG PARA DEBUG
// ============================================

export { USE_SUPABASE_AUTH } from './featureFlags';
