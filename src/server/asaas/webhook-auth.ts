import type { AsaasEnvironment } from './types';

export function resolveWebhookToken(environment: AsaasEnvironment): string | undefined {
  if (environment === 'sandbox') {
    return process.env.ASAAS_WEBHOOK_TOKEN_SANDBOX;
  }

  return process.env.ASAAS_WEBHOOK_TOKEN_PRODUCTION;
}

export function validateWebhookToken(request: Request, environment: AsaasEnvironment): boolean {
  const receivedToken = request.headers.get('asaas-access-token');
  const expectedToken = resolveWebhookToken(environment);

  if (!expectedToken) {
    console.error(`[webhook] Token do webhook não configurado para ambiente ${environment}.`);
    return false;
  }

  if (!receivedToken) {
    console.warn('[webhook] Request sem header asaas-access-token.');
    return false;
  }

  if (receivedToken.length !== expectedToken.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < receivedToken.length; index += 1) {
    mismatch |= receivedToken.charCodeAt(index) ^ expectedToken.charCodeAt(index);
  }

  return mismatch === 0;
}
