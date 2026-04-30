/**
 * Signup Service — Client-side
 *
 * Calls /api/auth/signup to create academy + auth user.
 * The actual sign-in happens through the regular auth flow in the UI.
 */

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
 * Creates the academy account and returns the server-side signup result.
 */
export async function signupAcademy(input: SignupInput): Promise<SignupResult> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    return { success: false, error: data.error || 'Erro ao criar conta' };
  }

  return { success: true };
}
