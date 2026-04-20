// API route: Test Asaas connection.
//
// Receives an API key and environment, attempts a lightweight call
// to the Asaas API (GET /v3/myAccount), and returns success/failure.
//
// This is server-side only — the API key never reaches the client.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ASAAS_BASE_URLS, type AsaasEnvironment } from '@/server/asaas/types';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  apiKey: z.string().min(10, 'API Key inválida'),
  environment: z.enum(['sandbox', 'production']),
});

interface AsaasMyAccountResponse {
  object?: string;
  id?: string;
  name?: string;
  email?: string;
  tradingName?: string;
  cpfCnpj?: string;
  commercialInfoExpiration?: string;
  walletId?: string;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'JSON inválido' },
      { status: 400 },
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos' },
      { status: 400 },
    );
  }

  const { apiKey, environment } = parsed.data;
  const baseUrl = ASAAS_BASE_URLS[environment as AsaasEnvironment];

  try {
    const response = await fetch(`${baseUrl}/v3/myAccount`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          success: false,
          error: 'Token inválido ou sem permissão. Verifique sua API Key.',
        });
      }

      return NextResponse.json({
        success: false,
        error: `Erro ao comunicar com Asaas (HTTP ${response.status})`,
      });
    }

    const data = (await response.json()) as AsaasMyAccountResponse;

    return NextResponse.json({
      success: true,
      account: {
        id: data.id || null,
        name: data.name || data.tradingName || null,
        email: data.email || null,
        walletId: data.walletId || null,
        cpfCnpj: data.cpfCnpj || null,
      },
      environment,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error
        ? `Falha na conexão: ${error.message}`
        : 'Erro desconhecido ao testar conexão',
    });
  }
}
