import { injectable, inject } from 'tsyringe';
import type { ILogger } from '@/server/core/application/ports/logger';
import { DI_TOKENS } from '@/server/core/interface/di/tokens';
import { loginSchema, type LoginInput } from '@/server/core/interface/validation/auth-schemas';

export interface LoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number; // seconds
    user: {
      email: string;
    };
  };
  error?: string;
}

@injectable()
export class AuthController {
  constructor(@inject(DI_TOKENS.ILogger) private logger: ILogger) {}

  async login(input: LoginInput): Promise<LoginResponse> {
    try {
      const { email, password } = loginSchema.parse(input);

      // Aqui você faria a autenticação real (DB/serviço externo)
      // Mock simples: aceita qualquer senha com 8+ chars
      if (password.length < 8) {
        throw new Error('Invalid credentials');
      }

      const accessToken = `mock-token-${Buffer.from(email).toString('hex')}`;

      this.logger.info('User logged in', { email });

      return {
        success: true,
        data: {
          accessToken,
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: { email },
        },
      };
    } catch (error) {
      this.logger.warn('Login failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
