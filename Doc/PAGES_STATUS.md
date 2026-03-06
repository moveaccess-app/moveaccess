# MoveAccess — Status das Páginas

> Auditoria completa: quais páginas usam dados reais do banco vs. dados mockados.
> Atualizado em: 05/03/2026

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | 100% banco de dados real |
| 🟡 | Parcialmente real (feature flag ou mix de fontes) |
| 🔴 | 100% mockado — precisa migrar |
| 🚫 | Não tem tabela no banco — requer modelagem + implementação |
| ⚙️ | Sem banco (local storage / UI puro) |
| 🗑️ | Descartada / redirect / demo |

---

## Resumo Executivo

| Status | Quantidade |
|--------|-----------|
| ✅ Real | 5 |
| 🟡 Parcial | 4 |
| 🔴 Mock (pode migrar logo) | 12 |
| 🚫 Sem backend (requer modelagem) | 11 |
| ⚙️ Sem banco | 2 |
| 🗑️ Descartada | 4 |

---

## Módulo: Autenticação / Público

### `/login`
**Status:** ✅ Real  
**Rota:** `src/app/login/page.tsx`  
**Dados:** AuthContext → `lib/auth/authService.ts` → `authServiceSupabase.ts`  
**Feature flag:** `NEXT_PUBLIC_USE_SUPABASE_AUTH=true` (ativo em `NODE_ENV=production`)  
**Tabelas:** `auth.users`, `auth.identities`, `public.profiles`  
**Observação:** Totalmente funcional. Login STG e PRD validados.

---

### `/aluno/login`
**Status:** ✅ Real  
**Rota:** `src/app/aluno/login/page.tsx`  
**Dados:** Mesmo fluxo de auth via Supabase  
**Tabelas:** `auth.users`, `public.profiles` (com `user_type = 'student'`)

---

### `/aluno`
**Status:** ✅ Real  
**Rota:** `src/app/aluno/page.tsx`  
**Dados:** `useAuth()`, `useRequireStudent()` — dados do usuário autenticado  
**Tabelas:** `profiles`, `student_profiles`  
**Observação:** Portal do aluno funciona, mas exibe apenas dados básicos de auth. Sem histórico de acesso real.

---

### `/cadastro/[token]`
**Status:** 🟡 Parcial (real em STG, validação final pendente)  
**Rota:** `src/app/cadastro/[token]/page.tsx`  
**Dados:** `src/lib/invites/inviteServiceSupabase.ts` via RPCs `get_invite_signup_context` + `finalize_invite_signup`  
**Tabelas usadas:** `invite_links`, `profiles`, `student_profiles`, `academy_memberships`, `student_unit_assignments`, `auth.users`  
**O que falta:** finalizar validação E2E do `finalize_invite_signup` no STG e depois promover para PRD mediante autorização explícita.  
**Prioridade:** 🔥 Alta — fluxo de cadastro de novos alunos

---

### `/acesso/checkin`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/acesso/checkin/page.tsx`  
**Mocks:** `accessMock.ts` (`mockUnits`)  
**O que falta:** Tabela de check-in / validação de acesso no banco. A lógica de validação existe parcialmente em `accessMock.ts`. Requer modelagem de tabela `access_logs`.

---

## Módulo: App (área autenticada — staff)

### `/home`
**Status:** 🟡 Parcial (dados reais + placeholder de acessos)  
**Rota:** `src/app/(app)/home/page.tsx`  
**Serviço:** `src/lib/home/homeService.ts` → `homeServiceSupabase.ts` (RPC `get_home_overview`)  
**Tabelas usadas:** `academy_memberships`, `profiles`, `student_profiles`, `student_drafts`, `invite_links`, `units`  
**O que falta:** bloco “Últimos acessos” permanece sem dados reais (placeholder estável) até criação de `access_logs`.  
**Prioridade:** 🔥 Alta — primeira tela após o login

---

### `/users`
**Status:** 🟡 Parcial  
**Rota:** `src/app/(app)/users/page.tsx`  
**Serviço:** `lib/users/usersService.ts` → feature flag `USE_SUPABASE_USERS`  
**Quando real:** Se `NEXT_PUBLIC_USE_SUPABASE_USERS=true` → chama `usersServiceSupabase.ts`  
**Quando mock:** Fallback para `usersMock.ts`  
**Tabelas:** `profiles`, `student_profiles`, `student_unit_assignments`, `academy_memberships`  
**View disponível:** `student_list_view` ✅ (já criada no banco)  
**O que falta:** Ativar a feature flag no `.env.local`. A implementação Supabase existe.  
**Prioridade:** 🔥 Alta — tabela de alunos é core do sistema

