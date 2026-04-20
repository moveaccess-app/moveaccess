'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPaymentDateTime, type Payment } from '@/lib/payments/paymentService';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface WebhookEvent {
  id: string;
  event_type: string;
  processing_status: string;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

interface ReconcileResult {
  success: boolean;
  action?: 'updated' | 'noop';
  changes?: {
    chargeUpdated: boolean;
    paymentUpdated: boolean;
    resolvedChargeStatus: string;
    resolvedPaymentStatus: string | null;
  };
  error?: string;
}

interface ReprocessResult {
  success: boolean;
  currentStatus?: string;
  chargeUpdated?: boolean;
  paymentUpdated?: boolean;
  error?: string;
}

type SyncStatus = 'synced' | 'stale' | 'unknown';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  PAYMENT_RECEIVED: 'Pagamento recebido',
  PAYMENT_CONFIRMED: 'Pagamento confirmado',
  PAYMENT_OVERDUE: 'Pagamento vencido',
  PAYMENT_DELETED: 'Pagamento excluído',
  PAYMENT_RESTORED: 'Pagamento restaurado',
  PAYMENT_REFUNDED: 'Pagamento estornado',
  PAYMENT_UPDATED: 'Pagamento atualizado',
  PAYMENT_CREATED: 'Pagamento criado',
};

const STATUS_LABELS: Record<string, string> = {
  processed: 'Processado',
  failed: 'Falhou',
  orphan: 'Órfão',
  pending: 'Pendente',
  skipped: 'Ignorado',
};

const STATUS_VARIANTS: Record<string, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  processed: 'success',
  failed: 'destructive',
  orphan: 'warning',
  pending: 'warning',
  skipped: 'secondary',
};

function getSyncStatus(payment: Payment): SyncStatus {
  if (!payment.asaasSyncedAt) return 'unknown';

  const syncedAt = new Date(payment.asaasSyncedAt).getTime();
  const hourAgo = Date.now() - 60 * 60 * 1000;

  return syncedAt > hourAgo ? 'synced' : 'stale';
}

function getSyncLabel(status: SyncStatus): string {
  switch (status) {
    case 'synced': return 'Sincronizado';
    case 'stale': return 'Sincronização antiga';
    case 'unknown': return 'Nunca sincronizado';
  }
}

function getSyncVariant(status: SyncStatus): 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'synced': return 'success';
    case 'stale': return 'warning';
    case 'unknown': return 'secondary';
  }
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

interface ChargeTroubleshootingProps {
  payment: Payment;
  onReconciled: () => void;
}

