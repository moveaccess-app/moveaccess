/**
 * Setup Service — Client-side
 *
 * Manages the academy setup wizard state.
 * Uses existing services for data operations and direct fetch for setup tracking.
 */

import { getActiveAcademyId } from '@/lib/supabase/academyScope';

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

export interface SetupState {
  academyId: string;
  setupStep: number;
  academy: {
    tradeName: string;
    email: string;
    phone: string;
    cnpj: string;
    address: Record<string, string>;
  };
  unit: {
    id: string;
    name: string;
    address: Record<string, string>;
  } | null;
  plansCount: number;
}

/**
 * Fetch current setup state: academy data, default unit, plans count
 */
export async function getSetupState(): Promise<SetupState | null> {
  const token = getAccessToken();
  const academyId = await getActiveAcademyId();
  if (!token || !academyId || !API_URL || !API_KEY) return null;

  const headers = {
    apikey: API_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Fetch academy, units, plans count in parallel
  const [academyRes, unitsRes, plansRes] = await Promise.all([
    fetch(`${API_URL}/rest/v1/academies?id=eq.${academyId}&select=*`, { headers }),
    fetch(`${API_URL}/rest/v1/units?academy_id=eq.${academyId}&select=id,name,address&order=created_at.asc&limit=1`, { headers }),
    fetch(`${API_URL}/rest/v1/plans?academy_id=eq.${academyId}&select=id&status=eq.active`, { headers }),
  ]);

  const [academies, units, plans] = await Promise.all([
    academyRes.json(),
    unitsRes.json(),
    plansRes.json(),
  ]);

  const academy = Array.isArray(academies) ? academies[0] : null;
  if (!academy) return null;

  const unit = Array.isArray(units) && units.length > 0 ? units[0] : null;

  return {
    academyId,
    setupStep: academy.setup_step || 0,
    academy: {
      tradeName: academy.trade_name || '',
      email: academy.email || '',
      phone: academy.phone || '',
      cnpj: academy.cnpj || '',
      address: academy.address || {},
    },
    unit: unit
      ? { id: unit.id, name: unit.name || '', address: unit.address || {} }
      : null,
    plansCount: Array.isArray(plans) ? plans.length : 0,
  };
}

/**
 * Update academy data (step 1)
 */
export async function updateAcademySetup(data: {
  tradeName: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  address?: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  const token = getAccessToken();
  const academyId = await getActiveAcademyId();
  if (!token || !academyId) return { success: false, error: 'Sessão inválida' };

  const payload: Record<string, unknown> = {
    trade_name: data.tradeName,
    setup_step: 1,
  };
  if (data.phone) payload.phone = data.phone;
  if (data.email) payload.email = data.email;
  if (data.cnpj) payload.cnpj = data.cnpj;
  if (data.address) payload.address = data.address;

  const res = await fetch(`${API_URL}/rest/v1/academies?id=eq.${academyId}`, {
    method: 'PATCH',
    headers: {
      apikey: API_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return { success: false, error: 'Erro ao salvar dados da academia' };
  return { success: true };
}

/**
 * Update default unit (step 2)
 */
export async function updateUnitSetup(
  unitId: string,
  data: { name: string; address?: Record<string, string> }
): Promise<{ success: boolean; error?: string }> {
  const token = getAccessToken();
  if (!token) return { success: false, error: 'Sessão inválida' };

  const academyId = await getActiveAcademyId();

  const payload: Record<string, unknown> = { name: data.name };
  if (data.address) payload.address = data.address;

  const res = await fetch(`${API_URL}/rest/v1/units?id=eq.${unitId}&academy_id=eq.${academyId}`, {
    method: 'PATCH',
    headers: {
      apikey: API_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return { success: false, error: 'Erro ao salvar unidade' };

  // Update setup_step
  await fetch(`${API_URL}/rest/v1/academies?id=eq.${academyId}`, {
    method: 'PATCH',
    headers: {
      apikey: API_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ setup_step: 2 }),
  });

  return { success: true };
}

/**
 * Save billing choice (step 3)
 */
export async function saveBillingStep(): Promise<{ success: boolean; error?: string }> {
  const token = getAccessToken();
  const academyId = await getActiveAcademyId();
  if (!token || !academyId) return { success: false, error: 'Sessão inválida' };

  const res = await fetch(`${API_URL}/rest/v1/academies?id=eq.${academyId}`, {
    method: 'PATCH',
    headers: {
      apikey: API_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ setup_step: 3 }),
  });

  if (!res.ok) return { success: false, error: 'Erro ao salvar progresso' };
  return { success: true };
}

/**
 * Create plan from template (step 4)
 */
export async function createPlanSetup(data: {
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'custom';
}): Promise<{ success: boolean; error?: string }> {
  const token = getAccessToken();
  const academyId = await getActiveAcademyId();
  if (!token || !academyId) return { success: false, error: 'Sessão inválida' };

  const payload = {
    academy_id: academyId,
    name: data.name,
    description: '',
    price: data.price,
    billing_cycle: data.billingCycle,
    status: 'active',
    access_rules: {},
  };

  const res = await fetch(`${API_URL}/rest/v1/plans?select=id`, {
    method: 'POST',
    headers: {
      apikey: API_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return { success: false, error: 'Erro ao criar plano' };

  // Update setup_step
  await fetch(`${API_URL}/rest/v1/academies?id=eq.${academyId}`, {
    method: 'PATCH',
    headers: {
      apikey: API_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ setup_step: 4 }),
  });

  return { success: true };
}

/**
 * Skip plan step
 */
export async function skipPlanStep(): Promise<{ success: boolean; error?: string }> {
  const token = getAccessToken();
  const academyId = await getActiveAcademyId();
  if (!token || !academyId) return { success: false, error: 'Sessão inválida' };

  await fetch(`${API_URL}/rest/v1/academies?id=eq.${academyId}`, {
    method: 'PATCH',
    headers: {
      apikey: API_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ setup_step: 4 }),
  });

  return { success: true };
}

/**
 * Complete setup (step 5 — final)
 */
export async function completeSetup(): Promise<{ success: boolean; error?: string }> {
  const token = getAccessToken();
  const academyId = await getActiveAcademyId();
  if (!token || !academyId) return { success: false, error: 'Sessão inválida' };

  const res = await fetch(`${API_URL}/rest/v1/academies?id=eq.${academyId}`, {
    method: 'PATCH',
    headers: {
      apikey: API_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ setup_completed: true, setup_step: 5 }),
  });

  if (!res.ok) return { success: false, error: 'Erro ao finalizar configuração' };
  return { success: true };
}