---

### `/users/[id]`
**Status:** 🟡 Parcial  
**Rota:** `src/app/(app)/users/[id]/page.tsx`  
**Serviço:** `getUserById` de `lib/users/usersService.ts`  
**Quando real:** Chama `usersServiceSupabase.ts` — retorna dados básicos do aluno  
**O que falta:** Seções de Acesso, Contratos, Financeiro e Documentos retornam dados **default/placeholder** (comentários TODO no serviço). Requer implementação quando esses módulos forem construídos.  
**Prioridade:** 🟠 Média

---

### `/users/onboarding`
**Status:** 🔴 Mock  
**Rota:** `src/app/(app)/users/onboarding/page.tsx`  
**Mocks:** `onboardingMock.ts` — steps, validações, estados  
**Tabelas necessárias:** `student_drafts`, `invite_links`, `profiles`, `student_profiles`  
**O que falta:** Conectar o stepper multi-etapas ao fluxo real de `student_drafts` + `use_invite_token`. A função SQL `complete_user_setup()` já existe.  
**Prioridade:** 🔥 Alta — fluxo de criação de novo aluno pelo staff

---

## Módulo: Acesso

### `/access` (dashboard)
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/access/page.tsx`  
**Mocks:** `accessMock.ts` — histórico de acessos, status da academia  
**O que falta:** Tabela `access_logs` no banco. Toda a lógica de validação de QR Code + registro de entrada/saída.  
**Prioridade:** 🟠 Média (depende de modelagem)

---

### `/access/log`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/access/log/page.tsx`  
**Mocks:** `accessMock.ts` — histórico filtrado por unidade/data  
**O que falta:** Tabela `access_logs` + queries de filtro.

---

### `/access/releases`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/access/releases/page.tsx`  
**Mocks:** `accessMock.ts` — QR Codes por unidade, configurações  
**O que falta:** Tabela/configuração de QR Codes por unidade (pode usar `units.access_config` que já existe como JSONB). Lógica de geração de QR Code.  
**Prioridade:** 🟠 Média

---

### `/scanner`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(protected)/scanner/page.tsx`  
**Mocks:** `accessMock.ts`, `authMock.ts`  
**TODOs no código:**
- Integrar com câmera real (`getUserMedia` API)
- Usar lib de QR Code scanner (`jsQR`, `@zxing/library`)
- Integrar com WebSocket para enviar resultado
- Implementar validação via API real  
**Prioridade:** 🟠 Média (depende do módulo Access)

---

## Módulo: Financeiro

### `/financial`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/financial/page.tsx`  
**Mocks:** `financialMock.ts` — receita, cobranças, inadimplência  
**O que falta:** Modelagem completa do módulo financeiro: tabelas `payments`, `charges`, `subscriptions` (ou equivalentes). Nenhuma tabela financeira existe no banco atual.  
**Prioridade:** 🟡 Baixa-Média (módulo futuro)

---

### `/financial/cobranca/[id]`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/financial/cobranca/[id]/page.tsx`  
**Mocks:** `financialMock.ts` — detalhe de cobrança individual

---

## Módulo: Contratos

### `/contratos`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/contratos/page.tsx`  
**Mocks:** `contractTemplatesMock.ts` — templates de contratos  
**O que falta:** Tabela `contract_templates` no banco. Nenhuma tabela de contratos existe.  
**Prioridade:** 🟡 Baixa-Média

---

### `/contratos/[id]`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/contratos/[id]/page.tsx`  
**Mocks:** `contractTemplatesMock.ts`  
**Observação:** Todas as ações (publicar versão, arquivar, duplicar, PDF) são `alert('...(mock)')`.

---

### `/contratos/novo`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/contratos/novo/page.tsx`

---

### `/contratos/[id]/editar`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/contratos/[id]/editar/page.tsx`

---

## Módulo: Planos

### `/plans`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/plans/page.tsx`  
**Mocks:** `plansMock.ts` — lista de planos com stats  
**O que falta:** Tabela `plans` no banco. Existe `plan_name`, `plan_status`, `plan_expires_at` em `student_profiles`, mas sem tabela própria de planos.  
**Prioridade:** 🟠 Média — precede o módulo de Assinaturas

