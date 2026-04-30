'use client';

/**
 * Página de Login do Aluno (Student)
 * Portal de acesso individual
 */

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Label } from '@/components/ui';
import {
  AuthCard,
  AuthEyebrow,
  AuthHeading,
  AuthLoadingSpinner,
  AuthPageLayout,
  authFieldShellClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/common/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { capture } from '@/lib/analytics';
import { getCurrentInviteSignupSession } from '@/lib/invites';
import { Lock, Mail } from 'lucide-react';

export default function StudentLoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#06162b] text-slate-300"><p>Carregando...</p></div>}>
      <StudentLoginPage />
    </Suspense>
  );
}

function StudentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginAsStudent, isAuthenticated, isStudent, isLoading: authLoading } = useAuth();
  const nextPath = searchParams.get('next');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirecionar se já estiver autenticado como aluno
  useEffect(() => {
    if (!authLoading && isAuthenticated && isStudent) {
      router.push('/aluno');
    }
  }, [authLoading, isAuthenticated, isStudent, router]);

  // Formatar CPF quando o identificador não for email
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    if (/@|[a-z]/i.test(rawValue)) {
      setIdentifier(rawValue.trim());
      return;
    }

    const numbers = rawValue.replace(/\D/g, '').slice(0, 11);

    if (numbers.length <= 3) {
      setIdentifier(numbers);
      return;
    }

    if (numbers.length <= 6) {
      setIdentifier(`${numbers.slice(0, 3)}.${numbers.slice(3)}`);
      return;
    }

    if (numbers.length <= 9) {
      setIdentifier(`${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`);
      return;
    }

    setIdentifier(`${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginAsStudent(identifier, password);

      if (result.success) {
        capture('login_success', { user_type: 'student' });
        const pendingSignup = await getCurrentInviteSignupSession();

        if (pendingSignup.success) {
          router.push(nextPath || '/cadastro/continuar');
          return;
        }

        router.push(nextPath || '/aluno');
      } else {
        const errorMsg = result.error || 'Erro ao fazer login';
        capture('login_failed', { user_type: 'student', error: errorMsg });
        setError(errorMsg);
      }
    } catch {
      capture('login_failed', { user_type: 'student', error: 'unexpected_error' });
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout backHref="/">
      <AuthCard>
        <AuthEyebrow>Aluno Login</AuthEyebrow>
        <AuthHeading
          title="Entrar na sua área"
          subtitle="Use seu e-mail ou CPF para acessar o portal do aluno."
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-slate-800">
              E-mail ou CPF
            </Label>
            <div className={authFieldShellClassName}>
              <div className="mr-3 text-slate-300">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                id="identifier"
                type="text"
                placeholder="seu@email.com ou 000.000.000-00"
                value={identifier}
                onChange={handleIdentifierChange}
                required
                autoComplete="username"
                disabled={isLoading}
                inputMode={identifier.includes('@') ? 'email' : 'text'}
                autoCapitalize="none"
                spellCheck={false}
                className={authInputClassName}
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use o mesmo e-mail do cadastro ou seu CPF.
            </p>
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
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
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
                Entrar na sua área
                <span aria-hidden>→</span>
              </>
            )}
          </Button>
        </form>
      </AuthCard>

      <p className="mt-8 text-center text-base text-slate-300">
        É funcionário?{' '}
        <Link href="/login" className="font-semibold text-cyan-400 no-underline hover:text-cyan-300 hover:no-underline">
          Acesse o painel aqui
        </Link>
      </p>
    </AuthPageLayout>
  );
}
