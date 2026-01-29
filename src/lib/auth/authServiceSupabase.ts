/**
 * Serviço de Autenticação - Supabase
 * Interface compatível com authMock para facilitar migração
 * 
 * NOTA: Usa fetch() direto ao invés do SDK para evitar problemas
 * de Promise hanging no Next.js 16
 */

import type { Views } from '@/lib/supabase/types';

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
}

export interface StaffUser extends BaseUser {
  user_type: 'staff';
  role: StaffRole;
  permissions: string[];
}

export interface StudentUser extends BaseUser {
  user_type: 'student';
  cpf: string;
  phone: string;
  plan_name?: string;
  plan_status?: PlanStatus;
  plan_expires_at?: string;
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

type MyProfile = Views<'my_profile'>;

/**
 * Converte profile do Supabase para o formato AuthUser esperado pela UI
 */
function profileToAuthUser(profile: MyProfile): AuthUser {
  if (profile.user_type === 'staff') {
    return {
      id: profile.id!,
      name: profile.name || 'Usuário',
      email: profile.email || '',
      user_type: 'staff',
      role: (profile.role as StaffRole) || 'receptionist',
      permissions: profile.custom_permissions || [],
      avatar: profile.avatar_url || undefined,
      created_at: profile.created_at || new Date().toISOString(),
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
    // Usar fetch direto para evitar SDK travando
    const signInUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const signInResponse = await fetch(signInUrl, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const signInData = await signInResponse.json();

    if (signInData.error || !signInData.access_token) {
      return { success: false, error: signInData.error_description || signInData.error || 'Erro na autenticação' };
    }

    // Buscar perfil completo via fetch
    const profileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/my_profile?select=*`;
    const profileResponse = await fetch(profileUrl, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${signInData.access_token}`,
      },
    });
    
    const profileData = await profileResponse.json();
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;

    if (!profile || profile.error) {
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
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/staff_profiles?id=eq.${signInData.user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${signInData.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ last_login_at: new Date().toISOString() }),
    });

    const authUser = profileToAuthUser(profile);
    const session: AuthSession = {
      user: authUser,
      access_token: signInData.access_token,
      expires_at: new Date(signInData.expires_at * 1000).toISOString(),
    };

    // Salvar sessão no storage para persistência
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
        JSON.stringify({
          access_token: signInData.access_token,
          refresh_token: signInData.refresh_token,
          expires_at: signInData.expires_at,
          user: signInData.user,
        })
      );
    }

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

    // Autenticar via fetch
    const signInUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const signInResponse = await fetch(signInUrl, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const signInData = await signInResponse.json();

    if (signInData.error || !signInData.access_token) {
      return { success: false, error: signInData.error_description || signInData.error || 'Erro na autenticação' };
    }

    // Buscar perfil completo
    const profileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/my_profile?select=*`;
    const profileResponse = await fetch(profileUrl, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${signInData.access_token}`,
      },
    });
    
    const profileData = await profileResponse.json();
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;

    if (!profile || profile.error) {
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
      access_token: signInData.access_token,
      expires_at: new Date(signInData.expires_at * 1000).toISOString(),
    };

    // Salvar sessão no storage para persistência
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
        JSON.stringify({
          access_token: signInData.access_token,
          refresh_token: signInData.refresh_token,
          expires_at: signInData.expires_at,
          user: signInData.user,
        })
      );
    }

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
    // Recuperar sessão do localStorage
    const storageKey = getStorageKey();
    const storedSession = localStorage.getItem(storageKey);
    if (!storedSession) {
      return null;
    }

    const sessionData = JSON.parse(storedSession);
    const accessToken = sessionData.access_token;

    if (!accessToken) {
      return null;
    }

    // Verificar se expirou
    const expiresAt = sessionData.expires_at;
    if (expiresAt && Date.now() / 1000 > expiresAt) {
      // Token expirado, limpar
      localStorage.removeItem(storageKey);
      return null;
    }

    // Buscar perfil usando o token
    const profileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/my_profile?select=*`;
    const profileResponse = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      // Token inválido, limpar sessão
      localStorage.removeItem(storageKey);
      return null;
    }

    const profiles = await profileResponse.json();
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;

    if (!profile) {
      return null;
    }

    const authUser = profileToAuthUser(profile);
    return {
      user: authUser,
      access_token: accessToken,
      expires_at: new Date(expiresAt * 1000).toISOString(),
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

  // Tentar fazer logout na API do Supabase
  const storedSession = localStorage.getItem(storageKey);
  if (storedSession) {
    try {
      const sessionData = JSON.parse(storedSession);
      const accessToken = sessionData.access_token;
      
      if (accessToken) {
        // Chamar logout no Supabase
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch {
      // Ignorar erros de logout na API
    }
  }

  // Sempre limpar localStorage
  localStorage.removeItem(storageKey);
}

/**
 * Escuta mudanças de autenticação
 * Nota: Usa polling simples ao invés do SDK
 */
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const storageKey = getStorageKey();
  let lastSession: string | null = null;

  // Verificar sessão a cada 1 segundo
  const interval = setInterval(async () => {
    const currentStored = localStorage.getItem(storageKey);
    
    // Se mudou, notificar
    if (currentStored !== lastSession) {
      lastSession = currentStored;
      
      if (currentStored) {
        const session = await getCurrentSession();
        callback(session);
      } else {
        callback(null);
      }
    }
  }, 1000);

  // Também escutar eventos de storage (para outras abas)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === storageKey) {
      getCurrentSession().then(callback);
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    clearInterval(interval);
    window.removeEventListener('storage', handleStorage);
  };
}
