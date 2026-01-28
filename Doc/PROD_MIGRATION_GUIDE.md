# Guia de Replicação DEV → PROD

## Contexto
- **DEV:** https://hvgqdihblfepstcxrcwb.supabase.co (Move Access Dev)
- **PROD:** https://ooinkljdxgixwflsasgr.supabase.co (Move.Access)

## Migrations Aplicadas no DEV

### Estrutura Base (001-018)
Estas migrations criam toda a estrutura de auth, profiles, RLS, views.

**Status no PROD:** ✅ Aplicadas (confirmado pela listagem)

### Multi-tenant (019-022)
**Aplicadas no DEV:**
1. `multi_tenant_test_data` - Dados de teste (Academy B, vínculos)
2. `multi_tenant_test_users_academy_b` - Usuários de teste  
3. `update_my_profile_view_with_academy` - ⭐ **ESTRUTURAL**
4. `multi_tenant_units` - Unidades de teste

**Para PROD:** Aplicar APENAS a migration estrutural (view my_profile)

---

## 🚀 PASSO A PASSO - APLICAR NO PROD

### Opção 1: Via SQL Editor no Dashboard Supabase

1. Acesse: https://supabase.com/dashboard/project/ooinkljdxgixwflsasgr/sql/new
2. Execute o arquivo: `supabase/migrations/PROD_20260127_auth_multitenant.sql`
3. Verifique as mensagens de status ao final

### Opção 2: Via CLI Supabase (se configurado)

```bash
# Configurar PROD
export SUPABASE_URL=https://ooinkljdxgixwflsasgr.supabase.co
export SUPABASE_ANON_KEY=<key-do-prod>

# Aplicar migration
supabase db execute -f supabase/migrations/PROD_20260127_auth_multitenant.sql
```

---

## ⚠️ IMPORTANTE APÓS APLICAR

### 1. Vincular Usuário Admin à Academy

Execute no SQL Editor do PROD:

```sql
-- 1. Verificar ID do admin no PROD
SELECT id, email FROM profiles WHERE user_type = 'staff';

-- 2. Verificar ID da academy no PROD
SELECT id, trade_name FROM academies;

-- 3. Criar vínculo (ajustar IDs conforme resultado acima)
INSERT INTO academy_memberships (profile_id, academy_id, is_primary)
VALUES (
  '<ID_DO_ADMIN>'::uuid,
  '<ID_DA_ACADEMY>'::uuid,
  true
)
ON CONFLICT (profile_id, academy_id) DO NOTHING;
```

### 2. Verificar View my_profile

```sql
-- Testar view (como admin autenticado via dashboard)
SELECT * FROM my_profile;

-- Deve retornar: email, academy_ids, academies
```

### 3. Verificar Usuários Sem Vínculo

```sql
-- Listar usuários sem academy
SELECT p.email, p.user_type
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM academy_memberships am WHERE am.profile_id = p.id
);
```

---

## 📋 CHECKLIST DE VALIDAÇÃO

| Item | Como Verificar | Esperado |
|------|----------------|----------|
| ✅ View my_profile existe | `SELECT * FROM information_schema.views WHERE table_name = 'my_profile'` | 1 linha |
| ✅ Campo academy_ids presente | Fazer login e ver retorno | Campo `academy_ids` presente |
| ✅ Admin vinculado | `SELECT * FROM academy_memberships WHERE profile_id = '<admin_id>'` | 1 linha |
| ✅ RLS funcionando | Login como admin → listar alunos | Só vê alunos da mesma academy |

---

## 🔄 DIFERENÇAS DEV vs PROD

| Recurso | DEV | PROD |
|---------|-----|------|
| Academies | 2 (Move Fitness + Gym Elite) | 1 (apenas real) |
| Staff | 2 (admin + staff.b) | 1 (apenas real) |
| Students | 3 (aluno3, aluno4, aluno.b) | Apenas reais |
| View my_profile | ✅ Com academy_ids | ✅ Aplicar agora |

---

## ❌ NÃO APLICAR NO PROD

- Dados de teste (Academy "Gym Elite")
- Usuários de teste (staff.b@gymelite.com, aluno.b@gymelite.com)
- Unidades de teste

---

*Criado em: 27/01/2026*
