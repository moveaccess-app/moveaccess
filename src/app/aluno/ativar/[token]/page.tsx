'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  authSecondaryButtonClassName,
} from '@/components/common/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail } from 'lucide-react';

interface StudentAccessContext {
  academyName: string | null;
  email: string | null;
  recipientName: string | null;
}

function mapAccessError(errorCode: string | null | undefined): string {
  switch (errorCode) {
    case 'TOKEN_USED':
      return 'Este link já foi utilizado. Entre no portal com a senha definida ou peça um novo link à academia.';
    case 'TOKEN_EXPIRED':
      return 'Este link expirou. Peça um novo link de acesso para a academia.';
    case 'STUDENT_NOT_FOUND':
      return 'Não encontramos a conta do aluno vinculada a este link.';
    case 'TOKEN_INVALID':
      return 'Este link é inválido ou não existe.';
    default:
      return 'Não foi possível validar este link agora.';
  }
}

export default function StudentAccessSetupPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { loginAsStudent } = useAuth();
  const token = useMemo(() => {
    if (!params?.token) return '';
    return Array.isArray(params.token) ? params.token[0] : params.token;
  }, [params]);

  const [context, setContext] = useState<StudentAccessContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadContext = async () => {
      if (!token) {
        if (mounted) {
          setError('Link inválido.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/student/access/${encodeURIComponent(token)}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (!mounted) return;
          setError(mapAccessError(typeof data.errorCode === 'string' ? data.errorCode : null));
          setContext({
            academyName: null,
            email: typeof data.email === 'string' ? data.email : null,
            recipientName: null,
          });
          return;
        }

        if (!mounted) return;
        setContext({
          academyName: typeof data.academyName === 'string' ? data.academyName : null,
          email: typeof data.email === 'string' ? data.email : null,
          recipientName: typeof data.recipientName === 'string' ? data.recipientName : null,
        });
      } catch {
        if (!mounted) return;
        setError('Não foi possível carregar este link de ativação agora.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContext();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/student/access/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : mapAccessError(typeof data.errorCode === 'string' ? data.errorCode : null));
        return;
      }

      const email = typeof data.email === 'string' ? data.email : context?.email;

      if (!email) {
        setSuccessMessage('Senha definida com sucesso. Entre no portal com seu e-mail e a nova senha.');
        router.push('/aluno/login');
        return;
      }

      const loginResult = await loginAsStudent(email, password);

      if (loginResult.success) {
        router.push('/aluno');
        return;
      }

      setSuccessMessage('Senha definida com sucesso. Faça login para entrar no portal do aluno.');
      router.push('/aluno/login');
    } catch {
      setError('Não foi possível concluir a ativação agora. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout backHref="/aluno/login">
      <AuthCard>
        <AuthEyebrow>Portal do Aluno</AuthEyebrow>
        <AuthHeading
          title="Definir senha de acesso"
          subtitle="Crie sua senha para acessar o portal do aluno e acompanhar plano, vencimentos e pagamentos."
        />

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <AuthLoadingSpinner />
            Validando seu link de ativação...
          </div>
        ) : error && !context?.email ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
            <Button type="button" className={authSecondaryButtonClassName} onClick={() => router.push('/aluno/login')}>
              Ir para login do aluno
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                {context?.recipientName || 'Aluno'}{context?.academyName ? ` • ${context.academyName}` : ''}
              </p>
              <p className="mt-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-sky-600" />
                {context?.email || 'E-mail não identificado'}
              </p>
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                Nova senha
              </Label>
              <div className={authFieldShellClassName}>
                <div className="mr-3 text-slate-300">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Crie uma senha segura"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
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
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use pelo menos 8 caracteres para liberar seu acesso.
              </p>
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
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className={authInputClassName}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                {successMessage}
              </div>
            )}

            <Button type="submit" className={authPrimaryButtonClassName} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <AuthLoadingSpinner />
                  Salvando senha...
                </span>
              ) : (
                <>
                  Ativar acesso ao portal
                  <span aria-hidden>→</span>
                </>
              )}
            </Button>
          </form>
        )}
      </AuthCard>

      <p className="mt-8 text-center text-base text-slate-300">
        Já definiu a senha?{' '}
        <Link href="/aluno/login" className="font-semibold text-cyan-400 no-underline hover:text-cyan-300 hover:no-underline">
          Entrar no portal do aluno
        </Link>
      </p>
    </AuthPageLayout>
  );
}