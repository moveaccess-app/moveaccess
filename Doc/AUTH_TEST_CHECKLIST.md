# Checklist de Testes - Autenticação MoveAccess

## Credenciais de Teste (DEV)

| Tipo    | Email                  | Senha       | CPF          |
|---------|------------------------|-------------|--------------|
| Staff   | admin@moveaccess.com   | Admin123!   | -            |
| Aluno   | aluno4@teste.com       | Aluno123!   | 12345678900  |

---

## ✅ Testes de Login Staff

### 1. Login staff com email/senha válidos
- [ ] Acessar `/login`
- [ ] Inserir `admin@moveaccess.com` / `Admin123!`
- [ ] Clicar em "Entrar"
- [ ] **Esperado**: Redireciona para `/home` ou dashboard
- [ ] **Verificar**: Console mostra `[AuthService] loginStaff` (se DEBUG_AUTH=true)

### 2. Login staff com senha incorreta
- [ ] Acessar `/login`
- [ ] Inserir `admin@moveaccess.com` / `SenhaErrada`
- [ ] Clicar em "Entrar"
- [ ] **Esperado**: Mensagem de erro "Invalid login credentials"

### 3. Login staff com email não cadastrado
- [ ] Acessar `/login`
- [ ] Inserir `naoexiste@email.com` / `Qualquer123`
- [ ] Clicar em "Entrar"
- [ ] **Esperado**: Mensagem de erro "Invalid login credentials"

### 4. Staff tentando login na área de aluno
- [ ] Acessar `/aluno/login`
- [ ] Inserir `admin@moveaccess.com` / `Admin123!`
- [ ] **Esperado**: Erro "Acesso negado. Use o login da equipe."

---

## ✅ Testes de Login Aluno

### 5. Login aluno com email/senha válidos
- [ ] Acessar `/aluno/login`
- [ ] Inserir `aluno4@teste.com` / `Aluno123!`
- [ ] Clicar em "Entrar"
- [ ] **Esperado**: Redireciona para área do aluno

### 6. Login aluno com CPF/senha válidos
- [ ] Acessar `/aluno/login`
- [ ] Inserir `12345678900` / `Aluno123!`
- [ ] **Esperado**: Redireciona para área do aluno

### 7. Login aluno com CPF formatado
- [ ] Acessar `/aluno/login`
- [ ] Inserir `123.456.789-00` / `Aluno123!`
- [ ] **Esperado**: Sistema remove máscara e autentica normalmente

### 8. Aluno tentando login na área staff
- [ ] Acessar `/login`
- [ ] Inserir `aluno4@teste.com` / `Aluno123!`
- [ ] **Esperado**: Erro "Acesso negado. Use o login de aluno."

---

## ✅ Testes de Logout

### 9. Logout de staff
- [ ] Fazer login como staff
- [ ] Clicar em botão de logout
- [ ] **Esperado**: Redireciona para `/login`
- [ ] **Verificar**: Não consegue acessar `/home` sem logar novamente

### 10. Logout de aluno
- [ ] Fazer login como aluno
- [ ] Clicar em botão de logout
- [ ] **Esperado**: Redireciona para `/aluno/login`

---

## ✅ Testes de Persistência de Sessão

### 11. Persistência após refresh (staff)
- [ ] Fazer login como staff
- [ ] Atualizar página (F5)
- [ ] **Esperado**: Usuário permanece logado
- [ ] **Verificar**: Dados do perfil carregados corretamente

### 12. Persistência após refresh (aluno)
- [ ] Fazer login como aluno
- [ ] Atualizar página (F5)
- [ ] **Esperado**: Usuário permanece logado

### 13. Persistência após fechar/abrir aba
- [ ] Fazer login
- [ ] Fechar aba
- [ ] Abrir nova aba e acessar o app
- [ ] **Esperado**: Usuário permanece logado (dentro do tempo de expiração)

---

## ✅ Testes de RLS (Row Level Security)

### 14. Staff vê apenas dados da sua academy
- [ ] Logar como admin@moveaccess.com
- [ ] Verificar se academies retorna apenas academias vinculadas
- [ ] **Testar via DevTools**: `await supabase.from('academies').select('*')`
- [ ] **Esperado**: Retorna apenas academias do usuário

### 15. Aluno vê apenas seu próprio perfil
- [ ] Logar como aluno4@teste.com
- [ ] Verificar se não consegue ver outros alunos
- [ ] **Testar**: `await supabase.from('profiles').select('*')`
- [ ] **Esperado**: Retorna apenas o próprio perfil

### 16. Aluno não consegue modificar perfil de outros
- [ ] Logar como aluno
- [ ] Tentar update em outro ID
- [ ] **Esperado**: Erro de RLS ou query retorna 0 rows affected

---

## ✅ Testes de Feature Flag

### 17. Alternar para Mock
- [ ] Em `.env.local`, definir `NEXT_PUBLIC_USE_SUPABASE_AUTH=false`
- [ ] Reiniciar servidor de dev
- [ ] Fazer login com credenciais mock (do authMock.ts)
- [ ] **Esperado**: Login funciona com dados mockados

### 18. Alternar para Supabase (padrão)
- [ ] Em `.env.local`, remover ou definir `NEXT_PUBLIC_USE_SUPABASE_AUTH=true`
- [ ] Reiniciar servidor
- [ ] **Esperado**: Login usa Supabase

---

## ✅ Testes de Estados de Erro

### 19. Conta inativa (staff_status !== 'active')
- [ ] Criar staff com status `pending` ou `inactive`
- [ ] Tentar logar
- [ ] **Esperado**: Erro "Conta inativa ou pendente de aprovação."

### 20. Conta bloqueada (student_status === 'blocked')
- [ ] Alterar status de aluno para `blocked`
- [ ] Tentar logar
- [ ] **Esperado**: Erro "Conta bloqueada. Entre em contato com a academia."

### 21. Perfil não encontrado
- [ ] Criar usuário em auth.users mas sem profile
- [ ] Tentar logar
- [ ] **Esperado**: Erro "Perfil não encontrado"

---

## 🔧 Comandos Úteis para Debug

```bash
# Ver logs do auth no console
# Definir em .env.local:
NEXT_PUBLIC_DEBUG_AUTH=true

# Testar queries via DevTools (após login):
const { createClient } = await import('@/lib/supabase/client');
const supabase = createClient();
const { data, error } = await supabase.from('my_profile').select('*');
console.log({ data, error });
```

---

## 📝 Observações

- **DEV**: `hvgqdihblfepstcxrcwb.supabase.co`
- **PROD**: `ooinkljdxgixwflsasgr.supabase.co` (MCP não configurado ainda)
- Todos os testes devem ser executados primeiro no ambiente DEV
- Após validação, replicar configurações para PROD
