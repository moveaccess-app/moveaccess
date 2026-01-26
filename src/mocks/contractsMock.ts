// ============================================
// MÓDULO DE CONTRATOS - MOVEACCESS
// Núcleo de vínculo entre Usuários e Planos
// Base para: Acesso, Financeiro, Histórico, Onboarding
// ============================================

// ============================================
// TIPOS BASE
// ============================================

/**
 * Ciclo de vida do contrato
 * - draft: Rascunho, ainda não formalizado
 * - pending_signature: Aguardando assinatura do cliente
 * - pending_payment: Assinado, aguardando primeiro pagamento
 * - pending_approval: Aguardando aprovação da academia
 * - active: Contrato ativo e vigente
 * - suspended: Suspenso temporariamente (inadimplência, solicitação, etc)
 * - expired: Período de vigência encerrado
 * - cancelled: Cancelado antes do término
 * - terminated: Encerrado por rescisão
 */
export type ContractStatus = 
  | 'draft'
  | 'pending_signature'
  | 'pending_payment'
  | 'pending_approval'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'cancelled'
  | 'terminated';

/**
 * Origem da criação do contrato
 */
export type ContractOrigin = 
  | 'onboarding'        // Criado via fluxo de onboarding
  | 'renewal'           // Renovação de contrato anterior
  | 'upgrade'           // Upgrade de plano
  | 'downgrade'         // Downgrade de plano
  | 'manual'            // Criado manualmente pela academia
  | 'migration';        // Migração de sistema legado

/**
 * Método de assinatura
 */
export type SignatureMethod = 
  | 'digital'           // Assinatura digital (app/web)
  | 'physical'          // Assinatura física (papel)
  | 'electronic'        // Assinatura eletrônica (certificado)
  | 'not_required';     // Não requer assinatura

/**
 * Tipo de evento no histórico do contrato
 */
export type ContractEventType = 
  | 'created'
  | 'sent_for_signature'
  | 'signed'
  | 'payment_received'
  | 'activated'
  | 'suspended'
  | 'resumed'
  | 'renewed'
  | 'cancelled'
  | 'terminated'
  | 'expired'
  | 'modified'
  | 'note_added';

// ============================================
// INTERFACES PRINCIPAIS
// ============================================

/**
 * Snapshot do plano no momento da contratação
 * Evita dependência de alterações futuras no plano original
 */
export interface PlanSnapshot {
  planId: string;
  planName: string;
  planDescription: string;
  category: string;
  
  // Condições congeladas
  billingCycle: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  basePrice: number;
  enrollmentFee: number;
  
  // Regras de acesso congeladas
  accessRules: {
    allowedHours: { start: string; end: string };
    allowedDays: number[];
    is24Hours: boolean;
    dailyCheckInLimit: number;
  };
  
  // Regras contratuais congeladas
  minimumCommitment: number;
  earlyTerminationFee: number;
  cancellationNoticeDays: number;
  autoRenewal: boolean;
  
  // Features inclusos
  features: string[];
}

/**
 * Condições financeiras do contrato
 */
export interface ContractFinancials {
  // Valores
  monthlyValue: number;
  enrollmentFee: number;
  enrollmentFeeDiscount: number;  // Desconto aplicado na matrícula
  enrollmentFeeFinal: number;     // Valor final da matrícula
  
  // Descontos recorrentes
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason: string;
    validUntil?: string;  // Se vazio, vale por toda vigência
  };
  
  // Valor final mensal (após descontos)
  finalMonthlyValue: number;
  
  // Método de pagamento preferencial
  preferredPaymentMethod?: 'credit_card' | 'debit' | 'pix' | 'boleto';
  paymentDayOfMonth: number;  // Dia do vencimento (1-28)
}

/**
 * Informações de assinatura do contrato
 */
export interface ContractSignature {
  required: boolean;
  method: SignatureMethod;
  signedAt?: string;
  signedBy?: string;        // Nome de quem assinou
  signedByUserId?: string;  // ID do usuário que assinou
  ipAddress?: string;       // IP no momento da assinatura
  deviceInfo?: string;      // Informações do dispositivo
  documentHash?: string;    // Hash do documento assinado
}

