/**
 * Team Service
 *
 * Módulo 100% Supabase para gestão de equipe.
 */

import * as supabaseService from './teamServiceSupabase';
import { getUnits as getSupabaseUnits, type Unit } from './settingsServiceSupabase';
import type { RoleId, StaffStatus } from './teamServiceSupabase';

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
  try {
    const staff = await supabaseService.getStaffUsers();
    return { data: staff, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

/**
 * Busca um membro pelo ID
 */
export async function getStaffUserById(id: string): Promise<supabaseService.StaffUser | null> {
  return supabaseService.getStaffUserById(id);
}

/**
 * Busca todos os roles disponíveis
 */
export async function getRoles(): Promise<supabaseService.Role[]> {
  return supabaseService.getRoles();
}

/**
 * Busca todas as unidades (para seleção no modal)
 */
export async function getUnits(): Promise<Unit[]> {
  return getSupabaseUnits();
}

export async function createStaffUser(
  input: supabaseService.CreateStaffInput
): Promise<{ success: boolean; error: string | null }> {
  return supabaseService.createStaffUser(input);
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
  return supabaseService.updateStaffUser(id, updates);
}

/**
 * Alterna o status de um membro
 */
export async function toggleStaffStatus(
  id: string,
  currentStatus: StaffStatus
): Promise<{ success: boolean; error: string | null }> {
  return supabaseService.toggleStaffStatus(id, currentStatus);
}
