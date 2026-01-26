// ============================================
// MÓDULO DE PLANOS - MOVEACCESS
// Base comercial para onboarding, contratos, financeiro e acesso
// ============================================

// ============================================
// TIPOS BASE
// ============================================

export type PlanStatus = 'active' | 'inactive' | 'draft';
export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';
export type ChargeType = 'recurring' | 'single';
export type UserTypeAllowed = 'student' | 'personal' | 'guest' | 'all';

// ============================================
// INTERFACES PRINCIPAIS
// ============================================

/**
 * Estrutura de preço por ciclo de cobrança
 */
export interface PlanPricing {
  cycle: BillingCycle;
  price: number;
  /** Desconto em relação ao mensal (calculado automaticamente) */
  discountPercentage: number;
  /** Se está habilitado para venda */
  enabled: boolean;
}

/**
 * Taxa de adesão/matrícula
 */
export interface EnrollmentFee {
  enabled: boolean;
  value: number;
  /** Permitir desconto no onboarding via link */
  allowDiscount: boolean;
}

/**
 * Regras de acesso do plano
 * (mockado, mas estruturado para futura integração)
 */
export interface AccessRules {
  /** Horários permitidos (formato 24h) */
  allowedHours: {
    start: string;  // "06:00"
    end: string;    // "22:00"
  };
  /** Dias da semana permitidos (0=domingo, 6=sábado) */
  allowedDays: number[];
  /** Acesso 24h override */
  is24Hours: boolean;
  /** Unidades permitidas (vazio = todas) */
  allowedUnits: string[];
  /** Limite de check-ins por dia (0 = ilimitado) */
  dailyCheckInLimit: number;
  /** Período de carência após check-in para novo check-in (minutos) */
  checkInCooldown: number;
}

/**
 * Regras contratuais do plano
 * (mockado, mas estruturado para futura integração)
 */
export interface ContractRules {
  /** Período mínimo de fidelidade (meses) */
  minimumCommitment: number;
  /** Multa por cancelamento antecipado (%) */
  earlyTerminationFee: number;
  /** Dias de aviso prévio para cancelamento */
  cancellationNoticeDays: number;
  /** Permite renovação automática */
  autoRenewal: boolean;
  /** Template de contrato a usar */
  contractTemplateId: string;
}

/**
 * Comportamento no onboarding
 * Flags para controlar o fluxo
 */
export interface OnboardingBehavior {
  /** Plano pode ser escolhido pelo usuário final */
  userSelectable: boolean;
  /** Exige aprovação da academia antes de ativar */
  requiresApproval: boolean;
  /** Exige pagamento imediato */
  requiresImmediatePayment: boolean;
  /** Libera acesso imediatamente após conclusão */
  immediateAccessAfterCompletion: boolean;
  /** Dias de trial antes de cobrar (0 = sem trial) */
  trialDays: number;
  /** Mostrar no catálogo público */
  showInPublicCatalog: boolean;
  /** Ordem de exibição no catálogo */
  catalogOrder: number;
  /** Destaque como "popular" */
  isPopular: boolean;
  /** Destaque como "melhor custo-benefício" */
  isBestValue: boolean;
}

/**
 * Recursos/benefícios inclusos no plano
 */
export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  /** Ícone (nome do ícone para UI) */
  icon?: string;
}

/**
 * Interface principal do Plano
 */
export interface Plan {
  id: string;
  
  // Identidade básica
  name: string;
  description: string;
  shortDescription?: string;
  status: PlanStatus;
  
  // Categoria/tipo
  category: string;  // "musculação", "completo", "vip", etc.
  userTypesAllowed: UserTypeAllowed[];
  
  // Pricing
  chargeType: ChargeType;
  pricing: PlanPricing[];
  enrollmentFee: EnrollmentFee;
  
  // Recursos inclusos
  features: PlanFeature[];
  
