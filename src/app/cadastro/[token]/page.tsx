'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Input, Label } from '@/components/ui';
import {
  claimSignup,
  startSignup,
  type InviteContext,
} from '@/lib/invites';
import { loginStudent } from '@/lib/auth/authServiceSupabase';

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

type ClaimPageState = 'loading' | 'invalid' | 'expired' | 'cancelled' | 'used' | 'target_required' | 'welcome' | 'claimed_self' | 'claimed_other';

export default function PublicOnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<ClaimPageState>('loading');
  const [invite, setInvite] = useState<InviteContext | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadInvite = async () => {
      const result = await startSignup(token);
      if (!mounted) return;

      if (result.status === 'pending' && result.context) {
        setInvite(result.context);
        setPageState('welcome');
        return;
      }

      if (result.status === 'claimed_self' && result.context) {
        setInvite(result.context);
        setPageState('claimed_self');
        return;
      }

      if (result.status === 'claimed_other') {
        setPageState('claimed_other');
        return;
      }

      if (result.status === 'expired') {
        setPageState('expired');
        return;
      }

      if (result.status === 'completed') {
        setPageState('used');
        return;
      }

      if (result.status === 'cancelled') {
        setPageState('cancelled');
        return;
      }

      if (result.status === 'target_required') {
        setPageState('target_required');
        return;
      }

      setPageState('invalid');
    };

    void loadInvite();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleStart = async () => {
    if (!invite) return;

    if (!email || !email.includes('@')) {
      setPasswordError('Confirme o e-mail vinculado ao convite.');
      return;
    }

    if (!fullName.trim()) {
      setPasswordError('Informe seu nome completo.');
      return;
    }

    if (!password || password.length < 8) {
      setPasswordError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordError('A senha deve conter pelo menos uma letra e um número.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('As senhas não conferem.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setPasswordError(null);

      const claimResult = await claimSignup(invite.token, {
        email,
        fullName,
        phone,
        password,
      });

      if (!claimResult.success) {
        if (claimResult.errorCode === 'EMAIL_MISMATCH') {
          setErrorMessage('O e-mail informado não corresponde ao convite.');
          return;
        }

        if (claimResult.errorCode === 'EMAIL_ALREADY_REGISTERED') {
          setErrorMessage('Este e-mail já possui cadastro. Faça login para continuar.');
          return;
        }

        if (claimResult.errorCode === 'INVITE_ALREADY_CLAIMED' || claimResult.errorCode === 'TOKEN_CLAIMED') {
          setPageState('claimed_other');
          return;
        }

        if (claimResult.errorCode === 'TOKEN_COMPLETED') {
          setPageState('used');
          return;
        }

        if (claimResult.errorCode === 'TOKEN_EXPIRED') {
          setPageState('expired');
          return;
        }

        if (claimResult.errorCode === 'INVITE_TARGET_REQUIRED') {
          setPageState('target_required');
          return;
        }

        if (claimResult.errorCode === 'PASSWORD_TOO_SHORT') {
          setPasswordError('A senha deve ter pelo menos 8 caracteres.');
          return;
        }

        if (claimResult.errorCode === 'PASSWORD_TOO_WEAK') {
          setPasswordError('A senha deve conter pelo menos uma letra e um número.');
          return;
        }

        if (claimResult.errorCode === 'INVALID_EMAIL') {
          setErrorMessage('O e-mail informado é inválido.');
          return;
        }

        if (claimResult.errorCode === 'INVALID_NAME') {
          setPasswordError('Informe seu nome completo (mínimo 2 caracteres).');
          return;
        }

        setErrorMessage('Não foi possível iniciar o cadastro. Tente novamente.');
        return;
      }

      const loginResult = await loginStudent(email, password);
      if (!loginResult.success) {
        setErrorMessage('Convite claimado com sucesso, mas não foi possível entrar automaticamente. Faça login para continuar.');
        router.push(`/aluno/login?next=${encodeURIComponent(`/cadastro/continuar?token=${token}`)}`);
        return;
      }

      router.push(`/cadastro/continuar?token=${token}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--element-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-negative)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-negative)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Link inválido</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este link de cadastro não existe ou foi removido. Entre em contato com a academia para obter um novo link.
          </p>
        </Card>
      </div>
    );
  }

  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-alert)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Link expirado</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este link de cadastro expirou. Solicite um novo link à academia para continuar.
          </p>
        </Card>
      </div>
    );
  }

  if (pageState === 'cancelled') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-alert)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Convite cancelado</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este convite foi cancelado pela academia. Solicite um novo link para continuar.
          </p>
        </Card>
      </div>
    );
  }

  if (pageState === 'target_required') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-alert)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Convite precisa ser regenerado</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este link foi criado sem e-mail alvo vinculado. Para proteger o cadastro, a academia precisa gerar um novo convite pessoal.
          </p>
        </Card>
      </div>
    );
  }

  if (pageState === 'used') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-alert)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Cadastro já concluído</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este convite já concluiu o cadastro. A partir daqui o acesso segue pelo login do aluno.
          </p>
          <Button onClick={() => router.push('/aluno/login')} className="w-full">
            Ir para o login do aluno
          </Button>
        </Card>
      </div>
    );
  }

  if (pageState === 'claimed_other') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-alert)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Convite já iniciado</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este convite já foi claimado. Se ele pertence a você, faça login para continuar o cadastro sem depender do link.
          </p>
          <Button onClick={() => router.push(`/aluno/login?next=${encodeURIComponent('/cadastro/continuar')}`)} className="w-full">
            Fazer login para continuar
          </Button>
        </Card>
      </div>
    );
  }

  if (pageState === 'claimed_self' && invite) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-positive)]/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-8 h-8 text-[var(--status-positive)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Cadastro em andamento</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este convite já está vinculado à sua conta. Continue pelo seu login real quando quiser.
          </p>
          <Button onClick={() => router.push(`/cadastro/continuar?token=${invite.token}`)} className="w-full">
            Continuar cadastro
          </Button>
        </Card>
      </div>
    );
  }

  if (pageState === 'welcome' && invite) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-8">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Convite pessoal</h1>
            <p className="text-[var(--text-secondary)]">
              {invite.recipientName ? `${invite.recipientName}, este convite foi separado para você.` : 'Seu convite foi separado para uma pessoa específica.'}
            </p>
            <p className="text-lg font-semibold text-[var(--element-primary)]">
              {invite.unitName || invite.academyName || 'MoveAccess'}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="email">Confirme seu e-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={invite.emailHint ? `Ex: ${invite.emailHint}` : 'voce@email.com'}
              />
              {invite.emailHint && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  O convite está vinculado a um e-mail específico. Use o mesmo e-mail para claimar.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="11999999999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Crie sua senha *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres, letras e números"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme sua senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repita a senha"
              />
            </div>
            {passwordError && <p className="text-sm text-[var(--status-negative)]">{passwordError}</p>}
          </div>

          <div className="space-y-3 mb-8">
            <p className="text-sm text-[var(--text-tertiary)] text-center">Como funciona a partir daqui:</p>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-medium">1</span>
                Você faz o claim inicial do convite
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-medium">2</span>
                O cadastro fica vinculado à sua conta real
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-medium">3</span>
                Depois, você continua por login, sem depender do link
              </li>
            </ul>
          </div>

          <Button onClick={handleStart} className="w-full" size="lg" disabled={isSubmitting}>
            Reservar convite e continuar
          </Button>

          <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">
            Link válido até {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
          </p>

          {errorMessage && <p className="text-sm text-[var(--status-negative)] text-center mt-3">{errorMessage}</p>}
        </Card>
      </div>
    );
  }

  return null;
}
