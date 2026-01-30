/**
 * Service para gerenciamento de rascunhos de cadastro de alunos
 * 
 * Fluxo:
 * 1. Staff cria draft → salvo no Supabase
 * 2. Staff preenche steps → atualiza collected_data
 * 3. Staff pausa → draft fica em 'in_progress'
 * 4. Staff retoma → busca draft e continua
 * 5. Staff finaliza → publica via Edge Function
 * 
 * NOTA: Usa fetch() direto ao invés do SDK para garantir que o token
 * de autenticação seja lido corretamente do localStorage.
 */

import type { OnboardingStep, OnboardingSession } from '@/mocks/onboardingMock';

// ============================================
// TYPES
// ============================================

export type DraftStatus = 'in_progress' | 'completed' | 'abandoned' | 'published' | 'archived';
export type DraftOrigin = 'staff' | 'self_registration' | 'invite_link';

export interface StudentDraft {
  id: string;
  academy_id: string;
  unit_id: string | null;
  current_step: OnboardingStep;
  status: DraftStatus;
  origin: DraftOrigin;
  collected_data: OnboardingSession['collectedData'];
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  published_at: string | null;
  published_user_id: string | null;
}

export interface StudentDraftListItem {
  id: string;
  academy_id: string;
  unit_id: string | null;
  unit_name: string | null;
  current_step: OnboardingStep;
  status: DraftStatus;
  origin: DraftOrigin;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  user_type: string | null;
  cpf: string | null;
  plan_name: string | null;
  plan_value: number | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  published_at: string | null;
  published_user_id: string | null;
  steps_completed: number;
}

export interface CreateDraftParams {
  academyId: string;
  unitId?: string;
  origin?: DraftOrigin;
}

export interface ListDraftsFilters {
  status?: DraftStatus | DraftStatus[];
  unitId?: string;
  search?: string;
}

export interface PublishDraftResult {
  userId: string;
  profileId: string;
}

// ============================================
// AUTH HELPERS (mesmo padrão de outros services)
// ============================================

function getStorageKey(): string {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  return `sb-${projectRef}-auth-token`;
}

function getAuthSession(): { access_token: string; user: { id: string } } | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(getStorageKey());
  if (!stored) return null;
  
  try {
    const session = JSON.parse(stored);
    if (!session.access_token || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

function getAccessToken(): string | null {
  const session = getAuthSession();
  return session?.access_token || null;
}

function getCurrentUserId(): string | null {
  const session = getAuthSession();
  return session?.user?.id || null;
}

// ============================================
// FETCH HELPER
// ============================================

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchSupabase<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  const token = getAccessToken();
  
  if (!token) {
    return { data: null, error: new Error('Usuário não autenticado') };
  }

  const { params, ...fetchOptions } = options;
  
  let url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': fetchOptions.method === 'POST' ? 'return=representation' : 'return=minimal',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        data: null, 
        error: new Error(errorData.message || errorData.error || `HTTP ${response.status}`) 
      };
    }

    // Para DELETE e alguns PATCH, pode não ter body
    const text = await response.text();
    if (!text) {
      return { data: null, error: null };
    }

    const data = JSON.parse(text);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Erro desconhecido') };
  }
}

// ============================================
// SERVICE
// ============================================

/**
 * Cria um novo rascunho de cadastro de aluno
 */
export async function createDraft(
  params: CreateDraftParams
): Promise<{ data: StudentDraft | null; error: Error | null }> {
  const userId = getCurrentUserId();
  if (!userId) {
    return { data: null, error: new Error('Usuário não autenticado') };
  }

  const body = {
    academy_id: params.academyId,
    unit_id: params.unitId ?? null,
    created_by: userId,
    current_step: 'identification',
    status: 'in_progress',
    origin: params.origin ?? 'staff',
    collected_data: {},
  };

  const { data, error } = await fetchSupabase<StudentDraft[]>('student_drafts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Prefer': 'return=representation',
    },
  });

  if (error) {
    return { data: null, error };
  }

  // POST retorna array, pegamos o primeiro
  const draft = Array.isArray(data) ? data[0] : data;
  return { data: draft as StudentDraft, error: null };
}

/**
 * Busca um rascunho pelo ID
 */
