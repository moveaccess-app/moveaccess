import { createInviteLink } from '@/lib/invites/inviteLinksService';

export interface StudentPortalAccessLinkInput {
  unitId?: string | null;
  email?: string | null;
  recipientName?: string | null;
  description?: string | null;
  expirationDays?: number;
}

export interface StudentPortalAccessLinkResult {
  success: boolean;
  email: string | null;
  setupUrl?: string;
  expiresAt?: string;
  error?: string;
}

export function buildStudentPortalSetupUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/aluno/ativar/${token}`;
  }

  return `/aluno/ativar/${token}`;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email || null;
}

export function isOperationalEmail(value: string | null | undefined): value is string {
  const email = normalizeEmail(value);
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export async function generateStudentPortalAccessLink(
  input: StudentPortalAccessLinkInput,
): Promise<StudentPortalAccessLinkResult> {
  const email = normalizeEmail(input.email);

  if (!isOperationalEmail(email)) {
    return {
      success: false,
      email,
      error: 'O aluno não tem um e-mail válido para gerar um link seguro de acesso.',
    };
  }

  const inviteResult = await createInviteLink({
    unitId: input.unitId,
    expectedEmail: email,
    recipientName: input.recipientName || null,
    description: input.description || 'Acesso ao portal do aluno',
    expirationDays: input.expirationDays ?? 7,
  });

  if (!inviteResult.success || !inviteResult.invite) {
    return {
      success: false,
      email,
      error: inviteResult.error || 'Não foi possível gerar o link seguro do portal do aluno.',
    };
  }

  return {
    success: true,
    email,
    setupUrl: buildStudentPortalSetupUrl(inviteResult.invite.token),
    expiresAt: inviteResult.invite.expiresAt,
  };
}
