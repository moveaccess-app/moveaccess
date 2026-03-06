# STATUS ATUAL (DEV) — 2026-03-04

## Baseline por módulo

| Módulo | Tela/rota | Fonte atual (mock/service Supabase) | Feature flag | Pronto? | Pendências |
|---|---|---|---|---|---|
| Auth | `/login`, `/aluno/login`, guards (`AuthContext`) | `authService` (switch mock/Supabase) | `NEXT_PUBLIC_USE_SUPABASE_AUTH` | Parcial | Consolidar campos de perfil/tenancy vindos de Supabase em toda a sessão; validar fluxo convite/cadastro real |
| Home | `/home` | Mock direto (`homeMock`) | — | Não | Migrar KPIs/alertas/histórico para service real |
| Usuários (lista) | `/users` | `usersService` (contrato canônico + switch) | `NEXT_PUBLIC_USE_SUPABASE_USERS` | ✅ | Listagem, busca e filtros em dados reais com flag ativa |
| Usuários (detalhe) | `/users/[id]` | `usersService` (contrato canônico + placeholders estáveis) | `NEXT_PUBLIC_USE_SUPABASE_USERS` | 🟡 | Seções Access/Contracts/Financial/Documents seguem placeholders estáveis até backend completo |
| Settings (academy/units) | `/settings`, `/settings/academy`, `/settings/units`, `/settings/units/[id]` | `lib/settings` + `teamService` (switch com placeholder estável para integrações) | `NEXT_PUBLIC_USE_SUPABASE_SETTINGS` | 🟡 | `/settings` já sem mock direto; integrações/audit/policies seguem sem backend real |
| Settings (team) | `/settings/team` | `teamService` (switch) | `NEXT_PUBLIC_USE_SUPABASE_SETTINGS` | Parcial | Validar CRUD completo com permissões reais e auditoria |
| Access | `/access`, `/access/log`, `/access/releases`, `/acesso/checkin`, `/(protected)/scanner` | Mock direto (`accessMock`) | — | Não | Criar módulo service + regras reais de liberação/check-in |
| Plans | `/plans`, `/plans/[id]`, `/plans/new` | Mock direto (`plansMock`) | — | Não | Migrar catálogo de planos para Supabase |
| Contratos | `/contratos`, `/contratos/[id]`, `/contratos/novo`, `/contratos/[id]/editar` | Mock direto (`contractTemplatesMock`) | — | Não | Migrar templates e variáveis de contrato para Supabase |
| Assinaturas | `/assinaturas`, `/assinaturas/[id]`, `/assinaturas/new` | Mock direto (`contractsMock`, `plansMock`, `usersMock`) | — | Não | Migrar assinatura/renovação/cancelamento para serviços reais |
| Financeiro | `/financial`, `/financial/cobranca/[id]` | Mock direto (`financialMock`) | — | Não | Migrar cobranças, inadimplência e ações financeiras |
| Onboarding staff | `/users/onboarding` | `lib/users/onboardingService` (draft real em `student_drafts` + publish via RPC) | — | 🟡 | Etapas de plano/pagamento/contrato ainda usam catálogo/UX local; validar ponta-a-ponta em STG com usuários reais |
| Onboarding público | `/cadastro/[token]` | `lib/invites` (RPC Supabase: `get_invite_signup_context` + `finalize_invite_signup`) | — | 🟡 | Validar finalize ponta-a-ponta no STG após ajuste final na criação de usuário `auth.users` |
| API interna (core) | `/api/auth/login`, `/api/user/[id]` | Estrutura clean architecture com retorno mock/exemplo | — | Parcial | Integrar casos de uso com repositórios reais Supabase |

---

## Páginas que ainda importam `src/mocks` diretamente

- `src/app/acesso/checkin/page.tsx`
- `src/app/(protected)/scanner/page.tsx`
- `src/app/(app)/settings/policies/page.tsx`
- `src/app/(app)/settings/integrations/page.tsx`
- `src/app/(app)/settings/audit/page.tsx`
- `src/app/(app)/plans/new/page.tsx`
- `src/app/(app)/plans/[id]/page.tsx`
- `src/app/(app)/plans/page.tsx`
- `src/app/(app)/home/page.tsx`
- `src/app/(app)/contratos/novo/page.tsx`
- `src/app/(app)/contratos/[id]/page.tsx`
- `src/app/(app)/contratos/page.tsx`
- `src/app/(app)/financial/page.tsx`
- `src/app/(app)/contratos/[id]/editar/page.tsx`
- `src/app/(app)/financial/cobranca/[id]/page.tsx`
- `src/app/(app)/assinaturas/page.tsx`
- `src/app/(app)/assinaturas/[id]/page.tsx`
- `src/app/(app)/assinaturas/new/page.tsx`
- `src/app/(app)/access/log/page.tsx`
- `src/app/(app)/access/page.tsx`
- `src/app/(app)/access/releases/page.tsx`

---

## Services Supabase existentes e onde são usados

| Service Supabase | Switch layer / entrada | Onde é usado no app |
|---|---|---|
| `src/lib/auth/authServiceSupabase.ts` | `src/lib/auth/authService.ts` | `src/contexts/AuthContext.tsx` (login/logout/session) e, por consequência, páginas com `useAuth` |
| `src/lib/users/usersServiceSupabase.ts` | `src/lib/users/usersService.ts` (`src/lib/users/index.ts`) | `src/app/(app)/users/page.tsx`, `src/app/(app)/users/[id]/page.tsx` |
| `student_drafts` + RPC `finalize_student_draft` (REST Supabase) | `src/lib/users/onboardingService.ts` (`src/lib/users/index.ts`) | `src/app/(app)/users/onboarding/page.tsx` |
| `src/lib/settings/settingsServiceSupabase.ts` | `src/lib/settings/settingsService.ts` (`src/lib/settings/index.ts`) | `src/app/(app)/settings/page.tsx`, `src/app/(app)/settings/academy/page.tsx`, `src/app/(app)/settings/units/page.tsx`, `src/app/(app)/settings/units/[id]/page.tsx` |
| `src/lib/settings/teamServiceSupabase.ts` | `src/lib/settings/teamService.ts` | `src/app/(app)/settings/team/page.tsx` |

---

## Observações de segurança da retomada (DEV first)

- A fundação de auth foi unificada no contrato `CurrentUser` (ver `docs/CURRENT_USER_CONTRACT.md`).
- As mudanças foram feitas somente no fluxo DEV/local.
- A replicação para PROD deve ser feita depois da validação funcional em DEV (sem aplicar automaticamente).
