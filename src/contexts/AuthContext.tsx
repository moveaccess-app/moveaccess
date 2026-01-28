'use client';

/**
 * Contexto de Autenticação
 * Gerencia estado de autenticação globalmente
 * Usa abstração authService que alterna entre Mock e Supabase
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as authService from '@/lib/auth/authService';
import type { AuthUser, AuthSession, LoginResult, UserType } from '@/lib/auth/authService';

// Re-exportar tipos
export type { UserType, LoginResult };

// ============================================
// TIPOS
// ============================================

interface AuthContextType {
  // Estado
  user: AuthUser | null;
  session: AuthSession | null;
  userType: UserType | null;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar estado de autenticação
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSession = await authService.getCurrentSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar sessão no mount e escutar mudanças
  useEffect(() => {
    refreshSession();

    const unsubscribe = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (!newSession) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [refreshSession, router]);

  // Login da equipe
  const loginAsStaff = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    
    try {
      const result = await authService.loginStaff(email, password);

      if (result.success && result.session) {
        setSession(result.session);
        setUser(result.session.user);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login do aluno
  const loginAsStudent = useCallback(async (identifier: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    
    try {
      const result = await authService.loginStudent(identifier, password);

      if (result.success && result.session) {
        setSession(result.session);
        setUser(result.session.user);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    const wasStaff = user?.user_type === 'staff';
    
    await authService.logout();
    
    setSession(null);
    setUser(null);
    
    // Redirecionar baseado no tipo de usuário anterior
    router.push(wasStaff ? '/login' : '/aluno/login');
  }, [user, router]);

  // Valores computados
  const userType: UserType | null = user?.user_type ?? null;
  const isAuthenticated = !!session && !!user;
  const isStaff = isAuthenticated && user?.user_type === 'staff';
  const isStudent = isAuthenticated && user?.user_type === 'student';

  const value: AuthContextType = {
    user,
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
