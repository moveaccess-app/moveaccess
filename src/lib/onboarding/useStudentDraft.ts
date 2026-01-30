'use client';

/**
 * Hook para gerenciar o estado de um rascunho de cadastro de aluno
 * 
 * Uso:
 * ```tsx
 * const { draft, loading, saving, saveStep, advance, publish } = useStudentDraft({
 *   academyId: 'uuid',
 *   unitId: 'uuid', // opcional
 *   existingDraftId: searchParams.get('draft') ?? undefined,
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { OnboardingStep } from '@/mocks/onboardingMock';
import {
  createDraft,
  getDraft,
  updateDraftStep,
  advanceDraftStep,
  saveAndAdvance,
  completeDraft,
  abandonDraft,
  deleteDraft,
  publishDraft,
  calculateProgress,
  getNextStep,
  getPreviousStep,
  isReadyToPublish,
  type StudentDraft,
  type PublishDraftResult,
} from './studentDraftService';

// ============================================
// TYPES
// ============================================

export interface UseStudentDraftOptions {
  /** ID da academia (obrigatório) */
  academyId: string;
  /** ID da unidade (opcional) */
  unitId?: string;
  /** ID de draft existente para retomar (opcional) */
  existingDraftId?: string;
  /** Callback quando draft é carregado/criado */
  onDraftReady?: (draft: StudentDraft) => void;
  /** Callback quando ocorre erro */
  onError?: (error: Error) => void;
}

export interface UseStudentDraftReturn {
  /** Draft atual (null se ainda carregando) */
  draft: StudentDraft | null;
  /** ID do draft */
  draftId: string | null;
  /** Se está carregando o draft inicial */
  loading: boolean;
  /** Se está salvando alterações */
  saving: boolean;
  /** Erro atual (null se nenhum) */
  error: Error | null;
  /** Progresso em porcentagem (0-100) */
  progress: number;
  /** Se draft está pronto para publicar */
  readyToPublish: boolean;
  /** Campos faltando para publicar */
  missingFields: string[];
  
  // Ações
  /** Salva dados de uma etapa */
  saveStep: (step: OnboardingStep, data: Record<string, unknown>) => Promise<{ error: Error | null }>;
  /** Salva etapa atual e avança para próxima */
  saveAndGoNext: (currentStep: OnboardingStep, data: Record<string, unknown>) => Promise<{ error: Error | null; nextStep: OnboardingStep | null }>;
  /** Avança para próxima etapa (sem salvar) */
  advance: (nextStep: OnboardingStep) => Promise<{ error: Error | null }>;
  /** Marca como completo */
  complete: () => Promise<{ error: Error | null }>;
  /** Marca como abandonado */
  abandon: () => Promise<{ error: Error | null }>;
  /** Exclui o draft */
  remove: () => Promise<{ error: Error | null }>;
  /** Publica (cria usuário real) */
  publish: () => Promise<{ data: PublishDraftResult | null; error: Error | null }>;
  /** Recarrega draft do servidor */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useStudentDraft(options: UseStudentDraftOptions): UseStudentDraftReturn {
  const { academyId, unitId, existingDraftId, onDraftReady, onError } = options;

  const [draft, setDraft] = useState<StudentDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ref para evitar inicialização dupla em StrictMode
  const initRef = useRef(false);

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  useEffect(() => {
    // Evita dupla execução no StrictMode
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        if (existingDraftId) {
          // Retoma draft existente
          const { data, error: fetchError } = await getDraft(existingDraftId);
          
          if (fetchError) {
            setError(fetchError);
            onError?.(fetchError);
            return;
          }

          if (!data) {
            const notFoundError = new Error('Rascunho não encontrado');
            setError(notFoundError);
            onError?.(notFoundError);
            return;
          }

          setDraft(data);
          onDraftReady?.(data);
        } else {
          // Cria novo draft
          const { data, error: createError } = await createDraft({
            academyId,
            unitId,
          });

          if (createError) {
            setError(createError);
            onError?.(createError);
            return;
          }

          if (data) {
            setDraft(data);
            onDraftReady?.(data);
          }
        }
      } catch (err) {
        const unexpectedError = err instanceof Error ? err : new Error('Erro inesperado');
        setError(unexpectedError);
        onError?.(unexpectedError);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [academyId, unitId, existingDraftId, onDraftReady, onError]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const progress = draft ? calculateProgress(draft) : 0;
  const { ready: readyToPublish, missing: missingFields } = draft 
    ? isReadyToPublish(draft) 
    : { ready: false, missing: [] };

  // ============================================
  // ACTIONS
  // ============================================

  const saveStep = useCallback(async (
    step: OnboardingStep,
    stepData: Record<string, unknown>
  ): Promise<{ error: Error | null }> => {
    if (!draft) {
      return { error: new Error('Draft não carregado') };
    }

    setSaving(true);
    const { error: saveError } = await updateDraftStep(draft.id, step, stepData);
    setSaving(false);

    if (saveError) {
      setError(saveError);
      return { error: saveError };
    }

    // Atualiza estado local otimisticamente
    const stepKeyMap: Record<OnboardingStep, string> = {
      'identification': 'identification',
      'personal_data': 'personalData',
      'plan_selection': 'planSelection',
      'contract': 'contract',
      'payment': 'payment',
      'activation': 'activation',
    };

    setDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        current_step: step,
        collected_data: {
          ...prev.collected_data,
          [stepKeyMap[step]]: stepData,
        } as StudentDraft['collected_data'],
      };
    });

    return { error: null };
  }, [draft]);

