'use client';

/**
 * Página Inicial
 * Direciona para login apropriado ou dashboard
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isStaff, isStudent, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Se autenticado, redirecionar para área correta
    if (isAuthenticated) {
      if (isStaff) {
        router.push('/home');
      } else if (isStudent) {
        router.push('/aluno');
      }
    } else {
      // Se não autenticado, redirecionar para login da equipe (default)
      router.push('/login');
    }
  }, [isAuthenticated, isStaff, isStudent, isLoading, router]);

  // Mostrar loading enquanto verifica
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--background-secondary)' }}
    >
      <div className="text-center">
        <div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ backgroundColor: 'var(--element-primary)' }}
        >
          <span className="text-2xl font-bold" style={{ color: 'var(--background-primary)' }}>M</span>
        </div>
        <p style={{ color: 'var(--element-secondary)' }}>Carregando...</p>
      </div>
    </div>
  );
}
