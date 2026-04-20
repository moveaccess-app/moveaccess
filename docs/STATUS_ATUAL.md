# STATUS ATUAL (DEV) — 2026-04-16

## Baseline por módulo

| Módulo | Tela/rota | Fonte atual (mock/service Supabase) | Feature flag | Pronto? | Pendências |
|---|---|---|---|---|---|
| Auth | `/login`, `/aluno/login`, guards (`AuthContext`) | `authService` (switch mock/Supabase) | `NEXT_PUBLIC_USE_SUPABASE_AUTH` | Parcial | Consolidar campos de perfil/tenancy vindos de Supabase em toda a sessão; fluxo convite/cadastro público já validado em STG |
| Home | `/home` | `lib/home/homeService` + RPC `get_home_overview()` | — | 🟡 | Últimos acessos seguem placeholder estável até existir `access_logs` |
| Usuários (lista) | `/users` | `usersService` (contrato canônico + switch) | `NEXT_PUBLIC_USE_SUPABASE_USERS` | ✅ | Listagem, busca e filtros em dados reais com flag ativa |
| Usuários (detalhe) | `/users/[id]` | `usersService` (contrato canônico + placeholders estáveis) | `NEXT_PUBLIC_USE_SUPABASE_USERS` | 🟡 | Seções Access/Contracts/Financial/Documents seguem placeholders estáveis até backend completo |
| Settings (academy/units) | `/settings`, `/settings/academy`, `/settings/units`, `/settings/units/[id]` | `lib/settings` + `teamService` (switch com placeholder estável para integrações) | `NEXT_PUBLIC_USE_SUPABASE_SETTINGS` | 🟡 | `/settings` já sem mock direto; integrações/audit/policies seguem sem backend real |
| Settings (team) | `/settings/team` | `teamService` + RPCs Supabase (`get_team_staff_list`, `create_team_staff`, `update_team_staff`) | — | ✅ | CRUD principal real com guardas de tenancy e mutações admin-only |
| Access | `/access`, `/access/log`, `/acesso/checkin`, `/(protected)/scanner`, `/aluno` via `lib/access` + migrations `access_logs` + `plan_access_rules` + hook `useQrScanner` + QR fixo do aluno; `/access/releases` ainda mock | — | ✅ | Check-in manual, scanner QR e QR do aluno reais; `process_checkin_by_identifier()` aceita CPF/e-mail/telefone e `MOVEACCESS:STUDENT:{student_id}` |
| Plans | `/plans`, `/plans/[id]`, `/plans/new` | `lib/plans/plansService` + tabela `plans` | — | ✅ | CRUD principal do catálogo já conectado ao Supabase |
| Contratos | `/contratos`, `/contratos/[id]`, `/contratos/novo`, `/contratos/[id]/editar` | Mock direto (`contractTemplatesMock`) | — | Não | Migrar templates e variáveis de contrato para Supabase |
| Assinaturas | `/assinaturas`, `/assinaturas/[id]`, `/assinaturas/new` | `lib/subscriptions/subscriptionService` + tabela `subscriptions` | — | ✅ | CRUD principal, vínculo aluno/plano e sync do snapshot do aluno validados em STG |
| Financeiro | `/financial`, `/financial/cobranca/[id]` | `lib/payments/paymentService` + tabela `payments` | — | ✅ | Criação de cobrança, baixa manual, listagem por aluno e inadimplência derivada de `payments` validadas em STG |
| Onboarding staff | `/users/onboarding` | `lib/users/onboardingService` (draft real em `student_drafts` + publish via RPC) | — | 🟡 | Etapas de plano/pagamento/contrato ainda usam catálogo/UX local; validar ponta-a-ponta em STG com usuários reais |
| Onboarding público | `/cadastro/[token]`, `/cadastro/continuar` | `lib/invites` (RPC Supabase: `get_invite_signup_context`, `claim_invite_signup`, `get_my_invite_signup_session`, `save_my_invite_signup_progress`, `complete_my_invite_signup`) + middleware server-side | — | ✅ | Fluxo endurecido validado em STG; sem dependência de `finalize_invite_signup`/`is_invite_valid`; `validate_invite_token` alinhada ao mesmo estado de token cancelado/claimado/concluído |
| API interna (core) | `/api/auth/login`, `/api/user/[id]` | Estrutura clean architecture com retorno mock/exemplo | — | Parcial | Integrar casos de uso com repositórios reais Supabase |

