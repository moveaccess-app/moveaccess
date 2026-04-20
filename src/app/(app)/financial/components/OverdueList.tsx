'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  formatCurrency,
  formatPaymentDate,
  getAsaasStatusLabel,
  getAsaasStatusVariant,
  getChargeOriginLabel,
  getChargeOriginVariant,
  getDaysOverdue,
  getOverduePayments,
  getPaymentLink,
  getPaymentMethodLabel,
  getReminderTemplate,
  type Payment,
} from '@/lib/payments/paymentService';

interface OverdueListProps {
  payments: Payment[];
  showValues?: boolean;
}

type FilterPeriod = 'all' | 'upTo30' | 'upTo60' | 'above60';

export function OverdueList({ payments, showValues = true }: OverdueListProps) {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('all');

  const overduePayments = useMemo(() => getOverduePayments(payments), [payments]);

  const filteredPayments = useMemo(() => {
    return overduePayments.filter((payment) => {
      const daysOverdue = getDaysOverdue(payment.dueDate);

      switch (selectedPeriod) {
        case 'upTo30':
          return daysOverdue <= 30;
        case 'upTo60':
          return daysOverdue > 30 && daysOverdue <= 60;
        case 'above60':
          return daysOverdue > 60;
        case 'all':
        default:
          return true;
      }
    });
  }, [overduePayments, selectedPeriod]);

  const totalOverdue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const handleCopy = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Não foi possível copiar o conteúdo.');
    }
  };

  const getSeverityStyles = (daysOverdue: number) => {
    if (daysOverdue <= 7) {
      return {
        border: 'border-l-[var(--status-alert)]',
        bg: 'bg-[var(--status-alert)]/5',
        badge: 'warning' as const,
      };
    }

    if (daysOverdue <= 30) {
      return {
        border: 'border-l-[var(--status-warning)]',
        bg: 'bg-[var(--status-warning)]/5',
        badge: 'warning' as const,
      };
    }

    return {
      border: 'border-l-[var(--status-negative)]',
      bg: 'bg-[var(--status-negative)]/5',
      badge: 'destructive' as const,
    };
  };

  const periodOptions: { value: FilterPeriod; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: overduePayments.length },
    { value: 'upTo30', label: 'Até 30d', count: overduePayments.filter((payment) => getDaysOverdue(payment.dueDate) <= 30).length },
    { value: 'upTo60', label: '31-60d', count: overduePayments.filter((payment) => getDaysOverdue(payment.dueDate) > 30 && getDaysOverdue(payment.dueDate) <= 60).length },
    { value: 'above60', label: '60+d', count: overduePayments.filter((payment) => getDaysOverdue(payment.dueDate) > 60).length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedPeriod === option.value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedPeriod(option.value)}
          >
            {option.label}
            <Badge variant="secondary" className="ml-2 text-xs min-w-[1.5rem] h-5">
              {option.count}
            </Badge>
          </Button>
        ))}
      </div>

      <Card className="p-4 bg-[var(--status-negative)]/5 border-[var(--status-negative)]/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-[var(--element-secondary)] mb-1">Total em atraso</div>
            <div className="text-2xl font-bold text-[var(--status-negative)]">
              {showValues ? formatCurrency(totalOverdue) : '••••••'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[var(--element-secondary)] mb-1">Cobranças</div>
            <div className="text-2xl font-bold text-[var(--element-primary)]">{filteredPayments.length}</div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {filteredPayments.map((payment) => {
          const daysOverdue = getDaysOverdue(payment.dueDate);
          const styles = getSeverityStyles(daysOverdue);
          const paymentLink = getPaymentLink(payment);

          return (
            <Card
              key={payment.id}
              className={`p-4 border-l-4 ${styles.border} ${styles.bg} hover:shadow-md transition-all cursor-pointer`}
              onClick={() => router.push(`/financial/cobranca/${payment.id}`)}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-[var(--element-primary)] truncate">{payment.student?.fullName || 'Aluno não encontrado'}</h3>
                      <Badge variant={styles.badge}>{daysOverdue}d atraso</Badge>                      <Badge variant={getChargeOriginVariant(payment.chargeOrigin)} className="text-[10px] px-1.5 py-0 leading-4">
                        {getChargeOriginLabel(payment.chargeOrigin)}
                      </Badge>                    </div>
                    <div className="text-sm text-[var(--element-secondary)]">
                      {payment.subscription?.planName || 'Assinatura sem plano'} • {payment.reference || 'Sem referência'}
                    </div>
                  </div>
                  <Badge variant="secondary">{getPaymentMethodLabel(payment.method)}</Badge>
                  {payment.isAsaasManaged && payment.asaasStatus && (
                    <Badge variant={getAsaasStatusVariant(payment.asaasStatus)} className="text-[10px] px-1.5 py-0 leading-4">
                      {getAsaasStatusLabel(payment.asaasStatus)}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Valor</div>
                    <div className="font-medium text-[var(--status-negative)]">
                      {showValues ? formatCurrency(payment.amount, payment.currency) : '•••••'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Vencimento</div>
                    <div className="font-medium text-[var(--element-primary)]">{formatPaymentDate(payment.dueDate)}</div>
                  </div>
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Matrícula</div>
                    <div className="font-medium text-[var(--element-primary)]">{payment.student?.registrationId || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--element-disabled)] mb-1">Assinatura</div>
                    <div className="font-medium text-[var(--element-primary)] truncate">{payment.subscription?.id.slice(0, 8) || '—'}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--divider-primary)]">
                  {paymentLink && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleCopy(paymentLink, 'Link de pagamento copiado.');
                      }}
                    >
                      Copiar link
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleCopy(getReminderTemplate(payment), 'Lembrete copiado.');
                    }}
                  >
                    Copiar lembrete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/financial/cobranca/${payment.id}`);
                    }}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredPayments.length === 0 && (
          <Card className="p-8 text-center">
            <div className="p-4 rounded-full bg-[var(--status-positive)]/10 w-fit mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-[var(--status-positive)]" />
            </div>
            <div className="text-[var(--element-primary)] font-medium mb-2">Nenhuma inadimplência encontrada</div>
            <div className="text-[var(--element-secondary)] text-sm">
              {selectedPeriod === 'all' ? 'Todos os pagamentos estão em dia.' : 'Não há cobranças em atraso neste período.'}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
