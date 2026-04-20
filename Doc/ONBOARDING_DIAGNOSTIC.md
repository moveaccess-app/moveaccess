# Diagnóstico — Onboarding interno e cadastro público do MoveAccess

> Gerado em 15/04/2026. Baseado integralmente no código, migrations, services, RPCs e componentes do repositório.
> Atualização operacional em 16/04/2026: este documento deve ser lido como snapshot histórico anterior ao endurecimento de convites. Para o estado corrente, use `docs/STATUS_ATUAL.md` e `Doc/PAGES_STATUS.md` como fonte de verdade.
> Onde este diagnóstico citar `finalize_invite_signup` ou `is_invite_valid`, considere substituído pelo fluxo atual `get_invite_signup_context` + `claim_invite_signup` + `get_my_invite_signup_session` + `complete_my_invite_signup`.

---

## 1. Resumo executivo

### O que já é real

- **Onboarding interno**: wizard de 6 steps com persistência em `student_drafts` (Supabase). A finalização via RPC `finalize_student_draft` cria de verdade: `auth.users`, `profiles`, `student_profiles`, `academy_memberships`, `student_unit_assignments`.
- **Cadastro público**: fluxo via `/cadastro/{token}` com validação real de token (`invite_links`). O estado atual usa `get_invite_signup_context` para entrada pública, `claim_invite_signup` para claim seguro e `complete_my_invite_signup` para conclusão autenticada.
- **Billing real**: tabelas `plans`, `subscriptions`, `payments` existem com CRUD funcional. Integração Asaas construída (customers, charges, subscriptions, webhooks, reconciliação).

### O que ainda é parcial/mock

- **Steps 3-6 do wizard** (plano, contrato, pagamento, ativação) são **100% visuais**. Coletam dados na UI mas descartam tudo na finalização.
- **Planos** no wizard vêm do `plansMock.ts`, não da tabela `plans`.
- **Pagamento** é simulado com `setTimeout`, sem integração Asaas.
- **Contrato** tem texto hardcoded e IDs fake. Não existe tabela de contratos no banco.
- **Criação de invite** pelo staff (InviteGenerator) usa `inviteMock.ts`.
- **QR Code** da ativação é imagem estática fake.

### A jornada comercial fecha hoje?

**Não.** Ambos os fluxos criam o aluno como entidade (profile + membership) mas **não** criam subscription, payment, cobrança Asaas, contrato, nem customer Asaas. O `plan_status` é setado como `'active'` diretamente no `student_profiles` sem nenhum plano real vinculado. O aluno existe operacionalmente, mas a ativação comercial é ilusória.

---

## 2. Onboarding interno — fluxo atual

### Entrada

Staff logado acessa `/users` → botão "Novo Cadastro" → navega para `/users/onboarding`.

### Etapas

| Step | Componente | Dados coletados | Persistência |
|------|-----------|----------------|-------------|
| 1. Identificação | `StepIdentification` | `fullName`, `email`, `phone`, `userType` | `student_drafts.collected_data` (REAL) |
| 2. Dados pessoais | `StepPersonalData` | `document` (CPF), `birthDate`, `address`, `emergencyContact` | `student_drafts.collected_data` (REAL) |
| 3. Plano | `StepPlanSelection` | `planId`, `planName`, `billingType`, `value`, `startDate` | `student_drafts.collected_data` (salva, mas descartado na finalização) |
| 4. Contrato | `StepContract` | `contractId` (fake), `contractNumber` (fake), `acceptedTerms`, `signedAt`, `signatureMethod` | `student_drafts.collected_data` (salva, mas descartado) |
| 5. Pagamento | `StepPayment` | `method`, `status`, `value`, `paidAt` | `student_drafts.collected_data` (salva, mas descartado) |
| 6. Ativação | `StepActivation` | `accessCardGenerated`, `qrCodeGenerated`, `activatedAt` | `student_drafts.collected_data` (salva, mas descartado) |

### Persistência durante o wizard

Cada step salva dados via `updateDraftSession(draftId, payload)` → `PATCH` na tabela `student_drafts`. O staff pode pausar e retomar depois — o draft sobrevive entre sessões.

