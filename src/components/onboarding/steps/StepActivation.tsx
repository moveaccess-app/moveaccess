'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';
import type { ExternalBillingResult } from '@/lib/users/onboardingService';

interface StepActivationProps {
  session: OnboardingSession;
  onActivate: () => Promise<ActivationOutcome>;
  onBack: () => void;
  onFinish: () => void;
  onRetryBilling?: (context: {
    subscriptionId: string;
    paymentId: string;
    chargeId?: string | null;
  }) => Promise<{
    billing?: ExternalBillingResult;
    payment?: ActivationPaymentSummary;
    error?: string;
  }>;
  onRetryStudentAccess?: () => Promise<StudentAccessSummary>;
}

export interface ActivationPaymentSummary {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method: string;
  dueDate: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  asaasStatus?: string | null;
}

export interface StudentAccessSummary {
  email?: string | null;
  setupUrl?: string | null;
  error?: string;
}

export interface ActivationOutcome {
  localSuccess: boolean;
  billing?: ExternalBillingResult;
  payment?: ActivationPaymentSummary;
  studentAccess?: StudentAccessSummary;
  activation?: {
    studentId?: string;
    subscriptionId?: string;
    paymentId?: string;
  };
  error?: string;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de crédito',
  debit: 'Cartão de débito',
  pix: 'PIX',
  boleto: 'Boleto',
  cash: 'Dinheiro',
  manual: 'Manual',
  card: 'Cartão',
};

const PAYMENT_STATUS_LABELS: Record<ActivationPaymentSummary['status'], string> = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Estornado',
};

const BILLING_STATUS_CONFIG: Record<string, {
  icon: 'check' | 'clock' | 'alert';
  label: string;
  description: string;
  variant: 'positive' | 'warning' | 'alert';
}> = {
  completed_with_billing: {
    icon: 'check',
    label: 'Cobrança criada',
    description: 'A cobrança foi criada automaticamente no sistema de pagamentos.',
    variant: 'positive',
  },
  completed_local_only: {
    icon: 'check',
    label: 'Pagamento manual',
    description: 'A cobrança ficou como pendente. O pagamento será registrado manualmente.',
    variant: 'positive',
  },
  pending_external_billing: {
    icon: 'clock',
    label: 'Cobrança pendente de configuração',
    description: 'A cobrança não foi criada automaticamente. Verifique a configuração da conta de pagamentos.',
    variant: 'warning',
  },
  failed_external_billing: {
    icon: 'alert',
    label: 'Erro na cobrança automática',
    description: 'Não foi possível criar a cobrança automática. A assinatura ficou ativa e a cobrança pode ser criada depois.',
    variant: 'alert',
  },
  already_exists: {
    icon: 'check',
    label: 'Cobrança já existente',
    description: 'A cobrança já havia sido criada anteriormente.',
    variant: 'positive',
  },
};

function getCompletionState(outcome: ActivationOutcome): {
  icon: 'check' | 'clock' | 'alert';
  title: string;
  description: string;
  variant: 'positive' | 'warning' | 'alert';
} {
  if (!outcome.billing) {
    return {
      icon: 'check',
      title: 'Aluno criado com sucesso',
      description: 'O cadastro foi concluído e a cobrança ficou registrada localmente.',
      variant: 'positive',
    };
  }

  switch (outcome.billing.status) {
    case 'completed_with_billing':
    case 'already_exists':
      return {
        icon: 'check',
        title: 'Aluno e cobrança prontos',
        description: 'O cadastro foi concluído e a primeira cobrança já está rastreável no Financeiro.',
        variant: 'positive',
      };
    case 'completed_local_only':
      return {
        icon: 'check',
        title: 'Aluno criado com cobrança manual',
        description: 'O cadastro foi concluído. A cobrança ficou pendente para acompanhamento operacional.',
        variant: 'positive',
      };
    case 'pending_external_billing':
      return {
        icon: 'clock',
        title: 'Aluno criado, cobrança externa pendente',
        description: 'O cadastro foi concluído, mas a cobrança automática depende de configuração ou sincronização.',
        variant: 'warning',
      };
    case 'failed_external_billing':
      return {
        icon: 'alert',
        title: 'Aluno criado, mas a cobrança falhou',
        description: 'O aluno já pode ser gerenciado, porém a cobrança automática precisa de ação antes do envio ao aluno.',
        variant: 'alert',
      };
    default:
      return {
        icon: 'check',
        title: 'Cadastro concluído',
        description: 'O cadastro foi finalizado com sucesso.',
        variant: 'positive',
      };
  }
}

