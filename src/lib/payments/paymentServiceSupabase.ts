export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'manual' | 'pix' | 'card' | 'boleto';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
export type ChargeOrigin = 'local' | 'asaas' | 'recurring';

import { getActiveAcademyId } from '@/lib/supabase/academyScope';

export interface PaymentStudent {
  id: string;
  fullName: string;
  email: string;
  document: string;
  registrationId: string;
  status: string;
}

export interface PaymentSubscription {
  id: string;
  planId: string;
  planName: string;
  subscriptionStatus: string;
  expiresAt: string | null;
}

export interface Payment {
  id: string;
  academyId: string;
  subscriptionId: string;
  studentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  student: PaymentStudent | null;
  subscription: PaymentSubscription | null;
  chargeOrigin: ChargeOrigin;
  isAsaasManaged: boolean;
  isRecurring: boolean;
  asaasStatus: string | null;
  asaasBillingType: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  asaasSyncedAt: string | null;
  asaasNetValue: number | null;
  asaasChargeId: string | null;
  asaasPaymentId: string | null;
}

export interface PaymentInput {
  subscriptionId: string;
  studentId: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  reference?: string | null;
  dueDate: string;
  paidAt?: string | null;
}

interface PaymentUpdateInput {
  status?: PaymentStatus;
  method?: PaymentMethod;
  reference?: string | null;
  paidAt?: string | null;
}

interface DbPaymentRow {
  id: string;
  academy_id: string;
  subscription_id: string;
  student_id: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference: string | null;
  due_date: string;
  paid_at: string | null;
  created_at: string;
}

interface DbFinancialViewRow {
  id: string;
  academy_id: string;
  subscription_id: string;
  student_id: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference: string | null;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  student_name: string | null;
  student_email: string | null;
  student_document: string | null;
  student_registration_id: string | null;
  student_status: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  plan_name: string | null;
  asaas_charge_id: string | null;
  asaas_payment_id: string | null;
  asaas_billing_type: string | null;
  asaas_status: string | null;
  asaas_net_value: number | string | null;
  invoice_url: string | null;
  bank_slip_url: string | null;
  asaas_synced_at: string | null;
  asaas_subscription_id: string | null;
  charge_origin: ChargeOrigin;
  is_asaas_managed: boolean;
  is_recurring: boolean;
}

export interface FinancialSummary {
  receivedThisMonth: number;
  expectedThisMonth: number;
  overdueTotal: number;
  overdueCount: number;
  dueSoon7Days: number;
  dueSoon7DaysCount: number;
  mrr: number;
  activeSubscriptions: number;
  receivedLastMonth: number;
  mrrChange: number;
}

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Estornado',
};

export const PAYMENT_STATUS_VARIANTS: Record<PaymentStatus, BadgeVariant> = {
  pending: 'warning',
  paid: 'success',
  failed: 'destructive',
  refunded: 'secondary',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  manual: 'Manual',
  pix: 'PIX',
  card: 'Cartão',
  boleto: 'Boleto',
};

function getStorageKey(): string {
  const projectRef = API_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  return `sb-${projectRef}-auth-token`;
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(getStorageKey());
  if (!stored) return null;

  try {
    const session = JSON.parse(stored);
    return session.access_token || null;
  } catch {
    return null;
  }
}

