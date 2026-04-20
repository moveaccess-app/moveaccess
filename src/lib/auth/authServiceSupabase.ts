/**
 * Serviço de Autenticação - Supabase
 * Interface compatível com authMock para facilitar migração
 *
 * Usa o client browser do Supabase para persistir a sessão de forma
 * compatível com o middleware SSR, enquanto mantém fetch direto para
 * leitura de perfil e lookups auxiliares.
 */

import type { Tables } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';

// Helper para gerar a chave do localStorage (mesmo padrão do Supabase SDK)
function getStorageKey(): string {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  return `sb-${projectRef}-auth-token`;
}

// ============================================
// TIPOS (compatíveis com authMock)
// ============================================

export type UserType = 'staff' | 'student';
export type StaffRole = 'admin' | 'manager' | 'receptionist' | 'financial' | 'readonly';
export type PlanStatus = 'active' | 'expired' | 'pending' | 'suspended' | 'cancelled';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
  avatar?: string;
  created_at: string;
  setup_completed?: boolean;
}

export interface StaffUser extends BaseUser {
  user_type: 'staff';
  role: StaffRole;
  permissions: string[];
  staff_status?: string | null;
}

export interface StudentUser extends BaseUser {
  user_type: 'student';
  cpf: string;
  phone: string;
  plan_name?: string;
  plan_status?: PlanStatus;
  plan_expires_at?: string;
  student_status?: string | null;
}

export type AuthUser = StaffUser | StudentUser;

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  expires_at: string;
}

export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

// ============================================
// HELPERS
// ============================================

type MyProfile = Tables<'my_profile'>;

function toIsoExpiry(expiresAtSeconds?: number | null): string {
  const expiresAt = expiresAtSeconds ?? Math.floor(Date.now() / 1000) + 3600;
  return new Date(expiresAt * 1000).toISOString();
}