  // Regras
  accessRules: AccessRules;
  contractRules: ContractRules;
  onboardingBehavior: OnboardingBehavior;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Estatísticas (para exibição)
  stats: {
    activeContracts: number;
    totalRevenue: number;
    conversionRate: number;
  };
}

// ============================================
// CONSTANTES
// ============================================

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  draft: 'Rascunho',
};

export const USER_TYPE_LABELS: Record<UserTypeAllowed, string> = {
  student: 'Aluno',
  personal: 'Personal Trainer',
  guest: 'Convidado',
  all: 'Todos',
};

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  recurring: 'Recorrente',
  single: 'Avulso',
};

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const PLAN_CATEGORIES = [
  'Musculação',
  'Completo',
  'VIP',
  'Funcional',
  'Natação',
  'Artes Marciais',
  'Personal',
  'Empresarial',
];

// ============================================
// FEATURES PADRÃO
// ============================================

export const DEFAULT_FEATURES: PlanFeature[] = [
  { id: 'feat-musculacao', name: 'Área de Musculação', icon: 'dumbbell' },
  { id: 'feat-cardio', name: 'Área de Cardio', icon: 'heart' },
  { id: 'feat-vestiario', name: 'Vestiários', icon: 'user' },
  { id: 'feat-armario', name: 'Armário Individual', icon: 'lock' },
  { id: 'feat-aulas', name: 'Aulas em Grupo', icon: 'users' },
  { id: 'feat-personal', name: 'Personal Trainer', icon: 'user-check' },
  { id: 'feat-natacao', name: 'Natação', icon: 'droplet' },
  { id: 'feat-spa', name: 'Spa e Sauna', icon: 'sun' },
  { id: 'feat-estacionamento', name: 'Estacionamento', icon: 'car' },
  { id: 'feat-nutri', name: 'Avaliação Nutricional', icon: 'apple' },
  { id: 'feat-avaliacao', name: 'Avaliação Física', icon: 'activity' },
  { id: 'feat-app', name: 'App Exclusivo', icon: 'smartphone' },
  { id: 'feat-24h', name: 'Acesso 24 horas', icon: 'clock' },
  { id: 'feat-toalha', name: 'Toalha Inclusa', icon: 'layout' },
  { id: 'feat-agua', name: 'Água Mineral', icon: 'droplet' },
];

// ============================================
// MOCK DE PLANOS
// ============================================

