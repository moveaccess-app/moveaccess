/**
 * Public Plans Catalog Service
 *
 * Loads active plans for an academy via the get_public_plans_catalog RPC.
 * Works for both authenticated (staff) and unauthenticated (public signup) contexts.
 */

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface CatalogPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  accessRules?: Record<string, unknown>;
}

interface CatalogRpcResponse {
  success: boolean;
  plans: CatalogPlan[];
}

export async function getPublicCatalogPlans(academyId: string): Promise<CatalogPlan[]> {
  if (!API_URL || !API_KEY) return [];

  try {
    const response = await fetch(`${API_URL}/rest/v1/rpc/get_public_plans_catalog`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_academy_id: academyId }),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as CatalogRpcResponse;
    if (!data?.success || !Array.isArray(data.plans)) return [];

    return data.plans.map((p) => ({
      ...p,
      price: Number(p.price),
    }));
  } catch {
    return [];
  }
}

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  yearly: 'Anual',
  custom: 'Personalizado',
};

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
