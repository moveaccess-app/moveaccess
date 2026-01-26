# 🎨 Sidebar Elegante - MoveAccess

## Visão Geral

Sidebar moderna e funcional com animações suaves, expansível/minimizável, perfil de usuário integrado e navegação com ícones.

## ✨ Recursos

- ✅ **Expansível/Minimizável**: Toggle suave entre estados com animações fluidas
- ✅ **Perfil de Usuário**: Exibe avatar, nome, email e role do usuário logado
- ✅ **Ícones Lucide**: Todos os itens de navegação possuem ícones visuais
- ✅ **Indicador de Rota Ativa**: Destaque visual da página atual com animação de layout ID
- ✅ **Animações Framer Motion**: Transições suaves e profissionais
- ✅ **Botão de Logout**: Integrado na sidebar com estilo destrutivo
- ✅ **Responsivo**: Adapta-se perfeitamente a diferentes tamanhos de tela
- ✅ **Totalmente Tipado**: TypeScript com tipos completos
- ✅ **Design System**: Segue todas as variáveis CSS do MoveAccess
- ✅ **Acessibilidade**: ARIA labels e navegação por teclado

## 📦 Dependências

```json
{
  "framer-motion": "^12.24.7",
  "lucide-react": "latest",
  "next": "15+",
  "react": "19+"
}
```

## 🚀 Uso Básico

```tsx
import { Sidebar } from '@/components/common/Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

## 🎯 Uso Avançado

### Com Perfil Personalizado

```tsx
import { Sidebar } from '@/components/common/Sidebar';

export default function Layout({ children }) {
  const usuario = {
    name: 'João Silva',
    email: 'joao.silva@moveaccess.com',
    role: 'Gerente',
    avatarUrl: 'https://exemplo.com/avatar.jpg',
  };

  return (
    <div className="flex">
      <Sidebar user={usuario} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Com Logout Personalizado

```tsx
import { Sidebar } from '@/components/common/Sidebar';
import { useRouter } from 'next/navigation';

export default function Layout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    // Lógica personalizada de logout
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="flex">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Iniciando Minimizada

```tsx
<Sidebar defaultExpanded={false} />
```

## 📋 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `user` | `UserProfile?` | `{ name: "Administrador", ... }` | Informações do usuário logado |
| `onLogout` | `() => void` | Remove do localStorage | Callback ao clicar em logout |
| `className` | `string?` | - | Classes CSS adicionais |
| `defaultExpanded` | `boolean` | `true` | Inicia expandida ou minimizada |

### Tipo UserProfile

```typescript
interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string; // Opcional - mostra iniciais se não fornecido
}
```

## 🎨 Personalização

### Modificar Itens de Navegação

Edite o array `navItems` em `src/components/common/Sidebar.tsx`:

```typescript
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Produtos',
    href: '/produtos',
    icon: Package,
    badge: 5, // Badge opcional com contador
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: Settings,
    isSeparator: true, // Adiciona espaço antes deste item
  },
];
```

### Adicionar Novos Ícones

```typescript
import { 
  // Adicione novos ícones aqui
  Package,
  ShoppingCart,
  Bell
} from 'lucide-react';
```

Veja todos os ícones disponíveis em: https://lucide.dev/icons

## 🎭 Animações

A sidebar utiliza diversas animações para uma experiência fluida:

- **Expansão/Minimização**: Transição suave de largura com spring animation
- **Fade In/Out**: Textos aparecem e desaparecem suavemente
- **Layout ID**: Indicador de rota ativa move-se fluidamente entre itens
- **Stagger Children**: Itens de menu aparecem em sequência
- **Hover Effects**: Scale e opacity em botões e ícones

## 🔧 Estrutura de Código

```
Sidebar.tsx
├── Types & Interfaces
│   ├── NavItem
│   ├── UserProfile
│   └── SidebarProps
├── Animation Variants
│   ├── sidebarVariants (expand/collapse)
│   ├── contentVariants (stagger)
│   └── itemVariants (fade + slide)
├── Navigation Items (configurável)
└── Component
    ├── Header (logo + toggle button)
    ├── User Profile Section
    ├── Navigation Links
    ├── Logout Button
    └── Version Footer
```

## 🎯 Demo

Acesse `/sidebar-demo` para ver a sidebar em ação com documentação interativa.

## 🛠️ Desenvolvimento

### Adicionar nova rota

1. Adicione o item em `navItems`
2. Importe o ícone do `lucide-react`
3. A rota será automaticamente destacada quando ativa

### Modificar animações

Ajuste os valores em `sidebarVariants`, `contentVariants` ou `itemVariants`:

```typescript
const sidebarVariants = {
  expanded: {
    width: 280, // Largura quando expandida
    transition: {
      type: 'spring' as const,
      stiffness: 300, // Rigidez da mola
      damping: 30, // Amortecimento
    },
  },
  // ...
};
```

## 🎨 Design System

A sidebar utiliza todas as variáveis CSS do MoveAccess:

- `--background-primary`: Fundo da sidebar
- `--element-primary`: Texto principal
- `--element-secondary`: Texto secundário
- `--divider-primary`: Bordas e separadores
- `--status-info`: Cor primária (logo, indicador ativo)
- `--status-positive`: Indicador online do avatar
- `--status-negative`: Botão de logout

## 📱 Responsividade

A sidebar se adapta automaticamente:

- **Desktop**: Largura fixa de 280px (expandida) ou 80px (minimizada)
- **Tablet**: Funciona perfeitamente com toggle
- **Mobile**: Considere usar um drawer overlay (implementação futura)

## ♿ Acessibilidade

- ARIA labels em todos os botões
- `aria-current="page"` na rota ativa
- `aria-hidden` em separadores
- Navegação por teclado totalmente funcional
- Contraste adequado em todos os estados

## 🚀 Performance

- Animações otimizadas com Framer Motion
- Lazy loading de ícones via Lucide React
- Memoização de funções com useCallback
- Re-renders minimizados com AnimatePresence

## 📝 Notas

- Avatar usa iniciais se `avatarUrl` não fornecido
- Logout padrão remove `moveaccess_auth_user` do localStorage
- Versão atual: v1.0.0 (exibida no footer quando expandida)
- Suporte a badges em itens de navegação (opcional)

## 🔗 Links Úteis

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Desenvolvido com ❤️ pela equipe MoveAccess**