---

## Páginas que ainda importam `src/mocks` diretamente

- `src/app/(app)/settings/policies/page.tsx`
- `src/app/(app)/settings/integrations/page.tsx`
- `src/app/(app)/settings/audit/page.tsx`
- `src/app/(app)/contratos/novo/page.tsx`
- `src/app/(app)/contratos/[id]/page.tsx`
- `src/app/(app)/contratos/page.tsx`
- `src/app/(app)/contratos/[id]/editar/page.tsx`
- `src/app/(app)/access/releases/page.tsx`

---

## Services Supabase existentes e onde são usados

| Service Supabase | Switch layer / entrada | Onde é usado no app |
|---|---|---|
| `src/lib/auth/authServiceSupabase.ts` | `src/lib/auth/authService.ts` | `src/contexts/AuthContext.tsx` (login/logout/session) e, por consequência, páginas com `useAuth` |
| `src/lib/users/usersServiceSupabase.ts` | `src/lib/users/usersService.ts` (`src/lib/users/index.ts`) | `src/app/(app)/users/page.tsx`, `src/app/(app)/users/[id]/page.tsx` |
| `student_drafts` + RPC `finalize_student_draft` (REST Supabase) | `src/lib/users/onboardingService.ts` (`src/lib/users/index.ts`) | `src/app/(app)/users/onboarding/page.tsx` |
| `src/lib/home/homeServiceSupabase.ts` + RPC `get_home_overview()` | `src/lib/home/homeService.ts` (`src/lib/home/index.ts`) | `src/app/(app)/home/page.tsx` |
| `src/lib/settings/settingsServiceSupabase.ts` | `src/lib/settings/settingsService.ts` (`src/lib/settings/index.ts`) | `src/app/(app)/settings/page.tsx`, `src/app/(app)/settings/academy/page.tsx`, `src/app/(app)/settings/units/page.tsx`, `src/app/(app)/settings/units/[id]/page.tsx` |
| `src/lib/settings/teamServiceSupabase.ts` | `src/lib/settings/teamService.ts` | `src/app/(app)/settings/team/page.tsx` |
| `src/lib/access/accessServiceSupabase.ts` + RPCs `process_checkin`, `process_checkin_by_identifier` + tabela `plan_access_rules` | `src/lib/access/accessService.ts` (`src/lib/access/index.ts`) | `src/app/acesso/checkin/page.tsx`, `src/app/(app)/access/page.tsx`, `src/app/(app)/access/log/page.tsx` |
| `src/lib/plans/plansServiceSupabase.ts` | `src/lib/plans/plansService.ts` (`src/lib/plans/index.ts`) | `src/app/(app)/plans/page.tsx`, `src/app/(app)/plans/[id]/page.tsx`, `src/app/(app)/plans/new/page.tsx` |
| `src/lib/subscriptions/subscriptionServiceSupabase.ts` | `src/lib/subscriptions/subscriptionService.ts` | `src/app/(app)/assinaturas/page.tsx`, `src/app/(app)/assinaturas/[id]/page.tsx`, `src/app/(app)/assinaturas/new/page.tsx` |
| `src/lib/payments/paymentServiceSupabase.ts` | `src/lib/payments/paymentService.ts` | `src/app/(app)/financial/page.tsx`, `src/app/(app)/financial/cobranca/[id]/page.tsx` |
| `src/hooks/useQrScanner.ts` (jsQR + getUserMedia) | — (hook direto) | `src/app/(protected)/scanner/page.tsx` |
| `src/components/student/StudentQRCode.tsx` (`qrcode.react`) | — (componente direto) | `src/app/aluno/page.tsx` |

---

## Observações de segurança da retomada (DEV first)

- A fundação de auth foi unificada no contrato `CurrentUser` (ver `docs/CURRENT_USER_CONTRACT.md`).
- As mudanças foram feitas somente no fluxo DEV/local.
- Access, Plans, Assinaturas e Financeiro já foram validados em STG antes da replicação estrutural em PRD.
- Access agora também cobre regras de assinatura/plano no check-in antes da liberação física.
- O QR fixo MVP do aluno usa o formato `MOVEACCESS:STUDENT:{student_id}` e já foi validado em STG com leitura pelo fluxo de scanner.
