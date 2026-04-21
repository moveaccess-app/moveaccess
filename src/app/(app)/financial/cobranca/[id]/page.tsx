'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import {
  formatCurrency,
  formatPaymentDate,
  formatPaymentDateTime,
  getAsaasStatusLabel,
  getAsaasStatusVariant,
  getChargeOriginLabel,
  getChargeOriginVariant,
  getDaysOverdue,
  getPaymentById,
  getPaymentLink,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
  getPaymentsByStudent,
  getReminderTemplate,
  markPaymentFailed,
  markPaymentPaid,
  type Payment,
  type PaymentMethod,
} from '@/lib/payments/paymentService';
import {
  getAutomationStageLabel,
  getAutomationStatusLabel,
  getAutomationStatusVariant,
  getAutomationTriggerLabel,
  getCommandCenterQueueLabel,
  getCommandCenterQueueVariant,
  getSyncIssueLabel,
  getSyncIssueVariant,
  type CommandCenterCaseDetail,
} from '@/lib/payments/commandCenter';
import { ChargeTroubleshooting } from '../../components/ChargeTroubleshooting';

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'pix', label: 'Pix' },
  { value: 'card', label: 'Cartão' },
  { value: 'boleto', label: 'Boleto' },
];

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function FinancialChargeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const paymentId = typeof params?.id === 'string' ? params.id : '';

  const [payment, setPayment] = useState<Payment | null>(null);
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
  const [caseDetail, setCaseDetail] = useState<CommandCenterCaseDetail | null>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);
  const [caseDetailError, setCaseDetailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [paidMethod, setPaidMethod] = useState<PaymentMethod>('pix');
  const [paidReference, setPaidReference] = useState('');
  const [paidAt, setPaidAt] = useState(toDateTimeLocalValue(new Date().toISOString()));

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!paymentId) {
        setError('Cobrança inválida.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setCaseDetail(null);
      setCaseDetailError(null);

      const loadedPayment = await getPaymentById(paymentId);
      if (!loadedPayment) {
        if (!cancelled) {
          setPayment(null);
          setStudentPayments([]);
          setError('Cobrança não encontrada.');
          setLoading(false);
        }
        return;
      }

      const relatedPayments = loadedPayment.student?.id
        ? await getPaymentsByStudent(loadedPayment.student.id)
        : [];

      setCaseDetailLoading(true);

      let loadedCaseDetail: CommandCenterCaseDetail | null = null;
      let loadedCaseDetailError: string | null = null;

      try {
        const response = await fetch(
          `/api/financial/command-center/cases/${loadedPayment.id}?academyId=${loadedPayment.academyId}`,
          { cache: 'no-store' },
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          loadedCaseDetailError =
            typeof payload?.error === 'string'
              ? payload.error
              : 'Não foi possível carregar o contexto operacional desta cobrança.';
        } else {
          loadedCaseDetail = payload as CommandCenterCaseDetail;
        }
      } catch (caseError) {
        loadedCaseDetailError =
          caseError instanceof Error
            ? caseError.message
            : 'Não foi possível carregar o contexto operacional desta cobrança.';
      }

      if (cancelled) {
        return;
      }

      setPayment(loadedPayment);
      setPaidMethod(loadedPayment.method);
      setPaidReference(loadedPayment.reference || '');
      setPaidAt(toDateTimeLocalValue(loadedPayment.paidAt || new Date().toISOString()));
      setStudentPayments(relatedPayments.filter((item: Payment) => item.id !== loadedPayment.id));
      setCaseDetail(loadedCaseDetail);
      setCaseDetailError(loadedCaseDetailError);
      setCaseDetailLoading(false);
      setLoading(false);
    };

    const timeoutId = window.setTimeout(() => {
      void run();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [paymentId, reloadKey]);

  const overdueDays = useMemo(() => {
    if (!payment || payment.status === 'paid' || payment.status === 'refunded') {
      return 0;
    }
    return getDaysOverdue(payment.dueDate);
  }, [payment]);

  const paymentLink = useMemo(() => (payment ? getPaymentLink(payment) : null), [payment]);

  const handleCopy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error('Não foi possível copiar o conteúdo.');
    }
  };

  const handleMarkPaid = async () => {
    if (!payment) {
      return;
    }

    setSaving(true);
    setActionError(null);

    const result = await markPaymentPaid(payment.id, {
      method: paidMethod,
      reference: paidReference.trim() || null,
      paidAt: new Date(paidAt).toISOString(),
    });

    setSaving(false);

    if (!result.success) {
      setActionError(result.error || 'Não foi possível registrar o pagamento.');
      return;
    }

    setShowPaidModal(false);
    setReloadKey((current) => current + 1);
  };

  const handleMarkFailed = async () => {
    if (!payment) {
      return;
    }

    setSaving(true);
    setActionError(null);

    const result = await markPaymentFailed(payment.id, {
      reference: paidReference.trim() || payment.reference || null,
    });

    setSaving(false);

    if (!result.success) {
      setActionError(result.error || 'Não foi possível marcar a cobrança como falha.');
      return;
    }

    setReloadKey((current) => current + 1);
  };

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Header
        title="Detalhe da cobrança"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/financial')}>Voltar</Button>
            <Button variant="secondary" onClick={() => setReloadKey((current) => current + 1)} disabled={loading || saving}>Atualizar</Button>
          </div>
        }
      />

      <main className="p-4 lg:p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] p-6 space-y-3">
              <div className="h-5 w-32 rounded bg-[var(--background-tertiary)] animate-pulse" />
              <div className="h-4 w-48 rounded bg-[var(--background-tertiary)] animate-pulse" />
              <div className="h-4 w-64 rounded bg-[var(--background-tertiary)] animate-pulse" />
            </div>
            <div className="rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] p-6 space-y-3">
              <div className="h-5 w-40 rounded bg-[var(--background-tertiary)] animate-pulse" />
              <div className="h-4 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />
            </div>
          </div>
        ) : error || !payment ? (
          <Card className="p-10 text-center space-y-4">
            <div className="text-[var(--status-negative)]">{error || 'Cobrança não encontrada.'}</div>
            <div>
              <Link href="/financial" className="text-sm text-[var(--status-info)] hover:underline">
                Voltar para o financeiro
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="p-6 xl:col-span-2 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl font-semibold text-[var(--element-primary)]">
                        {payment.student?.fullName || 'Aluno não encontrado'}
                      </h1>
                      <Badge variant={getPaymentStatusVariant(payment.status)}>{getPaymentStatusLabel(payment.status)}</Badge>
                      <Badge variant={getChargeOriginVariant(payment.chargeOrigin)}>{getChargeOriginLabel(payment.chargeOrigin)}</Badge>
                      {payment.isAsaasManaged && payment.asaasStatus && (
                        <Badge variant={getAsaasStatusVariant(payment.asaasStatus)}>{getAsaasStatusLabel(payment.asaasStatus)}</Badge>
                      )}
                      {overdueDays > 0 && <Badge variant="destructive">{overdueDays}d atraso</Badge>}
                    </div>
                    <div className="text-sm text-[var(--element-secondary)] space-y-1">
                      <div>{payment.subscription?.planName || 'Plano não identificado'}</div>
                      <div>{payment.student?.registrationId || 'Sem matrícula'} • {payment.student?.email || 'Sem e-mail'}</div>
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <div className="text-sm text-[var(--element-secondary)] mb-1">Valor da cobrança</div>
                    <div className="text-3xl font-bold text-[var(--element-primary)]">{formatCurrency(payment.amount, payment.currency)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <Card className="p-4 bg-[var(--background-tertiary)]">
                    <div className="text-xs text-[var(--element-disabled)] mb-1">Vencimento</div>
                    <div className="font-medium text-[var(--element-primary)]">{formatPaymentDate(payment.dueDate)}</div>
                  </Card>
                  <Card className="p-4 bg-[var(--background-tertiary)]">
                    <div className="text-xs text-[var(--element-disabled)] mb-1">Método</div>
                    <div className="font-medium text-[var(--element-primary)]">{getPaymentMethodLabel(payment.method)}</div>
                  </Card>
                  <Card className="p-4 bg-[var(--background-tertiary)]">
                    <div className="text-xs text-[var(--element-disabled)] mb-1">Pago em</div>
                    <div className="font-medium text-[var(--element-primary)]">{payment.paidAt ? formatPaymentDateTime(payment.paidAt) : 'Ainda não pago'}</div>
                  </Card>
                  <Card className="p-4 bg-[var(--background-tertiary)]">
                    <div className="text-xs text-[var(--element-disabled)] mb-1">Referência</div>
                    <div className="font-medium text-[var(--element-primary)] break-words">{payment.reference || 'Sem referência'}</div>
                  </Card>
                </div>

                {actionError && (
                  <Card className="p-4 border-[var(--status-negative)]/20 bg-[var(--status-negative)]/5">
                    <div className="text-sm text-[var(--status-negative)]">{actionError}</div>
                  </Card>
                )}

                <div className="flex flex-wrap gap-3">
                  {!payment.isAsaasManaged && payment.status !== 'paid' && (
                    <Button onClick={() => setShowPaidModal(true)} disabled={saving}>
                      Registrar pagamento
                    </Button>
                  )}
                  {!payment.isAsaasManaged && payment.status !== 'failed' && payment.status !== 'paid' && (
                    <Button variant="destructive" onClick={() => void handleMarkFailed()} disabled={saving}>
                      Marcar falha
                    </Button>
                  )}
                  {paymentLink && (
                    <Button
                      variant="secondary"
                      onClick={() => void handleCopy(paymentLink, 'Link de pagamento copiado.')}
                    >
                      Copiar link
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => void handleCopy(getReminderTemplate(payment), 'Lembrete copiado.')}
                  >
                    Copiar lembrete
                  </Button>
                </div>

                {payment.isAsaasManaged && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--background-tertiary)] text-sm text-[var(--element-secondary)]">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cobrança controlada pelo Asaas — status atualizado automaticamente via webhook.
                  </div>
                )}
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-[var(--element-primary)]">Contexto do aluno</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Aluno</div>
                    <div className="font-medium text-[var(--element-primary)]">{payment.student?.fullName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Documento</div>
                    <div className="font-medium text-[var(--element-primary)]">{payment.student?.document || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Assinatura</div>
                    <div className="font-medium text-[var(--element-primary)]">
                      {payment.subscription?.planName || '—'}
                      {payment.subscription?.subscriptionStatus && (
                        <span className="text-xs text-[var(--element-disabled)] ml-1">({payment.subscription.subscriptionStatus})</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Matrícula</div>
                    <div className="font-medium text-[var(--element-primary)]">{payment.student?.registrationId || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Criada em</div>
                    <div className="font-medium text-[var(--element-primary)]">{formatPaymentDateTime(payment.createdAt)}</div>
                  </div>
                </div>
              </Card>

              {payment.isAsaasManaged && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--element-primary)]">Dados do Asaas</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-[var(--element-disabled)] mb-1">Status externo</div>
                      <div>
                        <Badge variant={getAsaasStatusVariant(payment.asaasStatus || '')}>
                          {getAsaasStatusLabel(payment.asaasStatus || '')}
                        </Badge>
                      </div>
                    </div>
                    {payment.asaasBillingType && (
                      <div>
                        <div className="text-[var(--element-disabled)] mb-1">Tipo de cobrança</div>
                        <div className="font-medium text-[var(--element-primary)]">{payment.asaasBillingType}</div>
                      </div>
                    )}
                    {payment.asaasNetValue != null && (
                      <div>
                        <div className="text-[var(--element-disabled)] mb-1">Valor líquido</div>
                        <div className="font-medium text-[var(--element-primary)]">{formatCurrency(payment.asaasNetValue)}</div>
                      </div>
                    )}
                    {payment.asaasSyncedAt && (
                      <div>
                        <div className="text-[var(--element-disabled)] mb-1">Última sincronização</div>
                        <div className="font-medium text-[var(--element-primary)]">{formatPaymentDateTime(payment.asaasSyncedAt)}</div>
                      </div>
                    )}
                    {(payment.invoiceUrl || payment.bankSlipUrl) && (
                      <div>
                        <div className="text-[var(--element-disabled)] mb-1">Links</div>
                        <div className="flex flex-col gap-1">
                          {payment.invoiceUrl && (
                            <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--status-info)] hover:underline text-sm">
                              Ver fatura (invoice)
                            </a>
                          )}
                          {payment.bankSlipUrl && (
                            <a href={payment.bankSlipUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--status-info)] hover:underline text-sm">
                              Ver boleto
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {payment.isRecurring && (
                      <div>
                        <div className="text-[var(--element-disabled)] mb-1">Tipo</div>
                        <div className="font-medium text-[var(--element-primary)]">Recorrente (assinatura)</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {payment.isAsaasManaged && (
                <ChargeTroubleshooting
                  payment={payment}
                  onReconciled={() => setReloadKey((current) => current + 1)}
                />
              )}
            </div>

            <Card className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--element-primary)]">Operação do caso</h2>
                  <p className="text-sm text-[var(--element-secondary)]">
                    Timeline real de cobrança, automations, notificações e inconsistências desta cobrança.
                  </p>
                </div>
                {caseDetail?.case && (
                  <Badge variant={getCommandCenterQueueVariant(caseDetail.case.queueStatus)}>
                    {getCommandCenterQueueLabel(caseDetail.case.queueStatus)}
                  </Badge>
                )}
              </div>

              {caseDetailLoading ? (
                <div className="space-y-3">
                  <div className="h-20 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
                  <div className="h-20 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
                </div>
              ) : caseDetailError ? (
                <div className="rounded-xl border border-[var(--status-negative)]/20 bg-[var(--status-negative)]/5 px-4 py-3 text-sm text-[var(--status-negative)]">
                  {caseDetailError}
                </div>
              ) : caseDetail ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[var(--background-tertiary)] p-4">
                        <div className="text-xs text-[var(--element-disabled)] mb-1">Automação atual</div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant={getAutomationStatusVariant(caseDetail.case.automation.status)}>
                            {getAutomationStatusLabel(caseDetail.case.automation.status)}
                          </Badge>
                          {caseDetail.case.automation.stage && (
                            <Badge variant="outline">
                              {getAutomationStageLabel(caseDetail.case.automation.stage)}
                            </Badge>
                          )}
                        </div>
                        <div className="font-medium text-[var(--element-primary)]">
                          {getAutomationTriggerLabel(caseDetail.case.automation.triggerType)}
                        </div>
                        <div className="text-sm text-[var(--element-secondary)] mt-2">
                          {caseDetail.case.automation.reason || 'Sem justificativa adicional registrada.'}
                        </div>
                      </div>

                      <div className="rounded-xl bg-[var(--background-tertiary)] p-4">
                        <div className="text-xs text-[var(--element-disabled)] mb-1">Inadimplência do aluno</div>
                        {caseDetail.studentDelinquency ? (
                          <>
                            <div className="font-medium text-[var(--element-primary)]">
                              {caseDetail.studentDelinquency.overdueCount} cobrança(s)
                            </div>
                            <div className="text-sm text-[var(--element-secondary)] mt-2">
                              {formatCurrency(caseDetail.studentDelinquency.overdueTotal)} em aberto • {caseDetail.studentDelinquency.daysDelinquent} dia(s) de atraso
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-[var(--element-secondary)]">
                            Aluno sem inadimplência agregada no momento.
                          </div>
                        )}
                      </div>
                    </div>

                    {caseDetail.recommendedAutomation && (
                      <div className="rounded-xl border border-[var(--status-info)]/20 bg-[var(--status-info-background)] px-4 py-3">
                        <div className="text-xs font-medium text-[var(--status-info)] mb-1">Próxima automação elegível</div>
                        <div className="font-medium text-[var(--element-primary)]">
                          {getAutomationTriggerLabel(caseDetail.recommendedAutomation.triggerType)} • {getAutomationStageLabel(caseDetail.recommendedAutomation.stage)}
                        </div>
                        <div className="text-sm text-[var(--element-secondary)] mt-2">
                          {caseDetail.recommendedAutomation.reason}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-[var(--element-primary)]">Timeline de automations</h3>
                      {caseDetail.automationTimeline.length === 0 ? (
                        <div className="rounded-xl border border-[var(--divider-primary)] px-4 py-3 text-sm text-[var(--element-secondary)]">
                          Nenhuma automação registrada para este caso ou para o aluno neste período.
                        </div>
                      ) : (
                        caseDetail.automationTimeline.map((item) => (
                          <div key={item.id} className="rounded-xl border border-[var(--divider-primary)] px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-[var(--element-primary)]">
                                {getAutomationTriggerLabel(item.triggerType)}
                              </span>
                              <Badge variant={getAutomationStatusVariant(item.status)}>
                                {getAutomationStatusLabel(item.status)}
                              </Badge>
                              <Badge variant="outline">{getAutomationStageLabel(item.stage)}</Badge>
                            </div>
                            <div className="mt-2 text-sm text-[var(--element-secondary)]">
                              Criada em {formatPaymentDateTime(item.createdAt)}
                              {item.executedAt && ` • executada em ${formatPaymentDateTime(item.executedAt)}`}
                              {item.resolvedAt && ` • resolvida em ${formatPaymentDateTime(item.resolvedAt)}`}
                            </div>
                            {item.errorMessage && (
                              <div className="mt-2 text-sm text-[var(--status-negative)]">{item.errorMessage}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-[var(--element-primary)]">Timeline de comunicação</h3>
                      {caseDetail.notificationTimeline.length === 0 ? (
                        <div className="rounded-xl border border-[var(--divider-primary)] px-4 py-3 text-sm text-[var(--element-secondary)]">
                          Nenhuma notificação registrada para este caso neste período.
                        </div>
                      ) : (
                        caseDetail.notificationTimeline.map((item) => (
                          <div key={item.id} className="rounded-xl border border-[var(--divider-primary)] px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-[var(--element-primary)]">{item.type}</span>
                              <Badge variant={item.status === 'sent' ? 'success' : item.status === 'failed' ? 'destructive' : 'warning'}>
                                {item.status}
                              </Badge>
                              <Badge variant="secondary">{item.channel}</Badge>
                            </div>
                            <div className="mt-2 text-sm text-[var(--element-secondary)]">
                              {formatPaymentDateTime(item.createdAt)}
                              {item.recipientEmail && ` • ${item.recipientEmail}`}
                            </div>
                            {item.error && (
                              <div className="mt-2 text-sm text-[var(--status-negative)]">{item.error}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-[var(--element-primary)]">Inconsistências e sync</h3>
                      {caseDetail.syncIssues.length === 0 && caseDetail.syncIncidents.length === 0 ? (
                        <div className="rounded-xl border border-[var(--status-positive)]/20 bg-[var(--status-positive)]/5 px-4 py-3 text-sm text-[var(--status-positive)]">
                          Nenhum sinal crítico de sincronização para esta cobrança.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {caseDetail.syncIssues.map((issue) => (
                            <div key={`${issue.type}-${issue.eventId || issue.chargeId || issue.createdAt}`} className="rounded-xl border border-[var(--divider-primary)] px-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-[var(--element-primary)]">{getSyncIssueLabel(issue.type)}</span>
                                <Badge variant={getSyncIssueVariant(issue.severity)}>
                                  {issue.severity === 'destructive' ? 'Crítico' : 'Atenção'}
                                </Badge>
                              </div>
                              <div className="mt-2 text-sm text-[var(--element-secondary)]">{issue.description}</div>
                            </div>
                          ))}

                          {caseDetail.syncIncidents.map((incident) => (
                            <div key={incident.eventId} className="rounded-xl border border-[var(--divider-primary)] px-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-[var(--element-primary)]">{incident.eventType}</span>
                                <Badge variant={incident.status === 'failed' ? 'destructive' : 'warning'}>
                                  {incident.status}
                                </Badge>
                              </div>
                              <div className="mt-2 text-sm text-[var(--element-secondary)]">
                                Recebido em {formatPaymentDateTime(incident.receivedAt)}
                                {incident.errorMessage && ` • ${incident.errorMessage}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--divider-primary)] px-4 py-3 text-sm text-[var(--element-secondary)]">
                  Nenhum contexto operacional adicional disponível para esta cobrança.
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--element-primary)]">Outras cobranças do aluno</h2>
                  <p className="text-sm text-[var(--element-secondary)]">Usado para validar o histórico por aluno.</p>
                </div>
                <Badge variant="secondary">{studentPayments.length}</Badge>
              </div>

              {studentPayments.length === 0 ? (
                <div className="text-sm text-[var(--element-secondary)]">Nenhuma outra cobrança encontrada para este aluno.</div>
              ) : (
                <div className="space-y-3">
                  {studentPayments.map((item) => (
                    <Link key={item.id} href={`/financial/cobranca/${item.id}`} className="block">
                      <div className="p-4 rounded-xl border border-[var(--divider-primary)] hover:bg-[var(--background-tertiary)] transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-[var(--element-primary)]">{item.reference || 'Cobrança sem referência'}</span>
                              <Badge variant={getPaymentStatusVariant(item.status)}>{getPaymentStatusLabel(item.status)}</Badge>
                            </div>
                            <div className="text-sm text-[var(--element-secondary)]">
                              {formatPaymentDate(item.dueDate)} • {getPaymentMethodLabel(item.method)}
                            </div>
                          </div>
                          <div className="text-left md:text-right font-semibold text-[var(--element-primary)]">
                            {formatCurrency(item.amount, item.currency)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </main>

      {showPaidModal && payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--element-primary)]">Registrar pagamento</h2>
                <p className="text-sm text-[var(--element-secondary)] mt-1">Atualize a cobrança como paga e salve o método utilizado.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowPaidModal(false)}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--element-primary)] mb-2">Método</label>
              <select
                value={paidMethod}
                onChange={(event) => setPaidMethod(event.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm h-10"
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--element-primary)] mb-2">Data do pagamento</label>
              <Input type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--element-primary)] mb-2">Referência</label>
              <Input value={paidReference} onChange={(event) => setPaidReference(event.target.value)} placeholder="Ex: PIX confirmado no caixa" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowPaidModal(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={() => void handleMarkPaid()} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar pagamento'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
