// Asaas API v3 — Types derived from the official OpenAPI spec (via MCP)
// These types match the real Asaas customer endpoint contracts.

// ─── Environment ─────────────────────────────────────────────────

export type AsaasEnvironment = 'sandbox' | 'production';

export const ASAAS_BASE_URLS: Record<AsaasEnvironment, string> = {
  sandbox: 'https://api-sandbox.asaas.com',
  production: 'https://api.asaas.com',
};

// ─── Customer: Create (POST /v3/customers) ───────────────────────

export interface AsaasCustomerCreateRequest {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  company?: string;
  foreignCustomer?: boolean;
}

// ─── Customer: Update (PUT /v3/customers/{id}) ───────────────────

export interface AsaasCustomerUpdateRequest {
  name?: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  company?: string;
  foreignCustomer?: boolean;
}

// ─── Customer: Response (GET/POST/PUT /v3/customers) ─────────────

export type AsaasPersonType = 'FISICA' | 'JURIDICA';

export interface AsaasCustomerResponse {
  object: string;
  id: string;
  dateCreated: string;
  name: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  province: string | null;
  city: number | null;
  cityName: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  cpfCnpj: string;
  personType: AsaasPersonType;
  deleted: boolean;
  additionalEmails: string | null;
  externalReference: string | null;
  notificationDisabled: boolean;
  observations: string | null;
  foreignCustomer: boolean;
}

// ─── Payment: Billing types ──────────────────────────────────────

export type AsaasBillingType = 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX';

export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

// ─── Payment: Create (POST /v3/payments) ─────────────────────────

export interface AsaasPaymentCreateRequest {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  daysAfterDueDateToRegistrationCancellation?: number;
  postalService?: boolean;
}

// ─── Payment: Response (GET/POST /v3/payments) ───────────────────

export interface AsaasPaymentResponse {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  subscription: string | null;
  installment: string | null;
  paymentLink: string | null;
  value: number;
  netValue: number | null;
  originalValue: number | null;
  interestValue: number | null;
  description: string | null;
  billingType: AsaasBillingType;
  status: AsaasPaymentStatus;
  dueDate: string;
  originalDueDate: string;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  invoiceUrl: string | null;
  invoiceNumber: string | null;
  externalReference: string | null;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
  creditDate: string | null;
  estimatedCreditDate: string | null;
  transactionReceiptUrl: string | null;
  nossoNumero: string | null;
  bankSlipUrl: string | null;
  canBePaidAfterDueDate: boolean;
  postalService: boolean;
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string | null;
  payload: string | null;
  expirationDate: string | null;
  description: string | null;
}

export interface AsaasBankSlipBillingInfoResponse {
  identificationField: string | null;
  nossoNumero: string | null;
  barCode: string | null;
  bankSlipUrl: string | null;
}

export interface AsaasPaymentBillingInfoResponse {
  pix?: AsaasPixQrCodeResponse | null;
  bankSlip?: AsaasBankSlipBillingInfoResponse | null;
}

// ─── Subscription: Cycle / Status ────────────────────────────────

export type AsaasSubscriptionCycle =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUALLY'
  | 'YEARLY';

export type AsaasSubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

// ─── Subscription: Create (POST /v3/subscriptions) ──────────────

export interface AsaasSubscriptionCreateRequest {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasSubscriptionCycle;
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
}

// ─── Subscription: Response (GET/POST /v3/subscriptions) ─────────

export interface AsaasSubscriptionResponse {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink: string | null;
  billingType: AsaasBillingType;
  cycle: AsaasSubscriptionCycle;
  value: number;
  nextDueDate: string;
  endDate: string | null;
  description: string | null;
  status: AsaasSubscriptionStatus;
  deleted: boolean;
  maxPayments: number | null;
  externalReference: string | null;
}

// ─── Subscription: Update (PUT /v3/subscriptions/{id}) ───────────

export interface AsaasSubscriptionUpdateRequest {
  billingType?: AsaasBillingType;
  value?: number;
  nextDueDate?: string;
  cycle?: AsaasSubscriptionCycle;
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  /** 'ACTIVE' to reactivate, 'INACTIVE' to deactivate */
  status?: AsaasSubscriptionStatus;
}

// ─── Subscription: Delete response (DELETE /v3/subscriptions/{id}) ──

export interface AsaasSubscriptionDeleteResponse {
  deleted: boolean;
  id: string;
}

// ─── Error ───────────────────────────────────────────────────────

export interface AsaasErrorItem {
  code: string;
  description: string;
}

export interface AsaasErrorResponse {
  errors: AsaasErrorItem[];
}
