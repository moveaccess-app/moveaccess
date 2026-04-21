'use client';

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SkeletonCard, SkeletonStats } from '@/components/ui/Skeleton';
import {
  formatCurrency,
  formatPaymentDate,
  formatPaymentDateTime,
  getAsaasStatusLabel,
  getAsaasStatusVariant,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
} from '@/lib/payments/paymentService';
import {
  getActiveAcademyId,
} from '@/lib/supabase/academyScope';
import {
  getAutomationStageLabel,
  getAutomationStatusLabel,
  getAutomationStatusVariant,
  getAutomationTriggerLabel,
  getCommandCenterQueueLabel,
  getCommandCenterQueueVariant,
  getSyncIssueLabel,
  getSyncIssueVariant,
  type CommandCenterAutomationStatus,
  type CommandCenterCase,
  type CommandCenterQueueStatus,
  type CommandCenterResponse,
  type CommandCenterSyncIncident,
} from '@/lib/payments/commandCenter';
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  Workflow,
  Wrench,
} from 'lucide-react';

type QueueFilter = 'all' | CommandCenterQueueStatus;
type AutomationFilter = 'all' | CommandCenterAutomationStatus;
type SyncFilter = 'all' | 'with_issues' | 'without_issues';

const QUEUE_FILTER_OPTIONS: Array<{ value: QueueFilter; label: string }> = [
  { value: 'all', label: 'Toda a fila' },
  { value: 'pre_block', label: 'Pré-bloqueio' },
  { value: 'escalated', label: 'Escalada' },
  { value: 'overdue', label: 'Em atraso' },
  { value: 'due_soon', label: 'A vencer' },
  { value: 'failed', label: 'Falha local' },
  { value: 'sync_issue', label: 'Sync issue' },
];

const AUTOMATION_FILTER_OPTIONS: Array<{ value: AutomationFilter; label: string }> = [
  { value: 'all', label: 'Todas automações' },
  { value: 'recommended', label: 'Sugeridas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'executed', label: 'Executadas' },
  { value: 'failed', label: 'Falhas' },
  { value: 'resolved', label: 'Resolvidas' },
  { value: 'none', label: 'Sem automação' },
];

const SYNC_FILTER_OPTIONS: Array<{ value: SyncFilter; label: string }> = [
  { value: 'all', label: 'Com ou sem inconsistência' },
  { value: 'with_issues', label: 'Só com inconsistência' },
  { value: 'without_issues', label: 'Sem inconsistência' },
];

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'default',
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  tone?: 'default' | 'warning' | 'destructive' | 'success';
}) {
  const toneClass = {
    default: 'text-[var(--element-primary)] bg-[var(--background-tertiary)]',
    warning: 'text-[var(--status-alert)] bg-[var(--status-alert-background)]',
    destructive: 'text-[var(--status-negative)] bg-[var(--status-negative-background)]',
    success: 'text-[var(--status-positive)] bg-[var(--status-positive-background)]',
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-[var(--element-secondary)]">{title}</div>
          <div className="mt-2 text-2xl font-bold text-[var(--element-primary)]">{value}</div>
          <div className="mt-1 text-xs text-[var(--element-secondary)]">{subtitle}</div>
        </div>
        <div className={`rounded-xl p-2.5 ${toneClass}`}>{icon}</div>
      </div>
    </Card>
  );
}

function getCardAccent(caseItem: CommandCenterCase): string {
  switch (caseItem.queueStatus) {
    case 'pre_block':
    case 'escalated':
    case 'failed':
      return 'border-l-[var(--status-negative)]';
    case 'overdue':
      return 'border-l-[var(--status-alert)]';
    case 'sync_issue':
      return 'border-l-[var(--status-info)]';
    default:
      return 'border-l-[var(--status-warning)]';
  }
}

