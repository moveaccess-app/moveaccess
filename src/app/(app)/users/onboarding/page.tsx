'use client';

/**
 * Página de Onboarding com persistência Supabase
 * 
 * Usa o hook useStudentDraft para salvar automaticamente
 * cada etapa no banco de dados.
 * 
 * Feature flag: NEXT_PUBLIC_USE_SUPABASE_ONBOARDING
 * - true: usa Supabase (novo)
 * - false/undefined: usa mock local (legado)
 */

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  OnboardingStepInfo,
  ONBOARDING_STEPS,
  createNewOnboardingSession,
  getNextStep as getMockNextStep,
  getPreviousStep as getMockPreviousStep,
  getStepIndex,
} from '@/mocks/onboardingMock';
import { useStudentDraft, getNextStep, getPreviousStep } from '@/lib/onboarding';

// ============================================
// FEATURE FLAG
// ============================================

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE_ONBOARDING === 'true';

// ID da academia para testes (em produção virá do contexto)
// Move Fitness: a0000000-0000-0000-0000-000000000001
// Gym Elite: b0000000-0000-0000-0000-000000000002
const DEFAULT_ACADEMY_ID = 'a0000000-0000-0000-0000-000000000001';

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

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ============================================
// HELPER: Converter draft para session (compatibilidade com steps)
// ============================================

function draftToSession(
  draftId: string | null,
  currentStep: OnboardingStep,
  collectedData: OnboardingSession['collectedData'],
  academyId: string
): OnboardingSession {
  const stepOrder: OnboardingStep[] = [
    'identification',
    'personal_data',
    'plan_selection',
    'contract',
    'payment',
    'activation',
  ];

  const currentIndex = stepOrder.indexOf(currentStep);

  const steps: OnboardingStepInfo[] = ONBOARDING_STEPS.map((stepDef, index) => {
    let status: 'pending' | 'current' | 'completed' = 'pending';
    
    if (index < currentIndex) {
      status = 'completed';
    } else if (index === currentIndex) {
      status = 'current';
    }

    return {
      ...stepDef,
      status,
    };
  });

  return {
    id: draftId || 'temp-session',
    status: 'in_progress',
    currentStep,
    steps,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedBy: 'academy',
    academyId,
    collectedData,
  };
}

// ============================================
// MAIN COMPONENT (with Supabase)
// ============================================

