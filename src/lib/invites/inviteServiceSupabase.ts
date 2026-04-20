import {
  buildStepState,
  type OnboardingCollectedData,
  type OnboardingSession,
  type OnboardingDraftStatus,
  type OnboardingStep,
} from '@/lib/users/onboardingTypes';

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export interface InviteContext {
  token: string;
  academyId: string;
  academyName: string | null;
  unitId: string | null;
  unitName: string | null;
  emailHint: string | null;
  expiresAt: string;
  description: string | null;
  recipientName: string | null;
}

export type InviteValidationStatus =
  | 'pending'
  | 'claimed_self'
  | 'claimed_other'
  | 'completed'
  | 'expired'
  | 'cancelled'
  | 'target_required'
  | 'invalid';

export interface InviteValidationResult {
  status: InviteValidationStatus;
  context?: InviteContext;
}

export interface ClaimInvitePayload {
  email: string;
  fullName: string;
  phone?: string | null;
  password: string;
}

export interface ClaimInviteResult {
  success: boolean;
  userId?: string;
  draftId?: string;
  errorCode?: string;
}

interface InviteContextRpcResponse {
  success: boolean;
  error_code?: string;
  token?: string;
  academy_id?: string;
  academy_name?: string | null;
  unit_id?: string | null;
  unit_name?: string | null;
  email_hint?: string | null;
  expires_at?: string;
  description?: string | null;
  recipient_name?: string | null;
  lifecycle_status?: 'pending' | 'claimed';
  claimed_by_current_user?: boolean;
  draft_id?: string | null;
}

interface ClaimInviteRpcResponse {
  success: boolean;
  user_id?: string;
  draft_id?: string;
  error_code?: string;
}

interface InviteSignupSessionRpcResponse {
  success: boolean;
  error_code?: string;
  token?: string;
  academy_id?: string;
  academy_name?: string | null;
  unit_id?: string | null;
  unit_name?: string | null;
  email_hint?: string | null;
  description?: string | null;
  recipient_name?: string | null;
  expires_at?: string;
  draft_id?: string;
  draft_status?: OnboardingDraftStatus;
  current_step?: OnboardingStep;
  collected_data?: OnboardingCollectedData;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  published_at?: string | null;
  published_user_id?: string | null;
}

interface SaveInviteSignupProgressRpcResponse {
  success: boolean;
  error_code?: string;
  draft_id?: string;
  draft_status?: OnboardingDraftStatus;
  current_step?: OnboardingStep;
  collected_data?: OnboardingCollectedData;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  published_at?: string | null;
  published_user_id?: string | null;
}

