'use client';

/**
 * Página Principal do Aluno
 * Dashboard simplificado com QR Code e status
 * Preparado para futura implementação real do QR Code
 */

import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Logo } from '@/components/ui';
import { useAuth, useRequireStudent } from '@/contexts/AuthContext';
import { LogOut, Calendar, Activity } from 'lucide-react';

export default function StudentDashboardPage() {
  const { profile, logout } = useAuth();
  const { isLoading, isAuthorized } = useRequireStudent();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || !isAuthorized) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background-secondary)' }}
      >
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-3" />
          <p style={{ color: 'var(--element-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  const studentName = profile?.name || 'Aluno';
  const isPlanActive = profile?.student_plan_status === 'active';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
      {/* Botão de Logout Fixo - sempre visível */}
      <button
        onClick={logout}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg font-semibold text-white shadow-lg flex items-center gap-2"
        style={{ backgroundColor: '#ef4444' }}
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>

      {/* Header com gradiente */}
      <header className="relative overflow-hidden">
        <div 
          className="absolute inset-0 -z-10"
          style={{ 
            background: 'linear-gradient(135deg, var(--status-info) 0%, var(--status-positive) 100%)'
          }}
        />
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Logo variant="wordmark" className="scale-90" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}
            >
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-xl text-white mb-1">
                {studentName}
              </p>
              <div className="flex items-center gap-2">
                <div 
                  className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                  style={{ 
                    backgroundColor: isPlanActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.3)',
                    color: isPlanActive ? 'var(--status-positive)' : 'white'
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isPlanActive ? 'var(--status-positive)' : 'var(--status-negative)' }} />
                  {isPlanActive ? 'Plano Ativo' : 'Plano Expirado'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 max-w-md mx-auto -mt-6 space-y-4">
        {/* Card do Plano */}
        <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--status-info-background)' }}>
                  <Calendar className="w-6 h-6" style={{ color: 'var(--status-info)' }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--element-secondary)' }}>
                    Seu Plano
                  </p>
                  <p className="font-bold text-lg" style={{ color: 'var(--element-primary)' }}>
                    {profile?.student_plan_name || 'Sem plano'}
                  </p>
                </div>
              </div>
            </div>
            {profile?.student_plan_expires_at && (
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--divider-primary)' }}>
                <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                  {isPlanActive ? 'Válido até' : 'Expirou em'}
                </p>
                <p className="text-sm font-semibold" style={{ color: isPlanActive ? 'var(--status-positive)' : 'var(--status-negative)' }}>
                  {new Date(profile.student_plan_expires_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code (Placeholder) */}
        <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg font-bold">Seu QR Code de Acesso</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            {isPlanActive ? (
              <>
                {/* QR Code Placeholder */}
                <div 
                  className="w-56 h-56 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden"
                  style={{ 
                    backgroundColor: 'var(--background-secondary)',
                    border: '3px dashed var(--divider-primary)'
                  }}
                >
                  <div className="text-center p-6">
                    <QRCodeIcon className="w-20 h-20 mx-auto mb-3" style={{ color: 'var(--element-disabled)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                      QR Code será exibido aqui
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--element-disabled)' }}>
                      Em breve disponível
                    </p>
                  </div>
                  {/* Corner decorations */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: 'var(--status-info)' }} />
                  <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: 'var(--status-info)' }} />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: 'var(--status-info)' }} />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: 'var(--status-info)' }} />
                </div>
                <div className="text-center px-6">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--element-primary)' }}>
                    👉 Apresente este código na recepção
                  </p>
                  <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                    Para registrar sua entrada na academia
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-10 px-6">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--status-negative-background)' }}
                >
                  <AlertIcon style={{ color: 'var(--status-negative)' }} />
                </div>
                <p className="font-bold text-lg mb-2" style={{ color: 'var(--element-primary)' }}>
                  Plano Expirado
                </p>
                <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
                  Renove seu plano para continuar tendo acesso à academia
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos Acessos (Placeholder) */}
        <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: 'var(--status-info)' }} />
              <CardTitle className="text-base font-bold">Últimos Acessos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="text-center py-8 rounded-xl"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                Histórico em breve
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--element-disabled)' }}>
                Seus check-ins aparecerão aqui
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Componentes auxiliares
function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function QRCodeIcon({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      className={className}
      style={style}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="3" height="3" />
      <rect x="18" y="14" width="3" height="3" />
      <rect x="14" y="18" width="3" height="3" />
      <rect x="18" y="18" width="3" height="3" />
    </svg>
  );
}

function AlertIcon({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <svg 
      className="w-8 h-8"
      style={style}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
