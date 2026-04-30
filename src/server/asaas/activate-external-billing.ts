// Use-case: Activate external billing after local commercial activation.
//
// This is the bridge between the local commercial activation core
// (_activate_student_subscription) and the external billing layer (Asaas).
//
// Decision matrix:
//   method=manual       → completed_local_only (no external billing needed)
//   no Asaas account    → pending_external_billing (staff must configure first)
//   missing CPF         → pending_external_billing (student data incomplete)
//   cycle=monthly/yearly + pix/boleto/card → create asaas_subscription
//   cycle=custom + pix/boleto             → create asaas_charge
//   cycle=custom + card                   → pending_external_billing (card not supported for one-off)
//   external link exists                  → already_exists
//
// Called after the local activation RPC succeeds. This function never
// modifies subscriptions or payments tables — it only creates external
// billing objects and their local links.
//
// Uses admin client throughout so it works regardless of caller role
// (staff onboarding OR student public signup). Auth is validated at
// the API route level before this function is called.

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCredentialResolver } from './credential-resolver';
import { AsaasClient, AsaasApiError } from './asaas-client';
import type {
  AsaasEnvironment,
  AsaasBillingType,
  AsaasSubscriptionCycle,
  AsaasPaymentStatus,
  AsaasSubscriptionStatus,
  AsaasCustomerCreateRequest,
  AsaasPaymentBillingInfoResponse,
} from './types';

// ─── Result types ────────────────────────────────────────────────

export type ExternalBillingStatus =
  | 'completed_with_billing'
  | 'completed_local_only'
  | 'pending_external_billing'
  | 'failed_external_billing'
  | 'already_exists';

export interface ActivateExternalBillingInput {
  subscriptionId: string;
  paymentId: string;
}

export interface ActivateExternalBillingResult {
  status: ExternalBillingStatus;
  billingPath: 'subscription' | 'charge' | null;
  reason?: string;
  asaasSubscriptionId?: string;
  asaasChargeId?: string;
  asaasPaymentId?: string;
  paymentLink?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  bankSlipIdentificationField?: string | null;
  bankSlipBarCode?: string | null;
  bankSlipNossoNumero?: string | null;
  pixCopyPaste?: string | null;
  pixQrCodeImage?: string | null;
  pixQrCodeExpirationDate?: string | null;
  environment?: AsaasEnvironment;
}

// ─── Internal types ──────────────────────────────────────────────

interface LocalSubscription {
  id: string;
  academy_id: string;
  student_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  billing_cycle: string;
  price: number;
}

interface LocalPayment {
  id: string;
  academy_id: string;
  subscription_id: string;
  student_id: string;
  amount: number;
  status: string;
  method: string;
  due_date: string;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
}

interface ResolvedAccount {
  id: string;
  academy_id: string;
  unit_id: string | null;
  environment: AsaasEnvironment;
  api_key_reference: string;
  asaas_account_id: string | null;
}

interface BillingDecision {
  path: 'subscription' | 'charge';
  billingType: AsaasBillingType;
  asaasCycle?: AsaasSubscriptionCycle;
}

// ─── Mappings ────────────────────────────────────────────────────

const METHOD_TO_BILLING_TYPE: Record<string, AsaasBillingType> = {
  pix: 'PIX',
  boleto: 'BOLETO',
  card: 'CREDIT_CARD',
};

const LOCAL_CYCLE_TO_ASAAS: Record<string, AsaasSubscriptionCycle> = {
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
};

const BILLING_TIME_ZONE = 'America/Sao_Paulo';

// ─── Decision matrix ─────────────────────────────────────────────

function decideBilling(
  billingCycle: string,
  method: string,
): BillingDecision | null {
  if (method === 'manual') return null;

  const billingType = METHOD_TO_BILLING_TYPE[method];
  if (!billingType) return null;

  const asaasCycle = LOCAL_CYCLE_TO_ASAAS[billingCycle];
  if (asaasCycle) {
    return { path: 'subscription', billingType, asaasCycle };
  }

  if (billingCycle === 'custom') {
    // Card is not supported for one-off charges in current Asaas integration
    if (method === 'card') return null;
    return { path: 'charge', billingType };
  }

  return null;
}

// ─── Data loaders (admin client, no RLS) ─────────────────────────