export const mockPlans: Plan[] = [
  {
    id: 'plan-001',
    name: 'Básico',
    description: 'Plano ideal para quem está começando. Acesso à área de musculação e cardio em horários padrão.',
    shortDescription: 'Acesso básico à academia',
    status: 'active',
    category: 'Musculação',
    userTypesAllowed: ['student'],
    chargeType: 'recurring',
    pricing: [
      { cycle: 'monthly', price: 89.90, discountPercentage: 0, enabled: true },
      { cycle: 'quarterly', price: 79.90, discountPercentage: 11, enabled: true },
      { cycle: 'semiannual', price: 69.90, discountPercentage: 22, enabled: true },
      { cycle: 'annual', price: 59.90, discountPercentage: 33, enabled: true },
    ],
    enrollmentFee: {
      enabled: true,
      value: 99.90,
      allowDiscount: true,
    },
    features: [
      { id: 'feat-musculacao', name: 'Área de Musculação', icon: 'dumbbell' },
      { id: 'feat-cardio', name: 'Área de Cardio', icon: 'heart' },
      { id: 'feat-vestiario', name: 'Vestiários', icon: 'user' },
    ],
    accessRules: {
      allowedHours: { start: '06:00', end: '22:00' },
      allowedDays: [1, 2, 3, 4, 5], // Seg a Sex
      is24Hours: false,
      allowedUnits: [],
      dailyCheckInLimit: 1,
      checkInCooldown: 60,
    },
    contractRules: {
      minimumCommitment: 3,
      earlyTerminationFee: 30,
      cancellationNoticeDays: 30,
      autoRenewal: true,
      contractTemplateId: 'tpl-basic',
    },
    onboardingBehavior: {
      userSelectable: true,
      requiresApproval: false,
      requiresImmediatePayment: true,
      immediateAccessAfterCompletion: true,
      trialDays: 0,
      showInPublicCatalog: true,
      catalogOrder: 1,
      isPopular: false,
      isBestValue: true,
    },
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2025-11-20T14:30:00',
    createdBy: 'admin',
    stats: {
      activeContracts: 245,
      totalRevenue: 156780.00,
      conversionRate: 68,
    },
  },
  {
    id: 'plan-002',
    name: 'Padrão',
    description: 'O plano mais escolhido! Acesso completo à academia todos os dias, incluindo aulas em grupo e armário.',
    shortDescription: 'Acesso completo + aulas',
    status: 'active',
    category: 'Completo',
    userTypesAllowed: ['student', 'personal'],
    chargeType: 'recurring',
    pricing: [
      { cycle: 'monthly', price: 129.90, discountPercentage: 0, enabled: true },
      { cycle: 'quarterly', price: 119.90, discountPercentage: 8, enabled: true },
      { cycle: 'semiannual', price: 109.90, discountPercentage: 15, enabled: true },
      { cycle: 'annual', price: 99.90, discountPercentage: 23, enabled: true },
    ],
    enrollmentFee: {
      enabled: true,
      value: 149.90,
      allowDiscount: true,
    },
    features: [
      { id: 'feat-musculacao', name: 'Área de Musculação', icon: 'dumbbell' },
      { id: 'feat-cardio', name: 'Área de Cardio', icon: 'heart' },
      { id: 'feat-vestiario', name: 'Vestiários', icon: 'user' },
      { id: 'feat-armario', name: 'Armário Individual', icon: 'lock' },
      { id: 'feat-aulas', name: 'Aulas em Grupo', icon: 'users' },
      { id: 'feat-avaliacao', name: 'Avaliação Física', icon: 'activity' },
    ],
    accessRules: {
      allowedHours: { start: '06:00', end: '23:00' },
      allowedDays: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
      is24Hours: false,
      allowedUnits: [],
      dailyCheckInLimit: 2,
      checkInCooldown: 30,
    },
    contractRules: {
      minimumCommitment: 6,
      earlyTerminationFee: 25,
      cancellationNoticeDays: 30,
      autoRenewal: true,
      contractTemplateId: 'tpl-standard',
    },
    onboardingBehavior: {
      userSelectable: true,
      requiresApproval: false,
      requiresImmediatePayment: true,
      immediateAccessAfterCompletion: true,
      trialDays: 7,
      showInPublicCatalog: true,
      catalogOrder: 2,
      isPopular: true,
      isBestValue: false,
    },
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2025-12-10T09:15:00',
    createdBy: 'admin',
    stats: {
      activeContracts: 523,
      totalRevenue: 498750.00,
      conversionRate: 82,
    },
  },
  {
    id: 'plan-003',
    name: 'Premium',
    description: 'Experiência VIP completa. Acesso 24h, personal trainer incluso, spa, estacionamento e muito mais.',
    shortDescription: 'Experiência VIP completa',
    status: 'active',
    category: 'VIP',
    userTypesAllowed: ['student'],
    chargeType: 'recurring',
    pricing: [
      { cycle: 'monthly', price: 249.90, discountPercentage: 0, enabled: true },
      { cycle: 'quarterly', price: 229.90, discountPercentage: 8, enabled: true },
      { cycle: 'semiannual', price: 199.90, discountPercentage: 20, enabled: true },
      { cycle: 'annual', price: 179.90, discountPercentage: 28, enabled: true },
    ],
    enrollmentFee: {
      enabled: false,
      value: 0,
      allowDiscount: false,
    },
    features: [
      { id: 'feat-24h', name: 'Acesso 24 horas', icon: 'clock' },
      { id: 'feat-musculacao', name: 'Área de Musculação', icon: 'dumbbell' },
      { id: 'feat-cardio', name: 'Área de Cardio', icon: 'heart' },
      { id: 'feat-vestiario', name: 'Vestiários', icon: 'user' },
      { id: 'feat-armario', name: 'Armário Individual', icon: 'lock' },
      { id: 'feat-aulas', name: 'Aulas em Grupo', icon: 'users' },
      { id: 'feat-personal', name: 'Personal Trainer (2x/mês)', icon: 'user-check' },
      { id: 'feat-spa', name: 'Spa e Sauna', icon: 'sun' },
      { id: 'feat-estacionamento', name: 'Estacionamento', icon: 'car' },
      { id: 'feat-nutri', name: 'Avaliação Nutricional', icon: 'apple' },
      { id: 'feat-avaliacao', name: 'Avaliação Física', icon: 'activity' },
      { id: 'feat-toalha', name: 'Toalha Inclusa', icon: 'layout' },
    ],
    accessRules: {
      allowedHours: { start: '00:00', end: '23:59' },
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      is24Hours: true,
      allowedUnits: [],
      dailyCheckInLimit: 0,
      checkInCooldown: 0,
    },
    contractRules: {
      minimumCommitment: 12,
      earlyTerminationFee: 20,
      cancellationNoticeDays: 60,
      autoRenewal: true,
      contractTemplateId: 'tpl-premium',
    },
    onboardingBehavior: {
      userSelectable: true,
      requiresApproval: false,
      requiresImmediatePayment: true,
      immediateAccessAfterCompletion: true,
      trialDays: 0,
      showInPublicCatalog: true,
      catalogOrder: 3,
      isPopular: false,
      isBestValue: false,
    },
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2025-12-01T16:45:00',
    createdBy: 'admin',
    stats: {
      activeContracts: 87,
      totalRevenue: 189450.00,
      conversionRate: 45,
    },
  },
  {
    id: 'plan-004',
    name: 'Personal Trainer',
    description: 'Plano especial para profissionais de educação física que atuam na academia.',
    shortDescription: 'Para profissionais',
    status: 'active',
    category: 'Personal',
    userTypesAllowed: ['personal'],
    chargeType: 'recurring',
    pricing: [
      { cycle: 'monthly', price: 199.90, discountPercentage: 0, enabled: true },
      { cycle: 'quarterly', price: 179.90, discountPercentage: 10, enabled: true },
      { cycle: 'semiannual', price: 159.90, discountPercentage: 20, enabled: false },
      { cycle: 'annual', price: 139.90, discountPercentage: 30, enabled: false },
    ],
    enrollmentFee: {
      enabled: true,
      value: 299.90,
      allowDiscount: false,
    },
    features: [
      { id: 'feat-24h', name: 'Acesso 24 horas', icon: 'clock' },
      { id: 'feat-musculacao', name: 'Área de Musculação', icon: 'dumbbell' },
      { id: 'feat-cardio', name: 'Área de Cardio', icon: 'heart' },
      { id: 'feat-vestiario', name: 'Vestiários', icon: 'user' },
      { id: 'feat-armario', name: 'Armário Individual', icon: 'lock' },
      { id: 'feat-app', name: 'App para Gestão de Alunos', icon: 'smartphone' },
    ],
    accessRules: {
      allowedHours: { start: '00:00', end: '23:59' },
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      is24Hours: true,
      allowedUnits: [],
      dailyCheckInLimit: 0,
      checkInCooldown: 0,
    },
    contractRules: {
      minimumCommitment: 3,
      earlyTerminationFee: 50,
      cancellationNoticeDays: 30,
      autoRenewal: false,
      contractTemplateId: 'tpl-personal',
    },
    onboardingBehavior: {
      userSelectable: false,
      requiresApproval: true,
      requiresImmediatePayment: false,
      immediateAccessAfterCompletion: false,
      trialDays: 0,
      showInPublicCatalog: false,
      catalogOrder: 10,
      isPopular: false,
      isBestValue: false,
    },
    createdAt: '2024-03-01T10:00:00',
    updatedAt: '2025-10-15T11:20:00',
    createdBy: 'admin',
    stats: {
      activeContracts: 34,
      totalRevenue: 67890.00,
      conversionRate: 90,
    },
  },
  {
    id: 'plan-005',
    name: 'Day Use',
    description: 'Acesso avulso por dia. Ideal para visitantes e quem quer experimentar.',
    shortDescription: 'Acesso por dia',
    status: 'active',
    category: 'Funcional',
    userTypesAllowed: ['guest', 'student'],
    chargeType: 'single',
    pricing: [
      { cycle: 'monthly', price: 49.90, discountPercentage: 0, enabled: true },
    ],
    enrollmentFee: {
      enabled: false,
      value: 0,
      allowDiscount: false,
    },
    features: [
      { id: 'feat-musculacao', name: 'Área de Musculação', icon: 'dumbbell' },
      { id: 'feat-cardio', name: 'Área de Cardio', icon: 'heart' },
      { id: 'feat-vestiario', name: 'Vestiários', icon: 'user' },
    ],
    accessRules: {
      allowedHours: { start: '08:00', end: '20:00' },
      allowedDays: [1, 2, 3, 4, 5],
      is24Hours: false,
      allowedUnits: [],
      dailyCheckInLimit: 1,
      checkInCooldown: 0,
    },
    contractRules: {
      minimumCommitment: 0,
      earlyTerminationFee: 0,
      cancellationNoticeDays: 0,
      autoRenewal: false,
      contractTemplateId: 'tpl-dayuse',
    },
    onboardingBehavior: {
      userSelectable: true,
      requiresApproval: false,
      requiresImmediatePayment: true,
      immediateAccessAfterCompletion: true,
      trialDays: 0,
      showInPublicCatalog: true,
      catalogOrder: 5,
      isPopular: false,
      isBestValue: false,
    },
    createdAt: '2024-06-01T10:00:00',
    updatedAt: '2025-09-01T08:00:00',
    createdBy: 'admin',
    stats: {
      activeContracts: 0,
      totalRevenue: 12450.00,
      conversionRate: 15,
    },
  },
  {
    id: 'plan-006',
    name: 'Corporativo',
    description: 'Plano especial para empresas. Condições diferenciadas para grupos a partir de 10 colaboradores.',
    shortDescription: 'Para empresas',
    status: 'inactive',
    category: 'Empresarial',
    userTypesAllowed: ['student'],
    chargeType: 'recurring',
    pricing: [
      { cycle: 'monthly', price: 79.90, discountPercentage: 0, enabled: true },
      { cycle: 'quarterly', price: 74.90, discountPercentage: 6, enabled: true },
      { cycle: 'semiannual', price: 69.90, discountPercentage: 13, enabled: true },
      { cycle: 'annual', price: 64.90, discountPercentage: 19, enabled: true },
    ],
    enrollmentFee: {
      enabled: false,
      value: 0,
      allowDiscount: false,
    },
    features: [
      { id: 'feat-musculacao', name: 'Área de Musculação', icon: 'dumbbell' },
      { id: 'feat-cardio', name: 'Área de Cardio', icon: 'heart' },
      { id: 'feat-vestiario', name: 'Vestiários', icon: 'user' },
      { id: 'feat-aulas', name: 'Aulas em Grupo', icon: 'users' },
    ],
    accessRules: {
      allowedHours: { start: '06:00', end: '22:00' },
      allowedDays: [1, 2, 3, 4, 5],
      is24Hours: false,
      allowedUnits: [],
      dailyCheckInLimit: 1,
      checkInCooldown: 60,
    },
    contractRules: {
      minimumCommitment: 12,
      earlyTerminationFee: 50,
      cancellationNoticeDays: 60,
      autoRenewal: true,
      contractTemplateId: 'tpl-corporate',
    },
    onboardingBehavior: {
      userSelectable: false,
      requiresApproval: true,
      requiresImmediatePayment: false,
      immediateAccessAfterCompletion: false,
      trialDays: 0,
      showInPublicCatalog: false,
      catalogOrder: 20,
      isPopular: false,
      isBestValue: false,
    },
    createdAt: '2024-02-01T10:00:00',
    updatedAt: '2025-08-01T10:00:00',
    createdBy: 'admin',
    stats: {
      activeContracts: 0,
      totalRevenue: 45000.00,
      conversionRate: 60,
    },
  },
  {
    id: 'plan-007',
    name: 'Natação Kids',
    description: 'Plano de natação para crianças de 4 a 12 anos. Aulas em grupo com professores especializados.',
    shortDescription: 'Natação infantil',
    status: 'draft',
    category: 'Natação',
    userTypesAllowed: ['student'],
    chargeType: 'recurring',
    pricing: [
      { cycle: 'monthly', price: 189.90, discountPercentage: 0, enabled: true },
      { cycle: 'quarterly', price: 169.90, discountPercentage: 11, enabled: true },
      { cycle: 'semiannual', price: 149.90, discountPercentage: 21, enabled: false },
      { cycle: 'annual', price: 129.90, discountPercentage: 32, enabled: false },
    ],
    enrollmentFee: {
      enabled: true,
      value: 199.90,
      allowDiscount: true,
    },
    features: [
      { id: 'feat-natacao', name: 'Aulas de Natação', icon: 'droplet' },
      { id: 'feat-vestiario', name: 'Vestiários', icon: 'user' },
    ],
    accessRules: {
      allowedHours: { start: '14:00', end: '18:00' },
      allowedDays: [2, 4, 6], // Ter, Qui, Sab
      is24Hours: false,
      allowedUnits: ['unit-1'],
      dailyCheckInLimit: 1,
      checkInCooldown: 0,
    },
    contractRules: {
      minimumCommitment: 6,
      earlyTerminationFee: 30,
      cancellationNoticeDays: 30,
      autoRenewal: true,
      contractTemplateId: 'tpl-kids',
    },
    onboardingBehavior: {
      userSelectable: true,
      requiresApproval: true,
      requiresImmediatePayment: true,
      immediateAccessAfterCompletion: false,
      trialDays: 0,
      showInPublicCatalog: false,
      catalogOrder: 15,
      isPopular: false,
      isBestValue: false,
    },
    createdAt: '2026-01-05T10:00:00',
    updatedAt: '2026-01-05T10:00:00',
    createdBy: 'admin',
    stats: {
      activeContracts: 0,
      totalRevenue: 0,
      conversionRate: 0,
    },
  },
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Busca plano por ID
 */
export function getPlanById(id: string): Plan | undefined {
  return mockPlans.find(plan => plan.id === id);
}

/**
 * Filtra planos por status
 */
export function filterPlansByStatus(status: PlanStatus): Plan[] {
  return mockPlans.filter(plan => plan.status === status);
}

/**
 * Busca planos disponíveis no catálogo público
 */
export function getPublicCatalogPlans(): Plan[] {
  return mockPlans
    .filter(plan => plan.status === 'active' && plan.onboardingBehavior.showInPublicCatalog)
    .sort((a, b) => a.onboardingBehavior.catalogOrder - b.onboardingBehavior.catalogOrder);
}

/**
 * Busca planos disponíveis para um tipo de usuário
 */
export function getPlansForUserType(userType: UserTypeAllowed): Plan[] {
  return mockPlans.filter(plan => 
    plan.status === 'active' && 
    (plan.userTypesAllowed.includes(userType) || plan.userTypesAllowed.includes('all'))
  );
}

/**
 * Calcula o preço por mês para um ciclo específico
 */
export function calculateMonthlyPrice(price: number, cycle: BillingCycle): number {
  const months = BILLING_CYCLE_MONTHS[cycle];
  return price / months;
}

/**
 * Formata preço para exibição
 */
export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Retorna o menor preço disponível para um plano
 */
export function getLowestPrice(plan: Plan): number {
  const enabledPrices = plan.pricing.filter(p => p.enabled);
  if (enabledPrices.length === 0) return 0;
  return Math.min(...enabledPrices.map(p => p.price));
}

/**
 * Retorna a faixa de preço para exibição
 */
export function getPriceRange(plan: Plan): string {
  const enabledPrices = plan.pricing.filter(p => p.enabled);
  if (enabledPrices.length === 0) return 'Sob consulta';
  
  const min = Math.min(...enabledPrices.map(p => p.price));
  const max = Math.max(...enabledPrices.map(p => p.price));
  
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

/**
 * Retorna os dias da semana formatados
 */
export function formatAllowedDays(days: number[]): string {
  if (days.length === 7) return 'Todos os dias';
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Segunda a Sexta';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Finais de semana';
  
  return days.map(d => WEEKDAY_LABELS[d]).join(', ');
}

/**
 * Retorna horário formatado
 */
export function formatAccessHours(rules: AccessRules): string {
  if (rules.is24Hours) return '24 horas';
  return `${rules.allowedHours.start} às ${rules.allowedHours.end}`;
}

/**
 * Cria um novo plano vazio
 */
export function createEmptyPlan(): Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'stats'> {
  return {
    name: '',
    description: '',
    shortDescription: '',
    status: 'draft',
    category: 'Musculação',
    userTypesAllowed: ['student'],
    chargeType: 'recurring',
    pricing: [
      { cycle: 'monthly', price: 0, discountPercentage: 0, enabled: true },
      { cycle: 'quarterly', price: 0, discountPercentage: 0, enabled: false },
      { cycle: 'semiannual', price: 0, discountPercentage: 0, enabled: false },
      { cycle: 'annual', price: 0, discountPercentage: 0, enabled: false },
    ],
    enrollmentFee: {
      enabled: false,
      value: 0,
      allowDiscount: true,
    },
    features: [],
    accessRules: {
      allowedHours: { start: '06:00', end: '22:00' },
      allowedDays: [1, 2, 3, 4, 5],
      is24Hours: false,
      allowedUnits: [],
      dailyCheckInLimit: 1,
      checkInCooldown: 60,
    },
    contractRules: {
      minimumCommitment: 3,
      earlyTerminationFee: 30,
      cancellationNoticeDays: 30,
      autoRenewal: true,
      contractTemplateId: '',
    },
    onboardingBehavior: {
      userSelectable: true,
      requiresApproval: false,
      requiresImmediatePayment: true,
      immediateAccessAfterCompletion: true,
      trialDays: 0,
      showInPublicCatalog: true,
      catalogOrder: 99,
      isPopular: false,
      isBestValue: false,
    },
  };
}

/**
 * Busca planos por texto
 */
export function searchPlans(query: string): Plan[] {
  const lowerQuery = query.toLowerCase();
  return mockPlans.filter(plan => 
    plan.name.toLowerCase().includes(lowerQuery) ||
    plan.description.toLowerCase().includes(lowerQuery) ||
    plan.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Ordena planos por diferentes critérios
 */
export function sortPlans(plans: Plan[], sortBy: 'name' | 'price' | 'contracts' | 'revenue'): Plan[] {
  const sorted = [...plans];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'price':
      return sorted.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
    case 'contracts':
      return sorted.sort((a, b) => b.stats.activeContracts - a.stats.activeContracts);
    case 'revenue':
      return sorted.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue);
    default:
      return sorted;
  }
}
