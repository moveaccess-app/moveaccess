# Teste de Aceitação - Integração Supabase Auth

## Objetivo
Validar que a autenticação real via Supabase está funcionando com feature flag para alternar entre Mock e Supabase.

---

## Pré-requisitos

```bash
# 1. Servidor dev rodando
pnpm dev

# 2. Projeto Supabase DEV configurado
# URL: hvgqdihblfepstcxrcwb.supabase.co
# Migrations: 18 aplicadas

# 3. Variáveis de ambiente em .env.local
NEXT_PUBLIC_SUPABASE_URL=https://hvgqdihblfepstcxrcwb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_USE_SUPABASE_AUTH=true  # ou undefined (true é padrão)
```

---

## Teste 1: Login Staff com Supabase ✅

**Cenário**: Staff faz login com credenciais reais do Supabase

### Passos:
1. Abrir `http://localhost:3000/login`
2. Inserir:
   - Email: `admin@moveaccess.com`
   - Senha: `Admin123!`
3. Clicar em "Entrar"

### Critérios de Aceitação:
- ✅ Login bem-sucedido
- ✅ Redirecionado para `/home` ou dashboard
- ✅ Header mostra nome do usuário (`Admin User`)
- ✅ Sidebar mostra menu completo (admin tem todas as permissões)
- ✅ DevTools Console mostra: `[AuthService] loginStaff { email: 'admin@moveaccess.com', useSupabase: true }`

### Validação Técnica (DevTools):
```javascript
// Abrir Console (F12)
localStorage.getItem('sb-hvgqdihblfepstcxrcwb-auth-token') // deve retornar token JWT
```

---

## Teste 2: Login Aluno com CPF ✅

**Cenário**: Aluno faz login usando CPF em vez de email

### Passos:
1. Fazer logout (se logado)
2. Abrir `http://localhost:3000/aluno/login`
3. Inserir:
   - CPF: `12345678900` (ou `123.456.789-00`)
   - Senha: `Aluno123!`
4. Clicar em "Entrar"

### Critérios de Aceitação:
- ✅ Login bem-sucedido
- ✅ Redirecionado para área do aluno
- ✅ Header mostra nome `Aluno Teste 4`
- ✅ Console mostra: `[AuthService] loginStudent`
- ✅ Sistema aceita CPF com ou sem máscara

---

## Teste 3: Persistência de Sessão ✅

**Cenário**: Sessão persiste após refresh da página

### Passos:
1. Com usuário logado (staff ou aluno)
2. Pressionar `F5` (refresh)
3. Aguardar carregamento

### Critérios de Aceitação:
- ✅ Usuário permanece logado
- ✅ Dados do perfil carregam corretamente
- ✅ Não redireciona para `/login`
- ✅ Loading state é mostrado brevemente durante verificação da sessão

---

## Teste 4: Logout e Redirecionamento ✅

**Cenário**: Logout limpa sessão e redireciona corretamente

### Passos (Staff):
1. Logar como `admin@moveaccess.com`
2. Clicar em botão de logout
3. Verificar redirecionamento

### Critérios de Aceitação:
- ✅ Redireciona para `/login` (login staff)
- ✅ Não consegue acessar `/home` (redireciona de volta)
- ✅ Token removido do localStorage

### Passos (Aluno):
1. Logar como aluno
2. Clicar em logout

### Critérios de Aceitação:
- ✅ Redireciona para `/aluno/login`

---

## Teste 5: Feature Flag - Alternar para Mock ✅

**Cenário**: Alternar autenticação para modo Mock sem quebrar o app

### Passos:
1. **Parar servidor** (`Ctrl+C`)
2. Editar `.env.local`:
   ```env
   NEXT_PUBLIC_USE_SUPABASE_AUTH=false
   NEXT_PUBLIC_DEBUG_AUTH=true
   ```
3. **Reiniciar servidor**: `pnpm dev`
4. Abrir `http://localhost:3000/login`
5. Inserir credenciais mockadas:
   - Email: `admin@moveaccess.com`
   - Senha: `Admin123!` (verificar authMock.ts para senha correta)

### Critérios de Aceitação:
- ✅ Console mostra: `[AuthService] loginStaff { ..., useSupabase: false }`
- ✅ Login funciona com dados do mock
- ✅ Nenhuma chamada para Supabase é feita
- ✅ Dados exibidos são do mock (ex: nome diferente)

### Reverter para Supabase:
1. Editar `.env.local`:
   ```env
   NEXT_PUBLIC_USE_SUPABASE_AUTH=true
   ```
2. Reiniciar servidor

---

## Teste 6: Validação de Erros ✅

**Cenário**: Sistema trata erros de autenticação corretamente

### 6.1 Senha incorreta:
1. Login staff com `admin@moveaccess.com` / `SenhaErrada`
2. **Esperado**: Mensagem de erro "Invalid login credentials"

### 6.2 Usuário não existe:
1. Login com `naoexiste@email.com` / `Qualquer123`
2. **Esperado**: Mensagem de erro "Invalid login credentials"

### 6.3 Tipo de usuário errado:
1. Tentar logar com email de staff na tela `/aluno/login`
2. **Esperado**: Erro "Acesso negado. Use o login da equipe."

---

## Teste 7: Verificação de RLS Básico 🔐

**Cenário**: Row Level Security impede acesso não autorizado

### Passos:
1. Logar como aluno (`aluno4@teste.com`)
2. Abrir DevTools Console
3. Executar:
   ```javascript
   const { createClient } = await import('@/lib/supabase/client');
   const supabase = createClient();
   
   // Tentar acessar todos os alunos
   const { data, error } = await supabase.from('student_profiles').select('*');
   console.log('Alunos:', data, 'Erro:', error);
   ```

### Critérios de Aceitação:
- ✅ Retorna apenas o próprio perfil do aluno
- ✅ Não retorna outros alunos (RLS bloqueando)
- ✅ Sem erros de permissão (query executa, mas filtrada por RLS)

---

## Critérios de Aceitação Global ✅

A task é considerada **ACEITA** se:

1. ✅ Todos os 7 testes acima passarem
2. ✅ Nenhum erro de compilação TypeScript
3. ✅ Nenhum erro 500 no servidor
4. ✅ Feature flag alterna corretamente entre Mock e Supabase
5. ✅ Código segue arquitetura definida:
   ```
   AuthContext → authService (switch) → authServiceSupabase/authMock
   ```

---

## Evidências de Teste

Após executar os testes, preencher:

| Teste | Status | Executor | Data | Observações |
|-------|--------|----------|------|-------------|
| T1: Login Staff | ⏳ | - | - | - |
| T2: Login Aluno CPF | ⏳ | - | - | - |
| T3: Persistência | ⏳ | - | - | - |
| T4: Logout | ⏳ | - | - | - |
| T5: Feature Flag | ⏳ | - | - | - |
| T6: Validação Erros | ⏳ | - | - | - |
| T7: RLS Básico | ⏳ | - | - | - |

**Legenda**: ⏳ Pendente | ✅ Passou | ❌ Falhou

---

## Rollback

Se algum teste falhar criticamente:

1. Reverter para mock:
   ```env
   NEXT_PUBLIC_USE_SUPABASE_AUTH=false
   ```

2. Investigar erro com `DEBUG_AUTH=true`

3. Verificar migrations aplicadas:
   ```bash
   # Via MCP Supabase
   mcp_supabase_list_migrations
   ```
