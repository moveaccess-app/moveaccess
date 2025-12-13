# MoveAccess Design System

Documentação completa do Design System para o projeto MoveAccess — sistema de gestão para academias.

---

## 1. VISÃO GERAL

### 1.1 Filosofia de Design
- **Estética**: Dark premium, sofisticado, tech-modern
- **Posicionamento**: SaaS profissional de alta qualidade
- **Prioridade**: Desktop-first, com responsividade completa
- **Tom Visual**: Minimalista com destaques vibrantes

### 1.2 Stack Tecnológico
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | ^18.3.1 | Framework UI |
| TypeScript | - | Tipagem estática |
| Tailwind CSS | - | Utilitários de estilo |
| Vite | - | Build tool |
| Radix UI | Vários | Componentes acessíveis |
| class-variance-authority | ^0.7.1 | Variantes de componentes |
| lucide-react | ^0.462.0 | Ícones |
| tailwind-merge | ^2.6.0 | Merge de classes |
| clsx | ^2.1.1 | Concatenação condicional |

---

## 2. CORES

### 2.1 Tokens de Cor (HSL)
Todas as cores são definidas em HSL no arquivo `src/index.css`:

```css
:root {
  /* === CORES BASE === */
  --background: 0 0% 4%;           /* Preto quase puro - fundo principal */
  --foreground: 0 0% 98%;          /* Branco suave - texto principal */

  /* === SUPERFÍCIES === */
  --card: 0 0% 7%;                 /* Cards e containers */
  --card-foreground: 0 0% 98%;     /* Texto em cards */
  --popover: 0 0% 7%;              /* Popovers e modais */
  --popover-foreground: 0 0% 98%;

  /* === COR PRIMÁRIA (LARANJA) === */
  --primary: 22 79% 52%;           /* #F26A1B - Laranja vibrante */
  --primary-foreground: 0 0% 100%; /* Branco puro sobre primário */

  /* === COR SECUNDÁRIA === */
  --secondary: 0 0% 12%;           /* Cinza escuro para elementos secundários */
  --secondary-foreground: 0 0% 98%;

  /* === ESTADOS MUTADOS === */
  --muted: 0 0% 15%;               /* Backgrounds sutis */
  --muted-foreground: 0 0% 60%;    /* Texto secundário/placeholder */

  /* === ACCENT (mesmo que primary) === */
  --accent: 22 79% 52%;
  --accent-foreground: 0 0% 100%;

  /* === DESTRUCTIVE (ERROS) === */
  --destructive: 0 84.2% 60.2%;    /* Vermelho para erros */
  --destructive-foreground: 210 40% 98%;

  /* === BORDAS E INPUTS === */
  --border: 0 0% 18%;              /* Bordas sutis */
  --input: 0 0% 18%;               /* Borda de inputs */
  --ring: 22 79% 52%;              /* Focus ring (laranja) */

  /* === BORDER RADIUS === */
  --radius: 0.75rem;               /* 12px - arredondamento padrão */
}
```

### 2.2 Gradientes Customizados
```css
--gradient-primary: linear-gradient(135deg, hsl(22 79% 52%) 0%, hsl(30 90% 60%) 100%);
--gradient-dark: linear-gradient(180deg, hsl(0 0% 7%) 0%, hsl(0 0% 4%) 100%);
--gradient-glow: radial-gradient(ellipse 80% 50% at 50% -20%, hsl(22 79% 52% / 0.15), transparent);
```

### 2.3 Sombras Customizadas
```css
--shadow-glow: 0 0 60px hsl(22 79% 52% / 0.2);    /* Glow laranja sutil */
--shadow-card: 0 4px 24px hsl(0 0% 0% / 0.4);     /* Sombra para cards */
```

### 2.4 Uso Correto de Cores (CRÍTICO)
```tsx
// ❌ ERRADO - Nunca usar cores diretamente
<div className="bg-black text-white border-orange-500">

// ✅ CORRETO - Sempre usar tokens semânticos
<div className="bg-background text-foreground border-primary">
<div className="bg-card text-card-foreground">
<div className="text-muted-foreground">
<div className="bg-primary text-primary-foreground">
```

