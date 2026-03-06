import {
  buildStepState,
  type OnboardingCollectedData,
  type OnboardingSession,
  type OnboardingStep,
} from '@/lib/users/onboardingTypes';

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface InviteContext {
  token: string;
  academyId: string;
  academyName: string | null;
  unitId: string | null;
  unitName: string | null;
  expectedEmail: string | null;
  expiresAt: string;
  description: string | null;
}

export type InviteValidationStatus = 'valid' | 'invalid' | 'expired' | 'used';

export interface InviteValidationResult {
  status: InviteValidationStatus;
  context?: InviteContext;
}

export interface SignupCredentials {
  password: string;
}

export interface CompleteSignupResult {
  success: boolean;
  userId?: string;
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
  expected_email?: string | null;
  expires_at?: string;
  description?: string | null;
}

interface FinalizeSignupRpcResponse {
  success: boolean;
  user_id?: string;
  error_code?: string;
}

function mapInviteErrorCodeToStatus(errorCode?: string): InviteValidationStatus {
  if (errorCode === 'TOKEN_EXPIRED') return 'expired';
  if (errorCode === 'TOKEN_USED') return 'used';
  return 'invalid';
}

async function callRpc<T>(
  rpcName: string,
  payload: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  if (!API_URL || !API_KEY) {
    return { data: null, error: 'Ambiente Supabase não configurado' };
  }

  try {
    const response = await fetch(`${API_URL}/rest/v1/rpc/${rpcName}`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
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

export function createPublicOnboardingSession(invite: InviteContext): OnboardingSession {
  const now = new Date().toISOString();

  return {
    id: `public-${invite.token}`,
    academyId: invite.academyId,
    unitId: invite.unitId,
    createdBy: 'public-invite',
    currentStep: 'identification',
    status: 'in_progress',
    origin: 'invite_link',
    collectedData: {},
    steps: buildStepState('identification'),
    createdAt: now,
    updatedAt: now,
  };
}

export async function validateInviteToken(token: string): Promise<InviteValidationResult> {
  const { data, error } = await callRpc<InviteContextRpcResponse>('get_invite_signup_context', {
    p_token: token,
  });

  if (error || !data || !data.success) {
    return {
      status: mapInviteErrorCodeToStatus(data?.error_code),
    };
  }

  if (!data.token || !data.academy_id || !data.expires_at) {
    return { status: 'invalid' };
  }

  return {
    status: 'valid',
    context: {
      token: data.token,
      academyId: data.academy_id,
      academyName: data.academy_name || null,
      unitId: data.unit_id || null,
      unitName: data.unit_name || null,
      expectedEmail: data.expected_email || null,
      expiresAt: data.expires_at,
      description: data.description || null,
    },
  };
}

export async function startSignup(token: string): Promise<InviteValidationResult> {
  return validateInviteToken(token);
}

export async function completeSignup(
  token: string,
  collectedData: OnboardingCollectedData,
  credentials: SignupCredentials
): Promise<CompleteSignupResult> {
  const identification = collectedData.identification;
  const personalData = collectedData.personalData;

  if (!identification?.email || !identification.fullName) {
    return { success: false, errorCode: 'MISSING_IDENTIFICATION' };
  }

  const { data, error } = await callRpc<FinalizeSignupRpcResponse>('finalize_invite_signup', {
    p_token: token,
    p_email: identification.email,
    p_password: credentials.password,
    p_full_name: identification.fullName,
    p_phone: identification.phone || null,
    p_cpf: personalData?.document || null,
    p_birth_date: personalData?.birthDate || null,
    p_address: personalData?.address || null,
    p_emergency_contact: personalData?.emergencyContact || null,
  });

  if (error || !data || !data.success) {
    return {
      success: false,
      errorCode: data?.error_code || 'SIGNUP_FAILED',
    };
  }

  return {
    success: true,
    userId: data.user_id,
  };
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
