/**
 * Settings Service - Supabase
 * Interface compatível com settingsMock para facilitar migração
 * 
 * Cobre: Academy e Units
 * TODO: Staff, Roles, Policies, Integrations, Audit (próximas iterações)
 */

import { getActiveAcademyId } from '@/lib/supabase/academyScope';

// ============================================================================
// TIPOS (compatíveis com settingsMock)
// ============================================================================

export type UnitStatus = 'active' | 'inactive' | 'maintenance';
export type AcademyStatus = 'active' | 'inactive' | 'suspended';
export type AccessScannerMode = 'entry_only' | 'separate_entry_exit' | 'single_entry_exit';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface DelinquencyPolicy {
  blockAccess: boolean;
  graceDays: number;
}

export const DELINQUENCY_POLICY_DEFAULTS: DelinquencyPolicy = {
  blockAccess: false,
  graceDays: 0,
};

export interface AcademyPreferences {
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  accessControl?: {
    scannerMode: AccessScannerMode;
    blockSecondEntryWithoutExit: boolean;
  };
  delinquency?: DelinquencyPolicy;
}

export interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface AccessConfig {
  qrEnabled: boolean;
  qrToken: string;
  qrUrl: string;
  dailyLimitDefault?: number;
  requireOtpNewDevice: boolean;
  toleranceMinutes: number;
}

