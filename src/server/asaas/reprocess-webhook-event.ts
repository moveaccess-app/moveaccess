import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { requireStaffForAcademy } from './auth';
import { processWebhookEvent } from './process-webhook';
import type { AsaasEnvironment } from './types';
import {
  isAsaasWebhookPayloadUnified,
  type WebhookProcessingStatus,
} from './webhook-types';

interface PersistedWebhookEventRow {
  id: string;
  event_id: string;
  event_type: string;
  environment: string;
  processing_status: string;
  payload: unknown;
  error_message: string | null;
  asaas_payment_id: string | null;
  asaas_account_id: string | null;
  received_at: string;
  updated_at: string;
  retry_count: number | null;
}

interface ScopedAccountRow {
  academy_id: string;
}

interface ScopedChargeRow {
  academy_id: string;
}

const REPROCESSABLE_STATUSES = new Set<WebhookProcessingStatus>(['failed', 'orphan']);

export interface ReprocessWebhookEventInput {
  eventId: string;
}

export interface ReprocessWebhookEventResult {
  success: true;
  eventId: string;
  eventRowId: string;
  previousStatus: WebhookProcessingStatus;
  currentStatus: WebhookProcessingStatus;
  previousErrorMessage: string | null;
  currentErrorMessage: string | null;
  chargeUpdated: boolean;
  paymentUpdated: boolean;
  receivedAt: string;
  lastUpdatedAt: string;
}

export class WebhookEventNotFoundError extends Error {
  constructor(eventId: string) {
    super(`Evento webhook ${eventId} não encontrado.`);
    this.name = 'WebhookEventNotFoundError';
  }
}

export class WebhookEventNotReprocessableError extends Error {
  constructor(eventId: string, status: string) {
    super(`Evento ${eventId} com status ${status} não pode ser reprocessado.`);
    this.name = 'WebhookEventNotReprocessableError';
  }
}

async function loadPersistedEvent(eventId: string): Promise<PersistedWebhookEventRow> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('asaas_webhook_events')
    .select('id, event_id, event_type, environment, processing_status, payload, error_message, asaas_payment_id, asaas_account_id, received_at, updated_at, retry_count')
    .eq('event_id', eventId)
    .single();

  if (error || !data) {
    throw new WebhookEventNotFoundError(eventId);
  }

  return data as PersistedWebhookEventRow;
}

function extractAcademyIdFromExternalReference(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as {
    payment?: {
      externalReference?: unknown;
    };
  };

  if (typeof candidate.payment?.externalReference !== 'string') {
    return null;
  }

  const match = candidate.payment.externalReference.match(/:academy:([0-9a-f-]{36})$/i);
  return match?.[1] ?? null;
}

async function resolveEventAcademyId(event: PersistedWebhookEventRow): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  if (event.asaas_account_id) {
    const { data: account } = await supabase
      .from('asaas_accounts')
      .select('academy_id')
      .eq('id', event.asaas_account_id)
      .maybeSingle();

    if (account) {
      return (account as ScopedAccountRow).academy_id;
    }
  }

  if (event.asaas_payment_id) {
    const { data: charge } = await supabase
      .from('asaas_charges')
      .select('academy_id')
      .eq('asaas_payment_id', event.asaas_payment_id)
      .maybeSingle();

    if (charge) {
      return (charge as ScopedChargeRow).academy_id;
    }
  }

  return extractAcademyIdFromExternalReference(event.payload);
}

export async function reprocessWebhookEvent(
  input: ReprocessWebhookEventInput,
): Promise<ReprocessWebhookEventResult> {
  const event = await loadPersistedEvent(input.eventId);
  const previousStatus = event.processing_status as WebhookProcessingStatus;

  if (!REPROCESSABLE_STATUSES.has(previousStatus)) {
    throw new WebhookEventNotReprocessableError(event.event_id, event.processing_status);
  }

  const academyId = await resolveEventAcademyId(event);

  if (!academyId) {
    throw new Error(
      `Não foi possível resolver a academia do evento ${event.event_id} para autorizar o reprocessamento.`,
    );
  }

  await requireStaffForAcademy(academyId);

  if (!isAsaasWebhookPayloadUnified(event.payload)) {
    throw new Error(`Payload persistido do evento ${event.event_id} não é um webhook Asaas válido (payment ou subscription).`);
  }

  console.info(`[asaas][webhook-reprocess] event=${event.event_id} previous=${event.processing_status} type=${event.event_type} retry`);

  // Increment retry count on the event before reprocessing
  const supabaseAdmin = createAdminSupabaseClient();
  await supabaseAdmin
    .from('asaas_webhook_events')
    .update({
      retry_count: (event.retry_count ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
    })
    .eq('id', event.id);

  const result = await processWebhookEvent(
    event.payload,
    event.environment as AsaasEnvironment,
  );

  return {
    success: true,
    eventId: event.event_id,
    eventRowId: event.id,
    previousStatus,
    currentStatus: result.status,
    previousErrorMessage: event.error_message,
    currentErrorMessage: result.errorMessage ?? event.error_message,
    chargeUpdated: result.chargeUpdated,
    paymentUpdated: result.paymentUpdated,
    receivedAt: event.received_at,
    lastUpdatedAt: event.updated_at,
  };
}