### Finalização

`handleComplete()` → `finalizeOnboardingDraft(draftId)` → RPC `finalize_student_draft`

**A RPC cria:**

| Entidade | Tabela | Detalhes |
|----------|--------|----------|
| Usuário auth | `auth.users` | Senha aleatória (`gen_random_uuid()` hasheada) |
| Perfil | `profiles` | `user_type='student'`, name, email, phone, cpf |
| Perfil de aluno | `student_profiles` | `status='active'`, `registration_origin='academy'`, `plan_name` (snapshot), `plan_status='active'`, `plan_expires_at` (startDate + 30d) |
| Membership | `academy_memberships` | Vínculo aluno↔academia |
| Unit assignment | `student_unit_assignments` | Condicional (se `unit_id` no draft) |
| Draft | `student_drafts` | `status='published'`, `published_at`, `published_user_id` |

**A RPC NÃO cria:**

- ❌ `subscriptions` (nenhum registro)
- ❌ `payments` (nenhum registro)
- ❌ Contrato (tabela não existe)
- ❌ `asaas_customers` (nenhuma sincronização)
- ❌ `asaas_charges` / `asaas_subscriptions`
- ❌ QR code real (não chama `issue_student_qr_token`)
- ❌ Email de boas-vindas

### Arquivos envolvidos

| Arquivo | Função |
|---------|--------|
| `src/app/(app)/users/onboarding/page.tsx` | Página do wizard (orquestrador) |
| `src/components/onboarding/steps/StepIdentification.tsx` | Step 1 |
| `src/components/onboarding/steps/StepPersonalData.tsx` | Step 2 |
| `src/components/onboarding/steps/StepPlanSelection.tsx` | Step 3 (usa `getPublicCatalogPlans()` do mock) |
| `src/components/onboarding/steps/StepContract.tsx` | Step 4 (texto hardcoded) |
| `src/components/onboarding/steps/StepPayment.tsx` | Step 5 (setTimeout fake) |
| `src/components/onboarding/steps/StepActivation.tsx` | Step 6 (QR fake) |
| `src/components/onboarding/Stepper.tsx` | Stepper visual |
| `src/lib/users/onboardingService.ts` | `initOrResumeOnboardingSession`, `updateDraftSession`, `abandonOnboardingSession`, `finalizeOnboardingDraft`, `getStaffContext` |
| `src/lib/users/onboardingTypes.ts` | Types, steps config, `buildStepState`, `getNextStep` |
| `src/mocks/plansMock.ts` | `getPublicCatalogPlans()` usada no step 3 |
| `supabase/migrations/20260306000100_finalize_student_draft.sql` | RPC `finalize_student_draft` |

---

## 3. Cadastro público — fluxo atual

### Entrada

Aluno acessa `/cadastro/{token}` (link gerado pelo staff). O token é validado via RPC `get_invite_signup_context` contra a tabela `invite_links`.

### Validação de token

1. Token não encontrado → `TOKEN_NOT_FOUND`
2. Status `revoked`/`expired` → `TOKEN_INVALID`
3. `expires_at < now()` → marca como `expired` → `TOKEN_EXPIRED`
4. Status `used` → `TOKEN_USED`
5. Sucesso → retorna contexto: `academy_id`, `academy_name`, `unit_id`, `unit_name`, `expected_email`, `expires_at`

### Etapas

Mesmos 6 steps do onboarding interno + **tela de boas-vindas** antes com campo de senha.

| Step | Componente | Detalhes |
|------|-----------|---------|
| Welcome | Inline na page | Coleta `password` + `confirmPassword` |
| 1-6 | Mesmos do onboarding interno | Mesma UI, mesmos dados |

**Diferença crítica**: a sessão de onboarding é criada **em memória (React state)** via `createPublicOnboardingSession()`. NÃO persiste em `student_drafts`. Se o aluno fechar a aba, perde todo o progresso.

### Finalização

`handleComplete()` → `completeSignup(token, collectedData, { password })` → RPC `finalize_invite_signup`

