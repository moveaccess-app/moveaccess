import { getActiveAcademyId, getBrowserAccessToken } from '@/lib/supabase/academyScope';

export type PlanBillingCycle = 'monthly' | 'yearly' | 'custom';
export type PlanStatus = 'active' | 'inactive';

export interface PlanAccessRules {
  allowedDays?: number[];
  allowedUnits?: string[];
  allowedHours?: {
    start?: string;
    end?: string;
  };
  dailyCheckInLimit?: number | null;
  notes?: string;
}

export interface Plan {
  id: string;
  academyId: string;
  name: string;
  description: string;
  price: number;
  billingCycle: PlanBillingCycle;
  status: PlanStatus;
  accessRules: PlanAccessRules;
  createdAt: string;
  updatedAt: string;
}

export interface PlanInput {
  name: string;
  description: string;
  price: number;
  billingCycle: PlanBillingCycle;
  status?: PlanStatus;
  accessRules?: PlanAccessRules;
}

interface DbPlanRow {
  id: string;
  academy_id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  billing_cycle: PlanBillingCycle;
  status: PlanStatus;
  access_rules: PlanAccessRules | null;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

export const PLAN_BILLING_CYCLE_LABELS: Record<PlanBillingCycle, string> = {
  monthly: 'Mensal',
  yearly: 'Anual',
  custom: 'Personalizado',
};

async function fetchSupabase<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = await getBrowserAccessToken();

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

function normalizeAccessRules(value: PlanAccessRules | null | undefined): PlanAccessRules {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return {
    allowedDays: Array.isArray(value.allowedDays)
      ? value.allowedDays.filter((day): day is number => typeof day === 'number')
      : undefined,
    allowedUnits: Array.isArray(value.allowedUnits)
      ? value.allowedUnits.filter((unit): unit is string => typeof unit === 'string' && unit.trim().length > 0)
      : undefined,
    allowedHours: value.allowedHours
      ? {
          start: value.allowedHours.start || undefined,
          end: value.allowedHours.end || undefined,
        }
      : undefined,
    dailyCheckInLimit:
      typeof value.dailyCheckInLimit === 'number' ? value.dailyCheckInLimit : null,
    notes: typeof value.notes === 'string' ? value.notes : undefined,
  };
}

function rowToPlan(row: DbPlanRow): Plan {
  return {
    id: row.id,
    academyId: row.academy_id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    billingCycle: row.billing_cycle,
    status: row.status,
    accessRules: normalizeAccessRules(row.access_rules),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializePlanInput(input: Partial<PlanInput> & { academyId?: string }): Partial<DbPlanRow> {
  return {
    ...(input.academyId ? { academy_id: input.academyId } : {}),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.price !== undefined ? { price: Number(input.price) } : {}),
    ...(input.billingCycle !== undefined ? { billing_cycle: input.billingCycle } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.accessRules !== undefined ? { access_rules: normalizeAccessRules(input.accessRules) } : {}),
    updated_at: new Date().toISOString(),
  };
}

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await fetchSupabase<DbPlanRow[]>(
    'plans?select=*&order=updated_at.desc'
  );

  if (error || !data) {
    return [];
  }

  return data.map(rowToPlan);
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const { data, error } = await fetchSupabase<DbPlanRow[]>(
    `plans?id=eq.${id}&select=*&limit=1`
  );

  if (error || !data?.[0]) {
    return null;
  }

  return rowToPlan(data[0]);
}

export async function createPlan(input: PlanInput): Promise<{ success: boolean; plan?: Plan; error?: string }> {
  const academyId = await getActiveAcademyId();

  if (!academyId) {
    return { success: false, error: 'Academia não encontrada para o usuário logado.' };
  }

  const payload = {
    ...serializePlanInput(input),
    academy_id: academyId,
    status: input.status ?? 'active',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await fetchSupabase<DbPlanRow[]>(
    'plans?select=*',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível criar o plano.' };
  }

  return { success: true, plan: rowToPlan(data[0]) };
}

export async function updatePlan(
  id: string,
  input: Partial<PlanInput>
): Promise<{ success: boolean; plan?: Plan; error?: string }> {
  const payload = serializePlanInput(input);

  const { data, error } = await fetchSupabase<DbPlanRow[]>(
    `plans?id=eq.${id}&select=*`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível atualizar o plano.' };
  }

  return { success: true, plan: rowToPlan(data[0]) };
}

export async function archivePlan(id: string): Promise<{ success: boolean; plan?: Plan; error?: string }> {
  return updatePlan(id, { status: 'inactive' });
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatPlanUpdatedAt(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getPlanStatusLabel(status: PlanStatus): string {
  return PLAN_STATUS_LABELS[status] || status;
}

export function getBillingCycleLabel(cycle: PlanBillingCycle): string {
  return PLAN_BILLING_CYCLE_LABELS[cycle] || cycle;
}
