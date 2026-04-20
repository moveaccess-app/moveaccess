// Core webhook processing logic for Asaas payment events.
//
// Flow:
//   1. Extract event metadata from payload
//   2. Check idempotency (already processed?)
//   3. Persist raw event (status: pending)
//   4. Locate local charge by asaas_payment_id
//   5. Apply status mapping to asaas_charges + payments
//   6. Mark event as processed/skipped/orphan/failed
//
// Uses the admin Supabase client (service_role) because webhooks
// have no user session — RLS is bypassed.

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveAutomationsForPayment } from '@/server/notifications/automation-resolution';
import type { AsaasEnvironment } from './types';
import {
  deriveChargeSyncEffectFromWebhookEvent,
  loadChargeByAsaasPaymentId,
  syncChargeAndPaymentFromSnapshot,
  toChargeSnapshotFromWebhook,
} from './charge-sync';
import { materializeSubscriptionPayment } from './materialize-subscription-payment';
import {
  isPaymentEvent,
  isSubscriptionEvent,
  ASAAS_SUBSCRIPTION_EVENT_STATUS_MAP,
  type AsaasWebhookPayload,
  type AsaasSubscriptionWebhookPayload,
  type AsaasWebhookPayloadUnified,
  type AsaasSubscriptionWebhookEvent,
  type WebhookProcessingResult,
  type WebhookProcessingStatus,
} from './webhook-types';

// ─── Types ───────────────────────────────────────────────────────

type AdminSupabaseClient = SupabaseClient;

interface PersistedEventRow {
  id: string;
  processing_status: string;
  error_message: string | null;
}

// ─── Idempotency check ──────────────────────────────────────────

async function findExistingEvent(
  supabase: AdminSupabaseClient,
  eventId: string,
): Promise<PersistedEventRow | null> {
  const { data, error } = await supabase
    .from('asaas_webhook_events')
    .select('id, processing_status, error_message')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao verificar evento existente: ${error.message}`);
  }

  return data as PersistedEventRow | null;
}

// ─── Persist event ───────────────────────────────────────────────

async function persistEvent(
  supabase: AdminSupabaseClient,
  input: {
    eventId: string;
    eventType: string;
    environment: AsaasEnvironment;
    asaasPaymentId: string | null;
    payload: unknown;
    status: WebhookProcessingStatus;
    errorMessage?: string;
    academyId?: string | null;
    affectedPaymentId?: string | null;
    affectedChargeId?: string | null;
  },
): Promise<string> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('asaas_webhook_events')
    .insert({
      event_id: input.eventId,
      event_type: input.eventType,
      environment: input.environment,
      asaas_payment_id: input.asaasPaymentId,
      payload: input.payload,
      processing_status: input.status,
      error_message: input.errorMessage ?? null,
      received_at: now,
      last_attempt_at: now,
      retry_count: 0,
      academy_id: input.academyId ?? null,
      affected_payment_id: input.affectedPaymentId ?? null,
      affected_charge_id: input.affectedChargeId ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Erro ao persistir evento webhook: ${error?.message ?? 'unknown'}`);
  }

  return (data as { id: string }).id;
}

// ─── Update event status ─────────────────────────────────────────

async function updateEventStatus(
  supabase: AdminSupabaseClient,
  eventDbId: string,
  input: {
    status: WebhookProcessingStatus;
    asaasAccountId?: string | null;
    errorMessage?: string | null;
    academyId?: string | null;
    affectedPaymentId?: string | null;
    affectedChargeId?: string | null;
    incrementRetry?: boolean;
  },
): Promise<void> {
  const updateData: Record<string, unknown> = {
    processing_status: input.status,
    last_attempt_at: new Date().toISOString(),
  };

  if (input.asaasAccountId !== undefined) {
    updateData.asaas_account_id = input.asaasAccountId;
  }

  if (input.errorMessage !== undefined) {
    updateData.error_message = input.errorMessage;
  }

  if (input.academyId !== undefined && input.academyId !== null) {
    updateData.academy_id = input.academyId;
  }

  if (input.affectedPaymentId !== undefined && input.affectedPaymentId !== null) {
    updateData.affected_payment_id = input.affectedPaymentId;
  }

  if (input.affectedChargeId !== undefined && input.affectedChargeId !== null) {
    updateData.affected_charge_id = input.affectedChargeId;
  }

  if (input.status === 'processed' || input.status === 'skipped') {
    updateData.processed_at = new Date().toISOString();
  }

  // Use raw SQL for retry_count increment (Supabase JS doesn't support atomic increment)
  if (input.incrementRetry) {
    // Two-step: first read current count, then set incremented value
    const { data: current } = await supabase
      .from('asaas_webhook_events')
      .select('retry_count')
      .eq('id', eventDbId)
      .single();

    updateData.retry_count = ((current as { retry_count: number } | null)?.retry_count ?? 0) + 1;
  }

  const { error } = await supabase
    .from('asaas_webhook_events')
    .update(updateData)
    .eq('id', eventDbId);

  if (error) {
    // Non-fatal: event is persisted, processing result might be lost
    console.error(`[webhook] Falha ao atualizar status do evento ${eventDbId}: ${error.message}`);
  }
}

