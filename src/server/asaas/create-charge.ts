// Use-case: Create a charge on Asaas from an existing local payment.
//
// Flow:
//   1. Validate authorization (staff + academy membership)
//   2. Load the local payment and validate consistency
//   3. Check for existing charge link (idempotency)
//   4. Resolve Asaas account (unit > academy fallback)
//   5. Ensure customer is synced on Asaas
//   6. Map local payment method to Asaas billingType
//   7. Create the charge on Asaas
//   8. Persist the local charge link (asaas_charges)
//   9. Return typed result

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveAsaasAccountServer, type ResolvedAccount } from './asaas-account-resolver';
import { getCredentialResolver } from './credential-resolver';
import { AsaasClient } from './asaas-client';
import { syncCustomer } from './sync-customer';
import { requireStaffForAcademy, AuthorizationError } from './auth';
import type {
  AsaasEnvironment,
  AsaasBillingType,
  AsaasPaymentStatus,
} from './types';

export { AuthorizationError };

// ─── Input / Output ──────────────────────────────────────────────

export interface CreateChargeInput {
  paymentId: string;
  academyId: string;
  unitId?: string | null;
  environment: AsaasEnvironment;
}

export interface CreateChargeResult {
  success: true;
  action: 'created' | 'already_exists';
  chargeId: string;
  asaasPaymentId: string;
  asaasStatus: AsaasPaymentStatus;
  billingType: AsaasBillingType;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  account: {
    id: string;
    source: ResolvedAccount['source'];
    isFallbackToAcademy: boolean;
  };
}

// ─── Local payment data ──────────────────────────────────────────

interface LocalPayment {
  id: string;
  academy_id: string;
  subscription_id: string;
  student_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  reference: string | null;
  due_date: string;
  paid_at: string | null;
}

async function loadLocalPayment(paymentId: string, academyId: string): Promise<LocalPayment> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select('id, academy_id, subscription_id, student_id, amount, currency, status, method, reference, due_date, paid_at')
    .eq('id', paymentId)
    .single();

  if (error || !data) {
    throw new Error(`Payment ${paymentId} não encontrado.`);
  }

  const payment = data as unknown as LocalPayment;

  if (payment.academy_id !== academyId) {
    throw new AuthorizationError(
      'Payment não pertence à academia informada.'
    );
  }

  return payment;
}

// ─── Existing charge check ───────────────────────────────────────

interface ExistingChargeLink {
  id: string;
  asaas_payment_id: string;
  asaas_status: string;
  billing_type: string;
  invoice_url: string | null;
  bank_slip_url: string | null;
  asaas_account_id: string;
}

