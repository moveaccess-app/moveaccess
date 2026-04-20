import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError } from '@/server/asaas/auth';
import {
  reprocessWebhookEvent,
  WebhookEventNotFoundError,
  WebhookEventNotReprocessableError,
} from '@/server/asaas/reprocess-webhook-event';

export const runtime = 'nodejs';

const reprocessWebhookSchema = z.object({
  eventId: z.string().min(1, 'eventId é obrigatório'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reprocessWebhookSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );

      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    const result = await reprocessWebhookEvent(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof WebhookEventNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WebhookEventNotReprocessableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