export interface Academy {
  id: string;
  tradeName: string;
  legalName: string;
  cnpj: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address: Address;
  logoUrl?: string;
  preferences: AcademyPreferences;
  status: AcademyStatus;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export interface Unit {
  id: string;
  academyId: string;
  name: string;
  status: UnitStatus;
  address: Address;
  phone?: string;
  email?: string;
  operatingHours: OperatingHour[];
  accessConfig: AccessConfig;
  qrToken?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
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
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    // Para DELETE ou quando não há corpo
    if (response.status === 204 || options.method === 'DELETE') {
      return { data: null, error: null };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

// ============================================================================
// CONVERSORES DB <-> UI
// ============================================================================

interface AcademyRow {
  id: string;
  trade_name: string;
  legal_name: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: Address | null;
  logo_url: string | null;
  preferences: AcademyPreferences | null;
  status: AcademyStatus | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

interface UnitRow {
  id: string;
  academy_id: string;
  name: string;
  status: UnitStatus | null;
  phone: string | null;
  email: string | null;
  address: Address | null;
  operating_hours: OperatingHour[] | null;
  access_config: AccessConfig | null;
  qr_token: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

function rowToAcademy(row: AcademyRow): Academy {
  const defaultAccessControl: NonNullable<AcademyPreferences['accessControl']> = {
    scannerMode: 'entry_only',
    blockSecondEntryWithoutExit: false,
  };

  const defaultPreferences: AcademyPreferences = {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    accessControl: defaultAccessControl,
  };

  return {
    id: row.id,
    tradeName: row.trade_name,
    legalName: row.legal_name || '',
    cnpj: row.cnpj || '',
    email: row.email || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || undefined,
    address: row.address || {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
    logoUrl: row.logo_url || undefined,
    preferences: {
      ...defaultPreferences,
      ...(row.preferences || {}),
      accessControl: {
        scannerMode:
          row.preferences?.accessControl?.scannerMode
          ?? defaultAccessControl.scannerMode,
        blockSecondEntryWithoutExit:
          row.preferences?.accessControl?.blockSecondEntryWithoutExit
          ?? defaultAccessControl.blockSecondEntryWithoutExit,
      },
      delinquency: {
        blockAccess:
          (row.preferences as Record<string, unknown> | null)?.delinquency != null
            ? Boolean((row.preferences as { delinquency?: DelinquencyPolicy }).delinquency?.blockAccess)
            : DELINQUENCY_POLICY_DEFAULTS.blockAccess,
        graceDays:
          (row.preferences as Record<string, unknown> | null)?.delinquency != null
            ? Number((row.preferences as { delinquency?: DelinquencyPolicy }).delinquency?.graceDays) || 0
            : DELINQUENCY_POLICY_DEFAULTS.graceDays,
      },
    },
    status: row.status || 'active',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    updatedBy: row.updated_by || undefined,
  };
}

function rowToUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    academyId: row.academy_id,
    name: row.name,
    status: row.status || 'active',
    address: row.address || {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
    phone: row.phone || undefined,
    email: row.email || undefined,
    operatingHours: row.operating_hours || [],
    accessConfig: row.access_config || {
      qrEnabled: false,
      qrToken: '',
      qrUrl: '',
      requireOtpNewDevice: false,
      toleranceMinutes: 15,
    },
    qrToken: row.qr_token || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    updatedBy: row.updated_by || undefined,
  };
}

// ============================================================================
// FUNÇÕES DE ACADEMY
// ============================================================================

/**
 * Obtém a academia do usuário logado
 */
export async function getAcademy(): Promise<Academy | null> {
  const academyId = await getActiveAcademyId();

  if (!academyId) {
    console.error('Erro ao buscar academy_id: usuário sem academia');
    return null;
  }

  // Buscar dados da academy
  const { data: academies, error } = await fetchSupabase<AcademyRow[]>(
    `academies?id=eq.${academyId}&select=*`
  );

  if (error || !academies?.[0]) {
    console.error('Erro ao buscar academy:', error);
    return null;
  }

  return rowToAcademy(academies[0]);
}

/**
 * Atualiza a academia
 */
export async function updateAcademy(
  updates: Partial<Academy>,
  updatedBy: string
): Promise<{ success: boolean; academy?: Academy; error?: string }> {
  // Buscar ID da academy
  const academyId = await getActiveAcademyId();

  if (!academyId) {
    return { success: false, error: 'Academy não encontrada' };
  }

  // Converter para formato do banco
  const dbUpdates: Partial<AcademyRow> = {
    ...(updates.tradeName && { trade_name: updates.tradeName }),
    ...(updates.legalName && { legal_name: updates.legalName }),
    ...(updates.cnpj && { cnpj: updates.cnpj }),
    ...(updates.email && { email: updates.email }),
    ...(updates.phone && { phone: updates.phone }),
    ...(updates.whatsapp !== undefined && { whatsapp: updates.whatsapp }),
    ...(updates.address && { address: updates.address }),
    ...(updates.logoUrl !== undefined && { logo_url: updates.logoUrl }),
    ...(updates.preferences && { preferences: updates.preferences }),
    ...(updates.status && { status: updates.status }),
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  const { error } = await fetchSupabase(
    `academies?id=eq.${academyId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dbUpdates),
    }
  );

  if (error) {
    return { success: false, error };
  }

  // Buscar academy atualizada
  const academy = await getAcademy();
  return { success: true, academy: academy || undefined };
}

// ============================================================================
// DELINQUENCY POLICY (convenience wrappers)
// ============================================================================

/**
 * Lê a política de inadimplência da academia do usuário logado.
 * Retorna defaults seguros se nada estiver configurado.
 */
export async function getDelinquencyPolicy(): Promise<DelinquencyPolicy> {
  const academy = await getAcademy();
  if (!academy) return { ...DELINQUENCY_POLICY_DEFAULTS };
  return academy.preferences.delinquency ?? { ...DELINQUENCY_POLICY_DEFAULTS };
}

/**
 * Atualiza a política de inadimplência.
 * Faz merge seguro: lê preferences atual → sobrescreve só delinquency → grava inteiro.
 * Validação: graceDays deve ser >= 0 e inteiro.
 */
export async function updateDelinquencyPolicy(
  policy: DelinquencyPolicy,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  // Validação forte
  if (typeof policy.blockAccess !== 'boolean') {
    return { success: false, error: 'blockAccess deve ser verdadeiro ou falso' };
  }
  const graceDays = Math.floor(Number(policy.graceDays));
  if (!Number.isFinite(graceDays) || graceDays < 0 || graceDays > 365) {
    return { success: false, error: 'graceDays deve ser um número inteiro entre 0 e 365' };
  }

  // Ler academy atual para merge seguro de preferences
  const academy = await getAcademy();
  if (!academy) {
    return { success: false, error: 'Academia não encontrada' };
  }

  const mergedPreferences: AcademyPreferences = {
    ...academy.preferences,
    delinquency: {
      blockAccess: policy.blockAccess,
      graceDays,
    },
  };

  const result = await updateAcademy(
    { preferences: mergedPreferences },
    updatedBy
  );

  return { success: result.success, error: result.error };
}

// ============================================================================
// FUNÇÕES DE UNITS
// ============================================================================

/**
 * Lista unidades da academia do usuário
 */
export async function getUnits(): Promise<Unit[]> {
  const { data, error } = await fetchSupabase<UnitRow[]>(
    'units?select=*&order=name.asc'
  );

  if (error || !data) {
    console.error('Erro ao buscar units:', error);
    return [];
  }

  return data.map(rowToUnit);
}

/**
 * Obtém uma unidade por ID
 */
export async function getUnitById(id: string): Promise<Unit | null> {
  const { data, error } = await fetchSupabase<UnitRow[]>(
    `units?id=eq.${id}&select=*`
  );

  if (error || !data?.[0]) {
    console.error('Erro ao buscar unit:', error);
    return null;
  }

  return rowToUnit(data[0]);
}

/**
 * Cria uma nova unidade
 */
export async function createUnit(
  unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<{ success: boolean; unit?: Unit; error?: string }> {
  // Buscar academy_id
  const academyId = await getActiveAcademyId();

  if (!academyId) {
    return { success: false, error: 'Academy não encontrada' };
  }

  const dbUnit = {
    academy_id: academyId,
    name: unit.name,
    status: unit.status,
    phone: unit.phone,
    email: unit.email,
    address: unit.address,
    operating_hours: unit.operatingHours,
    access_config: unit.accessConfig,
    qr_token: unit.qrToken || `qr_${Date.now()}`,
    updated_by: createdBy,
  };

  const { data, error } = await fetchSupabase<UnitRow[]>(
    'units',
    {
      method: 'POST',
      body: JSON.stringify(dbUnit),
      headers: {
        'Prefer': 'return=representation',
      },
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Erro ao criar unidade' };
  }

  return { success: true, unit: rowToUnit(data[0]) };
}

/**
 * Atualiza uma unidade
 */
export async function updateUnit(
  id: string,
  updates: Partial<Unit>,
  updatedBy: string
): Promise<{ success: boolean; unit?: Unit; error?: string }> {
  const dbUpdates: Partial<UnitRow> = {
    ...(updates.name && { name: updates.name }),
    ...(updates.status && { status: updates.status }),
    ...(updates.phone !== undefined && { phone: updates.phone }),
    ...(updates.email !== undefined && { email: updates.email }),
    ...(updates.address && { address: updates.address }),
    ...(updates.operatingHours && { operating_hours: updates.operatingHours }),
    ...(updates.accessConfig && { access_config: updates.accessConfig }),
    ...(updates.qrToken && { qr_token: updates.qrToken }),
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  const { error } = await fetchSupabase(
    `units?id=eq.${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dbUpdates),
    }
  );

  if (error) {
    return { success: false, error };
  }

  const unit = await getUnitById(id);
  return { success: true, unit: unit || undefined };
}

/**
 * Deleta uma unidade
 */
export async function deleteUnit(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await fetchSupabase(
    `units?id=eq.${id}`,
    { method: 'DELETE' }
  );

  if (error) {
    return { success: false, error };
  }

  return { success: true };
}
