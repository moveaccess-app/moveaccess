// Use-case: Update an Asaas subscription (safe fields only: value).
//
// Flow:
//   1. Validate authorization (staff + academy membership)
//   2. Find existing Asaas subscription link
//   3. Validate that only safe fields are being updated
//   4. Resolve credentials and build Asaas client
//   5. Update the subscription on Asaas (PUT /v3/subscriptions/{id})
//   6. Update local link with new values
//   7. Return typed result
//
// ⚠️ Only value updates are allowed. Changing cycle or billingType
// on an active Asaas subscription can break existing payment schedules
// and is intentionally blocked.

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCredentialResolver } from './credential-resolver';
import { AsaasClient } from './asaas-client';
import { requireStaffForAcademy, AuthorizationError } from './auth';
import type { AsaasEnvironment, AsaasSubscriptionUpdateRequest } from './types';

export { AuthorizationError };

// ─── Input / Output ──────────────────────────────────────────────

export interface UpdateAsaasSubscriptionInput {
  subscriptionId: string;
  academyId: string;
  /** New value in BRL. Must be > 0. */
  value?: number;
  /** New description (optional). */
  description?: string;
  /** New nextDueDate (optional). */
  nextDueDate?: string;
}

export interface UpdateAsaasSubscriptionResult {
  success: true;
  action: 'updated' | 'no_external_link' | 'no_changes';
  asaasSubscriptionId: string | null;
  updatedFields: string[];
}

// ─── Errors ──────────────────────────────────────────────────────

export class SubscriptionUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionUpdateError';
  }
}

// ─── Find existing link ──────────────────────────────────────────

interface ExistingLink {
  id: string;
  asaas_subscription_id: string;
  asaas_account_id: string;
  asaas_status: string;
  environment: AsaasEnvironment;
  value: number;
}

async function findExistingLink(subscriptionId: string, academyId: string): Promise<ExistingLink | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_subscriptions')
    .select('id, asaas_subscription_id, asaas_account_id, asaas_status, environment, value')
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

// ─── Update local link ──────────────────────────────────────────

async function updateLinkValues(linkId: string, updates: Record<string, unknown>): Promise<void> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('asaas_subscriptions')
    .update({
      ...updates,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', linkId);

  if (error) {
    console.error(`[update-subscription] Falha ao atualizar link ${linkId}: ${error.message}`);
  }
}

// ─── Main use-case ───────────────────────────────────────────────

export async function updateAsaasSubscription(
  input: UpdateAsaasSubscriptionInput,
): Promise<UpdateAsaasSubscriptionResult> {
  // 1. Validate authorization
  await requireStaffForAcademy(input.academyId);

  // 2. Find existing external link
  const link = await findExistingLink(input.subscriptionId, input.academyId);

  if (!link) {
    return {
      success: true,
      action: 'no_external_link',
      asaasSubscriptionId: null,
      updatedFields: [],
    };
  }

  // 3. Only update active subscriptions
  if (link.asaas_status !== 'ACTIVE') {
    throw new SubscriptionUpdateError(
      `Assinatura externa está com status "${link.asaas_status}". ` +
      `Apenas assinaturas ACTIVE podem ser atualizadas.`,
    );
  }

  // 4. Build update payload (only safe fields)
  const asaasPayload: AsaasSubscriptionUpdateRequest = {};
  const updatedFields: string[] = [];
  const localUpdates: Record<string, unknown> = {};

  if (input.value !== undefined && input.value > 0 && input.value !== Number(link.value)) {
    asaasPayload.value = input.value;
    localUpdates.value = input.value;
    updatedFields.push('value');
  }

  if (input.description !== undefined) {
    asaasPayload.description = input.description;
    localUpdates.description = input.description;
    updatedFields.push('description');
  }

  if (input.nextDueDate !== undefined) {
    asaasPayload.nextDueDate = input.nextDueDate;
    localUpdates.next_due_date = input.nextDueDate;
    updatedFields.push('nextDueDate');
  }

  if (updatedFields.length === 0) {
    return {
      success: true,
      action: 'no_changes',
      asaasSubscriptionId: link.asaas_subscription_id,
      updatedFields: [],
    };
  }

  // 5. Resolve credentials and build client
  const { apiKey } = await resolveApiKeyForAccount(link.asaas_account_id);
  const client = new AsaasClient(apiKey, link.environment);

  // 6. Update on Asaas
  await client.updateSubscription(link.asaas_subscription_id, asaasPayload);

  // 7. Update local link
  await updateLinkValues(link.id, localUpdates);

  return {
    success: true,
    action: 'updated',
    asaasSubscriptionId: link.asaas_subscription_id,
    updatedFields,
  };
}
