import type { SupabaseClient } from '@supabase/supabase-js';
import type { AsaasPaymentResponse, AsaasPaymentStatus } from './types';
import {
  ASAAS_EVENT_STATUS_MAP,
  type AsaasPaymentWebhookEvent,
  type AsaasWebhookPaymentData,
  type LocalPaymentStatus,
} from './webhook-types';

type AdminSupabaseClient = SupabaseClient;

export interface LocalChargeRow {
  id: string;
  academy_id: string;
  payment_id: string;
  asaas_account_id: string;
  environment: string;
  asaas_payment_id: string;
  external_reference: string | null;
  billing_type: string;
  asaas_status: string;
  value: number | string;
  net_value: number | string | null;
  due_date: string;
  payment_date: string | null;
  invoice_url: string | null;
  bank_slip_url: string | null;
  synced_at: string;
}

export interface LocalPaymentRow {
  id: string;
  status: LocalPaymentStatus;
  paid_at: string | null;
}

export interface ChargeSyncEffect {
  chargeStatus: string;
  paymentStatus: LocalPaymentStatus | null;
  setPaidAt: boolean;
}

export interface AsaasChargeSnapshot {
  id: string;
  status: AsaasPaymentStatus;
  deleted?: boolean;
  billingType: string;
  value: number;
  netValue: number | null;
  dueDate: string;
  paymentDate: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  externalReference: string | null;
}

export interface ChargeSyncState {
  chargeStatus: string;
  billingType: string;
  value: number;
  netValue: number | null;
  dueDate: string;
  paymentDate: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  paymentStatus: LocalPaymentStatus | null;
  paidAt: string | null;
}

export interface ChargeSyncOutcome {
  chargeUpdated: boolean;
  paymentUpdated: boolean;
  before: ChargeSyncState;
  after: ChargeSyncState;
  resolvedChargeStatus: string;
  resolvedPaymentStatus: LocalPaymentStatus | null;
}

const ASAAS_PAYMENT_STATUS_SYNC_MAP: Partial<Record<AsaasPaymentStatus, ChargeSyncEffect>> = {
  PENDING: { chargeStatus: 'PENDING', paymentStatus: 'pending', setPaidAt: false },
  CONFIRMED: { chargeStatus: 'CONFIRMED', paymentStatus: 'pending', setPaidAt: false },
  RECEIVED: { chargeStatus: 'RECEIVED', paymentStatus: 'paid', setPaidAt: true },
  RECEIVED_IN_CASH: { chargeStatus: 'RECEIVED_IN_CASH', paymentStatus: 'paid', setPaidAt: true },
  OVERDUE: { chargeStatus: 'OVERDUE', paymentStatus: 'pending', setPaidAt: false },
  REFUNDED: { chargeStatus: 'REFUNDED', paymentStatus: 'refunded', setPaidAt: false },
  REFUND_REQUESTED: { chargeStatus: 'REFUND_REQUESTED', paymentStatus: null, setPaidAt: false },
  REFUND_IN_PROGRESS: { chargeStatus: 'REFUND_IN_PROGRESS', paymentStatus: null, setPaidAt: false },
  CHARGEBACK_REQUESTED: { chargeStatus: 'CHARGEBACK_REQUESTED', paymentStatus: null, setPaidAt: false },
  CHARGEBACK_DISPUTE: { chargeStatus: 'CHARGEBACK_DISPUTE', paymentStatus: null, setPaidAt: false },
  AWAITING_CHARGEBACK_REVERSAL: { chargeStatus: 'AWAITING_CHARGEBACK_REVERSAL', paymentStatus: null, setPaidAt: false },
  DUNNING_REQUESTED: { chargeStatus: 'DUNNING_REQUESTED', paymentStatus: 'pending', setPaidAt: false },
  DUNNING_RECEIVED: { chargeStatus: 'DUNNING_RECEIVED', paymentStatus: 'pending', setPaidAt: false },
  AWAITING_RISK_ANALYSIS: { chargeStatus: 'AWAITING_RISK_ANALYSIS', paymentStatus: null, setPaidAt: false },
};

function toNullableNumber(value: number | string | null): number | null {
  if (value == null) {
    return null;
  }

  return Number(value);
}

