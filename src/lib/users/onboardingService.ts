import { createClient } from '@/lib/supabase/client';
import { getActiveAcademyId, getBrowserAccessToken } from '@/lib/supabase/academyScope';
import {
  buildStepState,
  type OnboardingCollectedData,
  type OnboardingSession,
  type OnboardingStep,
  type OnboardingDraftStatus,
} from './onboardingTypes';

interface StaffContext {
  userId: string;
  academyId: string;
}

interface DraftRow {
  id: string;
  academy_id: string;
  unit_id: string | null;
  created_by: string;
  current_step: OnboardingStep;
  status: OnboardingDraftStatus;
  origin: 'staff' | 'self_registration' | 'invite_link';
  collected_data: OnboardingCollectedData;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  published_at: string | null;
  published_user_id: string | null;
}

interface FinalizeDraftResult {
  success: boolean;
  draft_id?: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  already_published?: boolean;
  error?: string;
  error_code?: string;
  activation?: {
    activated: boolean;
    already_existed?: boolean;
    subscription_id?: string;
    payment_id?: string;
    plan_name?: string;
    plan_price?: number;
    billing_cycle?: string;
    reason?: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getFinalizeDraftErrorMessage(error?: string, errorCode?: string): string {
  const normalized = errorCode || error || '';

  switch (normalized) {
    case 'DUPLICATE_CPF_CURRENT_ACADEMY':
      return 'Este CPF já está cadastrado nesta academia.';
    case 'DUPLICATE_CPF_DIFFERENT_ACCOUNT':
      return 'Este CPF já está vinculado a outro cadastro. Use o mesmo e-mail do aluno ou ajuste o cadastro existente antes de concluir.';
    case 'DUPLICATE_CPF_NON_STUDENT_PROFILE':
      return 'Este CPF já está vinculado a outro tipo de conta. Revise o cadastro antes de concluir.';
    case 'MISSING_REQUIRED_FIELDS':
      return 'Preencha os dados obrigatórios do aluno antes de concluir o cadastro.';
    default:
      break;
  }

  if (normalized.includes('idx_profiles_cpf') || normalized.includes('profiles_cpf_unique')) {
    return 'Este CPF já está cadastrado. Revise o aluno existente antes de concluir.';
  }

  return error || 'Falha ao publicar onboarding';
}

async function fetchRest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = await getBrowserAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return { data: null, error: 'Não autenticado' };
  }

