import 'reflect-metadata';
import { NextResponse } from 'next/server';
import { setupDIContainer, createRequestContainer } from '@/server/core/interface/di/container';
import { DI_TOKENS } from '@/server/core/interface/di/tokens';
import { AuthController } from '@/server/core/interface/controllers/auth-controller';

setupDIContainer();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Container com escopo de requisição
    const requestContainer = createRequestContainer();
    const controller = requestContainer.resolve<AuthController>(DI_TOKENS.AuthController);

    const result = await controller.login(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