/**
 * Evento no histórico do contrato
 */
export interface ContractEvent {
  id: string;
  type: ContractEventType;
  timestamp: string;
  description: string;
  performedBy: 'system' | 'user' | 'admin';
  performedByName?: string;
  performedById?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Referências do contrato a outras entidades
 */
export interface ContractReferences {
  // Contratos relacionados
  previousContractId?: string;    // Contrato anterior (renovação/upgrade)
  renewedToContractId?: string;   // Contrato de renovação
  
  // Onboarding
  onboardingSessionId?: string;
  
  // Documentos
  documentIds: string[];
  
  // Cobranças geradas (para integração futura com Financial)
  chargeIds: string[];
}

/**
 * Interface principal do Contrato
 */
export interface Contract {
  id: string;
  number: string;  // Número legível (ex: CTR-2026-00001)
  
  // Vínculos essenciais
  userId: string;
  userName: string;         // Nome do usuário (para exibição rápida)
  userDocument: string;     // CPF do usuário
  unitId: string;
  unitName: string;
  
  // Plano (snapshot)
  planSnapshot: PlanSnapshot;
  
  // Status e ciclo de vida
  status: ContractStatus;
  statusReason?: string;    // Motivo do status atual
  origin: ContractOrigin;
  
  // Vigência
  startDate: string;        // Início da vigência
  endDate: string;          // Fim da vigência
  billingStartDate: string; // Início das cobranças (pode ser diferente se tiver trial)
  trialEndDate?: string;    // Fim do período trial (se houver)
  
  // Financeiro
  financials: ContractFinancials;
  
  // Assinatura
  signature: ContractSignature;
  
  // Histórico de eventos
  events: ContractEvent[];
  
  // Referências
  references: ContractReferences;
  
  // Flags de comportamento
  flags: {
    isCurrentContract: boolean;   // É o contrato vigente do usuário
    hasAccessPermission: boolean; // Libera acesso (considerando status)
    requiresRenewal: boolean;     // Próximo do vencimento
    hasOpenIssues: boolean;       // Tem pendências
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string;
  
  // Notas internas
  internalNotes?: string;
}

// ============================================
// CONSTANTES E LABELS
// ============================================

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Rascunho',
  pending_signature: 'Aguardando Assinatura',
  pending_payment: 'Aguardando Pagamento',
  pending_approval: 'Aguardando Aprovação',
  active: 'Ativo',
  suspended: 'Suspenso',
  expired: 'Vencido',
  cancelled: 'Cancelado',
  terminated: 'Rescindido',
};

export const CONTRACT_STATUS_VARIANT: Record<ContractStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  draft: 'secondary',
  pending_signature: 'warning',
  pending_payment: 'warning',
  pending_approval: 'warning',
  active: 'success',
  suspended: 'destructive',
  expired: 'warning',
  cancelled: 'destructive',
  terminated: 'destructive',
};

export const CONTRACT_ORIGIN_LABELS: Record<ContractOrigin, string> = {
  onboarding: 'Onboarding',
  renewal: 'Renovação',
  upgrade: 'Upgrade',
  downgrade: 'Downgrade',
  manual: 'Criação Manual',
  migration: 'Migração',
};

export const CONTRACT_EVENT_LABELS: Record<ContractEventType, string> = {
  created: 'Contrato criado',
  sent_for_signature: 'Enviado para assinatura',
  signed: 'Contrato assinado',
  payment_received: 'Pagamento recebido',
  activated: 'Contrato ativado',
  suspended: 'Contrato suspenso',
  resumed: 'Contrato reativado',
  renewed: 'Contrato renovado',
  cancelled: 'Contrato cancelado',
  terminated: 'Contrato rescindido',
  expired: 'Contrato vencido',
  modified: 'Contrato modificado',
  note_added: 'Nota adicionada',
};

