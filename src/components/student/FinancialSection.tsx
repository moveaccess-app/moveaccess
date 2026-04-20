'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { AlertTriangle, DollarSign, ExternalLink, CreditCard, Clock } from 'lucide-react';
import type { StudentPortalPayment, StudentPortalDelinquency } from '@/lib/student/studentPortalService';

// ─── Status helpers ──────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Estornado',
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function isOverdue(payment: StudentPortalPayment): boolean {
  return payment.status === 'pending' && new Date(payment.dueDate) < new Date();
}

// ─── Delinquency Banner ─────────────────────────────────────────

function DelinquencyBanner({ delinquency }: { delinquency: StudentPortalDelinquency }) {
  if (!delinquency.isDelinquent) return null;

  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ backgroundColor: 'var(--status-negative-background)' }}
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-negative)' }} />
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--status-negative)' }}>
          Pagamento em atraso
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--element-secondary)' }}>
          {delinquency.overdueCount === 1
            ? `1 cobrança vencida — ${formatCurrency(delinquency.overdueTotal)}`
            : `${delinquency.overdueCount} cobranças vencidas — ${formatCurrency(delinquency.overdueTotal)}`}
          {delinquency.daysDelinquent > 0 && ` (há ${delinquency.daysDelinquent} dias)`}
        </p>
      </div>
    </div>
  );
}

// ─── Payment Row ─────────────────────────────────────────────────

function PaymentRow({ payment }: { payment: StudentPortalPayment }) {
  const overdue = isOverdue(payment);
  const methodLabel = payment.billingType
    ? METHOD_LABELS[payment.billingType] || payment.billingType
    : METHOD_LABELS[payment.method] || payment.method;

  const paymentLink = payment.invoiceUrl || payment.bankSlipUrl;

  return (
    <div
      className="flex items-center justify-between py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--divider-primary)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--element-primary)' }}>
            {formatCurrency(payment.amount)}
          </p>
          <Badge variant={overdue ? 'destructive' : STATUS_VARIANTS[payment.status] || 'secondary'}>
            {overdue ? 'Vencido' : STATUS_LABELS[payment.status] || payment.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
            {payment.status === 'paid' && payment.paidAt
              ? `Pago em ${formatDate(payment.paidAt)}`
              : `Vence em ${formatDate(payment.dueDate)}`}
          </p>
          {methodLabel && (
            <span className="text-xs" style={{ color: 'var(--element-disabled)' }}>
              · {methodLabel}
            </span>
          )}
        </div>
      </div>
      {paymentLink && payment.status === 'pending' && (
        <a
          href={paymentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-3 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: 'var(--status-info-background)',
            color: 'var(--status-info)',
          }}
        >
          Pagar
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

// ─── Main Section ────────────────────────────────────────────────

interface FinancialSectionProps {
  payments: StudentPortalPayment[];
  delinquency: StudentPortalDelinquency;
}

export function FinancialSection({ payments, delinquency }: FinancialSectionProps) {
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const hasPayments = payments.length > 0;

  return (
    <div className="space-y-3">
      <DelinquencyBanner delinquency={delinquency} />

      {/* Próximos vencimentos */}
      {pendingPayments.length > 0 && (
        <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: 'var(--status-alert)' }} />
              <CardTitle className="text-base font-bold">Próximos Vencimentos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {pendingPayments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Histórico de pagamentos */}
      <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" style={{ color: 'var(--status-positive)' }} />
            <CardTitle className="text-base font-bold">Histórico de Pagamentos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!hasPayments ? (
            <EmptyState icon={<CreditCard className="w-6 h-6" />} text="Nenhum pagamento registrado" />
          ) : paidPayments.length === 0 ? (
            <EmptyState icon={<CreditCard className="w-6 h-6" />} text="Nenhum pagamento realizado ainda" />
          ) : (
            paidPayments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="text-center py-6 rounded-xl"
      style={{ backgroundColor: 'var(--background-secondary)' }}
    >
      <div className="flex justify-center mb-2" style={{ color: 'var(--element-disabled)' }}>
        {icon}
      </div>
      <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
        {text}
      </p>
    </div>
  );
}
