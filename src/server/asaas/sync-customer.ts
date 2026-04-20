// Use-case: Synchronize a local student as a customer on Asaas.
//
// Flow:
//   1. Resolve the correct Asaas account (unit > academy fallback)
//   2. Resolve the API credential via the credential resolver
//   3. Build the Asaas HTTP client for the right environment
//   4. Fetch student data from the local database
//   5. Check for an existing local link (asaas_customers)
//   6. If link exists:
//      - Try to update the customer on Asaas
//      - If the customer was deleted on Asaas (404), recreate it
//   7. If no link: create the customer on Asaas, persist link
//   8. Return a typed result

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveAsaasAccountServer, type ResolvedAccount } from './asaas-account-resolver';
import { getCredentialResolver } from './credential-resolver';
import { AsaasClient, AsaasApiError } from './asaas-client';
import type {
  AsaasEnvironment,
  AsaasCustomerCreateRequest,
  AsaasCustomerUpdateRequest,
} from './types';

// ─── Input / Output ──────────────────────────────────────────────

export interface SyncCustomerInput {
  studentId: string;
  academyId: string;
  unitId?: string | null;
  environment: AsaasEnvironment;
}

export type SyncCustomerAction = 'created' | 'updated' | 'recreated';

export interface SyncCustomerResult {
  success: true;
  action: SyncCustomerAction;
  asaasCustomerId: string;
  localLinkId: string;
  account: {
    id: string;
    source: ResolvedAccount['source'];
    isFallbackToAcademy: boolean;
  };
}

// ─── Student data ────────────────────────────────────────────────

interface StudentData {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
}

async function getStudentData(studentId: string): Promise<StudentData> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, cpf, phone')
    .eq('id', studentId)
    .eq('user_type', 'student')
    .single();

  if (error || !data) {
    throw new Error(`Aluno ${studentId} não encontrado.`);
  }

  return data as StudentData;
}

// ─── Local link (asaas_customers) ────────────────────────────────

interface LocalCustomerLink {
  id: string;
  asaas_customer_id: string;
  status: string;
}

async function findLocalLink(
  studentId: string,
  asaasAccountId: string,
): Promise<LocalCustomerLink | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_customers')
    .select('id, asaas_customer_id, status')
    .eq('student_id', studentId)
    .eq('asaas_account_id', asaasAccountId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar vínculo local de customer: ${error.message}`);
  }

  return data as LocalCustomerLink | null;
}

async function createLocalLink(input: {
  academyId: string;
  studentId: string;
  asaasAccountId: string;
  environment: AsaasEnvironment;
  asaasCustomerId: string;
  externalReference: string;
}): Promise<string> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_customers')
    .insert({
      academy_id: input.academyId,
      student_id: input.studentId,
      asaas_account_id: input.asaasAccountId,
      environment: input.environment,
      asaas_customer_id: input.asaasCustomerId,
      status: 'active',
      external_reference: input.externalReference,
      synced_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Erro ao criar vínculo local de customer: ${error?.message ?? 'unknown'}`);
  }

  return (data as { id: string }).id;
}

async function updateLocalLink(
  linkId: string,
  patch: {
    asaasCustomerId?: string;
    externalReference?: string;
  },
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const updatePayload: Record<string, unknown> = {
    synced_at: new Date().toISOString(),
    status: 'active',
  };
  if (patch.asaasCustomerId) {
    updatePayload.asaas_customer_id = patch.asaasCustomerId;
  }
  if (patch.externalReference) {
    updatePayload.external_reference = patch.externalReference;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('asaas_customers') as any)
    .update(updatePayload)
    .eq('id', linkId);

  if (error) {
    throw new Error(`Erro ao atualizar vínculo local de customer: ${error.message}`);
  }
}

// ─── Payload builders ────────────────────────────────────────────

function buildExternalReference(studentId: string, academyId: string): string {
  return `moveaccess:student:${studentId}:academy:${academyId}`;
}

function buildCreatePayload(
  student: StudentData,
  externalReference: string,
): AsaasCustomerCreateRequest {
  const payload: AsaasCustomerCreateRequest = {
    name: student.name,
    cpfCnpj: student.cpf!,
    externalReference,
  };

  if (student.email) payload.email = student.email;
  if (student.phone) payload.mobilePhone = student.phone;

  return payload;
}

function buildUpdatePayload(
  student: StudentData,
  externalReference: string,
): AsaasCustomerUpdateRequest {
  const payload: AsaasCustomerUpdateRequest = {
    name: student.name,
    externalReference,
  };

  if (student.cpf) payload.cpfCnpj = student.cpf;
  if (student.email) payload.email = student.email;
  if (student.phone) payload.mobilePhone = student.phone;

  return payload;
}

// ─── Main sync logic ─────────────────────────────────────────────

export async function syncCustomer(input: SyncCustomerInput): Promise<SyncCustomerResult> {
  // 1. Resolve Asaas account (unit > academy fallback)
  const resolvedAccount = await resolveAsaasAccountServer({
    academyId: input.academyId,
    unitId: input.unitId,
    environment: input.environment,
  });

  // 2. Resolve credential
  const credentialResolver = getCredentialResolver();
  const apiKey = await credentialResolver.resolve(resolvedAccount.apiKeyReference);

  // 3. Build Asaas client for the correct environment
  const client = new AsaasClient(apiKey, input.environment);

  // 4. Get student data
  const student = await getStudentData(input.studentId);

  if (!student.cpf) {
    throw new Error(
      `Aluno ${input.studentId} não possui CPF cadastrado. ` +
      `CPF é obrigatório para criar customer no Asaas.`
    );
  }

  // 5. Check existing local link
  const existingLink = await findLocalLink(input.studentId, resolvedAccount.id);
  const externalReference = buildExternalReference(input.studentId, input.academyId);

  const accountInfo = {
    id: resolvedAccount.id,
    source: resolvedAccount.source,
    isFallbackToAcademy: resolvedAccount.isFallbackToAcademy,
  };

  // 6. Link exists — update or recreate
  if (existingLink) {
    try {
      await client.updateCustomer(
        existingLink.asaas_customer_id,
        buildUpdatePayload(student, externalReference),
      );

      await updateLocalLink(existingLink.id, { externalReference });

      return {
        success: true,
        action: 'updated',
        asaasCustomerId: existingLink.asaas_customer_id,
        localLinkId: existingLink.id,
        account: accountInfo,
      };
    } catch (err) {
      // Customer was deleted on Asaas — recreate
      if (err instanceof AsaasApiError && err.statusCode === 404) {
        const newCustomer = await client.createCustomer(
          buildCreatePayload(student, externalReference),
        );

        await updateLocalLink(existingLink.id, {
          asaasCustomerId: newCustomer.id,
          externalReference,
        });

        return {
          success: true,
          action: 'recreated',
          asaasCustomerId: newCustomer.id,
          localLinkId: existingLink.id,
          account: accountInfo,
        };
      }

      throw err;
    }
  }

  // 7. No link — create customer on Asaas
  const asaasCustomer = await client.createCustomer(
    buildCreatePayload(student, externalReference),
  );

  // 8. Persist local link
  const linkId = await createLocalLink({
    academyId: input.academyId,
    studentId: input.studentId,
    asaasAccountId: resolvedAccount.id,
    environment: input.environment,
    asaasCustomerId: asaasCustomer.id,
    externalReference,
  });

  return {
    success: true,
    action: 'created',
    asaasCustomerId: asaasCustomer.id,
    localLinkId: linkId,
    account: accountInfo,
  };
}
