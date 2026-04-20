import { createClient } from './client';
import type { Tables } from './types';

export type MyProfile = Tables<'my_profile'>;
export type StaffWithRole = Tables<'staff_with_role'>;
export type StudentWithStatus = Tables<'students_with_status'>;

// ============================================
// AUTH FUNCTIONS
// ============================================

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: MyProfile;
}

/**
 * Login para staff (equipe)
 */
export async function loginStaff(
  email: string,
  password: string
): Promise<LoginResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Buscar perfil completo
  const { data: profile, error: profileError } = await supabase
    .from('my_profile')
    .select('*')
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Perfil não encontrado' };
  }

  // Verificar se é staff
  if (profile.user_type !== 'staff') {
    await supabase.auth.signOut();
    return { success: false, error: 'Acesso negado. Use o login de aluno.' };
  }

  // Verificar status
  if (profile.staff_status !== 'active') {
    await supabase.auth.signOut();
    return { success: false, error: 'Conta inativa ou pendente de aprovação.' };
  }

  // Atualizar last_login
  await supabase
    .from('staff_profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.user.id);

  return { success: true, user: profile };
}

/**
 * Login para alunos
 */
export async function loginStudent(
  identifier: string, // email, phone ou cpf
  password: string
): Promise<LoginResult> {
  const supabase = createClient();

  // Determinar se é email ou telefone
  const isEmail = identifier.includes('@');
  
  const { error } = await supabase.auth.signInWithPassword({
    email: isEmail ? identifier : undefined,
    phone: !isEmail ? identifier : undefined,
    password,
  } as { email: string; password: string });

  if (error) {
    return { success: false, error: error.message };
  }

  // Buscar perfil completo
  const { data: profile, error: profileError } = await supabase
    .from('my_profile')
    .select('*')
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Perfil não encontrado' };
  }

  // Verificar se é student
  if (profile.user_type !== 'student') {
    await supabase.auth.signOut();
    return { success: false, error: 'Acesso negado. Use o login da equipe.' };
  }

  // Verificar status
  if (profile.student_status === 'blocked') {
    await supabase.auth.signOut();
    return { success: false, error: 'Conta bloqueada. Entre em contato com a academia.' };
  }

  return { success: true, user: profile };
}

/**
 * Obtém sessão atual
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Obtém usuário atual com perfil completo
 */
export async function getCurrentUser(): Promise<MyProfile | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('my_profile')
    .select('*')
    .single();

  return profile;
}

/**
 * Logout
 */
export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

// ============================================
// INVITE FUNCTIONS
// ============================================

export interface InviteData {
  id: string;
  academy_id: string;
  unit_id: string | null;
  invite_type: 'staff' | 'student';
  staff_role: string | null;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    appliesTo: 'first_month' | 'enrollment' | 'all';
  } | null;
}

/**
 * Valida um token de convite
 */
export async function validateInvite(token: string): Promise<InviteData | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('validate_invite_token', {
    p_token: token,
  });

  const payload = Array.isArray(data) ? data[0] : null;

  if (error || !payload || !payload.is_valid) return null;

  return {
    id: payload.invite_id,
    academy_id: payload.academy_id,
    unit_id: payload.unit_id ?? null,
    invite_type: 'student',
    staff_role: null,
    discount: null,
  };
}

/**
 * Aceita um convite e cria a conta
 */
export async function acceptInvite(
  token: string,
  userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    cpf?: string;
  }
): Promise<LoginResult> {
  const supabase = createClient();

  // Validar convite
  const invite = await validateInvite(token);
  if (!invite) {
    return { success: false, error: 'Convite inválido ou expirado' };
  }

  // Criar usuário
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        user_type: invite.invite_type,
        name: userData.name,
      },
    },
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Erro ao criar conta' };
  }

  const userId = authData.user.id;

  // Atualizar profile com dados adicionais
  if (userData.phone || userData.cpf) {
    await supabase
      .from('profiles')
      .update({
        phone: userData.phone,
        cpf: userData.cpf,
      })
      .eq('id', userId);
  }

  // Criar membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('academy_memberships') as any).insert({
    profile_id: userId,
    academy_id: invite.academy_id,
    is_primary: true,
  });

  // Criar perfil específico
  if (invite.invite_type === 'staff') {
    await supabase.from('staff_profiles').insert({
      id: userId,
      role: (invite.staff_role as 'admin' | 'manager' | 'receptionist' | 'financial' | 'readonly') || 'receptionist',
      status: 'active',
    });
  } else {
    await supabase.from('student_profiles').insert({
      id: userId,
      status: 'pending',
    });
  }

  // Marcar convite como aceito
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('invites') as any)
    .update({
      status: 'accepted',
      used_count: 1,
    })
    .eq('token', token);

  // Buscar perfil completo
  const profile = await getCurrentUser();
  return { success: true, user: profile || undefined };
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

/**
 * Atualiza perfil do usuário
 */
export async function updateProfile(data: {
  name?: string;
  phone?: string;
  avatar_url?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id);

  if (error) throw error;
}

// ============================================
// ACADEMY FUNCTIONS  
// ============================================

/**
 * Obtém academias do usuário
 */
export async function getMyAcademies(): Promise<Tables<'academies'>[]> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('academies')
    .select('*');

  return data || [];
}

/**
 * Obtém unidades de uma academia
 */
export async function getUnits(academyId?: string): Promise<Tables<'units'>[]> {
  const supabase = createClient();
  
  let query = supabase.from('units').select('*');
  
  if (academyId) {
    query = query.eq('academy_id', academyId);
  }

  const { data } = await query;
  return data || [];
}

// ============================================
// STAFF FUNCTIONS
// ============================================

/**
 * Lista staff da academia
 */
export async function getStaffList(): Promise<StaffWithRole[]> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('staff_with_role')
    .select('*');

  return data || [];
}

// ============================================
// STUDENT FUNCTIONS
// ============================================

/**
 * Lista alunos da academia
 */
export async function getStudentList(): Promise<StudentWithStatus[]> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('students_with_status')
    .select('*');

  return data || [];
}

/**
 * Busca aluno por ID
 */
export async function getStudent(id: string): Promise<StudentWithStatus | null> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('students_with_status')
    .select('*')
    .eq('id', id)
    .single();

  return data;
}
