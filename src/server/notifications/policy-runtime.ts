import type { SupabaseClient } from '@supabase/supabase-js';
import {
  BILLING_POLICIES_DEFAULTS,
  getEffectiveBillingPolicies,
  type BillingAutomationPolicy,
  type DelinquencyPolicy,
} from '@/lib/settings/policies';

interface AcademyPolicyRow {
  id: string;
  trade_name: string | null;
  preferences: {
    delinquency?: unknown;
    billing?: unknown;
  } | null;
}

export interface AcademyRuntimePolicy {
  academyId: string;
  academyName: string | null;
  delinquency: DelinquencyPolicy;
  billing: BillingAutomationPolicy;
}

export async function loadAcademyRuntimePolicies(
  supabase: SupabaseClient,
  academyIds?: string[],
): Promise<Map<string, AcademyRuntimePolicy>> {
  let query = supabase
    .from('academies')
    .select('id, trade_name, preferences');

  if (academyIds?.length) {
    query = query.in('id', academyIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[notifications] loadAcademyRuntimePolicies error:', error.message);
    return new Map();
  }

  const map = new Map<string, AcademyRuntimePolicy>();

  ((data || []) as AcademyPolicyRow[]).forEach((row) => {
    const effective = getEffectiveBillingPolicies(row.preferences);

    map.set(row.id, {
      academyId: row.id,
      academyName: row.trade_name,
      delinquency: effective.delinquency,
      billing: effective.billing,
    });
  });

  return map;
}

export async function getAcademyRuntimePolicy(
  supabase: SupabaseClient,
  academyId: string,
): Promise<AcademyRuntimePolicy> {
  const map = await loadAcademyRuntimePolicies(supabase, [academyId]);

  return map.get(academyId) || {
    academyId,
    academyName: null,
    delinquency: BILLING_POLICIES_DEFAULTS.delinquency,
    billing: BILLING_POLICIES_DEFAULTS.billing,
  };
}