**A RPC recebe:** `p_token`, `p_email`, `p_password`, `p_full_name`, `p_phone`, `p_cpf`, `p_birth_date`, `p_address`, `p_emergency_contact`

**A RPC NÃO recebe:** dados de plano, contrato ou pagamento (são descartados).

**A RPC cria:**

| Entidade | Tabela | Detalhes |
|----------|--------|----------|
| Usuário auth | `auth.users` | Com senha definida pelo aluno, `email_confirmed_at` preenchido |
| Identity | `auth.identities` | Provider `email`, `email_verified: true` |
| Perfil | `profiles` | `user_type='student'` |
| Perfil de aluno | `student_profiles` | `status='active'`, `registration_origin='website'`, `plan_status='active'` (sem plan_name!) |
| Membership | `academy_memberships` | `is_primary=true` |
| Unit assignment | `student_unit_assignments` | Condicional (se invite tem `unit_id`) |
| Invite atualizado | `invite_links` | `status='used'`, `used_at=now()` |

Após a RPC: auto-login via `loginStudent(email, password)` → redireciona para `/aluno`.

**A RPC NÃO cria:** mesma lista do onboarding interno (subscription, payment, contrato, Asaas, QR).

### Arquivos envolvidos

| Arquivo | Função |
|---------|--------|
| `src/app/cadastro/[token]/page.tsx` | Página pública do cadastro |
| `src/lib/invites/inviteServiceSupabase.ts` | `startSignup`, `validateInviteToken`, `createPublicOnboardingSession`, `completeSignup`, `updateSessionStep` |
| `src/lib/invites/index.ts` → `inviteService.ts` | Re-export chain |
| `src/lib/auth/authServiceSupabase.ts` | `loginStudent` (auto-login pós-signup) |
| `supabase/migrations/20260306000200_public_invite_signup.sql` | RPCs `get_invite_signup_context` e `finalize_invite_signup` |

---

## 4. Plano, pagamento e contrato

### Plano

| Aspecto | Estado atual |
|---------|-------------|
| **Onde é escolhido** | Step 3 (`StepPlanSelection`) |
| **Fonte dos planos** | `getPublicCatalogPlans()` do `plansMock.ts` — **100% mock**. 3 planos fictícios (Básico R$89,90, Padrão R$129,90, Premium R$199,90) |
| **Consulta tabela `plans`?** | NÃO. A tabela `plans` existe no Supabase com CRUD real via `plansServiceSupabase.ts`, mas o onboarding não a consulta |
| **Cria `subscription`?** | NÃO. Na finalização, apenas `plan_name` e `plan_expires_at` são salvos denormalizados no `student_profiles` |
| **Gap entre mock e real** | O mock tem múltiplos ciclos de preço, enrollment fee, features, contract rules, onboarding behavior. A tabela `plans` real tem apenas: name, description, price (único), billing_cycle, status, access_rules |
| **Catálogo público real** | Não existe. `plansServiceSupabase.ts` tem `getPlans()` para staff autenticado. Não há endpoint público/anônimo |

**Tabela `plans` — schema real:**

```
id, academy_id, name, description, price, billing_cycle, status, access_rules, created_at, updated_at
```

**Mock `plansMock.ts` — campos extras que NÃO existem na tabela real:**

- `pricing` (múltiplos ciclos com desconto individual)
- `enrollmentFee` (taxa de matrícula)
- `features` (array de PlanFeature)
- `contractRules` (fidelidade, multa, renovação)
- `onboardingBehavior` (userSelectable, requiresApproval, requiresImmediatePayment, trialDays, showInPublicCatalog)
- `category`
- `userTypesAllowed`
- `stats`
- `chargeType` (recurring / single)

### Pagamento

| Aspecto | Estado atual |
|---------|-------------|
| **Onde entra** | Step 5 (`StepPayment`) |
| **O que coleta** | `method` (credit_card/debit/pix/boleto), `status`, `value`, `paidAt` |
| **Processamento** | Simulado com `setTimeout(2000)` — **zero integração real** |
| **Cria `payment` local?** | NÃO |
| **Aciona Asaas?** | NÃO |
| **`paymentId`** | Gerado com `Date.now()` — fake |
| **Tabela `payments`** | Existe com CRUD completo via `paymentServiceSupabase.ts`, mas NÃO é usada pelo onboarding |
| **Integração Asaas** | `create-charge.ts` e `create-subscription.ts` existem em `src/server/asaas/` com flows completos, mas NÃO são chamados pelo onboarding |

