-- ============================================================
-- PR 19 — Notification logs table
-- ============================================================
-- Minimal tracking for transactional notifications.
-- Idempotency enforced via UNIQUE constraint on idempotency_key.
-- RLS: admin-only access (server-side via service_role key).
-- ============================================================

-- ─── Table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID NOT NULL REFERENCES academies(id),

  -- What was sent
  type          TEXT NOT NULL CHECK (type IN (
    'invite',
    'due_reminder',
    'overdue_notice',
    'pre_block'
  )),
  channel       TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email')),

  -- Who received it
  recipient_email   TEXT NOT NULL,
  recipient_id      UUID NULL,           -- profiles.id (student), nullable for invites to non-users

  -- What entity triggered it
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('invite', 'payment', 'student')),
  entity_id     UUID NOT NULL,

  -- Idempotency (e.g. "due_reminder:<payment_id>" or "pre_block:<student_id>:<academy_id>:2026-04")
  idempotency_key   TEXT NOT NULL,

  -- Result
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_id   TEXT NULL,               -- e.g. Resend message ID
  error         TEXT NULL,               -- error message on failure

  -- Extra context
  metadata      JSONB NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate sends
  CONSTRAINT uq_notification_idempotency UNIQUE (idempotency_key)
);

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX idx_notification_logs_academy   ON notification_logs(academy_id);
CREATE INDEX idx_notification_logs_type      ON notification_logs(type, status);
CREATE INDEX idx_notification_logs_entity    ON notification_logs(entity_type, entity_id);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient_id) WHERE recipient_id IS NOT NULL;
CREATE INDEX idx_notification_logs_created   ON notification_logs(created_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────
-- Server-only access via service_role key.
-- No user-facing policies — staff can see logs through API if needed later.

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- Staff read policy (optional, for future troubleshooting UI):
CREATE POLICY "Staff can view notification logs for their academy"
  ON notification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN academy_memberships am ON am.profile_id = p.id
      WHERE p.id = auth.uid()
        AND p.user_type = 'staff'
        AND am.academy_id = notification_logs.academy_id
    )
  );

-- ─── Updated_at trigger ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_notification_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_logs_updated_at
  BEFORE UPDATE ON notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_logs_updated_at();
