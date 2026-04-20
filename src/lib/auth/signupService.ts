/**
 * Signup Service — Client-side
 *
 * Calls /api/auth/signup to create academy + auth user,
 * then auto-signs in via Supabase token endpoint.
 */

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getStorageKey(): string {
  const projectRef = API_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  return `sb-${projectRef}-auth-token`;
}

export interface SignupInput {
  ownerName: string;
  academyName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface SignupResult {
  success: boolean;
  error?: string;
}

/**
 * Creates academy account and auto-signs in.
 */
export async function signupAcademy(input: SignupInput): Promise<SignupResult> {
  // 1. Call server-side signup API
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    return { success: false, error: data.error || 'Erro ao criar conta' };
  }

  // 2. Auto-login via Supabase token endpoint
  const signInUrl = `${API_URL}/auth/v1/token?grant_type=password`;
  const signInResponse = await fetch(signInUrl, {
    method: 'POST',
    headers: {
      apikey: API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });

  const signInData = await signInResponse.json();

  if (signInData.error || !signInData.access_token) {
    return {
      success: false,
      error: 'Conta criada, mas erro ao fazer login automático. Faça login manualmente.',
    };
  }

  // 3. Persist session to localStorage (same pattern as authServiceSupabase)
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      getStorageKey(),
      JSON.stringify({
        access_token: signInData.access_token,
        refresh_token: signInData.refresh_token,
        expires_at: signInData.expires_at,
        user: signInData.user,
      })
    );
  }

  return { success: true };
}