async function fetchSupabase<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
  const token = getAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return { data: null, error: 'Não autenticado' };
  }

  const method = options.method ?? 'GET';
  const prefer = method === 'GET' || method === 'DELETE' ? 'return=minimal' : 'return=representation';

  try {
    const response = await fetch(`${API_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: prefer,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

function viewRowToPayment(row: DbFinancialViewRow): Payment {
  return {
    id: row.id,
    academyId: row.academy_id,
    subscriptionId: row.subscription_id,
    studentId: row.student_id,
    amount: Number(row.amount || 0),
    currency: row.currency || 'BRL',
    status: row.status,
    method: row.method,
    reference: row.reference || '',
    dueDate: row.due_date,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    student: row.student_name ? {
      id: row.student_id,
      fullName: row.student_name,
      email: row.student_email || '',
      document: row.student_document || '',
      registrationId: row.student_registration_id || 'SEM-MATRICULA',
      status: row.student_status || 'unknown',
    } : null,
    subscription: row.plan_id ? {
      id: row.subscription_id,
      planId: row.plan_id,
      planName: row.plan_name || 'Plano',
      subscriptionStatus: row.subscription_status || 'active',
      expiresAt: row.subscription_expires_at,
    } : null,
    chargeOrigin: row.charge_origin,
    isAsaasManaged: row.is_asaas_managed,
    isRecurring: row.is_recurring,
    asaasStatus: row.asaas_status,
    asaasBillingType: row.asaas_billing_type,
    invoiceUrl: row.invoice_url,
    bankSlipUrl: row.bank_slip_url,
    asaasSyncedAt: row.asaas_synced_at,
    asaasNetValue: row.asaas_net_value ? Number(row.asaas_net_value) : null,
    asaasChargeId: row.asaas_charge_id || null,
    asaasPaymentId: row.asaas_payment_id || null,
  };
}

function serializeInput(input: PaymentInput | PaymentUpdateInput, academyId?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (academyId) payload.academy_id = academyId;
  if ('subscriptionId' in input && input.subscriptionId !== undefined) payload.subscription_id = input.subscriptionId;
  if ('studentId' in input && input.studentId !== undefined) payload.student_id = input.studentId;
  if ('amount' in input && input.amount !== undefined) payload.amount = Number(input.amount);
  if ('currency' in input && input.currency !== undefined) payload.currency = (input.currency || 'BRL').trim().toUpperCase();
  if (input.status !== undefined) payload.status = input.status;
  if (input.method !== undefined) payload.method = input.method;
  if (input.reference !== undefined) payload.reference = input.reference?.trim() || null;
  if ('dueDate' in input && input.dueDate !== undefined) payload.due_date = input.dueDate;
  if (input.paidAt !== undefined) payload.paid_at = input.paidAt;

  return payload;
}

export async function getPayments(): Promise<Payment[]> {
  const { data, error } = await fetchSupabase<DbFinancialViewRow[]>('financial_charges_view?select=*&order=due_date.asc');

  if (error || !data) {
    return [];
  }

  return data.map(viewRowToPayment);
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const { data, error } = await fetchSupabase<DbFinancialViewRow[]>(
    `financial_charges_view?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );

  if (error || !data?.[0]) {
    return null;
  }

  return viewRowToPayment(data[0]);
}

export async function getPaymentsByStudent(studentId: string): Promise<Payment[]> {
  const { data, error } = await fetchSupabase<DbFinancialViewRow[]>(
    `financial_charges_view?student_id=eq.${encodeURIComponent(studentId)}&select=*&order=due_date.desc`
  );

  if (error || !data) {
    return [];
  }

  return data.map(viewRowToPayment);
}

export async function createPayment(input: PaymentInput): Promise<{ success: boolean; payment?: Payment; error?: string }> {
  const academyId = await getActiveAcademyId();

  if (!academyId) {
    return { success: false, error: 'Academia não encontrada para o usuário logado.' };
  }

  const paidAt = input.status === 'paid' ? input.paidAt ?? new Date().toISOString() : null;
  const payload = {
    ...serializeInput(input, academyId),
    currency: (input.currency || 'BRL').trim().toUpperCase(),
    status: input.status ?? 'pending',
    method: input.method ?? 'manual',
    paid_at: paidAt,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await fetchSupabase<DbPaymentRow[]>('payments?select=*', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível criar a cobrança.' };
  }

  const payment = await getPaymentById(data[0].id);

  return {
    success: !!payment,
    payment: payment || undefined,
    error: payment ? undefined : 'Cobrança criada, mas não foi possível carregar os detalhes.',
  };
}

export async function markPaymentPaid(
  id: string,
  input: { method?: PaymentMethod; reference?: string | null; paidAt?: string | null } = {}
): Promise<{ success: boolean; payment?: Payment; error?: string }> {
  const payload = serializeInput({
    status: 'paid',
    method: input.method,
    reference: input.reference,
    paidAt: input.paidAt ?? new Date().toISOString(),
  });

  const { data, error } = await fetchSupabase<DbPaymentRow[]>(
    `payments?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível marcar o pagamento como pago.' };
  }

  const payment = await getPaymentById(data[0].id);
  return {
    success: !!payment,
    payment: payment || undefined,
    error: payment ? undefined : 'Pagamento atualizado, mas não foi possível carregar os detalhes.',
  };
}

export async function markPaymentFailed(
  id: string,
  input: { reference?: string | null } = {}
): Promise<{ success: boolean; payment?: Payment; error?: string }> {
  const payload = serializeInput({
    status: 'failed',
    reference: input.reference,
    paidAt: null,
  });

  const { data, error } = await fetchSupabase<DbPaymentRow[]>(
    `payments?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível marcar o pagamento como falho.' };
  }

  const payment = await getPaymentById(data[0].id);
  return {
    success: !!payment,
    payment: payment || undefined,
    error: payment ? undefined : 'Pagamento atualizado, mas não foi possível carregar os detalhes.',
  };
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value || 0);
}

