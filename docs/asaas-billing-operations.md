# Asaas Billing Operations

## Runtime oficial do webhook

O runtime oficial do webhook Asaas no MoveAccess é o route handler do app em [src/app/api/asaas/webhooks/route.ts](src/app/api/asaas/webhooks/route.ts).

Motivos da decisão:

- O módulo Asaas versionado no repositório já vive no runtime principal do Next.js.
- Customer sync, charge creation, auth e acesso administrativo ao Supabase já estão concentrados no app server.
- Não existe fonte versionada de Edge Functions no repositório; usar Edge Function como caminho oficial criaria um segundo runtime operacional fora do código-fonte principal.
- O README do projeto já assume deploy do app Next.js como superfície principal de produção.

## Papel da Edge Function usada no STG

A Edge Function usada na validação do sandbox ficou como apoio operacional temporário de homologação, útil quando o app não possui URL pública disponível para receber o webhook. Ela não é a fonte oficial da implementação.

## Secrets obrigatórios

Webhook:

- `ASAAS_WEBHOOK_TOKEN_SANDBOX`
- `ASAAS_WEBHOOK_TOKEN_PRODUCTION`

Admin Supabase:

- `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY`

Credenciais Asaas por conta:

- continuar usando referências em `asaas_accounts.api_key_reference`
- o valor real permanece fora do banco e é resolvido via env no servidor

## Reconciliação mínima de cobrança

Route interna: [src/app/api/asaas/charges/reconcile/route.ts](src/app/api/asaas/charges/reconcile/route.ts)

Entrada:

```json
{
  "chargeId": "uuid"
}
```

Fluxo:

- valida staff da academia dona da charge
- consulta a cobrança real no Asaas por `asaas_payment_id`
- atualiza `asaas_charges`
- reflete `payments` quando o estado local precisa mudar
- devolve `before`, `after`, snapshot externo e flags de mudança

## Reprocessamento de evento webhook

Route interna: [src/app/api/asaas/webhooks/reprocess/route.ts](src/app/api/asaas/webhooks/reprocess/route.ts)

Entrada:

```json
{
  "eventId": "evt_..."
}
```

Fluxo:

- aceita apenas eventos `failed` ou `orphan`
- resolve a academia do evento por `asaas_account_id`, `asaas_payment_id` ou `payment.externalReference`
- reaproveita o payload persistido, sem recriar o evento
- reusa o mesmo pipeline de processamento do webhook
- preserva a linha existente em `asaas_webhook_events`

## Simplificações que permanecem neste PR

- `payments` continua com os estados locais `pending | paid | failed | refunded`
- nuances externas como `CONFIRMED`, `OVERDUE`, `REFUND_IN_PROGRESS` e `CHARGEBACK_*` continuam detalhadas em `asaas_charges.asaas_status`
- `PAYMENT_PARTIALLY_REFUNDED` segue colapsado em `payments.status = refunded`
- recorrência, webhook de assinatura e bloqueio operacional continuam fora de escopo