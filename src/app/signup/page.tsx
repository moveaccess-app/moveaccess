'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription, Logo } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { signupAcademy } from '@/lib/auth/signupService';
import { capture, getDeviceType } from '@/lib/analytics';
import { Building2, Lock, Mail, Phone, User } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, isStaff, isLoading: authLoading } = useAuth();

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
      router.push('/home');
    }
  }, [authLoading, isAuthenticated, isStaff, router]);

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
      const result = await signupAcademy({
        ownerName: ownerName.trim(),
        academyName: academyName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.replace(/\D/g, '') || undefined,
      });

      if (result.success) {
        capture('signup_success', { academy_name: academyName.trim(), source: 'signup_page' });
        // Force auth refresh then redirect to setup wizard
        router.push('/setup');
        router.refresh();
      } else {
        const errorMsg = result.error || 'Erro ao criar conta';
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 50%, var(--background-tertiary) 100%)',
        }}
      />
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

      <div className="w-full max-w-lg relative">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <Logo variant="full" size="lg" className="mb-3" />
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--element-secondary)' }}
          >
            Cadastre sua academia e configure em 5 minutos
          </p>
        </div>

        {/* Card */}
        <Card
          className="backdrop-blur-sm shadow-2xl border-0 overflow-hidden animate-slide-up"
          style={{
            backgroundColor:
              'rgba(var(--background-primary-rgb, 255, 255, 255), 0.95)',
          }}
        >
          <div
            className="h-1.5 bg-gradient-to-r"
            style={{
              backgroundImage:
                'linear-gradient(90deg, var(--status-info) 0%, var(--status-positive) 100%)',
            }}
          />

          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-2xl font-bold">
              Cadastrar Academia
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Preencha os dados abaixo para criar sua academia
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Owner name */}
              <div className="space-y-1.5">
                <Label htmlFor="ownerName" className="text-sm font-semibold">
                  Seu nome
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                    style={{ color: 'var(--element-secondary)' }}
                  />
                  <Input
                    id="ownerName"
                    type="text"
                    placeholder="Nome do responsável"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    autoFocus
                    disabled={isLoading}
                    className="pl-11 h-11"
                  />
                </div>
              </div>

              {/* Academy name */}
              <div className="space-y-1.5">
                <Label htmlFor="academyName" className="text-sm font-semibold">
                  Nome da academia
                </Label>
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                    style={{ color: 'var(--element-secondary)' }}
                  />
                  <Input
                    id="academyName"
                    type="text"
                    placeholder="Ex: Move Fitness"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-11 h-11"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                    style={{ color: 'var(--element-secondary)' }}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    className="pl-11 h-11"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold">
                  Telefone{' '}
                  <span style={{ color: 'var(--element-secondary)' }}>
                    (opcional)
                  </span>
                </Label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                    style={{ color: 'var(--element-secondary)' }}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    disabled={isLoading}
                    className="pl-11 h-11"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Senha
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                    style={{ color: 'var(--element-secondary)' }}
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pl-11 pr-11 h-11"
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

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold"
                >
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                    style={{ color: 'var(--element-secondary)' }}
                  />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pl-11 h-11"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="p-3 rounded-lg text-sm font-medium flex items-start gap-3"
                  style={{
                    backgroundColor: 'var(--status-negative-background)',
                    color: 'var(--status-negative)',
                    border: '1px solid var(--status-negative)',
                  }}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin w-5 h-5 border-2 border-t-transparent border-current rounded-full" />
                    Criando sua academia...
                  </span>
                ) : (
                  'Criar minha academia'
                )}
              </Button>
            </form>

            {/* Link to login */}
            <div className="mt-6 text-center">
              <p
                className="text-sm"
                style={{ color: 'var(--element-secondary)' }}
              >
                Já tem uma conta?{' '}
                <Link
                  href="/login"
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--element-primary)' }}
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
