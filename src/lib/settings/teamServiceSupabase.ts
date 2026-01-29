/**
 * Team Service - Supabase
 * Gerencia membros da equipe (staff)
 */

// ============================================================================
// TIPOS
// ============================================================================

export type RoleId = 'admin' | 'manager' | 'receptionist' | 'financial' | 'readonly';
export type StaffStatus = 'active' | 'inactive' | 'pending';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  avatarUrl: string | null;
  roleId: RoleId;
  status: StaffStatus;
  unitIds: string[];
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  customPermissions: string[];
  academyId: string | null;
  academyName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

export interface TeamListResult {
  staff: StaffUser[];
  total: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function getStorageKey(): string {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'supabase';
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
  
  if (!token) {
    return { data: null, error: 'Não autenticado' };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${endpoint}`,
      {
        ...options,
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[TeamService] Erro na requisição:', errorData);
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    console.error('[TeamService] Erro:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

// ============================================================================
// CONVERSORES DB <-> UI
// ============================================================================

interface DbStaffRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  role_id: RoleId;
  status: StaffStatus;
  last_login_at: string | null;
  last_login_ip: string | null;
  custom_permissions: string[] | null;
  academy_id: string | null;
  academy_name: string | null;
  unit_ids: string[];
}

interface DbRoleRow {
  id: RoleId;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
}

function dbRowToStaffUser(row: DbStaffRow): StaffUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    cpf: row.cpf,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    roleId: row.role_id,
    status: row.status,
    unitIds: row.unit_ids || [],
    lastLoginAt: row.last_login_at,
    lastLoginIp: row.last_login_ip,
    customPermissions: row.custom_permissions || [],
    academyId: row.academy_id,
    academyName: row.academy_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbRowToRole(row: DbRoleRow): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: row.permissions,
    isSystem: row.is_system,
  };
}

// ============================================================================
// SERVIÇO
// ============================================================================

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_SETTINGS === 'true';

function log(...args: unknown[]) {
  if (DEBUG) console.log('[TeamService]', ...args);
}

/**
 * Busca todos os membros da equipe da academy do usuário logado
 */
export async function getStaffUsers(): Promise<StaffUser[]> {
  log('getStaffUsers()');
  
  const { data, error } = await fetchSupabase<DbStaffRow[]>(
    'staff_list_view?select=*&order=name.asc'
  );
  
  if (error || !data) {
    console.error('[TeamService] Erro ao buscar staff:', error);
    return [];
  }
  
  const staff = data.map(dbRowToStaffUser);
  log('getStaffUsers() ->', staff.length, 'membros');
  
  return staff;
}

/**
 * Busca um membro da equipe pelo ID
 */
export async function getStaffUserById(id: string): Promise<StaffUser | null> {
  log('getStaffUserById()', id);
  
  const { data, error } = await fetchSupabase<DbStaffRow[]>(
    `staff_list_view?id=eq.${id}&select=*`
  );
  
  if (error || !data || data.length === 0) {
    console.error('[TeamService] Erro ao buscar staff:', error);
    return null;
  }
  
  return dbRowToStaffUser(data[0]);
}

/**
 * Busca todos os roles disponíveis
 */
export async function getRoles(): Promise<Role[]> {
  log('getRoles()');
  
  const { data, error } = await fetchSupabase<DbRoleRow[]>(
    'roles?select=*&order=id.asc'
  );
  
  if (error || !data) {
    console.error('[TeamService] Erro ao buscar roles:', error);
    return [];
  }
  
  return data.map(dbRowToRole);
}

/**
 * Atualiza um membro da equipe (role, status, unitIds)
 */
export async function updateStaffUser(
  id: string,
  updates: {
    roleId?: RoleId;
    status?: StaffStatus;
    unitIds?: string[];
    phone?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  log('updateStaffUser()', id, updates);

  // 1. Atualizar staff_profiles (role, status)
  if (updates.roleId !== undefined || updates.status !== undefined) {
    const staffUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.roleId !== undefined) staffUpdates.role = updates.roleId;
    if (updates.status !== undefined) staffUpdates.status = updates.status;

    const { error } = await fetchSupabase(
      `staff_profiles?id=eq.${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(staffUpdates),
      }
    );

    if (error) {
      return { success: false, error };
    }
  }

  // 2. Atualizar profiles (phone)
  if (updates.phone !== undefined) {
    const { error } = await fetchSupabase(
      `profiles?id=eq.${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ 
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (error) {
      return { success: false, error };
    }
  }

  // 3. Atualizar unit_assignments (se fornecido)
  if (updates.unitIds !== undefined) {
    // Primeiro, deletar todos os assignments existentes
    await fetchSupabase(
      `staff_unit_assignments?staff_id=eq.${id}`,
      { method: 'DELETE' }
    );

    // Depois, inserir os novos
    if (updates.unitIds.length > 0) {
      const assignments = updates.unitIds.map(unitId => ({
        staff_id: id,
        unit_id: unitId,
      }));

      const { error } = await fetchSupabase(
        'staff_unit_assignments',
        {
          method: 'POST',
          body: JSON.stringify(assignments),
        }
      );

      if (error) {
        return { success: false, error };
      }
    }
  }

  log('updateStaffUser() -> sucesso');
  return { success: true, error: null };
}

/**
 * Alterna o status de um membro (ativo <-> inativo)
 */
export async function toggleStaffStatus(id: string, currentStatus: StaffStatus): Promise<{ success: boolean; error: string | null }> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  return updateStaffUser(id, { status: newStatus });
}
