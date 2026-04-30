/**
 * Users Service - Supabase
 * Interface compatível com usersMock para facilitar migração
 *
 * Fase 1: Listagem e detalhe de alunos (students)
 * TODO: Histórico de status, Access, Contracts, Financial, Documents
 */

import { BILLING_POLICIES_DEFAULTS, getEffectiveBillingPolicies, type DelinquencyPolicy } from '@/lib/settings/policies';
import { getActiveAcademyId, getBrowserAccessToken } from '@/lib/supabase/academyScope';

// ============================================================================
// TIPOS (compatíveis com usersMock, simplificados para Fase 1)
// ============================================================================

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'blocked';
export type UserType = 'student' | 'personal' | 'guest' | 'employee';
export type RegistrationOrigin = 'academy' | 'app' | 'website' | 'migration';
export type PlanStatus = 'active' | 'expired' | 'pending' | 'suspended' | 'cancelled';
export type UserStatusTone = 'success' | 'warning' | 'destructive' | 'secondary';
export type UserFinancialStatusCode = 'current' | 'pending_payment' | 'action_required' | 'delinquent' | 'charge_failed' | 'no_charge';
export type UserAccessStatusCode = 'released' | 'pending' | 'blocked' | 'no_unit';

interface UserStatusSummary<TCode extends string> {
  code: TCode;
  label: string;
  tone: UserStatusTone;
  detail: string | null;
}

export interface UserFinancialStatusSummary extends UserStatusSummary<UserFinancialStatusCode> {
  paymentId: string | null;
  dueDate: string | null;
  amount: number | null;
}

export interface UserOperationalStatus {
  registration: UserStatusSummary<UserStatus>;
  financial: UserFinancialStatusSummary;
  access: UserStatusSummary<UserAccessStatusCode>;
}

export interface UserBillingSnapshot {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method: 'manual' | 'pix' | 'card' | 'boleto';
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  asaasStatus: string | null;
  chargeOrigin: 'local' | 'asaas' | 'recurring';
  isAsaasManaged: boolean;
  hasExternalArtifacts: boolean;
}

export interface ContractAcceptanceInfo {
  acceptedAt: string;
  termsVersion: string | null;
  templateId: string | null;
}

export interface UserAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface PlanInfo {
  name: string | null;
  status: PlanStatus | null;
  expiresAt: string | null;
}

/**
 * User type simplificado para listagem e detalhe
 * Campos de Access, Contracts, Financial e Documents são TODO
 */
export interface User {
  id: string;
  
  // Identidade
  registrationId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  document: string | null; // CPF
  avatarUrl: string | null;
  userType: UserType;
  
  // Unidade e Academia
  unitId: string | null;
  unitName: string | null;
  academyId: string | null;
  academyName: string | null;
  
  // Registro
  registrationOrigin: RegistrationOrigin;
  createdAt: string;
  
  // Status
  status: UserStatus;
  statusReason: string | null;
  statusSince: string | null;
  
  // Dados pessoais
  birthDate: string | null;
  address: UserAddress | null;
  emergencyContact: EmergencyContact | null;
  
  // Plano (simplificado)
  currentPlan: PlanInfo | null;

  // Situação operacional real consolidada para o piloto
  operationalStatus: UserOperationalStatus;
  billingSnapshot: UserBillingSnapshot | null;
  contractAcceptance: ContractAcceptanceInfo | null;
  
  // TODO: Fase 2+
  // statusHistory: StatusHistory[];
  // access: AccessInfo;
  // contracts: Contract[];
  // financial: FinancialInfo;
  // documents: UserDocument[];
}

export interface UsersListResult {
  users: User[];
  total: number;
}

// ============================================================================
// HELPERS
// ============================================================================

