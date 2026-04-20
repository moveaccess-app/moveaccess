'use client';

/**
 * Portal do Aluno — Premium v3
 *
 * Mobile-first dashboard with:
 * - Consolidated status header
 * - QR code card (hero)
 * - Access status card
 * - Next payment card
 * - Contract card
 * - History section
 *
 * Data sources: getStudentPortalData() RPC + CurrentUser profile
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Logo, Badge, Skeleton, SkeletonCard } from '@/components/ui';
import { useAuth, useRequireStudent } from '@/contexts/AuthContext';
import { StudentQRCode } from '@/components/student/StudentQRCode';
import { getCurrentInviteSignupSession } from '@/lib/invites';
import { getStudentPortalData, type StudentPortalData } from '@/lib/student/studentPortalService';
import {
  consolidatePortalStatus,
  formatCurrency,
  formatDateFull,
  daysUntilDate,
  type PortalStatus,
  type PortalStatusResult,
} from '@/lib/student/portalStatusConsolidator';
import {
  LogOut,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
  Activity,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  Calendar,
  DollarSign,
  Info,
} from 'lucide-react';

// ─── Status visual config ────────────────────────────────────────

const STATUS_CONFIG: Record<PortalStatus, {
  gradient: string;
  icon: React.ReactNode;
  badgeVariant: 'success' | 'warning' | 'destructive';
  badgeLabel: string;
}> = {
  active: {
    gradient: 'linear-gradient(135deg, #059669 0%, #0ea5e9 100%)',
    icon: <ShieldCheck className="w-6 h-6 text-white" />,
    badgeVariant: 'success',
    badgeLabel: 'Ativo',
  },
  attention: {
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    icon: <ShieldAlert className="w-6 h-6 text-white" />,
    badgeVariant: 'warning',
    badgeLabel: 'Atenção',
  },
  blocked: {
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    icon: <ShieldX className="w-6 h-6 text-white" />,
    badgeVariant: 'destructive',
    badgeLabel: 'Bloqueado',
  },
};

// ─── Payment helpers ─────────────────────────────────────────────

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Estornado',
};

const PAYMENT_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  paid: 'success',
  failed: 'destructive',
  refunded: 'secondary',
};

const METHOD_LABELS: Record<string, string> = {
  manual: 'Manual',
  pix: 'PIX',
  card: 'Cartão',
  boleto: 'Boleto',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão',
  PIX: 'PIX',
  UNDEFINED: '',
};

const ACCESS_EVENT_LABELS: Record<string, string> = {
  entry: 'Entrada',
  exit: 'Saída',
};

// ─── Main Page ───────────────────────────────────────────────────

export default function StudentPortalPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { isLoading: authLoading, isAuthorized } = useRequireStudent();
  const [hasPendingSignup, setHasPendingSignup] = useState(false);
  const [portalData, setPortalData] = useState<StudentPortalData | null>(null);
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [contractExpanded, setContractExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Check for pending signup
  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    let mounted = true;
    const check = async () => {
      const result = await getCurrentInviteSignupSession();
      if (mounted) setHasPendingSignup(result.success);
    };
    void check();
    return () => { mounted = false; };
  }, [authLoading, isAuthorized]);

  // Load portal data
  useEffect(() => {
    if (authLoading || !isAuthorized || !currentUser) return;
    let mounted = true;
    const academyId = currentUser.tenancy.academyIds[0];
    if (!academyId) {
      setPortalLoading(false);
      return;
    }
    const load = async () => {
      setPortalLoading(true);
      setPortalError(null);
      const { data, error } = await getStudentPortalData(academyId);
      if (!mounted) return;
      if (error) {
        setPortalError(error);
        setPortalData(null);
      } else {
        setPortalData(data);
      }
      setPortalLoading(false);
    };
    void load();
    return () => { mounted = false; };
  }, [authLoading, isAuthorized, currentUser]);

  // Consolidated status
  const portalStatus = useMemo<PortalStatusResult | null>(() => {
    if (!portalData || !currentUser) return null;
    return consolidatePortalStatus(portalData, currentUser.profile);
  }, [portalData, currentUser]);

  const scrollToQR = () => {
    qrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ─── Loading state ─────────────────────────────────────────

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin" style={{ color: 'var(--element-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  const studentName = currentUser?.profile.name || 'Aluno';
  const planName = currentUser?.profile.planName;
  const isPlanActive = currentUser?.profile.planStatus === 'active';
  const statusConfig = portalStatus ? STATUS_CONFIG[portalStatus.status] : STATUS_CONFIG.active;

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: 'var(--background-secondary)' }}>
      {/* ═══ HEADER ═══ */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: portalStatus ? statusConfig.gradient : STATUS_CONFIG.active.gradient }}
        />
        <div className="px-4 pt-4 pb-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <Logo variant="wordmark" className="scale-90 brightness-0 invert" />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white/90 hover:bg-white/20 hover:text-white gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>

          {/* Student info */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
            >
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg text-white truncate">{studentName}</p>
              {planName && (
                <p className="text-sm text-white/80 truncate">{planName}</p>
              )}
            </div>
            {portalStatus && (
              <Badge variant={statusConfig.badgeVariant} className="flex-shrink-0">
                {statusConfig.badgeLabel}
              </Badge>
            )}
          </div>

          {/* Status message */}
          {portalStatus && (
            <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{statusConfig.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">{portalStatus.title}</p>
                  <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{portalStatus.subtitle}</p>
                </div>
              </div>
              {portalStatus.ctaLabel && portalStatus.status !== 'active' && (
                <button
                  onClick={() => {
                    if (portalStatus.ctaAction === 'pay' && portalStatus.nextPayment) {
                      const link = portalStatus.nextPayment.invoiceUrl || portalStatus.nextPayment.bankSlipUrl;
                      if (link) window.open(link, '_blank');
                    } else if (portalStatus.ctaAction === 'qr') {
                      scrollToQR();
                    }
                  }}
                  className="mt-3 w-full py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: '#1f2937' }}
                >
                  {portalStatus.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <main className="px-4 max-w-lg mx-auto -mt-3 space-y-4">
        {/* Pending signup banner */}
        {hasPendingSignup && (
          <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--status-alert-background)' }}>
                  <Info className="w-5 h-5" style={{ color: 'var(--status-alert)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--element-primary)' }}>
                    Cadastro pendente
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--element-secondary)' }}>
                    Finalize seus dados para concluir a adesão.
                  </p>
                  <Button size="sm" onClick={() => router.push('/cadastro/continuar')} className="mt-2 gap-1.5">
                    Continuar cadastro <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── QR CODE CARD ─── */}
        <div ref={qrRef}>
          <Card className="shadow-lg border-0 overflow-hidden" style={{ backgroundColor: 'var(--background-primary)' }}>
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-5 h-5" style={{ color: 'var(--status-info)' }} />
                <h2 className="font-bold text-base" style={{ color: 'var(--element-primary)' }}>
                  QR Code de Acesso
                </h2>
              </div>
              {isPlanActive ? (
                <StudentQRCode studentName={studentName} />
              ) : (
                <div className="text-center py-8 px-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: 'var(--status-negative-background)' }}
                  >
                    <XCircle className="w-8 h-8" style={{ color: 'var(--status-negative)' }} />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--element-primary)' }}>
                    QR indisponível
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--element-secondary)' }}>
                    {portalStatus?.status === 'blocked'
                      ? 'Resolva a pendência abaixo para liberar seu acesso.'
                      : 'Seu plano não está ativo. Entre em contato com a academia.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── PORTAL DATA SECTIONS ─── */}
        {portalLoading ? (
          <PortalSkeleton />
        ) : portalError ? (
          <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
            <CardContent className="py-6 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--status-negative)' }} />
              <p className="font-medium text-sm" style={{ color: 'var(--element-primary)' }}>
                Erro ao carregar dados
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--element-secondary)' }}>
                {portalError}
              </p>
            </CardContent>
          </Card>
        ) : portalData ? (
          <>
            {/* ─── ACCESS STATUS CARD ─── */}
            {portalStatus && portalStatus.status === 'blocked' && (
              <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldX className="w-5 h-5" style={{ color: 'var(--status-negative)' }} />
                    <h2 className="font-bold text-base" style={{ color: 'var(--element-primary)' }}>
                      Situação do Acesso
                    </h2>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--status-negative-background)' }}
                  >
                    <p className="font-semibold text-sm" style={{ color: 'var(--status-negative)' }}>
                      {portalStatus.title}
                    </p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--element-secondary)' }}>
                      {getBlockExplanation(portalStatus)}
                    </p>
                  </div>

                  {portalStatus.dominantReason === 'delinquent' && portalData.delinquency.isDelinquent && (
                    <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--element-secondary)' }}>
                      <span>
                        {portalData.delinquency.overdueCount} cobrança(s) vencida(s)
                        {portalData.delinquency.daysDelinquent > 0 && ` · há ${portalData.delinquency.daysDelinquent} dias`}
                      </span>
                      <span className="font-semibold" style={{ color: 'var(--status-negative)' }}>
                        {formatCurrency(portalData.delinquency.overdueTotal)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ─── NEXT PAYMENT CARD ─── */}
            <NextPaymentCard portalStatus={portalStatus} portalData={portalData} />

            {/* ─── PLAN CARD ─── */}
            {portalData.subscription && (
              <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5" style={{ color: 'var(--status-info)' }} />
                    <h2 className="font-bold text-base" style={{ color: 'var(--element-primary)' }}>
                      Seu Plano
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: 'var(--element-primary)' }}>
                        {portalData.subscription.planName}
                      </span>
                      <Badge variant={portalData.subscription.status === 'active' ? 'success' : 'secondary'}>
                        {portalData.subscription.status === 'active' ? 'Ativo' : portalData.subscription.status === 'cancelled' ? 'Cancelado' : portalData.subscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--element-secondary)' }}>
                      <span>Valor mensal</span>
                      <span className="font-medium" style={{ color: 'var(--element-primary)' }}>
                        {formatCurrency(portalData.subscription.price)}
                      </span>
                    </div>
                    {portalData.subscription.expiresAt && (
                      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--element-secondary)' }}>
                        <span>{daysUntilDate(portalData.subscription.expiresAt) >= 0 ? 'Válido até' : 'Expirou em'}</span>
                        <span
                          className="font-medium"
                          style={{
                            color: daysUntilDate(portalData.subscription.expiresAt) >= 0
                              ? 'var(--status-positive)'
                              : 'var(--status-negative)',
                          }}
                        >
                          {formatDateFull(portalData.subscription.expiresAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── CONTRACT CARD ─── */}
            <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5" style={{ color: portalData.contract ? 'var(--status-positive)' : 'var(--element-disabled)' }} />
                  <h2 className="font-bold text-base" style={{ color: 'var(--element-primary)' }}>
                    Contrato
                  </h2>
                </div>
                {portalData.contract ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {portalData.contract.templateName && (
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--element-primary)' }}>
                            {portalData.contract.templateName}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                          Aceito em {formatDateFull(portalData.contract.acceptedAt)}
                          {portalData.contract.templateVersion && ` · v${portalData.contract.templateVersion}`}
                        </p>
                      </div>
                      <Badge variant="success">Aceito</Badge>
                    </div>

                    {portalData.contract.contentSnapshot && (
                      <>
                        <button
                          onClick={() => setContractExpanded(!contractExpanded)}
                          className="flex items-center gap-1 text-xs font-medium"
                          style={{ color: 'var(--status-info)' }}
                        >
                          {contractExpanded ? (
                            <>Ocultar contrato <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Ver contrato completo <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>

                        {contractExpanded && (
                          <div
                            className="p-4 rounded-xl text-xs leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
                            style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--element-secondary)' }}
                          >
                            {portalData.contract.contentSnapshot}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--element-disabled)' }} />
                    <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
                      Nenhum contrato aceito
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── FINANCIAL HISTORY ─── */}
            <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" style={{ color: 'var(--status-positive)' }} />
                    <h2 className="font-bold text-base" style={{ color: 'var(--element-primary)' }}>
                      Pagamentos
                    </h2>
                  </div>
                  {portalData.payments.length > 0 && (
                    <span className="text-xs" style={{ color: 'var(--element-disabled)' }}>
                      {portalData.payments.length} registro(s)
                    </span>
                  )}
                </div>
                {portalData.payments.length === 0 ? (
                  <div className="text-center py-4 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <CreditCard className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--element-disabled)' }} />
                    <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
                      Nenhum pagamento registrado
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Show first 5, expand for more */}
                    {portalData.payments
                      .slice(0, historyExpanded ? undefined : 5)
                      .map((payment) => {
                        const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();
                        const methodLabel = payment.billingType
                          ? METHOD_LABELS[payment.billingType] || payment.billingType
                          : METHOD_LABELS[payment.method] || payment.method;
                        const paymentLink = payment.invoiceUrl || payment.bankSlipUrl;

                        return (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between py-3 border-b last:border-b-0"
                            style={{ borderColor: 'var(--divider-primary)' }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium" style={{ color: 'var(--element-primary)' }}>
                                  {formatCurrency(payment.amount)}
                                </span>
                                <Badge variant={isOverdue ? 'destructive' : PAYMENT_STATUS_VARIANTS[payment.status] || 'secondary'}>
                                  {isOverdue ? 'Vencido' : PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--element-secondary)' }}>
                                <span>
                                  {payment.status === 'paid' && payment.paidAt
                                    ? `Pago em ${formatDateFull(payment.paidAt)}`
                                    : `Vence em ${formatDateFull(payment.dueDate)}`}
                                </span>
                                {methodLabel && (
                                  <span style={{ color: 'var(--element-disabled)' }}>· {methodLabel}</span>
                                )}
                              </div>
                            </div>
                            {paymentLink && payment.status === 'pending' && (
                              <a
                                href={paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-3 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: 'var(--status-info-background)', color: 'var(--status-info)' }}
                              >
                                Pagar <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        );
                      })}

                    {portalData.payments.length > 5 && (
                      <button
                        onClick={() => setHistoryExpanded(!historyExpanded)}
                        className="w-full pt-3 flex items-center justify-center gap-1 text-xs font-medium"
                        style={{ color: 'var(--status-info)' }}
                      >
                        {historyExpanded ? (
                          <>Ver menos <ChevronUp className="w-3.5 h-3.5" /></>
                        ) : (
                          <>Ver todos ({portalData.payments.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── ACCESS HISTORY ─── */}
            <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5" style={{ color: 'var(--status-info)' }} />
                  <h2 className="font-bold text-base" style={{ color: 'var(--element-primary)' }}>
                    Últimos Acessos
                  </h2>
                </div>
                {portalData.accessLogs.length === 0 ? (
                  <div className="text-center py-4 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <Activity className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--element-disabled)' }} />
                    <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
                      Nenhum acesso registrado
                    </p>
                  </div>
                ) : (
                  <div>
                    {portalData.accessLogs.map((log) => {
                      const dt = new Date(log.occurredAt);
                      const date = dt.toLocaleDateString('pt-BR');
                      const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      const isAllowed = log.status === 'allowed';

                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between py-2.5 border-b last:border-b-0"
                          style={{ borderColor: 'var(--divider-primary)' }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isAllowed ? (
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--status-positive)' }} />
                            ) : (
                              <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--status-negative)' }} />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium truncate" style={{ color: 'var(--element-primary)' }}>
                                  {log.unitName || 'Unidade'}
                                </span>
                                {log.accessEvent && (
                                  <Badge variant={log.accessEvent === 'entry' ? 'success' : 'secondary'}>
                                    {ACCESS_EVENT_LABELS[log.accessEvent] || log.accessEvent}
                                  </Badge>
                                )}
                              </div>
                              {!isAllowed && (
                                <p className="text-xs" style={{ color: 'var(--status-negative)' }}>
                                  Acesso negado
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-xs font-medium" style={{ color: 'var(--element-primary)' }}>{time}</p>
                            <p className="text-xs" style={{ color: 'var(--element-disabled)' }}>{date}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs" style={{ color: 'var(--element-disabled)' }}>
            MoveAccess · Portal do Aluno
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function NextPaymentCard({
  portalStatus,
  portalData,
}: {
  portalStatus: PortalStatusResult | null;
  portalData: StudentPortalData;
}) {
  const payment = portalStatus?.nextPayment;

  if (!payment) {
    // No pending payments — show a positive message if there are paid payments
    if (portalData.payments.some((p) => p.status === 'paid')) {
      return (
        <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--status-positive-background)' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--status-positive)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--element-primary)' }}>
                  Tudo em dia
                </p>
                <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                  Não há cobranças pendentes no momento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  const isOverdue = new Date(payment.dueDate) < new Date();
  const daysLeft = daysUntilDate(payment.dueDate);
  const paymentLink = payment.invoiceUrl || payment.bankSlipUrl;
  const methodLabel = payment.billingType
    ? METHOD_LABELS[payment.billingType] || payment.billingType
    : METHOD_LABELS[payment.method] || payment.method;

  return (
    <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5" style={{ color: isOverdue ? 'var(--status-negative)' : 'var(--status-alert)' }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--element-primary)' }}>
            {isOverdue ? 'Cobrança vencida' : 'Próximo vencimento'}
          </h2>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold" style={{ color: 'var(--element-primary)' }}>
              {formatCurrency(payment.amount)}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant={isOverdue ? 'destructive' : 'warning'}>
                {isOverdue ? `Vencido há ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Vence hoje' : `Vence em ${daysLeft}d`}
              </Badge>
              {methodLabel && (
                <span className="text-xs" style={{ color: 'var(--element-disabled)' }}>
                  {methodLabel}
                </span>
              )}
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--element-secondary)' }}>
              Vencimento: {formatDateFull(payment.dueDate)}
            </p>
          </div>

          {paymentLink && (
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
              style={{ backgroundColor: 'var(--status-info)', color: 'white' }}
            >
              Pagar <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PortalSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonCard className="h-24" />
      <SkeletonCard className="h-32" />
      <SkeletonCard className="h-24" />
      <SkeletonCard className="h-36" />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function getBlockExplanation(status: PortalStatusResult): string {
  switch (status.dominantReason) {
    case 'delinquent':
      return 'Existe uma pendência financeira impedindo seu acesso. Regularize o pagamento para liberar a entrada na academia.';
    case 'subscription_expired':
      return 'Sua assinatura expirou. Entre em contato com a recepção da academia para renovar seu plano.';
    case 'subscription_inactive':
      return 'Sua assinatura está inativa. Procure a recepção da academia para mais informações.';
    case 'no_subscription':
      return 'Você não possui um plano ativo no momento. Procure a recepção para ativar um plano.';
    case 'plan_inactive':
      return 'Seu plano está inativo. Procure a recepção da academia para reativar.';
    default:
      return 'Seu acesso está temporariamente bloqueado. Entre em contato com a academia.';
  }
}