// ─── Main processor ──────────────────────────────────────────────

export async function processWebhookEvent(
  payload: AsaasWebhookPayloadUnified,
  environment: AsaasEnvironment,
): Promise<WebhookProcessingResult> {
  const supabase = createAdminSupabaseClient();

  const eventId = payload.id;
  const eventType = payload.event;

  // Route to appropriate handler based on event type
  if (isSubscriptionEvent(eventType)) {
    return processSubscriptionEvent(
      supabase,
      payload as AsaasSubscriptionWebhookPayload,
      environment,
    );
  }

  // From here on, it's a payment event (or unrecognized)
  const paymentPayload = payload as AsaasWebhookPayload;
  const asaasPaymentId = paymentPayload.payment?.id ?? null;

  // ── 1. Idempotency check ─────────────────────────────────────
  const existing = await findExistingEvent(supabase, eventId);

  if (existing) {
    if (existing.processing_status === 'processed' || existing.processing_status === 'skipped') {
      // Already handled — safe to return 200
      return {
        eventId,
        status: existing.processing_status as WebhookProcessingStatus,
        chargeUpdated: false,
        paymentUpdated: false,
      };
    }
    // If 'failed' or 'orphan', we allow reprocessing below
    // (the event row already exists, we'll update it)
  }

  // ── 2. Check if we recognize this event type ─────────────────
  if (!isPaymentEvent(eventType)) {
    const errorMessage = `Tipo de evento não reconhecido: ${eventType}`;

    if (existing) {
      await updateEventStatus(supabase, existing.id, {
        status: 'skipped',
        errorMessage,
      });
    } else {
      await persistEvent(supabase, {
          eventId,
          eventType,
          environment,
          asaasPaymentId,
          payload,
          status: 'skipped',
          errorMessage,
        });
    }

    return {
      eventId,
      status: 'skipped',
      chargeUpdated: false,
      paymentUpdated: false,
    };
  }

  // ── 3. Persist event (pending) ───────────────────────────────
  let eventDbId: string;

  if (existing) {
    eventDbId = existing.id;

    await updateEventStatus(supabase, eventDbId, {
      status: 'pending',
    });
  } else {
    eventDbId = await persistEvent(supabase, {
      eventId,
      eventType,
      environment,
      asaasPaymentId,
      payload,
      status: 'pending',
    });
  }

  // ── 4. Process ───────────────────────────────────────────────
  try {
    // If no asaas_payment_id in the payload, we can't correlate
    if (!asaasPaymentId) {
      await updateEventStatus(supabase, eventDbId, {
        status: 'skipped',
        errorMessage: 'Payload sem payment.id',
      });

      return {
        eventId,
        status: 'skipped',
        chargeUpdated: false,
        paymentUpdated: false,
      };
    }

    // Find local charge
    let charge = await loadChargeByAsaasPaymentId(supabase, asaasPaymentId);

    // If no charge exists but the payment belongs to a subscription,
    // try to materialize local payment + charge from the subscription link.
    if (!charge && paymentPayload.payment.subscription) {
      const materialized = await materializeSubscriptionPayment(supabase, paymentPayload.payment);

      if (materialized) {
        charge = materialized.charge;
      }
    }

    if (!charge) {
      // Orphan: no local charge, and not from a known subscription
      console.warn(`[webhook] orphan event=${eventId} type=${eventType} asaasPaymentId=${asaasPaymentId} — no local charge found`);

      await updateEventStatus(supabase, eventDbId, {
        status: 'orphan',
        errorMessage: `Nenhuma charge local encontrada para asaas_payment_id=${asaasPaymentId}`,
      });

      return {
        eventId,
        status: 'orphan',
        chargeUpdated: false,
        paymentUpdated: false,
      };
    }

    const snapshot = toChargeSnapshotFromWebhook(paymentPayload.payment);
    const effect = deriveChargeSyncEffectFromWebhookEvent(eventType, snapshot);
    const outcome = await syncChargeAndPaymentFromSnapshot(supabase, charge, snapshot, effect);

    console.info(
      `[webhook] processed event=${eventId} type=${eventType} charge=${charge.id} payment=${charge.payment_id}`
      + ` chargeUpdated=${outcome.chargeUpdated} paymentUpdated=${outcome.paymentUpdated}`
      + ` status=${outcome.resolvedChargeStatus}→${outcome.resolvedPaymentStatus ?? 'null'}`,
    );

    // ── Auto-resolve automations when payment is received ────
    if (outcome.resolvedPaymentStatus === 'paid' && charge.payment_id) {
      try {
        const resolutionResult = await resolveAutomationsForPayment(supabase, charge.payment_id);
        console.info(
          `[webhook] automation resolution for payment=${charge.payment_id}`
          + ` actionsResolved=${resolutionResult.actionsResolved}`
          + ` confirmationSent=${resolutionResult.confirmationSent}`,
        );
      } catch (resErr) {
        // Non-fatal: webhook processing succeeded, automation resolution is best-effort
        console.error(
          `[webhook] automation resolution error for payment=${charge.payment_id}:`,
          resErr instanceof Error ? resErr.message : resErr,
        );
      }
    }

    // Mark event as processed with affected entity tracking
    await updateEventStatus(supabase, eventDbId, {
      status: 'processed',
      asaasAccountId: charge.asaas_account_id,
      academyId: charge.academy_id,
      affectedPaymentId: charge.payment_id,
      affectedChargeId: charge.id,
    });

    return {
      eventId,
      status: 'processed',
      chargeUpdated: outcome.chargeUpdated,
      paymentUpdated: outcome.paymentUpdated,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no processamento';

    console.error(`[webhook] failed event=${eventId} type=${eventType} error=${errorMessage}`);

    // Mark event as failed — preserves the event for retry
    await updateEventStatus(supabase, eventDbId, {
      status: 'failed',
      errorMessage,
    });

    return {
      eventId,
      status: 'failed',
      chargeUpdated: false,
      paymentUpdated: false,
      errorMessage,
    };
  }
}

// ─── Subscription event processor ────────────────────────────────

async function processSubscriptionEvent(
  supabase: AdminSupabaseClient,
  payload: AsaasSubscriptionWebhookPayload,
  environment: AsaasEnvironment,
): Promise<WebhookProcessingResult> {
  const eventId = payload.id;
  const eventType = payload.event;
  const asaasSubscriptionId = payload.subscription?.id ?? null;

  // 1. Idempotency check
  const existing = await findExistingEvent(supabase, eventId);

  if (existing) {
    if (existing.processing_status === 'processed' || existing.processing_status === 'skipped') {
      return {
        eventId,
        status: existing.processing_status as WebhookProcessingStatus,
        chargeUpdated: false,
        paymentUpdated: false,
      };
    }
  }

  // 2. Persist event (pending)
  let eventDbId: string;

  if (existing) {
    eventDbId = existing.id;
    await updateEventStatus(supabase, eventDbId, { status: 'pending' });
  } else {
    eventDbId = await persistEvent(supabase, {
      eventId,
      eventType,
      environment,
      asaasPaymentId: null,
      payload,
      status: 'pending',
    });
  }

  try {
    if (!asaasSubscriptionId) {
      await updateEventStatus(supabase, eventDbId, {
        status: 'skipped',
        errorMessage: 'Payload de subscription sem subscription.id',
      });

      return {
        eventId,
        status: 'skipped',
        chargeUpdated: false,
        paymentUpdated: false,
      };
    }

    // 3. Find local subscription link
    const { data: link, error: linkError } = await supabase
      .from('asaas_subscriptions')
      .select('id, subscription_id, academy_id, asaas_account_id, asaas_status')
      .eq('asaas_subscription_id', asaasSubscriptionId)
      .maybeSingle();

    if (linkError) {
      throw new Error(`Erro ao buscar link de assinatura: ${linkError.message}`);
    }

    if (!link) {
      await updateEventStatus(supabase, eventDbId, {
        status: 'orphan',
        errorMessage: `Nenhum link local encontrado para asaas_subscription_id=${asaasSubscriptionId}`,
      });

      return {
        eventId,
        status: 'orphan',
        chargeUpdated: false,
        paymentUpdated: false,
      };
    }

    const typedLink = link as unknown as {
      id: string;
      subscription_id: string;
      academy_id: string;
      asaas_account_id: string;
      asaas_status: string;
    };

    // 4. Determine new status
    const mappedStatus = ASAAS_SUBSCRIPTION_EVENT_STATUS_MAP[eventType as AsaasSubscriptionWebhookEvent];
    const newStatus = mappedStatus ?? payload.subscription.status ?? null;

    // 5. Update asaas_subscriptions link
    const updateData: Record<string, unknown> = {
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (newStatus) {
      updateData.asaas_status = newStatus;
    }

    // Sync other fields from the payload
    if (payload.subscription.value !== undefined) {
      updateData.value = payload.subscription.value;
    }
    if (payload.subscription.nextDueDate !== undefined) {
      updateData.next_due_date = payload.subscription.nextDueDate;
    }
    if (payload.subscription.endDate !== undefined) {
      updateData.end_date = payload.subscription.endDate;
    }

    const { error: updateError } = await supabase
      .from('asaas_subscriptions')
      .update(updateData)
      .eq('id', typedLink.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar link de assinatura: ${updateError.message}`);
    }

    // 6. Sync local subscription status when Asaas status changes meaningfully
    //    INACTIVE → cancelled, ACTIVE → active (reactivation)
    if (newStatus && typedLink.subscription_id) {
      const ASAAS_TO_LOCAL_SUB_STATUS: Record<string, string | null> = {
        INACTIVE: 'cancelled',
        EXPIRED: 'expired',
        ACTIVE: 'active',
      };

      const localStatus = ASAAS_TO_LOCAL_SUB_STATUS[newStatus] ?? null;

      if (localStatus) {
        const localUpdateData: Record<string, unknown> = {
          status: localStatus,
          updated_at: new Date().toISOString(),
        };

        // Set cancelled_at if transitioning to cancelled
        if (localStatus === 'cancelled') {
          localUpdateData.cancelled_at = new Date().toISOString();
        }

        const { error: subUpdateError } = await supabase
          .from('subscriptions')
          .update(localUpdateData)
          .eq('id', typedLink.subscription_id);

        if (subUpdateError) {
          // Non-fatal: asaas link was updated, local sync is best-effort
          console.error(
            `[webhook] Failed to sync local subscription ${typedLink.subscription_id}: ${subUpdateError.message}`,
          );
        } else {
          console.info(
            `[webhook] Synced local subscription ${typedLink.subscription_id} status→${localStatus} from Asaas ${newStatus}`,
          );
        }
      }
    }

    // 7. Mark event as processed with entity tracking
    await updateEventStatus(supabase, eventDbId, {
      status: 'processed',
      asaasAccountId: typedLink.asaas_account_id,
      academyId: typedLink.academy_id,
    });

    console.info(
      `[webhook] processed subscription event=${eventId} type=${eventType} asaasSub=${asaasSubscriptionId} newStatus=${newStatus}`,
    );

    return {
      eventId,
      status: 'processed',
      chargeUpdated: false,
      paymentUpdated: false,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no processamento';

    console.error(`[webhook] failed subscription event=${eventId} type=${eventType} error=${errorMessage}`);

    await updateEventStatus(supabase, eventDbId, {
      status: 'failed',
      errorMessage,
    });

    return {
      eventId,
      status: 'failed',
      chargeUpdated: false,
      paymentUpdated: false,
      errorMessage,
    };
  }
}
