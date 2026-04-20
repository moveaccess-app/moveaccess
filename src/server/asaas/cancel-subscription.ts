// Use-case: Cancel a subscription on Asaas when cancelled locally.
//
// Flow:
//   1. Validate authorization (staff + academy membership)
//   2. Find existing Asaas subscription link
//   3. Resolve credentials and build Asaas client
//   4. Cancel the subscription on Asaas (DELETE /v3/subscriptions/{id})
//   5. Update local link status to INACTIVE
//   6. Return typed result

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCredentialResolver } from './credential-resolver';
import { AsaasClient, AsaasApiError } from './asaas-client';
import { requireStaffForAcademy, AuthorizationError } from './auth';
import type { AsaasEnvironment } from './types';

export { AuthorizationError };

// ─── Input / Output ──────────────────────────────────────────────

export interface CancelAsaasSubscriptionInput {
  subscriptionId: string;
  academyId: string;
}

export interface CancelAsaasSubscriptionResult {
  success: true;
  action: 'cancelled' | 'already_inactive' | 'no_external_link';
  asaasSubscriptionId: string | null;
  previousStatus: string | null;
}

// ─── Errors ──────────────────────────────────────────────────────

export class SubscriptionCancelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionCancelError';
  }
}

// ─── Find existing link ──────────────────────────────────────────

interface ExistingLink {
  id: string;
  asaas_subscription_id: string;
  asaas_account_id: string;
  asaas_status: string;
  environment: AsaasEnvironment;
}

async function findExistingLink(subscriptionId: string, academyId: string): Promise<ExistingLink | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_subscriptions')
    .select('id, asaas_subscription_id, asaas_account_id, asaas_status, environment')
    .eq('subscription_id', subscriptionId)
    .eq('academy_id', academyId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar vínculo de assinatura externa: ${error.message}`);
  }

  return data as unknown as ExistingLink | null;
}

// ─── Resolve API key from account ────────────────────────────────

async function resolveApiKeyForAccount(asaasAccountId: string): Promise<{ apiKey: string }> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_accounts')
    .select('api_key_reference')
    .eq('id', asaasAccountId)
    .single();

  if (error || !data) {
    throw new Error(`Conta Asaas ${asaasAccountId} não encontrada.`);
  }

  const resolver = getCredentialResolver();
  const apiKey = await resolver.resolve((data as unknown as { api_key_reference: string }).api_key_reference);

  return { apiKey };
}

// ─── Update local link status ────────────────────────────────────

async function updateLinkStatus(linkId: string, asaasStatus: string): Promise<void> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('asaas_subscriptions')
    .update({
      asaas_status: asaasStatus,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', linkId);

  if (error) {
    console.error(`[cancel-subscription] Falha ao atualizar status do link ${linkId}: ${error.message}`);
  }
}

// ─── Main use-case ───────────────────────────────────────────────

export async function cancelAsaasSubscription(
  input: CancelAsaasSubscriptionInput,
): Promise<CancelAsaasSubscriptionResult> {
  // 1. Validate authorization
  await requireStaffForAcademy(input.academyId);

  // 2. Find existing external link
  const link = await findExistingLink(input.subscriptionId, input.academyId);

  if (!link) {
    // No Asaas subscription — local-only subscription, nothing to cancel externally
    return {
      success: true,
      action: 'no_external_link',
      asaasSubscriptionId: null,
      previousStatus: null,
    };
  }

  // 3. If already inactive/expired, skip API call
  if (link.asaas_status === 'INACTIVE' || link.asaas_status === 'EXPIRED') {
    return {
      success: true,
      action: 'already_inactive',
      asaasSubscriptionId: link.asaas_subscription_id,
      previousStatus: link.asaas_status,
    };
  }

  // 4. Resolve credentials and build client
  const { apiKey } = await resolveApiKeyForAccount(link.asaas_account_id);
  const client = new AsaasClient(apiKey, link.environment);

  // 5. Cancel on Asaas
  try {
    await client.cancelSubscription(link.asaas_subscription_id);
  } catch (err) {
    if (err instanceof AsaasApiError) {
      // If Asaas says it's already deleted/inactive, treat as success
      const alreadyDeleted = err.errors?.some(
        (e) => e.code === 'invalid_action' || e.code === 'not_found',
      );
      if (alreadyDeleted) {
        await updateLinkStatus(link.id, 'INACTIVE');
        return {
          success: true,
          action: 'already_inactive',
          asaasSubscriptionId: link.asaas_subscription_id,
          previousStatus: link.asaas_status,
        };
      }
    }
    throw err;
  }

  // 6. Update local link status
  await updateLinkStatus(link.id, 'INACTIVE');

  return {
    success: true,
    action: 'cancelled',
    asaasSubscriptionId: link.asaas_subscription_id,
    previousStatus: link.asaas_status,
  };
}
