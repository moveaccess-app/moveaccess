'use client';

import { useState, useCallback } from 'react';
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
  OnboardingSession,
  OnboardingStep,
  createNewOnboardingSession,
  getNextStep,
  getPreviousStep,
  getStepIndex,
  ONBOARDING_STEPS,
} from '@/mocks/onboardingMock';

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
  
  // Criar nova sessão de onboarding
  const [session, setSession] = useState<OnboardingSession>(() => 
    createNewOnboardingSession('unit-1', 'academy')
  );
  
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const currentStepIndex = getStepIndex(session.currentStep);
  const currentStepInfo = session.steps[currentStepIndex];

  // Avançar para próximo step
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goToNextStep = useCallback((stepData: any) => {
    const nextStep = getNextStep(session.currentStep);
    
    setSession(prev => {
      const updatedSteps = prev.steps.map((step) => {
        if (step.id === prev.currentStep) {
          return { ...step, status: 'completed' as const, completedAt: new Date().toISOString() };
        }
        if (nextStep && step.id === nextStep) {
          return { ...step, status: 'current' as const };
        }
        return step;
      });

      const updatedCollectedData = { ...prev.collectedData };
      
      // Atualizar dados coletados baseado no step atual
      switch (prev.currentStep) {
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

      return {
        ...prev,
        currentStep: nextStep || prev.currentStep,
        steps: updatedSteps,
        collectedData: updatedCollectedData,
        updatedAt: new Date().toISOString(),
        status: !nextStep ? 'completed' : 'in_progress',
        completedAt: !nextStep ? new Date().toISOString() : undefined,
      };
    });
  }, [session.currentStep]);

  // Voltar para step anterior
  const goToPreviousStep = useCallback(() => {
    const prevStep = getPreviousStep(session.currentStep);
    if (!prevStep) return;

    setSession(prev => {
      const updatedSteps = prev.steps.map(step => {
        if (step.id === prev.currentStep) {
          return { ...step, status: 'pending' as const };
        }
        if (step.id === prevStep) {
          return { ...step, status: 'current' as const, completedAt: undefined };
        }
        return step;
      });

      return {
        ...prev,
        currentStep: prevStep,
        steps: updatedSteps,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [session.currentStep]);

  // Navegar para step específico (apenas steps completos)
  const goToStep = useCallback((stepId: string) => {
    const targetStep = session.steps.find(s => s.id === stepId);
    if (!targetStep || targetStep.status !== 'completed') return;

    setSession(prev => {
      const updatedSteps = prev.steps.map(step => {
        if (step.id === prev.currentStep) {
          return { ...step, status: 'pending' as const };
        }
        if (step.id === stepId) {
          return { ...step, status: 'current' as const };
        }
        return step;
      });

      return {
        ...prev,
        currentStep: stepId as OnboardingStep,
        steps: updatedSteps,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [session.steps]);

  // Pausar onboarding
  const handlePause = () => {
    // Em produção: salvar estado no backend
    console.log('Onboarding pausado:', session);
    router.push('/users');
  };

  // Cancelar onboarding
  const handleCancel = () => {
    // Em produção: atualizar status para abandoned
    router.push('/users');
  };

  // Concluir onboarding
  const handleComplete = () => {
    // Em produção: salvar usuário completo no backend
    console.log('Onboarding concluído:', session);
    router.push('/users');
  };

  // Renderizar step atual
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
            onComplete={(data) => {
              goToNextStep(data as Record<string, unknown>);
              handleComplete();
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
                {currentStepInfo?.title} • Etapa {currentStepIndex + 1} de {ONBOARDING_STEPS.length}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPauseConfirm(true)}
                className="text-[var(--text-secondary)]"
              >
                <PauseIcon className="w-4 h-4 mr-1" />
                Pausar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
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
                onStepClick={goToStep}
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
              <Button onClick={handlePause}>
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
              <Button variant="destructive" onClick={handleCancel}>
                Cancelar cadastro
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
