# Guia de Desenvolvimento - Web Flow

Este documento define os padrões e restrições para desenvolvimento de novas funcionalidades no projeto Web Flow. Siga estas diretrizes para garantir consistência e qualidade do código.

---

## 📁 Estrutura de Pastas e Arquivos

### Organização Geral

```
web-flow/
├── app/                          # Pages e rotas (Next.js App Router)
│   ├── [feature]/               # Páginas organizadas por feature
│   │   ├── page.tsx            # Página principal da rota
│   │   ├── [id]/               # Rotas dinâmicas
│   │   │   └── page.tsx
│   │   └── components/         # Componentes específicos da feature
│   ├── api/                    # API Routes
│   ├── globals.css             # Estilos globais
│   └── layout.tsx              # Layout raiz
├── components/
│   ├── ui/                     # Componentes do Design System (shadcn/ui)
│   ├── common/                 # Componentes compartilhados customizados
│   └── [feature]/              # Componentes específicos de features
├── services/                   # Camada de serviços (API calls)
│   └── [service]/
│       ├── index.ts           # Funções exportadas
│       └── types.ts           # TypeScript types
├── hooks/                      # Custom React Hooks
├── lib/                        # Utilitários e helpers
├── types/                      # TypeScript types globais
├── context/                    # React Context providers
└── docs/                       # Documentação
```

### Regras de Estrutura

1. **Pages (app/)**: Uma pasta por feature principal, com `page.tsx` como entrada
2. **Components**:
   - `components/ui/`: APENAS componentes do shadcn/ui
   - `components/common/`: Componentes reutilizáveis customizados
   - `app/[feature]/components/`: Componentes específicos da feature
3. **Services**: Um serviço por entidade/domínio
4. **Arquivos de Configuração**: Sempre na raiz do projeto

---

## 📝 Nomenclatura

### Arquivos e Pastas

| Tipo                  | Padrão                      | Exemplo                                    |
| --------------------- | --------------------------- | ------------------------------------------ |
| **Componentes React** | PascalCase                  | `UserProfile.tsx`, `OrderTable.tsx`        |
| **Pages (Next.js)**   | lowercase com hífen         | `page.tsx`, `layout.tsx`                   |
| **Rotas dinâmicas**   | [colchetes]                 | `[customerId]/`, `[...path]/`              |
| **Utilitários**       | camelCase                   | `httpClient.ts`, `formatCurrency.ts`       |
| **Types**             | camelCase                   | `types.ts`, `order.ts`                     |
| **Pastas**            | kebab-case                  | `order-management/`, `financial-planning/` |
| **Hooks**             | camelCase com prefixo `use` | `useAuth.ts`, `useCustomer.ts`             |

### Código TypeScript

```typescript
// ✅ CORRETO

// Componentes: PascalCase
export function UserCard() {}

// Funções: camelCase
export function calculateTotal() {}

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Interfaces/Types: PascalCase com prefixo I para interfaces
interface IUser {}
type UserRole = 'admin' | 'user';

// Variáveis: camelCase
const userName = 'John';
let isActive = true;

// Props: PascalCase + "Props"
interface UserCardProps {
  userId: string;
  onEdit: () => void;
}
```

---

## 🎨 Sistema de Design e Cores

### Nebraska Design System

O projeto utiliza o **Warren Nebraska Tokens** como base do design system.

```typescript
// package.json
"@warrenbrasil/nebraska-tokens-web": "^4.5.0"
```

### Variáveis CSS Disponíveis

#### Cores de Background

```css
var(--background-primary)      /* Fundo principal */
var(--background-secondary)    /* Fundo secundário */
var(--background-tertiary)     /* Fundo terciário */
```

#### Cores de Elementos/Texto

```css
var(--element-primary)         /* Texto principal */
var(--element-secondary)       /* Texto secundário */
var(--element-disabled)        /* Texto desabilitado */
```

#### Cores de Status

```css
/* Positivo (sucesso) */
var(--status-positive)
var(--status-positive-background)

/* Alerta (atenção) */
var(--status-alert)
var(--status-alert-background)

/* Negativo (erro) */
var(--status-negative)
var(--status-negative-background)

/* Informação */
var(--status-info)
var(--status-info-background)
```

#### Cores de Divisores

```css
var(--divider-primary)         /* Bordas e divisores */
```

#### Cores de Benchmark (Gráficos)

```css
var(--benchmark-01)
var(--benchmark-02)
var(--benchmark-03)
```

#### Cores Base

```css
var(--base-primary)            /* Branco ou cor base */
```

### Tipografia

```css
var(--font-text)               /* Fonte padrão do texto */
```

### ⚠️ REGRAS DE USO DE CORES

1. **NUNCA use cores hardcoded** (ex: `#FF0000`, `rgb(255,0,0)`)
2. **SEMPRE use variáveis CSS do Nebraska**
3. **Para cores não disponíveis**: Solicite ao time de design

```tsx
// ❌ ERRADO
<div style={{ color: '#333333' }}>

// ✅ CORRETO
<div style={{ color: 'var(--element-primary)' }}>
```

---

