'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import {
  OnboardingProgressBar,
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
  getCurrentInviteSignupSession,
  saveInviteSignupProgress,
  updateSessionStep,
  type InviteContext,
} from '@/lib/invites';
import { activateExternalBilling } from '@/lib/users/onboardingService';
import type { ActivationOutcome } from '@/components/onboarding/steps/StepActivation';
import { useAuth } from '@/contexts/AuthContext';

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

type PageState = 'loading' | 'ready' | 'not_found' | 'completed';

export default function ContinueInviteSignupPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}><p style={{ color: 'var(--element-secondary)' }}>Carregando...</p></div>}>
      <ContinueInviteSignupPage />
    </Suspense>
  );
}

function ContinueInviteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isStudent, isLoading: authLoading } = useAuth();
  const token = searchParams.get('token') || undefined;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteContext | null>(null);
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !isStudent) {
      const nextPath = token ? `/cadastro/continuar?token=${token}` : '/cadastro/continuar';
      router.replace(`/aluno/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    let mounted = true;

    const loadSignupSession = async () => {
      const result = await getCurrentInviteSignupSession(token);
      if (!mounted) return;

      if (!result.success || !result.invite || !result.session) {
        setPageState('not_found');
        return;
      }

      setInvite(result.invite);
      setSession(result.session);
      setPageState('ready');
    };

    void loadSignupSession();

    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthenticated, isStudent, router, token]);

  const currentStepIndex = session ? getStepIndex(session.currentStep) : 0;
  const currentStepInfo = session?.steps[currentStepIndex];

  const progressLabel = useMemo(() => {
    if (!invite?.emailHint) return 'Retome seu cadastro com login real.';
    return `Convite pessoal em andamento (${invite.emailHint}).`;
  }, [invite?.emailHint]);

  const persistSession = async (nextSession: OnboardingSession): Promise<boolean> => {
    if (!invite) return false;

    const result = await saveInviteSignupProgress(invite.token, nextSession);
    if (!result.success || !result.session) {
      setErrorMessage('Não foi possível salvar seu progresso. Tente novamente.');
      return false;
    }

    setSession(result.session);
    return true;
  };

  const handleNextStep = async (stepData: OnboardingSession['collectedData'][keyof OnboardingSession['collectedData']]) => {
    if (!session) return;

    setErrorMessage(null);

    const nextStep = getNextStep(session.currentStep);
    const nextSession = updateSessionStep(session, stepData, session.currentStep, nextStep);
    setSession(nextSession);
    await persistSession(nextSession);
  };

  const goToNextStep = (stepData: OnboardingSession['collectedData'][keyof OnboardingSession['collectedData']]) => {
    void handleNextStep(stepData);
  };

  const handlePreviousStep = async () => {
    if (!session) return;

    const prevStep = getPreviousStep(session.currentStep);
    if (!prevStep) return;

    const previousIndex = getStepIndex(prevStep);
    const nextSession: OnboardingSession = {
      ...session,
      currentStep: prevStep,
      status: 'in_progress',
      steps: session.steps.map((step, index) => {
        if (index < previousIndex) {
          return { ...step, status: 'completed' as const };
        }
        if (index === previousIndex) {
          return { ...step, status: 'current' as const };
        }
        return { ...step, status: 'pending' as const };
      }),
      updatedAt: new Date().toISOString(),
      completedAt: undefined,
    };

    setSession(nextSession);
    await persistSession(nextSession);
  };

  const goToPreviousStep = () => {
    void handlePreviousStep();
  };

  const renderCurrentStep = () => {
    if (!session) return null;

    switch (session.currentStep) {
      case 'personal_data':
        return <StepPersonalData session={session} onNext={goToNextStep} onBack={() => router.push('/aluno')} />;
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
            onActivate={async (): Promise<ActivationOutcome> => {
              if (!invite) return { localSuccess: false, error: 'Convite não encontrado' };

              // 1. Persist final step
              const finalSession = updateSessionStep(session, { activatedAt: new Date().toISOString() }, 'activation', null);
              const saved = await persistSession(finalSession);
              if (!saved) {
                return { localSuccess: false, error: 'Falha ao salvar progresso' };
              }

              // 2. Complete signup (create user, subscription, payment, contract)
              const signupResult = await completeSignup(invite.token);
              if (!signupResult.success) {
                if (signupResult.errorCode === 'TOKEN_EXPIRED') {
                  return { localSuccess: false, error: 'Este convite expirou.' };
                }
                if (signupResult.errorCode === 'CLAIM_FORBIDDEN') {
                  return { localSuccess: false, error: 'Este cadastro pertence a outra conta.' };
                }
                return { localSuccess: false, error: 'Não foi possível concluir o cadastro.' };
              }

              // 3. Attempt external billing if activation data available
              let billing;
              if (signupResult.activation?.activated && signupResult.activation.subscriptionId && signupResult.activation.paymentId) {
                billing = await activateExternalBilling(
                  signupResult.activation.subscriptionId,
                  signupResult.activation.paymentId,
                );
              }

              return { localSuccess: true, billing };
            }}
            onBack={goToPreviousStep}
            onFinish={() => setPageState('completed')}
          />
        );
      default:
        return <StepPersonalData session={session} onNext={goToNextStep} onBack={() => router.push('/aluno')} />;
    }
  };

  if (pageState === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--element-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Carregando seu cadastro...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-alert)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Nenhum cadastro pendente</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Não encontramos um convite claimado em andamento para esta conta.
          </p>
          <Button onClick={() => router.push('/aluno')} className="w-full">
            Ir para a área do aluno
          </Button>
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Cadastro concluído</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Seu convite foi finalizado com sucesso. Agora o acesso segue normalmente pelo login do aluno.
          </p>
          <Button onClick={() => router.push('/aluno')} className="w-full">
            Ir para a área do aluno
          </Button>
        </Card>
      </div>
    );
  }

  if (pageState === 'ready' && session && invite) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)]">
        <header className="sticky top-0 z-10 bg-[var(--background-primary)] border-b border-[var(--border-subtle)]">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{invite.unitName || invite.academyName || 'MoveAccess'}</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {currentStepInfo?.title} • Etapa {currentStepIndex + 1} de {ONBOARDING_STEPS.length}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{progressLabel}</p>
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
          {(errorMessage || isSubmitting) && (
            <div className="mt-4 space-y-2">
              {errorMessage && <p className="text-sm text-[var(--status-negative)]">{errorMessage}</p>}
              {isSubmitting && <p className="text-sm text-[var(--text-secondary)]">Concluindo cadastro...</p>}
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}