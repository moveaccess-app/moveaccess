/**
 * Users Service - Supabase
 * Interface compatível com usersMock para facilitar migração
 * 
 * Fase 1: Listagem e detalhe de alunos (students)
 * TODO: Histórico de status, Access, Contracts, Financial, Documents
 */

// ============================================================================
// TIPOS (compatíveis com usersMock, simplificados para Fase 1)
// ============================================================================

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'blocked';
export type UserType = 'student' | 'personal' | 'guest' | 'employee';
export type RegistrationOrigin = 'academy' | 'app' | 'website' | 'migration';
export type PlanStatus = 'active' | 'expired' | 'pending' | 'suspended' | 'cancelled';

export interface UserAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface PlanInfo {
  name: string | null;
  status: PlanStatus | null;
  expiresAt: string | null;
}

/**
 * User type simplificado para listagem e detalhe
 * Campos de Access, Contracts, Financial e Documents são TODO
 */
export interface User {
  id: string;
  
  // Identidade
  registrationId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  document: string | null; // CPF
  avatarUrl: string | null;
  userType: UserType;
  
  // Unidade e Academia
  unitId: string | null;
  unitName: string | null;
  academyId: string | null;
  academyName: string | null;
  
  // Registro
  registrationOrigin: RegistrationOrigin;
  createdAt: string;
  
  // Status
  status: UserStatus;
  statusReason: string | null;
  statusSince: string | null;
  
  // Dados pessoais
  birthDate: string | null;
  address: UserAddress | null;
  emergencyContact: EmergencyContact | null;
  
  // Plano (simplificado)
  currentPlan: PlanInfo | null;
  
  // TODO: Fase 2+
  // statusHistory: StatusHistory[];
  // access: AccessInfo;
  // contracts: Contract[];
  // financial: FinancialInfo;
  // documents: UserDocument[];
}

export interface UsersListResult {
  users: User[];
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
          'Prefer': 'return=representation',
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[UsersService] Erro na requisição:', errorData);
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    console.error('[UsersService] Erro:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

// ============================================================================
// CONVERSORES DB <-> UI
// ============================================================================

interface DbStudentRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  document: string | null;
  avatar_url: string | null;
  created_at: string;
  
  registration_id: string | null;
  status: UserStatus;
  status_reason: string | null;
  status_since: string | null;
  birth_date: string | null;
  registration_origin: string | null;
  address: UserAddress | null;
  emergency_contact: EmergencyContact | null;
  
  plan_name: string | null;
  plan_status: PlanStatus | null;
  plan_expires_at: string | null;
  
  unit_id: string | null;
  unit_name: string | null;
  
  academy_id: string | null;
  academy_name: string | null;
}

function dbRowToUser(row: DbStudentRow): User {
  return {
    id: row.id,
    registrationId: row.registration_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    document: row.document,
    avatarUrl: row.avatar_url,
    userType: 'student',
    
    unitId: row.unit_id,
    unitName: row.unit_name,
    academyId: row.academy_id,
    academyName: row.academy_name,
    
    registrationOrigin: (row.registration_origin as RegistrationOrigin) || 'app',
    createdAt: row.created_at,
    
    status: row.status,
    statusReason: row.status_reason,
    statusSince: row.status_since,
    
    birthDate: row.birth_date,
    address: row.address,
    emergencyContact: row.emergency_contact,
    
    currentPlan: row.plan_name ? {
      name: row.plan_name,
      status: row.plan_status,
      expiresAt: row.plan_expires_at,
    } : null,
  };
}

// ============================================================================
// SERVIÇO
// ============================================================================

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_USERS === 'true';

function log(...args: unknown[]) {
  if (DEBUG) console.log('[UsersService]', ...args);
}

/**
 * Busca todos os alunos da academy do usuário logado
 */
export async function getUsers(): Promise<UsersListResult> {
  log('getUsers()');
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(
    'student_list_view?select=*&order=full_name.asc'
  );
  
  if (error || !data) {
    console.error('[UsersService] Erro ao buscar usuários:', error);
    return { users: [], total: 0 };
  }
  
  const users = data.map(dbRowToUser);
  log('getUsers() ->', users.length, 'usuários');
  
  return { users, total: users.length };
}

/**
 * Busca um aluno pelo ID
 */
export async function getUserById(id: string): Promise<User | null> {
  log('getUserById()', id);
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(
    `student_list_view?id=eq.${id}&select=*`
  );
  
  if (error || !data || data.length === 0) {
    console.error('[UsersService] Erro ao buscar usuário:', error);
    return null;
  }
  
  const user = dbRowToUser(data[0]);
  log('getUserById() ->', user.fullName);
  
  return user;
}

/**
 * Filtra alunos por status
 */
export async function filterUsersByStatus(status: UserStatus | 'all'): Promise<UsersListResult> {
  log('filterUsersByStatus()', status);
  
  let endpoint = 'student_list_view?select=*&order=full_name.asc';
  
  if (status !== 'all') {
    endpoint += `&status=eq.${status}`;
  }
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(endpoint);
  
  if (error || !data) {
    console.error('[UsersService] Erro ao filtrar usuários:', error);
    return { users: [], total: 0 };
  }
  
  const users = data.map(dbRowToUser);
  log('filterUsersByStatus() ->', users.length, 'usuários');
  
  return { users, total: users.length };
}

/**
 * Busca alunos por texto (nome, email ou matrícula)
 */
export async function searchUsers(query: string): Promise<UsersListResult> {
  log('searchUsers()', query);
  
  if (!query.trim()) {
    return getUsers();
  }
  
  // Busca case-insensitive usando ilike
  const searchTerm = query.toLowerCase();
  const endpoint = `student_list_view?select=*&order=full_name.asc&or=(full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*,registration_id.ilike.*${searchTerm}*)`;
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(endpoint);
  
  if (error || !data) {
    console.error('[UsersService] Erro ao buscar usuários:', error);
    return { users: [], total: 0 };
  }
  
  const users = data.map(dbRowToUser);
  log('searchUsers() ->', users.length, 'usuários');
  
  return { users, total: users.length };
}

/**
 * Busca alunos com filtro combinado (status + busca)
 */
export async function searchAndFilterUsers(
  query: string,
  status: UserStatus | 'all'
): Promise<UsersListResult> {
  log('searchAndFilterUsers()', { query, status });
  
  let endpoint = 'student_list_view?select=*&order=full_name.asc';
  
  // Filtro de status
  if (status !== 'all') {
    endpoint += `&status=eq.${status}`;
  }
  
  // Filtro de busca
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    endpoint += `&or=(full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*,registration_id.ilike.*${searchTerm}*)`;
  }
  
  const { data, error } = await fetchSupabase<DbStudentRow[]>(endpoint);
  
  if (error || !data) {
    console.error('[UsersService] Erro ao buscar usuários:', error);
    return { users: [], total: 0 };
  }
  
  const users = data.map(dbRowToUser);
  log('searchAndFilterUsers() ->', users.length, 'usuários');
  
  return { users, total: users.length };
}

// ============================================================================
// FUNÇÕES AUXILIARES (compatibilidade com usersMock)
// ============================================================================

export function formatDate(dateString: string | null): string {
  if (!dateString || dateString === '-') return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateTimeString: string | null): string {
  if (!dateTimeString || dateTimeString === '-') return '-';
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