---

## 3. TIPOGRAFIA

### 3.1 Fonte Principal
```css
font-family: 'Inter', system-ui, sans-serif;
```
Importada via Google Fonts no `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
```

### 3.2 Pesos Disponíveis
| Peso | Classe Tailwind | Uso |
|------|-----------------|-----|
| 400 | `font-normal` | Texto corrido |
| 500 | `font-medium` | Labels, links |
| 600 | `font-semibold` | Botões, subtítulos |
| 700 | `font-bold` | Títulos menores |
| 800 | `font-extrabold` | Títulos importantes |
| 900 | `font-black` | Headlines hero |

### 3.3 Escala Tipográfica
```tsx
// Headlines
<h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
<h3 className="text-2xl font-semibold">

// Body
<p className="text-lg md:text-xl text-muted-foreground">  // Lead
<p className="text-base">                                  // Normal
<p className="text-sm text-muted-foreground">             // Small/caption

// Micro
<span className="text-xs text-muted-foreground">          // Badges, labels
```

### 3.4 Efeito de Texto Gradiente
```tsx
<span className="text-gradient">Texto com gradiente</span>

// Definido em index.css:
.text-gradient {
  @apply bg-clip-text text-transparent;
  background-image: var(--gradient-primary);
}
```

---

## 4. ESPAÇAMENTO E LAYOUT

### 4.1 Containers
```css
.container-narrow { max-width: 72rem; margin: 0 auto; }  /* 1152px */
.container-wide { max-width: 80rem; margin: 0 auto; }    /* 1280px */
```

### 4.2 Padding de Seção
```css
.section-padding {
  @apply px-6 py-20 md:px-12 lg:px-24 lg:py-32;
}
```

### 4.3 Breakpoints (Tailwind padrão)
| Breakpoint | Largura | Uso |
|------------|---------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeno |
| `xl` | 1280px | Desktop |
| `2xl` | 1400px | Desktop grande (container) |

### 4.4 Border Radius
```css
--radius: 0.75rem;  /* 12px - base */

/* Variações automáticas */
border-radius-lg: var(--radius);           /* 12px */
border-radius-md: calc(var(--radius) - 2px); /* 10px */
border-radius-sm: calc(var(--radius) - 4px); /* 8px */
```

---

## 5. COMPONENTES

### 5.1 Button (`src/components/ui/button.tsx`)

**Biblioteca**: Radix UI Slot + class-variance-authority

#### Variantes de Estilo
```tsx
// DEFAULT - Botão primário com sombra laranja
<Button variant="default">Ação primária</Button>
// bg-primary, shadow-lg shadow-primary/25, hover elevação

// HERO - Gradiente para CTAs principais
<Button variant="hero" size="lg">CTA Principal</Button>
// bg-gradient-primary, shadow mais forte, hover scale

// HERO-OUTLINE - Secundário para hero sections
<Button variant="hero-outline" size="lg">Ação secundária</Button>
// border, bg-card/50, backdrop-blur

// OUTLINE - Bordas sutis
<Button variant="outline">Ação terciária</Button>

// GHOST - Sem background
<Button variant="ghost">Link discreto</Button>

// DESTRUCTIVE - Ações perigosas
<Button variant="destructive">Deletar</Button>

// SECONDARY - Background cinza
<Button variant="secondary">Alternativa</Button>

// LINK - Estilo de link
<Button variant="link">Ver mais</Button>
```

#### Tamanhos
```tsx
<Button size="sm">Pequeno</Button>      // h-9 px-4
<Button size="default">Padrão</Button>  // h-11 px-6
<Button size="lg">Grande</Button>       // h-14 px-8 text-base
<Button size="icon">🔍</Button>          // h-10 w-10
```

#### Props Especiais
```tsx
<Button asChild>           // Renderiza como filho (ex: Link)
  <Link to="/page">Ir</Link>
</Button>
```