### Contrato

| Aspecto | Estado atual |
|---------|-------------|
| **Onde entra** | Step 4 (`StepContract`) |
| **Texto do contrato** | Hardcoded no componente — 7 cláusulas estáticas. NÃO usa templates do `contractTemplatesMock.ts` |
| **O que coleta** | `contractId` (Date.now()), `contractNumber` (CTR-YYYY-NNN aleatório), `acceptedTerms`, `signedAt`, `signatureMethod` |
| **Tabela de contratos** | **NÃO EXISTE**. Zero tabelas CREATE TABLE com "contract" nas migrations |
| **Mock** | `contractsMock.ts` define tipos ricos (PlanSnapshot, ContractFinancials, ContractSignature, ContractEvent, ContractReferences). `contractTemplatesMock.ts` define templates com variáveis dinâmicas e versionamento |
| **Efeito real** | NENHUM. Os dados do contrato ficam no `collected_data` do draft (onboarding interno) ou são descartados (cadastro público) |
| **Permissões pré-configuradas** | `contracts:view`, `contracts:create`, `contracts:edit`, `contracts:cancel`, `contracts:sign` existem na migration `004_create_roles.sql`, mas a tabela nunca foi criada |

---

## 5. Conexão com o billing real atual

### O que JÁ existe na trilha financeira

| Componente | Tabela | Service/Rota |
|-----------|--------|-------------|
| Plans CRUD | `plans` | `plansServiceSupabase.ts` |
| Subscriptions CRUD | `subscriptions` | `subscriptionServiceSupabase.ts` |
| Payments CRUD | `payments` | `paymentServiceSupabase.ts` |
| Charges view | `financial_charges_view` | Leitura consolidada |
| Asaas customers | `asaas_customers` | `sync-customer.ts` |
| Asaas charges | `asaas_charges` | `create-charge.ts`, `charge-sync-engine.ts` |
| Asaas subscriptions | `asaas_subscriptions` | `create-subscription.ts` |
| Webhooks | `asaas_webhook_events` | `process-webhook-event.ts` |
| Reconciliação | — | `reconcile-charge.ts` |
| Delinquency policy | `academies.preferences` | `settingsServiceSupabase.ts` |

### O que JÁ conversa com a trilha financeira

**Nada do onboarding/cadastro conversa com billing.** O fluxo financeiro opera de forma completamente isolada — staff cria cobranças e subscriptions manualmente pelas telas do módulo financeiro.

### O que NÃO conversa

| Gap | Detalhes |
|-----|---------|
| **Onboarding → `plans`** | Step 3 usa mock. Deveria listar planos reais da academia |
| **Onboarding → `subscriptions`** | Nenhuma subscription é criada. `plan_name`/`plan_status` são setados diretamente no `student_profiles` sem vínculo com `subscriptions` |
| **Onboarding → `payments`** | Nenhum payment é criado. Step 5 é simulação pura |
| **Onboarding → `asaas_customers`** | Nenhuma sincronização. O `syncCustomer` só é chamado quando staff cria cobrança/subscription Asaas manualmente |
| **Onboarding → `asaas_charges`** | Nenhuma cobrança gerada |
| **Onboarding → `asaas_subscriptions`** | Nenhuma recorrência criada |

### Duplicidade / lógica paralela

| Onde | Problema |
|------|---------|
| **`student_profiles.plan_name`/`plan_status`/`plan_expires_at`** | O onboarding seta esses campos diretamente. O módulo financeiro os mantém via trigger `sync_student_current_plan_from_subscriptions` a partir da tabela `subscriptions`. São dois mundos: o onboarding escreve direto, o billing escreve via trigger. Se o onboarding setar e depois o billing criar subscription, o trigger sobrescreve. Mas se o onboarding setar e billing nunca for usado, fica um aluno "ativo" sem subscription real |
| **Plans mock vs plans real** | O mock tem campos que a tabela real não tem. Se algum dia o onboarding migrar para planos reais, vai precisar de schema evolution na tabela `plans` ou de uma camada de adaptação |