async function fetchSupabase<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = await getBrowserAccessToken();
  
  if (!token) {
    return { data: null, error: 'Não autenticado' };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${endpoint}`,
      {
        ...options,
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[UsersService] Erro na requisição:', errorData);
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    console.error('[UsersService] Erro:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

async function getActiveUsersAcademyId(): Promise<string | null> {
  return getActiveAcademyId();
}

// ============================================================================
// CONVERSORES DB <-> UI
// ============================================================================

interface DbStudentRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  document: string | null;
  avatar_url: string | null;
  created_at: string;
  
  registration_id: string | null;
  status: UserStatus;
  status_reason: string | null;
  status_since: string | null;
  birth_date: string | null;
  registration_origin: string | null;
  address: UserAddress | null;
  emergency_contact: EmergencyContact | null;
  
  plan_name: string | null;
  plan_status: PlanStatus | null;
  plan_expires_at: string | null;
  
  unit_id: string | null;
  unit_name: string | null;
  
  academy_id: string | null;
  academy_name: string | null;
}

interface DbPaymentStatusRow {
  id: string;
  student_id: string;
  amount: number | string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method: 'manual' | 'pix' | 'card' | 'boleto';
  due_date: string;
  paid_at: string | null;
  created_at: string;
  asaas_status: string | null;
  invoice_url: string | null;
  bank_slip_url: string | null;
  is_asaas_managed: boolean;
  charge_origin: 'local' | 'asaas' | 'recurring';
  asaas_charge_id: string | null;
  asaas_payment_id: string | null;
}

interface DbDelinquencyRow {
  student_id: string | null;
  overdue_count: number | string | null;
  overdue_total: number | string | null;
  oldest_overdue_date: string | null;
  days_delinquent: number | null;
}

interface UserDelinquencySnapshot {
  overdueCount: number;
  overdueTotal: number;
  oldestOverdueDate: string | null;
  daysDelinquent: number;
}

interface DbContractAcceptanceRow {
  student_id: string;
  accepted_at: string;
  terms_version: string | null;
  template_id: string | null;
}

interface AcademyPreferencesRow {
  preferences: {
    delinquency?: unknown;
    billing?: unknown;
  } | null;
}

const FAILED_ASAAS_STATUSES = new Set([
  'REFUNDED',
  'REFUND_REQUESTED',
  'REFUND_IN_PROGRESS',
  'CHARGEBACK_REQUESTED',
  'CHARGEBACK_DISPUTE',
  'AWAITING_CHARGEBACK_REVERSAL',
]);

function toInFilter(values: string[]): string {
  return `(${values.map((value) => encodeURIComponent(value)).join(',')})`;
}

function mapRegistrationStatus(status: UserStatus, reason: string | null): UserStatusSummary<UserStatus> {
  switch (status) {
    case 'active':
      return {
        code: status,
        label: 'Ativo',
        tone: 'success',
        detail: reason || 'Cadastro publicado e ativo na academia.',
      };
    case 'pending':
      return {
        code: status,
        label: 'Pendente',
        tone: 'warning',
        detail: reason || 'Cadastro criado, mas ainda não está totalmente concluído.',
      };
    case 'inactive':
      return {
        code: status,
        label: 'Inativo',
        tone: 'secondary',
        detail: reason || 'Cadastro sem operação ativa no momento.',
      };
    case 'suspended':
      return {
        code: status,
        label: 'Suspenso',
        tone: 'destructive',
        detail: reason || 'Cadastro suspenso pela academia.',
      };
    case 'blocked':
      return {
        code: status,
        label: 'Bloqueado',
        tone: 'destructive',
        detail: reason || 'Cadastro bloqueado para operação.',
      };
    default:
      return {
        code: 'pending',
        label: 'Pendente',
        tone: 'warning',
        detail: reason || 'Status cadastral não identificado.',
      };
  }
}

function mapPaymentSnapshot(row: DbPaymentStatusRow): UserBillingSnapshot {
  return {
    id: row.id,
    amount: Number(row.amount || 0),
    status: row.status,
    method: row.method,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    asaasStatus: row.asaas_status,
    chargeOrigin: row.charge_origin,
    isAsaasManaged: row.is_asaas_managed,
    hasExternalArtifacts: Boolean(
      row.is_asaas_managed
      || row.asaas_charge_id
      || row.asaas_payment_id
      || row.invoice_url
      || row.bank_slip_url
      || row.asaas_status,
    ),
  };
}

function emptyFinancialSummary(detail: string): UserFinancialStatusSummary {
  return {
    code: 'no_charge',
    label: 'Sem cobrança',
    tone: 'secondary',
    detail,
    paymentId: null,
    dueDate: null,
    amount: null,
  };
}

function compareAsc(a: string | null | undefined, b: string | null | undefined): number {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return aTime - bTime;
}

function compareDesc(a: string | null | undefined, b: string | null | undefined): number {
  return compareAsc(b, a);
}

function pickEarliest(
  payments: UserBillingSnapshot[],
  predicate: (payment: UserBillingSnapshot) => boolean,
): UserBillingSnapshot | null {
  const matches = payments.filter(predicate);
  if (matches.length === 0) {
    return null;
  }

  return matches.sort((left, right) => compareAsc(left.dueDate, right.dueDate) || compareAsc(left.createdAt, right.createdAt))[0];
}

function pickLatest(
  payments: UserBillingSnapshot[],
  predicate: (payment: UserBillingSnapshot) => boolean,
): UserBillingSnapshot | null {
  const matches = payments.filter(predicate);
  if (matches.length === 0) {
    return null;
  }

  return matches.sort((left, right) => compareDesc(left.paidAt || left.createdAt, right.paidAt || right.createdAt))[0];
}

function isExternalActionRequired(payment: UserBillingSnapshot): boolean {
  return payment.status === 'pending'
    && payment.method !== 'manual'
    && !payment.hasExternalArtifacts;
}

function isChargeFailure(payment: UserBillingSnapshot): boolean {
  return payment.status === 'failed'
    || (payment.asaasStatus ? FAILED_ASAAS_STATUSES.has(payment.asaasStatus) : false);
}

function resolveFinancialStatus(
  user: User,
  payments: UserBillingSnapshot[],
  delinquency: UserDelinquencySnapshot,
): { summary: UserFinancialStatusSummary; billingSnapshot: UserBillingSnapshot | null } {
  if (delinquency.overdueCount > 0) {
    const overduePayment = pickEarliest(
      payments,
      (payment) => payment.status === 'pending' && payment.dueDate === delinquency.oldestOverdueDate,
    ) || pickEarliest(payments, (payment) => payment.status === 'pending');

    return {
      summary: {
        code: 'delinquent',
        label: 'Inadimplente',
        tone: 'destructive',
        detail: `${delinquency.overdueCount} cobrança(s) em atraso para este aluno.`,
        paymentId: overduePayment?.id || null,
        dueDate: overduePayment?.dueDate || delinquency.oldestOverdueDate,
        amount: overduePayment?.amount || null,
      },
      billingSnapshot: overduePayment,
    };
  }

  const failedPayment = pickEarliest(payments, isChargeFailure);
  if (failedPayment) {
    return {
      summary: {
        code: 'charge_failed',
        label: 'Falha na cobrança',
        tone: 'destructive',
        detail: 'A cobrança precisa de intervenção operacional antes de ser considerada regular.',
        paymentId: failedPayment.id,
        dueDate: failedPayment.dueDate,
        amount: failedPayment.amount,
      },
      billingSnapshot: failedPayment,
    };
  }

  const actionRequiredPayment = pickEarliest(payments, isExternalActionRequired);
  if (actionRequiredPayment) {
    return {
      summary: {
        code: 'action_required',
        label: 'Ação necessária',
        tone: 'warning',
        detail: 'A cobrança digital ainda não foi materializada ou sincronizada corretamente.',
        paymentId: actionRequiredPayment.id,
        dueDate: actionRequiredPayment.dueDate,
        amount: actionRequiredPayment.amount,
      },
      billingSnapshot: actionRequiredPayment,
    };
  }

  const pendingPayment = pickEarliest(payments, (payment) => payment.status === 'pending');
  if (pendingPayment) {
    return {
      summary: {
        code: 'pending_payment',
        label: 'Pendente de pagamento',
        tone: 'warning',
        detail: 'Há cobrança aberta aguardando pagamento ou compensação.',
        paymentId: pendingPayment.id,
        dueDate: pendingPayment.dueDate,
        amount: pendingPayment.amount,
      },
      billingSnapshot: pendingPayment,
    };
  }

  const latestPaidPayment = pickLatest(payments, (payment) => payment.status === 'paid');
  if (latestPaidPayment) {
    return {
      summary: {
        code: 'current',
        label: 'Em dia',
        tone: 'success',
        detail: 'Sem cobrança vencida nem falha crítica no financeiro.',
        paymentId: latestPaidPayment.id,
        dueDate: latestPaidPayment.dueDate,
        amount: latestPaidPayment.amount,
      },
      billingSnapshot: latestPaidPayment,
    };
  }

  return {
    summary: emptyFinancialSummary(
      user.currentPlan
        ? 'Plano vinculado, mas nenhuma cobrança foi registrada para este aluno.'
        : 'Nenhuma cobrança foi registrada para este aluno.',
    ),
    billingSnapshot: null,
  };
}

function resolveAccessStatus(
  user: User,
  financialStatus: UserFinancialStatusSummary,
  delinquencyPolicy: DelinquencyPolicy,
): UserStatusSummary<UserAccessStatusCode> {
  if (user.status === 'blocked' || user.status === 'suspended') {
    return {
      code: 'blocked',
      label: 'Bloqueado',
      tone: 'destructive',
      detail: 'O cadastro do aluno está bloqueado para acesso.',
    };
  }

  if (user.status === 'inactive') {
    return {
      code: 'blocked',
      label: 'Inativo',
      tone: 'secondary',
      detail: 'O cadastro está inativo e não deve ser tratado como acesso liberado.',
    };
  }

  if (user.status === 'pending') {
    return {
      code: 'pending',
      label: 'Pendente',
      tone: 'warning',
      detail: 'O cadastro ainda não terminou de ser operacionalizado.',
    };
  }

  if (!user.currentPlan) {
    return {
      code: 'pending',
      label: 'Pendente',
      tone: 'warning',
      detail: 'Sem plano vinculado para considerar o acesso liberado.',
    };
  }

  if (user.currentPlan.status === 'pending') {
    return {
      code: 'pending',
      label: 'Pendente',
      tone: 'warning',
      detail: 'O plano ainda não está ativo o suficiente para considerar o acesso liberado.',
    };
  }

  if (user.currentPlan.status && ['expired', 'suspended', 'cancelled'].includes(user.currentPlan.status)) {
    return {
      code: 'blocked',
      label: 'Plano inativo',
      tone: 'destructive',
      detail: 'O plano ou a assinatura atual não libera acesso.',
    };
  }

  if (!user.unitId) {
    return {
      code: 'no_unit',
      label: 'Sem unidade',
      tone: 'warning',
      detail: 'A unidade principal do aluno não está definida.',
    };
  }

  if (financialStatus.code === 'delinquent' && delinquencyPolicy.blockAccess) {
    return {
      code: 'blocked',
      label: 'Bloqueado por financeiro',
      tone: 'destructive',
      detail: `A política desta academia bloqueia acesso após ${delinquencyPolicy.graceDays} dia(s) de atraso.`,
    };
  }

  if (financialStatus.code === 'action_required' || financialStatus.code === 'charge_failed') {
    return {
      code: 'pending',
      label: 'Pendente',
      tone: 'warning',
      detail: 'A cobrança ainda exige ação operacional antes de considerar o fluxo concluído.',
    };
  }

  if (financialStatus.code === 'delinquent' && !delinquencyPolicy.blockAccess) {
    return {
      code: 'released',
      label: 'Liberado',
      tone: 'success',
      detail: 'Há atraso financeiro, mas a política atual apenas monitora e não bloqueia acesso.',
    };
  }

  return {
    code: 'released',
    label: 'Liberado',
    tone: 'success',
    detail: 'Cadastro, plano e unidade permitem acesso operacional no piloto.',
  };
}

function buildDefaultOperationalStatus(status: UserStatus, reason: string | null): UserOperationalStatus {
  return {
    registration: mapRegistrationStatus(status, reason),
    financial: emptyFinancialSummary('Situação financeira ainda não consolidada.'),
    access: {
      code: 'pending',
      label: 'Pendente',
      tone: 'warning',
      detail: 'Situação de acesso ainda não consolidada.',
    },
  };
}

async function loadDelinquencyPolicy(academyId: string): Promise<DelinquencyPolicy> {
  const { data, error } = await fetchSupabase<AcademyPreferencesRow[]>(
    `academies?id=eq.${encodeURIComponent(academyId)}&select=preferences&limit=1`
  );

  if (error || !data?.[0]) {
    return { ...BILLING_POLICIES_DEFAULTS.delinquency };
  }

  return getEffectiveBillingPolicies(data[0].preferences).delinquency;
}

async function loadPaymentsByStudentMap(
  academyId: string,
  studentIds: string[],
): Promise<Map<string, UserBillingSnapshot[]>> {
  if (studentIds.length === 0) {
    return new Map();
  }

  const { data, error } = await fetchSupabase<DbPaymentStatusRow[]>(
    `financial_charges_view?academy_id=eq.${encodeURIComponent(academyId)}&student_id=in.${toInFilter(studentIds)}&select=id,student_id,amount,status,method,due_date,paid_at,created_at,asaas_status,invoice_url,bank_slip_url,is_asaas_managed,charge_origin,asaas_charge_id,asaas_payment_id`
  );

  if (error || !data) {
    return new Map();
  }

  const map = new Map<string, UserBillingSnapshot[]>();

  data.forEach((row) => {
    const current = map.get(row.student_id) || [];
    current.push(mapPaymentSnapshot(row));
    map.set(row.student_id, current);
  });

  return map;
}

async function loadDelinquencyMap(
  academyId: string,
  studentIds: string[],
): Promise<Map<string, UserDelinquencySnapshot>> {
  if (studentIds.length === 0) {
    return new Map();
  }

  const { data, error } = await fetchSupabase<DbDelinquencyRow[]>(
    `student_delinquency_view?academy_id=eq.${encodeURIComponent(academyId)}&student_id=in.${toInFilter(studentIds)}&select=student_id,overdue_count,overdue_total,oldest_overdue_date,days_delinquent`
  );

  if (error || !data) {
    return new Map();
  }

  const map = new Map<string, UserDelinquencySnapshot>();

  data.forEach((row) => {
    if (!row.student_id) {
      return;
    }

    map.set(row.student_id, {
      overdueCount: Number(row.overdue_count || 0),
      overdueTotal: Number(row.overdue_total || 0),
      oldestOverdueDate: row.oldest_overdue_date,
      daysDelinquent: Number(row.days_delinquent || 0),
    });
  });

  return map;
}

async function loadLatestContractAcceptanceMap(
  academyId: string,
  studentIds: string[],
): Promise<Map<string, ContractAcceptanceInfo>> {
  if (studentIds.length === 0) {
    return new Map();
  }

  const { data, error } = await fetchSupabase<DbContractAcceptanceRow[]>(
    `contract_acceptances?academy_id=eq.${encodeURIComponent(academyId)}&student_id=in.${toInFilter(studentIds)}&select=student_id,accepted_at,terms_version,template_id&order=accepted_at.desc`
  );

  if (error || !data) {
    return new Map();
  }

  const map = new Map<string, ContractAcceptanceInfo>();

  data.forEach((row) => {
    if (!map.has(row.student_id)) {
      map.set(row.student_id, {
        acceptedAt: row.accepted_at,
        termsVersion: row.terms_version,
        templateId: row.template_id,
      });
    }
  });

  return map;
}

async function enrichUsersWithOperationalStatus(
  users: User[],
  academyId: string,
  options?: { includeContractAcceptance?: boolean },
): Promise<User[]> {
  if (users.length === 0) {
    return users;
  }

  const studentIds = [...new Set(users.map((user) => user.id))];
  const [paymentsByStudent, delinquencyMap, delinquencyPolicy, contractAcceptanceMap] = await Promise.all([
    loadPaymentsByStudentMap(academyId, studentIds),
    loadDelinquencyMap(academyId, studentIds),
    loadDelinquencyPolicy(academyId),
    options?.includeContractAcceptance
      ? loadLatestContractAcceptanceMap(academyId, studentIds)
      : Promise.resolve(new Map<string, ContractAcceptanceInfo>()),
  ]);

  return users.map((user) => {
    const payments = paymentsByStudent.get(user.id) || [];
    const delinquency = delinquencyMap.get(user.id) || {
      overdueCount: 0,
      overdueTotal: 0,
      oldestOverdueDate: null,
      daysDelinquent: 0,
    };
    const registration = mapRegistrationStatus(user.status, user.statusReason);
    const { summary: financial, billingSnapshot } = resolveFinancialStatus(user, payments, delinquency);
    const access = resolveAccessStatus(user, financial, delinquencyPolicy);

    return {
      ...user,
      operationalStatus: {
        registration,
        financial,
        access,
      },
      billingSnapshot,
      contractAcceptance: contractAcceptanceMap.get(user.id) || null,
    };
  });
}

function dbRowToUser(row: DbStudentRow): User {
  return {
    id: row.id,
    registrationId: row.registration_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    document: row.document,
    avatarUrl: row.avatar_url,
    userType: 'student',
    
    unitId: row.unit_id,
    unitName: row.unit_name,
    academyId: row.academy_id,
    academyName: row.academy_name,
    
    registrationOrigin: (row.registration_origin as RegistrationOrigin) || 'app',
    createdAt: row.created_at,
    
    status: row.status,
    statusReason: row.status_reason,
    statusSince: row.status_since,
    
    birthDate: row.birth_date,
    address: row.address,
    emergencyContact: row.emergency_contact,
    
    currentPlan: row.plan_name ? {
      name: row.plan_name,
      status: row.plan_status,
      expiresAt: row.plan_expires_at,
    } : null,

    operationalStatus: buildDefaultOperationalStatus(row.status, row.status_reason),
    billingSnapshot: null,
    contractAcceptance: null,
  };
}

// ============================================================================
// SERVIÇO
// ============================================================================

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_USERS === 'true';

function log(...args: unknown[]) {
  if (DEBUG) console.log('[UsersService]', ...args);
}

/**
 * Busca todos os alunos da academy do usuário logado
 */
export async function getUsers(): Promise<UsersListResult> {
  log('getUsers()');

  const academyId = await getActiveUsersAcademyId();
  if (!academyId) {
    return { users: [], total: 0 };
  }
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(
    `student_list_view?academy_id=eq.${encodeURIComponent(academyId)}&select=*&order=full_name.asc`
  );
  
  if (error || !data) {
    console.error('[UsersService] Erro ao buscar usuários:', error);
    return { users: [], total: 0 };
  }
  
  const users = await enrichUsersWithOperationalStatus(data.map(dbRowToUser), academyId);
  log('getUsers() ->', users.length, 'usuários');
  
  return { users, total: users.length };
}

/**
 * Busca um aluno pelo ID
 */
export async function getUserById(id: string): Promise<User | null> {
  log('getUserById()', id);

  const academyId = await getActiveUsersAcademyId();
  if (!academyId) {
    return null;
  }
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(
    `student_list_view?id=eq.${encodeURIComponent(id)}&academy_id=eq.${encodeURIComponent(academyId)}&select=*&limit=1`
  );
  
  if (error || !data || data.length === 0) {
    console.error('[UsersService] Erro ao buscar usuário:', error);
    return null;
  }
  
  const [user] = await enrichUsersWithOperationalStatus(
    [dbRowToUser(data[0])],
    academyId,
    { includeContractAcceptance: true },
  );
  log('getUserById() ->', user.fullName);
  
  return user;
}

/**
 * Filtra alunos por status
 */
export async function filterUsersByStatus(status: UserStatus | 'all'): Promise<UsersListResult> {
  log('filterUsersByStatus()', status);

  const academyId = await getActiveUsersAcademyId();
  if (!academyId) {
    return { users: [], total: 0 };
  }
  
  let endpoint = `student_list_view?academy_id=eq.${encodeURIComponent(academyId)}&select=*&order=full_name.asc`;
  
  if (status !== 'all') {
    endpoint += `&status=eq.${status}`;
  }
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(endpoint);
  
  if (error || !data) {
    console.error('[UsersService] Erro ao filtrar usuários:', error);
    return { users: [], total: 0 };
  }
  
  const users = await enrichUsersWithOperationalStatus(data.map(dbRowToUser), academyId);
  log('filterUsersByStatus() ->', users.length, 'usuários');
  
  return { users, total: users.length };
}

/**
 * Busca alunos por texto (nome, email ou matrícula)
 */
export async function searchUsers(query: string): Promise<UsersListResult> {
  log('searchUsers()', query);
  
  if (!query.trim()) {
    return getUsers();
  }

  const academyId = await getActiveUsersAcademyId();
  if (!academyId) {
    return { users: [], total: 0 };
  }
  
  // Busca case-insensitive usando ilike
  const searchTerm = query.toLowerCase();
  const endpoint = `student_list_view?academy_id=eq.${encodeURIComponent(academyId)}&select=*&order=full_name.asc&or=(full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*,registration_id.ilike.*${searchTerm}*)`;
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(endpoint);
  
  if (error || !data) {
    console.error('[UsersService] Erro ao buscar usuários:', error);
    return { users: [], total: 0 };
  }
  
  const users = await enrichUsersWithOperationalStatus(data.map(dbRowToUser), academyId);
  log('searchUsers() ->', users.length, 'usuários');
  
  return { users, total: users.length };
}

/**
 * Busca alunos com filtro combinado (status + busca)
 */
export async function searchAndFilterUsers(
  query: string,
  status: UserStatus | 'all'
): Promise<UsersListResult> {
  log('searchAndFilterUsers()', { query, status });

  const academyId = await getActiveUsersAcademyId();
  if (!academyId) {
    return { users: [], total: 0 };
  }
  
  let endpoint = `student_list_view?academy_id=eq.${encodeURIComponent(academyId)}&select=*&order=full_name.asc`;
  
  // Filtro de status
  if (status !== 'all') {
    endpoint += `&status=eq.${status}`;
  }
  
  // Filtro de busca
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    endpoint += `&or=(full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*,registration_id.ilike.*${searchTerm}*)`;
  }
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(endpoint);
  
  if (error || !data) {
    console.error('[UsersService] Erro ao buscar usuários:', error);
    return { users: [], total: 0 };
  }
  
  const users = await enrichUsersWithOperationalStatus(data.map(dbRowToUser), academyId);
  log('searchAndFilterUsers() ->', users.length, 'usuários');
  
  return { users, total: users.length };
}

export async function getLatestContractAcceptanceByStudent(studentId: string): Promise<ContractAcceptanceInfo | null> {
  const academyId = await getActiveUsersAcademyId();
  if (!academyId) {
    return null;
  }

  const map = await loadLatestContractAcceptanceMap(academyId, [studentId]);
  return map.get(studentId) || null;
}

// ============================================================================
// FUNÇÕES AUXILIARES (compatibilidade com usersMock)
// ============================================================================

export function formatDate(dateString: string | null): string {
  if (!dateString || dateString === '-') return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateTimeString: string | null): string {
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