### 5.2 Card (`src/components/ui/card.tsx`)

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card className="glass">  // Variação glassmorphism
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição do card</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo principal
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

**Estilos base**:
- `rounded-lg border bg-card text-card-foreground shadow-sm`

### 5.3 Input (`src/components/ui/input.tsx`)

```tsx
import { Input } from "@/components/ui/input";

<Input 
  type="email" 
  placeholder="seu@email.com"
  className="bg-secondary/50 border-border"
/>
```

**Estilos base**:
- `h-10 rounded-md border-input bg-background`
- Focus: `ring-2 ring-ring ring-offset-2`
- Placeholder: `text-muted-foreground`

### 5.4 Label (`src/components/ui/label.tsx`)
```tsx
import { Label } from "@/components/ui/label";

<Label htmlFor="email" className="text-foreground">
  Email
</Label>
```

---

## 6. UTILITÁRIOS CSS CUSTOMIZADOS

### 6.1 Classes de Utilitário (`index.css`)

```css
/* Gradiente de texto */
.text-gradient { ... }

/* Backgrounds */
.bg-gradient-primary { background-image: var(--gradient-primary); }
.bg-gradient-glow { background-image: var(--gradient-glow); }

/* Sombras */
.shadow-glow { box-shadow: var(--shadow-glow); }
.shadow-card { box-shadow: var(--shadow-card); }

/* Glassmorphism */
.glass {
  @apply bg-card/80 backdrop-blur-xl border border-border/50;
}
```

### 6.2 Uso de Glassmorphism
```tsx
// Card com efeito glass
<div className="glass rounded-2xl p-6">
  Conteúdo com blur e transparência
</div>

// Alternativa inline
<div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
```

---

## 7. ANIMAÇÕES

### 7.1 Keyframes Definidos (`tailwind.config.ts`)

```js
keyframes: {
  "fade-up": {
    "0%": { opacity: "0", transform: "translateY(30px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  "fade-in": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" },
  },
  "scale-in": {
    "0%": { opacity: "0", transform: "scale(0.95)" },
    "100%": { opacity: "1", transform: "scale(1)" },
  },
  "glow-pulse": {
    "0%, 100%": { opacity: "0.4" },
    "50%": { opacity: "0.8" },
  },
  "float": {
    "0%, 100%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-10px)" },
  },
}
```

### 7.2 Classes de Animação

```tsx
// Fade up (entrada de elementos)
<div className="opacity-0 animate-fade-up" style={{ animationDelay: "0.2s" }}>

// Scale in (entrada com escala)
<div className="opacity-0 animate-scale-in">

// Fade in simples
<div className="animate-fade-in">

// Glow pulsante (elementos decorativos)
<div className="animate-glow-pulse">

// Float (elementos flutuantes)
<div className="animate-float">

// Accordion (Radix)
<div className="animate-accordion-down">
<div className="animate-accordion-up">
```

### 7.3 Padrão de Stagger (Delay Sequencial)
```tsx
// Elementos aparecem em sequência
{items.map((item, index) => (
  <div 
    key={index}
    className="opacity-0 animate-fade-up"
    style={{ animationDelay: `${0.1 + index * 0.1}s` }}
  >
    {item}
  </div>
))}
```

### 7.4 Transições de Hover (Botões)
```css
/* Padrão nos botões */
transition-all duration-300

/* Efeitos de hover */
hover:-translate-y-0.5     /* Elevação sutil */
hover:-translate-y-1       /* Elevação maior */
hover:scale-[1.02]         /* Escala sutil */
hover:shadow-xl            /* Sombra aumentada */
```

---

## 8. ÍCONES

### 8.1 Biblioteca: Lucide React