---

### `/plans/[id]`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/plans/[id]/page.tsx`  
**Mocks:** `plansMock.ts`

---

### `/plans/new`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/plans/new/page.tsx`

---

## Módulo: Assinaturas

### `/assinaturas`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/assinaturas/page.tsx`  
**Mocks:** `contractsMock.ts` — contratos/assinaturas de alunos  
**O que falta:** Tabela `subscriptions` ou equivalente.  
**Prioridade:** 🟡 Baixa-Média

---

### `/assinaturas/[id]`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/assinaturas/[id]/page.tsx`

---

### `/assinaturas/new`
**Status:** 🚫 Mock + Sem tabela  
**Rota:** `src/app/(app)/assinaturas/new/page.tsx`

---

## Módulo: Configurações

### `/settings` (index)
**Status:** 🟡 Parcial  
**Rota:** `src/app/(app)/settings/page.tsx`  
**Real:** Dados da academia (via `lib/settings` → Supabase quando feature flag ativa)  
**Mock:** Staff e Integrações ainda de `settingsMock.ts`  
**Observação:** Comentário no código: `// Ainda usando mock para staff e integrations`

---

### `/settings/academy`
**Status:** ✅ Real  
**Rota:** `src/app/(app)/settings/academy/page.tsx`  
**Serviço:** `getAcademy()`, `updateAcademy()` — `lib/settings/settingsServiceSupabase.ts`  
**Tabelas:** `academies`, `academy_memberships`  
**Feature flag:** `NEXT_PUBLIC_USE_SUPABASE_SETTINGS`  
**Observação:** Funcional. CRUD completo da academia.

---

### `/settings/units`
**Status:** ✅ Real  
**Rota:** `src/app/(app)/settings/units/page.tsx`  
**Serviço:** `getUnits()`, `deleteUnit()` — `lib/settings`  
**Tabelas:** `units`, `academy_memberships`  
**Feature flag:** `NEXT_PUBLIC_USE_SUPABASE_SETTINGS`

---

### `/settings/units/[id]`
**Status:** ✅ Real  
**Rota:** `src/app/(app)/settings/units/[id]/page.tsx`  
**Serviço:** `getUnit()`, `createUnit()`, `updateUnit()` — `lib/settings`  
**Tabelas:** `units`

---

### `/settings/team`
**Status:** ✅ Real  
**Rota:** `src/app/(app)/settings/team/page.tsx`  
**Serviço:** `lib/settings/teamService.ts` → `teamServiceSupabase.ts` (sem fallback mock)  
**RPCs:** `get_team_staff_list`, `create_team_staff`, `update_team_staff`  
**Tabelas:** `profiles`, `staff_profiles`, `staff_unit_assignments`, `academy_memberships`, `roles`, `units`, `auth.users`  
**Segurança:** tenancy por academy + mutações permitidas apenas para admin via guardas no banco  
**Prioridade:** 🔥 Alta

---

### `/settings/appearance`
**Status:** ⚙️ Sem banco  
**Rota:** `src/app/(app)/settings/appearance/page.tsx`  
**Dados:** `useTheme()` — tema claro/escuro via `lib/theme-provider.tsx`  
**Observação:** Funcional. Persiste em `localStorage`. Não requer banco.

---

### `/settings/audit`
**Status:** 🔴 Mock  
**Rota:** `src/app/(app)/settings/audit/page.tsx`  
**Mocks:** `settingsMock.ts` — `getAuditLogs()`  
**O que falta:** Tabela `audit_logs` no banco + triggers de auditoria.  
**Prioridade:** 🟡 Baixa (feature futura)

---

### `/settings/policies`
**Status:** 🔴 Mock  
**Rota:** `src/app/(app)/settings/policies/page.tsx`  
**Mocks:** `settingsMock.ts` — políticas de acesso, termos  
**O que falta:** Campo `preferences` JSONB em `academies` pode armazenar isso, ou tabela dedicada.

---

### `/settings/integrations`
**Status:** 🔴 Mock  
**Rota:** `src/app/(app)/settings/integrations/page.tsx`  
**Mocks:** `settingsMock.ts` — integrações (Stripe, WhatsApp, etc.)  
**O que falta:** Tabela/configuração de integrações (provavelmente JSONB em `academies.preferences`).

---

## Rotas Descartadas / Demo

