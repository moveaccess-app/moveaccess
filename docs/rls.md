# 🔒 MoveAccess - Row Level Security (RLS)

> Documentação das políticas de segurança de dados por tenant

---

## Visão Geral

O MoveAccess implementa **multi-tenancy** usando Row Level Security (RLS) do PostgreSQL. Cada academia é um "tenant" isolado, e os usuários só podem ver/editar dados da(s) academia(s) às quais pertencem.

### Princípios de Segurança

1. **Isolamento por Academia** - Usuários não veem dados de outras academias
2. **Mínimo Privilégio** - Cada role tem apenas as permissões necessárias
3. **Defesa em Profundidade** - RLS + validação na aplicação + auditoria
4. **Segurança por Padrão** - RLS habilitado, tudo bloqueado por default

---

## Status de RLS por Tabela

| Tabela | RLS | Políticas |
|--------|-----|-----------|
| `academies` | ✅ Habilitado | SELECT, UPDATE |
| `units` | ✅ Habilitado | SELECT, INSERT, UPDATE, DELETE |
| `profiles` | ✅ Habilitado | SELECT, UPDATE |
| `academy_memberships` | ✅ Habilitado | SELECT, INSERT |
| `staff_profiles` | ✅ Habilitado | SELECT, UPDATE |
| `staff_unit_assignments` | ✅ Habilitado | SELECT, INSERT, DELETE |
| `student_profiles` | ✅ Habilitado | SELECT, UPDATE |
| `invites` | ✅ Habilitado | SELECT, INSERT, UPDATE |
| `roles` | ✅ Habilitado | SELECT |

---

## Funções Auxiliares

### is_member_of_academy(user_id, academy_id)

Verifica se um usuário pertence a uma academia.

```sql
CREATE OR REPLACE FUNCTION is_member_of_academy(
  p_user_id uuid, 
  p_academy_id uuid
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM academy_memberships 
    WHERE profile_id = p_user_id 
      AND academy_id = p_academy_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Uso em policies:**
```sql
USING (is_member_of_academy(auth.uid(), academy_id))
```

---

### has_permission(user_id, permission)

Verifica se um usuário staff tem determinada permissão.

```sql
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id uuid, 
  p_permission text
)
RETURNS boolean AS $$
DECLARE
  v_permissions text[];
BEGIN
  SELECT COALESCE(sp.custom_permissions, r.permissions) 
  INTO v_permissions
  FROM staff_profiles sp
  JOIN roles r ON r.id = sp.role
  WHERE sp.id = p_user_id;
  
  RETURN v_permissions IS NOT NULL 
     AND p_permission = ANY(v_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Uso em policies:**
```sql
USING (has_permission(auth.uid(), 'users:write'))
```

---

### get_user_academies(user_id)

Retorna array de academy_ids do usuário.

```sql
CREATE OR REPLACE FUNCTION get_user_academies(p_user_id uuid)
RETURNS uuid[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT academy_id 
    FROM academy_memberships 
    WHERE profile_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Políticas por Tabela

### academies

**SELECT** - Ver academias que participo
```sql
CREATE POLICY "Users can view their academies"
ON academies FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT academy_id 
    FROM academy_memberships 
    WHERE profile_id = auth.uid()
  )
);
```

**UPDATE** - Apenas admin/manager pode editar
```sql
CREATE POLICY "Staff with settings:write can update academy"
ON academies FOR UPDATE
TO authenticated
USING (
  is_member_of_academy(auth.uid(), id)
  AND has_permission(auth.uid(), 'settings:write')
)
WITH CHECK (
  is_member_of_academy(auth.uid(), id)
  AND has_permission(auth.uid(), 'settings:write')
);
```

---

### units

**SELECT** - Ver unidades da minha academia
```sql
CREATE POLICY "Users can view units of their academies"
ON units FOR SELECT
TO authenticated
USING (
  is_member_of_academy(auth.uid(), academy_id)
);
```

**INSERT** - Apenas admin pode criar
```sql
CREATE POLICY "Admin can create units"
ON units FOR INSERT
TO authenticated
WITH CHECK (
  is_member_of_academy(auth.uid(), academy_id)
  AND has_permission(auth.uid(), 'settings:write')
);
```

**UPDATE** - Admin/manager pode editar
```sql
CREATE POLICY "Staff with settings:write can update units"
ON units FOR UPDATE
TO authenticated
USING (
  is_member_of_academy(auth.uid(), academy_id)
  AND has_permission(auth.uid(), 'settings:write')
)
WITH CHECK (
  is_member_of_academy(auth.uid(), academy_id)
  AND has_permission(auth.uid(), 'settings:write')
);
```

**DELETE** - Apenas admin pode excluir
```sql
CREATE POLICY "Admin can delete units"
ON units FOR DELETE
TO authenticated
USING (
  is_member_of_academy(auth.uid(), academy_id)
  AND has_permission(auth.uid(), 'settings:write')
);
```

---

### profiles

**SELECT** - Ver próprio perfil ou perfis da minha academia (se staff)
```sql
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Staff can view profiles in their academy"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.user_type = 'staff'
  )
  AND EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.profile_id = auth.uid()
      AND am2.profile_id = profiles.id
  )
);
```

**UPDATE** - Atualizar próprio perfil
```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