function getExternalOriginLabel(
  payment: ActivationPaymentSummary | undefined,
  billing: ExternalBillingResult | undefined,
): string {
  if (payment?.asaasStatus) {
    return payment.asaasStatus;
  }

  if (!billing) {
    return 'Sem integração externa';
  }

  if (billing.status === 'failed_external_billing') {
    return 'Falha ao criar cobrança no Asaas';
  }

  if (billing.status === 'completed_local_only') {
    return 'Sem integração externa';
  }

  if (billing.billingPath === 'subscription') {
    return 'Cobrança criada via assinatura no Asaas';
  }

  return 'Cobrança criada ou sincronizada no Asaas';
}

function BillingStatusIcon({ type, className }: { type: 'check' | 'clock' | 'alert'; className?: string }) {
  if (type === 'check') return <CheckCircleIcon className={className} />;
  if (type === 'clock') return <ClockIcon className={className} />;
  return <AlertIcon className={className} />;
}

export function StepActivation({
  session,
  onActivate,
  onBack,
  onFinish,
  onRetryBilling,
  onRetryStudentAccess,
}: StepActivationProps) {
  const [state, setState] = useState<'review' | 'activating' | 'result'>('review');
  const [outcome, setOutcome] = useState<ActivationOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedStudentLink, setCopiedStudentLink] = useState(false);
  const [copiedBillingField, setCopiedBillingField] = useState<string | null>(null);
  const [isRetryingBilling, setIsRetryingBilling] = useState(false);
  const [isRetryingStudentAccess, setIsRetryingStudentAccess] = useState(false);
  const [billingActionError, setBillingActionError] = useState<string | null>(null);

  const userName = session.collectedData.identification?.fullName || 'Aluno';
  const planName = session.collectedData.planSelection?.planName || 'Plano';
  const planValue = session.collectedData.planSelection?.value || 0;
  const paymentMethod = session.collectedData.payment?.method || 'manual';
  const contractAccepted = session.collectedData.contract?.acceptedTerms || false;

  const handleActivate = async () => {
    setState('activating');
    setError(null);

    try {
      const result = await onActivate();
      setCopiedStudentLink(false);
      setCopiedBillingField(null);
      setBillingActionError(null);
      setOutcome(result);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao ativar');
      setState('review');
    }
  };

  // ─── Loading state ──────────────────────────────────────────────

  if (state === 'activating') {
    return (
      <div className="space-y-8 text-center py-8">
        <div className="w-16 h-16 mx-auto border-4 border-[var(--element-primary)] border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Ativando cadastro...
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Criando assinatura e configurando cobrança. Aguarde.
          </p>
        </div>
      </div>
    );
  }

  // ─── Result state ───────────────────────────────────────────────

  if (state === 'result' && outcome) {
    if (!outcome.localSuccess) {
      return (
        <div className="space-y-8 text-center py-8">
          <div className="w-20 h-20 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center">
            <AlertIcon className="w-12 h-12 text-[var(--status-alert)]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Erro ao concluir cadastro
            </h2>
            <p className="text-[var(--text-secondary)]">
              {outcome.error || 'Não foi possível concluir a ativação. Tente novamente.'}
            </p>
          </div>
          <Button onClick={() => setState('review')}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    const billingConfig = outcome.billing
      ? BILLING_STATUS_CONFIG[outcome.billing.status] || BILLING_STATUS_CONFIG.pending_external_billing
      : BILLING_STATUS_CONFIG.completed_local_only;
    const completionState = getCompletionState(outcome);
    const colorVar = `var(--status-${billingConfig.variant})`;
    const heroColorVar = `var(--status-${completionState.variant})`;
    const payment = outcome.payment;
    const effectiveMethod = payment?.method || paymentMethod;
    const primaryPaymentLink = payment?.bankSlipUrl
      || payment?.invoiceUrl
      || outcome.billing?.bankSlipUrl
      || outcome.billing?.invoiceUrl
      || outcome.billing?.paymentLink
      || null;
    const secondaryPaymentLink = payment?.bankSlipUrl && payment?.invoiceUrl && payment.bankSlipUrl !== payment.invoiceUrl
      ? payment.invoiceUrl
      : null;
    const studentAccess = outcome.studentAccess;
    const pixCopyPaste = outcome.billing?.pixCopyPaste || null;
    const qrCodeImage = outcome.billing?.pixQrCodeImage || null;
    const boletoDigitableLine = outcome.billing?.bankSlipIdentificationField || null;
    const boletoBarCode = outcome.billing?.bankSlipBarCode || null;
    const hasChargePresentation = Boolean(
      primaryPaymentLink || secondaryPaymentLink || pixCopyPaste || qrCodeImage || boletoDigitableLine || boletoBarCode,
    );
    const canRetryBilling = Boolean(
      onRetryBilling && outcome.activation?.subscriptionId && outcome.activation?.paymentId,
    );
    const billingNeedsSetup = outcome.billing?.reason === 'NO_ASAAS_ACCOUNT' || outcome.billing?.reason === 'STUDENT_MISSING_CPF';
    const shouldOfferRetryBilling = canRetryBilling && !billingNeedsSetup && (
      outcome.billing?.status === 'failed_external_billing'
      || outcome.billing?.status === 'pending_external_billing'
      || ((outcome.billing?.status === 'already_exists' || outcome.billing?.status === 'completed_with_billing') && !hasChargePresentation)
    );
    const retryBillingLabel = hasChargePresentation
      ? 'Sincronizar cobrança novamente'
      : outcome.billing?.status === 'failed_external_billing'
        ? 'Tentar gerar cobrança novamente'
        : 'Sincronizar cobrança com Asaas';
    const paymentLinkMissingMessage = effectiveMethod === 'pix'
      ? 'O QR Code e o código PIX ainda não foram liberados pelo Asaas. Sincronize a cobrança ou acompanhe o Financeiro antes de enviar ao aluno.'
      : effectiveMethod === 'boleto'
        ? 'O boleto ainda não foi materializado pelo Asaas. Sincronize a cobrança ou acompanhe o Financeiro antes de enviar ao aluno.'
        : 'O link de pagamento ainda não está disponível. Acompanhe a cobrança em Financeiro.';
    const accessEmail = studentAccess?.email || session.collectedData.identification?.email || '';
    const accessMailto = studentAccess?.setupUrl && accessEmail
      ? `mailto:${accessEmail}?subject=${encodeURIComponent('Acesso ao portal do aluno')}&body=${encodeURIComponent(`Olá!\n\nUse este link para definir sua senha e acessar o portal do aluno:\n${studentAccess.setupUrl}\n\nSe precisar, responda esta mensagem para receber suporte.`)}`
      : null;

    const handleCopyBillingValue = async (value: string, field: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedBillingField(field);
      } catch {
        setCopiedBillingField(null);
      }
    };

    const handleCopyStudentLink = async () => {
      if (!studentAccess?.setupUrl) return;

      try {
        await navigator.clipboard.writeText(studentAccess.setupUrl);
        setCopiedStudentLink(true);
      } catch {
        setCopiedStudentLink(false);
      }
    };

    const handleRetryBilling = async () => {
      if (!onRetryBilling || !outcome.activation?.subscriptionId || !outcome.activation?.paymentId) {
        return;
      }

      setIsRetryingBilling(true);
      setBillingActionError(null);

      try {
        const retryResult = await onRetryBilling({
          subscriptionId: outcome.activation.subscriptionId,
          paymentId: outcome.activation.paymentId,
          chargeId: outcome.billing?.asaasChargeId ?? null,
        });

        if (retryResult.error) {
          setBillingActionError(retryResult.error);
        }

        setOutcome((current) => {
          if (!current) return current;

          return {
            ...current,
            billing: retryResult.billing ?? current.billing,
            payment: retryResult.payment ?? current.payment,
          };
        });
      } catch (retryError) {
        setBillingActionError(
          retryError instanceof Error ? retryError.message : 'Não foi possível sincronizar a cobrança agora.',
        );
      } finally {
        setIsRetryingBilling(false);
      }
    };

    const handleRetryStudentAccess = async () => {
      if (!onRetryStudentAccess) {
        return;
      }

      setIsRetryingStudentAccess(true);

      try {
        const nextStudentAccess = await onRetryStudentAccess();
        setCopiedStudentLink(false);
        setOutcome((current) => {
          if (!current) return current;
          return {
            ...current,
            studentAccess: nextStudentAccess,
          };
        });
      } finally {
        setIsRetryingStudentAccess(false);
      }
    };

    return (
      <div className="space-y-6 py-8">
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${heroColorVar}10` }}>
          <BillingStatusIcon type={completionState.icon} className="w-12 h-12" style={{ color: heroColorVar }} />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {completionState.title}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {completionState.description}
          </p>
        </div>

        {/* Billing status */}
        <Card className="p-4 text-left" style={{ borderColor: `${colorVar}40`, backgroundColor: `${colorVar}08` }}>
          <div className="flex items-start gap-3">
            <BillingStatusIcon
              type={billingConfig.icon}
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              // @ts-expect-error -- dynamic color
              style={{ color: colorVar }}
            />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {billingConfig.label}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {billingConfig.description}
              </p>
              {outcome.billing?.reason === 'NO_ASAAS_ACCOUNT' && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Configure uma conta Asaas em Configurações para ativar cobranças automáticas.
                </p>
              )}
              {outcome.billing?.reason === 'STUDENT_MISSING_CPF' && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  O CPF do aluno não foi informado. Complete o cadastro para ativar a cobrança.
                </p>
              )}
            </div>
          </div>
        </Card>

        {(shouldOfferRetryBilling || outcome.billing?.reason === 'NO_ASAAS_ACCOUNT' || outcome.billing?.reason === 'STUDENT_MISSING_CPF') && (
          <div className="flex flex-wrap gap-3">
            {shouldOfferRetryBilling && (
              <Button onClick={handleRetryBilling} disabled={isRetryingBilling}>
                {isRetryingBilling ? 'Sincronizando cobrança...' : retryBillingLabel}
              </Button>
            )}
            {outcome.billing?.reason === 'NO_ASAAS_ACCOUNT' && (
              <Button variant="outline" onClick={() => window.location.assign('/settings/integrations')}>
                Ir para Integrações
              </Button>
            )}
            {outcome.billing?.reason === 'STUDENT_MISSING_CPF' && (
              <Button variant="outline" onClick={onFinish}>
                Ir para Usuários
              </Button>
            )}
          </div>
        )}

        {billingActionError && (
          <Card className="p-4 border-[var(--status-alert)]/30 bg-[var(--status-alert)]/5">
            <p className="text-sm text-[var(--status-alert)]">{billingActionError}</p>
          </Card>
        )}

        {payment && (
          <Card className="p-5 text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Primeira cobrança registrada
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Esta é a cobrança que deve aparecer em Financeiro e no Command Center.
                </p>
              </div>
              <Badge
                variant={payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'destructive' : 'warning'}
                className="w-fit"
              >
                {PAYMENT_STATUS_LABELS[payment.status]}
              </Badge>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-[var(--text-tertiary)]">Valor</p>
                <p className="font-medium text-[var(--text-primary)]">{formatCurrency(payment.amount)}</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">Vencimento</p>
                <p className="font-medium text-[var(--text-primary)]">{formatDate(payment.dueDate)}</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">Forma de cobrança</p>
                <p className="font-medium text-[var(--text-primary)]">{PAYMENT_METHOD_LABELS[effectiveMethod] || effectiveMethod}</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">Origem externa</p>
                <p className="font-medium text-[var(--text-primary)]">{getExternalOriginLabel(payment, outcome.billing)}</p>
              </div>
            </div>

            {primaryPaymentLink ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => window.open(primaryPaymentLink, '_blank', 'noopener,noreferrer')}
                >
                  {payment?.method === 'pix'
                    ? 'Abrir cobrança PIX'
                    : payment?.bankSlipUrl || outcome.billing?.bankSlipUrl
                      ? 'Abrir boleto'
                      : 'Abrir cobrança'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyBillingValue(primaryPaymentLink, 'payment-link')}
                >
                  {copiedBillingField === 'payment-link' ? 'Link copiado' : 'Copiar link de pagamento'}
                </Button>
                {secondaryPaymentLink && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(secondaryPaymentLink, '_blank', 'noopener,noreferrer')}
                  >
                    Abrir fatura
                  </Button>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                {paymentLinkMissingMessage}
              </p>
            )}

            {(boletoDigitableLine || boletoBarCode) && (
              <div className="mt-4 grid gap-3">
                {boletoDigitableLine && (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-secondary)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)]">Linha digitável</p>
                    <p className="mt-1 break-all text-sm font-medium text-[var(--text-primary)]">{boletoDigitableLine}</p>
                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={() => handleCopyBillingValue(boletoDigitableLine, 'boleto-line')}>
                        {copiedBillingField === 'boleto-line' ? 'Linha copiada' : 'Copiar linha digitável'}
                      </Button>
                    </div>
                  </div>
                )}
                {boletoBarCode && (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-secondary)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)]">Código de barras</p>
                    <p className="mt-1 break-all text-sm font-medium text-[var(--text-primary)]">{boletoBarCode}</p>
                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={() => handleCopyBillingValue(boletoBarCode, 'boleto-barcode')}>
                        {copiedBillingField === 'boleto-barcode' ? 'Código copiado' : 'Copiar código de barras'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {pixCopyPaste && (
              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-secondary)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">PIX copia e cola</p>
                <p className="mt-1 break-all text-sm font-medium text-[var(--text-primary)]">{pixCopyPaste}</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button size="sm" variant="outline" onClick={() => handleCopyBillingValue(pixCopyPaste, 'pix-payload')}>
                    {copiedBillingField === 'pix-payload' ? 'PIX copiado' : 'Copiar código PIX'}
                  </Button>
                  {outcome.billing?.pixQrCodeExpirationDate && (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Expira em {formatDate(outcome.billing.pixQrCodeExpirationDate)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {qrCodeImage && (
              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-secondary)] p-4">
                <p className="text-xs text-[var(--text-tertiary)]">QR code PIX</p>
                <Image
                  src={`data:image/png;base64,${qrCodeImage}`}
                  alt="QR code PIX da cobrança"
                  width={176}
                  height={176}
                  unoptimized
                  className="mt-3 h-44 w-44 rounded-lg border border-[var(--border-subtle)] bg-white object-contain"
                />
              </div>
            )}
          </Card>
        )}

        <Card className="p-5 text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Acesso do aluno ao portal
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Envie o link abaixo para o aluno definir a senha e entrar na área dele sem depender da recepção.
              </p>
            </div>
            <Badge variant={studentAccess?.setupUrl ? 'success' : 'warning'} className="w-fit">
              {studentAccess?.setupUrl ? 'Link pronto' : 'Link pendente'}
            </Badge>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">E-mail do aluno</p>
              <p className="font-medium text-[var(--text-primary)]">{studentAccess?.email || session.collectedData.identification?.email || '-'}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Próximo passo</p>
              <p className="font-medium text-[var(--text-primary)]">
                {studentAccess?.setupUrl ? 'Enviar link de ativação' : 'Gerar ou reenviar link'}
              </p>
            </div>
          </div>

          {studentAccess?.setupUrl ? (
            <>
              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-secondary)] p-3 text-xs text-[var(--text-secondary)] break-all">
                {studentAccess.setupUrl}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleCopyStudentLink}>
                  {copiedStudentLink ? 'Link copiado' : 'Copiar link do aluno'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(studentAccess.setupUrl || '', '_blank', 'noopener,noreferrer')}
                >
                  Abrir link
                </Button>
                {accessMailto && (
                  <Button variant="outline" onClick={() => window.location.href = accessMailto}>
                    Abrir e-mail
                  </Button>
                )}
              </div>
              <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                Se o envio automático por e-mail ainda não estiver operacional, copie este link e envie por WhatsApp ou e-mail ao aluno.
              </p>
            </>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--status-alert)]">
                {studentAccess?.error || 'Não foi possível gerar o link seguro de acesso para o aluno.'}
              </p>
              {onRetryStudentAccess && (
                <Button variant="outline" onClick={handleRetryStudentAccess} disabled={isRetryingStudentAccess}>
                  {isRetryingStudentAccess ? 'Gerando link...' : 'Tentar gerar link novamente'}
                </Button>
              )}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => window.location.assign('/financial')}>
            Ir para Financeiro
          </Button>
          <Button onClick={onFinish} size="lg">
            Ir para Usuários
          </Button>
        </div>
      </div>
    );
  }

  // ─── Review state (default) ─────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Confirmar ativação
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Revise o resumo e confirme para finalizar o cadastro de {userName.split(' ')[0]}.
        </p>
      </div>

      {error && (
        <Card className="p-4 border-[var(--status-alert)]/30 bg-[var(--status-alert)]/5">
          <p className="text-sm text-[var(--status-alert)]">{error}</p>
        </Card>
      )}

      {/* Resumo do cadastro */}
      <Card className="p-6">
        <h3 className="font-medium text-[var(--text-primary)] mb-4">
          Resumo do cadastro
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">Nome</p>
              <p className="font-medium text-[var(--text-primary)]">{userName}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">E-mail</p>
              <p className="font-medium text-[var(--text-primary)]">
                {session.collectedData.identification?.email}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Plano</p>
              <p className="font-medium text-[var(--text-primary)]">{planName}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Valor</p>
              <p className="font-medium text-[var(--text-primary)]">
                {formatCurrency(planValue)}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Contrato</p>
              <p className="font-medium text-[var(--text-primary)]">
                {contractAccepted ? 'Aceito digitalmente' : 'Não aceito'}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Forma de pagamento</p>
              <p className="font-medium text-[var(--text-primary)]">
                {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Status da cobrança */}
      <Card className="p-4 border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5">
        <div className="flex items-start gap-3">
          <ClockIcon className="w-5 h-5 text-[var(--status-warning)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Primeira cobrança: Pendente
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              A cobrança de {formatCurrency(planValue)} será registrada com status pendente.
              O pagamento será processado conforme a forma de cobrança escolhida.
            </p>
          </div>
        </div>
      </Card>

      {/* O que acontece ao confirmar */}
      <Card className="p-6 bg-[var(--background-secondary)] border-none">
        <h3 className="font-medium text-[var(--text-primary)] mb-3">
          Ao confirmar:
        </h3>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[var(--status-positive)] flex-shrink-0" />
            Conta do aluno será criada
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[var(--status-positive)] flex-shrink-0" />
            Assinatura do plano {planName} será ativada
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[var(--status-positive)] flex-shrink-0" />
            Primeira cobrança será registrada
            <Badge variant="warning" className="text-xs ml-1">Pendente</Badge>
          </li>
          {contractAccepted && (
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-[var(--status-positive)] flex-shrink-0" />
              Aceite do contrato será registrado
            </li>
          )}
        </ul>
      </Card>

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleActivate} size="lg">
          Confirmar e ativar
        </Button>
      </div>
    </div>
  );
}
