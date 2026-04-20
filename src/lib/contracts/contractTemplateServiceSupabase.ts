import { getActiveAcademyId } from '@/lib/supabase/academyScope';

export type ContractTemplateStatus = 'draft' | 'published' | 'archived';

export interface ContractTemplate {
  id: string;
  academyId: string;
  name: string;
  description: string;
  content: string;
  version: number;
  status: ContractTemplateStatus;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplateInput {
  name: string;
  description?: string;
  content: string;
}

interface DbContractTemplateRow {
  id: string;
  academy_id: string;
  name: string;
  description: string | null;
  content: string;
  version: number;
  status: ContractTemplateStatus;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const TEMPLATE_STATUS_LABELS: Record<ContractTemplateStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
};

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

async function fetchSupabase<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = getAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return { data: null, error: 'Não autenticado' };
  }

  const method = options.method ?? 'GET';
  const prefer = method === 'GET' || method === 'DELETE' ? 'return=minimal' : 'return=representation';

  try {
    const response = await fetch(`${API_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: prefer,
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

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

function rowToTemplate(row: DbContractTemplateRow): ContractTemplate {
  return {
    id: row.id,
    academyId: row.academy_id,
    name: row.name,
    description: row.description || '',
    content: row.content,
    version: row.version,
    status: row.status,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Public queries ─────────────────────────────────────────────

/**
 * Get all contract templates for the active academy.
 */
export async function getContractTemplates(): Promise<ContractTemplate[]> {
  const academyId = await getActiveAcademyId();
  if (!academyId) return [];

  const { data, error } = await fetchSupabase<DbContractTemplateRow[]>(
    `contract_templates?academy_id=eq.${academyId}&select=*&order=version.desc`
  );

  if (error || !data) return [];
  return data.map(rowToTemplate);
}

/**
 * Get a specific template by ID.
 */
export async function getContractTemplateById(id: string): Promise<ContractTemplate | null> {
  const { data, error } = await fetchSupabase<DbContractTemplateRow[]>(
    `contract_templates?id=eq.${id}&select=*&limit=1`
  );

  if (error || !data?.[0]) return null;
  return rowToTemplate(data[0]);
}

/**
 * Get the currently published (active) template for the academy.
 */
export async function getActiveContractTemplate(): Promise<ContractTemplate | null> {
  const academyId = await getActiveAcademyId();
  if (!academyId) return null;

  const { data, error } = await fetchSupabase<DbContractTemplateRow[]>(
    `contract_templates?academy_id=eq.${academyId}&status=eq.published&select=*&limit=1`
  );

  if (error || !data?.[0]) return null;
  return rowToTemplate(data[0]);
}

// ─── Mutations ──────────────────────────────────────────────────

/**
 * Create a new draft template.
 */
export async function createContractTemplate(
  input: ContractTemplateInput
): Promise<ContractTemplate | null> {
  const academyId = await getActiveAcademyId();
  if (!academyId) return null;

  // Get the next version number for this academy
  const existing = await getContractTemplates();
  const maxVersion = existing.reduce((max, t) => Math.max(max, t.version), 0);

  const { data, error } = await fetchSupabase<DbContractTemplateRow[]>(
    'contract_templates',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        academy_id: academyId,
        name: input.name.trim(),
        description: (input.description || '').trim(),
        content: input.content,
        version: maxVersion + 1,
        status: 'draft',
      }),
    }
  );

  if (error || !data?.[0]) return null;
  return rowToTemplate(data[0]);
}

/**
 * Update a draft template's content.
 * Only drafts can be edited — published/archived are immutable.
 */
export async function updateContractTemplate(
  id: string,
  input: Partial<ContractTemplateInput>
): Promise<ContractTemplate | null> {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.description !== undefined) body.description = input.description.trim();
  if (input.content !== undefined) body.content = input.content;

  const { data, error } = await fetchSupabase<DbContractTemplateRow[]>(
    `contract_templates?id=eq.${id}&status=eq.draft`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(body),
    }
  );

  if (error || !data?.[0]) return null;
  return rowToTemplate(data[0]);
}

/**
 * Publish a draft template.
 * Archives the previously published template for this academy.
 */
export async function publishContractTemplate(id: string): Promise<ContractTemplate | null> {
  const academyId = await getActiveAcademyId();
  if (!academyId) return null;

  // Archive current published template (if any)
  await fetchSupabase(
    `contract_templates?academy_id=eq.${academyId}&status=eq.published`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'archived',
        updated_at: new Date().toISOString(),
      }),
    }
  );

  // Publish the new one
  const { data, error } = await fetchSupabase<DbContractTemplateRow[]>(
    `contract_templates?id=eq.${id}&status=eq.draft`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (error || !data?.[0]) return null;
  return rowToTemplate(data[0]);
}

/**
 * Archive a published template (deactivate).
 */
export async function archiveContractTemplate(id: string): Promise<boolean> {
  const { error } = await fetchSupabase(
    `contract_templates?id=eq.${id}&status=eq.published`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'archived',
        updated_at: new Date().toISOString(),
      }),
    }
  );

  return !error;
}
