// ============================================
// MÓDULO FINANCEIRO - MOVEACCESS
// Controle de cobranças, pagamentos e inadimplência
// Fase 1: Visão operacional mockada
// ============================================

// ============================================
// TIPOS BASE
// ============================================

/**
 * Status da cobrança
 */
export type ChargeStatus =
  | 'pending'      // Aguardando vencimento
  | 'paid'         // Pago
  | 'overdue'      // Em atraso
  | 'cancelled'    // Cancelada
  | 'waived'       // Isenta
  | 'partial';     // Pagamento parcial

/**
 * Método de pagamento
 */
export type PaymentMethod =
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'boleto'
  | 'cash'
  | 'transfer';

/**
 * Tipo de ajuste manual
 */
export type AdjustmentType =
  | 'discount_percentage'  // Desconto percentual
  | 'discount_fixed'       // Desconto valor fixo
  | 'waiver'               // Isenção total
  | 'extension'            // Prorrogação de vencimento
  | 'fee'                  // Taxa adicional
  | 'correction';          // Correção de valor

/**
 * Status financeiro do usuário (derivado)
 */
export type UserFinancialStatus =
  | 'up_to_date'           // Em dia
  | 'pending'              // Cobrança pendente (não vencida)
  | 'overdue'              // Inadimplente
  | 'blocked_financial';   // Bloqueado por financeiro

// ============================================
// INTERFACES PRINCIPAIS
// ============================================

/**
 * Ajuste manual aplicado a uma cobrança
 */
export interface ChargeAdjustment {
  id: string;
  type: AdjustmentType;
  value: number;          // Percentual ou valor absoluto
  description: string;
  appliedAt: string;
  appliedBy: string;
  newDueDate?: string;    // Para prorrogação
}

/**
 * Histórico de evento da cobrança
 */
export interface ChargeEvent {
  id: string;
  type: 'created' | 'payment' | 'adjustment' | 'status_change' | 'reminder_sent' | 'link_generated';
  description: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cobrança / Fatura
 */
export interface Charge {
  id: string;
  
  // Referências
  userId: string;
  userName: string;
  userDocument: string;       // CPF mascarado
  contractId: string;
  contractNumber: string;
  planId: string;
  planName: string;
  
  // Competência
  competence: string;         // "2026-01" (mês/ano)
  description: string;        // "Mensalidade Janeiro/2026"
  
  // Valores
  baseValue: number;          // Valor base do plano
  adjustments: ChargeAdjustment[];
  finalValue: number;         // Valor final após ajustes
  paidValue: number;          // Valor já pago
  
  // Datas
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  
  // Status e método
  status: ChargeStatus;
  paymentMethod?: PaymentMethod;
  
  // Histórico
  events: ChargeEvent[];
  
  // Flags
  isRecurring: boolean;
  canGenerateLink: boolean;
}

/**
 * Resumo financeiro do dashboard
 */
export interface FinancialSummary {
  // Receitas
  receivedThisMonth: number;
  expectedThisMonth: number;
  
  // Inadimplência
  overdueTotal: number;
  overdueCount: number;
  
  // A vencer
  dueSoon7Days: number;
  dueSoon7DaysCount: number;
  
  // MRR
  mrr: number;
  activeSubscriptions: number;
  
  // Comparativo
  receivedLastMonth: number;
  mrrChange: number;          // Percentual de mudança
}

// ============================================
// LABELS E VARIANTS
// ============================================

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Em Atraso',
  cancelled: 'Cancelada',
  waived: 'Isenta',
  partial: 'Parcial',
};

export const CHARGE_STATUS_VARIANT: Record<ChargeStatus, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'secondary',
  waived: 'secondary',
  partial: 'warning',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  boleto: 'Boleto',
  cash: 'Dinheiro',
  transfer: 'Transferência',
};

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  discount_percentage: 'Desconto (%)',
  discount_fixed: 'Desconto (R$)',
  waiver: 'Isenção Total',
  extension: 'Prorrogação',
  fee: 'Taxa Adicional',
  correction: 'Correção',
};

export const USER_FINANCIAL_STATUS_LABELS: Record<UserFinancialStatus, string> = {
  up_to_date: 'Em dia',
  pending: 'Pendente',
  overdue: 'Inadimplente',
  blocked_financial: 'Bloqueado',
};

