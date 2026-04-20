'use client';

/**
 * Página de Login da Equipe (Staff)
 * Acesso ao painel administrativo
 * UI corporativa/profissional
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription, Logo } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { capture } from '@/lib/analytics';
import { Lock, Mail } from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();
  const { loginAsStaff, isAuthenticated, isStaff, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirecionar se já estiver autenticado como staff
  useEffect(() => {
    if (!authLoading && isAuthenticated && isStaff) {
      router.push('/home');
    }
  }, [authLoading, isAuthenticated, isStaff, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginAsStaff(email, password);

      if (result.success) {
        capture('login_success', { user_type: 'staff' });
        router.push('/home');
      } else {
        const errorMsg = result.error || 'Erro ao fazer login';
        capture('login_failed', { user_type: 'staff', error: errorMsg });
        setError(errorMsg);
      }
    } catch {
      capture('login_failed', { user_type: 'staff', error: 'unexpected_error' });
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background com gradiente animado */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 50%, var(--background-tertiary) 100%)',
        }}
      />
      
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: 'var(--status-info)' }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: 'var(--status-positive)' }}
        />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <Logo variant="full" size="lg" className="mb-3" />
          <p className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
            Painel Administrativo
          </p>
        </div>

        {/* Card de Login */}
        <Card className="backdrop-blur-sm shadow-2xl border-0 overflow-hidden animate-slide-up" style={{ backgroundColor: 'rgba(var(--background-primary-rgb, 255, 255, 255), 0.95)' }}>
          {/* Barra superior colorida */}
          <div className="h-1.5 bg-gradient-to-r" style={{ backgroundImage: 'linear-gradient(90deg, var(--status-info) 0%, var(--status-positive) 100%)' }} />
          
          <CardHeader className="text-center pt-8 pb-6">
            <CardTitle className="text-2xl font-bold">Acesso da Equipe</CardTitle>
            <CardDescription className="text-base mt-2">
              Entre com suas credenciais para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--element-secondary)' }} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    className="pl-11 h-12 text-base"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--element-secondary)' }} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pl-11 pr-11 h-12 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium hover:underline"
                    style={{ color: 'var(--element-secondary)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <div 
                  className="p-4 rounded-lg text-sm font-medium flex items-start gap-3 animate-shake"
                  style={{ 
                    backgroundColor: 'var(--status-negative-background)',
                    color: 'var(--status-negative)',
                    border: '1px solid var(--status-negative)'
                  }}
                >
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    Entrando...
                  </span>
                ) : (
                  'Entrar no Painel'
                )}
              </Button>
            </form>

            {/* Credenciais de Demo — somente em dev */}
            {process.env.NODE_ENV === 'development' && (
              <div 
                className="mt-8 p-5 rounded-xl text-xs border"
                style={{ 
                  backgroundColor: 'var(--background-secondary)',
                  borderColor: 'var(--divider-primary)'
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-info)' }} />
                  <p className="font-semibold text-sm" style={{ color: 'var(--element-primary)' }}>
                    Credenciais de demonstração
                  </p>
                </div>
                <div className="space-y-2 ml-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold min-w-[80px]" style={{ color: 'var(--element-primary)' }}>Admin:</span>
                    <span style={{ color: 'var(--element-secondary)' }}>admin@moveaccess.com / Admin@123</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold min-w-[80px]" style={{ color: 'var(--element-primary)' }}>Gerente:</span>
                    <span style={{ color: 'var(--element-secondary)' }}>gerente@moveaccess.com / Gerente@123</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold min-w-[80px]" style={{ color: 'var(--element-primary)' }}>Recepção:</span>
                    <span style={{ color: 'var(--element-secondary)' }}>recepcionista@moveaccess.com / Recep@123</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link para login do aluno */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
            Ainda não tem conta?{' '}
            <Link
              href="/signup"
              className="font-semibold hover:underline transition-all"
              style={{ color: 'var(--status-info)' }}
            >
              Cadastrar minha academia
            </Link>
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--divider-primary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--element-disabled)' }}>OU</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--divider-primary)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
            É aluno?{' '}
            <Link 
              href="/aluno/login" 
              className="font-semibold hover:underline transition-all"
              style={{ color: 'var(--status-info)' }}
            >
              Acesse sua área aqui →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente de Loading Spinner
function LoadingSpinner() {
  return (
    <svg 
      className="animate-spin h-4 w-4" 
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
