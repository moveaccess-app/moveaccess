import { getActiveAcademyId } from '@/lib/supabase/academyScope';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type SubscriptionBillingCycle = 'monthly' | 'yearly' | 'custom';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

export interface SubscriptionStudent {
  id: string;
  fullName: string;
  email: string;
  document: string;
  registrationId: string;
  status: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  price: number;
  billingCycle: SubscriptionBillingCycle;
}

export interface Subscription {
  id: string;
  academyId: string;
  studentId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  billingCycle: SubscriptionBillingCycle;
  price: number;
  notes: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: SubscriptionStudent | null;
  plan: SubscriptionPlan | null;
}

export interface SubscriptionInput {
  studentId: string;
  planId: string;
  status?: SubscriptionStatus;
  startedAt: string;
  expiresAt?: string | null;
  billingCycle: SubscriptionBillingCycle;
  price: number;
  notes?: string;
}

export interface SubscriptionUpdateInput {
  planId?: string;
  status?: SubscriptionStatus;
  startedAt?: string;
  expiresAt?: string | null;
  billingCycle?: SubscriptionBillingCycle;
  price?: number;
  notes?: string;
  cancelledAt?: string | null;
}

interface DbSubscriptionRow {
  id: string;
  academy_id: string;
  student_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  billing_cycle: SubscriptionBillingCycle;
  price: number | string;
  notes: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DbStudentLookupRow {
  id: string;
  full_name: string;
  email: string;
  document: string | null;
  registration_id: string | null;
  status: string;
}

interface DbPlanLookupRow {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  price: number | string | null;
  billing_cycle: SubscriptionBillingCycle;
}

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
};

export const SUBSCRIPTION_STATUS_VARIANTS: Record<SubscriptionStatus, BadgeVariant> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'destructive',
  expired: 'secondary',
};

export const SUBSCRIPTION_BILLING_CYCLE_LABELS: Record<SubscriptionBillingCycle, string> = {
  monthly: 'Mensal',
  yearly: 'Anual',
  custom: 'Personalizado',
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

async function fetchSupabase<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
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

function toInFilter(values: string[]): string {
  return `(${values.map((value) => encodeURIComponent(value)).join(',')})`;
}

async function loadStudentsMap(studentIds: string[]): Promise<Map<string, SubscriptionStudent>> {
  if (studentIds.length === 0) {
    return new Map();
  }

  const { data, error } = await fetchSupabase<DbStudentLookupRow[]>(
    `student_list_view?select=id,full_name,email,document,registration_id,status&id=in.${toInFilter(studentIds)}`
  );

  if (error || !data) {
    return new Map();
  }

  return new Map(
    data.map((student) => [
      student.id,
      {
        id: student.id,
        fullName: student.full_name,
        email: student.email,
        document: student.document || '',
        registrationId: student.registration_id || 'SEM-MATRICULA',
        status: student.status,
      },
    ])
  );
}

async function loadPlansMap(planIds: string[]): Promise<Map<string, SubscriptionPlan>> {
  if (planIds.length === 0) {
    return new Map();
  }

  const { data, error } = await fetchSupabase<DbPlanLookupRow[]>(
    `plans?select=id,name,description,status,price,billing_cycle&id=in.${toInFilter(planIds)}`
  );

  if (error || !data) {
    return new Map();
  }

  return new Map(
    data.map((plan) => [
      plan.id,
      {
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        status: plan.status,
        price: Number(plan.price || 0),
        billingCycle: plan.billing_cycle,
      },
    ])
  );
}

function rowToSubscription(
  row: DbSubscriptionRow,
  students: Map<string, SubscriptionStudent>,
  plans: Map<string, SubscriptionPlan>
): Subscription {
  return {
    id: row.id,
    academyId: row.academy_id,
    studentId: row.student_id,
    planId: row.plan_id,
    status: row.status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    billingCycle: row.billing_cycle,
    price: Number(row.price || 0),
    notes: row.notes || '',
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    student: students.get(row.student_id) || null,
    plan: plans.get(row.plan_id) || null,
  };
}

function serializeInput(
  input: SubscriptionInput | SubscriptionUpdateInput,
  academyId?: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (academyId) payload.academy_id = academyId;
  if ('studentId' in input && input.studentId !== undefined) payload.student_id = input.studentId;
  if (input.planId !== undefined) payload.plan_id = input.planId;
  if (input.status !== undefined) payload.status = input.status;
  if (input.startedAt !== undefined) payload.started_at = input.startedAt;
  if (input.expiresAt !== undefined) payload.expires_at = input.expiresAt;
  if (input.billingCycle !== undefined) payload.billing_cycle = input.billingCycle;
  if (input.price !== undefined) payload.price = Number(input.price);
  if (input.notes !== undefined) payload.notes = input.notes.trim();
  if ('cancelledAt' in input && input.cancelledAt !== undefined) payload.cancelled_at = input.cancelledAt;

  return payload;
}

async function enrichSubscriptions(rows: DbSubscriptionRow[]): Promise<Subscription[]> {
  const studentIds = Array.from(new Set(rows.map((row) => row.student_id)));
  const planIds = Array.from(new Set(rows.map((row) => row.plan_id)));

  const [students, plans] = await Promise.all([
    loadStudentsMap(studentIds),
    loadPlansMap(planIds),
  ]);

  return rows.map((row) => rowToSubscription(row, students, plans));
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await fetchSupabase<DbSubscriptionRow[]>(
    'subscriptions?select=*&order=updated_at.desc'
  );

  if (error || !data) {
    return [];
  }

  return enrichSubscriptions(data);
}

export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  const { data, error } = await fetchSupabase<DbSubscriptionRow[]>(
    `subscriptions?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );

  if (error || !data?.[0]) {
    return null;
  }

  const [subscription] = await enrichSubscriptions([data[0]]);
  return subscription || null;
}

export async function createSubscription(
  input: SubscriptionInput
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
  const academyId = await getActiveAcademyId();

  if (!academyId) {
    return { success: false, error: 'Academia não encontrada para o usuário logado.' };
  }

  const payload = {
    ...serializeInput(input, academyId),
    created_at: new Date().toISOString(),
    status: input.status ?? 'active',
    notes: input.notes?.trim() || '',
  };

  const { data, error } = await fetchSupabase<DbSubscriptionRow[]>(
    'subscriptions?select=*',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível criar a assinatura.' };
  }

  const subscription = await getSubscriptionById(data[0].id);

  return {
    success: !!subscription,
    subscription: subscription || undefined,
    error: subscription ? undefined : 'Assinatura criada, mas não foi possível carregar os detalhes.',
  };
}

export async function updateSubscription(
  id: string,
  input: SubscriptionUpdateInput
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
  const normalizedInput: SubscriptionUpdateInput = {
    ...input,
    cancelledAt:
      input.status === 'cancelled'
        ? input.cancelledAt ?? new Date().toISOString()
        : input.status
        ? null
        : input.cancelledAt,
  };

  const { data, error } = await fetchSupabase<DbSubscriptionRow[]>(
    `subscriptions?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      method: 'PATCH',
      body: JSON.stringify(serializeInput(normalizedInput)),
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível atualizar a assinatura.' };
  }

  const subscription = await getSubscriptionById(data[0].id);

  return {
    success: !!subscription,
    subscription: subscription || undefined,
    error: subscription ? undefined : 'Assinatura atualizada, mas não foi possível carregar os detalhes.',
  };
}

