export type OnboardingStep =
  | 'identification'
  | 'personal_data'
  | 'plan_selection'
  | 'contract'
  | 'payment'
  | 'activation';

export type StepStatus = 'pending' | 'current' | 'completed' | 'skipped';

export type OnboardingDraftStatus =
  | 'in_progress'
  | 'completed'
  | 'abandoned'
  | 'published'
  | 'archived';

export interface OnboardingStepInfo {
  id: OnboardingStep;
  title: string;
  description: string;
  order: number;
  status: StepStatus;
  completedAt?: string;
}

export interface OnboardingIdentificationData {
  fullName: string;
  email: string;
  phone: string;
  userType: 'student' | 'personal';
}

export interface OnboardingPersonalData {
  document: string;
  birthDate: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export interface OnboardingPlanSelectionData {
  planId: string;
  planName: string;
  billingType: 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'single';
  value: number;
  startDate: string;
}

export interface OnboardingContractData {
  contractId: string;
  contractNumber: string;
  acceptedTerms: boolean;
  signedAt: string;
  signatureMethod: 'digital' | 'manual';
}

export interface OnboardingPaymentData {
  paymentId: string;
  method: 'credit_card' | 'debit' | 'pix' | 'boleto' | 'cash';
  status: 'pending' | 'completed' | 'failed';
  value: number;
  paidAt?: string;
}

export interface OnboardingActivationData {
  accessCardGenerated: boolean;
  qrCodeGenerated: boolean;
  activatedAt: string;
}

export interface OnboardingCollectedData {
  identification?: OnboardingIdentificationData;
  personalData?: OnboardingPersonalData;
  planSelection?: OnboardingPlanSelectionData;
  contract?: OnboardingContractData;
  payment?: OnboardingPaymentData;
  activation?: OnboardingActivationData;
}

export interface OnboardingSession {
  id: string;
  academyId: string;
  unitId: string | null;
  createdBy: string;
  currentStep: OnboardingStep;
  status: OnboardingDraftStatus;
  origin: 'staff' | 'self_registration' | 'invite_link';
  collectedData: OnboardingCollectedData;
  steps: OnboardingStepInfo[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  publishedAt?: string;
  publishedUserId?: string;
}

export const ONBOARDING_STEPS_BASE: Omit<OnboardingStepInfo, 'status' | 'completedAt'>[] = [
  {
    id: 'identification',
    title: 'Identificação',
    description: 'Dados básicos do aluno',
    order: 1,
  },
  {
    id: 'personal_data',
    title: 'Dados pessoais',
    description: 'Documentos e endereço',
    order: 2,
  },
  {
    id: 'plan_selection',
    title: 'Plano',
    description: 'Escolha do plano',
    order: 3,
  },
  {
    id: 'contract',
    title: 'Contrato',
    description: 'Assinatura dos termos',
    order: 4,
  },
  {
    id: 'payment',
    title: 'Pagamento',
    description: 'Forma de pagamento',
    order: 5,
  },
  {
    id: 'activation',
    title: 'Ativação',
    description: 'Liberação de acesso',
    order: 6,
  },
];

export const ONBOARDING_STEPS = ONBOARDING_STEPS_BASE.map((step) => step.id);

export function getStepIndex(stepId: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(stepId);
}

export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex === -1 || currentIndex >= ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex + 1];
}

export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex - 1];
}

export function buildStepState(
  currentStep: OnboardingStep,
  completedAtMap?: Partial<Record<OnboardingStep, string>>
): OnboardingStepInfo[] {
  const currentIndex = getStepIndex(currentStep);

  return ONBOARDING_STEPS_BASE.map((step, index) => ({
    ...step,
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending',
    completedAt: completedAtMap?.[step.id],
  }));
}