```tsx
import { ArrowRight, Play, Check, X, Eye, EyeOff } from "lucide-react";

// Uso básico
<ArrowRight className="w-5 h-5" />

// Com cor do tema
<Check className="w-4 h-4 text-primary" />
<X className="w-4 h-4 text-muted-foreground" />

// Dentro de botões (tamanho automático via [&_svg]:size-4)
<Button>
  Continuar <ArrowRight className="ml-1" />
</Button>
```

### 8.2 Padrões de Uso
- **Tamanho em botões**: 16px (`size-4`)
- **Tamanho standalone**: 20px (`w-5 h-5`) ou 24px (`w-6 h-6`)
- **Cor**: Herdar do texto (`currentColor`) ou usar tokens
- **Estilo**: Outline (stroke), nunca filled

---

## 9. PADRÕES DE LAYOUT

### 9.1 Hero Section
```tsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
  {/* Background decorativo */}
  <div className="absolute inset-0 bg-gradient-glow" />
  <div className="absolute ... bg-primary/5 rounded-full blur-[120px] animate-glow-pulse" />

  <div className="container-wide mx-auto px-6 lg:px-12 relative z-10">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Conteúdo lado esquerdo */}
      {/* Visual/Mockup lado direito */}
    </div>
  </div>
</section>
```

### 9.2 Seção de Features
```tsx
<section className="section-padding">
  <div className="container-wide mx-auto">
    {/* Header da seção */}
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Título</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">Descrição</p>
    </div>
    
    {/* Grid de cards */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => (
        <Card key={feature.id} className="glass p-6">
          {/* Conteúdo */}
        </Card>
      ))}
    </div>
  </div>
</section>
```

### 9.3 Layout de Autenticação (2 Colunas)
```tsx
<div className="min-h-screen flex">
  {/* Coluna esquerda - Branding */}
  <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark relative">
    {/* Decorativos + texto de valor */}
  </div>

  {/* Coluna direita - Formulário */}
  <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
    <Card className="w-full max-w-md glass">
      {/* Formulário */}
    </Card>
  </div>
</div>
```

### 9.4 Cards de Planos (Pricing)
```tsx
<div className="grid md:grid-cols-3 gap-6">
  {plans.map((plan) => (
    <Card className={cn(
      "glass p-6 relative",
      plan.popular && "border-primary ring-2 ring-primary/20"
    )}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
            Recomendado
          </span>
        </div>
      )}
      {/* Conteúdo do plano */}
    </Card>
  ))}
</div>
```

---

## 10. ESTADOS DE COMPONENTES

### 10.1 Loading
```tsx
// Spinner simples
<div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />

// Botão com loading
<Button disabled>
  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
  Processando...
</Button>
```

### 10.2 Disabled
```tsx
// Automático via Tailwind
<Button disabled>  // opacity-50 pointer-events-none
<Input disabled>   // cursor-not-allowed opacity-50
```

### 10.3 Focus
```tsx
// Automático nos componentes
focus-visible:outline-none
focus-visible:ring-2 
focus-visible:ring-ring 
focus-visible:ring-offset-2
```

### 10.4 Hover (Cards)
```tsx
<Card className="glass transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
```

---

## 11. UTILITÁRIO DE MERGE DE CLASSES

### 11.1 Função `cn()` (`src/lib/utils.ts`)
```tsx
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 11.2 Uso
```tsx
import { cn } from "@/lib/utils";

// Merge condicional
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "special" && "special-classes",
  className // props externas
)}>
```

---

## 12. ARQUITETURA DE COMPONENTES

### 12.1 Estrutura de Pastas
```
src/
├── components/
│   ├── ui/           # Componentes base (Shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── landing/      # Componentes específicos da landing
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   └── ...
│   └── NavLink.tsx   # Componentes compartilhados
├── pages/            # Páginas/rotas
│   ├── Index.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── ...
├── hooks/            # Custom hooks
├── lib/              # Utilitários
└── index.css         # Estilos globais + tokens
```

### 12.2 Convenções de Nomenclatura
- **Componentes**: PascalCase (`HeroSection.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useToast.ts`)
- **Utilitários**: camelCase (`utils.ts`)
- **CSS Classes**: kebab-case (`section-padding`)
- **CSS Variables**: kebab-case com prefixo `--` (`--primary`)

---

## 13. RESPONSIVIDADE

### 13.1 Mobile-First (Tailwind)
```tsx
// Sempre definir mobile primeiro, depois breakpoints maiores
<div className="
  px-4        // Mobile
  md:px-8     // Tablet
  lg:px-12    // Desktop
  xl:px-16    // Desktop grande
