# Mapeamento Lovable → Projeto MoveAccess

## 📋 Visão Geral

Este documento mapeia as telas e componentes do projeto Lovable para a estrutura do projeto MoveAccess, seguindo a arquitetura limpa já definida.

## 🎯 Estrutura de Rotas

### Rotas Públicas (Não Autenticadas)

| Lovable | Projeto MoveAccess | Descrição |
|---------|-------------------|-----------|
| `/` (Index.tsx) | `/` (app/page.tsx) | **Landing Page** - Página inicial pública |
| `/login` | `/login` (app/login/page.tsx) | **Login** - Autenticação de usuário |
| `/signup` | `/signup` (app/signup/page.tsx) | **Cadastro/Onboarding** - Registro e configuração inicial |
| `/forgot-password` | `/forgot-password` (app/forgot-password/page.tsx) | **Recuperação de Senha** |
| `/plans` | `/plans` (app/plans/page.tsx) | **Planos** - Precificação e escolha de plano |

### Rotas Protegidas (Pós-Login)

| Funcionalidade | Projeto MoveAccess | Descrição |
|----------------|-------------------|-----------|
| Dashboard | `/app` (app/(protected)/page.tsx) | **Dashboard Principal** - Visão geral pós-login |
| Gerenciar Alunos | `/app/students` | **Gestão de Alunos** |
| Controle de Acesso | `/app/access` | **Controle de Acessos/Catracas** |
| Financeiro | `/app/finance` | **Gestão Financeira** |
| Configurações | `/app/settings` | **Configurações da Academia** |

## 📁 Mapeamento de Componentes

### Landing Page (Index.tsx)

O Lovable implementa a landing como uma página única com múltiplas seções. No projeto MoveAccess:

#### Componentes do Lovable → Destino no Projeto

```
Doc/Lovable/move-access-main/src/pages/Index.tsx
└── Seções:
    ├── Navbar              → app/(public)/components/Navbar.tsx
    ├── HeroSection         → app/(public)/components/HeroSection.tsx
    ├── PillarsSection      → app/(public)/components/PillarsSection.tsx
    ├── FeaturesSection     → app/(public)/components/FeaturesSection.tsx
    ├── HowItWorksSection   → app/(public)/components/HowItWorksSection.tsx
    ├── TestimonialsSection → app/(public)/components/TestimonialsSection.tsx
    ├── TransparencySection → app/(public)/components/TransparencySection.tsx
    ├── CTASection          → app/(public)/components/CTASection.tsx
    └── Footer              → app/(public)/components/Footer.tsx
```

**Localização sugerida**: 
- Página: `src/app/page.tsx`
- Componentes: `src/app/(public)/components/landing/`

### Login (Login.tsx)

Página de autenticação com validação de formulário.

**Funcionalidades**:
- Validação de email/senha
- Toggle de "lembrar-me"
- Exibição/ocultação de senha
- Loading states
- Links para recuperação e cadastro

**Localização sugerida**:
- Página: `src/app/login/page.tsx`
- Componentes: `src/app/login/components/` (se necessário)
- Lógica de auth: `src/server/auth/` (seguindo Clean Architecture)

### Signup/Onboarding (Signup.tsx)

Processo de cadastro em múltiplos passos (wizard).

**Etapas do Onboarding**:
1. **Conta** (User): Nome, email, senha
2. **Academia** (Building2): Nome da academia, CNPJ, cidade, unidades, alunos
3. **Operação** (Settings): Configurações de catraca, QR code, biometria
4. **Plano** (CreditCard): Escolha do plano
5. **Conclusão** (Sparkles): Confirmação e próximos passos

**Localização sugerida**:
- Página principal: `src/app/signup/page.tsx`
- Componentes do wizard: `src/app/signup/components/`
  - `SignupStep1.tsx` - Dados da conta
  - `SignupStep2.tsx` - Dados da academia
  - `SignupStep3.tsx` - Configurações operacionais
  - `SignupStep4.tsx` - Escolha de plano
  - `SignupStep5.tsx` - Conclusão