async function fetchMyProfile(accessToken: string): Promise<MyProfile | null> {
  const profileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/my_profile?select=*`;
  const profileResponse = await fetch(profileUrl, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    return null;
  }

  const profileData = await profileResponse.json();
  const profile = Array.isArray(profileData) ? profileData[0] : profileData;

  if (!profile || profile.error) {
    return null;
  }

  return profile as MyProfile;
}

/**
 * Converte profile do Supabase para o formato AuthUser esperado pela UI
 */
function profileToAuthUser(profile: MyProfile): AuthUser {
  // setup_completed comes from the updated my_profile view
  const setupCompleted = (profile as Record<string, unknown>).setup_completed;

  if (profile.user_type === 'staff') {
    return {
      id: profile.id!,
      name: profile.name || 'Usuário',
      email: profile.email || '',
      user_type: 'staff',
      role: (profile.role as StaffRole) || 'receptionist',
      permissions: profile.custom_permissions || [],
      staff_status: profile.staff_status || null,
      avatar: profile.avatar_url || undefined,
      created_at: profile.created_at || new Date().toISOString(),
      setup_completed: typeof setupCompleted === 'boolean' ? setupCompleted : true,
    };
  }

  return {
    id: profile.id!,
    name: profile.name || 'Aluno',
    email: profile.email || '',
    user_type: 'student',
    cpf: profile.cpf || '',
    phone: profile.phone || '',
    plan_name: profile.plan_name || undefined,
    plan_status: (profile.plan_status as PlanStatus) || undefined,
    plan_expires_at: profile.plan_expires_at || undefined,
    student_status: profile.student_status || null,
    avatar: profile.avatar_url || undefined,
    created_at: profile.created_at || new Date().toISOString(),
  };
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

/**
 * Login para staff (equipe)
 */
export async function loginStaff(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session?.access_token) {
      return { success: false, error: error?.message || 'Erro na autenticação' };
    }

    const profile = await fetchMyProfile(data.session.access_token);

    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, error: 'Perfil não encontrado' };
    }

    // Verificar se é staff
    if (profile.user_type !== 'staff') {
      return { success: false, error: 'Acesso negado. Use o login de aluno.' };
    }

    // Verificar status
    if (profile.staff_status !== 'active') {
      return { success: false, error: 'Conta inativa ou pendente de aprovação.' };
    }

    // Atualizar last_login via fetch
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/staff_profiles?id=eq.${data.user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${data.session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ last_login_at: new Date().toISOString() }),
    });

    const authUser = profileToAuthUser(profile);
    const session: AuthSession = {
      user: authUser,
      access_token: data.session.access_token,
      expires_at: toIsoExpiry(data.session.expires_at),
    };

    return { success: true, session };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}

/**
 * Login para alunos
 * Aceita email ou CPF como identificador
 */
export async function loginStudent(
  identifier: string,
  password: string
): Promise<LoginResult> {
  try {
    let email = identifier;

    // Se não é email, buscar email pelo CPF
    if (!identifier.includes('@')) {
      const cpfClean = identifier.replace(/\D/g, '');
      
      // Buscar email via REST API
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=email&cpf=eq.${cpfClean}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      });
      
      const profiles = await response.json();

      if (!profiles || profiles.length === 0 || !profiles[0]?.email) {
        return { success: false, error: 'CPF não encontrado' };
      }

      email = profiles[0].email;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session?.access_token) {
      return { success: false, error: error?.message || 'Erro na autenticação' };
    }

    const profile = await fetchMyProfile(data.session.access_token);

    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, error: 'Perfil não encontrado' };
    }

    // Verificar se é student
    if (profile.user_type !== 'student') {
      return { success: false, error: 'Acesso negado. Use o login da equipe.' };
    }

    // Verificar status
    if (profile.student_status === 'blocked') {
      return { success: false, error: 'Conta bloqueada. Entre em contato com a academia.' };
    }

    const authUser = profileToAuthUser(profile);
    const session: AuthSession = {
      user: authUser,
      access_token: data.session.access_token,
      expires_at: toIsoExpiry(data.session.expires_at),
    };

    return { success: true, session };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}

/**
 * Obtém a sessão atual (usando localStorage + fetch)
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  // Verificar se está no browser
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    const activeSession = data.session;

    if (error || !activeSession?.access_token) {
      return null;
    }

    const profile = await fetchMyProfile(activeSession.access_token);

    if (!profile) {
      await supabase.auth.signOut();
      return null;
    }

    const authUser = profileToAuthUser(profile);
    return {
      user: authUser,
      access_token: activeSession.access_token,
      expires_at: toIsoExpiry(activeSession.expires_at),
    };
  } catch {
    return null;
  }
}

/**
 * Obtém o usuário atual
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getCurrentSession();
  return session?.user || null;
}

/**
 * Obtém o tipo de usuário atual
 */
export async function getCurrentUserType(): Promise<UserType | null> {
  const user = await getCurrentUser();
  return user?.user_type || null;
}

/**
 * Verifica se está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Verifica se é staff
 */
export async function isStaff(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.user_type === 'staff';
}

/**
 * Verifica se é aluno
 */
export async function isStudent(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.user_type === 'student';
}

/**
 * Faz logout
 */
export async function logout(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = getStorageKey();

  try {
    await createClient().auth.signOut();
  } catch {
    // Ignorar erros de logout no SDK
  }

  // Sempre limpar localStorage
  localStorage.removeItem(storageKey);
}

/**
 * Escuta mudanças de autenticação
 */
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const supabase = createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, activeSession) => {
    if (!activeSession?.access_token) {
      callback(null);
      return;
    }

    const profile = await fetchMyProfile(activeSession.access_token);

    if (!profile) {
      callback(null);
      return;
    }

    callback({
      user: profileToAuthUser(profile),
      access_token: activeSession.access_token,
      expires_at: toIsoExpiry(activeSession.expires_at),
    });
  });

  return () => {
    subscription.unsubscribe();
  };
}