---

## 6. Comparação entre onboarding interno e cadastro público

### Convergências

| Aspecto | Comportamento |
|---------|-------------|
| Steps 1-6 | Mesmos componentes, mesma UI, mesmos dados coletados |
| Steps 3-6 | Ambos são 100% mock — plano, contrato, pagamento e ativação |
| Entidades finais | Ambos criam: auth.users + profiles + student_profiles + academy_memberships + student_unit_assignments |
| Billing | Nenhum dos dois cria subscription, payment, contrato ou aciona Asaas |
| QR Code | Ambos mostram QR fake |

### Divergências

| Aspecto | Onboarding interno | Cadastro público |
|---------|-------------------|-----------------|
| **Quem executa** | Staff logado no painel | Aluno via link público |
| **Persistência do wizard** | `student_drafts` (Supabase) — retomável | React state (memória) — perde ao fechar aba |
| **Senha** | Aleatória (`gen_random_uuid()`) — aluno precisa redefinir (fluxo não existe) | Definida pelo aluno na tela de welcome |
| **RPC de finalização** | `finalize_student_draft` (usa dados do draft JSONB) | `finalize_invite_signup` (recebe params direto) |
| **Token/invite** | Não usa | Consome token da tabela `invite_links` |
| **Auto-login** | Não (staff já está logado) | Sim (`loginStudent`) |
| **`plan_name` salvo** | Sim (extraído do draft collected_data) | NÃO (RPC não recebe dado de plano) |
| **`registration_origin`** | `'academy'` | `'website'` |
| **Email** | Email definido pelo staff | Pode ter `expected_email` do invite |
| **Identity auth** | Não cria `auth.identities` | Cria `auth.identities` com provider `email` |

### Drift atual

1. **Criação de invite é mock, consumo é real.** O `InviteGenerator` usa `inviteMock.ts` para gerar links. O consumo em `/cadastro/{token}` usa `invite_links` real. Logo, nenhum link gerado pelo staff funciona de verdade — a tabela `invite_links` precisa ser populada manualmente ou via seed.

2. **RPC de finalização difere em campos salvos.** `finalize_student_draft` salva `plan_name`, `plan_expires_at` no `student_profiles`. `finalize_invite_signup` **não salva** esses campos. Um aluno criado por invite não tem nem snapshot de plano.

3. **Senha.** Onboarding interno cria senha aleatória sem fluxo de reset. Cadastro público pede senha do aluno. Os dois alunos têm experiências de primeiro acesso completamente diferentes.

4. **Tabela de invites.** Existem duas tabelas: `invites` (migration 009, legacy) e `invite_links` (posterior). O fluxo público usa `invite_links`. O `InviteGenerator` usa mock. Potencial confusão sobre qual é a fonte de verdade.

---

## 7. Onde a jornada comercial quebra hoje

| # | Ponto de quebra | Impacto |
|---|----------------|---------|
| 1 | **Planos vêm do mock** | O aluno escolhe entre planos fictícios. A escolha não tem correspondência na tabela `plans` |
| 2 | **Nenhuma `subscription` é criada** | O aluno "ativo" não tem assinatura real. O módulo financeiro não o enxerga como assinante |
| 3 | **Nenhum `payment` é criado** | Não há registro financeiro do "pagamento" feito no step 5 |
| 4 | **Asaas não é acionado** | Nenhum customer sync, nenhuma cobrança, nenhuma recorrência |
| 5 | **Contrato não é persistido** | Texto hardcoded, sem tabela, sem registro de aceite auditável |
| 6 | **`plan_status='active'` sem base real** | O student_profiles diz "ativo" mas não há subscription, plano nem cobrança vinculados |
| 7 | **UI dá sucesso sem ativação comercial** | O wizard mostra "Cadastro concluído com sucesso!" com confete, mas nada comercial aconteceu de verdade |
| 8 | **Senha aleatória no interno** | Aluno criado pelo staff não consegue logar (não tem fluxo de primeiro acesso / reset) |
| 9 | **Invite creation é mock** | Staff não consegue gerar links de convite reais |
| 10 | **QR Code é fake** | A ativação mostra QR estático, sem chamar `issue_student_qr_token` |