## 🧩 Componentes do Design System

### Componentes UI (shadcn/ui)

Componentes disponíveis em `components/ui/`:

- `badge.tsx` - Badges com variantes de status
- `button.tsx` - Botões
- `card.tsx` - Cards
- `chart.tsx` - Gráficos (Recharts)
- `checkbox.tsx` - Checkboxes
- `dialog.tsx` - Diálogos/Modais
- `dropdown-menu.tsx` - Menus dropdown
- `input.tsx` - Inputs de texto
- `label.tsx` - Labels
- `popover.tsx` - Popovers
- `select.tsx` - Selects
- `separator.tsx` - Separadores
- `sheet.tsx` - Side panels/Drawers
- `spinner.tsx` - Loading spinners
- `switch.tsx` - Switches/Toggles
- `tabs.tsx` - Tabs
- `tooltip.tsx` - Tooltips (versão shadcn)

### Componentes Common (Customizados)

Componentes em `components/common/`:

- `BaseText.tsx` - Texto base com skeleton loading
- `Button.tsx` - Botão customizado
- `Tooltip.tsx` - Tooltip customizado Warren
- `Loading.tsx` - Loading states
- `StatsCard.tsx` - Card de estatísticas
- Filtros: `ColumnFilter.tsx`, `FilterSelect.tsx`
- Inputs: `InputDate.tsx`, `InputMoney.tsx`, `InputRange.tsx`, `InputSelect.tsx`

### Como Usar

```tsx
// Componentes UI (shadcn)
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Componentes Common
import { BaseText, Tooltip } from '@/components/common';

function MyComponent() {
  return (
    <>
      <Badge variant="positive">Sucesso</Badge>
      <BaseText loading={false}>Texto</BaseText>
      <Tooltip content="Ajuda">
        <Button>Hover me</Button>
      </Tooltip>
    </>
  );
}
```

### Variantes de Componentes

#### Badge

```tsx
<Badge variant="positive">Sucesso</Badge>
<Badge variant="alert">Atenção</Badge>
<Badge variant="negative">Erro</Badge>
<Badge variant="info">Info</Badge>
```

#### BaseText

```tsx
<BaseText
  loading={false}
  size="md" // xs | sm | md | lg | xl
  as="span" // span | div | p | label | strong | small
  skeletonHeight={22.5}
>
  Conteúdo
</BaseText>
```

---

## 🎯 Padrões de Código

### Componentes React

```tsx
// Template de componente

import type { ReactNode } from 'react';

interface MyComponentProps {
  title: string;
  children?: ReactNode;
  onSave?: () => void;
}

export function MyComponent({ title, children, onSave }: MyComponentProps) {
  // Estado
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleSave = () => {
    setLoading(true);
    onSave?.();
    setLoading(false);
  };

  // Render
  return (
    <div>
      <h1>{title}</h1>
      {children}
      <button onClick={handleSave}>Salvar</button>
    </div>
  );
}
```

### Services (API Calls)

```typescript
// services/customers/index.ts

import { httpGateway } from '@/lib/httpGateway';
import type { ICustomer } from './types';

export async function getCustomer(customerId: string): Promise<ICustomer> {
  const response = await httpGateway.get<ICustomer>(`/customers/${customerId}`);
  return response.data;
}

export async function updateCustomer(
  customerId: string,
  data: Partial<ICustomer>
): Promise<ICustomer> {
  const response = await httpGateway.put<ICustomer>(`/customers/${customerId}`, data);
  return response.data;
}
```

### Types

```typescript
// services/customers/types.ts

export interface ICustomer {
  id: string;
  name: string;
  email: string;
  birthDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomerFilters {
  search?: string;
  status?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}
```

---

## 📐 Estilos e CSS

### TailwindCSS

O projeto usa **Tailwind v4** com classes utilitárias.

```tsx
// ✅ Preferir Tailwind
<div className="flex items-center gap-2 p-4 bg-[var(--background-secondary)] rounded-xl">

// ⚠️ Inline styles apenas para valores dinâmicos
<div style={{ color: isActive ? 'var(--status-positive)' : 'var(--element-disabled)' }}>
```

### Classes Customizadas

Evite criar classes CSS customizadas. Use:

1. **Tailwind utilities** sempre que possível
2. **Variáveis CSS** para cores
3. **Componentes reutilizáveis** para padrões repetidos

```tsx
// ❌ EVITAR
.my-custom-card {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

// ✅ PREFERIR
<div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
```

### Responsividade

```tsx
// Breakpoints Tailwind
<div className="
  w-full          /* Mobile */
  md:w-1/2        /* Tablet */
  lg:w-1/3        /* Desktop */
">
```

---

## 🔗 Importações e Aliases

### Path Aliases Configurados

```json
{
  "@/components": "./components",
  "@/lib": "./lib",
  "@/hooks": "./hooks",
  "@/services": "./services",
  "@/types": "./types",
  "@/app": "./app"
}
```

### Ordem de Importações