---

### academy_memberships

**SELECT** - Ver membros da minha academia
```sql
CREATE POLICY "Users can view memberships in their academies"
ON academy_memberships FOR SELECT
TO authenticated
USING (
  is_member_of_academy(auth.uid(), academy_id)
);
```

**INSERT** - Staff com permissão pode adicionar membros
```sql
CREATE POLICY "Staff with users:write can add members"
ON academy_memberships FOR INSERT
TO authenticated
WITH CHECK (
  is_member_of_academy(auth.uid(), academy_id)
  AND has_permission(auth.uid(), 'users:write')
);
```

---

### staff_profiles

**SELECT** - Ver staff da minha academia
```sql
CREATE POLICY "View staff in same academy"
ON staff_profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.profile_id = auth.uid()
      AND am2.profile_id = staff_profiles.id
  )
);
```

**UPDATE** - Próprio perfil ou admin editando
```sql
CREATE POLICY "Update own staff profile or admin"
ON staff_profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR has_permission(auth.uid(), 'users:write')
)
WITH CHECK (
  id = auth.uid()
  OR has_permission(auth.uid(), 'users:write')
);
```

---

### student_profiles

**SELECT** - Ver alunos da minha academia
```sql
CREATE POLICY "Staff can view students in their academy"
ON student_profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'staff'
    )
    AND EXISTS (
      SELECT 1 FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.profile_id = auth.uid()
        AND am2.profile_id = student_profiles.id
    )
  )
);
```

**UPDATE** - Próprio perfil ou staff com permissão
```sql
CREATE POLICY "Update own student profile or staff"
ON student_profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR (
    has_permission(auth.uid(), 'users:write')
    AND EXISTS (
      SELECT 1 FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.profile_id = auth.uid()
        AND am2.profile_id = student_profiles.id
    )
  )
)
WITH CHECK (
  id = auth.uid()
  OR (
    has_permission(auth.uid(), 'users:write')
    AND EXISTS (
      SELECT 1 FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.profile_id = auth.uid()
        AND am2.profile_id = student_profiles.id
    )
  )
);
```

---

### invites

**SELECT** - Ver convites que criei ou da minha academia
```sql
CREATE POLICY "Staff can view invites in their academy"
ON invites FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR is_member_of_academy(auth.uid(), academy_id)
);

-- Permitir validação pública do token
CREATE POLICY "Anyone can validate invite by token"
ON invites FOR SELECT
TO anon, authenticated
USING (true);  -- Controlado pela função validate_invite
```

**INSERT** - Staff pode criar convites
```sql
CREATE POLICY "Staff can create invites"
ON invites FOR INSERT
TO authenticated
WITH CHECK (
  is_member_of_academy(auth.uid(), academy_id)
  AND has_permission(auth.uid(), 'users:write')
);
```

