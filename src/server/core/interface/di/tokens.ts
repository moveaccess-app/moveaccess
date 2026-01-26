// Camada de Interface - Tokens de Injeção de Dependência
// Define símbolos únicos para injeção de dependências com tsyringe

export const DI_TOKENS = {
  // Ports (Interfaces)
  ILogger: Symbol.for('ILogger'),
  ICache: Symbol.for('ICache'),
  IHttpClient: Symbol.for('IHttpClient'),

  // Use Cases
  GetUserUseCase: Symbol.for('GetUserUseCase'),

  // Controllers
  UserController: Symbol.for('UserController'),
  AuthController: Symbol.for('AuthController'),
} as const;

export type DIToken = typeof DI_TOKENS[keyof typeof DI_TOKENS];