export function ChargeTroubleshooting({ payment, onReconciled }: ChargeTroubleshootingProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [reprocessResult, setReprocessResult] = useState<ReprocessResult | null>(null);

  const asaasPaymentId = payment.asaasPaymentId;
  const syncStatus = getSyncStatus(payment);
  const hasProblematicEvents = events.some(
    (e) => e.processing_status === 'failed' || e.processing_status === 'orphan',
  );

  const loadEvents = useCallback(async () => {
    if (!asaasPaymentId) return;

    setEventsLoading(true);
    setEventsError(null);

    try {
      const response = await fetch(
        `/api/asaas/charges/events?asaasPaymentId=${encodeURIComponent(asaasPaymentId)}&academyId=${encodeURIComponent(payment.academyId)}`,
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setEventsError(body.error || `Erro ${response.status}`);
        return;
      }

      const data = await response.json();
      setEvents(data.events ?? []);
    } catch {
      setEventsError('Não foi possível carregar os eventos.');
    } finally {
      setEventsLoading(false);
    }
  }, [asaasPaymentId, payment.academyId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleReconcile = async () => {
    if (!payment.asaasChargeId) return;

    setReconciling(true);
    setReconcileResult(null);

    try {
      const response = await fetch('/api/asaas/charges/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeId: payment.asaasChargeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setReconcileResult({ success: false, error: data.error || `Erro ${response.status}` });
        return;
      }

      setReconcileResult({
        success: true,
        action: data.action,
        changes: data.changes,
      });

      // Reload the page data and events
      onReconciled();
      void loadEvents();
    } catch {
      setReconcileResult({ success: false, error: 'Erro de rede ao sincronizar.' });
    } finally {
      setReconciling(false);
    }
  };

  const handleReprocess = async (eventId: string) => {
    setReprocessingId(eventId);
    setReprocessResult(null);

    try {
      const response = await fetch('/api/asaas/webhooks/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setReprocessResult({ success: false, error: data.error || `Erro ${response.status}` });
        return;
      }

      setReprocessResult({
        success: true,
        currentStatus: data.currentStatus,
        chargeUpdated: data.chargeUpdated,
        paymentUpdated: data.paymentUpdated,
      });

      // Reload events and page data
      onReconciled();
      void loadEvents();
    } catch {
      setReprocessResult({ success: false, error: 'Erro de rede ao reprocessar.' });
    } finally {
      setReprocessingId(null);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-[var(--element-primary)]">Sincronização</h2>
          <p className="text-xs text-[var(--element-secondary)] mt-0.5">
            Estado da cobrança no Asaas e eventos recebidos
          </p>
        </div>
        <Badge variant={getSyncVariant(syncStatus)}>{getSyncLabel(syncStatus)}</Badge>
      </div>

      {/* Sync info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[var(--element-disabled)] text-xs mb-0.5">Última sincronização</div>
          <div className="text-[var(--element-primary)]">
            {payment.asaasSyncedAt ? formatPaymentDateTime(payment.asaasSyncedAt) : 'Nunca'}
          </div>
        </div>
        {events.length > 0 && (
          <div>
            <div className="text-[var(--element-disabled)] text-xs mb-0.5">Eventos recebidos</div>
            <div className="text-[var(--element-primary)]">
              {events.length}
              {hasProblematicEvents && (
                <span className="text-[var(--status-negative)] ml-1">
                  ({events.filter((e) => e.processing_status === 'failed' || e.processing_status === 'orphan').length} com problema)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reconcile action */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleReconcile()}
            disabled={reconciling || !payment.asaasChargeId}
          >
            {reconciling ? 'Sincronizando...' : 'Sincronizar cobrança'}
          </Button>
          <span className="text-xs text-[var(--element-disabled)]">
            Consulta o Asaas e atualiza o status local. Não gera cobrança nem movimenta dinheiro.
          </span>
        </div>

        {reconcileResult && (
          <div
            className={`p-3 rounded-lg text-sm ${
              reconcileResult.success
                ? 'bg-[var(--status-positive-background)] text-[var(--status-positive)]'
                : 'bg-[var(--status-negative)]/5 text-[var(--status-negative)]'
            }`}
          >
            {reconcileResult.success
              ? reconcileResult.action === 'updated'
                ? `Cobrança atualizada com sucesso.${reconcileResult.changes?.resolvedChargeStatus ? ` Status externo: ${reconcileResult.changes.resolvedChargeStatus}.` : ''}`
                : 'Cobrança já estava sincronizada — nenhuma alteração necessária.'
              : reconcileResult.error}
          </div>
        )}
      </div>

      {/* Webhook events */}
      {eventsLoading && (
        <p className="text-sm text-[var(--element-secondary)]">Carregando eventos...</p>
      )}

      {eventsError && (
        <p className="text-sm text-[var(--status-negative)]">{eventsError}</p>
      )}

      {!eventsLoading && events.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--element-primary)] mb-2">
            Eventos webhook recentes
          </h3>
          <div className="space-y-2">
            {events.map((event) => {
              const isReprocessable =
                event.processing_status === 'failed' || event.processing_status === 'orphan';
              const isReprocessing = reprocessingId === event.id;

              return (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-[var(--background-tertiary)] text-sm"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANTS[event.processing_status] ?? 'secondary'}>
                      {STATUS_LABELS[event.processing_status] ?? event.processing_status}
                    </Badge>
                    <span className="text-[var(--element-primary)]">
                      {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                    </span>
                    <span className="text-xs text-[var(--element-disabled)]">
                      {formatPaymentDateTime(event.received_at)}
                    </span>
                  </div>

                  {event.error_message && (
                    <p className="text-xs text-[var(--status-negative)] sm:hidden">
                      {event.error_message}
                    </p>
                  )}

                  {isReprocessable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleReprocess(event.id)}
                      disabled={isReprocessing}
                      className="flex-shrink-0"
                    >
                      {isReprocessing ? 'Reprocessando...' : 'Reprocessar'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {reprocessResult && (
            <div
              className={`mt-2 p-3 rounded-lg text-sm ${
                reprocessResult.success
                  ? 'bg-[var(--status-positive-background)] text-[var(--status-positive)]'
                  : 'bg-[var(--status-negative)]/5 text-[var(--status-negative)]'
              }`}
            >
              {reprocessResult.success
                ? 'Evento reprocessado com sucesso. O status da cobrança foi atualizado.'
                : reprocessResult.error}
            </div>
          )}

          <p className="text-xs text-[var(--element-disabled)] mt-2">
            Eventos são enviados pelo Asaas via webhook. &quot;Reprocessar&quot; re-executa o processamento do evento sem gerar nova cobrança.
          </p>
        </div>
      )}

      {!eventsLoading && !eventsError && events.length === 0 && asaasPaymentId && (
        <p className="text-xs text-[var(--element-disabled)]">
          Nenhum evento webhook registrado para esta cobrança.
        </p>
      )}
    </Card>
  );
}