async function loadSubscription(subscriptionId: string): Promise<LocalSubscription | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, academy_id, student_id, plan_id, status, started_at, expires_at, billing_cycle, price')
    .eq('id', subscriptionId)
    .single();

  if (error || !data) return null;

  const sub = data as unknown as LocalSubscription;
  sub.price = Number(sub.price);
  return sub;
}

async function loadPayment(paymentId: string): Promise<LocalPayment | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select('id, academy_id, subscription_id, student_id, amount, status, method, due_date')
    .eq('id', paymentId)
    .single();

  if (error || !data) return null;
  return data as unknown as LocalPayment;
}

async function loadStudent(studentId: string): Promise<StudentData | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, cpf, phone')
    .eq('id', studentId)
    .single();

  if (error || !data) return null;
  return data as StudentData;
}

async function findStudentPrimaryUnit(studentId: string): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from('student_unit_assignments')
    .select('unit_id')
    .eq('student_id', studentId)
    .eq('is_primary', true)
    .maybeSingle();

  return (data as { unit_id: string } | null)?.unit_id ?? null;
}

// ─── Account resolution (admin, production-first) ────────────────

async function resolveAccountForBilling(
  academyId: string,
  unitId: string | null,
): Promise<{ account: ResolvedAccount; environment: AsaasEnvironment } | null> {
  const supabase = createAdminSupabaseClient();

  const { data: accounts, error } = await supabase
    .from('asaas_accounts')
    .select('id, academy_id, unit_id, environment, status, api_key_reference, asaas_account_id')
    .eq('academy_id', academyId)
    .eq('status', 'active');

  if (error || !accounts || accounts.length === 0) return null;

  const rows = accounts as unknown as ResolvedAccount[];

  // Try production first, then sandbox
  for (const env of ['production', 'sandbox'] as AsaasEnvironment[]) {
    const envAccounts = rows.filter((r) => r.environment === env);
    if (envAccounts.length === 0) continue;

    // Priority: unit-level > academy-level
    let chosen: ResolvedAccount | undefined;
    if (unitId) {
      chosen = envAccounts.find((r) => r.unit_id === unitId);
    }
    if (!chosen) {
      chosen = envAccounts.find((r) => r.unit_id === null);
    }

    if (chosen && chosen.api_key_reference) {
      return { account: chosen, environment: env };
    }
  }

  return null;
}

// ─── Customer sync (admin, simplified for activation) ────────────

interface CustomerLink {
  localLinkId: string;
  asaasCustomerId: string;
}

async function ensureCustomerSynced(input: {
  student: StudentData;
  academyId: string;
  accountId: string;
  environment: AsaasEnvironment;
  client: AsaasClient;
}): Promise<CustomerLink> {
  const { student, academyId, accountId, client } = input;
  const supabase = createAdminSupabaseClient();

  // Check existing link
  const { data: existingLink } = await supabase
    .from('asaas_customers')
    .select('id, asaas_customer_id, status')
    .eq('student_id', student.id)
    .eq('asaas_account_id', accountId)
    .maybeSingle();

  if (existingLink) {
    const link = existingLink as { id: string; asaas_customer_id: string; status: string };

    // Try to update existing customer
    try {
      const externalRef = buildStudentExternalReference(student.id, academyId);
      await client.updateCustomer(link.asaas_customer_id, {
        name: student.name,
        cpfCnpj: student.cpf!,
        externalReference: externalRef,
        ...(student.email ? { email: student.email } : {}),
        ...(student.phone ? { mobilePhone: student.phone } : {}),
      });

      return { localLinkId: link.id, asaasCustomerId: link.asaas_customer_id };
    } catch (err) {
      // If customer was deleted on Asaas (404), recreate
      if (err instanceof AsaasApiError && err.statusCode === 404) {
        const created = await createCustomerAndLink(input, supabase);
        // Update existing link with new customer ID
        await supabase
          .from('asaas_customers')
          .update({
            asaas_customer_id: created.asaasCustomerId,
            status: 'active',
            synced_at: new Date().toISOString(),
          })
          .eq('id', link.id);

        return { localLinkId: link.id, asaasCustomerId: created.asaasCustomerId };
      }
      throw err;
    }
  }

  // No link — create customer and persist
  return createCustomerAndLink(input, supabase);
}

