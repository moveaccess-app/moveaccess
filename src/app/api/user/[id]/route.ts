import 'reflect-metadata';
import { NextResponse } from 'next/server';
import { setupDIContainer } from '@/server/core/interface/di/container';
import { container } from 'tsyringe';
import { DI_TOKENS } from '@/server/core/interface/di/tokens';
import { UserController } from '@/server/core/interface/controllers/user-controller';

// Configure DI once at module load
setupDIContainer();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Resolve controller from DI
    const controller = container.resolve<UserController>(DI_TOKENS.UserController);

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
