/**
 * Team Service - Switch Layer
 * 
 * Alterna entre mock e Supabase baseado em feature flag.
 */

import {
  getStaffUsers as getMockStaffUsers,
  getRoles as getMockRoles,
  getUnits as getMockUnits,
  updateStaffUser as updateMockStaffUser,
  type StaffUser as MockStaffUser,
  type Role as MockRole,
  type RoleId,
  type StaffStatus,
} from '@/mocks/settingsMock';
import * as supabaseService from './teamServiceSupabase';
import { getUnits as getSupabaseUnits, type Unit } from './settingsService';

// Feature flag
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE_SETTINGS === 'true';

// Re-export types
export type { RoleId, StaffStatus } from './teamServiceSupabase';
export type { StaffUser, Role } from './teamServiceSupabase';

/**
 * Resultado padrão para listagem de staff
 */
export interface StaffListResult {
  data: supabaseService.StaffUser[];
  error: string | null;
}

/**
 * Busca todos os membros da equipe
 */
export async function getStaffUsers(): Promise<StaffListResult> {
  if (USE_SUPABASE) {
    try {
      const staff = await supabaseService.getStaffUsers();
      return { data: staff, error: null };
    } catch (err) {
      return { data: [], error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }
  
  // Adaptar mock para o tipo do Supabase
  const mockStaff = getMockStaffUsers();
  return { data: mockStaff.map(adaptMockToSupabase), error: null };
}

/**
 * Busca um membro pelo ID
 */
export async function getStaffUserById(id: string): Promise<supabaseService.StaffUser | null> {
  if (USE_SUPABASE) {
    return supabaseService.getStaffUserById(id);
  }
  
  const mockStaff = getMockStaffUsers().find(s => s.id === id);
  return mockStaff ? adaptMockToSupabase(mockStaff) : null;
}

/**
 * Busca todos os roles disponíveis
 */
export async function getRoles(): Promise<supabaseService.Role[]> {
  if (USE_SUPABASE) {
    return supabaseService.getRoles();
  }
  
  const mockRoles = getMockRoles();
  return mockRoles.map(adaptMockRoleToSupabase);
}

/**
 * Busca todas as unidades (para seleção no modal)
 */
export async function getUnits(): Promise<Unit[]> {
  if (USE_SUPABASE) {
    return getSupabaseUnits();
  }
  
  // Mock retorna sync, mas wrapper é async para consistência
  return getMockUnits().map(u => ({
    id: u.id,
    academyId: '',
    name: u.name,
    status: u.status as 'active' | 'inactive' | 'maintenance',
    address: u.address || {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
    phone: u.phone,
    email: u.email,
    operatingHours: u.operatingHours || [],
    accessConfig: {
      qrEnabled: true,
      qrToken: '',
      qrUrl: '',
      requireOtpNewDevice: true,
      toleranceMinutes: 15,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

/**
 * Atualiza um membro da equipe
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
  if (USE_SUPABASE) {
    return supabaseService.updateStaffUser(id, updates);
  }
  
  // Mock
  updateMockStaffUser(id, {
    roleId: updates.roleId,
    status: updates.status,
    unitIds: updates.unitIds,
    phone: updates.phone,
  }, 'current_user');
  
  return { success: true, error: null };
}

/**
 * Alterna o status de um membro
 */
export async function toggleStaffStatus(
  id: string,
  currentStatus: StaffStatus
): Promise<{ success: boolean; error: string | null }> {
  if (USE_SUPABASE) {
    return supabaseService.toggleStaffStatus(id, currentStatus);
  }
  
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  updateMockStaffUser(id, { status: newStatus }, 'current_user');
  
  return { success: true, error: null };
}

// ============================================================================
// ADAPTERS
// ============================================================================

function adaptMockToSupabase(mock: MockStaffUser): supabaseService.StaffUser {
  return {
    id: mock.id,
    name: mock.name,
    email: mock.email,
    cpf: mock.cpf || null,
    phone: mock.phone || null,
    avatarUrl: null,
    roleId: mock.roleId,
    status: mock.status,
    unitIds: mock.unitIds,
    lastLoginAt: mock.lastLoginAt?.toISOString() || null,
    lastLoginIp: mock.lastLoginIp || null,
    customPermissions: [],
    academyId: null,
    academyName: null,
    createdAt: mock.createdAt.toISOString(),
    updatedAt: mock.updatedAt.toISOString(),
  };
}

function adaptMockRoleToSupabase(mock: MockRole): supabaseService.Role {
  return {
    id: mock.id,
    name: mock.name,
    description: mock.description,
    permissions: mock.permissions as unknown as string[],
    isSystem: mock.isSystem,
  };
}
