// Camada de Aplicação - Exemplo de Use Case
// Use cases orquestram a lógica de negócio e coordenam entre ports

import { injectable, inject } from 'tsyringe';
import type { ILogger } from '@/server/core/application/ports/logger';
import type { ICache } from '@/server/core/application/ports/cache';
import { User } from '@/server/core/domain/entities/User';
import { DI_TOKENS } from '@/server/core/interface/di/tokens';

export interface GetUserInput {
  userId: string;
}

export interface GetUserOutput {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

@injectable()
export class GetUserUseCase {
  constructor(
    @inject(DI_TOKENS.ILogger) private logger: ILogger,
    @inject(DI_TOKENS.ICache) private cache: ICache
  ) {}

  async execute(input: GetUserInput): Promise<GetUserOutput> {
    this.logger.info('GetUserUseCase iniciado', { userId: input.userId });

    // Validação de entrada
    if (!input.userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    // Tenta buscar do cache
    const cacheKey = `user:${input.userId}`;
    const cachedUser = await this.cache.get<GetUserOutput['user']>(cacheKey);

    if (cachedUser) {
      this.logger.debug('Usuário encontrado no cache', { userId: input.userId });
      return { user: cachedUser };
    }

    // Aqui você buscaria de um repositório/gateway
    // Por enquanto, exemplo mockado
    const user = User.create({
      id: input.userId,
      name: 'Usuário Exemplo',
      email: 'usuario@exemplo.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Salva no cache
    await this.cache.set(cacheKey, user.toJSON(), 3600); // 1 hora

    this.logger.info('GetUserUseCase finalizado', { userId: input.userId });

    return { user: user.toJSON() };
  }
}
