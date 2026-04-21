/**
 * Settings Service - Switch Layer
 * Alterna entre mock e Supabase baseado em feature flag
 */

import { USE_SUPABASE_SETTINGS, DEBUG_SETTINGS } from './featureFlags';
import * as settingsMock from '@/mocks/settingsMock';
import * as settingsSupabase from './settingsServiceSupabase';

// Re-export types
export type { 
  Academy, 
  Unit, 
  UnitStatus, 
  AcademyStatus,
  AcademyPreferences,
  AccessScannerMode,
  Address,
  OperatingHour,
  AccessConfig,
  BillingAutomationPolicy,
  BillingPolicies,
  DelinquencyPolicy,
} from './settingsServiceSupabase';

export {
  BILLING_AUTOMATION_POLICY_DEFAULTS,
  BILLING_POLICIES_DEFAULTS,
  DELINQUENCY_POLICY_DEFAULTS,
} from './settingsServiceSupabase';

function log(...args: unknown[]) {
  if (DEBUG_SETTINGS) {
    console.log('[settingsService]', ...args);
  }
}

// ============================================================================
// ACADEMY
// ============================================================================

export async function getAcademy() {
  log('getAcademy', { useSupabase: USE_SUPABASE_SETTINGS });
  
  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.getAcademy();
  }
  
  // Mock é síncrono, converter para o formato do Supabase
  const mockAcademy = settingsMock.getAcademy();
  return {
    ...mockAcademy,
    status: 'active' as const,
  };
}

export async function updateAcademy(
  updates: Parameters<typeof settingsSupabase.updateAcademy>[0],
  updatedBy: string
): Promise<{ success: boolean; academy?: settingsSupabase.Academy; error?: string }> {
  log('updateAcademy', { useSupabase: USE_SUPABASE_SETTINGS, updates });
  
  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.updateAcademy(updates, updatedBy);
  }
  
  // Mock
  const academy = settingsMock.updateAcademy(updates as Partial<settingsMock.Academy>, updatedBy);
  return { 
    success: true, 
    academy: { ...academy, status: 'active' as const }
  };
}

// ============================================================================
// DELINQUENCY POLICY
// ============================================================================

export async function getDelinquencyPolicy() {
  log('getDelinquencyPolicy', { useSupabase: USE_SUPABASE_SETTINGS });

  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.getDelinquencyPolicy();
  }

  // Mock fallback — retorna defaults seguros
  return { ...settingsSupabase.DELINQUENCY_POLICY_DEFAULTS };
}

export async function getBillingPolicies() {
  log('getBillingPolicies', { useSupabase: USE_SUPABASE_SETTINGS });

  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.getBillingPolicies();
  }

  return {
    delinquency: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.delinquency },
    billing: {
      ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing,
      dueReminder: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing.dueReminder },
      overdueNotice: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing.overdueNotice },
      preBlock: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing.preBlock },
      escalation: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing.escalation },
      subscriptionExpiring: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing.subscriptionExpiring },
      paymentConfirmed: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing.paymentConfirmed },
      regularization: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing.regularization },
      reactivation: { ...settingsSupabase.BILLING_POLICIES_DEFAULTS.billing.reactivation },
    },
  };
}

export async function updateDelinquencyPolicy(
  policy: settingsSupabase.DelinquencyPolicy,
  updatedBy: string
) {
  log('updateDelinquencyPolicy', { useSupabase: USE_SUPABASE_SETTINGS, policy });

  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.updateDelinquencyPolicy(policy, updatedBy);
  }

  // Mock — sem persistência real
  return { success: true };
}

export async function updateBillingPolicies(
  policies: settingsSupabase.BillingPolicies,
  updatedBy: string,
) {
  log('updateBillingPolicies', { useSupabase: USE_SUPABASE_SETTINGS, policies });

  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.updateBillingPolicies(policies, updatedBy);
  }

  return { success: true };
}

// ============================================================================
// UNITS
// ============================================================================

export async function getUnits() {
  log('getUnits', { useSupabase: USE_SUPABASE_SETTINGS });
  
  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.getUnits();
  }
  
  // Mock
  return settingsMock.getUnits().map(u => ({
    ...u,
    academyId: 'mock_academy_001',
  }));
}

export async function getUnitById(id: string) {
  log('getUnitById', { useSupabase: USE_SUPABASE_SETTINGS, id });
  
  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.getUnitById(id);
  }
  
  const unit = settingsMock.getUnitById(id);
  return unit ? { ...unit, academyId: 'mock_academy_001' } : null;
}

export async function createUnit(
  unit: Parameters<typeof settingsSupabase.createUnit>[0],
  createdBy: string
) {
  log('createUnit', { useSupabase: USE_SUPABASE_SETTINGS, unit });
  
  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.createUnit(unit, createdBy);
  }
  
  // Mock
  const newUnit = settingsMock.createUnit(unit as Omit<settingsMock.Unit, 'id' | 'createdAt' | 'updatedAt'>, createdBy);
  return { 
    success: true, 
    unit: { ...newUnit, academyId: 'mock_academy_001' }
  };
}

export async function updateUnit(
  id: string,
  updates: Parameters<typeof settingsSupabase.updateUnit>[1],
  updatedBy: string
) {
  log('updateUnit', { useSupabase: USE_SUPABASE_SETTINGS, id, updates });
  
  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.updateUnit(id, updates, updatedBy);
  }
  
  // Mock
  const unit = settingsMock.updateUnit(id, updates as Partial<settingsMock.Unit>, updatedBy);
  if (unit) {
    return { success: true, unit: { ...unit, academyId: 'mock_academy_001' } };
  }
  return { success: false, error: 'Unidade não encontrada' };
}

export async function deleteUnit(id: string, deletedBy?: string) {
  log('deleteUnit', { useSupabase: USE_SUPABASE_SETTINGS, id });
  
  if (USE_SUPABASE_SETTINGS) {
    return settingsSupabase.deleteUnit(id);
  }
  
  // Mock
  const success = settingsMock.deleteUnit(id, deletedBy || 'system');
  return { success };
}