export function formatCurrencyCompact(value: number, currency = 'BRL'): { display: string; full: string } {
  const full = formatCurrency(value, currency);

  if (value >= 1000000) {
    return { display: `${currency === 'BRL' ? 'R$' : currency} ${(value / 1000000).toFixed(2).replace('.', ',')}M`, full };
  }

  if (value >= 10000) {
    return { display: `${currency === 'BRL' ? 'R$' : currency} ${(value / 1000).toFixed(1).replace('.', ',')}k`, full };
  }

  return { display: full, full };
}

export function formatPaymentDate(value: string | null): string {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatPaymentDateTime(value: string | null): string {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCompetence(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
}

export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status] || status;
}

export function getPaymentStatusVariant(status: PaymentStatus): BadgeVariant {
  return PAYMENT_STATUS_VARIANTS[status] || 'secondary';
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}

/**
 * Determines if a charge represents real delinquency.
 *
 * Rules:
 * - Already paid / refunded → not delinquent
 * - Not yet due → not delinquent
 * - Asaas-managed: only PENDING, OVERDUE, DUNNING_REQUESTED, DUNNING_RECEIVED → delinquent
 * - Local: pending or failed and overdue → delinquent
 */
export function isChargeDelinquent(payment: Payment): boolean {
  if (payment.status === 'paid' || payment.status === 'refunded') return false;

  if (new Date(payment.dueDate).getTime() >= Date.now()) return false;

  if (payment.isAsaasManaged && payment.asaasStatus) {
    return ['PENDING', 'OVERDUE', 'DUNNING_REQUESTED', 'DUNNING_RECEIVED'].includes(payment.asaasStatus);
  }

  return ['pending', 'failed'].includes(payment.status);
}

export function getOverduePayments(payments: Payment[]): Payment[] {
  return payments
    .filter(isChargeDelinquent)
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
}

export function getDueSoonPayments(payments: Payment[], days = 7): Payment[] {
  return payments.filter((payment) => {
    if (payment.status !== 'pending') return false;
    const daysUntilDue = getDaysUntilDue(payment.dueDate);
    return daysUntilDue >= 0 && daysUntilDue <= days;
  });
}

export function getFinancialSummary(payments: Payment[]): FinancialSummary {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);

  const isCurrentMonthDue = (value: string) => {
    const date = new Date(value);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  const isLastMonthPaid = (value: string | null) => {
    if (!value) return false;
    const date = new Date(value);
    return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
  };

  const receivedThisMonth = payments
    .filter((payment) => payment.status === 'paid' && payment.paidAt)
    .filter((payment) => {
      const date = new Date(payment.paidAt as string);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, payment) => sum + payment.amount, 0);

  const expectedThisMonth = payments
    .filter((payment) => isCurrentMonthDue(payment.dueDate))
    .reduce((sum, payment) => sum + payment.amount, 0);

  const overduePayments = getOverduePayments(payments);
  const overdueTotal = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

  const dueSoonPayments = getDueSoonPayments(payments, 7);
  const dueSoon7Days = dueSoonPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const currentMonthPayments = payments.filter((payment) => isCurrentMonthDue(payment.dueDate));
  const mrr = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const activeSubscriptions = new Set(currentMonthPayments.map((payment) => payment.subscriptionId)).size;

  const receivedLastMonth = payments
    .filter((payment) => payment.status === 'paid' && isLastMonthPaid(payment.paidAt))
    .reduce((sum, payment) => sum + payment.amount, 0);

  const mrrChange = receivedLastMonth > 0 ? ((receivedThisMonth - receivedLastMonth) / receivedLastMonth) * 100 : 0;

  return {
    receivedThisMonth,
    expectedThisMonth,
    overdueTotal,
    overdueCount: overduePayments.length,
    dueSoon7Days,
    dueSoon7DaysCount: dueSoonPayments.length,
    mrr,
    activeSubscriptions,
    receivedLastMonth,
    mrrChange,
  };
}