export async function cancelSubscription(
  id: string,
  reason?: string
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
  const current = await getSubscriptionById(id);

  if (!current) {
    return { success: false, error: 'Assinatura não encontrada.' };
  }

  const mergedNotes = [current.notes, reason?.trim()].filter(Boolean).join('\n\n');

  const result = await updateSubscription(id, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    notes: mergedNotes,
  });

  // Fire-and-forget: cancel external Asaas subscription if it exists.
  // This is non-blocking — local cancellation succeeds regardless.
  if (result.success && current.academyId) {
    cancelExternalSubscription(id, current.academyId).catch((err) => {
      console.error('[cancelSubscription] Falha ao cancelar assinatura externa:', err);
    });
  }

  return result;
}

async function cancelExternalSubscription(
  subscriptionId: string,
  academyId: string,
): Promise<void> {
  try {
    await fetch('/api/asaas/subscriptions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, academyId }),
    });
  } catch {
    // Silently ignore — the webhook reconciliation will catch up
  }
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatSubscriptionDate(value: string | null): string {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatSubscriptionDateTime(value: string | null): string {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  return SUBSCRIPTION_STATUS_LABELS[status] || status;
}

export function getSubscriptionStatusVariant(status: SubscriptionStatus): BadgeVariant {
  return SUBSCRIPTION_STATUS_VARIANTS[status] || 'secondary';
}

export function getBillingCycleLabel(cycle: SubscriptionBillingCycle): string {
  return SUBSCRIPTION_BILLING_CYCLE_LABELS[cycle] || cycle;
}

export function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;

  const now = new Date();
  const end = new Date(expiresAt);
  const diffMs = end.getTime() - now.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getSubscriptionStats(subscriptions: Subscription[]) {
  return {
    total: subscriptions.length,
    active: subscriptions.filter((subscription) => subscription.status === 'active').length,
    paused: subscriptions.filter((subscription) => subscription.status === 'paused').length,
    cancelled: subscriptions.filter((subscription) => subscription.status === 'cancelled').length,
    expired: subscriptions.filter((subscription) => subscription.status === 'expired').length,
    monthlyRevenue: subscriptions
      .filter((subscription) => subscription.status === 'active')
      .reduce((total, subscription) => total + subscription.price, 0),
  };
}
