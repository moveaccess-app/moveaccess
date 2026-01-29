/**
 * Users Service - Switch Layer
 * 
 * Alterna entre mock e Supabase baseado em feature flag.
 * Retorna o tipo User COMPLETO do mock (com campos default para Supabase).
 * Assim a UI não precisa ser alterada.
 */

import * as mockService from '@/mocks/usersMock';
import type { User as MockUser, UserStatus } from '@/mocks/usersMock';
import * as supabaseService from './usersServiceSupabase';

// Feature flag
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE_USERS === 'true';

// Re-export do tipo COMPLETO do mock (para a UI)
export type { 
  User, 
  UserStatus, 
  UserType,
  AccessInfo,
  PlanInfo,
  FinancialInfo,
  Contract,
} from '@/mocks/usersMock';

// Re-export formatters
export { formatDate, formatDateTime, formatCurrency } from '@/mocks/usersMock';

export interface UsersListResult {
  users: MockUser[];
  total: number;
}

/**
 * Busca todos os alunos
 */
export async function getUsers(): Promise<UsersListResult> {
  if (USE_SUPABASE) {
    const result = await supabaseService.getUsers();
    return {
      users: result.users.map(adaptSupabaseToMock),
      total: result.total,
    };
  }
  
  return {
    users: mockService.mockUsers,
    total: mockService.mockUsers.length,
  };
}

/**
 * Busca um aluno pelo ID
 */
export async function getUserById(id: string): Promise<MockUser | null> {
  if (USE_SUPABASE) {
    const user = await supabaseService.getUserById(id);
    return user ? adaptSupabaseToMock(user) : null;
  }
  
  return mockService.getUserById(id) || null;
}

/**
 * Filtra alunos por status
 */
export async function filterUsersByStatus(
  status: UserStatus | 'all'
): Promise<UsersListResult> {
  if (USE_SUPABASE) {
    const result = await supabaseService.filterUsersByStatus(status);
    return {
      users: result.users.map(adaptSupabaseToMock),
      total: result.total,
    };
  }
  
  const filtered = mockService.filterUsersByStatus(mockService.mockUsers, status);
  return {
    users: filtered,
    total: filtered.length,
  };
}

/**
 * Busca alunos por texto
 */
export async function searchUsers(query: string): Promise<UsersListResult> {
  if (USE_SUPABASE) {
    const result = await supabaseService.searchUsers(query);
    return {
      users: result.users.map(adaptSupabaseToMock),
      total: result.total,
    };
  }
  
  const found = mockService.searchUsers(mockService.mockUsers, query);
  return {
    users: found,
    total: found.length,
  };
}

/**
 * Busca alunos com filtro combinado
 */
export async function searchAndFilterUsers(
  query: string,
  status: UserStatus | 'all'
): Promise<UsersListResult> {
  if (USE_SUPABASE) {
    const result = await supabaseService.searchAndFilterUsers(query, status);
    return {
      users: result.users.map(adaptSupabaseToMock),
      total: result.total,
    };
  }
  
  let results = mockService.mockUsers;
  
  if (status !== 'all') {
    results = mockService.filterUsersByStatus(results, status);
  }
  
  if (query.trim()) {
    results = mockService.searchUsers(results, query);
  }
  
  return {
    users: results,
    total: results.length,
  };
}

// ============================================================================
// ADAPTER: Supabase User -> Mock User (completo)
// Preenche campos faltantes com valores default para manter UI funcionando
// ============================================================================

function adaptSupabaseToMock(user: supabaseService.User): MockUser {
  const now = new Date().toISOString();
  
  return {
    id: user.id,
    registrationId: user.registrationId || 'SEM-MATRICULA',
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || '',
    document: user.document || '',
    userType: 'student',
    unitId: user.unitId || '',
    unitName: user.unitName || 'Sem unidade',
    registrationOrigin: user.registrationOrigin || 'app',
    createdAt: user.createdAt,
    
    status: user.status,
    statusReason: user.statusReason || undefined,
    statusSince: user.statusSince || user.createdAt,
    statusHistory: [{
      status: user.status,
      reason: user.statusReason || 'Status atual',
      changedAt: user.statusSince || user.createdAt,
      changedBy: 'system',
    }],
    
    // Access: valores default (TODO: implementar módulo Access)
    access: {
      isAllowed: user.status === 'active',
      lastCheckIn: null,
      checkInsLast7Days: 0,
      checkInsLast30Days: 0,
      digitalCard: {
        status: user.status === 'active' ? 'generated' : 'pending',
        generatedAt: user.createdAt,
      },
    },
    
    // Plano: converter do formato simplificado
    currentPlan: user.currentPlan ? {
      id: 'plan-supabase',
      name: user.currentPlan.name || 'Plano',
      startDate: user.createdAt,
      endDate: user.currentPlan.expiresAt || now,
      billingType: 'monthly',
      autoRenewal: true,
      nextDueDate: user.currentPlan.expiresAt || now,
      currentValue: 0,
    } : null,
    
    // Contratos: valores default (TODO: implementar módulo Contracts)
    contracts: [],
    currentContractId: undefined,
    
    // Financeiro: valores default (TODO: implementar módulo Financial)
    financial: {
      status: 'up_to_date',
      daysOverdue: 0,
      lastPayment: null,
      pendingBalance: 0,
      nextDueDate: now,
      nextDueValue: 0,
    },
    
    // Documentos: valores default (TODO: implementar módulo Documents)
    documents: [],
  };
}