- Lógica de registro: `src/server/auth/` (Clean Architecture)

### Forgot Password (ForgotPassword.tsx)

Página de recuperação de senha.

**Funcionalidades**:
- Input de email
- Validação
- Feedback de email enviado

**Localização sugerida**:
- Página: `src/app/forgot-password/page.tsx`
- Service: Integrar com `src/server/auth/`

### Plans (Plans.tsx)

Página de planos e precificação.

**Funcionalidades**:
- Comparação de planos
- Seleção de plano
- CTA para signup/upgrade

**Localização sugerida**:
- Página: `src/app/plans/page.tsx`
- Componentes: `src/app/plans/components/PlanCard.tsx`

### Not Found (NotFound.tsx)

Página 404.

**Localização sugerida**:
- Página: `src/app/not-found.tsx` (convenção Next.js)

## 🧩 Componentes UI Compartilhados

Os componentes base do Lovable (`src/components/ui/`) são do **shadcn/ui**. O projeto MoveAccess deve:

1. **Instalar apenas componentes necessários** via shadcn CLI
2. **Adaptar cores** para usar Nebraska Design System
3. **Manter em** `src/components/ui/` (seguindo padrão do projeto)

### Componentes UI Identificados no Lovable:

- Badge
- Button
- Card
- Checkbox
- Dialog
- Input
- Label
- RadioGroup
- Select
- Separator
- Tabs
- Tooltip
- Calendar (se necessário)
- Chart (para dashboards futuros)

## 🔄 Fluxos de Navegação

### Fluxo do Usuário Novo:

```
Landing (/) 
  → CTA "Começar Agora"
    → Signup (/signup) - 5 etapas
      → Sucesso
        → Dashboard (/app)
```

### Fluxo do Usuário Existente:

```
Landing (/)
  → Botão "Entrar"
    → Login (/login)
      → Dashboard (/app)
```

### Fluxo de Recuperação de Senha:

```
Login (/login)
  → Link "Esqueci minha senha"
    → Forgot Password (/forgot-password)
      → Email enviado
        → Voltar para Login
```

## 🏗️ Implementação por Camadas (Clean Architecture)

### 1. Domain Layer
**Onde**: `src/server/[feature]/core/domain/`

**Entidades identificadas**:
- `User` - Usuário/dono da academia
- `Academy` - Academia/estabelecimento
- `Student` - Aluno/membro
- `Plan` - Plano de assinatura
- `Access` - Registro de acesso

### 2. Application Layer
**Onde**: `src/server/[feature]/core/application/`

**Use Cases identificados**:
- `SignupUseCase` - Cadastro completo
- `LoginUseCase` - Autenticação
- `RecoverPasswordUseCase` - Recuperação de senha
- `GetAcademyDataUseCase` - Buscar dados da academia
- `UpdateAcademySettingsUseCase` - Atualizar configurações

### 3. Interface Layer
**Onde**: `src/server/[feature]/core/interface/`

**Controllers**:
- `AuthController` - Login, signup, logout
- `UserController` - Gestão de usuário
- `AcademyController` - Gestão de academia

### 4. Infrastructure Layer
**Onde**: `src/server/[feature]/core/infra/`

**Implementações**:
- `AuthGateway` - Integração com serviço de autenticação
- `DatabaseRepository` - Acesso a dados
- `EmailService` - Envio de emails

## 📐 Layout e Estrutura de Pastas

### Estrutura Recomendada (Next.js App Router):

