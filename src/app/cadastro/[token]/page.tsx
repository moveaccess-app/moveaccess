'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Input, Label } from '@/components/ui';
import {
  OnboardingProgressBar,
  StepIdentification,
  StepPersonalData,
  StepPlanSelection,
  StepContract,
  StepPayment,
  StepActivation,
} from '@/components/onboarding';
import {
  OnboardingSession,
  getNextStep,
  getPreviousStep,
  getStepIndex,
  ONBOARDING_STEPS,
} from '@/lib/users/onboardingTypes';
import {
  completeSignup,
  createPublicOnboardingSession,
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

type PageState = 'loading' | 'invalid' | 'expired' | 'used' | 'welcome' | 'onboarding' | 'completed';

export default function PublicOnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteContext | null>(null);
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadInvite = async () => {
      const result = await startSignup(token);
      if (!mounted) return;

      if (result.status === 'valid' && result.context) {
        setInvite(result.context);
        setPageState('welcome');
        return;
      }

      if (result.status === 'expired') {
        setPageState('expired');
        return;
      }

      if (result.status === 'used') {
        setPageState('used');
        return;
      }

      setPageState('invalid');
    };

    void loadInvite();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleStart = () => {
    if (!invite) return;

    if (!password || password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('As senhas não conferem.');
      return;
    }

    const newSession = createPublicOnboardingSession(invite);
    setSession(newSession);
    setErrorMessage(null);
    setPasswordError(null);
    setPageState('onboarding');
  };

  const currentStepIndex = session ? getStepIndex(session.currentStep) : 0;
  const currentStepInfo = session?.steps[currentStepIndex];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goToNextStep = (stepData: any) => {
    if (!session) return;

    const nextStep = getNextStep(session.currentStep);
    const updatedCollectedData = { ...session.collectedData };

    if (session.currentStep === 'identification') {
      updatedCollectedData.identification = stepData;
    }
    if (session.currentStep === 'personal_data') {
      updatedCollectedData.personalData = stepData;
    }
    if (session.currentStep === 'plan_selection') {
      updatedCollectedData.planSelection = stepData;
    }
    if (session.currentStep === 'contract') {
      updatedCollectedData.contract = stepData;
    }
    if (session.currentStep === 'payment') {
      updatedCollectedData.payment = stepData;
    }
    if (session.currentStep === 'activation') {
      updatedCollectedData.activation = stepData;
    }

    const targetStep = nextStep ?? session.currentStep;

    const nextSession: OnboardingSession = {
      ...session,
      currentStep: targetStep,
      status: nextStep ? 'in_progress' : 'completed',
      collectedData: updatedCollectedData,
      steps: session.steps.map((step, index) => {
        if (index < getStepIndex(targetStep)) {
          return { ...step, status: 'completed' as const };
        }
        if (index === getStepIndex(targetStep)) {
          return { ...step, status: 'current' as const };
        }
        return { ...step, status: 'pending' as const };
      }),
      updatedAt: new Date().toISOString(),
      completedAt: nextStep ? undefined : new Date().toISOString(),
    };

    setSession(nextSession);
  };

  const goToPreviousStep = () => {
    if (!session) return;

    const prevStep = getPreviousStep(session.currentStep);
    if (!prevStep) return;

    setSession((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        currentStep: prevStep,
        steps: prev.steps.map((step, index) => {
          if (index < getStepIndex(prevStep)) {
            return { ...step, status: 'completed' as const };
          }
          if (index === getStepIndex(prevStep)) {
            return { ...step, status: 'current' as const };
          }
          return { ...step, status: 'pending' as const };
        }),
      };
    });
  };

  const handleComplete = async () => {
    if (!session || !invite) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const signupResult = await completeSignup(invite.token, session.collectedData, { password });
      if (!signupResult.success) {
        if (signupResult.errorCode === 'EMAIL_MISMATCH') {
          setErrorMessage('O e-mail informado não corresponde ao convite.');
          return;
        }
        if (signupResult.errorCode === 'EMAIL_ALREADY_REGISTERED') {
          setErrorMessage('Este e-mail já possui cadastro.');
          return;
        }
        if (signupResult.errorCode === 'CPF_ALREADY_REGISTERED') {
          setErrorMessage('Este CPF já possui cadastro.');
          return;
        }
        if (signupResult.errorCode === 'TOKEN_USED') {
          setPageState('used');
          return;
        }
        if (signupResult.errorCode === 'TOKEN_EXPIRED') {
          setPageState('expired');
          return;
        }
        setErrorMessage('Não foi possível concluir o cadastro. Tente novamente.');
        return;
      }

      const email = session.collectedData.identification?.email;
      if (email) {
        await loginStudent(email, password);
      }

      setPageState('completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    if (!session) return null;

    switch (session.currentStep) {
      case 'identification':
        return <StepIdentification session={session} onNext={goToNextStep} />;
      case 'personal_data':
        return <StepPersonalData session={session} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case 'plan_selection':
        return <StepPlanSelection session={session} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case 'contract':
        return <StepContract session={session} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case 'payment':
        return <StepPayment session={session} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case 'activation':
        return (
          <StepActivation
            session={session}
            onComplete={(data) => {
              goToNextStep(data);
              void handleComplete();
            }}
            onBack={goToPreviousStep}
          />
        );
      default:
        return null;
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

  if (pageState === 'used') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-alert)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Link já utilizado</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este convite já foi utilizado para criar um cadastro.
          </p>
        </Card>
      </div>
    );
  }

  if (pageState === 'welcome' && invite) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-8">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bem-vindo(a)! 👋</h1>
            <p className="text-[var(--text-secondary)]">Você foi convidado(a) para fazer parte da</p>
            <p className="text-lg font-semibold text-[var(--element-primary)]">
              {invite.unitName || invite.academyName || 'MoveAccess'}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="password">Crie sua senha *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
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
            <p className="text-sm text-[var(--text-tertiary)] text-center">O cadastro leva apenas alguns minutos:</p>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-medium">1</span>
                Seus dados básicos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-medium">2</span>
                Escolha do plano ideal
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-medium">3</span>
                Contrato e pagamento
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-medium">4</span>
                Acesso liberado!
              </li>
            </ul>
          </div>

          <Button onClick={handleStart} className="w-full" size="lg" disabled={isSubmitting}>
            Começar cadastro
          </Button>

          <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">
            Link válido até {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
          </p>

          {errorMessage && <p className="text-sm text-[var(--status-negative)] text-center mt-3">{errorMessage}</p>}
        </Card>
      </div>
    );
  }

  if (pageState === 'completed') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-[var(--status-positive)]/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-12 h-12 text-[var(--status-positive)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Cadastro concluído! 🎉</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Seu acesso à academia está liberado. Você já pode entrar no portal do aluno.
          </p>

          <Button onClick={() => router.push('/aluno')} className="w-full">
            Entrar agora
          </Button>
        </Card>
      </div>
    );
  }

  if (pageState === 'onboarding' && session && invite) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)]">
        <header className="sticky top-0 z-10 bg-[var(--background-primary)] border-b border-[var(--border-subtle)]">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{invite.unitName || invite.academyName || 'MoveAccess'}</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {currentStepInfo?.title} • Etapa {currentStepIndex + 1} de {ONBOARDING_STEPS.length}
                </p>
              </div>

              {invite.description && (
                <span className="text-xs bg-[var(--status-positive)]/10 text-[var(--status-positive)] px-2 py-1 rounded-full">
                  {invite.description}
                </span>
              )}
            </div>

            <div className="mt-4">
              <OnboardingProgressBar current={currentStepIndex + 1} total={ONBOARDING_STEPS.length} showLabel={false} />
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-8">
          <Card className="p-6 md:p-8">{renderCurrentStep()}</Card>
          {errorMessage && <p className="mt-4 text-sm text-[var(--status-negative)]">{errorMessage}</p>}
        </main>
      </div>
    );
  }

  return null;
}
