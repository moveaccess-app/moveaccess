// POST /api/notifications/dispatch
//
// Cron-invoked endpoint that dispatches all pending scheduled
// notifications (due reminders, overdue notices, pre-block warnings).
//
// Authentication: CRON_SECRET header must match the environment variable.
// This prevents unauthorized invocation.
//
// Safe to call multiple times — all sends are idempotent.

import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { dispatchScheduledNotifications } from '@/server/notifications/dispatch-scheduled';

export const runtime = 'nodejs';
export const maxDuration = 60; // allow up to 60s for batch processing

export async function POST(request: Request) {
  // 1. Validate cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (providedSecret !== cronSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // 2. Run dispatch
  try {
    const supabase = createAdminSupabaseClient();
    const summary = await dispatchScheduledNotifications(supabase);

    return NextResponse.json({
      ok: true,
      summary: {
        dueReminders: summary.dueReminders,
        overdueNotices: summary.overdueNotices,
        preBlockWarnings: summary.preBlockWarnings,
        automations: summary.automations
          ? {
              escalations: summary.automations.escalations,
              subscriptionExpiring: summary.automations.subscriptionExpiring,
              reactivations: summary.automations.reactivations,
              regularizations: summary.automations.regularizations,
            }
          : null,
        errorCount: summary.errors.length,
      },
      // Only include errors in non-production for debugging
      ...(process.env.NODE_ENV !== 'production' && summary.errors.length > 0
        ? { errors: summary.errors }
        : {}),
    });
  } catch (err) {
    console.error('[notifications/dispatch] Fatal error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