async function createCustomerAndLink(
  input: {
    student: StudentData;
    academyId: string;
    accountId: string;
    environment: AsaasEnvironment;
    client: AsaasClient;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<CustomerLink> {
  const { student, academyId, accountId, environment, client } = input;
  const externalRef = buildStudentExternalReference(student.id, academyId);

  const payload: AsaasCustomerCreateRequest = {
    name: student.name,
    cpfCnpj: student.cpf!,
    externalReference: externalRef,
  };
  if (student.email) payload.email = student.email;
  if (student.phone) payload.mobilePhone = student.phone;

  const asaasCustomer = await client.createCustomer(payload);

  const { data: linkData, error: linkError } = await supabase
    .from('asaas_customers')
    .insert({
      academy_id: accountId, // FK uses account context
      student_id: student.id,
      asaas_account_id: accountId,
      environment,
      asaas_customer_id: asaasCustomer.id,
      status: 'active',
      external_reference: externalRef,
      synced_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (linkError || !linkData) {
    throw new Error(`Erro ao persistir vínculo de customer: ${linkError?.message ?? 'unknown'}`);
  }

  return {
    localLinkId: (linkData as { id: string }).id,
    asaasCustomerId: asaasCustomer.id,
  };
}

// ─── Idempotency checks ─────────────────────────────────────────

async function findExistingSubscriptionLink(subscriptionId: string) {
  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from('asaas_subscriptions')
    .select('id, asaas_subscription_id, asaas_status, environment')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();

  return data as {
    id: string;
    asaas_subscription_id: string;
    asaas_status: string;
    environment: string;
  } | null;
}

async function findExistingChargeLink(paymentId: string) {
  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from('asaas_charges')
    .select('id, asaas_account_id, asaas_payment_id, asaas_status, billing_type, invoice_url, bank_slip_url, environment')
    .eq('payment_id', paymentId)
    .maybeSingle();

  return data as {
    id: string;
    asaas_account_id: string;
    asaas_payment_id: string;
    asaas_status: string;
    billing_type: string;
    invoice_url: string | null;
    bank_slip_url: string | null;
    environment: string;
  } | null;
}

async function buildAsaasClientForAccount(
  accountId: string,
  environment: AsaasEnvironment,
): Promise<AsaasClient | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('asaas_accounts')
    .select('api_key_reference')
    .eq('id', accountId)
    .maybeSingle();

  if (error || !data?.api_key_reference) {
    return null;
  }

  try {
    const apiKey = await getCredentialResolver().resolve(data.api_key_reference);
    return new AsaasClient(apiKey, environment);
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function buildStudentExternalReference(studentId: string, academyId: string): string {
  return `moveaccess:student:${studentId}:academy:${academyId}`;
}

function buildSubscriptionExternalReference(subscriptionId: string, academyId: string): string {
  return `moveaccess:sub:${subscriptionId}:academy:${academyId}`;
}

function buildChargeExternalReference(paymentId: string, academyId: string): string {
  return `moveaccess:payment:${paymentId}:academy:${academyId}`;
}

function formatDateInBillingTimeZone(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BILLING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = formatDateInBillingTimeZone(new Date());

  if (isNaN(d.getTime())) {
    return today;
  }

  const dueDate = formatDateInBillingTimeZone(d);
  return dueDate < today ? today : dueDate;
}

type ChargePresentation = Pick<ActivateExternalBillingResult,
  | 'paymentLink'
  | 'invoiceUrl'
  | 'bankSlipUrl'
  | 'bankSlipIdentificationField'
  | 'bankSlipBarCode'
  | 'bankSlipNossoNumero'
  | 'pixCopyPaste'
  | 'pixQrCodeImage'
  | 'pixQrCodeExpirationDate'
>;

function mapBillingInfoToPresentation(
  billingInfo: AsaasPaymentBillingInfoResponse,
): ChargePresentation {
  return {
    bankSlipIdentificationField: billingInfo.bankSlip?.identificationField ?? null,
    bankSlipBarCode: billingInfo.bankSlip?.barCode ?? null,
    bankSlipNossoNumero: billingInfo.bankSlip?.nossoNumero ?? null,
    bankSlipUrl: billingInfo.bankSlip?.bankSlipUrl ?? null,
    pixCopyPaste: billingInfo.pix?.payload ?? null,
    pixQrCodeImage: billingInfo.pix?.encodedImage ?? null,
    pixQrCodeExpirationDate: billingInfo.pix?.expirationDate ?? null,
  };
}

async function loadChargePresentation(
  client: AsaasClient,
  asaasPaymentId: string,
): Promise<ChargePresentation> {
  const presentation: ChargePresentation = {};

  try {
    const payment = await client.getPayment(asaasPaymentId);
    presentation.paymentLink = payment.paymentLink ?? null;
    presentation.invoiceUrl = payment.invoiceUrl ?? null;
    presentation.bankSlipUrl = payment.bankSlipUrl ?? null;
  } catch {
    // Keep enrichment best-effort.
  }

  try {
    Object.assign(
      presentation,
      mapBillingInfoToPresentation(await client.getPaymentBillingInfo(asaasPaymentId)),
    );
  } catch {
    // Keep enrichment best-effort.
  }

  return presentation;
}

// ─── Persist helpers ─────────────────────────────────────────────

async function persistSubscriptionLink(input: {
  subscriptionId: string;
  academyId: string;
  asaasAccountId: string;
  asaasCustomerLinkId: string;
  environment: AsaasEnvironment;
  asaasSubscriptionId: string;
  externalReference: string;
  asaasStatus: AsaasSubscriptionStatus;
  billingType: AsaasBillingType;
  cycle: AsaasSubscriptionCycle;
  value: number;
  nextDueDate: string | null;
  description: string;
}): Promise<string> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_subscriptions')
    .insert({
      subscription_id: input.subscriptionId,
      academy_id: input.academyId,
      asaas_account_id: input.asaasAccountId,
      asaas_customer_id: input.asaasCustomerLinkId,
      environment: input.environment,
      asaas_subscription_id: input.asaasSubscriptionId,
      external_reference: input.externalReference,
      asaas_status: input.asaasStatus,
      billing_type: input.billingType,
      cycle: input.cycle,
      value: input.value,
      next_due_date: input.nextDueDate,
      description: input.description,
      synced_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Erro ao persistir vínculo de assinatura externa: ${error?.message ?? 'unknown'}`);
  }

  return (data as unknown as { id: string }).id;
}

async function persistChargeLink(input: {
  academyId: string;
  paymentId: string;
  asaasAccountId: string;
  asaasCustomerLinkId: string;
  environment: AsaasEnvironment;
  asaasPaymentId: string;
  externalReference: string;
  billingType: AsaasBillingType;
  asaasStatus: AsaasPaymentStatus;
  value: number;
  netValue: number | null;
  dueDate: string;
  paymentDate: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
}): Promise<string> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_charges')
    .insert({
      academy_id: input.academyId,
      payment_id: input.paymentId,
      asaas_account_id: input.asaasAccountId,
      asaas_customer_id: input.asaasCustomerLinkId,
      environment: input.environment,
      asaas_payment_id: input.asaasPaymentId,
      external_reference: input.externalReference,
      billing_type: input.billingType,
      asaas_status: input.asaasStatus,
      value: input.value,
      net_value: input.netValue,
      due_date: input.dueDate,
      payment_date: input.paymentDate,
      invoice_url: input.invoiceUrl,
      bank_slip_url: input.bankSlipUrl,
      synced_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Erro ao persistir vínculo da cobrança: ${error?.message ?? 'unknown'}`);
  }

  return (data as unknown as { id: string }).id;
}

// ─── External subscription creation ─────────────────────────────

async function createExternalSubscription(ctx: {
  subscription: LocalSubscription;
  payment: LocalPayment;
  decision: BillingDecision;
  customerLink: CustomerLink;
  account: ResolvedAccount;
  environment: AsaasEnvironment;
  client: AsaasClient;
}): Promise<ActivateExternalBillingResult> {
  const { subscription, payment, decision, customerLink, account, environment, client } = ctx;

  const externalRef = buildSubscriptionExternalReference(subscription.id, subscription.academy_id);
  const description = `MoveAccess — Assinatura ${subscription.id.slice(0, 8)}`;

  const asaasResponse = await client.createSubscription({
    customer: customerLink.asaasCustomerId,
    billingType: decision.billingType,
    value: subscription.price,
    nextDueDate: formatDueDate(payment.due_date),
    cycle: decision.asaasCycle!,
    description,
    externalReference: externalRef,
  });

  await persistSubscriptionLink({
    subscriptionId: subscription.id,
    academyId: subscription.academy_id,
    asaasAccountId: account.id,
    asaasCustomerLinkId: customerLink.localLinkId,
    environment,
    asaasSubscriptionId: asaasResponse.id,
    externalReference: externalRef,
    asaasStatus: asaasResponse.status,
    billingType: asaasResponse.billingType,
    cycle: asaasResponse.cycle,
    value: asaasResponse.value,
    nextDueDate: asaasResponse.nextDueDate ?? null,
    description,
  });

  return {
    status: 'completed_with_billing',
    billingPath: 'subscription',
    asaasSubscriptionId: asaasResponse.id,
    environment,
  };
}

// ─── External charge creation ────────────────────────────────────

async function createExternalCharge(ctx: {
  subscription: LocalSubscription;
  payment: LocalPayment;
  decision: BillingDecision;
  customerLink: CustomerLink;
  account: ResolvedAccount;
  environment: AsaasEnvironment;
  client: AsaasClient;
}): Promise<ActivateExternalBillingResult> {
  const { subscription, payment, decision, customerLink, account, environment, client } = ctx;

  const externalRef = buildChargeExternalReference(payment.id, subscription.academy_id);
  const description = `MoveAccess — Cobrança ${payment.id.slice(0, 8)}`;

  const asaasPayment = await client.createPayment({
    customer: customerLink.asaasCustomerId,
    billingType: decision.billingType,
    value: Number(payment.amount),
    dueDate: formatDueDate(payment.due_date),
    description,
    externalReference: externalRef,
  });

  const chargeId = await persistChargeLink({
    academyId: subscription.academy_id,
    paymentId: payment.id,
    asaasAccountId: account.id,
    asaasCustomerLinkId: customerLink.localLinkId,
    environment,
    asaasPaymentId: asaasPayment.id,
    externalReference: externalRef,
    billingType: decision.billingType,
    asaasStatus: asaasPayment.status,
    value: asaasPayment.value,
    netValue: asaasPayment.netValue ?? null,
    dueDate: asaasPayment.dueDate,
    paymentDate: asaasPayment.paymentDate ?? null,
    invoiceUrl: asaasPayment.invoiceUrl ?? null,
    bankSlipUrl: asaasPayment.bankSlipUrl ?? null,
  });

  const presentation = await loadChargePresentation(client, asaasPayment.id);

  return {
    status: 'completed_with_billing',
    billingPath: 'charge',
    asaasChargeId: chargeId,
    asaasPaymentId: asaasPayment.id,
    paymentLink: presentation.paymentLink ?? asaasPayment.paymentLink ?? null,
    invoiceUrl: presentation.invoiceUrl ?? asaasPayment.invoiceUrl ?? null,
    bankSlipUrl: presentation.bankSlipUrl ?? asaasPayment.bankSlipUrl ?? null,
    bankSlipIdentificationField: presentation.bankSlipIdentificationField ?? null,
    bankSlipBarCode: presentation.bankSlipBarCode ?? null,
    bankSlipNossoNumero: presentation.bankSlipNossoNumero ?? null,
    pixCopyPaste: presentation.pixCopyPaste ?? null,
    pixQrCodeImage: presentation.pixQrCodeImage ?? null,
    pixQrCodeExpirationDate: presentation.pixQrCodeExpirationDate ?? null,
    environment,
  };
}

// ─── Main use-case ───────────────────────────────────────────────

export async function activateExternalBilling(
  input: ActivateExternalBillingInput,
): Promise<ActivateExternalBillingResult> {
  // 1. Load subscription
  const subscription = await loadSubscription(input.subscriptionId);
  if (!subscription) {
    return { status: 'failed_external_billing', billingPath: null, reason: 'SUBSCRIPTION_NOT_FOUND' };
  }

  // 2. Load payment
  const payment = await loadPayment(input.paymentId);
  if (!payment) {
    return { status: 'failed_external_billing', billingPath: null, reason: 'PAYMENT_NOT_FOUND' };
  }

  // 3. Decision matrix
  const decision = decideBilling(subscription.billing_cycle, payment.method);
  if (!decision) {
    if (payment.method === 'manual') {
      return { status: 'completed_local_only', billingPath: null, reason: 'MANUAL_PAYMENT' };
    }
    return {
      status: 'pending_external_billing',
      billingPath: null,
      reason: 'UNSUPPORTED_BILLING_COMBINATION',
    };
  }

  // 4. Idempotency check
  if (decision.path === 'subscription') {
    const existing = await findExistingSubscriptionLink(subscription.id);
    if (existing) {
      return {
        status: 'already_exists',
        billingPath: 'subscription',
        asaasSubscriptionId: existing.asaas_subscription_id,
        environment: existing.environment as AsaasEnvironment,
      };
    }
  } else {
    const existing = await findExistingChargeLink(payment.id);
    if (existing) {
      let presentation: ChargePresentation = {
        paymentLink: null,
        invoiceUrl: existing.invoice_url,
        bankSlipUrl: existing.bank_slip_url,
        bankSlipIdentificationField: null,
        bankSlipBarCode: null,
        bankSlipNossoNumero: null,
        pixCopyPaste: null,
        pixQrCodeImage: null,
        pixQrCodeExpirationDate: null,
      };

      const client = await buildAsaasClientForAccount(
        existing.asaas_account_id,
        existing.environment as AsaasEnvironment,
      );

      if (client) {
        const refreshedPresentation = await loadChargePresentation(client, existing.asaas_payment_id);
        presentation = {
          ...presentation,
          ...refreshedPresentation,
        };
      }

      return {
        status: 'already_exists',
        billingPath: 'charge',
        asaasChargeId: existing.id,
        asaasPaymentId: existing.asaas_payment_id,
        paymentLink: presentation.paymentLink ?? null,
        invoiceUrl: presentation.invoiceUrl ?? existing.invoice_url,
        bankSlipUrl: presentation.bankSlipUrl ?? existing.bank_slip_url,
        bankSlipIdentificationField: presentation.bankSlipIdentificationField ?? null,
        bankSlipBarCode: presentation.bankSlipBarCode ?? null,
        bankSlipNossoNumero: presentation.bankSlipNossoNumero ?? null,
        pixCopyPaste: presentation.pixCopyPaste ?? null,
        pixQrCodeImage: presentation.pixQrCodeImage ?? null,
        pixQrCodeExpirationDate: presentation.pixQrCodeExpirationDate ?? null,
        environment: existing.environment as AsaasEnvironment,
      };
    }
  }

  // 5. Resolve Asaas account (production-first, unit > academy)
  const unitId = await findStudentPrimaryUnit(subscription.student_id);
  const resolved = await resolveAccountForBilling(subscription.academy_id, unitId);

  if (!resolved) {
    return {
      status: 'pending_external_billing',
      billingPath: decision.path,
      reason: 'NO_ASAAS_ACCOUNT',
    };
  }

  const { account, environment } = resolved;

  // 6. Load student data for customer sync
  const student = await loadStudent(subscription.student_id);
  if (!student) {
    return {
      status: 'failed_external_billing',
      billingPath: decision.path,
      reason: 'STUDENT_NOT_FOUND',
    };
  }

  if (!student.cpf) {
    return {
      status: 'pending_external_billing',
      billingPath: decision.path,
      reason: 'STUDENT_MISSING_CPF',
    };
  }

  // 7. Build Asaas client
  const credentialResolver = getCredentialResolver();
  const apiKey = await credentialResolver.resolve(account.api_key_reference);
  const client = new AsaasClient(apiKey, environment);

  // 8. Sync customer (idempotent)
  let customerLink: CustomerLink;
  try {
    customerLink = await ensureCustomerSynced({
      student,
      academyId: subscription.academy_id,
      accountId: account.id,
      environment,
      client,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'failed_external_billing',
      billingPath: decision.path,
      reason: `CUSTOMER_SYNC_FAILED: ${message}`,
      environment,
    };
  }

  // 9. Execute billing path
  try {
    if (decision.path === 'subscription') {
      return await createExternalSubscription({
        subscription,
        payment,
        decision,
        customerLink,
        account,
        environment,
        client,
      });
    } else {
      return await createExternalCharge({
        subscription,
        payment,
        decision,
        customerLink,
        account,
        environment,
        client,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'failed_external_billing',
      billingPath: decision.path,
      reason: `EXTERNAL_API_ERROR: ${message}`,
      environment,
    };
  }
}
