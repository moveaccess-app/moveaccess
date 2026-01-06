# EP-0001: Context

## Repository Structure

### Current Directory Tree
```
moveaccess/
├── .git/
├── .github/
├── Doc/
│   ├── ExecutionPlans/
│   │   └── EP-0001-repository-deep-cleanup/    # This plan
│   └── Projeto/
│       ├── CLEAN_ARCHITECTURE_GUIDE.md         # ❌ Incorrect (WaaS)
│       └── DEVELOPMENT_GUIDELINES.md           # ❌ Incorrect (Web Flow)
├── public/
│   ├── next.svg
│   └── vercel.svg
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   │       └── route.ts                # ✅ Working
│   │   │   └── user/
│   │   │       └── [id]/
│   │   │           └── route.ts                # ✅ Working
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx                          # ⚠️ Needs fix (fonts)
│   │   └── page.tsx                            # ⚠️ Template content
│   └── server/
│       └── core/
│           ├── application/
│           │   ├── ports/                      # ✅ Keep
│           │   │   ├── cache.ts
│           │   │   ├── http-client.ts
│           │   │   └── logger.ts
│           │   └── use-cases/                  # ✅ Keep
│           │       └── get-user.ts
│           ├── domain/
│           │   ├── entities/                   # ✅ Keep
│           │   │   └── User.ts
│           │   └── value-objects/              # ✅ Keep
│           │       └── Money.ts
│           ├── infra/
│           │   ├── cache/                      # ✅ Keep
│           │   │   └── in-memory-cache-impl.ts
│           │   ├── http/                       # ✅ Keep
│           │   │   └── fetch-http-client.ts
│           │   └── logging/                    # ✅ Keep
│           │       └── logger-impl.ts
│           └── interface/
│               ├── controllers/                # ✅ Keep
│               │   ├── auth-controller.ts
│               │   └── user-controller.ts
│               ├── di/                         # ✅ Keep
│               │   ├── container.ts
│               │   └── tokens.ts
│               └── validation/                 # ✅ Keep
│                   ├── auth-schemas.ts
│                   └── user-schemas.ts
├── .gitignore
├── README.md                                   # ⚠️ Needs update
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Architectural Decisions

### Clean Architecture Implementation

**Layers** (Inner → Outer):
1. **Domain** (innermost) - Pure business logic
2. **Application** - Use cases and ports
3. **Interface** - Controllers, DI, validation
4. **Infrastructure** (outermost) - External adapters

**Dependency Rule**: Dependencies point inward only.

```
Infrastructure → Interface → Application → Domain
(Adapters)     (Controllers)  (Use Cases)  (Entities)
```

### Key Patterns

#### Dependency Injection (tsyringe)
- Container configured in `src/server/core/interface/di/container.ts`
- Tokens defined in `src/server/core/interface/di/tokens.ts`
- Injectable decorators on classes
- Constructor injection pattern

#### Ports and Adapters
- **Ports** (interfaces): `src/server/core/application/ports/`
  - `ICache`, `IHttpClient`, `ILogger`
- **Adapters** (implementations): `src/server/core/infra/`
  - Cache → `InMemoryCacheImpl`
  - HTTP → `FetchHttpClient`
  - Logger → `LoggerImpl`

#### Validation (Zod)
- Schemas in `src/server/core/interface/validation/`
- Type-safe input validation
- Used in controllers before use case execution

---

## Technology Stack

### Dependencies (package.json)
```json
{
  "dependencies": {
    "next": "16.0.10",           // Next.js framework
    "react": "19.2.1",           // React library
    "react-dom": "19.2.1",       // React DOM
    "reflect-metadata": "^0.2.2", // For tsyringe decorators
    "tsyringe": "^4.10.0",       // Dependency injection
    "zod": "^4.1.13"             // Schema validation
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.0.10",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### NOT in Stack
- ❌ shadcn/ui
- ❌ Warren Nebraska tokens
- ❌ Radix UI
- ❌ axios (using fetch)
- ❌ currency.js
- ❌ recharts
- ❌ lucide-react

---

## File Dependency Map

### API Routes
```
/api/auth/login/route.ts
  ↓ imports
  - AuthController (src/server/core/interface/controllers/auth-controller.ts)
  - DI Container (src/server/core/interface/di/container.ts)

/api/user/[id]/route.ts
  ↓ imports
  - UserController (src/server/core/interface/controllers/user-controller.ts)
  - DI Container (src/server/core/interface/di/container.ts)
```

### Controllers
```
auth-controller.ts
  ↓ imports
  - auth-schemas.ts (validation)
  - No use cases yet (stub)

user-controller.ts
  ↓ imports
  - user-schemas.ts (validation)
  - GetUserUseCase
```

### Use Cases
```
get-user.ts
  ↓ imports
  - User entity (domain)
  - No ports yet (returns mock)
```

### Domain
```
User.ts
  ↓ imports
  - None (pure domain)

Money.ts
  ↓ imports
  - None (pure domain)
```

### Infrastructure
```
in-memory-cache-impl.ts
  ↓ implements
  - ICache port

fetch-http-client.ts
  ↓ implements
  - IHttpClient port

logger-impl.ts
  ↓ implements
  - ILogger port
```

### DI Container
```
container.ts
  ↓ imports
  - tsyringe
  - reflect-metadata
  - All ports
  - All implementations
  - All tokens
```

---

## Known Issues

### 1. Build Failure - Google Fonts
**Location**: `src/app/layout.tsx`

**Error**:
```
Failed to fetch `Geist` from Google Fonts.
Failed to fetch `Geist Mono` from Google Fonts.
```

**Cause**: Network restriction in build environment - cannot access fonts.googleapis.com

**Impact**: `npm run build` fails

**Solution**: Remove or replace with local/system fonts

---

### 2. Template Content
**Location**: `src/app/page.tsx`

**Issue**: Contains generic Next.js template content
- References Vercel templates
- Generic "To get started..." text
- Default Next.js logo

**Impact**: Not MoveAccess-specific

**Solution**: Replace with MoveAccess landing page

---

### 3. Incorrect Documentation
**Location**: `Doc/Projeto/*.md`

**Issues**:
- CLEAN_ARCHITECTURE_GUIDE.md references "WaaS Experience" project
- DEVELOPMENT_GUIDELINES.md references "Web Flow" project
- Both mention technologies not in package.json

**Impact**: Misleading for developers

**Solution**: Delete or rewrite to match actual MoveAccess project

---

### 4. Generic README
**Location**: `README.md`

**Issue**: Generic Next.js template README
- References "Create Next App"
- Generic project description

**Impact**: Doesn't describe MoveAccess

**Solution**: Update with MoveAccess-specific content

---

## Environment

### Build Commands
```bash
npm install      # Install dependencies
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

### TypeScript Configuration
- `experimentalDecorators: true` (for tsyringe)
- `emitDecoratorMetadata: true` (for tsyringe)
- `strict: true`
- Path aliases: `@/*` → `./src/*`

### Next.js Configuration
- App Router (not Pages Router)
- TypeScript
- Tailwind CSS v4
- ESLint

---

## Project Intent

**Name**: MoveAccess

**Purpose**: (To be defined - currently unclear from codebase)

**Architecture**: Clean Architecture with DI

**Current State**: 
- ✅ Clean Architecture structure in place
- ✅ Basic auth and user API routes
- ⚠️ Template content not customized
- ❌ Build fails due to font loading
- ❌ Documentation doesn't match project

**Goal After Cleanup**:
- ✅ Build succeeds
- ✅ Documentation accurate
- ✅ No template content
- ✅ Clean, working codebase

---

**Last Updated**: 2026-01-06