export const SIGNATURE_METHOD_LABELS: Record<SignatureMethod, string> = {
  digital: 'Digital (App/Web)',
  physical: 'Física (Papel)',
  electronic: 'Eletrônica (Certificado)',
  not_required: 'Não Requerida',
};

// ============================================
// MOCK DE CONTRATOS
// ============================================

export const mockContracts: Contract[] = [
  {
    id: 'ctr-001',
    number: 'CTR-2024-00001',
    userId: '1',
    userName: 'João Silva',
    userDocument: '123.456.789-00',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    
    planSnapshot: {
      planId: 'plan-003',
      planName: 'Premium',
      planDescription: 'Experiência VIP completa',
      category: 'VIP',
      billingCycle: 'monthly',
      basePrice: 249.90,
      enrollmentFee: 0,
      accessRules: {
        allowedHours: { start: '00:00', end: '23:59' },
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        is24Hours: true,
        dailyCheckInLimit: 0,
      },
      minimumCommitment: 12,
      earlyTerminationFee: 20,
      cancellationNoticeDays: 60,
      autoRenewal: true,
      features: ['Acesso 24h', 'Musculação', 'Cardio', 'Aulas em Grupo', 'Personal 2x/mês', 'Spa'],
    },
    
    status: 'active',
    origin: 'onboarding',
    
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    billingStartDate: '2024-01-15',
    
    financials: {
      monthlyValue: 249.90,
      enrollmentFee: 0,
      enrollmentFeeDiscount: 0,
      enrollmentFeeFinal: 0,
      discount: {
        type: 'percentage',
        value: 10,
        reason: 'Fidelidade 12 meses',
        validUntil: '2025-01-15',
      },
      finalMonthlyValue: 224.91,
      preferredPaymentMethod: 'credit_card',
      paymentDayOfMonth: 15,
    },
    
    signature: {
      required: true,
      method: 'digital',
      signedAt: '2024-01-15T10:30:00',
      signedBy: 'João Silva',
      signedByUserId: '1',
      ipAddress: '192.168.1.100',
    },
    
    events: [
      {
        id: 'evt-001',
        type: 'created',
        timestamp: '2024-01-15T10:00:00',
        description: 'Contrato criado via onboarding',
        performedBy: 'system',
      },
      {
        id: 'evt-002',
        type: 'signed',
        timestamp: '2024-01-15T10:30:00',
        description: 'Contrato assinado digitalmente',
        performedBy: 'user',
        performedByName: 'João Silva',
        performedById: '1',
      },
      {
        id: 'evt-003',
        type: 'payment_received',
        timestamp: '2024-01-15T10:35:00',
        description: 'Primeira mensalidade paga via cartão de crédito',
        performedBy: 'system',
      },
      {
        id: 'evt-004',
        type: 'activated',
        timestamp: '2024-01-15T10:35:00',
        description: 'Contrato ativado automaticamente após pagamento',
        performedBy: 'system',
      },
    ],
    
    references: {
      onboardingSessionId: 'onb-001',
      documentIds: ['doc-001'],
      chargeIds: ['chg-001', 'chg-002', 'chg-003'],
    },
    
    flags: {
      isCurrentContract: true,
      hasAccessPermission: true,
      requiresRenewal: true,  // Próximo do vencimento
      hasOpenIssues: false,
    },
    
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2024-12-15T08:00:00',
    createdBy: 'system',
  },
  {
    id: 'ctr-002',
    number: 'CTR-2024-00002',
    userId: '2',
    userName: 'Maria Santos',
    userDocument: '987.654.321-00',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    
    planSnapshot: {
      planId: 'plan-002',
      planName: 'Padrão',
      planDescription: 'Acesso completo + aulas',
      category: 'Completo',
      billingCycle: 'quarterly',
      basePrice: 119.90,
      enrollmentFee: 149.90,
      accessRules: {
        allowedHours: { start: '06:00', end: '23:00' },
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        is24Hours: false,
        dailyCheckInLimit: 2,
      },
      minimumCommitment: 6,
      earlyTerminationFee: 25,
      cancellationNoticeDays: 30,
      autoRenewal: true,
      features: ['Musculação', 'Cardio', 'Aulas em Grupo', 'Armário'],
    },
    
    status: 'active',
    origin: 'onboarding',
    
    startDate: '2024-02-20',
    endDate: '2025-02-20',
    billingStartDate: '2024-02-27',
    trialEndDate: '2024-02-27',
    
    financials: {
      monthlyValue: 119.90,
      enrollmentFee: 149.90,
      enrollmentFeeDiscount: 50,
      enrollmentFeeFinal: 99.90,
      finalMonthlyValue: 119.90,
      preferredPaymentMethod: 'pix',
      paymentDayOfMonth: 20,
    },
    
    signature: {
      required: true,
      method: 'digital',
      signedAt: '2024-02-20T09:15:00',
      signedBy: 'Maria Santos',
      signedByUserId: '2',
    },
    
    events: [
      {
        id: 'evt-005',
        type: 'created',
        timestamp: '2024-02-20T09:00:00',
        description: 'Contrato criado via onboarding',
        performedBy: 'system',
      },
      {
        id: 'evt-006',
        type: 'signed',
        timestamp: '2024-02-20T09:15:00',
        description: 'Contrato assinado digitalmente',
        performedBy: 'user',
        performedByName: 'Maria Santos',
        performedById: '2',
      },
      {
        id: 'evt-007',
        type: 'activated',
        timestamp: '2024-02-20T09:20:00',
        description: 'Contrato ativado - período trial iniciado',
        performedBy: 'system',
      },
    ],
    
    references: {
      onboardingSessionId: 'onb-002',
      documentIds: ['doc-003'],
      chargeIds: ['chg-004', 'chg-005'],
    },
    
    flags: {
      isCurrentContract: true,
      hasAccessPermission: true,
      requiresRenewal: false,
      hasOpenIssues: false,
    },
    
    createdAt: '2024-02-20T09:00:00',
    updatedAt: '2024-11-20T10:00:00',
    createdBy: 'system',
  },
  {
    id: 'ctr-003',
    number: 'CTR-2024-00003',
    userId: '3',
    userName: 'Pedro Oliveira',
    userDocument: '456.789.123-00',
    unitId: 'unit-2',
    unitName: 'Academia Norte',
    
    planSnapshot: {
      planId: 'plan-001',
      planName: 'Básico',
      planDescription: 'Acesso básico à academia',
      category: 'Musculação',
      billingCycle: 'monthly',
      basePrice: 89.90,
      enrollmentFee: 99.90,
      accessRules: {
        allowedHours: { start: '06:00', end: '22:00' },
        allowedDays: [1, 2, 3, 4, 5],
        is24Hours: false,
        dailyCheckInLimit: 1,
      },
      minimumCommitment: 3,
      earlyTerminationFee: 30,
      cancellationNoticeDays: 30,
      autoRenewal: true,
      features: ['Musculação', 'Cardio', 'Vestiários'],
    },
    
    status: 'pending_payment',
    statusReason: 'Aguardando primeiro pagamento',
    origin: 'onboarding',
    
    startDate: '2026-01-10',
    endDate: '2026-04-10',
    billingStartDate: '2026-01-10',
    
    financials: {
      monthlyValue: 89.90,
      enrollmentFee: 99.90,
      enrollmentFeeDiscount: 0,
      enrollmentFeeFinal: 99.90,
      finalMonthlyValue: 89.90,
      preferredPaymentMethod: 'boleto',
      paymentDayOfMonth: 10,
    },
    
    signature: {
      required: true,
      method: 'digital',
      signedAt: '2026-01-10T14:25:00',
      signedBy: 'Pedro Oliveira',
      signedByUserId: '3',
    },
    
    events: [
      {
        id: 'evt-008',
        type: 'created',
        timestamp: '2026-01-10T14:00:00',
        description: 'Contrato criado via onboarding',
        performedBy: 'system',
      },
      {
        id: 'evt-009',
        type: 'signed',
        timestamp: '2026-01-10T14:25:00',
        description: 'Contrato assinado digitalmente',
        performedBy: 'user',
        performedByName: 'Pedro Oliveira',
        performedById: '3',
      },
    ],
    
    references: {
      onboardingSessionId: 'onb-003',
      documentIds: [],
      chargeIds: [],
    },
    
    flags: {
      isCurrentContract: true,
      hasAccessPermission: false,  // Sem acesso até pagar
      requiresRenewal: false,
      hasOpenIssues: true,
    },
    
    createdAt: '2026-01-10T14:00:00',
    updatedAt: '2026-01-10T14:25:00',
    createdBy: 'system',
  },
  {
    id: 'ctr-004',
    number: 'CTR-2024-00004',
    userId: '4',
    userName: 'Ana Costa',
    userDocument: '321.654.987-00',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    
    planSnapshot: {
      planId: 'plan-002',
      planName: 'Padrão',
      planDescription: 'Acesso completo + aulas',
      category: 'Completo',
      billingCycle: 'monthly',
      basePrice: 129.90,
      enrollmentFee: 149.90,
      accessRules: {
        allowedHours: { start: '06:00', end: '23:00' },
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        is24Hours: false,
        dailyCheckInLimit: 2,
      },
      minimumCommitment: 6,
      earlyTerminationFee: 25,
      cancellationNoticeDays: 30,
      autoRenewal: true,
      features: ['Musculação', 'Cardio', 'Aulas em Grupo', 'Armário'],
    },
    
    status: 'suspended',
    statusReason: 'Inadimplência há mais de 30 dias',
    origin: 'onboarding',
    
    startDate: '2024-03-01',
    endDate: '2025-03-01',
    billingStartDate: '2024-03-01',
    
    financials: {
      monthlyValue: 129.90,
      enrollmentFee: 149.90,
      enrollmentFeeDiscount: 0,
      enrollmentFeeFinal: 149.90,
      finalMonthlyValue: 129.90,
      preferredPaymentMethod: 'credit_card',
      paymentDayOfMonth: 1,
    },
    
    signature: {
      required: true,
      method: 'digital',
      signedAt: '2024-03-01T11:00:00',
      signedBy: 'Ana Costa',
      signedByUserId: '4',
    },
    
    events: [
      {
        id: 'evt-010',
        type: 'created',
        timestamp: '2024-03-01T10:00:00',
        description: 'Contrato criado via onboarding',
        performedBy: 'system',
      },
      {
        id: 'evt-011',
        type: 'activated',
        timestamp: '2024-03-01T11:00:00',
        description: 'Contrato ativado',
        performedBy: 'system',
      },
      {
        id: 'evt-012',
        type: 'suspended',
        timestamp: '2025-11-15T08:00:00',
        description: 'Contrato suspenso por inadimplência',
        performedBy: 'system',
        metadata: { daysOverdue: 45 },
      },
    ],
    
    references: {
      documentIds: ['doc-005'],
      chargeIds: ['chg-010', 'chg-011', 'chg-012'],
    },
    
    flags: {
      isCurrentContract: true,
      hasAccessPermission: false,
      requiresRenewal: false,
      hasOpenIssues: true,
    },
    
    createdAt: '2024-03-01T10:00:00',
    updatedAt: '2025-11-15T08:00:00',
    createdBy: 'system',
  },
  {
    id: 'ctr-005',
    number: 'CTR-2023-00050',
    userId: '5',
    userName: 'Carlos Ferreira',
    userDocument: '789.123.456-00',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    
    planSnapshot: {
      planId: 'plan-001',
      planName: 'Básico',
      planDescription: 'Acesso básico à academia',
      category: 'Musculação',
      billingCycle: 'annual',
      basePrice: 59.90,
      enrollmentFee: 99.90,
      accessRules: {
        allowedHours: { start: '06:00', end: '22:00' },
        allowedDays: [1, 2, 3, 4, 5],
        is24Hours: false,
        dailyCheckInLimit: 1,
      },
      minimumCommitment: 12,
      earlyTerminationFee: 30,
      cancellationNoticeDays: 30,
      autoRenewal: false,
      features: ['Musculação', 'Cardio', 'Vestiários'],
    },
    
    status: 'expired',
    statusReason: 'Período de vigência encerrado',
    origin: 'manual',
    
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    billingStartDate: '2023-06-01',
    
    financials: {
      monthlyValue: 59.90,
      enrollmentFee: 99.90,
      enrollmentFeeDiscount: 99.90,
      enrollmentFeeFinal: 0,
      finalMonthlyValue: 59.90,
      preferredPaymentMethod: 'boleto',
      paymentDayOfMonth: 1,
    },
    
    signature: {
      required: true,
      method: 'physical',
      signedAt: '2023-06-01T10:00:00',
      signedBy: 'Carlos Ferreira',
    },
    
    events: [
      {
        id: 'evt-013',
        type: 'created',
        timestamp: '2023-06-01T09:00:00',
        description: 'Contrato criado manualmente',
        performedBy: 'admin',
        performedByName: 'Admin',
      },
      {
        id: 'evt-014',
        type: 'signed',
        timestamp: '2023-06-01T10:00:00',
        description: 'Contrato assinado em papel',
        performedBy: 'user',
        performedByName: 'Carlos Ferreira',
      },
      {
        id: 'evt-015',
        type: 'activated',
        timestamp: '2023-06-01T10:00:00',
        description: 'Contrato ativado',
        performedBy: 'admin',
        performedByName: 'Admin',
      },
      {
        id: 'evt-016',
        type: 'expired',
        timestamp: '2024-06-01T00:00:00',
        description: 'Contrato expirado automaticamente',
        performedBy: 'system',
      },
    ],
    
    references: {
      documentIds: ['doc-010'],
      chargeIds: ['chg-020', 'chg-021'],
    },
    
    flags: {
      isCurrentContract: false,
      hasAccessPermission: false,
      requiresRenewal: false,
      hasOpenIssues: false,
    },
    
    createdAt: '2023-06-01T09:00:00',
    updatedAt: '2024-06-01T00:00:00',
    createdBy: 'admin',
    createdByName: 'Admin',
  },
  {
    id: 'ctr-006',
    number: 'CTR-2026-00001',
    userId: '6',
    userName: 'Fernanda Lima',
    userDocument: '654.321.987-00',
    unitId: 'unit-2',
    unitName: 'Academia Norte',
    
    planSnapshot: {
      planId: 'plan-004',
      planName: 'Personal Trainer',
      planDescription: 'Para profissionais',
      category: 'Personal',
      billingCycle: 'monthly',
      basePrice: 199.90,
      enrollmentFee: 299.90,
      accessRules: {
        allowedHours: { start: '00:00', end: '23:59' },
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        is24Hours: true,
        dailyCheckInLimit: 0,
      },
      minimumCommitment: 3,
      earlyTerminationFee: 50,
      cancellationNoticeDays: 30,
      autoRenewal: false,
      features: ['Acesso 24h', 'Musculação', 'Cardio', 'Armário', 'App Gestão'],
    },
    
    status: 'pending_approval',
    statusReason: 'Aguardando validação de CREF',
    origin: 'onboarding',
    
    startDate: '2026-01-15',
    endDate: '2026-04-15',
    billingStartDate: '2026-01-15',
    
    financials: {
      monthlyValue: 199.90,
      enrollmentFee: 299.90,
      enrollmentFeeDiscount: 0,
      enrollmentFeeFinal: 299.90,
      finalMonthlyValue: 199.90,
      preferredPaymentMethod: 'credit_card',
      paymentDayOfMonth: 15,
    },
    
    signature: {
      required: true,
      method: 'digital',
      signedAt: '2026-01-08T16:00:00',
      signedBy: 'Fernanda Lima',
      signedByUserId: '6',
    },
    
    events: [
      {
        id: 'evt-017',
        type: 'created',
        timestamp: '2026-01-08T15:00:00',
        description: 'Contrato criado via onboarding',
        performedBy: 'system',
      },
      {
        id: 'evt-018',
        type: 'signed',
        timestamp: '2026-01-08T16:00:00',
        description: 'Contrato assinado digitalmente',
        performedBy: 'user',
        performedByName: 'Fernanda Lima',
        performedById: '6',
      },
      {
        id: 'evt-019',
        type: 'note_added',
        timestamp: '2026-01-08T16:05:00',
        description: 'Aguardando validação do registro CREF',
        performedBy: 'admin',
        performedByName: 'Recepção',
      },
    ],
    
    references: {
      onboardingSessionId: 'onb-006',
      documentIds: [],
      chargeIds: [],
    },
    
    flags: {
      isCurrentContract: true,
      hasAccessPermission: false,
      requiresRenewal: false,
      hasOpenIssues: true,
    },
    
    createdAt: '2026-01-08T15:00:00',
    updatedAt: '2026-01-08T16:05:00',
    createdBy: 'system',
    internalNotes: 'Personal trainer - aguardando comprovante CREF para liberar acesso.',
  },
  {
    id: 'ctr-007',
    number: 'CTR-2025-00100',
    userId: '1',
    userName: 'João Silva',
    userDocument: '123.456.789-00',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    
    planSnapshot: {
      planId: 'plan-002',
      planName: 'Padrão',
      planDescription: 'Acesso completo + aulas',
      category: 'Completo',
      billingCycle: 'monthly',
      basePrice: 129.90,
      enrollmentFee: 0,
      accessRules: {
        allowedHours: { start: '06:00', end: '23:00' },
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        is24Hours: false,
        dailyCheckInLimit: 2,
      },
      minimumCommitment: 6,
      earlyTerminationFee: 25,
      cancellationNoticeDays: 30,
      autoRenewal: true,
      features: ['Musculação', 'Cardio', 'Aulas em Grupo', 'Armário'],
    },
    
    status: 'cancelled',
    statusReason: 'Upgrade para plano Premium',
    origin: 'manual',
    
    startDate: '2023-01-15',
    endDate: '2024-01-15',
    billingStartDate: '2023-01-15',
    
    financials: {
      monthlyValue: 129.90,
      enrollmentFee: 0,
      enrollmentFeeDiscount: 0,
      enrollmentFeeFinal: 0,
      finalMonthlyValue: 129.90,
      preferredPaymentMethod: 'credit_card',
      paymentDayOfMonth: 15,
    },
    
    signature: {
      required: true,
      method: 'physical',
      signedAt: '2023-01-15T10:00:00',
      signedBy: 'João Silva',
    },
    
    events: [
      {
        id: 'evt-020',
        type: 'created',
        timestamp: '2023-01-15T09:00:00',
        description: 'Contrato criado',
        performedBy: 'admin',
        performedByName: 'Admin',
      },
      {
        id: 'evt-021',
        type: 'activated',
        timestamp: '2023-01-15T10:00:00',
        description: 'Contrato ativado',
        performedBy: 'admin',
      },
      {
        id: 'evt-022',
        type: 'cancelled',
        timestamp: '2024-01-15T09:00:00',
        description: 'Cancelado para upgrade para plano Premium',
        performedBy: 'admin',
        performedByName: 'Admin',
        metadata: { newContractId: 'ctr-001' },
      },
    ],
    
    references: {
      renewedToContractId: 'ctr-001',
      documentIds: ['doc-old-001'],
      chargeIds: ['chg-old-001', 'chg-old-002'],
    },
    
    flags: {
      isCurrentContract: false,
      hasAccessPermission: false,
      requiresRenewal: false,
      hasOpenIssues: false,
    },
    
    createdAt: '2023-01-15T09:00:00',
    updatedAt: '2024-01-15T09:00:00',
    createdBy: 'admin',
    createdByName: 'Admin',
  },
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Busca contrato por ID
 */
export function getContractById(id: string): Contract | undefined {
  return mockContracts.find(c => c.id === id);
}

/**
 * Busca contratos por ID do usuário
 */
export function getContractsByUserId(userId: string): Contract[] {
  return mockContracts.filter(c => c.userId === userId);
}

/**
 * Busca contrato vigente de um usuário
 */
export function getCurrentContractByUserId(userId: string): Contract | undefined {
  return mockContracts.find(c => c.userId === userId && c.flags.isCurrentContract);
}

/**
 * Filtra contratos por status
 */
export function filterContractsByStatus(status: ContractStatus): Contract[] {
  return mockContracts.filter(c => c.status === status);
}

/**
 * Filtra contratos por múltiplos status
 */
export function filterContractsByStatuses(statuses: ContractStatus[]): Contract[] {
  return mockContracts.filter(c => statuses.includes(c.status));
}

/**
 * Busca contratos que precisam de renovação
 */
export function getContractsRequiringRenewal(): Contract[] {
  return mockContracts.filter(c => c.flags.requiresRenewal && c.status === 'active');
}

/**
 * Busca contratos com pendências
 */
export function getContractsWithIssues(): Contract[] {
  return mockContracts.filter(c => c.flags.hasOpenIssues);
}

/**
 * Busca contratos por texto
 */
export function searchContracts(query: string): Contract[] {
  const lowerQuery = query.toLowerCase();
  return mockContracts.filter(c => 
    c.number.toLowerCase().includes(lowerQuery) ||
    c.userName.toLowerCase().includes(lowerQuery) ||
    c.userDocument.includes(query) ||
    c.planSnapshot.planName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Formata valor para exibição
 */
export function formatContractValue(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Calcula dias restantes de vigência
 */
export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se contrato está próximo do vencimento (30 dias)
 */
export function isNearExpiration(endDate: string, daysThreshold = 30): boolean {
  const remaining = getDaysRemaining(endDate);
  return remaining > 0 && remaining <= daysThreshold;
}

/**
 * Gera número de contrato
 */
export function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const sequence = mockContracts.length + 1;
  return `CTR-${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Cria evento de histórico
 */
export function createContractEvent(
  type: ContractEventType,
  description: string,
  performedBy: 'system' | 'user' | 'admin',
  performedByName?: string,
  performedById?: string,
  metadata?: Record<string, unknown>
): ContractEvent {
  return {
    id: `evt-${Date.now()}`,
    type,
    timestamp: new Date().toISOString(),
    description,
    performedBy,
    performedByName,
    performedById,
    metadata,
  };
}

/**
 * Estatísticas gerais de contratos
 */
export function getContractStats() {
  const total = mockContracts.length;
  const active = mockContracts.filter(c => c.status === 'active').length;
  const pending = mockContracts.filter(c => 
    ['pending_signature', 'pending_payment', 'pending_approval'].includes(c.status)
  ).length;
  const suspended = mockContracts.filter(c => c.status === 'suspended').length;
  const expired = mockContracts.filter(c => c.status === 'expired').length;
  const cancelled = mockContracts.filter(c => 
    ['cancelled', 'terminated'].includes(c.status)
  ).length;
  const requiresRenewal = mockContracts.filter(c => c.flags.requiresRenewal).length;
  const withIssues = mockContracts.filter(c => c.flags.hasOpenIssues).length;
  
  const totalMonthlyRevenue = mockContracts
    .filter(c => c.status === 'active')
    .reduce((acc, c) => acc + c.financials.finalMonthlyValue, 0);

  return {
    total,
    active,
    pending,
    suspended,
    expired,
    cancelled,
    requiresRenewal,
    withIssues,
    totalMonthlyRevenue,
  };
}

/**
 * Ordena contratos
 */
export function sortContracts(
  contracts: Contract[], 
  sortBy: 'date' | 'name' | 'status' | 'value' | 'endDate'
): Contract[] {
  const sorted = [...contracts];
  
  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'name':
      return sorted.sort((a, b) => a.userName.localeCompare(b.userName));
    case 'status':
      return sorted.sort((a, b) => a.status.localeCompare(b.status));
    case 'value':
      return sorted.sort((a, b) => 
        b.financials.finalMonthlyValue - a.financials.finalMonthlyValue
      );
    case 'endDate':
      return sorted.sort((a, b) => 
        new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      );
    default:
      return sorted;
  }
}
