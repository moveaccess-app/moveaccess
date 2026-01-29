# RLS (Row Level Security) - MoveAccess

## Visão Geral

O sistema utiliza RLS para garantir isolamento de dados por academia (multi-tenant).

## Funções Helper

| Função | Descrição |
|--------|-----------|
| `auth.uid()` | ID do usuário autenticado |
| `is_staff()` | Retorna TRUE se usuário é staff |
| `get_user_academy_ids()` | Retorna array de academy_ids do usuário |
| `has_permission(perm)` | Verifica se usuário tem permissão específica |

## Policies por Tabela

### profiles

| Policy | Ação | Condição |
|--------|------|----------|
| Usuário vê próprio perfil | SELECT | `id = auth.uid()` |
| Staff vê perfis da mesma academia | SELECT | `is_staff() AND EXISTS (am com mesma academy)` |
| Usuário edita próprio perfil | UPDATE | `id = auth.uid()` |
| Allow email lookup by cpf for login | SELECT | `cpf IS NOT NULL` |

### staff_profiles

| Policy | Ação | Condição |
|--------|------|----------|
| Staff vê próprio perfil | SELECT | `id = auth.uid()` |
| Admin vê staff da academia | SELECT | `has_permission('settings:manage_team') AND mesma academy` |
| Users can create own staff profile | INSERT | (sem restrição adicional) |

### student_profiles

| Policy | Ação | Condição |
|--------|------|----------|
| Aluno vê próprio perfil | SELECT | `id = auth.uid()` |
| Staff vê alunos da academia | SELECT | `is_staff() AND has_permission('users:view') AND mesma academy` |
| Staff edita alunos | UPDATE | `is_staff() AND has_permission('users:edit') AND mesma academy` |
| Users can create own student profile | INSERT | (sem restrição adicional) |

### units

| Policy | Ação | Condição |
|--------|------|----------|
| Usuário vê unidades das suas academias | SELECT | `academy_id = ANY(get_user_academy_ids())` |
| Staff gerencia unidades | ALL | `academy_id = ANY(get_user_academy_ids()) AND has_permission('settings:manage_units')` |

### academies

| Policy | Ação | Condição |
|--------|------|----------|
| Usuário vê suas academias | SELECT | `id = ANY(get_user_academy_ids())` |
| Admin edita academia | UPDATE | `id = ANY(get_user_academy_ids()) AND has_permission('settings:edit_academy')` |

### academy_memberships

| Policy | Ação | Condição |
|--------|------|----------|
| Usuário vê próprias memberships | SELECT | `profile_id = auth.uid()` |
| Staff vê memberships da academia | SELECT | `is_staff() AND academy_id = ANY(get_user_academy_ids())` |
| Users can create own membership | INSERT | (sem restrição adicional) |
| Users can update own membership | UPDATE | `profile_id = auth.uid()` |

## View my_profile

Retorna o perfil completo do usuário autenticado com:
- Dados básicos (id, email, name, user_type)
- Campos de staff (role, status, permissions)
- Campos de student (plan_status, plan_name)
- **academy_ids** - Array de IDs das academias
- **academies** - JSONB com detalhes das academias

## Cenários de Teste

### Staff A (Move Fitness)
- ✅ Vê alunos da Move Fitness
- ❌ NÃO vê alunos da Gym Elite
- ✅ Vê unidades da Move Fitness
- ❌ NÃO vê unidades da Gym Elite

### Staff B (Gym Elite)
- ✅ Vê alunos da Gym Elite
- ❌ NÃO vê alunos da Move Fitness
- ✅ Vê unidades da Gym Elite
- ❌ NÃO vê unidades da Move Fitness

### Aluno (qualquer)
- ✅ Vê apenas próprio perfil
- ❌ NÃO vê outros alunos
- ❌ NÃO vê staff

## Dados de Teste (STG)

### Academies
| ID | Nome |
|----|------|
| a0000000-0000-0000-0000-000000000001 | Move Fitness |
| b0000000-0000-0000-0000-000000000002 | Gym Elite |

### Users
| Email | Tipo | Academia | Senha |
|-------|------|----------|-------|
| admin@moveaccess.com | Staff | Move Fitness | Admin123! |
| staff.b@gymelite.com | Staff | Gym Elite | StaffB123! |
| aluno3@teste.com | Student | Move Fitness | - |
| aluno4@teste.com | Student | Move Fitness | Aluno123! |
| aluno.b@gymelite.com | Student | Gym Elite | AlunoB123! |

---

*Última atualização: 27/01/2026*
