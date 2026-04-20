// Types for the Asaas webhook integration.
//
// Derived from the real Asaas webhook documentation and MCP spec.
// These types describe the webhook payload, processing states,
// and the status mapping between Asaas and the local domain.

import type { AsaasPaymentStatus, AsaasBillingType } from './types';

// ─── Webhook payload (from Asaas) ────────────────────────────────

/**
 * Payment events we handle in this PR (charge lifecycle).
 * Other event categories (SUBSCRIPTION_*, TRANSFER_*, etc.) will be
 * added in future PRs as the corresponding features are built.
 */
export type AsaasPaymentWebhookEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_PARTIALLY_REFUNDED'
  | 'PAYMENT_REFUND_IN_PROGRESS'
  | 'PAYMENT_REFUND_DENIED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_BANK_SLIP_CANCELLED'
  | 'PAYMENT_CHECKOUT_VIEWED';

/**
 * The payment object embedded in the webhook payload.
 * Contains a subset of fields — only what we need for processing.
 * Asaas may add new fields at any time; this must not break.
 */
export interface AsaasWebhookPaymentData {
  object: string;
  id: string;                       // e.g. pay_080225913252
  dateCreated: string;
  customer: string;                 // customer ID
  subscription: string | null;
  value: number;
  netValue: number | null;
  billingType: AsaasBillingType;
  status: AsaasPaymentStatus;
  dueDate: string;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  externalReference: string | null;
  deleted: boolean;
  description: string | null;
}

/**
 * The full webhook event body as received from Asaas.
 */
export interface AsaasWebhookPayload {
  id: string;                                // unique event ID (evt_...)
  event: AsaasPaymentWebhookEvent;
  payment: AsaasWebhookPaymentData;
}

export function isAsaasWebhookPayload(body: unknown): body is AsaasWebhookPayload {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const candidate = body as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
    return false;
  }

  if (typeof candidate.event !== 'string' || !isPaymentEvent(candidate.event)) {
    return false;
  }

  if (!candidate.payment || typeof candidate.payment !== 'object') {
    return false;
  }

  const payment = candidate.payment as Record<string, unknown>;

  return typeof payment.id === 'string' && payment.id.length > 0;
}

// ─── Processing state ────────────────────────────────────────────

export type WebhookProcessingStatus =
  | 'pending'      // received, not yet processed
  | 'processed'    // successfully processed
  | 'skipped'      // recognized event but no action needed
  | 'failed'       // processing error (see error_message)
  | 'orphan';      // no local charge found for this payment

// ─── Processing result ───────────────────────────────────────────

export interface WebhookProcessingResult {
  eventId: string;
  status: WebhookProcessingStatus;
  chargeUpdated: boolean;
  paymentUpdated: boolean;
  errorMessage?: string;
}

// ─── Status mapping ──────────────────────────────────────────────

export type LocalPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Defines how an Asaas webhook event maps to local domain updates.
 *
 * - `chargeStatus`: the value to set on asaas_charges.asaas_status
 *   (if null, use the status from the payment payload directly)
 * - `paymentStatus`: the value to set on payments.status
 *   (if null, no update to payments)
 * - `setPaidAt`: whether to set payments.paid_at
 */
interface StatusMappingEntry {
  chargeStatus: string | null;
  paymentStatus: LocalPaymentStatus | null;
  setPaidAt: boolean;
}

/**
 * Explicit mapping from Asaas webhook event → local domain effects.
 *
 * Design decisions documented here:
 *
 * - PAYMENT_CONFIRMED: Boleto/card confirmed but balance not yet credited.
 *   We explicitly keep the local payment as 'pending' — 'paid' only happens
 *   on RECEIVED / RECEIVED_IN_CASH.
 *
 * - PAYMENT_OVERDUE: Customer hasn't paid by due date.
 *   We explicitly keep the local payment as 'pending' — the charge is still open.
 *   The asaas_charges status is updated so staff can see overdue state.
 *
 * - PAYMENT_RECEIVED: Money is in. This is the definitive 'paid' trigger.
 *
 * - PAYMENT_DELETED / PAYMENT_BANK_SLIP_CANCELLED: Charge removed or
 *   boleto expired. Local payment becomes 'failed'.
 *
 * - PAYMENT_REFUNDED / PAYMENT_PARTIALLY_REFUNDED: Local payment
 *   becomes 'refunded'. Our current model doesn't distinguish partial.
 *   TODO: consider adding 'partially_refunded' to payments.status later.
 *
 * - PAYMENT_RESTORED: Charge un-deleted. We set back to 'pending'.
 *
 * - View/info events: no domain change, just track the event.
 */