---

## 8. Gaps reais para o próximo PR

### Fundação obrigatória (sem isso, nada comercial funciona)

| Gap | O que falta |
|-----|-----------|
| **G1** | Step 3 precisa consultar tabela `plans` real (não o mock) |
| **G2** | Finalização precisa criar `subscription` real na tabela `subscriptions` (plan_id, student_id, academy_id, status, price, billing_cycle) |
| **G3** | O trigger `sync_student_current_plan_from_subscriptions` já existe e vai manter `student_profiles` atualizado automaticamente — basta criar a subscription corretamente |

### Billing real

| Gap | O que falta |
|-----|-----------|
| **G4** | Finalização pode criar `payment` local (pendente) se o plano exigir pagamento imediato |
| **G5** | Finalização pode acionar `syncCustomer` para criar o `asaas_customer` — prerequisito para qualquer cobrança |
| **G6** | Finalização pode acionar `create-charge` ou `create-subscription` no Asaas se a academia tiver conta configurada |

### Contrato

| Gap | O que falta |
|-----|-----------|
| **G7** | Decidir se contrato terá tabela própria ou será apenas snapshot JSONB na subscription |
| **G8** | Se tabela própria: criar migration com registro de aceite (IP, timestamp, hash, texto aceito) |
| **G9** | Step 4 precisa usar texto real (template da academia ou padrão do sistema) em vez de hardcoded |

### Experiência do aluno

| Gap | O que falta |
|-----|-----------|
| **G10** | Definir fluxo de primeiro acesso para alunos criados pelo onboarding interno (senha aleatória) |
| **G11** | Integrar `issue_student_qr_token` na ativação real |

### Invite / cadastro público

| Gap | O que falta |
|-----|-----------|
| **G12** | `InviteGenerator` precisa criar invite real na tabela `invite_links` (substituir mock) |
| **G13** | `finalize_invite_signup` precisa receber e salvar dados de plano (hoje descarta) |
| **G14** | Cadastro público precisa criar `subscription` real (mesmo gap do onboarding interno) |
| **G15** | Sessão pública pode persistir em `student_drafts` para permitir retomada |

### Alinhamento entre os dois fluxos

| Gap | O que falta |
|-----|-----------|
| **G16** | Unificar ou alinhar as duas RPCs de finalização para que ambas criem as mesmas entidades comerciais |
| **G17** | Definir se plano/contrato/pagamento são obrigatórios em ambos os fluxos ou configuráveis por academia |

---

## 9. Arquivos, tabelas, RPCs e rotas mais importantes

### Tabelas

| Tabela | Uso | Status |
|--------|-----|--------|
| `student_drafts` | Persistência do wizard (onboarding interno) | ✅ Real |
| `invite_links` | Tokens de convite (cadastro público) | ✅ Real |
| `plans` | Planos da academia | ✅ Real, mas NÃO usada pelo onboarding |
| `subscriptions` | Assinaturas aluno↔plano | ✅ Real, mas NÃO criada pelo onboarding |
| `payments` | Cobranças locais | ✅ Real, mas NÃO criada pelo onboarding |
| `student_profiles` | Perfil do aluno (com campos plan_* denormalizados) | ✅ Real |
| `profiles` | Perfil base do usuário | ✅ Real |
| `academy_memberships` | Vínculo usuário↔academia | ✅ Real |
| `student_unit_assignments` | Vínculo aluno↔unidade | ✅ Real |
| `asaas_customers` | Vínculo aluno↔customer Asaas | ✅ Real, mas NÃO usado no onboarding |
| `asaas_charges` | Cobranças Asaas | ✅ Real, mas NÃO usado no onboarding |
| `asaas_subscriptions` | Recorrência Asaas | ✅ Real, mas NÃO usado no onboarding |
| contratos | — | ❌ Não existe |
| `invites` | Legacy (migration 009) | ⚠️ Não usada por nenhum fluxo ativo |

