'use client';

/**
 * Contexto de Autenticação
 * Gerencia estado de autenticação globalmente
 * Integrado com Supabase Auth
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { MyProfile } from '@/lib/supabase';

// ============================================
// TIPOS
// ============================================

export type UserType = 'staff' | 'student' | null;

export interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  // Estado
  user: User | null;
  profile: MyProfile | null;
  session: Session | null;
  userType: UserType;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  isStudent: boolean;

  // Ações
  loginAsStaff: (email: string, password: string) => Promise<LoginResult>;
  loginAsStudent: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ============================================
// CONTEXTO
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Buscar perfil completo do usuário
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('my_profile')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    return data;
  }, [supabase]);

  // Inicializar estado de autenticação
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchProfile]);

  // Carregar sessão no mount e escutar mudanças
  useEffect(() => {
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, refreshSession, router]);

  // Login da equipe
  const loginAsStaff = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      // Buscar perfil
      const profileData = await fetchProfile(data.user.id);
      
      if (!profileData) {
        await supabase.auth.signOut();
        return { success: false, error: 'Perfil não encontrado. Complete seu cadastro.' };
      }

      // Verificar se é staff
      if (profileData.user_type !== 'staff') {
        await supabase.auth.signOut();
        return { success: false, error: 'Acesso negado. Use o login de aluno.' };
      }

      // Verificar status
      if (profileData.staff_status !== 'active') {
        await supabase.auth.signOut();
        return { success: false, error: 'Conta inativa ou pendente de aprovação.' };
      }

      // Atualizar last_login
      await supabase
        .from('staff_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      setSession(data.session);
      setUser(data.user);
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchProfile]);

  // Login do aluno
  const loginAsStudent = useCallback(async (identifier: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    
    try {
      // Para alunos, tentamos primeiro como email
      // Se não tiver @, tratamos como CPF e buscamos o email correspondente
      let email = identifier;
      
      if (!identifier.includes('@')) {
        // Buscar usuário por CPF
        const cpfClean = identifier.replace(/\D/g, '');
        const { data: profileByCpf, error: cpfError } = await supabase
          .from('profiles')
          .select('email')
          .eq('cpf', cpfClean)
          .limit(1)
          .maybeSingle();

        if (cpfError || !profileByCpf?.email) {
          return { success: false, error: 'CPF não encontrado' };
        }

        email = profileByCpf.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      // Buscar perfil
      const profileData = await fetchProfile(data.user.id);
      
      if (!profileData) {
        await supabase.auth.signOut();
        return { success: false, error: 'Perfil não encontrado' };
      }

      // Verificar se é student
      if (profileData.user_type !== 'student') {
        await supabase.auth.signOut();
        return { success: false, error: 'Acesso negado. Use o login da equipe.' };
      }

      // Verificar status
      if (profileData.student_status === 'blocked') {
        await supabase.auth.signOut();
        return { success: false, error: 'Conta bloqueada. Entre em contato com a academia.' };
      }

      setSession(data.session);
      setUser(data.user);
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchProfile]);

  // Logout
  const logout = useCallback(async () => {
    const wasStaff = profile?.user_type === 'staff';
    
    await supabase.auth.signOut();
    
    setSession(null);
    setUser(null);
    setProfile(null);
    
    // Redirecionar baseado no tipo de usuário anterior
    router.push(wasStaff ? '/login' : '/aluno/login');
  }, [supabase, profile, router]);

  // Valores computados
  const userType: UserType = profile?.user_type ?? null;
  const isAuthenticated = !!session && !!user;
  const isStaff = isAuthenticated && profile?.user_type === 'staff';
  const isStudent = isAuthenticated && profile?.user_type === 'student';

  const value: AuthContextType = {
    user,
    profile,
    session,
    userType,
    isLoading,
    isAuthenticated,
    isStaff,
    isStudent,
    loginAsStaff,
    loginAsStudent,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

// ============================================
// HOOKS AUXILIARES
// ============================================

/**
 * Hook para proteção de rotas da equipe
 */
export function useRequireStaff(redirectTo = '/login') {
  const { isAuthenticated, isStaff, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isStaff)) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isStaff, isLoading, router, redirectTo]);

  return { isLoading, isAuthorized: isAuthenticated && isStaff };
}

/**
 * Hook para proteção de rotas do aluno
 */
export function useRequireStudent(redirectTo = '/aluno/login') {
  const { isAuthenticated, isStudent, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isStudent)) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isStudent, isLoading, router, redirectTo]);

  return { isLoading, isAuthorized: isAuthenticated && isStudent };
}
