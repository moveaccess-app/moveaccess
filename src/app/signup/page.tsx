'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { signupAcademy } from '@/lib/auth/signupService';
import { capture, getDeviceType } from '@/lib/analytics';
import { Building2, Lock, Mail, Phone, User } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isStaff, isLoading: authLoading, loginAsStaff, refreshSession } = useAuth();

  const [ownerName, setOwnerName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && isStaff) {
      router.push(currentUser?.tenancy.setupCompleted === false ? '/setup' : '/home');
    }
  }, [authLoading, currentUser, isAuthenticated, isStaff, router]);

  // Track page view
  useEffect(() => {
    capture('signup_viewed', {
      referrer: document.referrer,
      device_type: getDeviceType(),
    });
  }, []);

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    capture('signup_started', { source: 'signup_page' });

    // Validation
    if (ownerName.trim().length < 2) {
      setError('Nome do responsável deve ter ao menos 2 caracteres');
      return;
    }
    if (academyName.trim().length < 2) {
      setError('Nome da academia deve ter ao menos 2 caracteres');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter ao menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const signupResult = await signupAcademy({
        ownerName: ownerName.trim(),
        academyName: academyName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.replace(/\D/g, '') || undefined,
      });

      if (signupResult.success) {
        const loginResult = await loginAsStaff(email.trim().toLowerCase(), password);

        if (!loginResult.success) {
          const autoLoginError = loginResult.error || 'Conta criada, mas o login automático falhou';
          capture('signup_failed', { error: `auto_login_failed:${autoLoginError}`, source: 'signup_page' });
          setError('Conta criada, mas não foi possível entrar automaticamente. Faça login manualmente.');
          return;
        }

        await refreshSession();
        capture('signup_success', { academy_name: academyName.trim(), source: 'signup_page' });
        router.push('/setup');
        router.refresh();
      } else {
        const errorMsg = signupResult.error || 'Erro ao criar conta';
        capture('signup_failed', { error: errorMsg, source: 'signup_page' });
        setError(errorMsg);
      }
    } catch {
      capture('signup_failed', { error: 'unexpected_error', source: 'signup_page' });
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout backHref="/login">
      <AuthCard>
        <AuthEyebrow>Cadastro</AuthEyebrow>
        <AuthHeading
          title="Criar minha academia"
          subtitle="Preencha os dados abaixo para abrir sua conta e iniciar o setup."
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="ownerName" className="mb-2 block text-sm font-semibold text-slate-800">
              Nome do responsável
            </Label>
            <div className={authFieldShellClassName}>
              <div className="mr-3 text-slate-300">
                <User className="h-5 w-5" />
              </div>
              <Input
                id="ownerName"
                type="text"
                placeholder="Nome do responsável"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                autoFocus
                autoComplete="name"
                disabled={isLoading}
                className={authInputClassName}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="academyName" className="mb-2 block text-sm font-semibold text-slate-800">
              Nome da academia
            </Label>
            <div className={authFieldShellClassName}>
              <div className="mr-3 text-slate-300">
                <Building2 className="h-5 w-5" />
              </div>
              <Input
                id="academyName"
                type="text"
                placeholder="Ex: Move Fitness"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                required
                autoComplete="organization"
                disabled={isLoading}
                className={authInputClassName}
              />
            </div>
          </div>

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
                disabled={isLoading}
                className={authInputClassName}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-800">
              Telefone (opcional)
            </Label>
            <div className={authFieldShellClassName}>
              <div className="mr-3 text-slate-300">
                <Phone className="h-5 w-5" />
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                autoComplete="tel"
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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
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

          <div>
            <Label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-800">
              Confirmar senha
            </Label>
            <div className={authFieldShellClassName}>
              <div className="mr-3 text-slate-300">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
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
                Criando sua academia...
              </span>
            ) : (
              <>
                Criar minha academia
                <span aria-hidden>→</span>
              </>
            )}
          </Button>
        </form>

        <p className="mt-7 text-center text-base text-slate-500">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-semibold text-cyan-600 no-underline hover:text-cyan-500 hover:no-underline">
            Fazer login
          </Link>
        </p>
      </AuthCard>
    </AuthPageLayout>
  );
}
