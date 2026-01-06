# Context - EP-0001: Repository Deep Cleanup

**Feature:** Repository Deep Cleanup  
**Propósito:** Fornecer todas as referências internas e contexto necessário para executar a feature com segurança.

---

## 📂 Estrutura Atual do Repositório

### Diretórios Principais

```
/home/runner/work/moveaccess/moveaccess/
├── .git/                           # Controle de versão
├── .github/                        # GitHub configs e agentes
│   ├── copilot-instructions.md    # Instruções para agentes Copilot
│   └── agents/
│       ├── my-agent.PM.md         # Agente PM (Planning)
│       └── my-agent.agent.md      # Agente especializado
├── Doc/                            # Documentação do projeto
│   ├── Projeto/
│   │   ├── DEVELOPMENT_GUIDELINES.md
│   │   └── CLEAN_ARCHITECTURE_GUIDE.md
│   └── ExecutionPlans/            # Planos de execução (EPs)
│       └── EP-0001-repository-deep-cleanup/  # Este EP
├── public/                         # Assets estáticos
├── src/                            # Código fonte
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/login/route.ts
│   │   │   └── user/[id]/route.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Landing page
│   └── server/                    # Backend (Clean Architecture)
│       └── core/
│           ├── domain/            # Entidades e Value Objects
│           │   ├── entities/User.ts
│           │   └── value-objects/Money.ts
│           ├── application/       # Use Cases e Ports
│           │   ├── use-cases/get-user.ts
│           │   └── ports/
│           │       ├── cache.ts
│           │       ├── http-client.ts
│           │       └── logger.ts
│           ├── interface/         # Controllers, DI, Validation
│           │   ├── controllers/
│           │   │   ├── auth-controller.ts
│           │   │   └── user-controller.ts
│           │   ├── di/
│           │   │   ├── container.ts
│           │   │   └── tokens.ts
│           │   └── validation/
│           │       ├── auth-schemas.ts
│           │       └── user-schemas.ts
│           └── infra/             # Implementações concretas
│               ├── cache/in-memory-cache-impl.ts
│               ├── http/fetch-http-client.ts
│               └── logging/logger-impl.ts
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

---

## 📚 Documentos de Referência Interna

### Documentação Essencial (NUNCA REMOVER)

#### 1. DEVELOPMENT_GUIDELINES.md
- **Path:** `/home/runner/work/moveaccess/moveaccess/Doc/Projeto/DEVELOPMENT_GUIDELINES.md`
- **Propósito:** Define padrões de desenvolvimento, nomenclatura, estrutura de código
- **Importância:** Referência ativa para todos os desenvolvedores
- **Conteúdo chave:**
  - Estrutura de pastas e arquivos
  - Nomenclatura (PascalCase, camelCase, kebab-case)
  - Sistema de design (Nebraska Design System)
  - Componentes UI (shadcn/ui)
  - Padrões de código TypeScript
  - Boas práticas e restrições

#### 2. CLEAN_ARCHITECTURE_GUIDE.md
- **Path:** `/home/runner/work/moveaccess/moveaccess/Doc/Projeto/CLEAN_ARCHITECTURE_GUIDE.md`
- **Propósito:** Guia completo de implementação da Clean Architecture no projeto
- **Importância:** Define arquitetura do backend, DI, fluxo de requisições
- **Conteúdo chave:**
  - Estrutura de camadas (Domain, Application, Interface, Infra)
  - Dependency Injection com tsyringe
  - Fluxo de requisição completo
  - Ports e Adapters pattern
  - Multi-tenancy
  - Security headers
  - Implementação passo a passo

#### 3. README.md
- **Path:** `/home/runner/work/moveaccess/moveaccess/README.md`
- **Propósito:** Ponto de entrada do projeto, instruções básicas
- **Importância:** Primeira referência para qualquer pessoa que clone o repo
- **Conteúdo chave:**
  - Como começar (dev, build, lint)
  - Como conectar ao GitHub
  - Tecnologias usadas
  - Links de recursos

#### 4. Arquivos .github/
- **Path:** `/home/runner/work/moveaccess/moveaccess/.github/`
- **Propósito:** Instruções para agentes de IA e automação
- **Importância:** Define comportamento de agentes Copilot
- **Arquivos:**
  - `copilot-instructions.md` - Instruções gerais para agentes
  - `agents/my-agent.PM.md` - Agente especializado em planejamento (PM)
  - `agents/my-agent.agent.md` - Outro agente especializado

**⚠️ CRÍTICO:** Estes arquivos NÃO devem ser acessados ou modificados por outros agentes. Eles contêm instruções para agentes específicos.

---

## 🏗️ Decisões Arquiteturais Imutáveis

### Clean Architecture

**Decisão:** O projeto segue Clean Architecture com 4 camadas.

**Camadas (ordem de dependência):**
1. **Domain** - Entidades e Value Objects (zero dependências)
2. **Application** - Use Cases e Ports (abstrações)
3. **Interface** - Controllers, Validation, DI
4. **Infra** - Implementações concretas (HTTP, cache, logging)

**Regra de ouro:** Dependências apontam para dentro (Infra → Interface → Application → Domain).

**Referência:** `Doc/Projeto/CLEAN_ARCHITECTURE_GUIDE.md`

### Dependency Injection

**Decisão:** Usar `tsyringe` para DI.

**Configuração:**
- Global container configurado em `src/server/core/interface/di/container.ts`
- Tokens de injeção definidos em `src/server/core/interface/di/tokens.ts`
- Request-scoped containers para isolamento

**Imports necessários:**
- `import 'reflect-metadata'` (side-effect necessário)
- Decorators: `@injectable()`, `@inject()`

**Referência:** `CLEAN_ARCHITECTURE_GUIDE.md` seção 4.3

### Next.js App Router

**Decisão:** Usar Next.js 15 com App Router (não Pages Router).

**Estrutura:**
- Pages em `src/app/*/page.tsx`
- Layouts em `src/app/*/layout.tsx`
- API Routes em `src/app/api/*/route.ts`

**Convenções:**
- Rotas dinâmicas: `[param]/`
- Route handlers: `export async function GET()`, `POST()`, etc.

**Referência:** `DEVELOPMENT_GUIDELINES.md` seção "Estrutura de Pastas"

### Design System

**Decisão:** Usar Tailwind CSS v4 + shadcn/ui.

**Componentes:**
- `components/ui/` - Apenas componentes shadcn (não criar custom aqui)
- `components/common/` - Componentes customizados compartilhados

**Cores:**
- SEMPRE usar variáveis CSS: `var(--element-primary)`, etc.
- NUNCA usar cores hardcoded (#FF0000, rgb(), etc.)

**Referência:** `DEVELOPMENT_GUIDELINES.md` seção "Sistema de Design e Cores"

---

## 🔧 Configurações do Projeto

### Build e Desenvolvimento

**Scripts principais (package.json):**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**Validação obrigatória após mudanças:**
1. `npm run build` - Deve passar
2. `npm run lint` - Deve passar
3. Teste manual da aplicação

### TypeScript

**Configuração:** `tsconfig.json`

**Configurações críticas (não alterar):**
- `experimentalDecorators: true` (para tsyringe)
- `emitDecoratorMetadata: true` (para tsyringe)
- `strict: true`
- Path aliases: `@/*` → `./src/*`

**Referência:** `CLEAN_ARCHITECTURE_GUIDE.md` seção 3.2

### ESLint

**Configuração:** `eslint.config.mjs`

**Regras importantes:**
- Detecta imports não usados
- Detecta variáveis não usadas
- Força tipagem TypeScript

### Git

**Configuração:** `.gitignore`

**Ignorados:**
- `node_modules/`
- `.next/`
- `*.log`
- `.env*`

**Se adicionar novos patterns:** Documentar motivo em `05-changelog.md`

---

## 📍 Paths Importantes

### Funcionalidades Ativas (NUNCA REMOVER)

```
Landing Page:
  src/app/page.tsx
  src/app/layout.tsx
  src/app/globals.css

API Auth:
  src/app/api/auth/login/route.ts
  src/server/core/interface/controllers/auth-controller.ts
  src/server/core/interface/validation/auth-schemas.ts

API User:
  src/app/api/user/[id]/route.ts
  src/server/core/interface/controllers/user-controller.ts
  src/server/core/application/use-cases/get-user.ts
  src/server/core/interface/validation/user-schemas.ts

Dependency Injection:
  src/server/core/interface/di/container.ts
  src/server/core/interface/di/tokens.ts

Domain:
  src/server/core/domain/entities/User.ts
  src/server/core/domain/value-objects/Money.ts

Infrastructure:
  src/server/core/infra/cache/in-memory-cache-impl.ts
  src/server/core/infra/http/fetch-http-client.ts
  src/server/core/infra/logging/logger-impl.ts

Ports:
  src/server/core/application/ports/cache.ts
  src/server/core/application/ports/http-client.ts
  src/server/core/application/ports/logger.ts
```

### Documentação Ativa (NUNCA REMOVER)

```
README.md
Doc/Projeto/DEVELOPMENT_GUIDELINES.md
Doc/Projeto/CLEAN_ARCHITECTURE_GUIDE.md
.github/copilot-instructions.md
.github/agents/my-agent.PM.md
.github/agents/my-agent.agent.md
```

### Configuração (CUIDADO AO ALTERAR)

```
package.json
package-lock.json
tsconfig.json
next.config.ts
eslint.config.mjs
postcss.config.mjs
.gitignore
```

---

## 🎯 Funcionalidades Existentes

### Landing Page (/)

**Arquivo principal:** `src/app/page.tsx`

**Funcionalidades:**
- Renderiza página inicial com Next.js logo
- Links para templates Vercel
- Links para documentação Next.js
- Botões "Deploy Now" e "Documentation"
- Suporte a dark mode
- Responsividade

**Dependências:**
- `next/image` (Image component)
- Tailwind CSS classes
- `src/app/layout.tsx` (layout wrapper)

### API - Login

**Endpoint:** `POST /api/auth/login`

**Arquivo:** `src/app/api/auth/login/route.ts`

**Fluxo:**
1. Recebe JSON body
2. Cria request container (DI)
3. Resolve `AuthController`
4. Executa `controller.login(body)`
5. Retorna 200 (sucesso) ou 401 (falha)

**Dependências:**
- `reflect-metadata` (import side-effect)
- DI container
- AuthController
- Zod validation schemas

### API - User

**Endpoint:** `GET /api/user/[id]`

**Arquivo:** `src/app/api/user/[id]/route.ts`

**Fluxo:**
1. Recebe parâmetro `id` da URL
2. Cria request container (DI)
3. Resolve `UserController`
4. Executa `controller.getUser({ userId })`
5. Retorna 200 (sucesso) ou 400/500 (erro)

**Dependências:**
- `reflect-metadata` (import side-effect)
- DI container
- UserController
- GetUserUseCase

---

## 🔍 Como Identificar Código em Uso

### Método 1: Grep (Busca Global)

```bash
# Verificar se arquivo é importado
cd /home/runner/work/moveaccess/moveaccess
grep -r "nome-do-arquivo" src/

# Verificar imports de uma função
grep -r "nomeDaFuncao" src/

# Verificar uso de um componente
grep -r "NomeDoComponente" src/
```

### Método 2: TypeScript Compiler

```bash
# Compilar e verificar erros
tsc --noEmit

# Se remover algo e compilação falhar = está em uso
```

### Método 3: Build

```bash
# Build de produção
npm run build

# Se build falhar após remoção = estava em uso
```

### Método 4: ESLint

```bash
# Detectar imports não usados
npm run lint

# Se ESLint não reclama de import não usado = pode estar em uso via side-effect
```

---

## ⚠️ Side-Effects Importantes

### Imports Que Não Podem Ser Removidos

```typescript
// ✅ NUNCA REMOVER (mesmo que pareça não usado)
import 'reflect-metadata';  // Necessário para tsyringe

// ✅ NUNCA REMOVER (mesmo que pareça não usado)
import './styles.css';  // Side-effect: carrega CSS

// ✅ NUNCA REMOVER (mesmo que pareça não usado)
import '@/lib/polyfills';  // Polyfills
```

**Regra:** Se import não tem named imports/default import (`import 'xxx'`), é provavelmente side-effect. Validar antes de remover.

---

## 📊 Estado Atual (Baseline)

### Arquivos por Tipo

```
.md files: 6 total
  - README.md
  - DEVELOPMENT_GUIDELINES.md
  - CLEAN_ARCHITECTURE_GUIDE.md
  - copilot-instructions.md
  - my-agent.PM.md
  - my-agent.agent.md

.ts/.tsx files: 20 total
  - Veja listagem completa no output inicial de análise
```

### Tamanho do Repositório

```
~860 KB total (sem node_modules)
```

### Git History

```
2 commits:
  - Initial plan
  - Create guidelines for MoveAccess project agent
```

---

## 📝 Notas de Execução

### Ferramentas Úteis

```bash
# Contar arquivos
find . -name "*.md" | wc -l
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l

# Buscar imports
grep -r "import.*from.*\"@/.*\"" src/

# Listar arquivos não commitados
git status

# Ver diferenças
git diff

# Tamanho do repo
du -sh .
```

### Validação Incremental

Após cada mudança:
```bash
npm run build && npm run lint && echo "✅ Passou"
```

---

## 🚨 Referências Externas Proibidas

**NUNCA** referenciar documentação externa quando houver interna:

- ❌ Não linkar para blog posts sobre Clean Architecture → Usar `CLEAN_ARCHITECTURE_GUIDE.md`
- ❌ Não linkar para tutoriais de Next.js → Usar `DEVELOPMENT_GUIDELINES.md`
- ❌ Não linkar para docs do tsyringe → Usar `CLEAN_ARCHITECTURE_GUIDE.md`

**Regra:** Se a informação existe na documentação interna, use-a.

---

## ✅ Conclusão

Este contexto fornece todas as informações necessárias para executar EP-0001 sem necessidade de referências externas ou suposições.

**Qualquer dúvida não coberta aqui:** Pergunte ao usuário ou marque como `[PENDENTE]`.