export async function getDraft(
  draftId: string
): Promise<{ data: StudentDraft | null; error: Error | null }> {
  const { data, error } = await fetchSupabase<StudentDraft[]>(
    `student_drafts?id=eq.${draftId}&select=*`
  );

  if (error) {
    return { data: null, error };
  }

  const draft = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!draft) {
    return { data: null, error: new Error('Draft não encontrado') };
  }

  return { data: draft, error: null };
}

/**
 * Lista rascunhos de uma academia com filtros opcionais
 */
export async function listDrafts(
  academyId: string,
  filters?: ListDraftsFilters
): Promise<{ data: StudentDraftListItem[]; error: Error | null }> {
  let endpoint = `student_drafts_list?academy_id=eq.${academyId}&order=updated_at.desc`;

  // Filtro por status
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      endpoint += `&status=in.(${filters.status.join(',')})`;
    } else {
      endpoint += `&status=eq.${filters.status}`;
    }
  }

  // Filtro por unidade
  if (filters?.unitId) {
    endpoint += `&unit_id=eq.${filters.unitId}`;
  }

  // Busca por nome/email
  if (filters?.search) {
    endpoint += `&or=(student_name.ilike.*${filters.search}*,student_email.ilike.*${filters.search}*)`;
  }

  const { data, error } = await fetchSupabase<StudentDraftListItem[]>(endpoint);

  if (error) {
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}

/**
 * Atualiza os dados de uma etapa específica
 */
export async function updateDraftStep(
  draftId: string,
  step: OnboardingStep,
  stepData: Record<string, unknown>
): Promise<{ error: Error | null }> {
  // Busca draft atual para merge
  const { data: current, error: fetchError } = await getDraft(draftId);
  if (fetchError || !current) {
    return { error: fetchError ?? new Error('Draft não encontrado') };
  }

  // Mapeia step para chave do collectedData
  const stepKeyMap: Record<OnboardingStep, keyof OnboardingSession['collectedData']> = {
    'identification': 'identification',
    'personal_data': 'personalData',
    'plan_selection': 'planSelection',
    'contract': 'contract',
    'payment': 'payment',
    'activation': 'activation',
  };

  const dataKey = stepKeyMap[step];
  
  // Merge dos dados
  const updatedData = {
    ...current.collected_data,
    [dataKey]: stepData,
  };

  const { error } = await fetchSupabase(
    `student_drafts?id=eq.${draftId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        collected_data: updatedData,
        current_step: step,
      }),
    }
  );

  return { error };
}

/**
 * Avança para a próxima etapa do wizard
 */
export async function advanceDraftStep(
  draftId: string,
  nextStep: OnboardingStep
): Promise<{ error: Error | null }> {
  const { error } = await fetchSupabase(
    `student_drafts?id=eq.${draftId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ current_step: nextStep }),
    }
  );

  return { error };
}

/**
 * Salva step atual E avança para o próximo (operação combinada)
 */
export async function saveAndAdvance(
  draftId: string,
  currentStep: OnboardingStep,
  stepData: Record<string, unknown>,
  nextStep: OnboardingStep
): Promise<{ error: Error | null }> {
  // Busca draft atual para merge
  const { data: current, error: fetchError } = await getDraft(draftId);
  if (fetchError || !current) {
    return { error: fetchError ?? new Error('Draft não encontrado') };
  }

  const stepKeyMap: Record<OnboardingStep, keyof OnboardingSession['collectedData']> = {
    'identification': 'identification',
    'personal_data': 'personalData',
    'plan_selection': 'planSelection',
    'contract': 'contract',
    'payment': 'payment',
    'activation': 'activation',
  };

  const dataKey = stepKeyMap[currentStep];
  
  const updatedData = {
    ...current.collected_data,
    [dataKey]: stepData,
  };

  const { error } = await fetchSupabase(
    `student_drafts?id=eq.${draftId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        collected_data: updatedData,
        current_step: nextStep,
      }),
    }
  );

  return { error };
}

/**
 * Marca draft como completo (todas as etapas preenchidas)
 */
export async function completeDraft(
  draftId: string
): Promise<{ error: Error | null }> {
  const { error } = await fetchSupabase(
    `student_drafts?id=eq.${draftId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }),
    }
  );

  return { error };
}

/**
 * Marca draft como abandonado
 */
