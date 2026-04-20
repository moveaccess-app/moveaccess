import { getAcademy, getUnits, type Academy, type Unit } from './settingsService';
import { getStaffUsers } from './teamService';
import { getAsaasConnectionState } from './integrationsService';

export interface SettingsTeamSummary {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  hasError: boolean;
  errorMessage: string | null;
}

export interface SettingsIntegrationSummary {
  total: number;
  connected: number;
  errorCount: number;
  hasIssue: boolean;
  source: 'real' | 'placeholder';
}

export interface SettingsOverview {
  academy: Academy | null;
  units: Unit[];
  team: SettingsTeamSummary;
  integrations: SettingsIntegrationSummary;
}

const EMPTY_TEAM_SUMMARY: SettingsTeamSummary = {
  total: 0,
  active: 0,
  inactive: 0,
  pending: 0,
  hasError: false,
  errorMessage: null,
};

const FALLBACK_INTEGRATIONS: SettingsIntegrationSummary = {
  total: 0,
  connected: 0,
  errorCount: 0,
  hasIssue: false,
  source: 'placeholder',
};

function buildTeamSummary(
  staff: Awaited<ReturnType<typeof getStaffUsers>>['data'],
  error: string | null
): SettingsTeamSummary {
  return {
    total: staff.length,
    active: staff.filter((member) => member.status === 'active').length,
    inactive: staff.filter((member) => member.status === 'inactive').length,
    pending: staff.filter((member) => member.status === 'pending').length,
    hasError: !!error,
    errorMessage: error,
  };
}

async function buildIntegrationsSummary(): Promise<SettingsIntegrationSummary> {
  try {
    const state = await getAsaasConnectionState();
    const isConnected = state.status === 'connected';
    const hasError = state.status === 'error';
    return {
      total: state.account ? 1 : 0,
      connected: isConnected ? 1 : 0,
      errorCount: hasError ? 1 : 0,
      hasIssue: hasError,
      source: 'real',
    };
  } catch {
    return FALLBACK_INTEGRATIONS;
  }
}

export async function getSettingsOverview(): Promise<SettingsOverview> {
  const [academy, units, staffResult, integrations] = await Promise.all([
    getAcademy(),
    getUnits(),
    getStaffUsers().catch((error) => ({
      data: [],
      error: error instanceof Error ? error.message : 'Erro ao carregar equipe',
    })),
    buildIntegrationsSummary(),
  ]);

  return {
    academy,
    units,
    team: buildTeamSummary(staffResult.data, staffResult.error),
    integrations,
  };
}

export function getEmptySettingsOverview(): SettingsOverview {
  return {
    academy: null,
    units: [],
    team: EMPTY_TEAM_SUMMARY,
    integrations: FALLBACK_INTEGRATIONS,
  };
}