export const USER_FINANCIAL_STATUS_VARIANT: Record<UserFinancialStatus, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  up_to_date: 'success',
  pending: 'warning',
  overdue: 'destructive',
  blocked_financial: 'destructive',
};

// ============================================
// DADOS MOCK
// ============================================

const today = new Date();
const currentMonth = today.toISOString().slice(0, 7);
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);

export const mockCharges: Charge[] = [
  // ===== COBRANÇAS PAGAS (mês passado) =====
  {
    id: 'CHG-001',
    userId: '1',
    userName: 'João Silva',
    userDocument: '123.***.***-00',
    contractId: 'CNT-001',
    contractNumber: 'CNT-2024-0001',
    planId: 'plan-1',
    planName: 'Plano Premium',
    competence: lastMonth,
    description: `Mensalidade ${lastMonth}`,
    baseValue: 199.90,
    adjustments: [],
    finalValue: 199.90,
    paidValue: 199.90,
    dueDate: `${lastMonth}-10`,
    createdAt: `${lastMonth}-01`,
    paidAt: `${lastMonth}-08`,
    status: 'paid',
    paymentMethod: 'pix',
    events: [
      { id: 'evt-1', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${lastMonth}-01T08:00:00` },
      { id: 'evt-2', type: 'payment', description: 'Pagamento via PIX confirmado', timestamp: `${lastMonth}-08T14:32:00` },
    ],
    isRecurring: true,
    canGenerateLink: false,
  },
  {
    id: 'CHG-002',
    userId: '2',
    userName: 'Maria Santos',
    userDocument: '987.***.***-00',
    contractId: 'CNT-002',
    contractNumber: 'CNT-2024-0002',
    planId: 'plan-2',
    planName: 'Plano Básico',
    competence: lastMonth,
    description: `Mensalidade ${lastMonth}`,
    baseValue: 99.90,
    adjustments: [],
    finalValue: 99.90,
    paidValue: 99.90,
    dueDate: `${lastMonth}-15`,
    createdAt: `${lastMonth}-01`,
    paidAt: `${lastMonth}-14`,
    status: 'paid',
    paymentMethod: 'credit_card',
    events: [
      { id: 'evt-3', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${lastMonth}-01T08:00:00` },
      { id: 'evt-4', type: 'payment', description: 'Pagamento via cartão de crédito confirmado', timestamp: `${lastMonth}-14T10:15:00` },
    ],
    isRecurring: true,
    canGenerateLink: false,
  },
  
  // ===== COBRANÇAS MÊS ATUAL =====
  // Pagas
  {
    id: 'CHG-003',
    userId: '1',
    userName: 'João Silva',
    userDocument: '123.***.***-00',
    contractId: 'CNT-001',
    contractNumber: 'CNT-2024-0001',
    planId: 'plan-1',
    planName: 'Plano Premium',
    competence: currentMonth,
    description: `Mensalidade ${currentMonth}`,
    baseValue: 199.90,
    adjustments: [],
    finalValue: 199.90,
    paidValue: 199.90,
    dueDate: `${currentMonth}-10`,
    createdAt: `${currentMonth}-01`,
    paidAt: `${currentMonth}-09`,
    status: 'paid',
    paymentMethod: 'pix',
    events: [
      { id: 'evt-5', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${currentMonth}-01T08:00:00` },
      { id: 'evt-6', type: 'payment', description: 'Pagamento via PIX confirmado', timestamp: `${currentMonth}-09T11:45:00` },
    ],
    isRecurring: true,
    canGenerateLink: false,
  },
  
  // Pendentes (a vencer)
  {
    id: 'CHG-004',
    userId: '2',
    userName: 'Maria Santos',
    userDocument: '987.***.***-00',
    contractId: 'CNT-002',
    contractNumber: 'CNT-2024-0002',
    planId: 'plan-2',
    planName: 'Plano Básico',
    competence: currentMonth,
    description: `Mensalidade ${currentMonth}`,
    baseValue: 99.90,
    adjustments: [],
    finalValue: 99.90,
    paidValue: 0,
    dueDate: `${currentMonth}-15`,
    createdAt: `${currentMonth}-01`,
    status: 'pending',
    events: [
      { id: 'evt-7', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${currentMonth}-01T08:00:00` },
    ],
    isRecurring: true,
    canGenerateLink: true,
  },
  {
    id: 'CHG-005',
    userId: '5',
    userName: 'Pedro Oliveira',
    userDocument: '456.***.***-00',
    contractId: 'CNT-005',
    contractNumber: 'CNT-2024-0005',
    planId: 'plan-1',
    planName: 'Plano Premium',
    competence: currentMonth,
    description: `Mensalidade ${currentMonth}`,
    baseValue: 199.90,
    adjustments: [
      {
        id: 'adj-1',
        type: 'discount_percentage',
        value: 10,
        description: 'Desconto fidelidade',
        appliedAt: `${currentMonth}-01`,
        appliedBy: 'Carlos Admin',
      },
    ],
    finalValue: 179.91,
    paidValue: 0,
    dueDate: `${currentMonth}-20`,
    createdAt: `${currentMonth}-01`,
    status: 'pending',
    events: [
      { id: 'evt-8', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${currentMonth}-01T08:00:00` },
      { id: 'evt-9', type: 'adjustment', description: 'Desconto de 10% aplicado (fidelidade)', timestamp: `${currentMonth}-01T09:00:00` },
    ],
    isRecurring: true,
    canGenerateLink: true,
  },
  
  // Em atraso
  {
    id: 'CHG-006',
    userId: '3',
    userName: 'Carlos Pereira',
    userDocument: '111.***.***-00',
    contractId: 'CNT-003',
    contractNumber: 'CNT-2024-0003',
    planId: 'plan-3',
    planName: 'Plano Família',
    competence: lastMonth,
    description: `Mensalidade ${lastMonth}`,
    baseValue: 349.90,
    adjustments: [],
    finalValue: 349.90,
    paidValue: 0,
    dueDate: `${lastMonth}-10`,
    createdAt: `${lastMonth}-01`,
    status: 'overdue',
    events: [
      { id: 'evt-10', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${lastMonth}-01T08:00:00` },
      { id: 'evt-11', type: 'status_change', description: 'Status alterado para Em Atraso', timestamp: `${lastMonth}-11T00:00:00` },
      { id: 'evt-12', type: 'reminder_sent', description: 'Lembrete enviado via WhatsApp', timestamp: `${lastMonth}-15T10:00:00` },
    ],
    isRecurring: true,
    canGenerateLink: true,
  },
  {
    id: 'CHG-007',
    userId: '3',
    userName: 'Carlos Pereira',
    userDocument: '111.***.***-00',
    contractId: 'CNT-003',
    contractNumber: 'CNT-2024-0003',
    planId: 'plan-3',
    planName: 'Plano Família',
    competence: currentMonth,
    description: `Mensalidade ${currentMonth}`,
    baseValue: 349.90,
    adjustments: [],
    finalValue: 349.90,
    paidValue: 0,
    dueDate: `${currentMonth}-10`,
    createdAt: `${currentMonth}-01`,
    status: 'overdue',
    events: [
      { id: 'evt-13', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${currentMonth}-01T08:00:00` },
      { id: 'evt-14', type: 'status_change', description: 'Status alterado para Em Atraso', timestamp: `${currentMonth}-11T00:00:00` },
    ],
    isRecurring: true,
    canGenerateLink: true,
  },
  {
    id: 'CHG-008',
    userId: '4',
    userName: 'Ana Rodrigues',
    userDocument: '222.***.***-00',
    contractId: 'CNT-004',
    contractNumber: 'CNT-2024-0004',
    planId: 'plan-2',
    planName: 'Plano Básico',
    competence: currentMonth,
    description: `Mensalidade ${currentMonth}`,
    baseValue: 99.90,
    adjustments: [],
    finalValue: 99.90,
    paidValue: 50.00,
    dueDate: `${currentMonth}-05`,
    createdAt: `${currentMonth}-01`,
    status: 'partial',
    paymentMethod: 'cash',
    events: [
      { id: 'evt-15', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${currentMonth}-01T08:00:00` },
      { id: 'evt-16', type: 'payment', description: 'Pagamento parcial de R$ 50,00', timestamp: `${currentMonth}-05T16:00:00` },
      { id: 'evt-17', type: 'status_change', description: 'Status alterado para Pagamento Parcial', timestamp: `${currentMonth}-06T00:00:00` },
    ],
    isRecurring: true,
    canGenerateLink: true,
  },
  
  // Isenta
  {
    id: 'CHG-009',
    userId: '6',
    userName: 'Funcionário Teste',
    userDocument: '333.***.***-00',
    contractId: 'CNT-006',
    contractNumber: 'CNT-2024-0006',
    planId: 'plan-1',
    planName: 'Plano Premium',
    competence: currentMonth,
    description: `Mensalidade ${currentMonth} - Funcionário`,
    baseValue: 199.90,
    adjustments: [
      {
        id: 'adj-2',
        type: 'waiver',
        value: 100,
        description: 'Isenção para funcionário',
        appliedAt: `${currentMonth}-01`,
        appliedBy: 'Sistema',
      },
    ],
    finalValue: 0,
    paidValue: 0,
    dueDate: `${currentMonth}-10`,
    createdAt: `${currentMonth}-01`,
    status: 'waived',
    events: [
      { id: 'evt-18', type: 'created', description: 'Cobrança gerada automaticamente', timestamp: `${currentMonth}-01T08:00:00` },
      { id: 'evt-19', type: 'adjustment', description: 'Isenção total aplicada (funcionário)', timestamp: `${currentMonth}-01T08:00:00` },
    ],
    isRecurring: true,
    canGenerateLink: false,
  },
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata valor monetário de forma compacta (para valores grandes)
 * Ex: R$ 1.580.000 → R$ 1,58M
 */
export function formatCurrencyCompact(value: number): { display: string; full: string } {
  const full = formatCurrency(value);
  
  if (value >= 1000000) {
    const millions = value / 1000000;
    return { 
      display: `R$ ${millions.toFixed(2).replace('.', ',')}M`,
      full 
    };
  }
  if (value >= 10000) {
    const thousands = value / 1000;
    return { 
      display: `R$ ${thousands.toFixed(1).replace('.', ',')}k`,
      full 
    };
  }
  return { display: full, full };
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata competência para exibição
 */
export function formatCompetence(competence: string): string {
  const [year, month] = competence.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]}/${year}`;
}

/**
 * Calcula dias em atraso
 */
export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate + 'T23:59:59');
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calcula dias até vencimento
 */
export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate + 'T23:59:59');
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Busca cobrança por ID
 */
export function getChargeById(id: string): Charge | undefined {
  return mockCharges.find(c => c.id === id);
}

/**
 * Busca cobranças por usuário
 */
export function getChargesByUserId(userId: string): Charge[] {
  return mockCharges.filter(c => c.userId === userId);
}

/**
 * Busca cobranças por status
 */
export function getChargesByStatus(status: ChargeStatus): Charge[] {
  return mockCharges.filter(c => c.status === status);
}

/**
 * Busca cobranças em atraso ordenadas por prioridade
 */
export function getOverdueCharges(): Charge[] {
  return mockCharges
    .filter(c => c.status === 'overdue' || c.status === 'partial')
    .sort((a, b) => {
      // Ordena por dias em atraso (decrescente) e depois por valor (decrescente)
      const daysA = getDaysOverdue(a.dueDate);
      const daysB = getDaysOverdue(b.dueDate);
      if (daysA !== daysB) return daysB - daysA;
      return (b.finalValue - b.paidValue) - (a.finalValue - a.paidValue);
    });
}

/**
 * Busca cobranças a vencer nos próximos N dias
 */
export function getChargesDueSoon(days: number = 7): Charge[] {
  return mockCharges.filter(c => {
    if (c.status !== 'pending') return false;
    const daysUntil = getDaysUntilDue(c.dueDate);
    return daysUntil >= 0 && daysUntil <= days;
  });
}

/**
 * Pesquisa cobranças por termo
 */
export function searchCharges(query: string): Charge[] {
  const term = query.toLowerCase();
  return mockCharges.filter(c =>
    c.id.toLowerCase().includes(term) ||
    c.userName.toLowerCase().includes(term) ||
    c.planName.toLowerCase().includes(term) ||
    c.contractNumber.toLowerCase().includes(term)
  );
}

/**
 * Calcula resumo financeiro
 */
export function getFinancialSummary(): FinancialSummary {
  const currentMonthCharges = mockCharges.filter(c => c.competence === currentMonth);
  const lastMonthCharges = mockCharges.filter(c => c.competence === lastMonth);
  
  // Receita recebida (mês atual)
  const receivedThisMonth = currentMonthCharges
    .filter(c => c.status === 'paid' || c.status === 'partial')
    .reduce((sum, c) => sum + c.paidValue, 0);
  
  // Receita esperada (mês atual)
  const expectedThisMonth = currentMonthCharges
    .reduce((sum, c) => sum + c.finalValue, 0);
  
  // Receita mês passado
  const receivedLastMonth = lastMonthCharges
    .filter(c => c.status === 'paid' || c.status === 'partial')
    .reduce((sum, c) => sum + c.paidValue, 0);
  
  // Inadimplência
  const overdueCharges = mockCharges.filter(c => c.status === 'overdue' || c.status === 'partial');
  const overdueTotal = overdueCharges.reduce((sum, c) => sum + (c.finalValue - c.paidValue), 0);
  const overdueCount = overdueCharges.length;
  
  // A vencer em 7 dias
  const dueSoonCharges = getChargesDueSoon(7);
  const dueSoon7Days = dueSoonCharges.reduce((sum, c) => sum + c.finalValue, 0);
  const dueSoon7DaysCount = dueSoonCharges.length;
  
  // MRR (soma dos valores recorrentes ativos)
  const activeRecurring = mockCharges.filter(c => 
    c.isRecurring && 
    c.competence === currentMonth &&
    c.status !== 'cancelled' &&
    c.status !== 'waived'
  );
  const mrr = activeRecurring.reduce((sum, c) => sum + c.finalValue, 0);
  const activeSubscriptions = new Set(activeRecurring.map(c => c.userId)).size;
  
  // Variação MRR
  const mrrChange = receivedLastMonth > 0 
    ? ((receivedThisMonth - receivedLastMonth) / receivedLastMonth) * 100 
    : 0;
  
  return {
    receivedThisMonth,
    expectedThisMonth,
    receivedLastMonth,
    overdueTotal,
    overdueCount,
    dueSoon7Days,
    dueSoon7DaysCount,
    mrr,
    activeSubscriptions,
    mrrChange,
  };
}

/**
 * Deriva status financeiro de um usuário
 */
export function getUserFinancialStatus(userId: string): UserFinancialStatus {
  const userCharges = getChargesByUserId(userId);
  
  // Verifica se tem cobrança em atraso
  const hasOverdue = userCharges.some(c => c.status === 'overdue' || c.status === 'partial');
  if (hasOverdue) return 'overdue';
  
  // Verifica se tem cobrança pendente
  const hasPending = userCharges.some(c => c.status === 'pending');
  if (hasPending) return 'pending';
  
  return 'up_to_date';
}

/**
 * Gera código de cobrança
 */
export function generateChargeId(): string {
  const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CHG-${num}`;
}