```
src/
├── app/
│   ├── (public)/                    # Grupo de rotas públicas
│   │   ├── components/              # Componentes compartilhados públicos
│   │   │   ├── landing/            # Componentes da landing
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── layout.tsx              # Layout para rotas públicas
│   │
│   ├── login/
│   │   ├── page.tsx                # Página de login
│   │   └── components/             # Componentes específicos do login
│   │
│   ├── signup/
│   │   ├── page.tsx                # Wizard de signup
│   │   └── components/             # Steps do onboarding
│   │
│   ├── forgot-password/
│   │   └── page.tsx
│   │
│   ├── plans/
│   │   ├── page.tsx
│   │   └── components/
│   │
│   ├── (protected)/                 # Grupo de rotas protegidas
│   │   ├── layout.tsx              # Layout com auth
│   │   ├── page.tsx                # Dashboard
│   │   ├── students/
│   │   ├── access/
│   │   ├── finance/
│   │   └── settings/
│   │
│   ├── not-found.tsx               # 404
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing (root)
│   └── globals.css
│
├── components/
│   ├── ui/                         # shadcn/ui components
│   └── common/                     # Componentes compartilhados
│
└── server/
    ├── auth/                       # Módulo de autenticação
    │   └── core/
    │       ├── domain/
    │       ├── application/
    │       ├── interface/
    │       └── infra/
    │
    └── academy/                    # Módulo de gestão de academia
        └── core/
            ├── domain/
            ├── application/
            ├── interface/
            └── infra/
```

## 🎨 Adaptação de Estilos

### Do Lovable para MoveAccess:

1. **Cores Hardcoded → Nebraska Variables**
   ```tsx
   // ❌ Lovable
   <div className="bg-blue-600">
   
   // ✅ MoveAccess
   <div style={{ backgroundColor: 'var(--primary-color)' }}>
   ```

2. **Classes Tailwind → Tailwind + Nebraska**
   - Manter Tailwind para layout/spacing
   - Usar variáveis Nebraska para cores específicas

3. **Componentes UI**
   - Instalar via shadcn CLI
   - Customizar tema para Nebraska

## ⚙️ Integração com Backend

### APIs Necessárias (identificadas no Lovable):

1. **Auth**
   - `POST /api/auth/signup` - Cadastro
   - `POST /api/auth/login` - Login
   - `POST /api/auth/logout` - Logout
   - `POST /api/auth/forgot-password` - Recuperar senha
   - `POST /api/auth/reset-password` - Resetar senha

2. **User**
   - `GET /api/user/profile` - Perfil do usuário
   - `PUT /api/user/profile` - Atualizar perfil

3. **Academy**
   - `POST /api/academy` - Criar academia
   - `GET /api/academy/:id` - Buscar academia
   - `PUT /api/academy/:id` - Atualizar academia
   - `PUT /api/academy/:id/settings` - Atualizar configurações

4. **Plans**
   - `GET /api/plans` - Listar planos
   - `POST /api/subscription` - Criar assinatura

### Localização dos Services:
- `src/server/auth/core/application/use-cases/`
- `src/server/auth/core/interface/controllers/`

## 📝 Validações Identificadas

### Login:
- Email válido (regex)
- Senha mínima 6 caracteres

### Signup:
- **Step 1**: Email único, senha forte, confirmação de senha
- **Step 2**: CNPJ válido, campos obrigatórios
- **Step 3**: Pelo menos uma opção de controle de acesso
- **Step 4**: Plano selecionado

### Forgot Password:
- Email válido e existente

## 🚀 Ordem de Implementação Recomendada

### Fase 1: Estrutura Base (Esta Task)
- [x] Documentar Lovable
- [x] Mapear estrutura
- [ ] Criar rotas placeholder

### Fase 2: Autenticação (Próxima Task)
1. Login
2. Signup (Step 1)
3. Forgot Password
4. Validações de auth

### Fase 3: Onboarding Completo
1. Signup Steps 2-5
2. Integração com backend
3. Fluxo completo

### Fase 4: Landing Page
1. Componentes da landing
2. Responsividade
3. SEO

### Fase 5: Dashboard e Áreas Protegidas
1. Layout protegido
2. Dashboard básico
3. Navegação entre módulos

## 📚 Referências

- **Lovable**: `Doc/Lovable/move-access-main/`
- **Arquitetura**: `Doc/Projeto/CLEAN_ARCHITECTURE_GUIDE.md`
- **Guidelines**: `Doc/Projeto/DEVELOPMENT_GUIDELINES.md`

---

**Nota**: Este mapeamento deve ser atualizado conforme a implementação avança e novas necessidades são identificadas.

**Última atualização**: Dezembro 2024
