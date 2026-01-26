'use client';

import { Sidebar } from '@/components/common/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, isAuthenticated, isStaff, isLoading, logout } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // Proteger rotas do painel administrativo
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isStaff)) {
      router.push('/login');
    }
  }, [isAuthenticated, isStaff, isLoading, router]);

  // Loading state
  if (isLoading || !isAuthenticated || !isStaff) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background-secondary)' }}
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3" 
               style={{ borderColor: 'var(--element-secondary)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--element-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Preparar dados do usuário para a Sidebar
  const getRoleLabel = (role: string | null | undefined) => {
    if (role === 'admin') return 'Administrador';
    if (role === 'manager') return 'Gerente';
    if (role === 'receptionist') return 'Recepcionista';
    if (role === 'financial') return 'Financeiro';
    return 'Usuário';
  };

  const sidebarUser = {
    name: profile?.name || 'Usuário',
    email: profile?.email || '',
    role: getRoleLabel(profile?.staff_role),
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
      <Sidebar 
        user={sidebarUser}
        onLogout={logout}
        onExpandChange={setIsSidebarExpanded} 
      />
      <main 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: isSidebarExpanded ? '260px' : '72px' }}
      >
        {children}
      </main>
    </div>
  );
}
