# Guia de Implementação: Clean Architecture com Next.js e Dependency Injection

**Data:** 17 de novembro de 2025  
**Projeto:** WaaS Experience  
**Padrão:** Clean Architecture + DI (tsyringe)

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura de Pastas](#2-estrutura-de-pastas)
3. [Configuração Inicial](#3-configuração-inicial)
4. [Camadas da Aplicação](#4-camadas-da-aplicação)
5. [Fluxo de Requisição Completo](#5-fluxo-de-requisição-completo)
6. [Implementação Passo a Passo](#6-implementação-passo-a-passo)
7. [Boas Práticas e Patterns](#7-boas-práticas-e-patterns)
8. [Checklist de Implementação](#8-checklist-de-implementação)

---

## 1. Visão Geral da Arquitetura

### 1.1 Princípios

- **Clean Architecture** (Uncle Bob)
- **SOLID** principles
- **Dependency Injection** via tsyringe
- **Multi-tenancy** (tenant isolation)
- **Security-first** (CORS, CSP, HSTS)

### 1.2 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONT-END (Next.js Server/Client Components)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Request
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  API ROUTE (/app/api/waas/balance/route.ts)                    │
│  • Extrai parâmetros (tenantId, customerId)                    │
│  • Cria container DI request-scoped                             │
│  • Resolve controller                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  INTERFACE LAYER                                                │
│  Controller (balance-controller.ts)                             │
│  • Valida entrada (Zod schemas)                                 │
│  • Executa use case                                             │
│  • Aplica security headers                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER                                              │
│  Use Case (get-balance.ts)                                      │
│  • Orquestra lógica de negócio                                  │
│  • Usa ports (abstrações)                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER                                           │
│  Gateway (waas-http.ts)                                         │
│  • Busca token (TokenProvider)                                  │
│  • Consulta cache                                               │
│  • Faz requisição HTTP externa                                  │
│  • Salva resultado em cache                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP + Bearer token
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  EXTERNAL API (WaaS / Terceiros)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Pastas

```
src/
├─ app/
│  └─ api/
│     └─ waas/
│        └─ balance/
│           └─ route.ts                    # API Route (Next.js 13+)
│
├─ server/
│  └─ waas/
│     ├─ security/
│     │  └─ headers.ts                     # CORS, CSP, tenant resolution
│     │
│     └─ core/
│        ├─ domain/                        # Entidades e Value Objects
│        │  ├─ entities/
│        │  │  ├─ Customer.ts
│        │  │  ├─ Portfolio.ts
│        │  │  └─ Product.ts
│        │  └─ value-objects/
│        │     ├─ Money.ts
│        │     └─ Percent.ts
│        │
│        ├─ application/                   # Use Cases e Ports
│        │  ├─ ports/                      # Interfaces (abstrações)
│        │  │  ├─ waas-gateway.ts
│        │  │  ├─ token-provider.ts
│        │  │  ├─ cache.ts
│        │  │  └─ logger.ts
│        │  └─ use-cases/
│        │     ├─ get-balance.ts
│        │     ├─ list-products.ts
│        │     └─ create-intent.ts
│        │
│        ├─ interface/                     # Controllers e DI
│        │  ├─ controllers/
│        │  │  ├─ balance-controller.ts
│        │  │  └─ products-controller.ts
│        │  ├─ validation/
│        │  │  ├─ balance-schemas.ts       # Zod schemas
│        │  │  └─ tenant-schema.ts
│        │  └─ di/
│        │     ├─ container.ts             # Configuração DI
│        │     └─ tokens.ts                # Símbolos de injeção
│        │
│        └─ infra/                         # Implementações concretas
│           ├─ auth/
│           │  └─ token-provider-impl.ts   # OAuth client_credentials
│           ├─ cache/
│           │  └─ cache-impl.ts            # Redis / in-memory
│           ├─ gateways/
│           │  ├─ waas-http.ts             # HTTP real
│           │  └─ waas-mock.ts             # Mock para testes
│           └─ logging/
│              └─ logger-impl.ts           # Winston / Pino
│
└─ lib/
   └─ security/
      └─ headers.ts                        # Helpers de segurança

.env.local                                 # Secrets (server-side only)
```

---

## 3. Configuração Inicial

### 3.1 Dependências

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "tsyringe": "^4.8.0",
    "reflect-metadata": "^0.2.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Instalação:**
```bash
pnpm add tsyringe reflect-metadata zod
pnpm add -D @types/node typescript
```

### 3.2 TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["reflect-metadata"],
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3.3 Variáveis de Ambiente

```bash
# .env.local (NUNCA commitar)

# OAuth WaaS
WAAS_CLIENT_ID=your_client_id_here
WAAS_CLIENT_SECRET=your_client_secret_here
WAAS_AUTH_URL=https://auth.waas.com/oauth/token
WAAS_API_URL=https://api.waas.com

# Environment
USE_REAL_WAAS_API=false  # true em produção

# Cache (opcional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

---

## 4. Camadas da Aplicação

### 4.1 Domain Layer (Entidades e Value Objects)

**Características:**
- Zero dependências externas
- Regras de negócio puras
- Imutáveis (quando possível)

**Exemplo: Value Object Money**

```typescript
// src/server/waas/core/domain/value-objects/Money.ts

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }
  }

  static create(amount: number, currency: string = 'BRL'): Money {
    return new Money(amount, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }
}
```

**Exemplo: Entity Customer**

```typescript
// src/server/waas/core/domain/entities/Customer.ts

export interface CustomerProps {
  id: string;
  name: string;
  email: string;
  tenantId: string;
}

export class Customer {
  private constructor(private props: CustomerProps) {}

  static create(props: CustomerProps): Customer {
    // Validações de negócio
    if (!props.id || !props.name || !props.email) {
      throw new Error('Customer requires id, name and email');
    }
    return new Customer(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
}
```

---

### 4.2 Application Layer (Use Cases e Ports)

#### 4.2.1 Ports (Interfaces)

**Port: WaaS Gateway**

```typescript
// src/server/waas/core/application/ports/waas-gateway.ts

export interface GetBalanceInput {
  tenantId: string;
  customerId: string;
}

export interface GetBalanceOutput {
  totalBalance: number;
  customerId: string;
}

export interface IWaasGateway {
  getBalance(input: GetBalanceInput): Promise<GetBalanceOutput>;
  listProducts(input: ListProductsInput): Promise<ListProductsOutput>;
  createIntent(input: CreateIntentInput): Promise<CreateIntentOutput>;
}
```

**Port: Token Provider**

```typescript
// src/server/waas/core/application/ports/token-provider.ts

export interface ITokenProvider {
  /**
   * Obtém token OAuth para um tenant
   * - Busca em cache se disponível
   * - Faz OAuth se necessário
   */
  getToken(tenantId: string): Promise<string>;
  
  /**
   * Invalida token em cache
   */
  invalidateToken(tenantId: string): Promise<void>;
}
```

**Port: Cache**

```typescript
// src/server/waas/core/application/ports/cache.ts

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

#### 4.2.2 Use Case

```typescript
// src/server/waas/core/application/use-cases/get-balance.ts

import { injectable, inject } from 'tsyringe';
import type {
  IWaasGateway,
  GetBalanceInput,
  GetBalanceOutput,
} from '@/server/waas/core/application/ports/waas-gateway';
import { IWAAS_GATEWAY_TOKEN } from '@/server/waas/core/interface/di/tokens';

export interface GetBalanceUseCaseInput {
  tenantId: string;
  customerId: string;
}

export type GetBalanceUseCaseOutput = GetBalanceOutput;

@injectable()
export class GetBalanceUseCase {
  constructor(
    @inject(IWAAS_GATEWAY_TOKEN) private waasGateway: IWaasGateway
  ) {}

  async execute(input: GetBalanceUseCaseInput): Promise<GetBalanceUseCaseOutput> {
    // Validação de negócio (se houver)
    if (!input.customerId) {
      throw new Error('CustomerId is required');
    }

    // Chama gateway (abstração)
    const result = await this.waasGateway.getBalance({
      tenantId: input.tenantId,
      customerId: input.customerId,
    });

    return result;
  }
}
```

---

### 4.3 Interface Layer (Controllers e DI)

#### 4.3.1 Validation Schemas (Zod)

```typescript
// src/server/waas/core/interface/validation/balance-schemas.ts

import { z } from 'zod';

export const balanceParamsSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
});

export type BalanceParams = z.infer<typeof balanceParamsSchema>;
```

#### 4.3.2 Controller

```typescript
// src/server/waas/core/interface/controllers/balance-controller.ts

import { injectable, inject } from 'tsyringe';
import { NextRequest, NextResponse } from 'next/server';
import { GetBalanceUseCase } from '@/server/waas/core/application/use-cases/get-balance';
import { balanceParamsSchema } from '@/server/waas/core/interface/validation/balance-schemas';
import {
  createSecureResponse,
  createSecureErrorResponse,
} from '@/lib/security/headers';
import { z } from 'zod';

@injectable()
export class BalanceController {
  constructor(
    @inject(GetBalanceUseCase) private getBalanceUseCase: GetBalanceUseCase
  ) {}

  async getBalance(
    request: NextRequest,
    tenantId: string
  ): Promise<NextResponse> {
    try {
      // 1. Extrair customerId da URL
      const url = new URL(request.url);
      const customerId = url.searchParams.get('customerId');

      // 2. Validar com Zod
      const params = balanceParamsSchema.parse({
        tenantId,
        customerId,
      });

      // 3. Executar use case
      const result = await this.getBalanceUseCase.execute(params);

      // 4. Retornar resposta com headers de segurança
      return createSecureResponse(request, result, 200, tenantId);
    } catch (error) {
      // Tratamento de erro centralizado
      if (error instanceof z.ZodError) {
        return createSecureErrorResponse(
          request,
          'VALIDATION_ERROR',
          error.errors.map(e => e.message).join(', '),
          400,
          undefined,
          tenantId
        );
      }

      return createSecureErrorResponse(
        request,
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        500,
        undefined,
        tenantId
      );
    }
  }
}
```

#### 4.3.3 DI Tokens

```typescript
// src/server/waas/core/interface/di/tokens.ts

// Ports (interfaces)
export const IWAAS_GATEWAY_TOKEN = Symbol('IWaasGateway');
export const ITOKEN_PROVIDER_TOKEN = Symbol('ITokenProvider');
export const ICACHE_TOKEN = Symbol('ICache');
export const ILOGGER_TOKEN = Symbol('ILogger');

// Controllers
export const BALANCE_CONTROLLER_TOKEN = Symbol('BalanceController');
export const PRODUCTS_CONTROLLER_TOKEN = Symbol('ProductsController');
```

#### 4.3.4 DI Container Configuration

```typescript
// src/server/waas/core/interface/di/container.ts

import 'reflect-metadata';
import { container, DependencyContainer, Lifecycle } from 'tsyringe';

// Ports
import type { IWaasGateway } from '@/server/waas/core/application/ports/waas-gateway';
import type { ITokenProvider } from '@/server/waas/core/application/ports/token-provider';
import type { ICache } from '@/server/waas/core/application/ports/cache';

// Implementations
import { WaasHttpGateway } from '@/server/waas/core/infra/gateways/waas-http';
import { WaasMockGateway } from '@/server/waas/core/infra/gateways/waas-mock';
import { TokenProviderImpl } from '@/server/waas/core/infra/auth/token-provider-impl';
import { CacheImpl } from '@/server/waas/core/infra/cache/cache-impl';

// Use Cases
import { GetBalanceUseCase } from '@/server/waas/core/application/use-cases/get-balance';

// Controllers
import { BalanceController } from '@/server/waas/core/interface/controllers/balance-controller';

// Tokens
import {
  IWAAS_GATEWAY_TOKEN,
  ITOKEN_PROVIDER_TOKEN,
  ICACHE_TOKEN,
  BALANCE_CONTROLLER_TOKEN,
} from './tokens';

/**
 * Configuração global do container (singleton)
 * Executada uma vez no bootstrap da aplicação
 */
export function configureContainer() {
  // Infraestrutura (Singleton - mesma instância em todas requisições)
  container.registerSingleton<ITokenProvider>(
    ITOKEN_PROVIDER_TOKEN,
    TokenProviderImpl
  );

  container.registerSingleton<ICache>(
    ICACHE_TOKEN,
    CacheImpl
  );

  // Gateway: usa mock em dev, HTTP em produção
  const useRealApi = process.env.USE_REAL_WAAS_API === 'true';
  
  container.registerSingleton<IWaasGateway>(
    IWAAS_GATEWAY_TOKEN,
    useRealApi ? WaasHttpGateway : WaasMockGateway
  );

  // Use Cases (Request-scoped - nova instância por requisição)
  container.register(
    GetBalanceUseCase,
    { useClass: GetBalanceUseCase },
    { lifecycle: Lifecycle.ContainerScoped }
  );

  // Controllers (Request-scoped)
  container.register(
    BALANCE_CONTROLLER_TOKEN,
    { useClass: BalanceController },
    { lifecycle: Lifecycle.ContainerScoped }
  );
}

/**
 * Cria container request-scoped com valores injetados
 * Chamado em cada API route para isolar requisições
 */
export function createRequestContainer(context: {
  tenantId: string;
  customerId: string;
}): DependencyContainer {
  const childContainer = container.createChildContainer();

  // Registra valores de contexto
  childContainer.register('RequestContext', {
    useValue: context,
  });

  return childContainer;
}

// Bootstrap: executar no início da aplicação
configureContainer();
```

---

### 4.4 Infrastructure Layer (Implementações)

#### 4.4.1 Token Provider Implementation

```typescript
// src/server/waas/core/infra/auth/token-provider-impl.ts

import { injectable } from 'tsyringe';
import type { ITokenProvider } from '@/server/waas/core/application/ports/token-provider';

interface TokenCacheEntry {
  token: string;
  expiresAt: number; // timestamp em ms
}

@injectable()
export class TokenProviderImpl implements ITokenProvider {
  private tokenCache = new Map<string, TokenCacheEntry>();

  async getToken(tenantId: string): Promise<string> {
    // 1. Verifica cache
    const cached = this.tokenCache.get(tenantId);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      console.log(`[TokenProvider] Cache HIT para tenant=${tenantId}`);
      return cached.token;
    }

    console.log(`[TokenProvider] Cache MISS para tenant=${tenantId}, buscando novo token...`);

    // 2. Busca novo token via OAuth
    const token = await this.fetchTokenFromOAuth(tenantId);

    // 3. Salva em cache (expira 5min antes do real para margem de segurança)
    const expiresIn = 3600; // 1 hora (padrão OAuth)
    this.tokenCache.set(tenantId, {
      token,
      expiresAt: now + (expiresIn - 300) * 1000, // -5min
    });

    return token;
  }

  async invalidateToken(tenantId: string): Promise<void> {
    this.tokenCache.delete(tenantId);
  }

  private async fetchTokenFromOAuth(tenantId: string): Promise<string> {
    const authUrl = process.env.WAAS_AUTH_URL!;
    const clientId = process.env.WAAS_CLIENT_ID!;
    const clientSecret = process.env.WAAS_CLIENT_SECRET!;

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: `tenant:${tenantId}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth failed (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }
}
```

#### 4.4.2 Cache Implementation (In-Memory)

```typescript
// src/server/waas/core/infra/cache/cache-impl.ts

import { injectable } from 'tsyringe';
import type { ICache } from '@/server/waas/core/application/ports/cache';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

@injectable()
export class CacheImpl implements ICache {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Verifica expiração
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds
      ? Date.now() + ttlSeconds * 1000
      : null;

    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  // Cleanup periódico (opcional)
  startCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.store.delete(key);
        }
      }
    }, intervalMs);
  }
}
```

#### 4.4.3 WaaS HTTP Gateway

```typescript
// src/server/waas/core/infra/gateways/waas-http.ts

import { injectable, inject } from 'tsyringe';
import type {
  IWaasGateway,
  GetBalanceInput,
  GetBalanceOutput,
} from '@/server/waas/core/application/ports/waas-gateway';
import type { ITokenProvider } from '@/server/waas/core/application/ports/token-provider';
import type { ICache } from '@/server/waas/core/application/ports/cache';
import {
  ITOKEN_PROVIDER_TOKEN,
  ICACHE_TOKEN,
} from '@/server/waas/core/interface/di/tokens';

@injectable()
export class WaasHttpGateway implements IWaasGateway {
  private readonly baseUrl = process.env.WAAS_API_URL!;

  constructor(
    @inject(ITOKEN_PROVIDER_TOKEN) private tokenProvider: ITokenProvider,
    @inject(ICACHE_TOKEN) private cache: ICache
  ) {}

  async getBalance(input: GetBalanceInput): Promise<GetBalanceOutput> {
    const cacheKey = `balance:${input.tenantId}:${input.customerId}`;

    // 1. Tenta cache
    const cached = await this.cache.get<GetBalanceOutput>(cacheKey);
    if (cached) {
      console.log(`[WaasGateway] Cache HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`[WaasGateway] Cache MISS: ${cacheKey}`);

    // 2. Busca token
    const token = await this.tokenProvider.getToken(input.tenantId);

    // 3. Faz requisição HTTP
    const url = `${this.baseUrl}/customers/${input.customerId}/balance`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': input.tenantId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WaaS API error (${response.status}): ${error}`);
    }

    const data: GetBalanceOutput = await response.json();

    // 4. Salva em cache (5 minutos)
    await this.cache.set(cacheKey, data, 300);

    return data;
  }

  // Outros métodos (listProducts, createIntent, etc.)
}
```

#### 4.4.4 WaaS Mock Gateway (Desenvolvimento)

```typescript
// src/server/waas/core/infra/gateways/waas-mock.ts

import { injectable } from 'tsyringe';
import type {
  IWaasGateway,
  GetBalanceInput,
  GetBalanceOutput,
} from '@/server/waas/core/application/ports/waas-gateway';

@injectable()
export class WaasMockGateway implements IWaasGateway {
  async getBalance(input: GetBalanceInput): Promise<GetBalanceOutput> {
    // Simula latência de rede
    await this.delay(100);

    console.log(`[MockGateway] Retornando dados fake para customer=${input.customerId}`);

    return {
      totalBalance: 150000.50,
      customerId: input.customerId,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 5. Fluxo de Requisição Completo

### 5.1 API Route (Entry Point)

```typescript
// src/app/api/waas/balance/route.ts

import 'reflect-metadata';
import { NextRequest } from 'next/server';
import { handleCorsPreflight, resolveTenant } from '@/lib/security/headers';
import { createRequestContainer } from '@/server/waas/core/interface/di/container';
import { BalanceController } from '@/server/waas/core/interface/controllers/balance-controller';
import { BALANCE_CONTROLLER_TOKEN } from '@/server/waas/core/interface/di/tokens';

export async function GET(request: NextRequest) {
  try {
    // 1. Resolve tenant (query ?tenant= > header x-tenant-id > 'default')
    const tenantId = resolveTenant(request);

    // 2. Extrai parâmetros da URL
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');

    if (!customerId) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: 'Missing required parameter: customerId',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Cria container request-scoped (isolamento por requisição)
    const container = createRequestContainer({ tenantId, customerId });

    // 4. Resolve controller (com todas dependências injetadas)
    const balanceController = container.resolve<BalanceController>(
      BALANCE_CONTROLLER_TOKEN
    );

    // 5. Delega para o controller
    return balanceController.getBalance(request, tenantId);
  } catch (error) {
    console.error('Error in balance API:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const tenantId = resolveTenant(request);
  return handleCorsPreflight(request, tenantId);
}
```

### 5.2 Security Headers Utility

```typescript
// src/lib/security/headers.ts (ou src/server/waas/security/headers.ts)

import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolve tenant ID from request
 * Priority: query param ?tenant= -> header x-tenant-id -> 'default'
 */
export function resolveTenant(request: NextRequest): string {
  const url = new URL(request.url);
  const tenantFromQuery = url.searchParams.get('tenant');
  if (tenantFromQuery) return tenantFromQuery;

  const tenantFromHeader = request.headers.get('x-tenant-id');
  if (tenantFromHeader) return tenantFromHeader;

  return 'default';
}

/**
 * Apply security headers to a NextResponse
 */
export async function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  tenantId: string = 'default'
): Promise<NextResponse> {
  // CSP
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');

  // CORS (configurar por tenant)
  const origin = request.headers.get('origin');
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');

  return response;
}

/**
 * Create a secure response with all headers applied
 */
export async function createSecureResponse(
  request: NextRequest,
  data: unknown,
  status: number = 200,
  tenantId?: string
): Promise<NextResponse> {
  const resolvedTenantId = tenantId || resolveTenant(request);
  const response = NextResponse.json(data, { status });
  return applySecurityHeaders(request, response, resolvedTenantId);
}

/**
 * Create a secure error response
 */
export async function createSecureErrorResponse(
  request: NextRequest,
  error: string,
  message: string,
  status: number = 500,
  requestId?: string,
  tenantId?: string
): Promise<NextResponse> {
  const resolvedTenantId = tenantId || resolveTenant(request);

  const errorData = {
    error,
    message,
    ...(requestId && { requestId }),
    timestamp: new Date().toISOString(),
  };

  const response = NextResponse.json(errorData, { status });
  return applySecurityHeaders(request, response, resolvedTenantId);
}

/**
 * Handle CORS preflight requests
 */
export async function handleCorsPreflight(
  request: NextRequest,
  tenantId: string = 'default'
): Promise<NextResponse> {
  const response = new NextResponse(null, { status: 200 });

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  const origin = request.headers.get('origin');
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}
```

---

## 6. Implementação Passo a Passo

### Step 1: Setup Inicial

```bash
# 1. Criar projeto Next.js
pnpm create next-app@latest my-app --typescript --tailwind --app

# 2. Instalar dependências
cd my-app
pnpm add tsyringe reflect-metadata zod

# 3. Configurar tsconfig.json (adicionar decorators)
```

### Step 2: Estrutura de Pastas

```bash
mkdir -p src/server/waas/core/{domain,application,interface,infra}
mkdir -p src/server/waas/core/domain/{entities,value-objects}
mkdir -p src/server/waas/core/application/{ports,use-cases}
mkdir -p src/server/waas/core/interface/{controllers,validation,di}
mkdir -p src/server/waas/core/infra/{auth,cache,gateways,logging}
mkdir -p src/lib/security
```

### Step 3: Criar Ports (Interfaces)

1. `src/server/waas/core/application/ports/waas-gateway.ts`
2. `src/server/waas/core/application/ports/token-provider.ts`
3. `src/server/waas/core/application/ports/cache.ts`

### Step 4: Criar Implementações (Infra)

1. `src/server/waas/core/infra/auth/token-provider-impl.ts`
2. `src/server/waas/core/infra/cache/cache-impl.ts`
3. `src/server/waas/core/infra/gateways/waas-http.ts`
4. `src/server/waas/core/infra/gateways/waas-mock.ts`

### Step 5: Criar Use Cases

1. `src/server/waas/core/application/use-cases/get-balance.ts`

### Step 6: Criar Controllers

1. `src/server/waas/core/interface/controllers/balance-controller.ts`
2. `src/server/waas/core/interface/validation/balance-schemas.ts`

### Step 7: Configurar DI

1. `src/server/waas/core/interface/di/tokens.ts`
2. `src/server/waas/core/interface/di/container.ts`

### Step 8: Criar API Route

1. `src/app/api/waas/balance/route.ts`

### Step 9: Criar Security Helpers

1. `src/lib/security/headers.ts`

### Step 10: Configurar Variáveis de Ambiente

```bash
# .env.local
WAAS_CLIENT_ID=your_client_id
WAAS_CLIENT_SECRET=your_secret
WAAS_AUTH_URL=https://auth.waas.com/oauth/token
WAAS_API_URL=https://api.waas.com
USE_REAL_WAAS_API=false  # true em produção
```

---

## 7. Boas Práticas e Patterns

### 7.1 Multi-Tenancy

**Sempre passar `tenantId` no contexto:**
```typescript
// ✅ BOM
const result = await useCase.execute({ tenantId: 'acme', customerId: '123' });

// ❌ RUIM (sem isolamento)
const result = await useCase.execute({ customerId: '123' });
```

**Usar tenant-aware cache:**
```typescript
// ✅ BOM
const cacheKey = `balance:${tenantId}:${customerId}`;

// ❌ RUIM (possível vazamento entre tenants)
const cacheKey = `balance:${customerId}`;
```

### 7.2 Error Handling

**Use classes customizadas:**
```typescript
export class WaasApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message);
    this.name = 'WaasApiError';
  }
}

// No gateway:
if (!response.ok) {
  throw new WaasApiError(response.status, 'BALANCE_FETCH_FAILED', 'Failed to fetch balance');
}
```

### 7.3 Logging

**Injetar logger via DI:**
```typescript
@injectable()
export class GetBalanceUseCase {
  constructor(
    @inject(IWAAS_GATEWAY_TOKEN) private waasGateway: IWaasGateway,
    @inject(ILOGGER_TOKEN) private logger: ILogger
  ) {}

  async execute(input: GetBalanceUseCaseInput): Promise<GetBalanceUseCaseOutput> {
    this.logger.info('Fetching balance', { customerId: input.customerId });
    
    try {
      const result = await this.waasGateway.getBalance(input);
      this.logger.info('Balance fetched successfully', { balance: result.totalBalance });
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch balance', { error });
      throw error;
    }
  }
}
```

### 7.4 Testing Strategy

**Unit Tests (Use Cases):**
```typescript
describe('GetBalanceUseCase', () => {
  it('should return balance from gateway', async () => {
    // Mock gateway
    const mockGateway: IWaasGateway = {
      getBalance: jest.fn().mockResolvedValue({ totalBalance: 1000 }),
    };

    // Inject mock
    const useCase = new GetBalanceUseCase(mockGateway);

    // Execute
    const result = await useCase.execute({
      tenantId: 'test',
      customerId: '123',
    });

    // Assert
    expect(result.totalBalance).toBe(1000);
    expect(mockGateway.getBalance).toHaveBeenCalledWith({
      tenantId: 'test',
      customerId: '123',
    });
  });
});
```

**Contract Tests (Gateway):**
```typescript
describe('WaasHttpGateway Contract', () => {
  it('should match IWaasGateway interface', () => {
    const gateway = new WaasHttpGateway(mockTokenProvider, mockCache);
    expect(typeof gateway.getBalance).toBe('function');
  });
});
```

**E2E Tests (API Route):**
```typescript
describe('GET /api/waas/balance', () => {
  it('should return 200 with balance data', async () => {
    const response = await fetch('http://localhost:3000/api/waas/balance?customerId=123');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('totalBalance');
  });
});
```

### 7.5 Observabilidade

**Request ID tracking:**
```typescript
export function resolveTenant(request: NextRequest): string {
  const requestId = crypto.randomUUID();
  request.headers.set('x-request-id', requestId);
  // ...
}
```

**Metrics (opcional):**
```typescript
import { Counter, Histogram } from 'prom-client';

const requestCounter = new Counter({
  name: 'waas_requests_total',
  help: 'Total WaaS API requests',
  labelNames: ['method', 'status', 'tenant'],
});

const requestDuration = new Histogram({
  name: 'waas_request_duration_seconds',
  help: 'WaaS API request duration',
  labelNames: ['method', 'tenant'],
});
```

---

## 8. Checklist de Implementação

- [ ] Instalar dependências (`tsyringe`, `reflect-metadata`, `zod`)
- [ ] Configurar `tsconfig.json` (decorators)
- [ ] Criar estrutura de pastas (domain, application, interface, infra)
- [ ] Definir ports (interfaces) em `application/ports/`
- [ ] Implementar adaptadores em `infra/` (token, cache, gateway)
- [ ] Criar use cases em `application/use-cases/`
- [ ] Criar controllers em `interface/controllers/`
- [ ] Configurar DI container em `interface/di/container.ts`
- [ ] Criar API routes em `src/app/api/waas/balance/route.ts`
- [ ] Implementar security headers (`lib/security/headers.ts`)
- [ ] Configurar variáveis de ambiente (`.env.local`)
- [ ] Adicionar validação Zod (schemas)
- [ ] Implementar error handling
- [ ] Adicionar logging estruturado
- [ ] Criar testes (unit, contract, e2e)
- [ ] Documentar API (OpenAPI/Swagger)
- [ ] Configurar CI/CD
- [ ] Monitorar métricas (APM)

---

## 9. Diagrama de Sequência Completo

```
┌──────────┐   ┌──────────┐   ┌────────────┐   ┌──────────┐   ┌────────────┐   ┌────────────┐
│  Front   │   │ API Route│   │ Controller │   │ Use Case │   │  Gateway   │   │ WaaS API   │
└────┬─────┘   └────┬─────┘   └─────┬──────┘   └────┬─────┘   └─────┬──────┘   └─────┬──────┘
     │              │                │               │                │                │
     │─GET /balance→│                │               │                │                │
     │              │─resolve()─────→│               │                │                │
     │              │                │─execute()────→│                │                │
     │              │                │               │─getBalance()──→│                │
     │              │                │               │                │─getToken()────→│
     │              │                │               │                │←─────token─────│
     │              │                │               │                │─GET /balance──→│
     │              │                │               │                │←─────data──────│
     │              │                │               │←────result─────│                │
     │              │                │←────result────│                │                │
     │              │←────response───│               │                │                │
     │←─────JSON────│                │               │                │                │
     │              │                │               │                │                │
```

---

## 10. Conversão para PDF

Para converter este arquivo para PDF, use uma das opções:

### Opção 1: Pandoc (Local)
```bash
pandoc CLEAN_ARCHITECTURE_GUIDE.md -o CLEAN_ARCHITECTURE_GUIDE.pdf --pdf-engine=xelatex
```

### Opção 2: VS Code Extension
1. Instale a extensão "Markdown PDF" (yzane.markdown-pdf)
2. Abra este arquivo
3. Cmd+Shift+P → "Markdown PDF: Export (pdf)"

### Opção 3: Ferramentas Online
- https://www.markdowntopdf.com/
- https://md2pdf.netlify.app/
- https://dillinger.io/

---

**Autor:** Documentação gerada para WaaS Experience Project  
**Versão:** 1.0.0  
**Data:** 17 de novembro de 2025