function OnboardingWithSupabase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingDraftId = searchParams.get('draft') ?? undefined;

  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPublishError, setShowPublishError] = useState<string | null>(null);

  const {
    draft,
    draftId,
    loading,
    saving,
    error,
    progress,
    saveAndGoNext,
    saveStep,
    abandon,
    publish,
  } = useStudentDraft({
    academyId: DEFAULT_ACADEMY_ID,
    existingDraftId,
    onError: (err) => console.error('Draft error:', err),
  });

  // Converte draft para formato de session para compatibilidade
  const session = draft 
    ? draftToSession(draft.id, draft.current_step, draft.collected_data, draft.academy_id)
    : null;

  const currentStepIndex = session 
    ? ONBOARDING_STEPS.findIndex(s => s.id === session.currentStep)
    : 0;
  const currentStepInfo = ONBOARDING_STEPS[currentStepIndex];

  // Avançar para próximo step
  const goToNextStep = useCallback(async (stepData: Record<string, unknown>) => {
    if (!draft) return;

    const { error: saveError, nextStep } = await saveAndGoNext(
      draft.current_step as OnboardingStep,
      stepData
    );

    if (saveError) {
      console.error('Erro ao salvar step:', saveError);
      return;
    }

    // Se não há próximo step, é a última etapa
    if (!nextStep) {
      // Publicar automaticamente
      const { data, error: publishError } = await publish();
      
      if (publishError) {
        setShowPublishError(publishError.message);
        return;
      }

      // Redireciona para o perfil do aluno criado
      if (data?.userId) {
        router.push(`/users/${data.userId}`);
      } else {
        router.push('/users');
      }
    }
  }, [draft, saveAndGoNext, publish, router]);

  // Voltar para step anterior
  const goToPreviousStep = useCallback(() => {
    if (!draft) return;
    
    const prevStep = getPreviousStep(draft.current_step as OnboardingStep);
    if (prevStep && session) {
      saveStep(prevStep, session.collectedData[prevStep.replace('_', '') as keyof typeof session.collectedData] || {});
    }
  }, [draft, session, saveStep]);

  // Navegar para step específico
  const goToStep = useCallback((stepId: string) => {
    if (!draft || !session) return;
    
    const targetStep = session.steps.find(s => s.id === stepId);
    if (!targetStep || targetStep.status !== 'completed') return;

    saveStep(stepId as OnboardingStep, 
      session.collectedData[stepId.replace('_', '') as keyof typeof session.collectedData] || {}
    );
  }, [draft, session, saveStep]);

  // Pausar onboarding (só salva e sai, draft já está persistido)
  const handlePause = useCallback(() => {
    router.push('/users');
  }, [router]);

  // Cancelar onboarding (abandona o draft)
  const handleCancel = useCallback(async () => {
    if (draft) {
      await abandon();
    }
    router.push('/users');
  }, [draft, abandon, router]);

  // Renderizar step atual
  const renderCurrentStep = () => {
    if (!session) return null;

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
            onComplete={(data) => goToNextStep(data as Record<string, unknown>)}
            onBack={goToPreviousStep}
          />
        );
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center">
        <div className="text-center">
          <LoaderIcon className="w-8 h-8 text-[var(--accent-primary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">
            {existingDraftId ? 'Carregando rascunho...' : 'Iniciando cadastro...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !draft) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 p-6 text-center">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Erro ao carregar
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {error.message}
          </p>
          <Button onClick={() => router.push('/users')}>
            Voltar para usuários
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--background-primary)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                Novo Cadastro
                {saving && (
                  <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)]">
                    Salvando...
                  </span>
                )}
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
                disabled={saving}
              >
                <PauseIcon className="w-4 h-4 mr-1" />
                Pausar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
                className="text-[var(--text-secondary)]"
                disabled={saving}
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

          {/* Debug info (remover em produção) */}
          {draftId && (
            <div className="mt-2 text-xs text-[var(--text-tertiary)]">
              Draft: {draftId.slice(0, 8)}... • Progresso: {progress}%
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar com stepper (desktop) */}
          <aside className="hidden md:block">
            <div className="sticky top-32">
              {session && (
                <Stepper
                  steps={session.steps}
                  currentStep={session.currentStep}
                  onStepClick={goToStep}
                  orientation="vertical"
                />
              )}
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
              O progresso já está salvo automaticamente. Você poderá continuar depois pela lista de rascunhos.
              {session?.collectedData.identification?.fullName && (
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
              O que deseja fazer?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Você pode pausar para continuar depois ou cancelar definitivamente.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCancelConfirm(false);
                  router.push('/users');
                }}
                className="w-full justify-center"
              >
                ⏸️ Pausar e continuar depois
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancel}
                className="w-full justify-center"
              >
                🗑️ Cancelar cadastro permanentemente
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowCancelConfirm(false)}
                className="w-full justify-center"
              >
                Voltar ao cadastro
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de erro ao publicar */}
      {showPublishError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Erro ao finalizar
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {showPublishError}
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowPublishError(null)}>
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================
// LEGACY COMPONENT (mock local - código original)
// ============================================

function OnboardingLegacy() {
  const router = useRouter();
  
  const [session, setSession] = useState<OnboardingSession>(() => 
    createNewOnboardingSession('unit-1', 'academy')
  );
  
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const currentStepIndex = getStepIndex(session.currentStep);
  const currentStepInfo = session.steps[currentStepIndex];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goToNextStep = useCallback((stepData: any) => {
    const nextStep = getMockNextStep(session.currentStep);
    
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

  const goToPreviousStep = useCallback(() => {
    const prevStep = getMockPreviousStep(session.currentStep);
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

  const handlePause = () => {
    console.log('Onboarding pausado:', session);
    router.push('/users');
  };

  const handleCancel = () => {
    router.push('/users');
  };

  const handleComplete = () => {
    console.log('Onboarding concluído:', session);
    router.push('/users');
  };

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
          
          <div className="mt-4 md:hidden">
            <OnboardingProgressBar 
              current={currentStepIndex + 1} 
              total={ONBOARDING_STEPS.length} 
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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

          <div className="md:col-span-3">
            <Card className="p-6 md:p-8">
              {renderCurrentStep()}
            </Card>
          </div>
        </div>
      </main>

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

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              O que deseja fazer?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Você pode pausar para continuar depois ou cancelar definitivamente.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCancelConfirm(false);
                  handlePause();
                }}
                className="w-full justify-center"
              >
                ⏸️ Pausar e continuar depois
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancel}
                className="w-full justify-center"
              >
                🗑️ Cancelar cadastro permanentemente
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowCancelConfirm(false)}
                className="w-full justify-center"
              >
                Voltar ao cadastro
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================
// PAGE EXPORT (escolhe versão baseado na feature flag)
// ============================================

function OnboardingContent() {
  if (USE_SUPABASE) {
    return <OnboardingWithSupabase />;
  }
  return <OnboardingLegacy />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center">
        <LoaderIcon className="w-8 h-8 text-[var(--accent-primary)]" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