function normalizeDateOnly(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeTimestampFromAsaasDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T12:00:00.000Z`;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function areSameNullableNumbers(left: number | null, right: number | null): boolean {
  return left === right;
}

function buildChargeSyncState(charge: LocalChargeRow, payment: LocalPaymentRow | null): ChargeSyncState {
  return {
    chargeStatus: charge.asaas_status,
    billingType: charge.billing_type,
    value: Number(charge.value),
    netValue: toNullableNumber(charge.net_value),
    dueDate: normalizeDateOnly(charge.due_date) ?? charge.due_date,
    paymentDate: normalizeDateOnly(charge.payment_date),
    invoiceUrl: charge.invoice_url,
    bankSlipUrl: charge.bank_slip_url,
    paymentStatus: payment?.status ?? null,
    paidAt: payment?.paid_at ?? null,
  };
}

function buildNextChargeState(
  charge: LocalChargeRow,
  payment: LocalPaymentRow | null,
  snapshot: AsaasChargeSnapshot,
  effect: ChargeSyncEffect,
): ChargeSyncState {
  const normalizedPaidAt = normalizeTimestampFromAsaasDate(snapshot.paymentDate);

  let nextPaidAt = payment?.paid_at ?? null;

  switch (effect.paymentStatus) {
    case 'paid': {
      nextPaidAt = normalizedPaidAt ?? nextPaidAt;
      break;
    }
    case 'pending':
    case 'failed': {
      nextPaidAt = null;
      break;
    }
    case 'refunded': {
      nextPaidAt = nextPaidAt ?? normalizedPaidAt;
      break;
    }
    default:
      break;
  }

  return {
    chargeStatus: effect.chargeStatus,
    billingType: snapshot.billingType,
    value: snapshot.value,
    netValue: snapshot.netValue,
    dueDate: normalizeDateOnly(snapshot.dueDate) ?? normalizeDateOnly(charge.due_date) ?? charge.due_date,
    paymentDate: normalizeDateOnly(snapshot.paymentDate),
    invoiceUrl: snapshot.invoiceUrl,
    bankSlipUrl: snapshot.bankSlipUrl,
    paymentStatus: effect.paymentStatus ?? payment?.status ?? null,
    paidAt: nextPaidAt,
  };
}

function hasChargeBusinessChanges(before: ChargeSyncState, after: ChargeSyncState): boolean {
  return before.chargeStatus !== after.chargeStatus
    || before.billingType !== after.billingType
    || before.value !== after.value
    || !areSameNullableNumbers(before.netValue, after.netValue)
    || before.dueDate !== after.dueDate
    || before.paymentDate !== after.paymentDate
    || before.invoiceUrl !== after.invoiceUrl
    || before.bankSlipUrl !== after.bankSlipUrl;
}

function hasPaymentBusinessChanges(before: ChargeSyncState, after: ChargeSyncState): boolean {
  return before.paymentStatus !== after.paymentStatus || before.paidAt !== after.paidAt;
}

export async function loadChargeByAsaasPaymentId(
  supabase: AdminSupabaseClient,
  asaasPaymentId: string,
): Promise<LocalChargeRow | null> {
  const { data, error } = await supabase
    .from('asaas_charges')
    .select('id, academy_id, payment_id, asaas_account_id, environment, asaas_payment_id, external_reference, billing_type, asaas_status, value, net_value, due_date, payment_date, invoice_url, bank_slip_url, synced_at')
    .eq('asaas_payment_id', asaasPaymentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar charge local: ${error.message}`);
  }

  return data as LocalChargeRow | null;
}