export function getPaymentLink(payment: Payment): string | null {
  return payment.invoiceUrl || payment.bankSlipUrl || null;
}

export function getReminderTemplate(payment: Payment): string {
  const link = getPaymentLink(payment);
  const linkSection = link ? `\n\nPara regularizar, acesse:\n${link}` : '';
  return `Olá ${payment.student?.fullName?.split(' ')[0] || 'aluno'}!\n\nIdentificamos uma cobrança pendente da sua assinatura ${payment.subscription?.planName || ''}.\n\n💰 Valor: ${formatCurrency(payment.amount, payment.currency)}\n📅 Vencimento: ${formatPaymentDate(payment.dueDate)}${linkSection}`;
}

export const CHARGE_ORIGIN_LABELS: Record<ChargeOrigin, string> = {
  local: 'Manual',
  asaas: 'Asaas',
  recurring: 'Recorrente',
};

export const CHARGE_ORIGIN_VARIANTS: Record<ChargeOrigin, BadgeVariant> = {
  local: 'secondary',
  asaas: 'default',
  recurring: 'outline',
};

export function getChargeOriginLabel(origin: ChargeOrigin): string {
  return CHARGE_ORIGIN_LABELS[origin] || origin;
}

export function getChargeOriginVariant(origin: ChargeOrigin): BadgeVariant {
  return CHARGE_ORIGIN_VARIANTS[origin] || 'secondary';
}

export function getAsaasStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Aguardando',
    RECEIVED: 'Recebido',
    CONFIRMED: 'Confirmado',
    OVERDUE: 'Vencido',
    REFUNDED: 'Estornado',
    RECEIVED_IN_CASH: 'Dinheiro',
    REFUND_REQUESTED: 'Estorno solic.',
    REFUND_IN_PROGRESS: 'Estornando',
    CHARGEBACK_REQUESTED: 'Chargeback',
    CHARGEBACK_DISPUTE: 'Chargeback disp.',
    AWAITING_CHARGEBACK_REVERSAL: 'Revertendo',
    DUNNING_REQUESTED: 'Negativação',
    DUNNING_RECEIVED: 'Negativado',
    AWAITING_RISK_ANALYSIS: 'Análise',
  };
  return labels[status] || status;
}

export function getAsaasStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'RECEIVED':
    case 'CONFIRMED':
    case 'RECEIVED_IN_CASH':
      return 'success';
    case 'PENDING':
    case 'AWAITING_RISK_ANALYSIS':
      return 'warning';
    case 'OVERDUE':
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
    case 'REFUND_IN_PROGRESS':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
    case 'DUNNING_REQUESTED':
    case 'DUNNING_RECEIVED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

// ============================================================================
// DELINQUENT STUDENTS (student_delinquency_view)
// ============================================================================

export interface DelinquentStudent {
  studentId: string;
  academyId: string;
  studentName: string;
  studentRegistrationId: string | null;
  studentStatus: string | null;
  overdueCount: number;
  overdueTotal: number;
  oldestOverdueDate: string;
  daysDelinquent: number;
}

interface DelinquentStudentRow {
  student_id: string;
  academy_id: string;
  student_name: string;
  student_registration_id: string | null;
  student_status: string | null;
  overdue_count: number;
  overdue_total: number | string;
  oldest_overdue_date: string;
  days_delinquent: number;
}

function rowToDelinquentStudent(row: DelinquentStudentRow): DelinquentStudent {
  return {
    studentId: row.student_id,
    academyId: row.academy_id,
    studentName: row.student_name || 'Aluno sem nome',
    studentRegistrationId: row.student_registration_id,
    studentStatus: row.student_status,
    overdueCount: Number(row.overdue_count) || 0,
    overdueTotal: Number(row.overdue_total) || 0,
    oldestOverdueDate: row.oldest_overdue_date,
    daysDelinquent: Number(row.days_delinquent) || 0,
  };
}

export async function getDelinquentStudents(): Promise<DelinquentStudent[]> {
  const { data, error } = await fetchSupabase<DelinquentStudentRow[]>(
    'student_delinquency_view?select=*&order=days_delinquent.desc'
  );

  if (error || !data) {
    console.error('Erro ao buscar alunos inadimplentes:', error);
    return [];
  }

  return data.map(rowToDelinquentStudent);
}
