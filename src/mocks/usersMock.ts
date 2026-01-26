// ============================================
// TIPOS BASE
// ============================================

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'blocked';
export type ContractStatus = 'active' | 'expired' | 'pending' | 'cancelled';
export type UserType = 'student' | 'personal' | 'guest' | 'employee';
export type RegistrationOrigin = 'academy' | 'app' | 'website' | 'migration';
export type StatusChangeSource = 'manual' | 'system' | 'automation';
export type AccessMethod = 'qr_code' | 'biometry' | 'card' | 'manual';
export type DigitalCardStatus = 'generated' | 'pending' | 'revoked';
export type BillingType = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'single';
export type PaymentMethod = 'credit_card' | 'debit' | 'pix' | 'boleto' | 'cash';
export type FinancialStatus = 'up_to_date' | 'overdue' | 'partial';
export type DocumentStatus = 'ok' | 'pending' | 'expired';

// ============================================
// INTERFACES
// ============================================

export interface StatusHistory {
  status: UserStatus;
  reason: string;
  changedAt: string;
  changedBy: StatusChangeSource;
  changedByName?: string;
}

export interface AccessLog {
  id: string;
  checkInAt: string;
  method: AccessMethod;
  location: string;
}

export interface AccessInfo {
  isAllowed: boolean;
  lastCheckIn: AccessLog | null;
  checkInsLast7Days: number;
  checkInsLast30Days: number;
  digitalCard: {
    status: DigitalCardStatus;
    generatedAt?: string;
    expiresAt?: string;
  };
}

export interface PlanInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  billingType: BillingType;
  autoRenewal: boolean;
  nextDueDate: string;
  currentValue: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason: string;
    validUntil?: string;
  };
}

export interface Contract {
  id: string;
  number: string;
  status: ContractStatus;
  signedAt: string;
  startDate: string;
  endDate: string;
  planName: string;
  value: number;
  documentUrl?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  value: number;
  method: PaymentMethod;
  description: string;
}

export interface FinancialInfo {
  status: FinancialStatus;
  daysOverdue: number;
  lastPayment: PaymentRecord | null;
  pendingBalance: number;
  nextDueDate: string;
  nextDueValue: number;
}

export interface UserDocument {
  id: string;
  type: 'contract' | 'identity' | 'proof_of_residence' | 'medical' | 'payment_proof' | 'other';
  name: string;
  status: DocumentStatus;
  uploadedAt: string;
  url?: string;
}

export interface User {
  id: string;
  
  // A) Identidade e vínculo
  registrationId: string; // Matrícula
  fullName: string;
  email: string;
  phone: string;
  document: string; // CPF
  userType: UserType;
  unitId: string;
  unitName: string;
  registrationOrigin: RegistrationOrigin;
  createdAt: string;
  
  // B) Status (completo)
  status: UserStatus;
  statusReason?: string;
  statusSince: string;
  statusHistory: StatusHistory[];
  
  // C) Acesso (módulo Access)
  access: AccessInfo;
  
  // D) Assinatura / Planos
  currentPlan: PlanInfo | null;
  
  // E) Contratos (1:N)
  contracts: Contract[];
  currentContractId?: string; // ID do contrato vigente
  
  // F) Financeiro
  financial: FinancialInfo;
  
  // G) Documentos
  documents: UserDocument[];
}

// ============================================
// DADOS MOCK
// ============================================

