'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { 
  Stepper, 
  OnboardingProgressBar,
  StepIdentification,
  StepPersonalData,
  StepPlanSelection,
  StepContract,
  StepPayment,
  StepActivation,
} from '@/components/onboarding';
import {
  abandonOnboardingSession,
  finalizeOnboardingDraft,
  getNextStep,
  getPreviousStep,
  getStepIndex,
  initOrResumeOnboardingSession,
  ONBOARDING_STEPS,
  OnboardingSession,
  OnboardingStep,
  updateDraftSession,
} from '@/lib/users';

// ============================================
// ICONS
// ============================================

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function OnboardingPage() {
  const router = useRouter();
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const loadedSession = await initOrResumeOnboardingSession();
        if (!mounted) return;
        setSession(loadedSession);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao iniciar onboarding');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const currentStepIndex = useMemo(() => {
    if (!session) return 0;
    return getStepIndex(session.currentStep);
  }, [session]);

  const currentStepInfo = session?.steps[currentStepIndex];

  const goToNextStep = async (stepData: unknown) => {
    if (!session) return;

    const nextStep = getNextStep(session.currentStep);
    const updatedCollectedData = { ...session.collectedData };

    switch (session.currentStep) {
      case 'identification':
        updatedCollectedData.identification = stepData as OnboardingSession['collectedData']['identification'];
        break;
      case 'personal_data':
        updatedCollectedData.personalData = stepData as OnboardingSession['collectedData']['personalData'];
        break;
      case 'plan_selection':
        updatedCollectedData.planSelection = stepData as OnboardingSession['collectedData']['planSelection'];
        break;
      case 'contract':
        updatedCollectedData.contract = stepData as OnboardingSession['collectedData']['contract'];
        break;
      case 'payment':
        updatedCollectedData.payment = stepData as OnboardingSession['collectedData']['payment'];
        break;
      case 'activation':
        updatedCollectedData.activation = stepData as OnboardingSession['collectedData']['activation'];
        break;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updatedSession = await updateDraftSession(session.id, {
        currentStep: nextStep ?? session.currentStep,
        status: nextStep ? 'in_progress' : 'completed',
        collectedData: updatedCollectedData,
        completedAt: nextStep ? null : new Date().toISOString(),
      });

      setSession(updatedSession);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar etapa');
    } finally {
      setIsSaving(false);
    }
  };

  const goToPreviousStep = async () => {
    if (!session) return;

    const prevStep = getPreviousStep(session.currentStep);
    if (!prevStep) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updatedSession = await updateDraftSession(session.id, {
        currentStep: prevStep,
        status: 'in_progress',
        collectedData: session.collectedData,
        completedAt: null,
      });

      setSession(updatedSession);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao voltar etapa');
    } finally {
      setIsSaving(false);
    }
  };

  const goToStep = async (stepId: string) => {
    if (!session) return;

    const targetStep = session.steps.find(s => s.id === stepId);
    if (!targetStep || targetStep.status !== 'completed') return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updatedSession = await updateDraftSession(session.id, {
        currentStep: stepId as OnboardingStep,
        status: 'in_progress',
        collectedData: session.collectedData,
        completedAt: session.completedAt || null,
      });

      setSession(updatedSession);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao navegar para etapa');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePause = () => {
    setShowPauseConfirm(false);
    router.push('/users');
  };

  const handleCancel = async () => {
    if (!session) return;

    try {
      setIsSaving(true);
      await abandonOnboardingSession(session.id);
      router.push('/users');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao cancelar onboarding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!session) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await finalizeOnboardingDraft(session.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao concluir onboarding');
      return;
    } finally {
      setIsSaving(false);
    }

    router.push('/users');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center">
        <Card className="p-6">
          <p className="text-sm text-[var(--text-secondary)]">Carregando onboarding...</p>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Não foi possível iniciar o cadastro</h2>
          <p className="text-sm text-[var(--text-secondary)]">{errorMessage || 'Tente novamente em instantes.'}</p>
          <div className="mt-4">
            <Button onClick={() => router.push('/users')}>Voltar para usuários</Button>
          </div>
        </Card>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (session.currentStep) {
      case 'identification':
        return (
          <StepIdentification
            session={session}
            onNext={goToNextStep}
            onBack={() => setShowCancelConfirm(true)}
          />
        );
      case 'personal_data':
        return (
          <StepPersonalData
            session={session}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'plan_selection':
        return (
          <StepPlanSelection
            session={session}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'contract':
        return (
          <StepContract
            session={session}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'payment':
        return (
          <StepPayment
            session={session}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'activation':
        return (
          <StepActivation
            session={session}
            onComplete={async (data) => {
              await goToNextStep(data);
              await handleComplete();
            }}
            onBack={goToPreviousStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--background-primary)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                Novo Cadastro
              </h1>
              <p className="text-sm text-[var(--text-tertiary)]">
                {currentStepInfo?.title || 'Onboarding'} • Etapa {currentStepIndex + 1} de {ONBOARDING_STEPS.length}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPauseConfirm(true)}
                disabled={isSaving}
                className="text-[var(--text-secondary)]"
              >
                <PauseIcon className="w-4 h-4 mr-1" />
                Pausar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isSaving}
                className="text-[var(--text-secondary)]"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress bar mobile */}
          <div className="mt-4 md:hidden">
            <OnboardingProgressBar 
              current={currentStepIndex + 1} 
              total={ONBOARDING_STEPS.length} 
            />
          </div>

          {errorMessage && (
            <p className="mt-3 text-xs text-[var(--status-negative)]">{errorMessage}</p>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar com stepper (desktop) */}
          <aside className="hidden md:block">
            <div className="sticky top-32">
              <Stepper
                steps={session.steps}
                currentStep={session.currentStep}
                onStepClick={(stepId) => {
                  void goToStep(stepId);
                }}
                orientation="vertical"
              />
            </div>
          </aside>

          {/* Form content */}
          <div className="md:col-span-3">
            <Card className="p-6 md:p-8">
              {renderCurrentStep()}
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de confirmação de pausa */}
      {showPauseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Pausar cadastro?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              O progresso será salvo e você poderá continuar depois. 
              {session.collectedData.identification?.fullName && (
                <> O cadastro de <strong>{session.collectedData.identification.fullName}</strong> ficará pendente.</>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowPauseConfirm(false)}>
                Continuar cadastro
              </Button>
                <Button onClick={handlePause} disabled={isSaving}>
                Pausar e sair
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de confirmação de cancelamento */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Cancelar cadastro?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Todo o progresso será perdido e não poderá ser recuperado.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowCancelConfirm(false)}>
                Voltar
              </Button>
                <Button variant="destructive" onClick={() => void handleCancel()} disabled={isSaving}>
                Cancelar cadastro
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
