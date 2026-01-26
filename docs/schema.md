# 📊 MoveAccess - Schema do Banco de Dados

> Documentação completa do modelo de dados no Supabase

---

## Diagrama de Relacionamentos

```
┌─────────────────┐       ┌─────────────────┐
│    ACADEMIES    │       │      UNITS      │
│─────────────────│       │─────────────────│
│ id (PK)         │◄──┐   │ id (PK)         │
│ trade_name      │   │   │ academy_id (FK) │───┐
│ legal_name      │   │   │ name            │   │
│ tax_id          │   │   │ status          │   │
│ logo_url        │   │   │ qr_token        │   │
│ settings (JSON) │   │   │ access_config   │   │
└─────────────────┘   │   └─────────────────┘   │
                      │                         │
        ┌─────────────┴─────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│   ACADEMY_MEMBERSHIPS     │
│───────────────────────────│
│ id (PK)                   │
│ profile_id (FK)           │◄─────────┐
│ academy_id (FK)           │          │
│ unit_id (FK)              │          │
│ is_primary                │          │
└───────────────────────────┘          │
                                       │
┌─────────────────┐                    │
│     PROFILES    │────────────────────┘
│─────────────────│
│ id (PK/FK)      │ ◄── auth.users.id
│ user_type       │
│ name            │
│ email           │
│ phone           │
│ cpf             │
│ avatar_url      │
└────────┬────────┘
         │
         │ 1:1 (condicional)
    ┌────┴────┐
    ▼         ▼
┌──────────┐ ┌──────────────┐
│  STAFF   │ │   STUDENT    │
│ PROFILES │ │   PROFILES   │
└──────────┘ └──────────────┘

┌─────────────────┐     ┌─────────────────┐
│      ROLES      │     │     INVITES     │
│─────────────────│     │─────────────────│
│ id (PK/ENUM)    │     │ id (PK)         │
│ name            │     │ token           │
│ description     │     │ academy_id (FK) │
│ permissions[]   │     │ invite_type     │
│ is_system       │     │ status          │
└─────────────────┘     │ expires_at      │
                        └─────────────────┘
```

---

## Enums

### user_type
Tipo de usuário no sistema.

| Valor | Descrição |
|-------|-----------|
| `staff` | Funcionário da academia |
| `student` | Aluno |

### unit_status
Status de uma unidade.

| Valor | Descrição |
|-------|-----------|
| `active` | Unidade ativa |
| `inactive` | Unidade inativa |
| `maintenance` | Em manutenção |

### role_id
Identificador de papel (role) do staff.

| Valor | Descrição |
|-------|-----------|
| `admin` | Administrador |
| `manager` | Gerente |
| `receptionist` | Recepcionista |
| `financial` | Financeiro |
| `readonly` | Somente leitura |

### staff_status
Status do funcionário.

| Valor | Descrição |
|-------|-----------|
| `active` | Ativo |
| `inactive` | Inativo |
| `pending` | Aguardando ativação |

### student_status
Status do aluno.

| Valor | Descrição |
|-------|-----------|
| `active` | Ativo |
| `inactive` | Inativo |
| `pending` | Aguardando ativação |
| `suspended` | Suspenso (ex: inadimplência) |
| `blocked` | Bloqueado |

### plan_status
Status do plano do aluno.

| Valor | Descrição |
|-------|-----------|
| `active` | Plano ativo |
| `expired` | Plano expirado |
| `pending` | Aguardando pagamento |
| `suspended` | Suspenso |
| `cancelled` | Cancelado |

### invite_status
Status do convite.

| Valor | Descrição |
|-------|-----------|
| `pending` | Aguardando uso |
| `accepted` | Aceito |
| `expired` | Expirado |
| `revoked` | Revogado |

---

## Tabelas

### academies

A tabela principal de academias (tenants).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | gen_random_uuid() | PK |
| `trade_name` | text | NOT NULL | - | Nome fantasia |
| `legal_name` | text | NULL | - | Razão social |
| `tax_id` | text | NULL | - | CNPJ |
| `logo_url` | text | NULL | - | URL do logo |
| `settings` | jsonb | NULL | '{}' | Configurações da academia |
| `created_at` | timestamptz | NOT NULL | now() | Data de criação |
| `updated_at` | timestamptz | NOT NULL | now() | Última atualização |

**Índices:**
- `academies_pkey` - PRIMARY KEY (id)

---

### units

Unidades físicas de uma academia.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | gen_random_uuid() | PK |
| `academy_id` | uuid | NOT NULL | - | FK → academies |
| `name` | text | NOT NULL | - | Nome da unidade |
| `address` | text | NULL | - | Endereço completo |
| `phone` | text | NULL | - | Telefone |
| `status` | unit_status | NOT NULL | 'active' | Status |
| `qr_token` | text | NOT NULL | encode(...) | Token único para QR Code |
| `access_config` | jsonb | NULL | '{}' | Config de acesso |
| `created_at` | timestamptz | NOT NULL | now() | Data de criação |
| `updated_at` | timestamptz | NOT NULL | now() | Última atualização |

