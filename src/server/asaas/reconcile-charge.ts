import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { requireStaffForAcademy } from './auth';
import { AsaasClient } from './asaas-client';
import {
  deriveChargeSyncEffectFromPaymentSnapshot,
  loadChargeById,
  syncChargeAndPaymentFromSnapshot,
  toChargeSnapshotFromPaymentResponse,
  type ChargeSyncState,
} from './charge-sync';
import { getCredentialResolver } from './credential-resolver';
import type { AsaasEnvironment } from './types';
import type { LocalPaymentStatus } from './webhook-types';

interface AsaasAccountCredentialRow {
  academy_id: string;
  api_key_reference: string | null;
}

export interface ReconcileChargeInput {
  chargeId: string;
}

export interface ReconcileChargeResult {
  success: true;
  action: 'updated' | 'noop';
  chargeId: string;
  paymentId: string;
  asaasPaymentId: string;
  environment: AsaasEnvironment;
  before: ChargeSyncState;
  after: ChargeSyncState;
  external: {
    status: string;
    deleted: boolean;
    billingType: string;
    dueDate: string;
    paymentDate: string | null;
    value: number;
    netValue: number | null;
    invoiceUrl: string | null;
    bankSlipUrl: string | null;
    externalReference: string | null;
  };
  changes: {
    chargeUpdated: boolean;
    paymentUpdated: boolean;
    resolvedChargeStatus: string;
    resolvedPaymentStatus: LocalPaymentStatus | null;
  };
}

export class ChargeNotFoundError extends Error {
  constructor(chargeId: string) {
    super(`Charge ${chargeId} não encontrada.`);
    this.name = 'ChargeNotFoundError';
  }
}

async function loadAsaasAccountCredential(accountId: string): Promise<AsaasAccountCredentialRow> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('asaas_accounts')
    .select('academy_id, api_key_reference')
    .eq('id', accountId)
    .single();

  if (error || !data) {
    throw new Error(`Conta Asaas ${accountId} não encontrada: ${error?.message ?? 'unknown'}`);
  }

  return data as AsaasAccountCredentialRow;
}

export async function reconcileCharge(input: ReconcileChargeInput): Promise<ReconcileChargeResult> {
  const supabase = createAdminSupabaseClient();
  const charge = await loadChargeById(supabase, input.chargeId);

  if (!charge) {
    throw new ChargeNotFoundError(input.chargeId);
  }

  await requireStaffForAcademy(charge.academy_id);

  const account = await loadAsaasAccountCredential(charge.asaas_account_id);

  if (account.academy_id !== charge.academy_id) {
    throw new Error(`Conta Asaas ${charge.asaas_account_id} não pertence à academia da charge.`);
  }

  if (!account.api_key_reference) {
    throw new Error(`Conta Asaas ${charge.asaas_account_id} sem api_key_reference configurada.`);
  }

  const credentialResolver = getCredentialResolver();
  const apiKey = await credentialResolver.resolve(account.api_key_reference);
  const environment = charge.environment as AsaasEnvironment;
  const client = new AsaasClient(apiKey, environment);

  console.info(`[asaas][reconcile] charge=${charge.id} payment=${charge.asaas_payment_id} env=${environment}`);

  const asaasPayment = await client.getPayment(charge.asaas_payment_id);
  const snapshot = toChargeSnapshotFromPaymentResponse(asaasPayment);
  const effect = deriveChargeSyncEffectFromPaymentSnapshot(snapshot);
  const outcome = await syncChargeAndPaymentFromSnapshot(supabase, charge, snapshot, effect);

  return {
    success: true,
    action: outcome.chargeUpdated || outcome.paymentUpdated ? 'updated' : 'noop',
    chargeId: charge.id,
    paymentId: charge.payment_id,
    asaasPaymentId: charge.asaas_payment_id,
    environment,
    before: outcome.before,
    after: outcome.after,
    external: {
      status: asaasPayment.status,
      deleted: asaasPayment.deleted,
      billingType: asaasPayment.billingType,
      dueDate: asaasPayment.dueDate,
      paymentDate: asaasPayment.paymentDate ?? null,
      value: asaasPayment.value,
      netValue: asaasPayment.netValue ?? null,
      invoiceUrl: asaasPayment.invoiceUrl ?? null,
      bankSlipUrl: asaasPayment.bankSlipUrl ?? null,
      externalReference: asaasPayment.externalReference ?? null,
    },
    changes: {
      chargeUpdated: outcome.chargeUpdated,
      paymentUpdated: outcome.paymentUpdated,
      resolvedChargeStatus: outcome.resolvedChargeStatus,
      resolvedPaymentStatus: outcome.resolvedPaymentStatus,
    },
  };
}