  try {
    const response = await fetch(`${API_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
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

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

async function fetchRpc<T>(
  rpcName: string,
  payload: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const token = await getBrowserAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return { data: null, error: 'Não autenticado' };
  }

  try {
    const response = await fetch(`${API_URL}/rest/v1/rpc/${rpcName}`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

function mapDraftToSession(draft: DraftRow): OnboardingSession {
  return {
    id: draft.id,
    academyId: draft.academy_id,
    unitId: draft.unit_id,
    createdBy: draft.created_by,
    currentStep: draft.current_step,
    status: draft.status,
    origin: draft.origin,
    collectedData: draft.collected_data || {},
    steps: buildStepState(draft.current_step),
    createdAt: draft.created_at,
    updatedAt: draft.updated_at,
    completedAt: draft.completed_at || undefined,
    publishedAt: draft.published_at || undefined,
    publishedUserId: draft.published_user_id || undefined,
  };
}

async function getStaffContext(): Promise<StaffContext> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error('Usuário não autenticado');
  }

  const academyId = await getActiveAcademyId();

  if (!academyId) {
    throw new Error('Não foi possível identificar a academia do usuário');
  }

  return {
    userId: userData.user.id,
    academyId,
  };
}

export async function initOrResumeOnboardingSession(): Promise<OnboardingSession> {
  const context = await getStaffContext();

  const { data: existingDrafts, error: draftError } = await fetchRest<DraftRow[]>(
    `student_drafts?created_by=eq.${context.userId}&origin=eq.staff&status=in.(in_progress,completed)&select=*&order=updated_at.desc&limit=1`
  );

  if (draftError) {
    throw new Error(draftError);
  }

  if (existingDrafts && existingDrafts.length > 0) {
    return mapDraftToSession(existingDrafts[0]);
  }

  const payload = {
    academy_id: context.academyId,
    unit_id: null,
    created_by: context.userId,
    current_step: 'identification',
    status: 'in_progress',
    origin: 'staff',
    collected_data: {},
  };

  const { data: insertedDrafts, error: insertError } = await fetchRest<DraftRow[]>(
    'student_drafts',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (insertError || !insertedDrafts || insertedDrafts.length === 0) {
    throw new Error(insertError || 'Falha ao criar rascunho');
  }

  return mapDraftToSession(insertedDrafts[0]);
}

export async function updateDraftSession(
  draftId: string,
  payload: {
    currentStep: OnboardingStep;
    status: OnboardingDraftStatus;
    collectedData: OnboardingCollectedData;
    completedAt?: string | null;
  }
): Promise<OnboardingSession> {
  const patch = {
    current_step: payload.currentStep,
    status: payload.status,
    collected_data: payload.collectedData,
    completed_at: payload.completedAt ?? null,
  };

  const { data: updatedRows, error } = await fetchRest<DraftRow[]>(
    `student_drafts?id=eq.${draftId}&select=*`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }
  );

  if (error || !updatedRows || updatedRows.length === 0) {
    throw new Error(error || 'Falha ao salvar onboarding');
  }

  return mapDraftToSession(updatedRows[0]);
}

export async function abandonOnboardingSession(draftId: string): Promise<void> {
  const { error } = await fetchRest<DraftRow[]>(`student_drafts?id=eq.${draftId}&select=*`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'abandoned' }),
  });

  if (error) {
    throw new Error(error);
  }
}

export async function finalizeOnboardingDraft(draftId: string): Promise<FinalizeDraftResult> {
  const { data, error } = await fetchRpc<FinalizeDraftResult>('finalize_student_draft', {
    p_draft_id: draftId,
  });

  if (error || !data) {
    throw new Error(getFinalizeDraftErrorMessage(error));
  }

  if (!data.success) {
    throw new Error(getFinalizeDraftErrorMessage(data.error, data.error_code));
  }

  return data;
}

// ─── External billing activation ─────────────────────────────────

export type ExternalBillingStatus =
  | 'completed_with_billing'
  | 'completed_local_only'
  | 'pending_external_billing'
  | 'failed_external_billing'
  | 'already_exists';

export interface ExternalBillingResult {
  status: ExternalBillingStatus;
  billingPath: 'subscription' | 'charge' | null;
  reason?: string;
  asaasSubscriptionId?: string;
  asaasChargeId?: string;
  asaasPaymentId?: string;
  paymentLink?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  bankSlipIdentificationField?: string | null;
  bankSlipBarCode?: string | null;
  bankSlipNossoNumero?: string | null;
  pixCopyPaste?: string | null;
  pixQrCodeImage?: string | null;
  pixQrCodeExpirationDate?: string | null;
  environment?: string;
}

export async function activateExternalBilling(
  subscriptionId: string,
  paymentId: string,
): Promise<ExternalBillingResult> {
  try {
    const response = await fetch('/api/billing/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, paymentId }),
    });

    if (!response.ok) {
      return {
        status: 'failed_external_billing',
        billingPath: null,
        reason: `API_ERROR_${response.status}`,
      };
    }

    return await response.json();
  } catch {
    return {
      status: 'failed_external_billing',
      billingPath: null,
      reason: 'NETWORK_ERROR',
    };
  }
}

export async function reconcileExternalCharge(
  chargeId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/asaas/charges/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chargeId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `API_ERROR_${response.status}`,
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'NETWORK_ERROR',
    };
  }
}