export async function loadChargeById(
  supabase: AdminSupabaseClient,
  chargeId: string,
): Promise<LocalChargeRow | null> {
  const { data, error } = await supabase
    .from('asaas_charges')
    .select('id, academy_id, payment_id, asaas_account_id, environment, asaas_payment_id, external_reference, billing_type, asaas_status, value, net_value, due_date, payment_date, invoice_url, bank_slip_url, synced_at')
    .eq('id', chargeId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar charge ${chargeId}: ${error.message}`);
  }

  return data as LocalChargeRow | null;
}

export async function loadPaymentById(
  supabase: AdminSupabaseClient,
  paymentId: string,
): Promise<LocalPaymentRow> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, status, paid_at')
    .eq('id', paymentId)
    .single();

  if (error || !data) {
    throw new Error(`Erro ao buscar payment local ${paymentId}: ${error?.message ?? 'not found'}`);
  }

  return data as LocalPaymentRow;
}

export function toChargeSnapshotFromWebhook(payment: AsaasWebhookPaymentData): AsaasChargeSnapshot {
  return {
    id: payment.id,
    status: payment.status,
    billingType: payment.billingType,
    value: payment.value,
    netValue: payment.netValue,
    dueDate: payment.dueDate,
    paymentDate: payment.paymentDate,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl,
    externalReference: payment.externalReference,
    deleted: payment.deleted,
  };
}

export function toChargeSnapshotFromPaymentResponse(payment: AsaasPaymentResponse): AsaasChargeSnapshot {
  return {
    id: payment.id,
    status: payment.status,
    billingType: payment.billingType,
    value: payment.value,
    netValue: payment.netValue,
    dueDate: payment.dueDate,
    paymentDate: payment.paymentDate,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl,
    externalReference: payment.externalReference,
    deleted: payment.deleted,
  };
}

export function deriveChargeSyncEffectFromWebhookEvent(
  eventType: AsaasPaymentWebhookEvent,
  snapshot: AsaasChargeSnapshot,
): ChargeSyncEffect {
  const mapping = ASAAS_EVENT_STATUS_MAP[eventType];

  if (snapshot.deleted) {
    return {
      chargeStatus: 'DELETED',
      paymentStatus: 'failed',
      setPaidAt: false,
    };
  }

  return {
    chargeStatus: mapping.chargeStatus ?? snapshot.status,
    paymentStatus: mapping.paymentStatus,
    setPaidAt: mapping.setPaidAt,
  };
}

export function deriveChargeSyncEffectFromPaymentSnapshot(snapshot: AsaasChargeSnapshot): ChargeSyncEffect {
  if (snapshot.deleted) {
    return {
      chargeStatus: 'DELETED',
      paymentStatus: 'failed',
      setPaidAt: false,
    };
  }

  const mapped = ASAAS_PAYMENT_STATUS_SYNC_MAP[snapshot.status];

  if (mapped) {
    return mapped;
  }

  return {
    chargeStatus: snapshot.status,
    paymentStatus: null,
    setPaidAt: false,
  };
}

export async function syncChargeAndPaymentFromSnapshot(
  supabase: AdminSupabaseClient,
  charge: LocalChargeRow,
  snapshot: AsaasChargeSnapshot,
  effect: ChargeSyncEffect,
): Promise<ChargeSyncOutcome> {
  const payment = await loadPaymentById(supabase, charge.payment_id);
  const before = buildChargeSyncState(charge, payment);
  const after = buildNextChargeState(charge, payment, snapshot, effect);

  const chargeUpdated = hasChargeBusinessChanges(before, after);
  const paymentUpdated = hasPaymentBusinessChanges(before, after);

  if (chargeUpdated) {
    const { error } = await supabase
      .from('asaas_charges')
      .update({
        asaas_status: after.chargeStatus,
        billing_type: after.billingType,
        value: after.value,
        net_value: after.netValue,
        due_date: after.dueDate,
        payment_date: after.paymentDate,
        invoice_url: after.invoiceUrl,
        bank_slip_url: after.bankSlipUrl,
        synced_at: new Date().toISOString(),
      })
      .eq('id', charge.id);

    if (error) {
      throw new Error(`Erro ao atualizar charge local: ${error.message}`);
    }
  }

  if (effect.paymentStatus && paymentUpdated) {
    const { error } = await supabase
      .from('payments')
      .update({
        status: effect.paymentStatus,
        paid_at: after.paidAt,
      })
      .eq('id', payment.id);

    if (error) {
      throw new Error(`Erro ao atualizar payment local: ${error.message}`);
    }
  }

  return {
    chargeUpdated,
    paymentUpdated,
    before,
    after,
    resolvedChargeStatus: after.chargeStatus,
    resolvedPaymentStatus: effect.paymentStatus,
  };
}