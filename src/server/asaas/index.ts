// Barrel export for the server-side Asaas module.
// All Asaas integration flows are server-only.

export type {
  AsaasEnvironment,
  AsaasCustomerCreateRequest,
  AsaasCustomerUpdateRequest,
  AsaasCustomerResponse,
  AsaasPersonType,
  AsaasErrorItem,
  AsaasErrorResponse,
  AsaasBillingType,
  AsaasPaymentStatus,
  AsaasPaymentCreateRequest,
  AsaasPaymentResponse,
  AsaasSubscriptionCycle,
  AsaasSubscriptionStatus,
  AsaasSubscriptionCreateRequest,
  AsaasSubscriptionUpdateRequest,
  AsaasSubscriptionResponse,
  AsaasSubscriptionDeleteResponse,
} from './types';
export { ASAAS_BASE_URLS } from './types';

export { AsaasClient, AsaasApiError } from './asaas-client';
export { resolveAsaasAccountServer, type ResolvedAccount } from './asaas-account-resolver';
export {
  getCredentialResolver,
  setCredentialResolver,
  type IAsaasCredentialResolver,
} from './credential-resolver';
export {
  syncCustomer,
  type SyncCustomerInput,
  type SyncCustomerResult,
  type SyncCustomerAction,
} from './sync-customer';
export { requireStaffForAcademy, AuthorizationError } from './auth';
export {
  createCharge,
  type CreateChargeInput,
  type CreateChargeResult,
} from './create-charge';
export {
  createAsaasSubscription,
  SubscriptionNotEligibleError,
  type CreateAsaasSubscriptionInput,
  type CreateAsaasSubscriptionResult,
} from './create-subscription';
export {
  cancelAsaasSubscription,
  SubscriptionCancelError,
  type CancelAsaasSubscriptionInput,
  type CancelAsaasSubscriptionResult,
} from './cancel-subscription';
export {
  updateAsaasSubscription,
  SubscriptionUpdateError,
  type UpdateAsaasSubscriptionInput,
  type UpdateAsaasSubscriptionResult,
} from './update-subscription';
export {
  processWebhookEvent,
} from './process-webhook';
export {
  materializeSubscriptionPayment,
  type MaterializeResult,
} from './materialize-subscription-payment';
export {
  reconcileCharge,
  ChargeNotFoundError,
  type ReconcileChargeInput,
  type ReconcileChargeResult,
} from './reconcile-charge';
export {
  reprocessWebhookEvent,
  WebhookEventNotFoundError,
  WebhookEventNotReprocessableError,
  type ReprocessWebhookEventInput,
  type ReprocessWebhookEventResult,
} from './reprocess-webhook-event';
export {
  resolveWebhookToken,
  validateWebhookToken,
} from './webhook-auth';
export {
  activateExternalBilling,
  type ActivateExternalBillingInput,
  type ActivateExternalBillingResult,
  type ExternalBillingStatus,
} from './activate-external-billing';
export {
  runFinancialHealthCheck,
  type FinancialHealthCheckResult,
} from './financial-health-check';
export {
  ASAAS_EVENT_STATUS_MAP,
  ASAAS_SUBSCRIPTION_EVENT_STATUS_MAP,
  isAsaasWebhookPayload,
  isAsaasWebhookPayloadUnified,
  isPaymentEvent,
  isSubscriptionEvent,
  type AsaasPaymentWebhookEvent,
  type AsaasSubscriptionWebhookEvent,
  type AsaasWebhookPayload,
  type AsaasSubscriptionWebhookPayload,
  type AsaasWebhookPayloadUnified,
  type AsaasWebhookPaymentData,
  type AsaasWebhookSubscriptionData,
  type WebhookProcessingResult,
  type WebhookProcessingStatus,
} from './webhook-types';
