// POST /api/notifications/send-invite
//
// Sends an invite email to a prospective student.
// Called after invite creation in the UI.
//
// Authentication: requires a valid Supabase session (staff).
// Uses admin client for the actual notification log write.

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendInviteEmail } from '@/server/notifications/send-invite-email';

export const runtime = 'nodejs';

interface RequestBody {
  inviteId: string;
  token: string;
  academyId: string;
  academyName: string;
  recipientEmail: string;
  recipientName: string | null;
  expiresAt: string;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.inviteId === 'string' &&
    typeof b.token === 'string' &&
    typeof b.academyId === 'string' &&
    typeof b.academyName === 'string' &&
    typeof b.recipientEmail === 'string' &&
    typeof b.expiresAt === 'string'
  );
}

export async function POST(request: Request) {
  // 1. Verify user is authenticated (staff)
  const userSupabase = await createServerSupabaseClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse body
  let body: RequestBody;
  try {
    const raw = await request.json();
    if (!isValidBody(raw)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    body = raw;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 3. Verify staff belongs to this academy
  const adminSupabase = createAdminSupabaseClient();
  const { data: membership } = await adminSupabase
    .from('academy_memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('academy_id', body.academyId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. Send the invite email
  try {
    const result = await sendInviteEmail(adminSupabase, {
      inviteId: body.inviteId,
      token: body.token,
      academyId: body.academyId,
      academyName: body.academyName,
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      expiresAt: body.expiresAt,
    });

    if (result.skipped) {
      return NextResponse.json({ ok: true, skipped: true, message: 'Invite email already sent' });
    }

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, providerId: result.providerId });
  } catch (err) {
    console.error('[notifications/send-invite] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
