'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Button, Card, Badge, SkeletonCard } from '@/components/ui';
import { usersContent } from '@/data/usersContent';
import { formatDate } from '@/lib/users';
import { getUserById, type User } from '@/lib/users/usersServiceSupabase';
import {
  generateStudentPortalAccessLink,
  isOperationalEmail,
} from '@/lib/students/studentPortalAccessService';
import {
  getPaymentsByStudent,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type Payment,
} from '@/lib/payments/paymentServiceSupabase';

interface Props {
  params: Promise<{ id: string }>;
}

function StatusBadgePill({
  label,
  status,
}: {
  label: string;
  status: User['operationalStatus']['registration'] | User['operationalStatus']['financial'] | User['operationalStatus']['access'];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-[var(--element-secondary)]">{label}</span>
      <Badge variant={status.tone}>{status.label}</Badge>
    </div>
  );
}

function paymentVariant(status: Payment['status']): 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'destructive';
    case 'refunded':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildStudentAccessMailto(email: string, setupUrl: string, studentName: string): string {
  const body = [
    `Olá, ${studentName}!`,
    '',
    'Use este link para definir sua senha e acessar o portal do aluno:',
    setupUrl,
    '',
    'Se precisar, responda esta mensagem para receber suporte.',
  ].join('\n');

  return `mailto:${email}?subject=${encodeURIComponent('Acesso ao portal do aluno')}&body=${encodeURIComponent(body)}`;
}

function LoadingState() {
  return (
    <div>
      <Header title={usersContent.detailTitle} />
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <SkeletonCard />
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    </div>
  );
}