**Índices:**
- `units_pkey` - PRIMARY KEY (id)
- `units_qr_token_key` - UNIQUE (qr_token)

**Foreign Keys:**
- `units_academy_id_fkey` → academies(id) ON DELETE CASCADE

**access_config (JSONB):**
```typescript
interface AccessConfig {
  requiresPhoto?: boolean;
  maxDailyEntries?: number;
  allowedDays?: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[];
  openingHours?: { start: string; end: string };
}
```

---

### roles

Papéis do sistema com permissões.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | role_id | NOT NULL | - | PK (enum) |
| `name` | text | NOT NULL | - | Nome exibível |
| `description` | text | NULL | - | Descrição |
| `permissions` | text[] | NOT NULL | '{}' | Lista de permissões |
| `is_system` | boolean | NOT NULL | true | Se é role do sistema |

**Índices:**
- `roles_pkey` - PRIMARY KEY (id)

**Roles do Sistema:**

| Role | Permissões |
|------|------------|
| `admin` | `users:read`, `users:write`, `users:delete`, `financial:read`, `financial:write`, `settings:read`, `settings:write`, `reports:read` |
| `manager` | `users:read`, `users:write`, `financial:read`, `financial:write`, `settings:read`, `reports:read` |
| `receptionist` | `users:read`, `users:write`, `checkin:read`, `checkin:write` |
| `financial` | `financial:read`, `financial:write`, `reports:read` |
| `readonly` | `users:read`, `financial:read`, `settings:read`, `reports:read` |

---

### profiles

Dados básicos de qualquer usuário (staff ou student).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | - | PK = auth.users.id |
| `user_type` | user_type | NOT NULL | 'student' | Tipo de usuário |
| `name` | text | NOT NULL | - | Nome completo |
| `email` | text | NULL | - | Email |
| `phone` | text | NULL | - | Telefone |
| `cpf` | text | NULL | - | CPF |
| `avatar_url` | text | NULL | - | URL do avatar |
| `created_at` | timestamptz | NOT NULL | now() | Data de criação |
| `updated_at` | timestamptz | NOT NULL | now() | Última atualização |

**Índices:**
- `profiles_pkey` - PRIMARY KEY (id)
- `profiles_cpf_key` - UNIQUE (cpf) WHERE cpf IS NOT NULL
- `profiles_email_key` - UNIQUE (email) WHERE email IS NOT NULL

**Foreign Keys:**
- `profiles_id_fkey` → auth.users(id) ON DELETE CASCADE

**Trigger:**
- `on_auth_user_created` → Cria profile automaticamente ao inserir em auth.users

---

### academy_memberships

Relacionamento N:N entre profiles e academies.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | gen_random_uuid() | PK |
| `profile_id` | uuid | NOT NULL | - | FK → profiles |
| `academy_id` | uuid | NOT NULL | - | FK → academies |
| `unit_id` | uuid | NULL | - | FK → units (principal) |
| `is_primary` | boolean | NOT NULL | false | Se é academia principal |
| `joined_at` | timestamptz | NOT NULL | now() | Data de entrada |

**Índices:**
- `academy_memberships_pkey` - PRIMARY KEY (id)
- `academy_memberships_profile_id_academy_id_key` - UNIQUE (profile_id, academy_id)

**Foreign Keys:**
- `academy_memberships_profile_id_fkey` → profiles(id) ON DELETE CASCADE
- `academy_memberships_academy_id_fkey` → academies(id) ON DELETE CASCADE
- `academy_memberships_unit_id_fkey` → units(id) ON DELETE SET NULL

**Trigger:**
- `ensure_single_primary_academy` → Garante apenas uma academia primária por profile

---

### staff_profiles

Extensão de profile para funcionários.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | - | PK = profiles.id |
| `role` | role_id | NOT NULL | 'receptionist' | Papel do staff |
| `status` | staff_status | NOT NULL | 'pending' | Status |
| `custom_permissions` | text[] | NULL | - | Permissões extras |
| `last_login_at` | timestamptz | NULL | - | Último login |

**Índices:**
- `staff_profiles_pkey` - PRIMARY KEY (id)

**Foreign Keys:**
- `staff_profiles_id_fkey` → profiles(id) ON DELETE CASCADE

---

### staff_unit_assignments

Unidades às quais um staff tem acesso.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | gen_random_uuid() | PK |
| `staff_id` | uuid | NOT NULL | - | FK → staff_profiles |
| `unit_id` | uuid | NOT NULL | - | FK → units |
| `is_primary` | boolean | NOT NULL | false | Se é unidade principal |

**Índices:**
- `staff_unit_assignments_pkey` - PRIMARY KEY (id)
- `staff_unit_assignments_staff_id_unit_id_key` - UNIQUE (staff_id, unit_id)

**Foreign Keys:**
- `staff_unit_assignments_staff_id_fkey` → staff_profiles(id) ON DELETE CASCADE
- `staff_unit_assignments_unit_id_fkey` → units(id) ON DELETE CASCADE

---

### student_profiles

