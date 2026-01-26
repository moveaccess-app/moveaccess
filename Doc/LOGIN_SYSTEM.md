# 🔐 Sistema de Login - MoveAccess

Sistema de autenticação com design moderno e caprichado, preparado para futura integração com Supabase.

## ✨ Características

- 🎨 **Design Moderno**: Gradientes, animações suaves e UI caprichada
- 🏢 **Dois Portais Distintos**: Equipe e Alunos separados
- 🔒 **Segurança**: Rate limiting, mensagens genéricas de erro
- 📱 **Mobile First**: Responsivo e otimizado para todos os dispositivos
- 🎭 **Animações**: Fade-in, slide-up, shake para feedbacks
- 🖼️ **Logo Personalizado**: SVG customizado do MoveAccess

## 🚪 Acessos Disponíveis

### 👔 Login da Equipe → `/login`

**Administrador**
- Email: `admin@moveaccess.com`
- Senha: `Admin@123`
- Acesso: Total

**Gerente**
- Email: `gerente@moveaccess.com`
- Senha: `Gerente@123`
- Acesso: Gerencial

**Recepcionista**
- Email: `recepcionista@moveaccess.com`
- Senha: `Recep@123`
- Acesso: Recepção

### 🎓 Login de Alunos → `/aluno/login`

**João Silva** (Plano Ativo)
- CPF: `12345678900`
- Telefone: `11987654321`
- Senha: `Aluno@123`

**Maria Santos** (Plano Ativo)
- CPF: `98765432100`
- Telefone: `11999887766`
- Senha: `Maria@123`

**Pedro Oliveira** (Plano Expirado)
- CPF: `11122233344`
- Telefone: `11988776655`
- Senha: `Pedro@123`

## 📁 Estrutura de Arquivos

```
src/
├── app/
│   ├── login/              # Login da Equipe
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── aluno/              # Área do Aluno
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── page.tsx        # Dashboard
│   │   └── layout.tsx
│   └── (app)/              # Painel Admin
│       └── layout.tsx      # Com proteção de rotas
├── components/
│   └── ui/
│       └── Logo.tsx        # Logo reutilizável
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticação
├── mocks/
│   └── authMock.ts         # Sistema de mocks
└── public/
    ├── moveaccess-logo.svg      # Logo principal
    └── moveaccess-wordmark.svg  # Wordmark
```

## 🎨 Design System

### Gradientes
- **Equipe**: Azul neutro → cinza
- **Aluno**: Azul vibrante → verde

### Animações
```css
.animate-fade-in    /* Entrada suave */
.animate-slide-up   /* Desliza de baixo */
.animate-shake      /* Erro/alerta */
.animate-pulse      /* Indicadores */
```

### Cores Principais
- **Info**: `var(--status-info)` - #17a2b8
- **Positivo**: `var(--status-positive)` - #28a745
- **Negativo**: `var(--status-negative)` - #dc3545

## 🔒 Segurança (Mock)

- ✅ Rate Limiting: 5 tentativas → bloqueio de 60 segundos
- ✅ Mensagens genéricas (não revela se email existe)
- ✅ Sessão com expiração de 24h
- ✅ Proteção de rotas por tipo de usuário
- ✅ Logout limpa todas as sessões

## 🚀 Próximos Passos

- [ ] Integração com Supabase Auth
- [ ] QR Code funcional
- [ ] OTP / Login sem senha
- [ ] Histórico de acessos real
- [ ] Upload de foto de perfil
- [ ] Recuperação de senha

## 💡 Uso do Logo

```tsx
import { Logo } from '@/components/ui';

// Logo completo (ícone + texto)
<Logo variant="full" size="lg" />

// Apenas ícone
<Logo variant="icon" size="md" />

// Wordmark (horizontal)
<Logo variant="wordmark" />
```

## 🎯 Fluxos de Redirecionamento

1. **Usuário não autenticado** → `/login`
2. **Equipe autenticada** → `/home`
3. **Aluno autenticado** → `/aluno`
4. **Logout Equipe** → `/login`
5. **Logout Aluno** → `/aluno/login`
