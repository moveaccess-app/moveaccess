/**
 * PostHog Analytics — Event definitions & capture helper
 *
 * Single source of truth for every tracked event.
 * Usage: capture('cta_clicked', { location: 'hero' })
 */

import posthog from 'posthog-js';

// ============================================================================
// EVENT MAP — all tracked events and their expected properties
// ============================================================================

export interface EventMap {
  // Landing
  landing_viewed: { path: string; referrer: string; device_type: 'mobile' | 'tablet' | 'desktop' };
  cta_clicked: { location: 'hero' | 'navbar' | 'final'; button_text: string };

  // Signup
  signup_viewed: { referrer: string; device_type: 'mobile' | 'tablet' | 'desktop' };
  signup_started: { source: string };
  signup_success: { academy_name: string; source: string };
  signup_failed: { error: string; source: string };

  // Setup Wizard
  setup_started: Record<string, never>;
  setup_step_completed: { step_number: number; step_name: string };
  setup_step_skipped: { step_number: number; step_name: string };
  setup_completed: { total_steps: number };

  // Product activation
  asaas_connected: { environment: string };
  first_plan_created: Record<string, never>;
  first_student_created: Record<string, never>;

  // Auth
  login_success: { user_type: 'staff' | 'student' };
  login_failed: { user_type: 'staff' | 'student'; error: string };

  // Optional
  student_invited: Record<string, never>;
  contract_published: Record<string, never>;

  // Home
  home_viewed: { academy_mature: boolean };
}

// ============================================================================
// CAPTURE — typed, safe, no-op when PostHog unavailable
// ============================================================================

export function capture<E extends keyof EventMap>(
  event: E,
  properties: EventMap[E],
): void {
  try {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture(event, properties);
    }
  } catch {
    // Silent — analytics should never break the app
  }
}

// ============================================================================
// IDENTIFY — call after login / signup
// ============================================================================

export function identify(
  userId: string,
  traits?: Record<string, string | number | boolean | null>,
): void {
  try {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.identify(userId, traits);
    }
  } catch {
    // Silent
  }
}

// ============================================================================
// RESET — call on logout
// ============================================================================

export function resetAnalytics(): void {
  try {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.reset();
    }
  } catch {
    // Silent
  }
}

// ============================================================================
// DEVICE HELPER
// ============================================================================

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}