interface CompleteInviteSignupRpcResponse {
  success: boolean;
  user_id?: string;
  academy_id?: string;
  unit_id?: string;
  error_code?: string;
  already_completed?: boolean;
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

export interface InviteSignupSessionResult {
  success: boolean;
  invite?: InviteContext;
  session?: OnboardingSession;
  errorCode?: string;
}

export interface CompleteSignupResult {
  success: boolean;
  userId?: string;
  errorCode?: string;
  activation?: {
    activated: boolean;
    alreadyExisted?: boolean;
    subscriptionId?: string;
    paymentId?: string;
    planName?: string;
    planPrice?: number;
    billingCycle?: string;
    reason?: string;
  };
}

function mapInviteErrorCodeToStatus(errorCode?: string): InviteValidationStatus {
  if (errorCode === 'TOKEN_CLAIMED') return 'claimed_other';
  if (errorCode === 'TOKEN_COMPLETED') return 'completed';
  if (errorCode === 'TOKEN_EXPIRED') return 'expired';
  if (errorCode === 'TOKEN_CANCELLED') return 'cancelled';
  if (errorCode === 'INVITE_TARGET_REQUIRED') return 'target_required';
  return 'invalid';
}

async function callRpc<T>(
  rpcName: string,
  payload: Record<string, unknown>,
  options: { requireAuth?: boolean; preferAuth?: boolean } = {}
): Promise<{ data: T | null; error: string | null }> {
  const accessToken = getAccessToken();

  if (!API_URL || !API_KEY) {
    return { data: null, error: 'Ambiente Supabase não configurado' };
  }

  if (options.requireAuth && !accessToken) {
    return { data: null, error: 'Sessão não encontrada' };
  }

  const bearerToken = options.preferAuth && accessToken ? accessToken : options.requireAuth ? accessToken : API_KEY;

  try {
    const response = await fetch(`${API_URL}/rest/v1/rpc/${rpcName}`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro inesperado',
    };
  }
}

function createInviteContext(data: {
  token: string;
  academyId: string;
  academyName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  emailHint?: string | null;
  expiresAt: string;
  description?: string | null;
  recipientName?: string | null;
}): InviteContext {
  return {
    token: data.token,
    academyId: data.academyId,
    academyName: data.academyName || null,
    unitId: data.unitId || null,
    unitName: data.unitName || null,
    emailHint: data.emailHint || null,
    expiresAt: data.expiresAt,
    description: data.description || null,
    recipientName: data.recipientName || null,
  };
}

function mapDraftToSession(
  draft: Pick<
    InviteSignupSessionRpcResponse,
    'draft_id' | 'academy_id' | 'unit_id' | 'current_step' | 'draft_status' | 'collected_data' | 'created_at' | 'updated_at' | 'completed_at' | 'published_at' | 'published_user_id'
  >
): OnboardingSession {
  const currentStep = draft.current_step || 'personal_data';

  return {
    id: draft.draft_id!,
    academyId: draft.academy_id!,
    unitId: draft.unit_id || null,
    createdBy: 'public-invite',
    currentStep,
    status: draft.draft_status || 'in_progress',
    origin: 'invite_link',
    collectedData: draft.collected_data || {},
    steps: buildStepState(currentStep),
    createdAt: draft.created_at || new Date().toISOString(),
    updatedAt: draft.updated_at || new Date().toISOString(),
    completedAt: draft.completed_at || undefined,
    publishedAt: draft.published_at || undefined,
    publishedUserId: draft.published_user_id || undefined,
  };
}

export async function validateInviteToken(token: string): Promise<InviteValidationResult> {
  const { data, error } = await callRpc<InviteContextRpcResponse>('get_invite_signup_context', {
    p_token: token,
  }, { preferAuth: true });

  if (error || !data || !data.success) {
    return {
      status: mapInviteErrorCodeToStatus(data?.error_code),
    };
  }

  if (!data.token || !data.academy_id || !data.expires_at || !data.lifecycle_status) {
    return { status: 'invalid' };
  }

  if (data.lifecycle_status === 'claimed' && data.claimed_by_current_user) {
    return {
      status: 'claimed_self',
      context: createInviteContext({
        token: data.token,
        academyId: data.academy_id,
        academyName: data.academy_name,
        unitId: data.unit_id,
        unitName: data.unit_name,
        emailHint: data.email_hint,
        expiresAt: data.expires_at,
        description: data.description,
        recipientName: data.recipient_name,
      }),
    };
  }

  return {
    status: 'pending',
    context: createInviteContext({
      token: data.token,
      academyId: data.academy_id,
      academyName: data.academy_name,
      unitId: data.unit_id,
      unitName: data.unit_name,
      emailHint: data.email_hint,
      expiresAt: data.expires_at,
      description: data.description,
      recipientName: data.recipient_name,
    }),
  };
}

export async function startSignup(token: string): Promise<InviteValidationResult> {
  return validateInviteToken(token);
}

export async function claimSignup(
  token: string,
  payload: ClaimInvitePayload
): Promise<ClaimInviteResult> {
  const { data, error } = await callRpc<ClaimInviteRpcResponse>('claim_invite_signup', {
    p_token: token,
    p_email: payload.email,
    p_full_name: payload.fullName,
    p_phone: payload.phone || null,
    p_password: payload.password,
  });

  if (error || !data || !data.success) {
    return {
      success: false,
      errorCode: data?.error_code || 'CLAIM_FAILED',
    };
  }

  return {
    success: true,
    userId: data.user_id,
    draftId: data.draft_id,
  };
}

export async function getCurrentInviteSignupSession(token?: string): Promise<InviteSignupSessionResult> {
  const { data, error } = await callRpc<InviteSignupSessionRpcResponse>('get_my_invite_signup_session', {
    p_token: token || null,
  }, { requireAuth: true, preferAuth: true });

  if (error || !data || !data.success || !data.token || !data.academy_id || !data.expires_at || !data.draft_id) {
    return {
      success: false,
      errorCode: data?.error_code || 'NO_PENDING_SIGNUP',
    };
  }

  return {
    success: true,
    invite: createInviteContext({
      token: data.token,
      academyId: data.academy_id,
      academyName: data.academy_name,
      unitId: data.unit_id,
      unitName: data.unit_name,
      emailHint: data.email_hint,
      expiresAt: data.expires_at,
      description: data.description,
      recipientName: data.recipient_name,
    }),
    session: mapDraftToSession(data),
  };
}

export async function saveInviteSignupProgress(
  token: string,
  session: OnboardingSession
): Promise<InviteSignupSessionResult> {
  const { data, error } = await callRpc<SaveInviteSignupProgressRpcResponse>('save_my_invite_signup_progress', {
    p_token: token,
    p_current_step: session.currentStep,
    p_status: session.status,
    p_collected_data: session.collectedData,
    p_completed_at: session.completedAt || null,
  }, { requireAuth: true, preferAuth: true });

  if (error || !data || !data.success) {
    return {
      success: false,
      errorCode: data?.error_code || 'SAVE_FAILED',
    };
  }

  return getCurrentInviteSignupSession(token);
}

export async function completeSignup(token: string): Promise<CompleteSignupResult> {
  const { data, error } = await callRpc<CompleteInviteSignupRpcResponse>('complete_my_invite_signup', {
    p_token: token,
  }, { requireAuth: true, preferAuth: true });

  if (error || !data || !data.success) {
    return {
      success: false,
      errorCode: data?.error_code || 'SIGNUP_FAILED',
    };
  }

  const result: CompleteSignupResult = {
    success: true,
    userId: data.user_id,
  };

  if (data.activation) {
    result.activation = {
      activated: data.activation.activated,
      alreadyExisted: data.activation.already_existed,
      subscriptionId: data.activation.subscription_id,
      paymentId: data.activation.payment_id,
      planName: data.activation.plan_name,
      planPrice: data.activation.plan_price,
      billingCycle: data.activation.billing_cycle,
      reason: data.activation.reason,
    };
  }

  return result;
}

export function updateSessionStep(
  session: OnboardingSession,
  stepData: OnboardingCollectedData[keyof OnboardingCollectedData],
  step: OnboardingStep,
  nextStep: OnboardingStep | null
): OnboardingSession {
  const updatedCollectedData: OnboardingCollectedData = { ...session.collectedData };

  if (step === 'identification') updatedCollectedData.identification = stepData as OnboardingCollectedData['identification'];
  if (step === 'personal_data') updatedCollectedData.personalData = stepData as OnboardingCollectedData['personalData'];
  if (step === 'plan_selection') updatedCollectedData.planSelection = stepData as OnboardingCollectedData['planSelection'];
  if (step === 'contract') updatedCollectedData.contract = stepData as OnboardingCollectedData['contract'];
  if (step === 'payment') updatedCollectedData.payment = stepData as OnboardingCollectedData['payment'];
  if (step === 'activation') updatedCollectedData.activation = stepData as OnboardingCollectedData['activation'];

  return {
    ...session,
    currentStep: nextStep ?? step,
    status: nextStep ? 'in_progress' : 'completed',
    collectedData: updatedCollectedData,
    steps: buildStepState(nextStep ?? step),
    updatedAt: new Date().toISOString(),
    completedAt: nextStep ? undefined : new Date().toISOString(),
  };
}