**UPDATE** - Atualizar status do convite
```sql
CREATE POLICY "Update invite status"
ON invites FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR is_member_of_academy(auth.uid(), academy_id)
)
WITH CHECK (
  created_by = auth.uid()
  OR is_member_of_academy(auth.uid(), academy_id)
);
```

---

### roles

**SELECT** - Todos podem ver roles
```sql
CREATE POLICY "Anyone can view roles"
ON roles FOR SELECT
TO authenticated
USING (true);
```

> **Nota:** Roles são dados de referência do sistema, não sensíveis.

---

## Matriz de Permissões

### Permissões Disponíveis

| Permissão | Descrição |
|-----------|-----------|
| `users:read` | Ver usuários |
| `users:write` | Criar/editar usuários |
| `users:delete` | Excluir usuários |
| `financial:read` | Ver dados financeiros |
| `financial:write` | Criar/editar financeiro |
| `settings:read` | Ver configurações |
| `settings:write` | Editar configurações |
| `reports:read` | Ver relatórios |
| `checkin:read` | Ver check-ins |
| `checkin:write` | Registrar check-ins |

### Permissões por Role

| Role | Permissões |
|------|------------|
| **admin** | Todas |
| **manager** | users:read, users:write, financial:read, financial:write, settings:read, reports:read |
| **receptionist** | users:read, users:write, checkin:read, checkin:write |
| **financial** | financial:read, financial:write, reports:read |
| **readonly** | users:read, financial:read, settings:read, reports:read |

---

## Boas Práticas

### 1. Sempre Use auth.uid()

```sql
-- ✅ Correto
USING (profile_id = auth.uid())

-- ❌ Errado (permite passar qualquer ID)
USING (profile_id = $1)
```

### 2. Prefira SECURITY DEFINER para Funções

```sql
CREATE FUNCTION is_member_of_academy(...)
RETURNS boolean AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Isso permite que a função acesse tabelas que o usuário não teria acesso direto.

### 3. Evite Policies Muito Complexas

Se a policy está ficando muito complexa, considere:
- Criar uma função auxiliar
- Dividir em múltiplas policies
- Repensar o modelo de dados

### 4. Teste com Usuários Reais

```sql
-- Testar como um usuário específico
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

SELECT * FROM profiles;  -- Deve retornar apenas dados permitidos
```

---

## Debugging

### Ver Policies Ativas

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verificar RLS Habilitado

```sql
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r';
```

### Testar Policy Específica

```sql
-- Simular usuário
SELECT set_config('request.jwt.claims', 
  '{"sub": "user-uuid", "role": "authenticated"}', true);

-- Testar query
EXPLAIN (ANALYZE, VERBOSE) 
SELECT * FROM profiles WHERE id = 'some-id';
```

---

## Considerações de Performance

### 1. Índices nas Colunas de FK

```sql
CREATE INDEX idx_academy_memberships_profile_id 
ON academy_memberships(profile_id);

CREATE INDEX idx_academy_memberships_academy_id 
ON academy_memberships(academy_id);
```

### 2. Cache de Permissões

As funções `is_member_of_academy` e `has_permission` são chamadas frequentemente. Considere:
- Materializar memberships para consultas pesadas
- Cachear permissões no token JWT

### 3. Evite Subqueries Correlacionadas

```sql
-- ❌ Lento
USING (
  EXISTS (
    SELECT 1 FROM academy_memberships 
    WHERE profile_id = auth.uid()
      AND academy_id = table.academy_id
  )
)

-- ✅ Melhor
USING (academy_id = ANY(get_user_academies(auth.uid())))
```

---

## Próximos Passos

- [ ] Adicionar audit logging para operações sensíveis
- [ ] Implementar soft delete com RLS
- [ ] Criar policies para tabelas futuras (payments, contracts)
- [ ] Adicionar rate limiting por tenant