```typescript
// 1. React e Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Libraries externas
import { BarChart } from 'recharts';
import { ChevronDown } from 'lucide-react';

// 3. Componentes UI
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// 4. Componentes Common
import { BaseText, Tooltip } from '@/components/common';

// 5. Services
import { getCustomer } from '@/services/customers';

// 6. Types
import type { ICustomer } from '@/services/customers/types';

// 7. Utilitários
import { formatCurrency } from '@/lib/utils';

// 8. Locais (mesma pasta)
import { TabContent } from './TabContent';
```

---

## 🧪 Boas Práticas

### TypeScript

1. **SEMPRE tipagem explícita** para props, funções públicas e retornos de API
2. **Use `type` para unions**, `interface` para objetos
3. **Prefixo `I` para interfaces** de dados de domínio

```typescript
// ✅ CORRETO
interface IUser {
  id: string;
  name: string;
}

type UserRole = 'admin' | 'user' | 'guest';

async function fetchUser(id: string): Promise<IUser> {
  // ...
}

// ❌ EVITAR
function fetchUser(id) {
  // Sem tipos
  // ...
}
```

### Estado e Efeitos

```tsx
// ✅ CORRETO
const [loading, setLoading] = useState<boolean>(false);
const [user, setUser] = useState<IUser | null>(null);

useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [customerId]);

// ❌ EVITAR useEffect sem dependências quando necessário
useEffect(() => {
  fetchData();
}, []); // Pode causar bugs se fetchData depende de props
```

### Formatação de Dados

```typescript
// Formatação de moeda
import currency from 'currency.js';

const formatted = currency(1234.56).format({
  symbol: 'R$ ',
  decimal: ',',
  separator: '.',
});

// Formatação de datas
const date = new Date(dateString);
const formatted = date.toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});
```

### Loading States

```tsx
// Use BaseText para skeleton loading
<BaseText loading={isLoading} skeletonHeight={24}>
  {value}
</BaseText>;

// Ou componente Loading
import { Loading } from '@/components/common';

{
  isLoading ? <Loading /> : <Content />;
}
```

---

## 🚫 Restrições e Proibições

### ❌ NÃO FAZER

1. **NÃO use cores hardcoded** (hex, rgb, etc.)
2. **NÃO crie componentes em `components/ui/`** - reserve para shadcn
3. **NÃO use `any`** em TypeScript sem justificativa
4. **NÃO use inline styles** para valores estáticos
5. **NÃO misture lógica de negócio em componentes de UI**
6. **NÃO faça fetch direto em componentes** - use services
7. **NÃO commite console.logs** em produção
8. **NÃO ignore erros de lint/type** sem resolver

### ✅ SEMPRE FAZER

1. **SEMPRE use variáveis CSS do Nebraska**
2. **SEMPRE tipagem TypeScript completa**
3. **SEMPRE trate erros em chamadas de API**
4. **SEMPRE use componentes do design system quando disponível**
5. **SEMPRE siga a estrutura de pastas definida**
6. **SEMPRE documente funções complexas**
7. **SEMPRE use path aliases (@/)**
8. **SEMPRE valide dados de entrada**

---

## 📦 Bibliotecas e Dependências

### Core

- **Next.js 15.5.4** (App Router)
- **React 19.1.0**
- **TypeScript 5**

### UI e Estilo

- **TailwindCSS 4**
- **Radix UI** (primitives)
- **lucide-react** (ícones)
- **class-variance-authority** (variantes)
- **@warrenbrasil/nebraska-tokens-web** (design tokens)

### Utilitários

- **axios** (HTTP client)
- **currency.js** (formatação monetária)
- **recharts** (gráficos)
- **zod** (validação)

### Adicionar Nova Dependência

```bash
# Sempre usar pnpm
pnpm add [package-name]

# Dev dependencies
pnpm add -D [package-name]
```

---

## 🚀 Checklist para Nova Tela/Feature

### Antes de Começar

- [ ] Revisar este documento
- [ ] Verificar componentes existentes que podem ser reutilizados
- [ ] Confirmar design no Figma/protótipo
- [ ] Validar endpoints de API necessários

### Durante o Desenvolvimento

- [ ] Criar pasta em `app/[feature-name]/`
- [ ] Criar `page.tsx` para a rota
- [ ] Criar componentes em `app/[feature-name]/components/`
- [ ] Criar service em `services/[service-name]/`
- [ ] Criar types em `services/[service-name]/types.ts`
- [ ] Usar APENAS variáveis CSS do Nebraska para cores
- [ ] Usar componentes do design system quando possível
- [ ] Tipagem TypeScript completa
- [ ] Loading states para operações assíncronas
- [ ] Tratamento de erros

### Antes de Submeter

- [ ] Build sem erros (`pnpm build`)
- [ ] Lint sem erros (`pnpm lint`)
- [ ] Sem console.logs
- [ ] Código formatado (`pnpm format`)
- [ ] Testar responsividade
- [ ] Validar cores com design system
- [ ] Documentar funções complexas

---

## 📞 Dúvidas?

- Revise componentes existentes para referência
- Consulte o time de design para questões de UI/UX
- Valide com tech lead antes de adicionar novas dependências

---

**Última atualização:** Novembro 2025
**Versão:** 1.0.0