export async function abandonDraft(
  draftId: string
): Promise<{ error: Error | null }> {
  const { error } = await fetchSupabase(
    `student_drafts?id=eq.${draftId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'abandoned' }),
    }
  );

  return { error };
}

/**
 * Arquiva um draft (mantém os dados mas remove da lista ativa)
 */
export async function archiveDraft(
  draftId: string
): Promise<{ error: Error | null }> {
  const { error } = await fetchSupabase(
    `student_drafts?id=eq.${draftId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'archived' }),
    }
  );

  return { error };
}

/**
 * Restaura um draft arquivado para em andamento
 */
export async function restoreDraft(
  draftId: string
): Promise<{ error: Error | null }> {
  const { error } = await fetchSupabase(
    `student_drafts?id=eq.${draftId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    }
  );

  return { error };
}

/**
 * Exclui um rascunho (apenas se não publicado)
 */
export async function deleteDraft(
  draftId: string
): Promise<{ error: Error | null }> {
  const { error } = await fetchSupabase(
    `student_drafts?id=eq.${draftId}&status=neq.published`,
    {
      method: 'DELETE',
    }
  );

  return { error };
}

/**
 * Publica o rascunho (cria usuário real via Edge Function)
 * 
 * A Edge Function:
 * 1. Valida dados completos
 * 2. Verifica CPF/email únicos
 * 3. Cria auth.users
 * 4. Cria profiles, student_profiles, memberships
 * 5. Marca draft como 'published'
 */
export async function publishDraft(
  draftId: string
): Promise<{ data: PublishDraftResult | null; error: Error | null }> {
  const token = getAccessToken();
  
  if (!token) {
    return { data: null, error: new Error('Usuário não autenticado') };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/publish-student-draft`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ draftId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: new Error(data.error || `HTTP ${response.status}`) };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Erro desconhecido') };
  }
}

// ============================================
// VALIDAÇÕES
// ============================================

/**
 * Verifica se email já existe no sistema
 */
export async function checkEmailExists(
  email: string
): Promise<{ exists: boolean; error: Error | null }> {
  const { data, error } = await fetchSupabase<{ id: string }[]>(
    `profiles?email=eq.${encodeURIComponent(email)}&select=id`
  );

  if (error) {
    return { exists: false, error };
  }

  return { exists: Array.isArray(data) && data.length > 0, error: null };
}

/**
 * Verifica se CPF já existe no sistema
 */
export async function checkCpfExists(
  cpf: string
): Promise<{ exists: boolean; error: Error | null }> {
  // Remove formatação do CPF
  const cleanCpf = cpf.replace(/\D/g, '');

  const { data, error } = await fetchSupabase<{ id: string }[]>(
    `profiles?cpf=eq.${cleanCpf}&select=id`
  );

  if (error) {
    return { exists: false, error };
  }

  return { exists: Array.isArray(data) && data.length > 0, error: null };
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula o progresso do draft (0-100%)
 */
export function calculateProgress(draft: StudentDraft): number {
  const { collected_data } = draft;
  let completed = 0;
  const total = 6;

  if (collected_data.identification) completed++;
  if (collected_data.personalData) completed++;
  if (collected_data.planSelection) completed++;
  if (collected_data.contract) completed++;
  if (collected_data.payment) completed++;
  if (collected_data.activation) completed++;

  return Math.round((completed / total) * 100);
}

/**
 * Retorna a próxima etapa baseado na etapa atual
 */
export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const order: OnboardingStep[] = [
    'identification',
    'personal_data',
    'plan_selection',
    'contract',
    'payment',
    'activation',
  ];

  const currentIndex = order.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= order.length - 1) {
    return null;
  }

  return order[currentIndex + 1];
}

/**
 * Retorna a etapa anterior baseado na etapa atual
 */
export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const order: OnboardingStep[] = [
    'identification',
    'personal_data',
    'plan_selection',
    'contract',
    'payment',
    'activation',
  ];

  const currentIndex = order.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }

  return order[currentIndex - 1];
}

/**
 * Verifica se o draft está pronto para publicação
 */
export function isReadyToPublish(draft: StudentDraft): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  const { collected_data } = draft;

  // Campos obrigatórios
  if (!collected_data.identification?.fullName) missing.push('Nome completo');
  if (!collected_data.identification?.email) missing.push('Email');
  if (!collected_data.identification?.phone) missing.push('Telefone');
  if (!collected_data.personalData?.document) missing.push('CPF');
  if (!collected_data.planSelection?.planId) missing.push('Plano');

  return {
    ready: missing.length === 0,
    missing,
  };
}
