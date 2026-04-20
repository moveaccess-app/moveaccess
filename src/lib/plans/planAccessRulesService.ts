import { getActiveAcademyId } from '@/lib/supabase/academyScope';

// ─── Types ───────────────────────────────────────────────────

export interface PlanAccessRule {
  id: string;
  planId: string;
  academyId: string;
  allowedUnits: string[] | null;
  allowedWeekdays: number[] | null;
  allowedStartTime: string | null;
  allowedEndTime: string | null;
}

export interface PlanAccessRuleInput {
  allowedUnits: string[] | null;
  allowedWeekdays: number[] | null;
  allowedStartTime: string | null;
  allowedEndTime: string | null;
}

interface DbRow {
  id: string;
  academy_id: string;
  plan_id: string;
  allowed_units: string[] | null;
  allowed_weekdays: number[] | null;
  allowed_start_time: string | null;
  allowed_end_time: string | null;
  created_at: string;
}

// ─── REST helpers ────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const projectRef = API_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  const stored = localStorage.getItem(`sb-${projectRef}-auth-token`);
  if (!stored) return null;
  try {
    return JSON.parse(stored).access_token || null;
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
  const defaultPrefer = method === 'GET' || method === 'DELETE' ? 'return=minimal' : 'return=representation';

  try {
    const response = await fetch(`${API_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: defaultPrefer,
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { data: null, error: (err as { message?: string }).message || `Erro ${response.status}` };
    }

    if (response.status === 204 || method === 'DELETE') {
      return { data: null, error: null };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// ─── Mappers ─────────────────────────────────────────────────

function rowToRule(row: DbRow): PlanAccessRule {
  return {
    id: row.id,
    planId: row.plan_id,
    academyId: row.academy_id,
    allowedUnits: row.allowed_units,
    allowedWeekdays: row.allowed_weekdays,
    allowedStartTime: row.allowed_start_time ? row.allowed_start_time.slice(0, 5) : null,
    allowedEndTime: row.allowed_end_time ? row.allowed_end_time.slice(0, 5) : null,
  };
}

// ─── CRUD ────────────────────────────────────────────────────

export async function getPlanAccessRule(planId: string): Promise<PlanAccessRule | null> {
  const { data } = await fetchSupabase<DbRow[]>(
    `plan_access_rules?plan_id=eq.${encodeURIComponent(planId)}&select=*&limit=1`
  );
  if (!data?.[0]) return null;
  return rowToRule(data[0]);
}

export async function savePlanAccessRule(
  planId: string,
  input: PlanAccessRuleInput
): Promise<{ success: boolean; error?: string }> {
  const academyId = await getActiveAcademyId();
  if (!academyId) return { success: false, error: 'Academia não encontrada.' };

  const hasAnyRestriction =
    (input.allowedUnits && input.allowedUnits.length > 0) ||
    (input.allowedWeekdays && input.allowedWeekdays.length > 0) ||
    input.allowedStartTime ||
    input.allowedEndTime;

  if (!hasAnyRestriction) {
    return deletePlanAccessRule(planId);
  }

  const payload = {
    plan_id: planId,
    academy_id: academyId,
    allowed_units: input.allowedUnits?.length ? input.allowedUnits : null,
    allowed_weekdays: input.allowedWeekdays?.length ? input.allowedWeekdays : null,
    allowed_start_time: input.allowedStartTime || null,
    allowed_end_time: input.allowedEndTime || null,
  };

  const { error } = await fetchSupabase(
    `plan_access_rules?on_conflict=plan_id`,
    {
      method: 'POST',
      headers: { Prefer: 'return=minimal,resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    }
  );

  if (error) return { success: false, error };

  await syncAccessRulesJsonb(planId, input);
  return { success: true };
}

export async function deletePlanAccessRule(
  planId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await fetchSupabase(
    `plan_access_rules?plan_id=eq.${encodeURIComponent(planId)}`,
    { method: 'DELETE' }
  );

  if (error) return { success: false, error };

  await syncAccessRulesJsonb(planId, {
    allowedUnits: null,
    allowedWeekdays: null,
    allowedStartTime: null,
    allowedEndTime: null,
  });
  return { success: true };
}

// ─── Sync to plans.access_rules JSONB (for list display) ────

async function syncAccessRulesJsonb(planId: string, input: PlanAccessRuleInput) {
  const accessRules: Record<string, unknown> = {};

  if (input.allowedWeekdays?.length) {
    accessRules.allowedDays = input.allowedWeekdays;
  }
  if (input.allowedUnits?.length) {
    accessRules.allowedUnits = input.allowedUnits;
  }
  if (input.allowedStartTime || input.allowedEndTime) {
    accessRules.allowedHours = {
      ...(input.allowedStartTime ? { start: input.allowedStartTime } : {}),
      ...(input.allowedEndTime ? { end: input.allowedEndTime } : {}),
    };
  }

  await fetchSupabase(
    `plans?id=eq.${encodeURIComponent(planId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        access_rules: Object.keys(accessRules).length > 0 ? accessRules : {},
        updated_at: new Date().toISOString(),
      }),
    }
  );
}

// ─── Summary helpers ─────────────────────────────────────────

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function formatAccessRuleSummary(
  rule: PlanAccessRule | null,
  unitMap?: Map<string, string>
): string {
  if (!rule) return 'Acesso livre';

  const parts: string[] = [];

  if (rule.allowedUnits?.length) {
    if (unitMap) {
      const names = rule.allowedUnits.map(id => unitMap.get(id) || id.slice(0, 8));
      parts.push(names.join(', '));
    } else {
      parts.push(`${rule.allowedUnits.length} unidade(s)`);
    }
  }

  if (rule.allowedWeekdays?.length) {
    const days = rule.allowedWeekdays.map(d => WEEKDAY_LABELS[d] || String(d));
    if (rule.allowedWeekdays.length === 5 &&
      [1, 2, 3, 4, 5].every(d => rule.allowedWeekdays!.includes(d))) {
      parts.push('Seg a Sex');
    } else if (rule.allowedWeekdays.length === 2 &&
      [0, 6].every(d => rule.allowedWeekdays!.includes(d))) {
      parts.push('Finais de semana');
    } else {
      parts.push(days.join(', '));
    }
  }

  if (rule.allowedStartTime || rule.allowedEndTime) {
    parts.push(`${rule.allowedStartTime || '00:00'}–${rule.allowedEndTime || '23:59'}`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Acesso livre';
}
