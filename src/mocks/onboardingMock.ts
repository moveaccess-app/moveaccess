// ============================================
// TIPOS DO ONBOARDING
// ============================================

export type OnboardingStep = 
  | 'identification'    // Identificação básica
  | 'personal_data'     // Dados pessoais e documentos
  | 'plan_selection'    // Escolha de plano
  | 'contract'          // Contrato
  | 'payment'           // Pagamento
  | 'activation';       // Ativação de acesso

export type OnboardingStatus = 
  | 'not_started'       // Não iniciado
  | 'in_progress'       // Em andamento
  | 'completed'         // Completo
  | 'abandoned';        // Abandonado

export type StepStatus = 
  | 'pending'           // Aguardando
  | 'current'           // Etapa atual
  | 'completed'         // Concluída
  | 'skipped';          // Pulada (quando permitido)

export interface OnboardingStepInfo {
  id: OnboardingStep;
  order: number;
  title: string;
  description: string;
  status: StepStatus;
  completedAt?: string;
  data?: Record<string, unknown>;
}

export interface OnboardingSession {
  id: string;
  userId?: string;              // Vinculado após identificação
  status: OnboardingStatus;
  currentStep: OnboardingStep;
  steps: OnboardingStepInfo[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  startedBy: 'academy' | 'user';
  academyId: string;
  // Dados coletados durante o fluxo
  collectedData: {
    identification?: {
      fullName: string;
      email: string;
      phone: string;
      userType: 'student' | 'personal';
    };
    personalData?: {
      document: string;        // CPF
      birthDate: string;
      address?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
      };
      emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
      };
    };
    planSelection?: {
      planId: string;
      planName: string;
      billingType: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
      value: number;
      startDate: string;
    };
    contract?: {
      contractId: string;
      contractNumber: string;
      acceptedTerms: boolean;
      signedAt?: string;
      signatureMethod?: 'digital' | 'manual';
    };
    payment?: {
      paymentId: string;
      method: 'credit_card' | 'debit' | 'pix' | 'boleto';
      status: 'pending' | 'processing' | 'completed' | 'failed';
      value: number;
      paidAt?: string;
    };
    activation?: {
      accessCardGenerated: boolean;
      qrCodeGenerated: boolean;
      activatedAt?: string;
    };
  };
}

// ============================================
// CONSTANTES DE STEPS
// ============================================

export const ONBOARDING_STEPS: Omit<OnboardingStepInfo, 'status' | 'completedAt' | 'data'>[] = [
  {
    id: 'identification',
    order: 1,
    title: 'Identificação',
    description: 'Nome, email e tipo de usuário',
  },
  {
    id: 'personal_data',
    order: 2,
    title: 'Dados Pessoais',
    description: 'Documentos e endereço',
  },
  {
    id: 'plan_selection',
    order: 3,
    title: 'Plano',
    description: 'Escolha do plano ideal',
  },
  {
    id: 'contract',
    order: 4,
    title: 'Contrato',
    description: 'Termos e assinatura',
  },
  {
    id: 'payment',
    order: 5,
    title: 'Pagamento',
    description: 'Forma de pagamento',
  },
  {
    id: 'activation',
    order: 6,
    title: 'Ativação',
    description: 'Acesso liberado',
  },
];

// ============================================
// PLANOS MOCK (para seleção no onboarding)
// ============================================

export interface AvailablePlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  prices: {
    monthly: number;
    quarterly: number;
    semiannual: number;
    annual: number;
  };
  isPopular?: boolean;
}

export const mockAvailablePlans: AvailablePlan[] = [
  {
    id: 'plan-basic',
    name: 'Básico',
    description: 'Acesso à academia em horários padrão',
    features: [
      'Acesso de segunda a sexta',
      'Horário: 6h às 22h',
      'Área de musculação',
      'Vestiários',
    ],
    prices: {
      monthly: 89.90,
      quarterly: 79.90,
      semiannual: 69.90,
      annual: 59.90,
    },
  },
  {
    id: 'plan-standard',
    name: 'Padrão',
    description: 'Acesso completo com aulas em grupo',
    features: [
      'Acesso todos os dias',
      'Horário: 6h às 23h',
      'Área de musculação',
      'Aulas em grupo',
      'Vestiários com armário',
    ],
    prices: {
      monthly: 129.90,
      quarterly: 119.90,
      semiannual: 109.90,
      annual: 99.90,
    },
    isPopular: true,
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    description: 'Acesso VIP com benefícios exclusivos',
    features: [
      'Acesso 24 horas',
      'Todas as modalidades',
      'Personal trainer incluso (2x/mês)',
      'Armário individual',
      'Área VIP',
      'Estacionamento',
    ],
    prices: {
      monthly: 199.90,
      quarterly: 179.90,
      semiannual: 159.90,
      annual: 139.90,
    },
  },
];