export const ASAAS_EVENT_STATUS_MAP: Record<AsaasPaymentWebhookEvent, StatusMappingEntry> = {
  PAYMENT_CREATED:           { chargeStatus: 'PENDING',             paymentStatus: null,       setPaidAt: false },
  PAYMENT_UPDATED:           { chargeStatus: null,                  paymentStatus: null,       setPaidAt: false },
  PAYMENT_CONFIRMED:         { chargeStatus: 'CONFIRMED',           paymentStatus: 'pending',  setPaidAt: false },
  PAYMENT_RECEIVED:          { chargeStatus: 'RECEIVED',            paymentStatus: 'paid',     setPaidAt: true  },
  PAYMENT_OVERDUE:           { chargeStatus: 'OVERDUE',             paymentStatus: 'pending',  setPaidAt: false },
  PAYMENT_DELETED:           { chargeStatus: 'DELETED',             paymentStatus: 'failed',   setPaidAt: false },
  PAYMENT_RESTORED:          { chargeStatus: 'PENDING',             paymentStatus: 'pending',  setPaidAt: false },
  PAYMENT_REFUNDED:          { chargeStatus: 'REFUNDED',            paymentStatus: 'refunded', setPaidAt: false },
  PAYMENT_PARTIALLY_REFUNDED:{ chargeStatus: 'REFUNDED',            paymentStatus: 'refunded', setPaidAt: false },
  PAYMENT_REFUND_IN_PROGRESS:{ chargeStatus: 'REFUND_IN_PROGRESS',  paymentStatus: null,       setPaidAt: false },
  PAYMENT_REFUND_DENIED:     { chargeStatus: null,                  paymentStatus: null,       setPaidAt: false },
  PAYMENT_BANK_SLIP_VIEWED:  { chargeStatus: null,                  paymentStatus: null,       setPaidAt: false },
  PAYMENT_BANK_SLIP_CANCELLED:{ chargeStatus: 'BANK_SLIP_CANCELLED',paymentStatus: 'failed',   setPaidAt: false },
  PAYMENT_CHECKOUT_VIEWED:   { chargeStatus: null,                  paymentStatus: null,       setPaidAt: false },
};

/**
 * Returns whether an event type is a PAYMENT_* event we recognize.
 */
export function isPaymentEvent(eventType: string): eventType is AsaasPaymentWebhookEvent {
  return eventType in ASAAS_EVENT_STATUS_MAP;
}

// ─── Subscription webhook events ─────────────────────────────────

/**
 * Subscription lifecycle events from Asaas.
 * These indicate status changes on the subscription itself,
 * separate from individual payment events.
 */
export type AsaasSubscriptionWebhookEvent =
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_INACTIVATED'
  | 'SUBSCRIPTION_REACTIVATED'
  | 'SUBSCRIPTION_RENEWED';

/**
 * Subscription data embedded in SUBSCRIPTION_* webhook payloads.
 */
export interface AsaasWebhookSubscriptionData {
  object: string;
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  cycle: string;
  value: number;
  nextDueDate: string | null;
  endDate: string | null;
  status: string;
  deleted: boolean;
  description: string | null;
  externalReference: string | null;
}

/**
 * Full webhook event body for SUBSCRIPTION_* events.
 */
export interface AsaasSubscriptionWebhookPayload {
  id: string;
  event: AsaasSubscriptionWebhookEvent;
  subscription: AsaasWebhookSubscriptionData;
}

/**
 * Mapping from SUBSCRIPTION_* events to the local asaas_status value.
 */
export const ASAAS_SUBSCRIPTION_EVENT_STATUS_MAP: Record<AsaasSubscriptionWebhookEvent, string | null> = {
  SUBSCRIPTION_CREATED:     'ACTIVE',
  SUBSCRIPTION_UPDATED:     null,      // use the status from the payload
  SUBSCRIPTION_DELETED:     'INACTIVE',
  SUBSCRIPTION_INACTIVATED: 'INACTIVE',
  SUBSCRIPTION_REACTIVATED: 'ACTIVE',
  SUBSCRIPTION_RENEWED:     'ACTIVE',
};

/**
 * Returns whether an event type is a SUBSCRIPTION_* event we recognize.
 */
export function isSubscriptionEvent(eventType: string): eventType is AsaasSubscriptionWebhookEvent {
  return eventType in ASAAS_SUBSCRIPTION_EVENT_STATUS_MAP;
}

/**
 * Unified webhook payload — supports both PAYMENT_* and SUBSCRIPTION_* events.
 */
export type AsaasWebhookPayloadUnified = AsaasWebhookPayload | AsaasSubscriptionWebhookPayload;

/**
 * Validates that the body is a valid Asaas webhook payload
 * (either payment or subscription event).
 */
export function isAsaasWebhookPayloadUnified(body: unknown): body is AsaasWebhookPayloadUnified {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const candidate = body as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
    return false;
  }

  if (typeof candidate.event !== 'string') {
    return false;
  }

  // Payment event
  if (isPaymentEvent(candidate.event)) {
    if (!candidate.payment || typeof candidate.payment !== 'object') {
      return false;
    }
    const payment = candidate.payment as Record<string, unknown>;
    return typeof payment.id === 'string' && payment.id.length > 0;
  }

  // Subscription event
  if (isSubscriptionEvent(candidate.event)) {
    if (!candidate.subscription || typeof candidate.subscription !== 'object') {
      return false;
    }
    const subscription = candidate.subscription as Record<string, unknown>;
    return typeof subscription.id === 'string' && subscription.id.length > 0;
  }

  return false;
}