async function findExistingCharge(paymentId: string): Promise<ExistingChargeLink | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_charges')
    .select('id, asaas_payment_id, asaas_status, billing_type, invoice_url, bank_slip_url, asaas_account_id')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao verificar cobrança existente: ${error.message}`);
  }

  return data as ExistingChargeLink | null;
}

// ─── Persist charge link ─────────────────────────────────────────

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
  const supabase = await createServerSupabaseClient();

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

  return (data as { id: string }).id;
}

// ─── Method mapping ──────────────────────────────────────────────

const METHOD_TO_BILLING_TYPE: Record<string, AsaasBillingType> = {
  pix: 'PIX',
  boleto: 'BOLETO',
};

const SUPPORTED_METHODS = new Set(Object.keys(METHOD_TO_BILLING_TYPE));

function toBillingType(method: string): AsaasBillingType {
  const billingType = METHOD_TO_BILLING_TYPE[method];
  if (!billingType) {
    const supported = Array.from(SUPPORTED_METHODS).join(', ');
    throw new Error(
      `Método "${method}" não é suportado para cobrança no Asaas neste momento. ` +
      `Métodos suportados: ${supported}.`
    );
  }
  return billingType;
}

// ─── External reference ──────────────────────────────────────────

function buildChargeExternalReference(paymentId: string, academyId: string): string {
  return `moveaccess:payment:${paymentId}:academy:${academyId}`;
}

// ─── Due date formatting ─────────────────────────────────────────

function formatDueDate(dueDate: string): string {
  // Asaas expects YYYY-MM-DD.
  // The local due_date is timestamptz (e.g. "2026-04-15T00:00:00.000Z").
  //
  // Using toISOString().split('T') ensures UTC-based date extraction,
  // avoiding timezone shifts where e.g. UTC midnight becomes the previous
  // day in UTC-3 (BRT) when using getFullYear()/getMonth()/getDate().
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) {
    throw new Error(`Data de vencimento inválida: "${dueDate}"`);
  }
  return d.toISOString().split('T')[0];
}

// ─── Find or create customer link ────────────────────────────────

interface CustomerLinkResult {
  localLinkId: string;
  asaasCustomerId: string;
}

async function ensureCustomerSynced(input: {
  studentId: string;
  academyId: string;
  unitId?: string | null;
  environment: AsaasEnvironment;
}): Promise<CustomerLinkResult> {
  // Reuse sync-customer use-case. It is idempotent:
  // - If link exists: updates customer data, returns existing link
  // - If no link: creates customer, persists link
  const result = await syncCustomer(input);
  return {
    localLinkId: result.localLinkId,
    asaasCustomerId: result.asaasCustomerId,
  };
}

// ─── Main use-case ───────────────────────────────────────────────

export async function createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
  // 1. Validate authorization
  await requireStaffForAcademy(input.academyId);

  // 2. Load and validate local payment
  const payment = await loadLocalPayment(input.paymentId, input.academyId);

  if (payment.status === 'paid') {
    throw new Error('Não é possível criar cobrança para um payment já pago.');
  }

  if (payment.status === 'refunded') {
    throw new Error('Não é possível criar cobrança para um payment estornado.');
  }

  // 3. Check for existing charge (idempotency)
  const existingCharge = await findExistingCharge(payment.id);

  if (existingCharge) {
    return {
      success: true,
      action: 'already_exists',
      chargeId: existingCharge.id,
      asaasPaymentId: existingCharge.asaas_payment_id,
      asaasStatus: existingCharge.asaas_status as AsaasPaymentStatus,
      billingType: existingCharge.billing_type as AsaasBillingType,
      invoiceUrl: existingCharge.invoice_url,
      bankSlipUrl: existingCharge.bank_slip_url,
      account: {
        id: existingCharge.asaas_account_id,
        source: 'academy',
        isFallbackToAcademy: false,
      },
    };
  }

  // 4. Validate method and resolve billing type
  const billingType = toBillingType(payment.method);

  // 5. Resolve Asaas account
  const resolvedAccount = await resolveAsaasAccountServer({
    academyId: input.academyId,
    unitId: input.unitId,
    environment: input.environment,
  });

  // 6. Ensure customer is synced
  const customerLink = await ensureCustomerSynced({
    studentId: payment.student_id,
    academyId: input.academyId,
    unitId: input.unitId,
    environment: input.environment,
  });

  // 7. Resolve credential and build client
  const credentialResolver = getCredentialResolver();
  const apiKey = await credentialResolver.resolve(resolvedAccount.apiKeyReference);
  const client = new AsaasClient(apiKey, input.environment);

  // 8. Build payload and create charge on Asaas
  const externalReference = buildChargeExternalReference(payment.id, input.academyId);
  const description = payment.reference
    ? `MoveAccess — ${payment.reference}`
    : `MoveAccess — Cobrança ${payment.id.slice(0, 8)}`;

  const asaasPayment = await client.createPayment({
    customer: customerLink.asaasCustomerId,
    billingType,
    value: Number(payment.amount),
    dueDate: formatDueDate(payment.due_date),
    description,
    externalReference,
  });

  // 9. Persist local charge link
  const chargeId = await persistChargeLink({
    academyId: input.academyId,
    paymentId: payment.id,
    asaasAccountId: resolvedAccount.id,
    asaasCustomerLinkId: customerLink.localLinkId,
    environment: input.environment,
    asaasPaymentId: asaasPayment.id,
    externalReference,
    billingType,
    asaasStatus: asaasPayment.status,
    value: asaasPayment.value,
    netValue: asaasPayment.netValue ?? null,
    dueDate: asaasPayment.dueDate,
    paymentDate: asaasPayment.paymentDate ?? null,
    invoiceUrl: asaasPayment.invoiceUrl ?? null,
    bankSlipUrl: asaasPayment.bankSlipUrl ?? null,
  });

  return {
    success: true,
    action: 'created',
    chargeId,
    asaasPaymentId: asaasPayment.id,
    asaasStatus: asaasPayment.status,
    billingType,
    invoiceUrl: asaasPayment.invoiceUrl ?? null,
    bankSlipUrl: asaasPayment.bankSlipUrl ?? null,
    account: {
      id: resolvedAccount.id,
      source: resolvedAccount.source,
      isFallbackToAcademy: resolvedAccount.isFallbackToAcademy,
    },
  };
}
