// Email provider abstraction + Resend implementation.
//
// Provides a clean interface for sending transactional emails.
// The Resend implementation is the default — swap by implementing
// the EmailProvider interface.
//
// Environment variables required:
//   RESEND_API_KEY     — Resend API key
//   EMAIL_FROM_ADDRESS — sender address (default: noreply@moveaccess.com.br)
//   EMAIL_FROM_NAME    — sender name (default: MoveAccess)

import { Resend } from 'resend';

// ─── Interface ───────────────────────────────────────────────

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

// ─── Config ──────────────────────────────────────────────────

function getFromAddress(): string {
  return process.env.EMAIL_FROM_ADDRESS || 'noreply@moveaccess.com.br';
}

function getFromName(): string {
  return process.env.EMAIL_FROM_NAME || 'MoveAccess';
}

function getFrom(): string {
  return `${getFromName()} <${getFromAddress()}>`;
}

// ─── Resend implementation ───────────────────────────────────

class ResendEmailProvider implements EmailProvider {
  private client: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY é obrigatória. Configure a variável de ambiente.'
      );
    }
    this.client = new Resend(apiKey);
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: getFrom(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        replyTo: input.replyTo,
        tags: input.tags,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Resend returned an error',
        };
      }

      return {
        success: true,
        providerId: data?.id,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown email send error',
      };
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!_provider) {
    _provider = new ResendEmailProvider();
  }
  return _provider;
}
