// API route: Asaas webhook receiver.
//
// Receives POST requests from Asaas containing payment events.
// Validates the webhook token, persists the event, and processes it.
//
// URL format: /api/asaas/webhooks?environment=sandbox|production
//
// Authentication: Asaas sends a custom token in the `asaas-access-token`
// header. This token is configured when creating the webhook on Asaas
// and must match the environment-specific runtime secret.
//
// Important: Always return 200 to Asaas to avoid queue pausing,
// even if processing fails. Failed events are persisted and can
// be reprocessed later.

import { NextResponse } from 'next/server';
import { processWebhookEvent } from '@/server/asaas/process-webhook';
import type { AsaasEnvironment } from '@/server/asaas/types';
import { validateWebhookToken } from '@/server/asaas/webhook-auth';
import { isAsaasWebhookPayloadUnified } from '@/server/asaas/webhook-types';

export const runtime = 'nodejs';

// ─── Environment resolution ─────────────────────────────────────

function resolveEnvironment(request: Request): AsaasEnvironment {
  const url = new URL(request.url);
  const env = url.searchParams.get('environment');

  if (env === 'production') return 'production';
  return 'sandbox'; // default to sandbox for safety
}

// ─── POST handler ────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Resolve environment first (needed for token lookup)
  const environment = resolveEnvironment(request);

  // 2. Validate token
  if (!validateWebhookToken(request, environment)) {
    // Return 401 for invalid/missing token — Asaas will retry
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // 3. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // Malformed JSON — return 400
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 },
    );
  }

  // 4. Validate payload structure
  if (!isAsaasWebhookPayloadUnified(body)) {
    // Return 200 to avoid Asaas retrying a fundamentally broken payload
    console.warn('[webhook] Payload inválido recebido:', JSON.stringify(body).substring(0, 500));
    return NextResponse.json({ received: true, processed: false });
  }

  // 5. Process event
  try {
    const result = await processWebhookEvent(body, environment);

    // Always return 200 — Asaas expects quick 200 to avoid queue pausing
    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      status: result.status,
    });
  } catch (err) {
    // Even on unexpected errors, try to return 200
    // The event should have been persisted in the try/catch inside processWebhookEvent
    console.error('[webhook] Erro inesperado:', err instanceof Error ? err.message : err);

    return NextResponse.json({
      received: true,
      processed: false,
      error: 'Internal processing error',
    });
  }
}
