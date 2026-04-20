-- ASAAS WEBHOOK EVENTS
-- PR #4: persists webhook events received from Asaas for idempotent processing,
-- auditability, troubleshooting, and future reprocessing/reconciliation.

CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification (from Asaas payload)
  event_id text NOT NULL,                          -- Asaas event unique ID (e.g. evt_...)
  event_type text NOT NULL,                        -- e.g. PAYMENT_RECEIVED, PAYMENT_OVERDUE

  -- Context
  environment text NOT NULL,                       -- sandbox / production
  asaas_account_id uuid NULL REFERENCES public.asaas_accounts(id) ON DELETE SET NULL,

  -- Correlation
  asaas_payment_id text NULL,                      -- extracted from payload.payment.id for fast lookup

  -- Payload
  payload jsonb NOT NULL,                          -- full webhook body as received

  -- Processing state
  processing_status text NOT NULL DEFAULT 'pending',
  error_message text NULL,
  processed_at timestamptz NULL,

  -- Timestamps
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT asaas_webhook_events_environment_check
    CHECK (environment IN ('sandbox', 'production')),
  CONSTRAINT asaas_webhook_events_processing_status_check
    CHECK (processing_status IN ('pending', 'processed', 'skipped', 'failed', 'orphan'))
);

-- Idempotency: prevent processing the same event twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_asaas_webhook_events_event_id
  ON public.asaas_webhook_events (event_id);

-- Lookup by Asaas payment ID for correlation with asaas_charges
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_asaas_payment_id
  ON public.asaas_webhook_events (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;

-- Lookup by processing status for retry/reprocessing
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_processing_status
  ON public.asaas_webhook_events (processing_status);

-- Timeline queries and troubleshooting
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_received_at
  ON public.asaas_webhook_events (received_at);

-- Lookup by environment + event_type for analytics
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_env_type
  ON public.asaas_webhook_events (environment, event_type);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS asaas_webhook_events_updated_at ON public.asaas_webhook_events;
CREATE TRIGGER asaas_webhook_events_updated_at
  BEFORE UPDATE ON public.asaas_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.asaas_webhook_events IS 'Registro de eventos recebidos via webhook do Asaas. Cada evento é persistido antes de ser processado, garantindo rastreabilidade e idempotência.';
COMMENT ON COLUMN public.asaas_webhook_events.event_id IS 'ID único do evento enviado pelo Asaas (campo "id" do payload). Chave de idempotência.';
COMMENT ON COLUMN public.asaas_webhook_events.event_type IS 'Tipo do evento (ex: PAYMENT_RECEIVED, PAYMENT_OVERDUE). Campo "event" do payload.';
COMMENT ON COLUMN public.asaas_webhook_events.environment IS 'Ambiente Asaas de origem: sandbox ou production.';
COMMENT ON COLUMN public.asaas_webhook_events.asaas_account_id IS 'Conta Asaas local relacionada, resolvida durante o processamento.';
COMMENT ON COLUMN public.asaas_webhook_events.asaas_payment_id IS 'ID do payment no Asaas (ex: pay_...), extraído do payload para correlação rápida.';
COMMENT ON COLUMN public.asaas_webhook_events.payload IS 'Body completo do webhook como recebido do Asaas. Preservado para auditoria e reprocessamento.';
COMMENT ON COLUMN public.asaas_webhook_events.processing_status IS 'Estado do processamento: pending (recebido), processed (sucesso), skipped (sem ação), failed (erro), orphan (sem charge local).';
COMMENT ON COLUMN public.asaas_webhook_events.error_message IS 'Mensagem de erro quando processing_status = failed.';
COMMENT ON COLUMN public.asaas_webhook_events.processed_at IS 'Timestamp de quando o evento foi processado com sucesso.';
COMMENT ON COLUMN public.asaas_webhook_events.received_at IS 'Timestamp de quando o evento foi recebido pelo webhook endpoint.';

-- RLS: this table is operated by the webhook handler (service_role).
-- Staff can read for troubleshooting via their academy's account.
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view webhook events via academy account" ON public.asaas_webhook_events;
CREATE POLICY "Staff view webhook events via academy account"
ON public.asaas_webhook_events
FOR SELECT
TO authenticated
USING (
  asaas_account_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.asaas_accounts aa
    JOIN public.profiles p ON p.id = auth.uid()
    JOIN public.academy_memberships am ON am.profile_id = p.id AND am.academy_id = aa.academy_id
    WHERE aa.id = asaas_webhook_events.asaas_account_id
      AND p.user_type = 'staff'
  )
);

-- No INSERT/UPDATE/DELETE policies for authenticated — only service_role writes to this table.

-- Grants
GRANT SELECT ON public.asaas_webhook_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.asaas_webhook_events TO service_role;
