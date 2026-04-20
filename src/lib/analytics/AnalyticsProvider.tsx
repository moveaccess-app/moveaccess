'use client';

/**
 * PostHog Provider — initializes PostHog on client side
 *
 * Wraps the app and handles:
 * - PostHog init with project key
 * - Automatic pageview tracking
 * - User identification on auth state change
 */

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useAuth } from '@/contexts/AuthContext';
import { identify, resetAnalytics } from './events';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Initialize PostHog once
  useEffect(() => {
    if (!POSTHOG_KEY || typeof window === 'undefined') return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      autocapture: false,        // We track explicitly
      disable_session_recording: true, // Enable later if needed
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          ph.debug(false);
        }
      },
    });
  }, []);

  return <AnalyticsIdentifier>{children}</AnalyticsIdentifier>;
}

/**
 * Separate component to react to auth changes and identify/reset user
 */
function AnalyticsIdentifier({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (isAuthenticated && currentUser) {
      identify(currentUser.profile.id, {
        user_type: currentUser.profile.userType,
        academy_id: currentUser.tenancy.academyIds[0] ?? '',
        role: currentUser.authorization.role ?? '',
        name: currentUser.profile.name,
      });
    } else if (!isAuthenticated) {
      resetAnalytics();
    }
  }, [isAuthenticated, currentUser]);

  return <>{children}</>;
}
