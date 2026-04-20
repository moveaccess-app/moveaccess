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

export async function requireStaffForAcademy(academyId: string): Promise<AuthorizedStaff> {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthorizationError('Usuário não autenticado.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('academy_memberships')
    .select('profile_id')
    .eq('profile_id', user.id)
    .eq('academy_id', academyId)
    .maybeSingle();

  if (membershipError) {
    throw new AuthorizationError(`Erro ao verificar permissão: ${membershipError.message}`);
  }

  if (!membership) {
    throw new AuthorizationError('Usuário não pertence a esta academia.');
  }

  // Confirm user_type is staff
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.user_type !== 'staff') {
    throw new AuthorizationError('Apenas staff pode executar esta operação.');
  }

  return { userId: user.id, academyId };
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