export default function UserDetailPage({ params }: Props) {
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [accessLinkError, setAccessLinkError] = useState<string | null>(null);
  const [accessLinkExpiresAt, setAccessLinkExpiresAt] = useState<string | null>(null);
  const [isGeneratingAccessLink, setIsGeneratingAccessLink] = useState(false);
  const [copiedAccessLink, setCopiedAccessLink] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUserDetail() {
      setLoading(true);
      setAccessLink(null);
      setAccessLinkError(null);
      setAccessLinkExpiresAt(null);
      setCopiedAccessLink(false);

      try {
        const [userResult, paymentsResult] = await Promise.all([
          getUserById(id),
          getPaymentsByStudent(id),
        ]);

        if (cancelled) {
          return;
        }

        setUser(userResult);
        setPayments(paymentsResult);
      } catch (error) {
        if (!cancelled) {
          console.error('Erro ao carregar detalhe do aluno:', error);
          setUser(null);
          setPayments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUserDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div>
        <Header title={usersContent.detailTitle} />
        <div className="p-8">
          <Card className="p-8 text-center">
            <p className="text-sm text-[var(--element-secondary)]">Aluno não encontrado para a academia atual.</p>
            <div className="mt-4 flex justify-center">
              <Link href="/users">
                <Button>Voltar para Usuários</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const latestPayments = payments.slice(0, 6);
  const hasOperationalEmail = isOperationalEmail(user.email);
  const accessMailto = accessLink && hasOperationalEmail
    ? buildStudentAccessMailto(user.email, accessLink, user.fullName)
    : null;

  const handleGenerateAccessLink = async () => {
    setIsGeneratingAccessLink(true);
    setAccessLinkError(null);
    setCopiedAccessLink(false);

    try {
      const result = await generateStudentPortalAccessLink({
        unitId: user.unitId,
        email: user.email,
        recipientName: user.fullName,
        description: 'Acesso ao portal do aluno gerado pelo detalhe do aluno',
        expirationDays: 7,
      });

      if (!result.success || !result.setupUrl) {
        setAccessLink(null);
        setAccessLinkExpiresAt(null);
        setAccessLinkError(result.error || 'Não foi possível gerar o link de acesso agora.');
        return;
      }

      setAccessLink(result.setupUrl);
      setAccessLinkExpiresAt(result.expiresAt || null);
    } catch (error) {
      setAccessLink(null);
      setAccessLinkExpiresAt(null);
      setAccessLinkError(error instanceof Error ? error.message : 'Não foi possível gerar o link de acesso agora.');
    } finally {
      setIsGeneratingAccessLink(false);
    }
  };

  const handleCopyAccessLink = async () => {
    if (!accessLink) return;

    try {
      await navigator.clipboard.writeText(accessLink);
      setCopiedAccessLink(true);
    } catch {
      setCopiedAccessLink(false);
      setAccessLinkError('Não foi possível copiar automaticamente. Selecione e copie o link manualmente.');
    }
  };

  return (
    <div>
      <Header
        title={usersContent.detailTitle}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/users">
              <Button variant="outline">Voltar</Button>
            </Link>
            <Link href="/financial">
              <Button>Ir para Financeiro</Button>
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-[var(--element-primary)]">{user.fullName}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadgePill label="Cadastro" status={user.operationalStatus.registration} />
                  <StatusBadgePill label="Financeiro" status={user.operationalStatus.financial} />
                  <StatusBadgePill label="Acesso" status={user.operationalStatus.access} />
                </div>
              </div>
              <p className="mt-2 text-sm text-[var(--element-secondary)]">
                {user.registrationId || 'Sem matrícula'}
                {user.academyName ? ` • ${user.academyName}` : ''}
              </p>
              {user.statusReason && (
                <p className="mt-3 text-sm text-[var(--element-secondary)]">
                  Motivo do status: {user.statusReason}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--divider-primary)] bg-[var(--background-secondary)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--element-secondary)]">Plano atual</p>
                <p className="mt-1 text-sm font-medium text-[var(--element-primary)]">
                  {user.currentPlan?.name || 'Nenhum plano vinculado'}
                </p>
                <p className="mt-1 text-xs text-[var(--element-secondary)]">
                  {user.currentPlan?.expiresAt ? `Válido até ${formatDate(user.currentPlan.expiresAt)}` : 'Sem expiração registrada'}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--divider-primary)] bg-[var(--background-secondary)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--element-secondary)]">Cobranças</p>
                <p className="mt-1 text-sm font-medium text-[var(--element-primary)]">{payments.length}</p>
                <p className="mt-1 text-xs text-[var(--element-secondary)]">
                  {payments.length > 0 ? 'Registradas no Financeiro e Command Center' : 'Nenhuma cobrança registrada'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--element-secondary)]">Identificação</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-[var(--element-secondary)]">E-mail</dt>
                <dd className="font-medium text-[var(--element-primary)]">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Telefone</dt>
                <dd className="font-medium text-[var(--element-primary)]">{user.phone || '-'}</dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">CPF</dt>
                <dd className="font-medium text-[var(--element-primary)]">{user.document || '-'}</dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Unidade</dt>
                <dd className="font-medium text-[var(--element-primary)]">{user.unitName || 'Sem unidade'}</dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Origem</dt>
                <dd className="font-medium text-[var(--element-primary)]">
                  {usersContent.registrationOriginLabels[user.registrationOrigin] || user.registrationOrigin}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--element-secondary)]">Situação operacional</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-[var(--element-secondary)]">Situação cadastral</dt>
                <dd className="mt-1">
                  <Badge variant={user.operationalStatus.registration.tone}>
                    {user.operationalStatus.registration.label}
                  </Badge>
                </dd>
                {user.operationalStatus.registration.detail && (
                  <p className="mt-2 text-xs text-[var(--element-secondary)]">{user.operationalStatus.registration.detail}</p>
                )}
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Situação financeira</dt>
                <dd className="mt-1">
                  <Badge variant={user.operationalStatus.financial.tone}>
                    {user.operationalStatus.financial.label}
                  </Badge>
                </dd>
                {user.operationalStatus.financial.detail && (
                  <p className="mt-2 text-xs text-[var(--element-secondary)]">{user.operationalStatus.financial.detail}</p>
                )}
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Situação de acesso</dt>
                <dd className="mt-1">
                  <Badge variant={user.operationalStatus.access.tone}>
                    {user.operationalStatus.access.label}
                  </Badge>
                </dd>
                {user.operationalStatus.access.detail && (
                  <p className="mt-2 text-xs text-[var(--element-secondary)]">{user.operationalStatus.access.detail}</p>
                )}
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Plano vinculado</dt>
                <dd className="font-medium text-[var(--element-primary)]">
                  {user.currentPlan?.name || 'Nenhum plano vinculado'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Unidade vinculada</dt>
                <dd className="font-medium text-[var(--element-primary)]">{user.unitName || 'Sem unidade'}</dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Desde</dt>
                <dd className="font-medium text-[var(--element-primary)]">{formatDate(user.statusSince)}</dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Criado em</dt>
                <dd className="font-medium text-[var(--element-primary)]">{formatDateTime(user.createdAt)}</dd>
              </div>
              {user.billingSnapshot && (
                <>
                  <div>
                    <dt className="text-[var(--element-secondary)]">Cobrança relevante</dt>
                    <dd className="font-medium text-[var(--element-primary)]">{formatCurrency(user.billingSnapshot.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--element-secondary)]">Vencimento relevante</dt>
                    <dd className="font-medium text-[var(--element-primary)]">{formatDate(user.billingSnapshot.dueDate)}</dd>
                  </div>
                </>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--element-secondary)]">Contrato e aceite</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-[var(--element-secondary)]">Aceite</dt>
                <dd className="mt-1">
                  <Badge variant={user.contractAcceptance ? 'success' : 'secondary'}>
                    {user.contractAcceptance ? 'Aceite registrado' : 'Sem aceite registrado'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Data do aceite</dt>
                <dd className="font-medium text-[var(--element-primary)]">
                  {user.contractAcceptance ? formatDateTime(user.contractAcceptance.acceptedAt) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Versão dos termos</dt>
                <dd className="font-medium text-[var(--element-primary)]">{user.contractAcceptance?.termsVersion || '-'}</dd>
              </div>
              <div>
                <dt className="text-[var(--element-secondary)]">Template</dt>
                <dd className="font-medium text-[var(--element-primary)]">{user.contractAcceptance?.templateId || '-'}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--element-secondary)]">
                  Acesso ao portal do aluno
                </h3>
                <Badge variant={accessLink ? 'success' : 'secondary'}>
                  {accessLink ? 'Link gerado' : 'Sem link ativo nesta tela'}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--element-secondary)]">
                Gere um link seguro para o aluno definir ou redefinir a senha do portal. A senha nunca é exibida para a equipe.
              </p>
              <p className="mt-3 text-sm text-[var(--element-secondary)]">
                E-mail: <span className="font-medium text-[var(--element-primary)]">{user.email || '-'}</span>
              </p>
              {!hasOperationalEmail && (
                <p className="mt-2 text-xs text-[var(--status-alert)]">
                  O e-mail do aluno não está válido para envio. Ajuste o cadastro antes de gerar um novo link.
                </p>
              )}
            </div>

            <Button
              onClick={handleGenerateAccessLink}
              disabled={isGeneratingAccessLink || !hasOperationalEmail}
            >
              {isGeneratingAccessLink ? 'Gerando link...' : accessLink ? 'Reenviar acesso' : 'Gerar link de acesso'}
            </Button>
          </div>

          {accessLink && (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-[var(--divider-primary)] bg-[var(--background-secondary)] p-3">
                <p className="break-all text-xs leading-5 text-[var(--element-secondary)]">{accessLink}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button variant="outline" onClick={handleCopyAccessLink}>
                  {copiedAccessLink ? 'Link copiado' : 'Copiar link'}
                </Button>
                {accessMailto && (
                  <Button variant="outline" onClick={() => window.location.href = accessMailto}>
                    Enviar por e-mail
                  </Button>
                )}
                {accessLinkExpiresAt && (
                  <p className="text-xs text-[var(--element-secondary)]">
                    Válido até {formatDateTime(accessLinkExpiresAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {accessLinkError && (
            <p className="mt-4 text-sm text-[var(--status-alert)]">{accessLinkError}</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--element-secondary)]">Cobranças do aluno</h3>
              <p className="mt-1 text-sm text-[var(--element-secondary)]">
                Pagamentos reais registrados para este aluno.
              </p>
            </div>
          </div>

          {latestPayments.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--divider-primary)] p-6 text-sm text-[var(--element-secondary)]">
              Nenhuma cobrança foi registrada para este aluno até agora.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {latestPayments.map((payment) => {
                const paymentLink = payment.bankSlipUrl || payment.invoiceUrl;

                return (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-4 rounded-xl border border-[var(--divider-primary)] bg-[var(--background-secondary)] p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[var(--element-primary)]">
                          {formatCurrency(payment.amount)}
                        </p>
                        <Badge variant={paymentVariant(payment.status)}>
                          {PAYMENT_STATUS_LABELS[payment.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--element-secondary)]">
                        {PAYMENT_METHOD_LABELS[payment.method] || payment.method} • vencimento {formatDate(payment.dueDate)}
                      </p>
                      <p className="text-xs text-[var(--element-secondary)]">
                        {payment.chargeOrigin === 'recurring'
                          ? 'Cobrança de assinatura recorrente'
                          : payment.chargeOrigin === 'asaas'
                            ? 'Cobrança gerenciada pelo Asaas'
                            : 'Cobrança local'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/financial/cobranca/${payment.id}`}>
                        <Button variant="outline">Abrir cobrança</Button>
                      </Link>
                      {paymentLink && (
                        <Button
                          onClick={() => window.open(paymentLink, '_blank', 'noopener,noreferrer')}
                        >
                          Abrir link de pagamento
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
