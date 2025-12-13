// Interface Layer - User Controller
// Controllers recebem requisições, validam, executam use cases e retornam respostas

import { injectable, inject } from 'tsyringe';
import type { ILogger } from '@/server/core/application/ports/logger';
import { GetUserUseCase } from '@/server/core/application/use-cases/get-user';
import { userIdSchema, validateSchema } from '@/server/core/interface/validation/user-schemas';
import { DI_TOKENS } from '@/server/core/interface/di/tokens';

export interface GetUserRequest {
  userId: string;
}

export interface GetUserResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

@injectable()
export class UserController {
  constructor(
    @inject(DI_TOKENS.ILogger) private logger: ILogger,
    @inject(DI_TOKENS.GetUserUseCase) private getUserUseCase: GetUserUseCase
  ) {}

  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    try {
      // Valida entrada
      const validatedInput = validateSchema(userIdSchema, request);

      // Executa use case
      const result = await this.getUserUseCase.execute(validatedInput);

      return {
        success: true,
        data: result.user,
      };
    } catch (error) {
      this.logger.error('Error in UserController.getUser', error as Error, {
        userId: request.userId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
