import 'reflect-metadata';
import { NextResponse } from 'next/server';
import { setupDIContainer, createRequestContainer } from '@/server/core/interface/di/container';
import { DI_TOKENS } from '@/server/core/interface/di/tokens';
import { UserController } from '@/server/core/interface/controllers/user-controller';

// Configura DI uma vez no carregamento do módulo
setupDIContainer();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Cria container com escopo de requisição e resolve o controller
    const requestContainer = createRequestContainer();
    const controller = requestContainer.resolve<UserController>(DI_TOKENS.UserController);

    const result = await controller.getUser({ userId });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
