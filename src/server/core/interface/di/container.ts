// Interface Layer - DI Container Configuration
// Configura o container de injeção de dependências (tsyringe)

import 'reflect-metadata';
import { container } from 'tsyringe';
import { DI_TOKENS } from './tokens';

// Implementations
import { LoggerImpl } from '@/server/core/infra/logging/logger-impl';
import { InMemoryCacheImpl } from '@/server/core/infra/cache/in-memory-cache-impl';
import { FetchHttpClient } from '@/server/core/infra/http/fetch-http-client';

// Use Cases
import { GetUserUseCase } from '@/server/core/application/use-cases/get-user';
// Controllers
import { UserController } from '@/server/core/interface/controllers/user-controller';
import { AuthController } from '@/server/core/interface/controllers/auth-controller';

/**
 * Configura o container global de DI
 * Deve ser chamado uma vez no início da aplicação
 */
export function setupDIContainer(): void {
  // Register Infrastructure implementations
  container.register(DI_TOKENS.ILogger, { useClass: LoggerImpl });
  container.register(DI_TOKENS.ICache, { useClass: InMemoryCacheImpl });
  container.register(DI_TOKENS.IHttpClient, { useClass: FetchHttpClient });

  // Register Use Cases
  container.register(DI_TOKENS.GetUserUseCase, { useClass: GetUserUseCase });

  // Register Controllers
  container.register(DI_TOKENS.UserController, { useClass: UserController });
  container.register(DI_TOKENS.AuthController, { useClass: AuthController });
}

/**
 * Cria um container request-scoped para isolar dependências entre requisições
 * Use isso em API routes para garantir isolamento
 */
export function createRequestContainer() {
  return container.createChildContainer();
}

/**
 * Resolve uma dependência do container
 */
export function resolve<T>(token: symbol): T {
  return container.resolve<T>(token);
}

/**
 * Container global (use com cuidado)
 */
export { container };
