/**
 * Student Portal Service
 * Fetches aggregated portal data for the authenticated student via RPC.
 */

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ─── Types ───────────────────────────────────────────────────────

export interface StudentPortalSubscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  billingCycle: string;
  price: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
}

export interface StudentPortalPayment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  billingType: string | null;
  asaasStatus: string | null;
  chargeOrigin: 'local' | 'asaas';
}

export interface StudentPortalDelinquency {
  isDelinquent: boolean;
  overdueCount: number;
  overdueTotal: number;
  oldestOverdueDate: string | null;
  daysDelinquent: number;
}

export interface StudentPortalContract {
  id: string;
  termsVersion: string;
  acceptedAt: string;
  templateId: string | null;
  templateVersion: number | null;
  templateName: string | null;
  contentSnapshot: string | null;
}

export interface StudentPortalAccessLog {
  id: string;
  unitId: string;
  unitName: string;
  method: string;
  status: 'allowed' | 'denied';
  accessEvent: 'entry' | 'exit' | null;
  denialReason: string | null;
  occurredAt: string;
}

export interface StudentPortalData {
  subscription: StudentPortalSubscription | null;
  payments: StudentPortalPayment[];
  delinquency: StudentPortalDelinquency;
  contract: StudentPortalContract | null;
  accessLogs: StudentPortalAccessLog[];
}

// ─── Auth helper ─────────────────────────────────────────────────

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

// ─── Service ─────────────────────────────────────────────────────

export async function getStudentPortalData(
  academyId: string
): Promise<{ data: StudentPortalData | null; error: string | null }> {
  const token = getAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return { data: null, error: 'Não autenticado' };
  }

  try {
    const response = await fetch(`${API_URL}/rest/v1/rpc/get_student_portal_data`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_academy_id: academyId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    const result = await response.json();

    // RPC returns a jsonb — could be the data or an error object
    if (result?.error) {
      return { data: null, error: result.message || result.error };
    }

    return {
      data: {
        subscription: result.subscription ?? null,
        payments: result.payments ?? [],
        delinquency: result.delinquency ?? {
          isDelinquent: false,
          overdueCount: 0,
          overdueTotal: 0,
          oldestOverdueDate: null,
          daysDelinquent: 0,
        },
        contract: result.contract ?? null,
        accessLogs: result.accessLogs ?? [],
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao carregar dados do portal',
    };
  }
}
