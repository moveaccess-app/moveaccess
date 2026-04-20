/**
 * Academy Scope Resolution
 *
 * Centralizes how the "active academy" is resolved for the current user.
 *
 * CURRENT LIMITATION (known):
 *   Users with multiple academy_memberships will always resolve to
 *   academy_ids[0] — typically the first/primary academy.
 *   This is safe for the current product (one academy per staff user)
 *   but must be revisited when multi-academy switching is implemented.
 *
 * WHY this exists:
 *   Before this helper, every service (payments, settings, subscriptions)
 *   duplicated the same my_profile → academy_ids[0] resolution.
 *   This unification ensures consistent behavior and a single place
 *   to evolve when a proper academy selector is added.
 *
 * SECURITY:
 *   Even though this resolves to academy_ids[0], all writes go through
 *   RLS policies that verify auth.uid() has membership in the target
 *   academy, so there's no risk of writing to an academy the user
 *   doesn't belong to.
 */

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getStorageKey(): string {
  const projectRef = API_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  return `sb-${projectRef}-auth-token`;
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(getStorageKey());
  if (!stored) return null;

  try {
    const session = JSON.parse(stored);
    return session.access_token || null;
  } catch {
    return null;
  }
}

interface MyProfileRow {
  academy_ids?: string[] | null;
}

/**
 * Resolves the active academy_id for the current authenticated user.
 *
 * Returns the first academy_id from my_profile.academy_ids.
 * Returns null if the user is not authenticated or has no academy.
 */
export async function getActiveAcademyId(): Promise<string | null> {
  const token = getAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/rest/v1/my_profile?select=academy_ids`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;

    const data: MyProfileRow[] = await response.json();
    return data?.[0]?.academy_ids?.[0] ?? null;
  } catch {
    return null;
  }
}
