'use client';

/**
 * Página de Login da Equipe (Staff)
 * Acesso ao painel administrativo
 * UI corporativa/profissional
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Label } from '@/components/ui';
import {
  AuthCard,
  AuthDivider,
  AuthEyebrow,
  AuthHeading,
  AuthLoadingSpinner,
  AuthPageLayout,
  authFieldShellClassName,
  authInputClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from '@/components/common/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { capture } from '@/lib/analytics';
import { Building2, Lock, Mail } from 'lucide-react';

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
    <AuthPageLayout backHref="/">
      <AuthCard>
        <AuthEyebrow>Staff Login</AuthEyebrow>
        <AuthHeading
          title="Entrar no painel"
          subtitle="Use o login da equipe para acessar a operação da academia."
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
              E-mail
            </Label>
            <div className={authFieldShellClassName}>
              <div className="mr-3 text-slate-300">
                <Mail className="h-5 w-5" />
              </div>
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
                className={authInputClassName}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
              Senha
            </Label>
            <div className={authFieldShellClassName}>
              <div className="mr-3 text-slate-300">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
                className={authInputClassName}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="ml-3 text-sm font-semibold text-slate-300 transition hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className={authPrimaryButtonClassName} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <AuthLoadingSpinner />
                Entrando...
              </span>
            ) : (
              <>
                Entrar no painel
                <span aria-hidden>→</span>
              </>
            )}
          </Button>
        </form>

        <AuthDivider />

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Primeiro acesso da academia</h3>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Ainda não tem conta? Cadastre sua academia e inicie o setup.
            </p>
          </div>

          <Link href="/signup" className={authSecondaryButtonClassName}>
            <Building2 className="h-4 w-4" />
            Cadastrar minha academia
          </Link>
        </div>
      </AuthCard>

      <p className="mt-8 text-center text-base text-slate-300">
        É aluno?{' '}
        <Link href="/aluno/login" className="font-semibold text-cyan-400 no-underline hover:text-cyan-300 hover:no-underline">
          Acesse sua área aqui
        </Link>
      </p>
    </AuthPageLayout>
  );
}
