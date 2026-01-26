'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button } from '@/components/ui';
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
  createNewOnboardingSession,
  getNextStep,
  getPreviousStep,
  getStepIndex,
  ONBOARDING_STEPS,
} from '@/mocks/onboardingMock';
import {
  Invite,
  getInviteByToken,
  isInviteValid,
  notifyAcademyPreRegistration,
} from '@/mocks/inviteMock';

// ============================================
// ICONS
// ============================================

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

// ============================================
// ESTADOS DA PÁGINA
// ============================================

type PageState = 'loading' | 'invalid' | 'expired' | 'welcome' | 'onboarding' | 'completed';

// ============================================
// PAGE COMPONENT
// ============================================

export default function PublicOnboardingPage() {
  const params = useParams();
  const token = params.token as string;

  // Calcular estado inicial baseado no token
  const initialData = useMemo(() => {
    const foundInvite = getInviteByToken(token);
    
    if (!foundInvite) {
      return { state: 'invalid' as PageState, invite: null as Invite | null, session: null as OnboardingSession | null };
    }
    
    if (!isInviteValid(foundInvite)) {
      return { state: 'expired' as PageState, invite: foundInvite, session: null as OnboardingSession | null };
    }
    
    // Se já iniciou, continuar de onde parou
    if (foundInvite.status === 'started' && foundInvite.preRegistration?.onboardingSessionId) {
      const newSession = createNewOnboardingSession(foundInvite.unitId, 'user');
      return { state: 'onboarding' as PageState, invite: foundInvite, session: newSession };
    }
    
    return { state: 'welcome' as PageState, invite: foundInvite, session: null as OnboardingSession | null };
  }, [token]);
  
  const [pageState, setPageState] = useState<PageState>(initialData.state);
  const [invite, setInvite] = useState<Invite | null>(initialData.invite);
  const [session, setSession] = useState<OnboardingSession | null>(initialData.session);

  // Iniciar cadastro
  const handleStart = () => {
    if (!invite) return;
    
    const newSession = createNewOnboardingSession(invite.unitId, 'user');
    setSession(newSession);
    
    // Atualizar convite (em produção: salvar no backend)
    const updatedInvite: Invite = {
      ...invite,
      status: 'started',
      openedAt: invite.openedAt || new Date().toISOString(),
      startedAt: new Date().toISOString(),
      preRegistration: {
        onboardingSessionId: newSession.id,
      },
    };
    setInvite(updatedInvite);
    
    // Notificar academia
    notifyAcademyPreRegistration(updatedInvite);
    
    setPageState('onboarding');
  };

  // Lógica de steps (reutilizada do onboarding interno)
  const currentStepIndex = session ? getStepIndex(session.currentStep) : 0;
  const currentStepInfo = session?.steps[currentStepIndex];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goToNextStep = useCallback((stepData: any) => {
    if (!session || !invite) return;
    
    const nextStep = getNextStep(session.currentStep);
    
    setSession(prev => {
      if (!prev) return prev;
      
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
          // Atualizar pré-cadastro com dados
          setInvite(inv => inv ? {
            ...inv,
            preRegistration: {
              ...inv.preRegistration,
              name: updatedCollectedData.identification?.fullName,
              email: updatedCollectedData.identification?.email,
              phone: updatedCollectedData.identification?.phone,
              onboardingSessionId: prev.id,
            },
          } : inv);
          // Notificar academia novamente com dados
          notifyAcademyPreRegistration({
            ...invite,
            preRegistration: {
              name: updatedCollectedData.identification?.fullName,
              email: updatedCollectedData.identification?.email,
              phone: updatedCollectedData.identification?.phone,
              onboardingSessionId: prev.id,
            },
          });
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
  }, [session, invite]);

  const goToPreviousStep = useCallback(() => {
    if (!session) return;
    const prevStep = getPreviousStep(session.currentStep);
    if (!prevStep) return;

    setSession(prev => {
      if (!prev) return prev;
      
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
  }, [session]);

  const handleComplete = () => {
    // Atualizar convite como completo
    setInvite(inv => inv ? {
      ...inv,
      status: 'completed',
      completedAt: new Date().toISOString(),
      userId: 'new-user-id',
    } : inv);
    
    setPageState('completed');
  };

  // Renderizar step atual
  const renderCurrentStep = () => {
    if (!session) return null;

    switch (session.currentStep) {
      case 'identification':
        return (
          <StepIdentification
            session={session}
            onNext={goToNextStep}
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

  // ============================================
  // RENDERS POR ESTADO
  // ============================================

  // Loading
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

  // Link inválido
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-negative)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-negative)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Link inválido
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este link de cadastro não existe ou foi removido. 
            Entre em contato com a academia para obter um novo link.
          </p>
        </Card>
      </div>
    );
  }

  // Link expirado
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center mb-4">
            <AlertIcon className="w-8 h-8 text-[var(--status-alert)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Link expirado
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Este link de cadastro expirou. 
            Solicite um novo link à academia para continuar.
          </p>
        </Card>
      </div>
    );
  }

  // Tela de boas-vindas
  if (pageState === 'welcome' && invite) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-8">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Bem-vindo(a)! 👋
            </h1>
            <p className="text-[var(--text-secondary)]">
              Você foi convidado(a) para fazer parte da
            </p>
            <p className="text-lg font-semibold text-[var(--element-primary)]">
              {invite.unitName}
            </p>
          </div>

          {invite.discount && (
            <div className="mb-6 p-4 bg-[var(--status-positive)]/10 rounded-lg text-center">
              <span className="text-2xl">🎉</span>
              <p className="font-medium text-[var(--status-positive)] mt-1">
                {invite.discount.description}
              </p>
            </div>
          )}

          <div className="space-y-3 mb-8">
            <p className="text-sm text-[var(--text-tertiary)] text-center">
              O cadastro leva apenas alguns minutos:
            </p>
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

          <Button onClick={handleStart} className="w-full" size="lg">
            Começar cadastro
          </Button>

          <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">
            Link válido até {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
          </p>
        </Card>
      </div>
    );
  }

  // Cadastro completo
  if (pageState === 'completed') {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-[var(--status-positive)]/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-12 h-12 text-[var(--status-positive)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Cadastro concluído! 🎉
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Seu acesso à academia está liberado. Você receberá um e-mail com todas as informações.
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            Baixe nosso app para ter seu QR Code de acesso sempre à mão.
          </p>
        </Card>
      </div>
    );
  }

  // Onboarding em andamento
  if (pageState === 'onboarding' && session && invite) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[var(--background-primary)] border-b border-[var(--border-subtle)]">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {invite.unitName}
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {currentStepInfo?.title} • Etapa {currentStepIndex + 1} de {ONBOARDING_STEPS.length}
                </p>
              </div>
              
              {invite.discount && (
                <span className="text-xs bg-[var(--status-positive)]/10 text-[var(--status-positive)] px-2 py-1 rounded-full">
                  {invite.discount.description}
                </span>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <OnboardingProgressBar 
                current={currentStepIndex + 1} 
                total={ONBOARDING_STEPS.length} 
                showLabel={false}
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-3xl mx-auto px-6 py-8">
          <Card className="p-6 md:p-8">
            {renderCurrentStep()}
          </Card>
        </main>
      </div>
    );
  }

  return null;
}