">
```

### 13.2 Padrões Comuns
```tsx
// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Flex direction
<div className="flex flex-col lg:flex-row gap-4">

// Visibilidade
<div className="hidden lg:block">     // Só desktop
<div className="block lg:hidden">     // Só mobile/tablet

// Tipografia responsiva
<h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
```

---

## 14. ACESSIBILIDADE

### 14.1 Padrões Implementados
- **Focus visible**: Ring de foco em todos os interativos
- **Semantic HTML**: `<section>`, `<nav>`, `<main>`, `<header>`
- **Labels**: Todos os inputs têm labels associados
- **Contraste**: Cores seguem WCAG (verificar com ferramentas)
- **Radix UI**: Componentes com acessibilidade built-in

### 14.2 Exemplos
```tsx
// Label explícito
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" aria-describedby="email-error" />

// Botão com texto acessível
<Button aria-label="Fechar modal">
  <X className="w-4 h-4" />
</Button>

// Link com propósito claro
<a href="/plans" className="...">
  Ver planos disponíveis
</a>
```

---

## 15. CHECKLIST DE IMPLEMENTAÇÃO

Ao criar novos componentes ou páginas, verificar:

- [ ] Usar tokens de cor (`bg-background`, não `bg-black`)
- [ ] Usar fonte Inter via `font-sans`
- [ ] Aplicar `--radius` para arredondamentos consistentes
- [ ] Usar classes de animação para entradas suaves
- [ ] Manter hierarquia tipográfica
- [ ] Testar em breakpoints principais (mobile, tablet, desktop)
- [ ] Usar `cn()` para merge de classes
- [ ] Componentes interativos têm estados hover/focus
- [ ] Cards usam classe `glass` quando apropriado
- [ ] Botões CTAs usam variante `hero` ou `default`
- [ ] Espaçamentos usam escala Tailwind (4, 6, 8, 12, 16, 20, 24...)

---

## 16. REFERÊNCIAS RÁPIDAS

### Cores Principais
| Token | Valor Visual | Uso |
|-------|-------------|-----|
| `bg-background` | Preto #0A0A0A | Fundo principal |
| `bg-card` | Cinza #121212 | Cards, containers |
| `bg-secondary` | Cinza #1F1F1F | Backgrounds alternativos |
| `bg-primary` | Laranja #F26A1B | CTAs, destaques |
| `text-foreground` | Branco #FAFAFA | Texto principal |
| `text-muted-foreground` | Cinza #999999 | Texto secundário |
| `border-border` | Cinza #2E2E2E | Bordas |

### Classes Utilitárias
| Classe | Efeito |
|--------|--------|
| `.glass` | Glassmorphism (blur + transparência) |
| `.text-gradient` | Texto com gradiente laranja |
| `.bg-gradient-primary` | Background gradiente laranja |
| `.shadow-glow` | Glow laranja sutil |
| `.shadow-card` | Sombra para cards |
| `.section-padding` | Padding padrão de seções |
| `.container-wide` | Container max-width 80rem |

### Animações
| Classe | Duração | Efeito |
|--------|---------|--------|
| `animate-fade-up` | 0.6s | Fade + slide up |
| `animate-fade-in` | 0.5s | Fade simples |
| `animate-scale-in` | 0.4s | Fade + scale |
| `animate-float` | 6s | Flutuação contínua |
| `animate-glow-pulse` | 3s | Pulsação de opacidade |

---

*Última atualização: Dezembro 2024*
*Projeto: MoveAccess — Sistema de Gestão para Academias*