| Rota | Status | Motivo |
|------|--------|--------|
| `/contracts/*` | 🗑️ Redirect | Redirect para `/contratos`. Pasta pode ser removida. |
| `/design-system-example` | 🗑️ Demo | Apenas showcase de componentes UI |
| `/sidebar-demo` | 🗑️ Demo | Apenas demo de layout |
| `/` (root) | 🗑️ Redirect | Redirect para `/home` ou `/login` |

---

## Estado do Banco de Dados (Tabelas Existentes)

### ✅ Tabelas que existem (STG + PRD sincronizados)

| Tabela | Usada por |
|--------|-----------|
| `academies` | `/settings/academy` ✅ |
| `units` | `/settings/units/*` ✅ |
| `profiles` | Auth, Users, Settings ✅ |
| `staff_profiles` | `/settings/team` ✅ |
| `student_profiles` | `/users`, `/users/[id]` 🟡 |
| `academy_memberships` | Auth, Settings ✅ |
| `student_unit_assignments` | Users 🟡 |
| `staff_unit_assignments` | Team ✅ |
| `roles` | Team ✅ |
| `invites` | Onboarding 🔴 |
| `invite_links` | Onboarding 🔴 |
| `student_drafts` | Onboarding 🔴 |

### 🚫 Tabelas que NÃO existem (precisam ser criadas)

| Tabela (sugestão) | Módulo | Prioridade |
|-------------------|--------|-----------|
| `access_logs` | Acesso / Scanner | 🟠 Média |
| `plans` | Planos | 🟠 Média |
| `subscriptions` | Assinaturas | 🟠 Média |
| `contract_templates` | Contratos | 🟡 Baixa |
| `payments` / `charges` | Financeiro | 🟡 Baixa |
| `audit_logs` | Auditoria | 🟡 Baixa |

---

## Plano de Migração Sugerido

### 🔥 Fase 1 — Alta Prioridade (dados já existem no banco)

1. **Ativar feature flags**
   - Adicionar ao `.env.local`:
     ```
     NEXT_PUBLIC_USE_SUPABASE_AUTH=true
     NEXT_PUBLIC_USE_SUPABASE_SETTINGS=true
     NEXT_PUBLIC_USE_SUPABASE_USERS=true
     ```
   - Isso ativa automaticamente: `/users`, `/settings/team`, `/settings/academy`, `/settings/units`

2. **`/cadastro/[token]`** — conectar à `invite_links` + `use_invite_token()` + `complete_user_setup()`  
   Funções SQL já existem no banco!

3. **`/users/onboarding`** — conectar stepper ao fluxo de `student_drafts`  
   Tabela `student_drafts` já existe!

4. **`/home`** — substituir `homeMock.ts` por queries reais de KPIs em `student_profiles` + `profiles`

---

### 🟠 Fase 2 — Requer nova modelagem de banco

5. **Módulo Access** — criar `access_logs`, conectar `/access`, `/access/log`, `/access/releases`, `/scanner`

6. **Módulo Plans** — criar tabela `plans`, conectar `/plans/*`

7. **Módulo Assinaturas** — criar tabela `subscriptions`, conectar `/assinaturas/*`

---

### 🟡 Fase 3 — Módulos futuros

8. **Módulo Contratos** — criar `contract_templates`, editor de contratos

9. **Módulo Financeiro** — criar `payments`, `charges`, integração Stripe

10. **Auditoria / Políticas** — `audit_logs`, `preferences` em academias

---

## Arquivos de Mock (referência)

| Arquivo | Usado por |
|---------|-----------|
| `mocks/homeMock.ts` | `/home` |
| `mocks/usersMock.ts` | `/users`, `/users/[id]` (fallback) |
| `mocks/accessMock.ts` | `/access/*`, `/scanner`, `/acesso/checkin` |
| `mocks/financialMock.ts` | `/financial/*` |
| `mocks/contractTemplatesMock.ts` | `/contratos/*` |
| `mocks/contractsMock.ts` | `/assinaturas/*` |
| `mocks/plansMock.ts` | `/plans/*` |
| `mocks/settingsMock.ts` | `/settings/audit`, `/settings/policies`, `/settings/integrations` |
| `mocks/onboardingMock.ts` | `/users/onboarding`, `/cadastro/[token]` |
| `mocks/inviteMock.ts` | `/cadastro/[token]` |
| `mocks/authMock.ts` | `/scanner` (fallback dev) |
