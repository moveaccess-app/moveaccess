import 'reflect-metadata';
import { NextResponse, NextRequest } from 'next/server';
import { setupDIContainer, createRequestContainer } from '@/server/core/interface/di/container';
import { DI_TOKENS } from '@/server/core/interface/di/tokens';
import { UserController } from '@/server/core/interface/controllers/user-controller';

// Configure DI once at module load
setupDIContainer();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Create request-scoped container and resolve controller
    const requestContainer = createRequestContainer();
    const controller = requestContainer.resolve<UserController>(DI_TOKENS.UserController);

    const result = await controller.getUser({ userId });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