/**
 * Gera link de pagamento mock
 */
export function generatePaymentLink(chargeId: string): string {
  return `https://pay.moveaccess.app/${chargeId}`;
}

/**
 * Template de lembrete
 */
export function getReminderTemplate(charge: Charge): string {
  const daysOverdue = getDaysOverdue(charge.dueDate);
  const remaining = charge.finalValue - charge.paidValue;
  
  return `Olá ${charge.userName.split(' ')[0]}! 👋

Identificamos que sua mensalidade de ${formatCompetence(charge.competence)} está ${daysOverdue > 0 ? `${daysOverdue} dia(s) em atraso` : 'próxima do vencimento'}.

💰 Valor: ${formatCurrency(remaining)}
📅 Vencimento: ${formatDate(charge.dueDate)}

Para regularizar, acesse:
${generatePaymentLink(charge.id)}

Dúvidas? Estamos à disposição!
Academia MoveAccess`;
}

/**
 * Usuários com bloqueio financeiro mock
 */
export const blockedUsers: Set<string> = new Set();

/**
 * Bloqueia usuário por financeiro
 */
export function blockUserFinancial(userId: string): void {
  blockedUsers.add(userId);
}

/**
 * Desbloqueia usuário por financeiro
 */
export function unblockUserFinancial(userId: string): void {
  blockedUsers.delete(userId);
}

/**
 * Verifica se usuário está bloqueado por financeiro
 */
export function isUserBlockedFinancial(userId: string): boolean {
  return blockedUsers.has(userId);
}
