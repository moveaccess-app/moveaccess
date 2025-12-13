# MoveAccess Design System

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Status:** Fundação estabelecida

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tokens Visuais](#tokens-visuais)
3. [Componentes Base](#componentes-base)
4. [Layouts](#layouts)
5. [Princípios de Uso](#princípios-de-uso)
6. [O Que NÃO Fazer](#o-que-não-fazer)

---

## Visão Geral

Este Design System consolida a identidade visual do MoveAccess com base na Landing Page de referência (Doc/Lovable). Ele fornece:

- **Tokens visuais** reutilizáveis (cores, tipografia, espaçamentos)
- **Componentes base** sem lógica de negócio
- **Layouts estruturais** (stubs) para diferentes contextos
- **Fundação sólida** para desenvolvimento futuro de UI

### Princípios Fundamentais

✅ **Consistência visual** entre todas as áreas do app  
✅ **Componentes reutilizáveis** e flexíveis via props  
✅ **Sem lógica de negócio** nos componentes base  
✅ **Design System como fonte única da verdade**

---

## Tokens Visuais

Todos os tokens estão definidos em `src/app/globals.css` usando variáveis CSS.

### Paleta de Cores

#### Cores Base (HSL format)

```css
--background: 0 0% 4%;           /* Fundo escuro principal */
--foreground: 0 0% 98%;          /* Texto principal */
--card: 0 0% 7%;                 /* Fundo de cards */
--card-foreground: 0 0% 98%;     /* Texto em cards */
```

#### Cores Semânticas

```css
--primary: 22 79% 52%;           /* Laranja/coral (marca) */
--primary-foreground: 0 0% 100%; /* Texto sobre primary */
--secondary: 0 0% 12%;           /* Cinza escuro */
--muted: 0 0% 15%;               /* Tons sutis */
--muted-foreground: 0 0% 60%;    /* Texto secundário */
--accent: 22 79% 52%;            /* Igual ao primary */
--destructive: 0 84.2% 60.2%;    /* Vermelho para ações destrutivas */
```

#### Cores de Formulário

```css
--border: 0 0% 18%;              /* Bordas padrão */
--input: 0 0% 18%;               /* Background de inputs */
--ring: 22 79% 52%;              /* Focus ring (primary) */
```

### Tipografia

#### Font Family

```css
font-family: 'Inter', system-ui, sans-serif;
```

A fonte Inter é carregada via Google Fonts em `globals.css`.

#### Escalas de Tamanho

Definidas no componente `Text` e `Heading`:

- **Heading:** h1, h2, h3, h4, h5, h6 (responsivos)
- **Text:** xs, sm, base, lg, xl
- **Weight:** normal, medium, semibold, bold

### Espaçamentos

Utilizamos o sistema de espaçamento padrão do Tailwind CSS (múltiplos de 0.25rem).

**Classes utilitárias customizadas:**

```css
.section-padding      /* px-6 py-20 md:px-12 lg:px-24 lg:py-32 */
.container-narrow     /* max-w-6xl mx-auto */
.container-wide       /* max-w-7xl mx-auto */
```

### Border Radius

```css
--radius: 0.75rem;   /* Radius padrão (12px) */
```

- `rounded-lg`: usa --radius
- `rounded-md`: --radius - 2px
- `rounded-sm`: --radius - 4px
- `rounded-xl`: maior que padrão
- `rounded-full`: círculos e pills

### Sombras

```css
--shadow-glow: 0 0 60px hsl(22 79% 52% / 0.2);
--shadow-card: 0 4px 24px hsl(0 0% 0% / 0.4);
```

**Classes utilitárias:**

- `.shadow-glow`: efeito de brilho ao redor
- `.shadow-card`: sombra para cards elevados

### Gradientes

```css
--gradient-primary: linear-gradient(135deg, hsl(22 79% 52%) 0%, hsl(30 90% 60%) 100%);
--gradient-glow: radial-gradient(ellipse 80% 50% at 50% -20%, hsl(22 79% 52% / 0.15), transparent);
```

**Classes utilitárias:**

- `.text-gradient`: texto com gradiente primary
- `.bg-gradient-primary`: background com gradiente
- `.bg-gradient-glow`: glow radial sutil

### Efeitos Especiais

#### Glass Morphism

```css
.glass {
  @apply bg-card/80 backdrop-blur-xl border border-border/50;
}
```

Usado em navbars, modais e overlays.

---

## Componentes Base

Todos os componentes estão em `src/components/ui/`.

### Button

**Arquivo:** `src/components/ui/Button.tsx`

#### Variantes

- `default`: botão primary com shadow e hover lift
- `destructive`: ações destrutivas (vermelho)
- `outline`: botão com borda, fundo transparente
- `secondary`: fundo secondary (cinza escuro)
- `ghost`: hover sutil, sem fundo
- `link`: texto com underline
- `hero`: gradiente primary com efeitos especiais
- `hero-outline`: outline com glass effect

#### Tamanhos

- `sm`: altura 9 (36px), texto xs
- `default`: altura 11 (44px), texto sm
- `lg`: altura 14 (56px), texto base
- `icon`: 10x10 (40x40px)

#### Exemplo de Uso

```tsx
import { Button } from "@/components/ui";

<Button variant="default" size="lg">
  Começar Agora
</Button>

<Button variant="hero" size="lg">
  Testar Demonstração
</Button>

<Button variant="outline" size="sm">
  Cancelar
</Button>
```

---

### Input

**Arquivo:** `src/components/ui/Input.tsx`

Campo de entrada de texto padrão com estilos do Design System.

#### Exemplo de Uso

```tsx
import { Input } from "@/components/ui";

<Input type="email" placeholder="seu@email.com" />
<Input type="password" placeholder="Senha" />
```

---

### Text & Heading

**Arquivo:** `src/components/ui/Text.tsx`

Componentes de tipografia com variações responsivas.

#### Heading

Variações: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

```tsx
import { Heading } from "@/components/ui";

<Heading level="h1" gradient>
  O novo padrão de gestão para academias.
</Heading>

<Heading level="h3">
  Funcionalidades
</Heading>
```

#### Text

Variações de tamanho, peso e cor.

```tsx
import { Text } from "@/components/ui";

<Text size="lg" color="muted">
  Controle de acesso, financeiro e muito mais.
</Text>

<Text size="sm" weight="medium">
  Saiba mais
</Text>
```

---

### Card

**Arquivo:** `src/components/ui/Card.tsx`

Container com borda, background e shadow.

#### Sub-componentes

- `Card`: container principal
- `CardHeader`: cabeçalho com padding
- `CardTitle`: título do card (h3)
- `CardDescription`: descrição secundária
- `CardContent`: conteúdo principal
- `CardFooter`: rodapé com flex

#### Exemplo de Uso

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

<Card>
  <CardHeader>
    <CardTitle>Controle de Acesso</CardTitle>
    <CardDescription>
      Gerencie entrada e saída de alunos
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Conteúdo do card aqui</p>
  </CardContent>
</Card>
```

---

### Badge

**Arquivo:** `src/components/ui/Badge.tsx`

Pequeno indicador visual (tag, status).

#### Variantes

- `default`: primary
- `secondary`: cinza
- `destructive`: vermelho
- `outline`: apenas borda
- `success`: verde
- `warning`: amarelo
- `info`: azul

#### Exemplo de Uso

```tsx
import { Badge } from "@/components/ui";

<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="outline">Tag</Badge>
```

---

### Divider

**Arquivo:** `src/components/ui/Divider.tsx`

Linha separadora horizontal ou vertical.

#### Exemplo de Uso

```tsx
import { Divider } from "@/components/ui";

<Divider orientation="horizontal" />
<Divider orientation="vertical" className="h-24" />
```

---

### Container & Section

**Arquivo:** `src/components/ui/Container.tsx`

Primitivos de layout para estruturar páginas.

#### Container

Centraliza conteúdo com max-width.

**Tamanhos:**

- `narrow`: max-w-6xl
- `wide`: max-w-7xl (padrão)
- `full`: sem limite

**Padding:**

- `none`: sem padding
- `default`: px-6 lg:px-12
- `section`: padding completo de seção

```tsx
import { Container } from "@/components/ui";

<Container size="wide" padding="default">
  Conteúdo centralizado
</Container>
```

#### Section

Wrapper semântico para seções de página.

**Spacing:**

- `none`: sem padding vertical
- `default`: py-16 md:py-24
- `large`: py-20 md:py-32 lg:py-40

**Background:**

- `none`: transparente
- `default`: bg-background
- `card`: bg-card
- `muted`: bg-muted/30

```tsx
import { Section } from "@/components/ui";

<Section spacing="large" background="muted">
  Seção com espaçamento grande
</Section>
```

---

## Layouts

Todos os layouts estão em `src/components/layouts/`.

### MarketingLayout

**Arquivo:** `src/components/layouts/MarketingLayout.tsx`

Layout para páginas públicas de marketing (landing, sobre, etc.).

#### Estrutura

- Header fixo com logo (stub)
- Main content area
- Footer simples

#### ⚠️ Limitações (stub)

- Navegação final não implementada
- SEO tags não incluídas
- Analytics não integrado

#### Exemplo de Uso

```tsx
import { MarketingLayout } from "@/components/layouts";

export default function LandingPage() {
  return (
    <MarketingLayout>
      <h1>Bem-vindo ao MoveAccess</h1>
    </MarketingLayout>
  );
}
```

---

### AuthLayout

**Arquivo:** `src/components/layouts/AuthLayout.tsx`

Layout para páginas de autenticação (login, signup, recuperação de senha).

#### Estrutura

- Background com efeitos de glow
- Logo centralizado
- Container centralizado para formulário

#### ⚠️ Limitações (stub)

- Não inclui lógica de autenticação
- Não valida sessão
- Não redireciona usuários logados

#### Exemplo de Uso

```tsx
import { AuthLayout } from "@/components/layouts";

export default function LoginPage() {
  return (
    <AuthLayout>
      <form>{/* Formulário de login */}</form>
    </AuthLayout>
  );
}
```

---

### AppLayout

**Arquivo:** `src/components/layouts/AppLayout.tsx`

Layout para área autenticada do app (dashboard, configurações, etc.).

#### Estrutura

- Header sticky com logo
- Sidebar (placeholder com loading states)
- Main content area

#### ⚠️ Limitações (stub)

- Sidebar não tem navegação real
- Não há menu de usuário
- Sem verificação de permissões
- Notificações não implementadas

#### Exemplo de Uso

```tsx
import { AppLayout } from "@/components/layouts";

export default function DashboardPage() {
  return (
    <AppLayout>
      <h1>Dashboard</h1>
    </AppLayout>
  );
}
```

---

## Princípios de Uso

### ✅ O Que Fazer

1. **Sempre use os tokens do Design System**
   - Cores: use as variáveis CSS (ex: `text-primary`, `bg-card`)
   - Espaçamentos: use as classes Tailwind padrão
   - Tipografia: use componentes `Text` e `Heading`

2. **Componha componentes base**
   - Combine `Button`, `Card`, `Input`, etc. para criar interfaces
   - Use props para variações

3. **Estenda via className**
   - Todos os componentes aceitam `className` para customizações pontuais
   - Use a função `cn()` de `@/lib/utils` para combinar classes

4. **Siga a hierarquia de layouts**
   - Use `MarketingLayout` para landing
   - Use `AuthLayout` para login/signup
   - Use `AppLayout` para área logada

### Exemplo de Composição

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Text } from "@/components/ui";

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="hover:shadow-glow transition-all">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Text color="muted">{description}</Text>
        <Button variant="outline" size="sm" className="mt-4">
          Saiba mais
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## O Que NÃO Fazer

### ❌ Evite Estas Práticas

1. **Não crie estilos "pontuais" fora do Design System**
   ```tsx
   {/* ❌ ERRADO */}
   <div style={{ color: "#ff6600", padding: "20px" }}>...</div>
   
   {/* ✅ CORRETO */}
   <div className="text-primary p-5">...</div>
   ```

2. **Não adicione lógica de negócio nos componentes base**
   ```tsx
   {/* ❌ ERRADO: lógica de plano no componente Button */}
   <Button onClick={() => checkPlanPermission()}>...</Button>
   
   {/* ✅ CORRETO: lógica na página/feature, Button apenas renderiza */}
   <Button onClick={handleAction}>...</Button>
   ```

3. **Não crie variantes baseadas em suposições de produto**
   ```tsx
   {/* ❌ ERRADO: variante específica de feature */}
   <Button variant="premium-upgrade">Upgrade</Button>
   
   {/* ✅ CORRETO: use variante base + composição */}
   <Button variant="hero">
     <StarIcon /> Upgrade para Premium
   </Button>
   ```

4. **Não copie CSS bruto do Lovable sem adaptação**
   - O Lovable é referência visual, não código final
   - Sempre adapte para os tokens deste Design System

5. **Não modifique os layouts com regras específicas de negócio**
   - Layouts são estruturais, não devem conhecer planos, permissões, etc.

6. **Não antecipe decisões de produto**
   - Ex: não crie componente "PlanCard" com preços hardcoded
   - Crie componentes genéricos que possam receber dados via props

---

## Próximos Passos

Este Design System é a **fundação**. Tasks futuras incluirão:

1. **Implementação de páginas completas** usando estes componentes
2. **Componentes complexos** (modais, dropdowns, tabs, etc.) conforme necessário
3. **Integração com lógica de negócio** nas camadas apropriadas
4. **Animações e microinterações** baseadas nos exemplos do Lovable
5. **Temas claros/escuros** (atualmente apenas dark theme)
6. **Componentes específicos de domínio** (ex: UserCard, AccessLog, etc.)

---

## Recursos

- **Lovable Reference:** `Doc/Lovable/move-access-main/`
- **Clean Architecture Guide:** `Doc/Projeto/CLEAN_ARCHITECTURE_GUIDE.md`
- **Tailwind CSS v4:** https://tailwindcss.com/docs
- **Inter Font:** https://fonts.google.com/specimen/Inter

---

**Última atualização:** Dezembro 2024  
**Mantido por:** Time MoveAccess
