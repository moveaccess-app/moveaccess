import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

interface InviteLinkRow {
  id: string;
  academy_id: string;
  expected_email: string | null;
  recipient_name: string | null;
  expires_at: string;
  used_at: string | null;
  completed_at: string | null;
}

interface StudentProfileRow {
  id: string;
  name: string | null;
  email: string | null;
}

type AccessTokenErrorCode = 'TOKEN_INVALID' | 'TOKEN_USED' | 'TOKEN_EXPIRED' | 'STUDENT_NOT_FOUND';

type ResolvedStudentAccessToken =
  | {
      invite: InviteLinkRow;
      student: StudentProfileRow;
      academyName: string | null;
    }
  | {
      error: AccessTokenErrorCode;
      status: 404 | 410 | 422;
      invite?: InviteLinkRow;
    };

interface EnsureStudentAuthLoginResult {
  success?: boolean;
  error_code?: string;
}

function jsonError(error: string, status: number, extras: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extras }, { status });
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }

  return null;
}

function getAccessTokenMessage(errorCode: AccessTokenErrorCode): string {
  switch (errorCode) {
    case 'TOKEN_USED':
      return 'Este link já foi utilizado. Entre no portal com a senha definida ou peça um novo link à academia.';
    case 'TOKEN_EXPIRED':
      return 'Este link expirou. Peça um novo link de acesso para a academia.';
    case 'STUDENT_NOT_FOUND':
      return 'Não encontramos a conta do aluno vinculada a este link.';
    case 'TOKEN_INVALID':
    default:
      return 'Este link é inválido ou não existe.';
  }
}

async function loadInvite(token: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('invite_links')
    .select('id, academy_id, expected_email, recipient_name, expires_at, used_at, completed_at')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as InviteLinkRow | null;
}

async function loadAcademyName(academyId: string): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from('academies')
    .select('trade_name')
    .eq('id', academyId)
    .maybeSingle();

  return (data as { trade_name: string | null } | null)?.trade_name ?? null;
}

async function loadStudentForInvite(invite: InviteLinkRow): Promise<StudentProfileRow | null> {
  if (!invite.expected_email) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const normalizedEmail = invite.expected_email.trim().toLowerCase();
  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('email', normalizedEmail)
    .eq('user_type', 'student')
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!student) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from('academy_memberships')
    .select('id')
    .eq('profile_id', student.id)
    .eq('academy_id', invite.academy_id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!membership) {
    return null;
  }

  return student as StudentProfileRow;
}

async function resolveStudentAccessToken(token: string): Promise<ResolvedStudentAccessToken> {
  const invite = await loadInvite(token);

  if (!invite) {
    return { error: 'TOKEN_INVALID', status: 404 as const };
  }

  if (invite.used_at || invite.completed_at) {
    return { error: 'TOKEN_USED', status: 410 as const, invite };
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: 'TOKEN_EXPIRED', status: 410 as const, invite };
  }

  const student = await loadStudentForInvite(invite);
  if (!student) {
    return { error: 'STUDENT_NOT_FOUND', status: 422 as const, invite };
  }

  const academyName = await loadAcademyName(invite.academy_id);

  return {
    invite,
    student,
    academyName,
  };
}

async function ensureStudentAuthLogin(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  studentId: string,
): Promise<{ success: true } | { success: false; errorCode: string }> {
  const { data, error } = await supabase.rpc('ensure_student_auth_login', {
    p_user_id: studentId,
  });

  if (error) {
    return { success: false, errorCode: error.message };
  }

  const result = data as EnsureStudentAuthLoginResult | null;
  if (!result?.success) {
    return { success: false, errorCode: result?.error_code || 'AUTH_LOGIN_REPAIR_FAILED' };
  }

  return { success: true };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const resolved = await resolveStudentAccessToken(token);

    if ('error' in resolved) {
      return jsonError('Não foi possível validar este link.', resolved.status, {
        errorCode: resolved.error,
        email: resolved.invite?.expected_email ?? null,
      });
    }

    return NextResponse.json({
      valid: true,
      academyName: resolved.academyName,
      email: resolved.student.email,
      recipientName: resolved.invite.recipient_name || resolved.student.name,
    });
  } catch (error) {
    console.error('[student/access][GET] Unexpected error:', error);
    return jsonError('Não foi possível validar este link agora.', 500, {
      errorCode: 'ACCESS_VALIDATION_FAILED',
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const passwordError = validatePassword(body.password);

    if (passwordError) {
      return jsonError(passwordError, 400);
    }

    const resolved = await resolveStudentAccessToken(token);

    if ('error' in resolved) {
      return jsonError(getAccessTokenMessage(resolved.error), resolved.status, {
        errorCode: resolved.error,
        email: resolved.invite?.expected_email ?? null,
      });
    }

    const supabase = createAdminSupabaseClient();
    const authLogin = await ensureStudentAuthLogin(supabase, resolved.student.id);
    if (!authLogin.success) {
      console.error('[student/access][POST] Auth repair failed:', {
        studentId: resolved.student.id,
        errorCode: authLogin.errorCode,
      });

      return jsonError('Não foi possível preparar o acesso do aluno agora. Tente novamente ou peça um novo link à academia.', 502, {
        errorCode: 'AUTH_LOGIN_REPAIR_FAILED',
      });
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(resolved.student.id, {
      password: body.password,
      email_confirm: true,
    });

    if (authError) {
      console.error('[student/access][POST] Password update failed:', {
        studentId: resolved.student.id,
        status: authError.status,
        message: authError.message,
      });

      return jsonError('Não foi possível definir a senha agora. Tente novamente ou peça um novo link à academia.', 502, {
        errorCode: 'PASSWORD_UPDATE_FAILED',
      });
    }

    const now = new Date().toISOString();
    const { error: inviteError } = await supabase
      .from('invite_links')
      .update({
        used_at: now,
        completed_at: now,
        claimed_at: now,
        claimed_email: resolved.student.email,
        claimed_by_user_id: resolved.student.id,
      })
      .eq('id', resolved.invite.id);

    if (inviteError) {
      console.error('[student/access][POST] Invite consume failed:', {
        inviteId: resolved.invite.id,
        studentId: resolved.student.id,
        message: inviteError.message,
      });

      return jsonError('A senha foi definida, mas não foi possível finalizar o link de acesso. Tente entrar no portal ou peça um novo link à academia.', 500, {
        errorCode: 'TOKEN_CONSUME_FAILED',
      });
    }

    return NextResponse.json({
      success: true,
      email: resolved.student.email,
      academyName: resolved.academyName,
      recipientName: resolved.invite.recipient_name || resolved.student.name,
    });
  } catch (error) {
    console.error('[student/access][POST] Unexpected error:', error);
    return jsonError('Não foi possível ativar este acesso agora. Tente novamente.', 500, {
      errorCode: 'ACCESS_ACTIVATION_FAILED',
    });
  }
}