### RPCs

| RPC | Arquivo | Usado por |
|-----|---------|----------|
| `finalize_student_draft(p_draft_id)` | `20260306000100_finalize_student_draft.sql` | Onboarding interno |
| `get_invite_signup_context(p_token)` | `20260306000200_public_invite_signup.sql` | Cadastro público |
| `finalize_invite_signup(...)` | `20260306000200_public_invite_signup.sql` | Cadastro público |
| `issue_student_qr_token(p_student_id)` | (migration de access) | NÃO usado no onboarding |
| `sync_student_current_plan_from_subscriptions` | `20260310004000_subscriptions_module.sql` | Trigger automático (NÃO acionado porque subscription não é criada) |

### Services

| Service | Arquivo | Real/Mock |
|---------|---------|-----------|
| Onboarding service | `src/lib/users/onboardingService.ts` | ✅ Real (CRUD student_drafts + RPC) |
| Onboarding types | `src/lib/users/onboardingTypes.ts` | ✅ Real (steps/types) |
| Invite service | `src/lib/invites/inviteServiceSupabase.ts` | ✅ Real (validate + signup) |
| Plans service | `src/lib/plans/plansServiceSupabase.ts` | ✅ Real (CRUD plans) — NÃO usado pelo onboarding |
| Subscription service | `src/lib/subscriptions/subscriptionServiceSupabase.ts` | ✅ Real (CRUD subscriptions) — NÃO usado pelo onboarding |
| Payment service | `src/lib/payments/paymentServiceSupabase.ts` | ✅ Real (CRUD payments) — NÃO usado pelo onboarding |
| Plans mock | `src/mocks/plansMock.ts` | ❌ Mock — USADO pelo onboarding step 3 |
| Contracts mock | `src/mocks/contractsMock.ts` | ❌ Mock — NÃO usado (texto é hardcoded no step 4) |
| Contract templates mock | `src/mocks/contractTemplatesMock.ts` | ❌ Mock — NÃO usado |
| Invite mock | `src/mocks/inviteMock.ts` | ❌ Mock — USADO pelo InviteGenerator |
| Onboarding mock | `src/mocks/onboardingMock.ts` | ❌ Mock — referência de types/dados |

### Componentes

| Componente | Arquivo |
|-----------|---------|
| Página onboarding | `src/app/(app)/users/onboarding/page.tsx` |
| Página cadastro público | `src/app/cadastro/[token]/page.tsx` |
| StepIdentification | `src/components/onboarding/steps/StepIdentification.tsx` |
| StepPersonalData | `src/components/onboarding/steps/StepPersonalData.tsx` |
| StepPlanSelection | `src/components/onboarding/steps/StepPlanSelection.tsx` |
| StepContract | `src/components/onboarding/steps/StepContract.tsx` |
| StepPayment | `src/components/onboarding/steps/StepPayment.tsx` |
| StepActivation | `src/components/onboarding/steps/StepActivation.tsx` |
| Stepper | `src/components/onboarding/Stepper.tsx` |
| InviteGenerator | `src/components/onboarding/InviteGenerator.tsx` |
| StudentQRCode | `src/components/student/StudentQRCode.tsx` |

### Rotas de API (billing existente, NÃO usadas pelo onboarding)

| Rota | Arquivo | Função |
|------|---------|--------|
| POST `/api/asaas/customers/sync` | `src/app/api/asaas/customers/sync/route.ts` | Sync customer Asaas |
| POST `/api/asaas/charges/create` | `src/app/api/asaas/charges/create/route.ts` | Criar cobrança Asaas |
| POST `/api/asaas/subscriptions/create` | `src/app/api/asaas/subscriptions/create/route.ts` | Criar recorrência Asaas |
| POST `/api/asaas/charges/reconcile` | `src/app/api/asaas/charges/reconcile/route.ts` | Reconciliar cobrança |
| POST `/api/asaas/webhooks` | `src/app/api/asaas/webhooks/route.ts` | Receber webhook |
