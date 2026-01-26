'use client';

import { useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getContractById,
  getContractsByUserId,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_VARIANT,
  CONTRACT_ORIGIN_LABELS,
  CONTRACT_EVENT_LABELS,
  SIGNATURE_METHOD_LABELS,
  formatContractValue,
  getDaysRemaining,
  type ContractStatus,
} from '@/mocks/contractsMock';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Componente para exibir seção expansível
function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-light)] flex items-center justify-center text-[var(--color-brand)]">
            {icon}
          </div>
          <span className="font-semibold text-[var(--color-text-primary)]">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4 pt-0 border-t border-[var(--color-border-primary)]">{children}</div>}
    </Card>
  );
}

// Componente para linha de informação
function InfoRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-[var(--color-border-primary)] last:border-b-0">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className={`text-right ${highlight ? 'font-semibold text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'}`}>
        {value}
      </span>
    </div>
  );
}

export default function AssinaturaDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const contract = useMemo(() => getContractById(id), [id]);
  const userContracts = useMemo(
    () => (contract ? getContractsByUserId(contract.userId).filter((c) => c.id !== contract.id) : []),
    [contract]
  );

  // Formata data para exibição
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  // Ações baseadas no status
  const getAvailableActions = (status: ContractStatus) => {
    const actions: { label: string; action: string; variant: 'default' | 'secondary' | 'destructive' }[] = [];

    switch (status) {
      case 'draft':
        actions.push({ label: 'Enviar para Assinatura', action: 'send_signature', variant: 'default' });
        actions.push({ label: 'Excluir Rascunho', action: 'delete', variant: 'destructive' });
        break;
      case 'pending_signature':
        actions.push({ label: 'Reenviar Contrato', action: 'resend', variant: 'secondary' });
        actions.push({ label: 'Marcar como Assinado', action: 'mark_signed', variant: 'default' });
        break;
      case 'pending_payment':
        actions.push({ label: 'Registrar Pagamento', action: 'register_payment', variant: 'default' });
        actions.push({ label: 'Cancelar', action: 'cancel', variant: 'destructive' });
        break;
      case 'pending_approval':
        actions.push({ label: 'Aprovar', action: 'approve', variant: 'default' });
        actions.push({ label: 'Rejeitar', action: 'reject', variant: 'destructive' });
        break;
      case 'active':
        actions.push({ label: 'Suspender', action: 'suspend', variant: 'secondary' });
        actions.push({ label: 'Renovar', action: 'renew', variant: 'default' });
        actions.push({ label: 'Cancelar', action: 'cancel', variant: 'destructive' });
        break;
      case 'suspended':
        actions.push({ label: 'Reativar', action: 'reactivate', variant: 'default' });
        actions.push({ label: 'Cancelar', action: 'cancel', variant: 'destructive' });
        break;
      case 'expired':
        actions.push({ label: 'Renovar', action: 'renew', variant: 'default' });
        break;
    }

    return actions;
  };

  // Handler de ação (mock)
  const handleAction = (action: string) => {
    console.log('Action:', action);
    alert(`Ação "${action}" executada (mock)`);
  };

  if (!contract) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
        <Header title="Assinatura não encontrada" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-[var(--color-text-tertiary)] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Assinatura não encontrada</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">A assinatura solicitada não existe ou foi removida.</p>
            <Button onClick={() => router.push('/assinaturas')}>Voltar para Assinaturas</Button>
          </Card>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(contract.endDate);
  const actions = getAvailableActions(contract.status);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title={`Assinatura ${contract.number}`} />

      <div className="flex-1 overflow-auto p-6">
        {/* Header Card */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Info principal */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[var(--color-brand-light)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{contract.number}</h1>
                  <Badge variant={CONTRACT_STATUS_VARIANT[contract.status]}>
                    {CONTRACT_STATUS_LABELS[contract.status]}
                  </Badge>
                  {contract.flags.isCurrentContract && <Badge variant="secondary">Vigente</Badge>}
                </div>
                <p className="text-[var(--color-text-secondary)]">
                  {CONTRACT_ORIGIN_LABELS[contract.origin]} • Criado em {formatDate(contract.createdAt)}
                </p>
                {contract.statusReason && (
                  <p className="text-sm text-[var(--color-warning)] mt-1">
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    {contract.statusReason}
                  </p>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.action}
                  variant={action.variant}
                  onClick={() => handleAction(action.action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--color-border-primary)]">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatContractValue(contract.financials.finalMonthlyValue)}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Valor Mensal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{formatDate(contract.endDate)}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Vencimento</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  daysRemaining <= 30 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'
                }`}
              >
                {daysRemaining > 0 ? `${daysRemaining} dias` : 'Vencido'}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Restantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {contract.planSnapshot.minimumCommitment}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Meses Fidelidade</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <Section
              title="Cliente"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg text-[var(--color-text-primary)]">{contract.userName}</div>
                  <div className="text-[var(--color-text-secondary)]">{contract.userDocument}</div>
                </div>
                <Button variant="secondary" onClick={() => router.push(`/users/${contract.userId}`)}>
                  Ver Perfil
                </Button>
              </div>
            </Section>

            {/* Plano Contratado */}
            <Section
              title="Plano Contratado"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              }
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-lg text-[var(--color-text-primary)]">
                      {contract.planSnapshot.planName}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">{contract.planSnapshot.category}</div>
                  </div>
                  <Badge variant="secondary">Snapshot</Badge>
                </div>
                <p className="text-[var(--color-text-secondary)]">{contract.planSnapshot.planDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <InfoRow label="Ciclo de Cobrança" value={contract.planSnapshot.billingCycle} />
                  <InfoRow label="Valor Base" value={formatContractValue(contract.planSnapshot.basePrice)} />
                  <InfoRow label="Taxa de Matrícula" value={formatContractValue(contract.planSnapshot.enrollmentFee)} />
                </div>
                <div>
                  <InfoRow label="Fidelidade" value={`${contract.planSnapshot.minimumCommitment} meses`} />
                  <InfoRow label="Multa Cancelamento" value={`${contract.planSnapshot.earlyTerminationFee}%`} />
                  <InfoRow
                    label="Auto Renovação"
                    value={contract.planSnapshot.autoRenewal ? 'Sim' : 'Não'}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Recursos Inclusos</h4>
                <div className="flex flex-wrap gap-2">
                  {contract.planSnapshot.features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </Section>

            {/* Regras de Acesso */}
            <Section
              title="Regras de Acesso"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <InfoRow
                    label="Horário"
                    value={
                      contract.planSnapshot.accessRules.is24Hours
                        ? '24 horas'
                        : `${contract.planSnapshot.accessRules.allowedHours.start} - ${contract.planSnapshot.accessRules.allowedHours.end}`
                    }
                  />
                  <InfoRow
                    label="Check-ins por Dia"
                    value={
                      contract.planSnapshot.accessRules.dailyCheckInLimit === 0
                        ? 'Ilimitado'
                        : contract.planSnapshot.accessRules.dailyCheckInLimit
                    }
                  />
                </div>
                <div>
                  <InfoRow
                    label="Dias Permitidos"
                    value={
                      contract.planSnapshot.accessRules.allowedDays.length === 7
                        ? 'Todos os dias'
                        : `${contract.planSnapshot.accessRules.allowedDays.length} dias/semana`
                    }
                  />
                  <InfoRow label="Unidade" value={contract.unitName} />
                </div>
              </div>

              {/* Status de acesso */}
              <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
                <div className="flex items-center gap-2">
                  {contract.flags.hasAccessPermission ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
                      <span className="text-[var(--color-success)]">Acesso Liberado</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full bg-[var(--color-error)]" />
                      <span className="text-[var(--color-error)]">Acesso Bloqueado</span>
                    </>
                  )}
                </div>
              </div>
            </Section>

            {/* Histórico de Eventos */}
            <Section
              title="Histórico de Eventos"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              defaultOpen={false}
            >
              <div className="space-y-4">
                {contract.events
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((event) => (
                    <div key={event.id} className="flex gap-4 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 text-[var(--color-text-tertiary)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {CONTRACT_EVENT_LABELS[event.type]}
                          </span>
                          <span className="text-xs text-[var(--color-text-tertiary)]">{formatDateTime(event.timestamp)}</span>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)]">{event.description}</p>
                        {event.performedByName && (
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Por: {event.performedByName}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financeiro */}
            <Section
              title="Financeiro"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              <div className="text-sm">
                <InfoRow label="Valor Base" value={formatContractValue(contract.financials.monthlyValue)} />
                {contract.financials.discount && (
                  <>
                    <InfoRow
                      label={`Desconto (${contract.financials.discount.reason})`}
                      value={
                        contract.financials.discount.type === 'percentage'
                          ? `${contract.financials.discount.value}%`
                          : formatContractValue(contract.financials.discount.value)
                      }
                    />
                  </>
                )}
                <InfoRow label="Valor Final" value={formatContractValue(contract.financials.finalMonthlyValue)} highlight />
                <div className="my-2 border-t border-[var(--color-border-primary)]" />
                <InfoRow label="Taxa de Matrícula" value={formatContractValue(contract.financials.enrollmentFee)} />
                {contract.financials.enrollmentFeeDiscount > 0 && (
                  <InfoRow
                    label="Desconto Matrícula"
                    value={`-${formatContractValue(contract.financials.enrollmentFeeDiscount)}`}
                  />
                )}
                <InfoRow label="Matrícula Paga" value={formatContractValue(contract.financials.enrollmentFeeFinal)} />
                <div className="my-2 border-t border-[var(--color-border-primary)]" />
                <InfoRow label="Dia de Vencimento" value={`Dia ${contract.financials.paymentDayOfMonth}`} />
                {contract.financials.preferredPaymentMethod && (
                  <InfoRow label="Forma de Pagamento" value={contract.financials.preferredPaymentMethod} />
                )}
              </div>
            </Section>

            {/* Vigência */}
            <Section
              title="Vigência"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              <div className="text-sm">
                <InfoRow label="Início" value={formatDate(contract.startDate)} />
                <InfoRow label="Término" value={formatDate(contract.endDate)} />
                <InfoRow label="Início Cobranças" value={formatDate(contract.billingStartDate)} />
                {contract.trialEndDate && <InfoRow label="Fim do Trial" value={formatDate(contract.trialEndDate)} />}
              </div>
            </Section>

            {/* Assinatura */}
            <Section
              title="Assinatura"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              }
            >
              <div className="text-sm">
                <InfoRow label="Método" value={SIGNATURE_METHOD_LABELS[contract.signature.method]} />
                {contract.signature.signedAt ? (
                  <>
                    <InfoRow label="Assinado em" value={formatDateTime(contract.signature.signedAt)} />
                    {contract.signature.signedBy && <InfoRow label="Assinado por" value={contract.signature.signedBy} />}
                  </>
                ) : (
                  <InfoRow
                    label="Status"
                    value={<Badge variant="warning">Pendente</Badge>}
                  />
                )}
              </div>
            </Section>

            {/* Outros contratos do usuário */}
            {userContracts.length > 0 && (
              <Section
                title="Histórico do Cliente"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
                defaultOpen={false}
              >
                <div className="space-y-2">
                  {userContracts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => router.push(`/assinaturas/${c.id}`)}
                      className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
                    >
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">{c.number}</div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">{c.planSnapshot.planName}</div>
                      </div>
                      <Badge variant={CONTRACT_STATUS_VARIANT[c.status]}>
                        {CONTRACT_STATUS_LABELS[c.status]}
                      </Badge>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Notas internas */}
            {contract.internalNotes && (
              <Card className="p-4">
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Notas Internas</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{contract.internalNotes}</p>
              </Card>
            )}

            {/* Botão voltar */}
            <Button variant="secondary" className="w-full" onClick={() => router.push('/assinaturas')}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para Assinaturas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
