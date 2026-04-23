'use client';

/**
 * Contexto de Autenticação
 * Gerencia estado de autenticação globalmente
 * Usa abstração authService que alterna entre Mock e Supabase
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as authService from '@/lib/auth/authService';
import type { AuthUser, AuthSession, LoginResult, UserType } from '@/lib/auth/authService';
import type { CurrentUser } from '@/lib/auth/currentUserContract';
import { mapSessionToCurrentUser } from '@/lib/auth/currentUserContract';

// Re-exportar tipos
export type { UserType, LoginResult };

// ============================================
// TIPOS
// ============================================

interface AuthContextType {
  // Estado
  currentUser: CurrentUser | null;
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

const STAFF_PROTECTED_PREFIXES = [
  '/home',
  '/users',
  '/access',
  '/plans',
  '/assinaturas',
  '/contratos',
  '/financial',
  '/settings',
  '/setup',
];

const STUDENT_PROTECTED_PREFIXES = ['/aluno', '/cadastro/continuar'];
const STUDENT_PUBLIC_PATHS = ['/aluno/login'];

function matchesPath(pathname: string, route: string): boolean {
  if (route === '/') {
    return pathname === '/';
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

function isStudentProtectedRoute(pathname: string): boolean {
  if (STUDENT_PUBLIC_PATHS.some((route) => matchesPath(pathname, route))) {
    return false;
  }

  return STUDENT_PROTECTED_PREFIXES.some((route) => matchesPath(pathname, route));
}

function isStaffProtectedRoute(pathname: string): boolean {
  return STAFF_PROTECTED_PREFIXES.some((route) => matchesPath(pathname, route));
}

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar estado de autenticação
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSession = await authService.getCurrentSession();
      setSession(currentSession);
      setCurrentUser(mapSessionToCurrentUser(currentSession));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar sessão no mount e escutar mudanças
  useEffect(() => {
    refreshSession();

    const unsubscribe = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setCurrentUser(mapSessionToCurrentUser(newSession));

      if (!newSession) {
        if (pathname && isStudentProtectedRoute(pathname)) {
          router.push('/aluno/login');
        } else if (pathname && isStaffProtectedRoute(pathname)) {
          router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, refreshSession, router]);

  // Login da equipe
  const loginAsStaff = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    
    try {
      const result = await authService.loginStaff(email, password);

      if (result.success && result.session) {
        setSession(result.session);
        setCurrentUser(mapSessionToCurrentUser(result.session));
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
        setCurrentUser(mapSessionToCurrentUser(result.session));
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    const wasStaff = currentUser?.profile.userType === 'staff';
    
    await authService.logout();
    
    setSession(null);
    setCurrentUser(null);
    
    // Redirecionar baseado no tipo de usuário anterior
    router.push(wasStaff ? '/login' : '/aluno/login');
  }, [currentUser, router]);

  // Valores computados
  const userType: UserType | null = currentUser?.profile.userType ?? null;
  const isAuthenticated = !!session && !!currentUser;
  const isStaff = isAuthenticated && currentUser?.profile.userType === 'staff';
  const isStudent = isAuthenticated && currentUser?.profile.userType === 'student';

  const value: AuthContextType = {
    currentUser,
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
