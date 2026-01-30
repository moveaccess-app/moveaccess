/**
 * Service para gerenciar links de convite para cadastro
 * 
 * Uso:
 * ```tsx
 * // Criar link (requer auth)
 * const { data, error } = await createInviteLink({
 *   academyId: 'uuid',
 *   description: 'Link para João',
 *   expectedEmail: 'joao@email.com', // opcional
 *   expiresInDays: 30,
 * });
 * 
 * // Validar token (público)
 * const { data, error } = await validateToken('abc123...');
 * 
 * // Usar token (público - cria/retoma draft)
 * const { data, error } = await useToken('abc123...', 'email@test.com');
 * ```
 * 
 * NOTA: Usa fetch() direto ao invés do SDK para garantir compatibilidade
 * com o sistema de auth customizado que armazena sessão no localStorage
 */

// ============================================
// CONFIG (mesmas variáveis que authServiceSupabase)
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Gera a chave do localStorage (mesmo padrão do SDK e authServiceSupabase)
 */
function getStorageKey(): string {
  const projectRef = SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  return `sb-${projectRef}-auth-token`;
}

/**
 * Obtém o access_token do localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const storageKey = getStorageKey();
    const storedSession = localStorage.getItem(storageKey);
    if (!storedSession) {
      return null;
    }
    
    const sessionData = JSON.parse(storedSession);
    const accessToken = sessionData.access_token;
    
    if (!accessToken) {
      return null;
    }
    
    // Verificar se expirou
    const expiresAt = sessionData.expires_at;
    if (expiresAt && Date.now() / 1000 > expiresAt) {
      // Token expirado
      return null;
    }
    
    return accessToken;
  } catch {
    return null;
  }
}

/**
 * Headers base para chamadas públicas (sem auth)
 */
