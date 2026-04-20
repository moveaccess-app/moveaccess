# Estrutura de Auth no Supabase (estado atual do projeto)

> Levantamento feito a partir do código e migrations presentes no repositório.

## 1) Fontes consultadas

- `supabase/migrations/001_create_enums.sql` até `012_seed_demo_dev_only.sql`
- `supabase/migrations/20260127000000_multi_tenant_staff.sql`
- `supabase/migrations/PROD_20260127_auth_multitenant.sql`
- `src/lib/auth/authServiceSupabase.ts`
- `src/lib/supabase/{client,server,middleware}.ts`
- `src/middleware.ts`
- `src/contexts/AuthContext.tsx`
- `src/lib/supabase/types.ts`

---

## 2) Como a estrutura de auth é criada no Supabase

### Ordem de criação (migrations)

1. **Enums base** (`001_create_enums.sql`)
   - `user_type`, `role_id`, `staff_status`, `student_status`, `plan_status`, `invite_status`, etc.

2. **Tenancy e base organizacional**
   - `academies` (`002_create_academies.sql`)
   - `units` (`003_create_units.sql`)

3. **Autorização por papel**
   - `roles` com seed de permissões (`004_create_roles.sql`)

4. **Identidade de usuário estendida do Supabase Auth**
   - `profiles` (`005_create_profiles.sql`) com `id = auth.users.id`
   - Trigger `on_auth_user_created` chamando `handle_new_user()`

5. **Vínculo multi-tenant usuário ↔ academia**
   - `academy_memberships` (`006_create_academy_memberships.sql`)
   - Trigger para manter somente 1 `is_primary = true` por usuário

6. **Extensões por tipo de usuário**
   - `staff_profiles` + `staff_unit_assignments` (`007_create_staff_profiles.sql`)
   - `student_profiles` + `student_unit_assignments` (`008_create_student_profiles.sql`)
   - Trigger de matrícula automática (`generate_registration_id`)

7. **Convites**
   - legado: `invites` (`009_create_invites.sql`) com token, expiração e status para o modelo antigo
   - fluxo público atual: `invite_links` + RPCs `get_invite_signup_context`, `claim_invite_signup`, `get_my_invite_signup_session` e `complete_my_invite_signup`

8. **Segurança**
   - RLS + funções helper + policies (`010_enable_rls_policies.sql`)

9. **Views para consumo da aplicação**
   - `my_profile`, `staff_with_role`, `students_with_status` (`011_create_views.sql`)

10. **Seed DEV**
    - Academia/unidades demo (`012_seed_demo_dev_only.sql`)

11. **Ajustes multi-tenant (jan/2026)**
    - DEV/STG: `20260127000000_multi_tenant_staff.sql`
    - PROD: `PROD_20260127_auth_multitenant.sql`
    - Ambos ajustam principalmente a view `my_profile` para trazer `academy_ids` e dados de academias.

---

## 3) Modelo de auth (Supabase Auth + tabelas públicas)

## Núcleo

- `auth.users` (gerenciado pelo Supabase Auth)
- `public.profiles` (1:1 com `auth.users`)

### Relações principais

- `profiles.id` referencia `auth.users.id`
- `staff_profiles.id` referencia `profiles.id`
- `student_profiles.id` referencia `profiles.id`
- `academy_memberships.profile_id` referencia `profiles.id`

### Multi-tenant

- O isolamento por tenant é modelado por `academy_memberships`
- Um usuário pode estar em múltiplas academias
- `is_primary` marca a academia principal

### Convites

- `invites` permanece como artefato legado do modelo antigo de convites.
- O fluxo público endurecido usa `invite_links` para onboarding/cadastro por link:
   - `token`, `academy_id`, `unit_id`, `expected_email`, `claimed_by_user_id`, `draft_id`, `expires_at`, `status`
   - RPCs principais: `get_invite_signup_context`, `claim_invite_signup`, `get_my_invite_signup_session`, `save_my_invite_signup_progress`, `complete_my_invite_signup`

---

## 4) Criação automática de profile após signup

Ao criar usuário em `auth.users`, o trigger `on_auth_user_created` executa `handle_new_user()`:

- Cria `profiles` automaticamente
- Resolve:
  - `user_type` via `raw_user_meta_data->>'user_type'` (default: `student`)
  - `name` via `raw_user_meta_data->>'name'` (fallback do e-mail)
  - `email`, `phone`

**Implicação prática:** no `signUp`, o app deve enviar metadados mínimos (`user_type` e `name`) para evitar perfil incompleto.

---

## 5) RLS e autorização (como o acesso é protegido)

RLS é habilitado em: `academies`, `units`, `roles`, `profiles`, `academy_memberships`, `staff_profiles`, `staff_unit_assignments`, `student_profiles`, `student_unit_assignments`, `invites`.

### Funções helper usadas nas policies

- `get_user_academy_ids()`
- `get_user_primary_academy_id()`
- `is_staff()`
- `has_permission(required_permission text)`

### Regras centrais das policies

- Usuário vê/edita o próprio perfil (`profiles`)
- Staff vê perfis/memberships/alunos da(s) academia(s) em que pertence
- Ações administrativas dependem de `has_permission(...)`
- Convite pendente e não expirado pode ser lido para fluxo público de cadastro

---

## 6) Views usadas pela aplicação

### `my_profile`

É a principal view consumida no login para montar sessão da UI.

Versão base (`011_create_views.sql`):
- Retorna `p.*`
- Inclui `staff_data`/`student_data` em JSON
- Inclui `academies` em JSON

Versão ajustada (migrations de 27/01/2026):
- Flatten de campos de staff/student
- Inclui `academy_ids` (array UUID)
- Mantém agregação de `academies`

### `staff_with_role`

- Expande role + permissões efetivas por staff

### `students_with_status`

- Calcula `access_allowed` com base em status e plano

---

## 7) Como o app autentica hoje (integração Next.js)

## Serviço de auth

- `src/lib/auth/authService.ts` alterna entre mock e Supabase por feature flag:
  - `NEXT_PUBLIC_USE_SUPABASE_AUTH=true` ou `NODE_ENV=production`

- Implementação Supabase em `src/lib/auth/authServiceSupabase.ts`:
  - Login via REST do Supabase Auth (`/auth/v1/token?grant_type=password`)
  - Após autenticar, busca `my_profile` via REST (`/rest/v1/my_profile?select=*`)
  - Faz validações por tipo/status (`staff_status`, `student_status`)
  - Persiste sessão no `localStorage` no formato `sb-<project-ref>-auth-token`

## Middleware SSR

- `src/middleware.ts` chama `updateSession()`
- `src/lib/supabase/middleware.ts` usa `@supabase/ssr` + cookies para refresh de sessão (`supabase.auth.getUser()`)

---

## 8) Pontos de atenção encontrados

1. **Divergência entre migrations SQL e tipos gerados (`src/lib/supabase/types.ts`)**
   - Ex.: `academy_memberships` no tipo possui `unit_id` e `joined_at`, mas `006_create_academy_memberships.sql` não cria essas colunas.
   - Ex.: `invites` no tipo possui `max_uses` e `used_count`, mas `009_create_invites.sql` não cria essas colunas.
   - Ex.: `types.ts` lista funções (`complete_user_setup`, `validate_invite`, etc.) não visíveis nas migrations listadas aqui.

2. **Divergência entre formato da view `my_profile`**
   - Há versão JSON aninhada (migration 011) e versão flatten + `academy_ids` (migrations de 27/01/2026).
   - O app atual (`authServiceSupabase.ts`) depende de campos flatten (`role`, `staff_status`, `student_status`, `custom_permissions`, etc.).

3. **Cadastro público por convite no front**
   - A página `src/app/cadastro/[token]/page.tsx` está mockada (usa `@/mocks/inviteMock`) e ainda não é fluxo Supabase completo ponta-a-ponta.

---

## 9) Resumo executivo

Hoje o auth do projeto segue o padrão:

1. `auth.users` autentica credenciais
2. Trigger cria `profiles`
3. Extensões em `staff_profiles`/`student_profiles`
4. `academy_memberships` define tenant(s) do usuário
5. RLS usa `auth.uid()` + helpers para isolamento e permissões
6. App consulta `my_profile` para montar sessão/autorização de UI

Esse é o desenho efetivo em código, com ajustes multi-tenant aplicados em 27/01/2026 para suportar melhor contexto por academia.