// ============================================
// SESSÕES DE ONBOARDING MOCK
// ============================================

export const mockOnboardingSessions: OnboardingSession[] = [
  {
    id: 'onb-001',
    userId: '3', // Pedro Oliveira - status pending
    status: 'in_progress',
    currentStep: 'payment',
    startedAt: '2024-03-10T14:00:00',
    updatedAt: '2024-03-10T14:30:00',
    startedBy: 'user',
    academyId: 'unit-2',
    steps: [
      { id: 'identification', order: 1, title: 'Identificação', description: 'Nome, email e tipo de usuário', status: 'completed', completedAt: '2024-03-10T14:05:00' },
      { id: 'personal_data', order: 2, title: 'Dados Pessoais', description: 'Documentos e endereço', status: 'completed', completedAt: '2024-03-10T14:15:00' },
      { id: 'plan_selection', order: 3, title: 'Plano', description: 'Escolha do plano ideal', status: 'completed', completedAt: '2024-03-10T14:20:00' },
      { id: 'contract', order: 4, title: 'Contrato', description: 'Termos e assinatura', status: 'completed', completedAt: '2024-03-10T14:25:00' },
      { id: 'payment', order: 5, title: 'Pagamento', description: 'Forma de pagamento', status: 'current' },
      { id: 'activation', order: 6, title: 'Ativação', description: 'Acesso liberado', status: 'pending' },
    ],
    collectedData: {
      identification: {
        fullName: 'Pedro Oliveira',
        email: 'pedro.oliveira@exemplo.com.br',
        phone: '(11) 96543-2109',
        userType: 'student',
      },
      personalData: {
        document: '456.789.123-00',
        birthDate: '1995-08-22',
        address: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
        },
      },
      planSelection: {
        planId: 'plan-basic',
        planName: 'Básico',
        billingType: 'monthly',
        value: 89.90,
        startDate: '2024-03-10',
      },
      contract: {
        contractId: 'ctr-003',
        contractNumber: 'CTR-2024-003',
        acceptedTerms: true,
        signedAt: '2024-03-10T14:25:00',
        signatureMethod: 'digital',
      },
    },
  },
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

export function createNewOnboardingSession(academyId: string, startedBy: 'academy' | 'user'): OnboardingSession {
  const now = new Date().toISOString();
  return {
    id: `onb-${Date.now()}`,
    status: 'in_progress',
    currentStep: 'identification',
    startedAt: now,
    updatedAt: now,
    startedBy,
    academyId,
    steps: ONBOARDING_STEPS.map((step, index) => ({
      ...step,
      status: index === 0 ? 'current' : 'pending',
    })),
    collectedData: {},
  };
}

export function getStepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.findIndex(s => s.id === step);
}

export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex < ONBOARDING_STEPS.length - 1) {
    return ONBOARDING_STEPS[currentIndex + 1].id;
  }
  return null;
}

export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return ONBOARDING_STEPS[currentIndex - 1].id;
  }
  return null;
}

export function getOnboardingProgress(session: OnboardingSession): number {
  const completedSteps = session.steps.filter(s => s.status === 'completed').length;
  return Math.round((completedSteps / session.steps.length) * 100);
}

export function getOnboardingStatusLabel(status: OnboardingStatus): string {
  const labels: Record<OnboardingStatus, string> = {
    not_started: 'Não iniciado',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    abandoned: 'Abandonado',
  };
  return labels[status];
}

export function getStepStatusLabel(status: StepStatus): string {
  const labels: Record<StepStatus, string> = {
    pending: 'Pendente',
    current: 'Em andamento',
    completed: 'Concluída',
    skipped: 'Pulada',
  };
  return labels[status];
}
