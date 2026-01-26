# 🚀 Setup Inicial - Login com Supabase

## Checklist Rápido

### 1. ✅ Instalar Dependências

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 2. ⚙️ Configurar Variáveis de Ambiente

Crie o arquivo `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` e adicione suas chaves (obtenha no [Dashboard Supabase](https://supabase.com/dashboard)):

```env
# PROD
NEXT_PUBLIC_SUPABASE_URL=https://ooinkljdxgixwflsasgr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OU use DEV para testes
# NEXT_PUBLIC_SUPABASE_URL=https://hvgqdihblfepstcxrcwb.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Como obter as chaves:**
1. Acesse: https://supabase.com/dashboard/project/ooinkljdxgixwflsasgr/settings/api
2. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. 👤 Criar Usuário de Teste

**Opção A - Via Dashboard Supabase:**
1. Acesse: https://supabase.com/dashboard/project/ooinkljdxgixwflsasgr/auth/users
2. Clique em "Add user" → "Create new user"
3. Preencha:
   - Email: `admin@moveaccess.com`
   - Password: `Admin123!`
   - Marque "Auto Confirm User"

**Opção B - Via SQL Editor:**

Execute no [SQL Editor](https://supabase.com/dashboard/project/ooinkljdxgixwflsasgr/sql/new):

```sql
-- 1. Criar academia de teste (se não existir)
INSERT INTO academies (id, trade_name)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Move Fitness Demo')
ON CONFLICT (id) DO NOTHING;

-- 2. Criar unidade de teste
INSERT INTO units (id, academy_id, name)
VALUES ('u0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Unidade Centro')
ON CONFLICT (id) DO NOTHING;

-- 3. Criar usuário admin (via Auth)
-- Você PRECISA fazer isso via Dashboard ou signUp()
-- O SQL não consegue criar em auth.users diretamente

-- Depois que criar via Dashboard, rode:
-- Substitua USER_ID_AQUI pelo ID do usuário criado

-- 3.1. Atualizar perfil
UPDATE profiles 
SET user_type = 'staff'
WHERE id = 'USER_ID_AQUI';

-- 3.2. Criar staff_profile
INSERT INTO staff_profiles (id, role, status)
VALUES ('USER_ID_AQUI', 'admin', 'active')
ON CONFLICT (id) DO UPDATE SET status = 'active';

-- 3.3. Vincular à academia
INSERT INTO academy_memberships (profile_id, academy_id, unit_id, is_primary)
VALUES ('USER_ID_AQUI', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', true)
ON CONFLICT (profile_id, academy_id) DO NOTHING;
```

### 4. 🔄 Adicionar Middleware (Opcional mas Recomendado)

Crie `src/middleware.ts`:

```typescript
import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 5. 🔐 Atualizar Página de Login

**Exemplo básico** (substitua no seu componente de login):

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginStaff } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginStaff(email, password);

    if (result.success) {
      router.push('/home');
      router.refresh();
    } else {
      setError(result.error || 'Erro ao fazer login');
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
```

---

## 🧪 Testar Login

1. Inicie o servidor:
   ```bash
   pnpm dev
   ```

2. Acesse a página de login

3. Use as credenciais:
   - **Email:** `admin@moveaccess.com`
   - **Senha:** `Admin123!`

4. Se funcionar, você será redirecionado para `/home`

---

## ⚠️ Problemas Comuns

### Erro: "Invalid API key"
- Verifique se copiou a chave correta do Dashboard
- Confirme que `.env.local` existe (não `.env.example`)
- Reinicie o servidor (`pnpm dev`)

### Erro: "Invalid login credentials"
- Verifique se o usuário foi criado via Dashboard
- Confirme que marcou "Auto Confirm User"
- Tente resetar a senha no Dashboard

### Erro: "Perfil não encontrado"
- Execute os SQLs do passo 3.1 a 3.3
- Verifique se o `user_type` é `'staff'` na tabela `profiles`

### Login funciona mas redireciona de volta
- Adicione o middleware (passo 4)
- Verifique se a rota `/home` existe

---

## 📚 Próximos Passos

Depois que o login funcionar:

1. Proteger rotas privadas
2. Adicionar loading states
3. Implementar recuperação de senha
4. Criar fluxo de cadastro de alunos
5. Substituir mocks gradualmente