Extensão de profile para alunos.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | - | PK = profiles.id |
| `registration_id` | text | NOT NULL | gen_registration_id() | Matrícula: ALU-YYYY-NNNN |
| `status` | student_status | NOT NULL | 'pending' | Status |
| `plan_id` | uuid | NULL | - | ID do plano (futura FK) |
| `plan_name` | text | NULL | - | Nome do plano (snapshot) |
| `plan_status` | plan_status | NULL | 'pending' | Status do plano |
| `plan_expires_at` | timestamptz | NULL | - | Data de expiração |
| `address` | jsonb | NULL | - | Endereço completo |
| `emergency_contact` | jsonb | NULL | - | Contato de emergência |

**Índices:**
- `student_profiles_pkey` - PRIMARY KEY (id)
- `student_profiles_registration_id_key` - UNIQUE (registration_id)

**Foreign Keys:**
- `student_profiles_id_fkey` → profiles(id) ON DELETE CASCADE

**address (JSONB):**
```typescript
interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}
```

**emergency_contact (JSONB):**
```typescript
interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}
```

---

### invites

Convites para cadastro.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | gen_random_uuid() | PK |
| `academy_id` | uuid | NOT NULL | - | FK → academies |
| `unit_id` | uuid | NULL | - | FK → units |
| `created_by` | uuid | NULL | - | FK → profiles (staff) |
| `invite_type` | user_type | NOT NULL | - | Tipo: staff ou student |
| `staff_role` | role_id | NULL | - | Papel se for staff |
| `token` | text | NOT NULL | gen_invite_token() | Token único (32 hex) |
| `status` | invite_status | NOT NULL | 'pending' | Status |
| `max_uses` | integer | NOT NULL | 1 | Máximo de usos |
| `used_count` | integer | NOT NULL | 0 | Usos realizados |
| `expires_at` | timestamptz | NOT NULL | now() + 7 days | Expiração |
| `discount` | jsonb | NULL | - | Desconto aplicável |
| `created_at` | timestamptz | NOT NULL | now() | Data de criação |

**Índices:**
- `invites_pkey` - PRIMARY KEY (id)
- `invites_token_key` - UNIQUE (token)

**Foreign Keys:**
- `invites_academy_id_fkey` → academies(id) ON DELETE CASCADE
- `invites_unit_id_fkey` → units(id) ON DELETE SET NULL
- `invites_created_by_fkey` → profiles(id) ON DELETE SET NULL

**discount (JSONB):**
```typescript
interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  appliesTo: 'first_month' | 'enrollment' | 'all';
}
```

---

## Views

### my_profile

View que retorna o perfil completo do usuário logado.

```sql
SELECT 
  p.*,
  sp.*,        -- staff_profiles se user_type = 'staff'
  stp.*,       -- student_profiles se user_type = 'student'
  memberships  -- array de academy_memberships
FROM profiles p
LEFT JOIN staff_profiles sp ON ...
LEFT JOIN student_profiles stp ON ...
LEFT JOIN LATERAL (...) memberships
WHERE p.id = auth.uid()
```

### staff_with_role

View que junta staff_profiles com roles e permissões efetivas.

```sql
SELECT 
  sp.*,
  p.name, p.email, p.phone,
  r.name as role_name,
  COALESCE(sp.custom_permissions, r.permissions) as effective_permissions
FROM staff_profiles sp
JOIN profiles p ON ...
JOIN roles r ON ...
```

### students_with_status

View que mostra status consolidado de alunos.

```sql
SELECT
  stp.*,
  p.name, p.email, p.phone, p.cpf,
  CASE WHEN stp.plan_status = 'active' AND stp.status = 'active' THEN 'ok'
       WHEN stp.plan_status = 'expired' THEN 'expired'
       ELSE 'attention'
  END as access_status
FROM student_profiles stp
JOIN profiles p ON ...
```

---

## Funções Auxiliares

### gen_registration_id()

Gera matrícula no formato `ALU-YYYY-NNNN`.

```sql
gen_registration_id() → text
-- Exemplo: ALU-2025-0001
```

### gen_invite_token()

Gera token único de 32 caracteres hex.

```sql
gen_invite_token() → text
-- Exemplo: a1b2c3d4e5f6...
```

### validate_invite(token text)

Valida um convite e retorna seus dados se válido.

```sql
validate_invite('abc123') → jsonb
-- Retorna: { id, academy_id, unit_id, invite_type, staff_role, discount }
-- Ou NULL se inválido/expirado
```

### has_permission(user_id uuid, permission text)

Verifica se usuário tem determinada permissão.

```sql
has_permission(auth.uid(), 'users:write') → boolean
```

### is_member_of_academy(user_id uuid, academy_id uuid)

Verifica se usuário pertence a uma academia.

```sql
is_member_of_academy(auth.uid(), 'academy-uuid') → boolean
```

---

## Próximas Tabelas (Roadmap)

- [ ] `plans` - Planos de assinatura
- [ ] `subscriptions` - Assinaturas de alunos
- [ ] `access_logs` - Log de entradas/saídas
- [ ] `payments` - Pagamentos
- [ ] `contracts` - Contratos digitais
- [ ] `audit_logs` - Auditoria de ações