export function OperationalCommandCenter({
  showValues,
  reloadToken,
  onCreateCharge,
  onOpenOverdue,
  onOpenCharges,
  onGlobalRefresh,
}: {
  showValues: boolean;
  reloadToken: number;
  onCreateCharge: () => void;
  onOpenOverdue: () => void;
  onOpenCharges: () => void;
  onGlobalRefresh: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<CommandCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [automationFilter, setAutomationFilter] = useState<AutomationFilter>('all');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [reprocessingEventId, setReprocessingEventId] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const resolvedAcademyId = await getActiveAcademyId();

        if (!resolvedAcademyId) {
          throw new Error('Não foi possível resolver a academia ativa.');
        }

        if (cancelled) {
          return;
        }

        setAcademyId(resolvedAcademyId);

        const response = await fetch(
          `/api/financial/command-center?academyId=${resolvedAcademyId}`,
          { cache: 'no-store' },
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof payload?.error === 'string'
              ? payload.error
              : 'Não foi possível carregar o command center.',
          );
        }

        if (cancelled) {
          return;
        }

        setData(payload as CommandCenterResponse);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setData(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar o command center.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const filteredCases = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.cases.filter((caseItem) => {
      if (queueFilter !== 'all' && caseItem.queueStatus !== queueFilter) {
        return false;
      }

      if (automationFilter !== 'all' && caseItem.automation.status !== automationFilter) {
        return false;
      }

      if (syncFilter === 'with_issues' && caseItem.syncIssues.length === 0) {
        return false;
      }

      if (syncFilter === 'without_issues' && caseItem.syncIssues.length > 0) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const haystack = [
        caseItem.studentName,
        caseItem.studentEmail,
        caseItem.studentRegistrationId,
        caseItem.studentDocument,
        caseItem.planName,
        caseItem.reference,
        caseItem.unitName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(deferredSearch);
    });
  }, [automationFilter, data, deferredSearch, queueFilter, syncFilter]);

  const visibleSyncIncidents = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.syncIncidents.slice(0, 8);
  }, [data]);

  const handleOpenPaymentLink = (caseItem: CommandCenterCase) => {
    const link = caseItem.invoiceUrl || caseItem.bankSlipUrl;

    if (!link) {
      toast.error('Esta cobrança não possui link externo disponível.');
      return;
    }

    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleReprocessIncident = async (incident: CommandCenterSyncIncident) => {
    setReprocessingEventId(incident.eventId);

    try {
      const response = await fetch('/api/asaas/webhooks/reprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId: incident.eventId }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string'
            ? payload.error
            : 'Não foi possível reprocessar o evento.',
        );
      }

      toast.success('Evento reenviado para processamento.');
      onGlobalRefresh();
    } catch (reprocessError) {
      toast.error(
        reprocessError instanceof Error
          ? reprocessError.message
          : 'Não foi possível reprocessar o evento.',
      );
    } finally {
      setReprocessingEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={5} />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 space-y-4">
        <div className="text-sm text-[var(--status-negative)]">{error}</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onGlobalRefresh} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
          <Button variant="secondary" onClick={onCreateCharge}>
            Registrar cobrança
          </Button>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <SummaryCard
          title="Fila operacional"
          value={String(data.summary.caseCount)}
          subtitle="Cobranças que exigem ação ou acompanhamento"
          icon={<Workflow className="w-5 h-5" />}
          tone="default"
        />
        <SummaryCard
          title="Alunos inadimplentes"
          value={String(data.summary.delinquentStudentsCount)}
          subtitle="Baseado na view real de inadimplência"
          icon={<AlertTriangle className="w-5 h-5" />}
          tone="warning"
        />
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-[var(--element-secondary)]">Automações</div>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="font-semibold text-[var(--status-alert)]">{data.summary.automationPendingCount} pend.</span>
                <span className="font-semibold text-[var(--status-info)]">{data.summary.automationExecutedCount} exec.</span>
                <span className="font-semibold text-[var(--status-negative)]">{data.summary.automationFailedCount} falha</span>
              </div>
              <div className="mt-2 text-xs text-[var(--element-secondary)]">
                Casos com automações reais já registradas
              </div>
            </div>
            <div className="rounded-xl p-2.5 text-[var(--status-info)] bg-[var(--status-info-background)]">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
        </Card>
        <SummaryCard
          title="Regularizações"
          value={String(data.summary.regularizedCount)}
          subtitle="Casos resolvidos ou alunos já regularizados"
          icon={<CheckCircle2 className="w-5 h-5" />}
          tone="success"
        />
        <SummaryCard
          title="Inconsistências"
          value={String(data.summary.syncIssueCount)}
          subtitle={
            data.summary.checkedAt
              ? `Última varredura: ${formatPaymentDateTime(data.summary.checkedAt)}`
              : 'Sem timestamp do health check'
          }
          icon={<ShieldAlert className="w-5 h-5" />}
          tone={data.summary.syncIssueCount > 0 ? 'destructive' : 'success'}
        />
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--element-primary)]">Fila de cobrança e automations</h2>
            <p className="text-sm text-[var(--element-secondary)]">
              Visão operacional com cobrança, stage sugerido ou executado e sinais de inconsistência.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onOpenOverdue}>
              Ver inadimplência
            </Button>
            <Button variant="outline" onClick={onOpenCharges}>
              Ver todas as cobranças
            </Button>
            <Button onClick={onCreateCharge}>Nova cobrança</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--element-disabled)] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por aluno, matrícula, documento, plano ou referência"
              className="pl-9"
            />
          </div>
          <Select value={queueFilter} onChange={(event) => setQueueFilter(event.target.value as QueueFilter)}>
            {QUEUE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Select value={automationFilter} onChange={(event) => setAutomationFilter(event.target.value as AutomationFilter)}>
            {AUTOMATION_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Select value={syncFilter} onChange={(event) => setSyncFilter(event.target.value as SyncFilter)}>
            {SYNC_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--element-secondary)]">
          <Badge variant="secondary">{filteredCases.length} caso(s) visível(is)</Badge>
          <span>Academia ativa: {data.cases[0]?.academyName || 'MoveAccess'}</span>
          {academyId && <span>Escopo: {academyId.slice(0, 8)}...</span>}
        </div>
      </Card>

      {filteredCases.length === 0 ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={<CheckCircle2 className="w-10 h-10" />}
            title="Nenhum caso operacional com esses filtros"
            description="A fila atual não tem cobrança vencida, pré-bloqueio, automação ou inconsistência combinando com o filtro aplicado."
            action={{ label: 'Limpar filtros', onClick: () => {
              setSearch('');
              setQueueFilter('all');
              setAutomationFilter('all');
              setSyncFilter('all');
            } }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((caseItem) => (
            <Card key={caseItem.paymentId} className={`p-4 border-l-4 ${getCardAccent(caseItem)}`}>
              <div className="flex flex-col xl:flex-row gap-4 xl:items-start">
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-[var(--element-primary)] truncate">
                          {caseItem.studentName}
                        </h3>
                        <Badge variant={getCommandCenterQueueVariant(caseItem.queueStatus)}>
                          {getCommandCenterQueueLabel(caseItem.queueStatus)}
                        </Badge>
                        <Badge variant={getAutomationStatusVariant(caseItem.automation.status)}>
                          {getAutomationStatusLabel(caseItem.automation.status)}
                        </Badge>
                        {caseItem.automation.stage && (
                          <Badge variant="outline">{getAutomationStageLabel(caseItem.automation.stage)}</Badge>
                        )}
                        <Badge variant={getPaymentStatusVariant(caseItem.paymentStatus)}>
                          {getPaymentStatusLabel(caseItem.paymentStatus)}
                        </Badge>
                        {caseItem.isAsaasManaged && caseItem.asaasStatus && (
                          <Badge variant={getAsaasStatusVariant(caseItem.asaasStatus)}>
                            {getAsaasStatusLabel(caseItem.asaasStatus)}
                          </Badge>
                        )}
                        {caseItem.syncIssues.length > 0 && (
                          <Badge variant="warning">{caseItem.syncIssues.length} incons.</Badge>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--element-secondary)]">
                        {caseItem.studentRegistrationId && <span>Matrícula: {caseItem.studentRegistrationId}</span>}
                        {caseItem.studentDocument && <span>Doc: {caseItem.studentDocument}</span>}
                        {caseItem.planName && <span>Plano: {caseItem.planName}</span>}
                        {caseItem.unitName && <span>Unidade: {caseItem.unitName}</span>}
                        {caseItem.reference && <span>Ref.: {caseItem.reference}</span>}
                      </div>
                    </div>

                    <div className="text-left xl:text-right">
                      <div className="text-xs text-[var(--element-secondary)]">Valor em foco</div>
                      <div className="text-xl font-bold text-[var(--element-primary)]">
                        {showValues ? formatCurrency(caseItem.amount, caseItem.currency) : '••••••'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-xl bg-[var(--background-tertiary)] p-3">
                      <div className="text-xs text-[var(--element-disabled)] mb-1">Vencimento</div>
                      <div className="font-medium text-[var(--element-primary)]">{formatPaymentDate(caseItem.dueDate)}</div>
                      <div className="text-xs text-[var(--element-secondary)] mt-1">
                        {caseItem.daysOverdue > 0
                          ? `${caseItem.daysOverdue} dia(s) em atraso`
                          : `vence em ${caseItem.daysUntilDue} dia(s)`}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--background-tertiary)] p-3">
                      <div className="text-xs text-[var(--element-disabled)] mb-1">Contexto financeiro</div>
                      <div className="font-medium text-[var(--element-primary)]">
                        {showValues ? formatCurrency(caseItem.totalOverdue, caseItem.currency) : '••••••'}
                      </div>
                      <div className="text-xs text-[var(--element-secondary)] mt-1">
                        {caseItem.overdueCount} cobrança(s) em aberto para o aluno
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--background-tertiary)] p-3">
                      <div className="text-xs text-[var(--element-disabled)] mb-1">Automação</div>
                      <div className="font-medium text-[var(--element-primary)]">
                        {getAutomationTriggerLabel(caseItem.automation.triggerType)}
                      </div>
                      <div className="text-xs text-[var(--element-secondary)] mt-1">
                        {caseItem.automation.reason || 'Sem razão adicional registrada.'}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--background-tertiary)] p-3">
                      <div className="text-xs text-[var(--element-disabled)] mb-1">Último contato</div>
                      <div className="font-medium text-[var(--element-primary)]">
                        {caseItem.lastNotification
                          ? formatPaymentDateTime(caseItem.lastNotification.createdAt)
                          : 'Sem envio registrado'}
                      </div>
                      <div className="text-xs text-[var(--element-secondary)] mt-1">
                        {caseItem.lastNotification
                          ? `${caseItem.lastNotification.type} · ${caseItem.lastNotification.status}`
                          : 'Nenhuma notificação recente'}
                      </div>
                    </div>
                  </div>

                  {(caseItem.syncIssues.length > 0 || caseItem.automation.errorMessage) && (
                    <div className="space-y-2">
                      {caseItem.automation.errorMessage && (
                        <div className="rounded-xl border border-[var(--status-negative)]/20 bg-[var(--status-negative)]/5 px-3 py-2 text-sm text-[var(--status-negative)]">
                          Falha da automação: {caseItem.automation.errorMessage}
                        </div>
                      )}

                      {caseItem.syncIssues.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {caseItem.syncIssues.slice(0, 3).map((issue) => (
                            <Badge
                              key={`${caseItem.paymentId}-${issue.type}-${issue.eventId || issue.chargeId || issue.createdAt}`}
                              variant={getSyncIssueVariant(issue.severity)}
                              title={issue.description}
                            >
                              {getSyncIssueLabel(issue.type)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full xl:w-[240px] space-y-2">
                  <Button className="w-full gap-1.5" onClick={() => router.push(`/financial/cobranca/${caseItem.paymentId}`)}>
                    <Wrench className="w-4 h-4" />
                    Abrir caso operacional
                  </Button>
                  <Button variant="secondary" className="w-full gap-1.5" onClick={() => router.push(`/users/${caseItem.studentId}`)}>
                    <UserRound className="w-4 h-4" />
                    Abrir aluno
                  </Button>
                  {(caseItem.invoiceUrl || caseItem.bankSlipUrl) && (
                    <Button variant="outline" className="w-full gap-1.5" onClick={() => handleOpenPaymentLink(caseItem)}>
                      <ExternalLink className="w-4 h-4" />
                      Abrir link de pagamento
                    </Button>
                  )}
                  {caseItem.studentEmail && (
                    <Button
                      variant="ghost"
                      className="w-full gap-1.5"
                      onClick={() => {
                        const studentEmail = caseItem.studentEmail;

                        if (!studentEmail) {
                          return;
                        }

                        void navigator.clipboard
                          .writeText(studentEmail)
                          .then(() => toast.success('E-mail copiado.'))
                          .catch(() => toast.error('Não foi possível copiar o e-mail.'));
                      }}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Copiar contato
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-[var(--element-primary)]">Incidentes de sync</h2>
            <p className="text-sm text-[var(--element-secondary)]">
              Eventos de webhook com falha ou órfãos detectados pelo health check real do financeiro.
            </p>
          </div>
          <Badge variant={visibleSyncIncidents.length > 0 ? 'warning' : 'success'}>
            {visibleSyncIncidents.length} recente(s)
          </Badge>
        </div>

        {visibleSyncIncidents.length === 0 ? (
          <div className="rounded-xl border border-[var(--status-positive)]/20 bg-[var(--status-positive)]/5 px-4 py-5 text-sm text-[var(--status-positive)]">
            Nenhum incidente recente de webhook nas últimas verificações.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleSyncIncidents.map((incident) => (
              <div key={incident.eventId} className="rounded-xl border border-[var(--divider-primary)] px-4 py-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[var(--element-primary)]">{incident.eventType}</span>
                      <Badge variant={incident.status === 'failed' ? 'destructive' : 'warning'}>
                        {incident.status}
                      </Badge>
                      {incident.relatedStudentName && (
                        <Badge variant="secondary">{incident.relatedStudentName}</Badge>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-[var(--element-secondary)] break-words">
                      {incident.errorMessage || 'Sem mensagem de erro registrada.'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--element-secondary)]">
                      <span>Recebido: {formatPaymentDateTime(incident.receivedAt)}</span>
                      {incident.lastAttemptAt && <span>Última tentativa: {formatPaymentDateTime(incident.lastAttemptAt)}</span>}
                      {incident.asaasPaymentId && <span>Asaas: {incident.asaasPaymentId}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {incident.relatedPaymentId && (
                      <Button variant="secondary" size="sm" onClick={() => router.push(`/financial/cobranca/${incident.relatedPaymentId}`)}>
                        Abrir cobrança
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => void handleReprocessIncident(incident)}
                      disabled={reprocessingEventId === incident.eventId}
                    >
                      {reprocessingEventId === incident.eventId ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Reprocessar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onGlobalRefresh} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Atualizar varredura
          </Button>
          <Button variant="ghost" onClick={() => router.push('/settings/integrations')} className="gap-1.5">
            <Clock3 className="w-4 h-4" />
            Ver integrações
          </Button>
        </div>
      </Card>
    </div>
  );
}