export const mockUsers: User[] = [
  {
    id: '1',
    registrationId: 'ALU-2024-0001',
    fullName: 'João Silva',
    email: 'joao.silva@exemplo.com.br',
    phone: '(11) 98765-4321',
    document: '123.456.789-00',
    userType: 'student',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    registrationOrigin: 'academy',
    createdAt: '2024-01-15',
    
    status: 'active',
    statusReason: undefined,
    statusSince: '2024-01-15',
    statusHistory: [
      {
        status: 'pending',
        reason: 'Cadastro inicial',
        changedAt: '2024-01-15T10:00:00',
        changedBy: 'system',
      },
      {
        status: 'active',
        reason: 'Primeiro pagamento confirmado',
        changedAt: '2024-01-15T14:30:00',
        changedBy: 'system',
      },
    ],
    
    access: {
      isAllowed: true,
      lastCheckIn: {
        id: 'acc-001',
        checkInAt: '2025-01-06T08:30:00',
        method: 'qr_code',
        location: 'Entrada Principal',
      },
      checkInsLast7Days: 5,
      checkInsLast30Days: 18,
      digitalCard: {
        status: 'generated',
        generatedAt: '2024-01-15',
        expiresAt: '2025-01-15',
      },
    },
    
    currentPlan: {
      id: 'plan-1',
      name: 'Plano Premium',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      billingType: 'monthly',
      autoRenewal: true,
      nextDueDate: '2025-01-15',
      currentValue: 199.90,
      discount: {
        type: 'percentage',
        value: 10,
        reason: 'Fidelidade 12 meses',
        validUntil: '2025-01-15',
      },
    },
    
    contracts: [
      {
        id: 'ctr-001',
        number: 'CTR-2024-001',
        status: 'active',
        signedAt: '2024-01-15',
        startDate: '2024-01-15',
        endDate: '2025-01-15',
        planName: 'Plano Premium',
        value: 199.90,
        documentUrl: '/docs/contracts/CTR-2024-001.pdf',
      },
    ],
    currentContractId: 'ctr-001',
    
    financial: {
      status: 'up_to_date',
      daysOverdue: 0,
      lastPayment: {
        id: 'pay-001',
        date: '2024-12-15',
        value: 179.91,
        method: 'credit_card',
        description: 'Mensalidade Dezembro/2024',
      },
      pendingBalance: 0,
      nextDueDate: '2025-01-15',
      nextDueValue: 179.91,
    },
    
    documents: [
      {
        id: 'doc-001',
        type: 'contract',
        name: 'Contrato de Adesão CTR-2024-001',
        status: 'ok',
        uploadedAt: '2024-01-15',
        url: '/docs/contracts/CTR-2024-001.pdf',
      },
      {
        id: 'doc-002',
        type: 'identity',
        name: 'RG / CNH',
        status: 'ok',
        uploadedAt: '2024-01-15',
      },
    ],
  },
  {
    id: '2',
    registrationId: 'ALU-2024-0002',
    fullName: 'Maria Santos',
    email: 'maria.santos@exemplo.com.br',
    phone: '(11) 97654-3210',
    document: '987.654.321-00',
    userType: 'student',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    registrationOrigin: 'app',
    createdAt: '2024-02-20',
    
    status: 'active',
    statusReason: undefined,
    statusSince: '2024-02-20',
    statusHistory: [
      {
        status: 'pending',
        reason: 'Cadastro via app',
        changedAt: '2024-02-20T09:00:00',
        changedBy: 'system',
      },
      {
        status: 'active',
        reason: 'Documentação aprovada',
        changedAt: '2024-02-20T11:00:00',
        changedBy: 'manual',
        changedByName: 'Admin',
      },
    ],
    
    access: {
      isAllowed: true,
      lastCheckIn: {
        id: 'acc-002',
        checkInAt: '2025-01-05T17:45:00',
        method: 'biometry',
        location: 'Entrada Principal',
      },
      checkInsLast7Days: 4,
      checkInsLast30Days: 15,
      digitalCard: {
        status: 'generated',
        generatedAt: '2024-02-20',
        expiresAt: '2025-02-20',
      },
    },
    
    currentPlan: {
      id: 'plan-2',
      name: 'Plano Básico',
      startDate: '2024-02-20',
      endDate: '2025-02-20',
      billingType: 'monthly',
      autoRenewal: true,
      nextDueDate: '2025-01-20',
      currentValue: 99.90,
    },
    
    contracts: [
      {
        id: 'ctr-002',
        number: 'CTR-2024-002',
        status: 'active',
        signedAt: '2024-02-20',
        startDate: '2024-02-20',
        endDate: '2025-02-20',
        planName: 'Plano Básico',
        value: 99.90,
      },
    ],
    currentContractId: 'ctr-002',
    
    financial: {
      status: 'up_to_date',
      daysOverdue: 0,
      lastPayment: {
        id: 'pay-002',
        date: '2024-12-20',
        value: 99.90,
        method: 'pix',
        description: 'Mensalidade Dezembro/2024',
      },
      pendingBalance: 0,
      nextDueDate: '2025-01-20',
      nextDueValue: 99.90,
    },
    
    documents: [
      {
        id: 'doc-003',
        type: 'contract',
        name: 'Contrato de Adesão CTR-2024-002',
        status: 'ok',
        uploadedAt: '2024-02-20',
      },
      {
        id: 'doc-004',
        type: 'identity',
        name: 'RG / CNH',
        status: 'ok',
        uploadedAt: '2024-02-20',
      },
    ],
  },
  {
    id: '3',
    registrationId: 'ALU-2024-0003',
    fullName: 'Pedro Oliveira',
    email: 'pedro.oliveira@exemplo.com.br',
    phone: '(11) 96543-2109',
    document: '456.789.123-00',
    userType: 'student',
    unitId: 'unit-2',
    unitName: 'Academia Norte',
    registrationOrigin: 'website',
    createdAt: '2024-03-10',
    
    status: 'pending',
    statusReason: 'Aguardando confirmação de pagamento',
    statusSince: '2024-03-10',
    statusHistory: [
      {
        status: 'pending',
        reason: 'Cadastro via website',
        changedAt: '2024-03-10T14:00:00',
        changedBy: 'system',
      },
    ],
    
    access: {
      isAllowed: false,
      lastCheckIn: null,
      checkInsLast7Days: 0,
      checkInsLast30Days: 0,
      digitalCard: {
        status: 'pending',
      },
    },
    
    currentPlan: null,
    
    contracts: [
      {
        id: 'ctr-003',
        number: 'CTR-2024-003',
        status: 'pending',
        signedAt: '2024-03-10',
        startDate: '2024-03-10',
        endDate: '2025-03-10',
        planName: 'Plano Básico',
        value: 99.90,
      },
    ],
    currentContractId: 'ctr-003',
    
    financial: {
      status: 'overdue',
      daysOverdue: 302,
      lastPayment: null,
      pendingBalance: 99.90,
      nextDueDate: '2024-03-10',
      nextDueValue: 99.90,
    },
    
    documents: [
      {
        id: 'doc-005',
        type: 'contract',
        name: 'Contrato de Adesão CTR-2024-003',
        status: 'pending',
        uploadedAt: '2024-03-10',
      },
      {
        id: 'doc-006',
        type: 'identity',
        name: 'RG / CNH',
        status: 'pending',
        uploadedAt: '2024-03-10',
      },
    ],
  },
  {
    id: '4',
    registrationId: 'ALU-2023-0045',
    fullName: 'Ana Costa',
    email: 'ana.costa@exemplo.com.br',
    phone: '(11) 95432-1098',
    document: '321.654.987-00',
    userType: 'student',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    registrationOrigin: 'academy',
    createdAt: '2023-11-05',
    
    status: 'inactive',
    statusReason: 'Fim do plano - não renovou',
    statusSince: '2024-11-05',
    statusHistory: [
      {
        status: 'pending',
        reason: 'Cadastro inicial',
        changedAt: '2023-11-05T10:00:00',
        changedBy: 'system',
      },
      {
        status: 'active',
        reason: 'Primeiro pagamento confirmado',
        changedAt: '2023-11-05T12:00:00',
        changedBy: 'system',
      },
      {
        status: 'inactive',
        reason: 'Fim do plano - não renovou',
        changedAt: '2024-11-05T00:00:00',
        changedBy: 'automation',
      },
    ],
    
    access: {
      isAllowed: false,
      lastCheckIn: {
        id: 'acc-003',
        checkInAt: '2024-11-04T19:30:00',
        method: 'card',
        location: 'Entrada Principal',
      },
      checkInsLast7Days: 0,
      checkInsLast30Days: 0,
      digitalCard: {
        status: 'revoked',
        generatedAt: '2023-11-05',
        expiresAt: '2024-11-05',
      },
    },
    
    currentPlan: {
      id: 'plan-1',
      name: 'Plano Premium',
      startDate: '2023-11-05',
      endDate: '2024-11-05',
      billingType: 'annual',
      autoRenewal: false,
      nextDueDate: '2024-11-05',
      currentValue: 1999.00,
    },
    
    contracts: [
      {
        id: 'ctr-004',
        number: 'CTR-2023-045',
        status: 'expired',
        signedAt: '2023-11-05',
        startDate: '2023-11-05',
        endDate: '2024-11-05',
        planName: 'Plano Premium',
        value: 1999.00,
      },
    ],
    currentContractId: undefined,
    
    financial: {
      status: 'up_to_date',
      daysOverdue: 0,
      lastPayment: {
        id: 'pay-003',
        date: '2023-11-05',
        value: 1999.00,
        method: 'credit_card',
        description: 'Plano Anual Premium 2023/2024',
      },
      pendingBalance: 0,
      nextDueDate: '-',
      nextDueValue: 0,
    },
    
    documents: [
      {
        id: 'doc-007',
        type: 'contract',
        name: 'Contrato de Adesão CTR-2023-045',
        status: 'expired',
        uploadedAt: '2023-11-05',
      },
      {
        id: 'doc-008',
        type: 'identity',
        name: 'RG / CNH',
        status: 'ok',
        uploadedAt: '2023-11-05',
      },
      {
        id: 'doc-009',
        type: 'payment_proof',
        name: 'Comprovante Pagamento Anual',
        status: 'ok',
        uploadedAt: '2023-11-05',
      },
    ],
  },
  {
    id: '5',
    registrationId: 'ALU-2024-0004',
    fullName: 'Carlos Mendes',
    email: 'carlos.mendes@exemplo.com.br',
    phone: '(11) 94321-0987',
    document: '789.123.456-00',
    userType: 'student',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    registrationOrigin: 'academy',
    createdAt: '2024-01-25',
    
    status: 'suspended',
    statusReason: 'Inadimplência - 3 mensalidades em atraso',
    statusSince: '2024-10-01',
    statusHistory: [
      {
        status: 'pending',
        reason: 'Cadastro inicial',
        changedAt: '2024-01-25T09:00:00',
        changedBy: 'system',
      },
      {
        status: 'active',
        reason: 'Primeiro pagamento confirmado',
        changedAt: '2024-01-25T10:30:00',
        changedBy: 'system',
      },
      {
        status: 'suspended',
        reason: 'Inadimplência - 3 mensalidades em atraso',
        changedAt: '2024-10-01T00:00:00',
        changedBy: 'automation',
      },
    ],
    
    access: {
      isAllowed: false,
      lastCheckIn: {
        id: 'acc-004',
        checkInAt: '2024-09-30T20:15:00',
        method: 'qr_code',
        location: 'Entrada Principal',
      },
      checkInsLast7Days: 0,
      checkInsLast30Days: 0,
      digitalCard: {
        status: 'revoked',
        generatedAt: '2024-01-25',
        expiresAt: '2025-01-25',
      },
    },
    
    currentPlan: {
      id: 'plan-2',
      name: 'Plano Básico',
      startDate: '2024-01-25',
      endDate: '2025-01-25',
      billingType: 'monthly',
      autoRenewal: true,
      nextDueDate: '2024-07-25',
      currentValue: 99.90,
    },
    
    contracts: [
      {
        id: 'ctr-005',
        number: 'CTR-2024-004',
        status: 'active',
        signedAt: '2024-01-25',
        startDate: '2024-01-25',
        endDate: '2025-01-25',
        planName: 'Plano Básico',
        value: 99.90,
      },
    ],
    currentContractId: 'ctr-005',
    
    financial: {
      status: 'overdue',
      daysOverdue: 165,
      lastPayment: {
        id: 'pay-004',
        date: '2024-06-25',
        value: 99.90,
        method: 'boleto',
        description: 'Mensalidade Junho/2024',
      },
      pendingBalance: 599.40,
      nextDueDate: '2024-07-25',
      nextDueValue: 99.90,
    },
    
    documents: [
      {
        id: 'doc-010',
        type: 'contract',
        name: 'Contrato de Adesão CTR-2024-004',
        status: 'ok',
        uploadedAt: '2024-01-25',
      },
      {
        id: 'doc-011',
        type: 'identity',
        name: 'RG / CNH',
        status: 'ok',
        uploadedAt: '2024-01-25',
      },
    ],
  },
  {
    id: '6',
    registrationId: 'PER-2024-0001',
    fullName: 'Roberto Fitness',
    email: 'roberto.fitness@exemplo.com.br',
    phone: '(11) 99876-5432',
    document: '111.222.333-44',
    userType: 'personal',
    unitId: 'unit-1',
    unitName: 'Academia Central',
    registrationOrigin: 'academy',
    createdAt: '2024-01-10',
    
    status: 'active',
    statusReason: undefined,
    statusSince: '2024-01-10',
    statusHistory: [
      {
        status: 'active',
        reason: 'Cadastro de Personal Trainer',
        changedAt: '2024-01-10T08:00:00',
        changedBy: 'manual',
        changedByName: 'Gerente',
      },
    ],
    
    access: {
      isAllowed: true,
      lastCheckIn: {
        id: 'acc-005',
        checkInAt: '2025-01-06T06:00:00',
        method: 'biometry',
        location: 'Entrada Principal',
      },
      checkInsLast7Days: 6,
      checkInsLast30Days: 25,
      digitalCard: {
        status: 'generated',
        generatedAt: '2024-01-10',
        expiresAt: '2025-12-31',
      },
    },
    
    currentPlan: {
      id: 'plan-personal',
      name: 'Plano Personal Trainer',
      startDate: '2024-01-10',
      endDate: '2025-12-31',
      billingType: 'monthly',
      autoRenewal: true,
      nextDueDate: '2025-01-10',
      currentValue: 299.90,
    },
    
    contracts: [
      {
        id: 'ctr-006',
        number: 'CTR-PER-2024-001',
        status: 'active',
        signedAt: '2024-01-10',
        startDate: '2024-01-10',
        endDate: '2025-12-31',
        planName: 'Plano Personal Trainer',
        value: 299.90,
      },
    ],
    currentContractId: 'ctr-006',
    
    financial: {
      status: 'up_to_date',
      daysOverdue: 0,
      lastPayment: {
        id: 'pay-005',
        date: '2024-12-10',
        value: 299.90,
        method: 'pix',
        description: 'Mensalidade Dezembro/2024',
      },
      pendingBalance: 0,
      nextDueDate: '2025-01-10',
      nextDueValue: 299.90,
    },
    
    documents: [
      {
        id: 'doc-012',
        type: 'contract',
        name: 'Contrato Personal Trainer',
        status: 'ok',
        uploadedAt: '2024-01-10',
      },
      {
        id: 'doc-013',
        type: 'identity',
        name: 'CREF',
        status: 'ok',
        uploadedAt: '2024-01-10',
      },
      {
        id: 'doc-014',
        type: 'medical',
        name: 'Atestado de Saúde Ocupacional',
        status: 'ok',
        uploadedAt: '2024-01-10',
      },
    ],
  },
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

export function getUserById(id: string): User | undefined {
  return mockUsers.find(user => user.id === id);
}

export function filterUsersByStatus(users: User[], status: UserStatus | 'all'): User[] {
  if (status === 'all') return users;
  return users.filter(user => user.status === status);
}

export function searchUsers(users: User[], query: string): User[] {
  const lowercaseQuery = query.toLowerCase();
  return users.filter(
    user =>
      user.fullName.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.registrationId.toLowerCase().includes(lowercaseQuery)
  );
}

export function formatDate(dateString: string): string {
  if (!dateString || dateString === '-') return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateTimeString: string): string {
  if (!dateTimeString || dateTimeString === '-') return '-';
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getCurrentContract(user: User): Contract | undefined {
  if (!user.currentContractId) return undefined;
  return user.contracts.find(c => c.id === user.currentContractId);
}

export function getDocumentsByType(user: User, type: UserDocument['type']): UserDocument[] {
  return user.documents.filter(doc => doc.type === type);
}

export function getDocumentStats(user: User): { total: number; ok: number; pending: number; expired: number } {
  const docs = user.documents;
  return {
    total: docs.length,
    ok: docs.filter(d => d.status === 'ok').length,
    pending: docs.filter(d => d.status === 'pending').length,
    expired: docs.filter(d => d.status === 'expired').length,
  };
}