  const saveAndGoNext = useCallback(async (
    currentStep: OnboardingStep,
    stepData: Record<string, unknown>
  ): Promise<{ error: Error | null; nextStep: OnboardingStep | null }> => {
    if (!draft) {
      return { error: new Error('Draft não carregado'), nextStep: null };
    }

    const nextStep = getNextStep(currentStep);
    if (!nextStep) {
      // Última etapa - apenas salva
      const result = await saveStep(currentStep, stepData);
      return { ...result, nextStep: null };
    }

    setSaving(true);
    const { error: saveError } = await saveAndAdvance(draft.id, currentStep, stepData, nextStep);
    setSaving(false);

    if (saveError) {
      setError(saveError);
      return { error: saveError, nextStep: null };
    }

    // Atualiza estado local
    const stepKeyMap: Record<OnboardingStep, string> = {
      'identification': 'identification',
      'personal_data': 'personalData',
      'plan_selection': 'planSelection',
      'contract': 'contract',
      'payment': 'payment',
      'activation': 'activation',
    };

    setDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        current_step: nextStep,
        collected_data: {
          ...prev.collected_data,
          [stepKeyMap[currentStep]]: stepData,
        } as StudentDraft['collected_data'],
      };
    });

    return { error: null, nextStep };
  }, [draft, saveStep]);

  const advance = useCallback(async (
    nextStep: OnboardingStep
  ): Promise<{ error: Error | null }> => {
    if (!draft) {
      return { error: new Error('Draft não carregado') };
    }

    setSaving(true);
    const { error: advanceError } = await advanceDraftStep(draft.id, nextStep);
    setSaving(false);

    if (advanceError) {
      setError(advanceError);
      return { error: advanceError };
    }

    setDraft(prev => prev ? { ...prev, current_step: nextStep } : null);
    return { error: null };
  }, [draft]);

  const complete = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!draft) {
      return { error: new Error('Draft não carregado') };
    }

    setSaving(true);
    const { error: completeError } = await completeDraft(draft.id);
    setSaving(false);

    if (completeError) {
      setError(completeError);
      return { error: completeError };
    }

    setDraft(prev => prev ? { 
      ...prev, 
      status: 'completed',
      completed_at: new Date().toISOString(),
    } : null);
    
    return { error: null };
  }, [draft]);

  const abandon = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!draft) {
      return { error: new Error('Draft não carregado') };
    }

    setSaving(true);
    const { error: abandonError } = await abandonDraft(draft.id);
    setSaving(false);

    if (abandonError) {
      setError(abandonError);
      return { error: abandonError };
    }

    setDraft(prev => prev ? { ...prev, status: 'abandoned' } : null);
    return { error: null };
  }, [draft]);

  const remove = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!draft) {
      return { error: new Error('Draft não carregado') };
    }

    setSaving(true);
    const { error: deleteError } = await deleteDraft(draft.id);
    setSaving(false);

    if (deleteError) {
      setError(deleteError);
      return { error: deleteError };
    }

    setDraft(null);
    return { error: null };
  }, [draft]);

  const publish = useCallback(async (): Promise<{ 
    data: PublishDraftResult | null; 
    error: Error | null 
  }> => {
    if (!draft) {
      return { data: null, error: new Error('Draft não carregado') };
    }

    if (!readyToPublish) {
      return { 
        data: null, 
        error: new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`) 
      };
    }

    setSaving(true);
    const result = await publishDraft(draft.id);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return result;
    }

    // Atualiza draft como publicado
    setDraft(prev => prev ? { 
      ...prev, 
      status: 'published',
      published_at: new Date().toISOString(),
      published_user_id: result.data?.userId ?? null,
    } : null);

    return result;
  }, [draft, readyToPublish, missingFields]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!draft) return;

    setLoading(true);
    const { data, error: refreshError } = await getDraft(draft.id);
    setLoading(false);

    if (refreshError) {
      setError(refreshError);
      return;
    }

    if (data) {
      setDraft(data);
    }
  }, [draft]);

  // ============================================
  // RETURN
  // ============================================

  return {
    draft,
    draftId: draft?.id ?? null,
    loading,
    saving,
    error,
    progress,
    readyToPublish,
    missingFields,
    saveStep,
    saveAndGoNext,
    advance,
    complete,
    abandon,
    remove,
    publish,
    refresh,
  };
}

// ============================================
// STEP HELPERS (re-export para conveniência)
// ============================================

export { getNextStep, getPreviousStep, calculateProgress, isReadyToPublish };