function getPublicHeaders(): HeadersInit {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

/**
 * Headers para chamadas autenticadas (com Bearer token)
 */
function getAuthHeaders(): HeadersInit | null {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }
  
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

// ============================================
// TYPES
// ============================================

export type InviteLinkStatus = 'active' | 'used' | 'expired' | 'revoked';

export interface InviteLink {
  id: string;
  token: string;
  academy_id: string;
  unit_id: string | null;
  created_by: string;
  expected_email: string | null;
  status: InviteLinkStatus;
  expires_at: string;
  used_at: string | null;
  draft_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteLinkListItem extends InviteLink {
  is_valid: boolean;
  time_remaining: string;
}

export interface CreateInviteLinkParams {
  academyId: string;
  unitId?: string;
  description?: string;
  expectedEmail?: string;
  expiresInDays?: number; // default: 30
}

export interface ValidateTokenResult {
  is_valid: boolean;
  invite_id: string | null;
  academy_id: string | null;
  unit_id: string | null;
  expected_email: string | null;
  draft_id: string | null;
  error_code: string | null;
}

export interface UseTokenResult {
  success: boolean;
  draft_id: string | null;
  is_new_draft: boolean;
  error_code: string | null;
}

// ============================================
// FUNÇÕES PÚBLICAS (não requerem auth) - usando fetch
// ============================================

/**
 * Valida um token de convite (acesso público)
 */
export async function validateInviteToken(
  token: string
): Promise<{ data: ValidateTokenResult | null; error: Error | null }> {
  try {
    console.log('[validateInviteToken] Validando token:', token.substring(0, 10) + '...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_invite_token`, {
      method: 'POST',
      headers: getPublicHeaders(),
      body: JSON.stringify({ p_token: token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[validateInviteToken] Erro HTTP:', response.status, errorData);
      return { data: null, error: new Error(errorData.message || 'Erro ao validar token') };
    }

    const data = await response.json();
    // RPC RETURNS TABLE retorna array - pegamos o primeiro elemento
    const result = Array.isArray(data) ? data[0] : data;
    console.log('[validateInviteToken] Resultado:', result);
    
    return { data: result as ValidateTokenResult, error: null };
  } catch (err) {
    console.error('[validateInviteToken] Exception:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Erro desconhecido') };
  }
}

/**
 * Ativa um token de convite (cria ou retoma draft)
 * Acesso público - não requer autenticação
 * Nota: Renomeado de useInviteToken para evitar conflito com convenção de React Hooks
 */
export async function activateInviteToken(
  token: string,
  email?: string
): Promise<{ data: UseTokenResult | null; error: Error | null }> {
  try {
    console.log('[activateInviteToken] Ativando token:', token.substring(0, 10) + '...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/use_invite_token`, {
      method: 'POST',
      headers: getPublicHeaders(),
      body: JSON.stringify({
        p_token: token,
        p_email: email ?? null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[activateInviteToken] Erro HTTP:', response.status, errorData);
      return { data: null, error: new Error(errorData.message || 'Erro ao usar token') };
    }

    const data = await response.json();
    // RPC RETURNS TABLE retorna array - pegamos o primeiro elemento
    const result = Array.isArray(data) ? data[0] : data;
    console.log('[activateInviteToken] Resultado:', result);
    
    return { data: result as UseTokenResult, error: null };
  } catch (err) {
    console.error('[activateInviteToken] Exception:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Erro desconhecido') };
  }
}

// ============================================
// FUNÇÕES AUTENTICADAS (staff da academia) - usando fetch + Bearer token
// ============================================

/**
 * Cria um novo link de convite via RPC
 * O servidor preenche created_by automaticamente com auth.uid()
 */
export async function createInviteLink(
  params: CreateInviteLinkParams
): Promise<{ data: InviteLink | null; error: Error | null }> {
  const headers = getAuthHeaders();
  
  if (!headers) {
    console.error('[createInviteLink] Sem token de autenticação no localStorage');
    return { data: null, error: new Error('Sessão não encontrada. Faça login novamente.') };
  }
  
  console.log('[createInviteLink] Chamando RPC com token do localStorage');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_invite_link`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        p_academy_id: params.academyId,
        p_unit_id: params.unitId ?? null,
        p_description: params.description ?? null,
        p_expected_email: params.expectedEmail ?? null,
        p_expires_in_days: params.expiresInDays ?? 30,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[createInviteLink] RPC error:', errorData);
      return { data: null, error: new Error(errorData.message || 'Erro ao criar link') };
    }

    const data = await response.json();
    // RPC RETURNS TABLE retorna array - pegamos o primeiro elemento
    const link = Array.isArray(data) ? data[0] : data;
    console.log('[createInviteLink] Sucesso:', link);
    
    if (!link) {
      return { data: null, error: new Error('Link não retornado pela RPC') };
    }
    
    return { data: link as InviteLink, error: null };
  } catch (err) {
    console.error('[createInviteLink] Fetch error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Erro desconhecido') };
  }
}

/**
 * Lista links de convite da academia
 */
export async function listInviteLinks(
  academyId: string,
  options?: {
    status?: InviteLinkStatus[];
    limit?: number;
  }
): Promise<{ data: InviteLinkListItem[]; error: Error | null }> {
  const headers = getAuthHeaders();
  
  if (!headers) {
    return { data: [], error: new Error('Sessão não encontrada') };
  }
  
  try {
    // Construir query params para filtros
    let url = `${SUPABASE_URL}/rest/v1/invite_links_list?academy_id=eq.${academyId}&order=created_at.desc`;
    
    if (options?.status && options.status.length > 0) {
      url += `&status=in.(${options.status.join(',')})`;
    }
    
    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { data: [], error: new Error(errorData.message || 'Erro ao listar links') };
    }

    const data = await response.json();
    return { data: data as InviteLinkListItem[], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error('Erro desconhecido') };
  }
}

/**
 * Revoga um link de convite
 */
export async function revokeInviteLink(
  linkId: string
): Promise<{ error: Error | null }> {
  const headers = getAuthHeaders();
  
  if (!headers) {
    return { error: new Error('Sessão não encontrada') };
  }
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/invite_links?id=eq.${linkId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'revoked' }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { error: new Error(errorData.message || 'Erro ao revogar link') };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Erro desconhecido') };
  }
}

/**
 * Obtém um link pelo ID
 */
export async function getInviteLink(
  linkId: string
): Promise<{ data: InviteLink | null; error: Error | null }> {
  const headers = getAuthHeaders();
  
  if (!headers) {
    return { data: null, error: new Error('Sessão não encontrada') };
  }
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/invite_links?id=eq.${linkId}&select=*`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: new Error(errorData.message || 'Erro ao buscar link') };
    }

    const data = await response.json();
    const link = Array.isArray(data) ? data[0] : data;
    
    if (!link) {
      return { data: null, error: new Error('Link não encontrado') };
    }
    
    return { data: link as InviteLink, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Erro desconhecido') };
  }
}

// ============================================
// HELPERS PARA UI
// ============================================

/**
 * Gera URL completa do link de convite
 */
export function getInviteUrl(token: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/cadastro/${token}`;
}

/**
 * Formata tempo restante para exibição
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expirado';
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
  return 'Menos de 1 hora';
}

/**
 * Labels de status para UI
 */
export const STATUS_LABELS: Record<InviteLinkStatus, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'var(--status-positive)' },
  used: { label: 'Usado', color: 'var(--status-alert)' },
  expired: { label: 'Expirado', color: 'var(--element-secondary)' },
  revoked: { label: 'Revogado', color: 'var(--status-negative)' },
};

/**
 * Mapeia códigos de erro para mensagens amigáveis
 */
export const ERROR_MESSAGES: Record<string, string> = {
  TOKEN_NOT_FOUND: 'Link não encontrado. Verifique se o endereço está correto.',
  TOKEN_EXPIRED: 'Este link expirou. Solicite um novo link à academia.',
  TOKEN_REVOKED: 'Este link foi cancelado. Solicite um novo link à academia.',
  EMAIL_MISMATCH: 'O email informado não corresponde ao esperado para este link.',
  INVALID_TOKEN: 'Link inválido ou expirado.',
};
