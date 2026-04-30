// Server-side authorization helpers for Asaas integration routes.
//
// Validates that the current user is an authenticated staff member
// of the given academy. Does NOT rely solely on RLS — this is an
// explicit check at the boundary before triggering external mutations.

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AuthorizedStaff {
  userId: string;
  academyId: string;
}

async function requireAuthenticatedStaffUser() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthorizationError('Usuário não autenticado.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.user_type !== 'staff') {
    throw new AuthorizationError('Apenas staff pode executar esta operação.');
  }

  return { supabase, userId: user.id };
}

export async function requireStaffSession(): Promise<AuthorizedStaff> {
  const { supabase, userId } = await requireAuthenticatedStaffUser();

  const { data: memberships, error: membershipError } = await supabase
    .from('academy_memberships')
    .select('academy_id, is_primary, created_at')
    .eq('profile_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1);

  if (membershipError) {
    throw new AuthorizationError(`Erro ao verificar academia do staff: ${membershipError.message}`);
  }

  const academyId = memberships?.[0]?.academy_id;

  if (!academyId) {
    throw new AuthorizationError('Staff autenticado sem academia vinculada.');
  }

  return { userId, academyId };
}

export async function requireStaffForAcademy(academyId: string): Promise<AuthorizedStaff> {
  const { supabase, userId } = await requireAuthenticatedStaffUser();

  const { data: membership, error: membershipError } = await supabase
    .from('academy_memberships')
    .select('profile_id')
    .eq('profile_id', userId)
    .eq('academy_id', academyId)
    .maybeSingle();

  if (membershipError) {
    throw new AuthorizationError(`Erro ao verificar permissão: ${membershipError.message}`);
  }

  if (!membership) {
    throw new AuthorizationError('Usuário não pertence a esta academia.');
  }

  return { userId, academyId };
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
