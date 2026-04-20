'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPaymentDate,
  getAsaasStatusLabel,
  getAsaasStatusVariant,
  getChargeOriginLabel,
  getChargeOriginVariant,
  getDaysOverdue,
  getDaysUntilDue,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
  type ChargeOrigin,
  type Payment,
  type PaymentStatus,
} from '@/lib/payments/paymentService';

type FilterStatus = 'all' | PaymentStatus;
type FilterOrigin = 'all' | ChargeOrigin;
type SortField = 'dueDate' | 'amount' | 'status';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'paid', label: 'Pagos' },
  { value: 'failed', label: 'Falhos' },
  { value: 'refunded', label: 'Estornados' },
];

const ORIGIN_FILTERS: { value: FilterOrigin; label: string }[] = [
  { value: 'all', label: 'Todas origens' },
  { value: 'local', label: 'Manual' },
  { value: 'asaas', label: 'Asaas' },
  { value: 'recurring', label: 'Recorrente' },
];

const ITEMS_PER_PAGE = 10;

export function ChargesList({ payments, showValues = true }: { payments: Payment[]; showValues?: boolean }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [originFilter, setOriginFilter] = useState<FilterOrigin>('all');
  const [sortBy, setSortBy] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = payments.filter((payment) => {
      if (statusFilter !== 'all' && payment.status !== statusFilter) {
        return false;
      }

      if (originFilter !== 'all' && payment.chargeOrigin !== originFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        payment.id,
        payment.student?.fullName,
        payment.student?.registrationId,
        payment.student?.document,
        payment.subscription?.planName,
        payment.reference,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    result.sort((left, right) => {
      let comparison = 0;

      switch (sortBy) {
        case 'amount':
          comparison = left.amount - right.amount;
          break;
        case 'status':
          comparison = left.status.localeCompare(right.status);
          break;
        case 'dueDate':
        default:
          comparison = new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [payments, searchTerm, statusFilter, originFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredPayments]);

  const totalValue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const { display: totalDisplay, full: totalFull } = formatCurrencyCompact(totalValue);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(field);
    setSortOrder('asc');
  };

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    }

    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };

  const renderDueDateInfo = (payment: Payment) => {
    if (payment.status === 'paid' || payment.status === 'refunded') {
      return null;
    }

    const overdueDays = getDaysOverdue(payment.dueDate);
    if (overdueDays > 0) {
      return <span className="text-xs text-[var(--status-negative)]">{overdueDays}d atraso</span>;
    }

    const daysUntilDue = getDaysUntilDue(payment.dueDate);
    if (daysUntilDue <= 7) {
      return <span className="text-xs text-[var(--status-alert)]">{daysUntilDue}d</span>;
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por aluno, plano, documento ou código..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            <div className="sm:hidden">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as FilterStatus);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <select
                value={originFilter}
                onChange={(event) => {
                  setOriginFilter(event.target.value as FilterOrigin);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
              >
                {ORIGIN_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden sm:flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'secondary'}
                size="sm"
                onClick={() => {
                  setStatusFilter(filter.value);
                  setCurrentPage(1);
                }}
              >
                {filter.label}
              </Button>
            ))}
            <span className="w-px bg-[var(--divider-primary)] mx-1" />
            {ORIGIN_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={originFilter === filter.value ? 'default' : 'secondary'}
                size="sm"
                onClick={() => {
                  setOriginFilter(filter.value);
                  setCurrentPage(1);
                }}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-[var(--background-tertiary)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm sticky left-0 bg-[var(--background-tertiary)] z-10">Aluno</th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">Plano</th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">Referência</th>
                <th className="text-right p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none" onClick={() => toggleSort('amount')}>
                  <span className="inline-flex items-center gap-1">Valor {renderSortIcon('amount')}</span>
                </th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none" onClick={() => toggleSort('dueDate')}>
                  <span className="inline-flex items-center gap-1">Vencimento {renderSortIcon('dueDate')}</span>
                </th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none" onClick={() => toggleSort('status')}>
                  <span className="inline-flex items-center gap-1">Status {renderSortIcon('status')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider-primary)]">
              {paginatedPayments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => router.push(`/financial/cobranca/${payment.id}`)}
                  className="hover:bg-[var(--background-tertiary)] cursor-pointer transition-colors"
                >
                  <td className="p-3 sticky left-0 bg-[var(--background-primary)] z-10">
                    <div className="font-medium text-[var(--element-primary)] text-sm truncate max-w-[220px]">
                      {payment.student?.fullName || 'Aluno não encontrado'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-[var(--element-disabled)]">{payment.student?.registrationId || payment.id}</span>
                      <Badge variant={getChargeOriginVariant(payment.chargeOrigin)} className="text-[10px] px-1.5 py-0 leading-4">
                        {getChargeOriginLabel(payment.chargeOrigin)}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3 text-[var(--element-secondary)] text-sm">
                    <span className="truncate max-w-[160px] block">{payment.subscription?.planName || 'Plano'}</span>
                  </td>
                  <td className="p-3 text-[var(--element-secondary)] text-sm">{payment.reference || '—'}</td>
                  <td className="p-3 text-right">
                    <div className="font-medium text-[var(--element-primary)] text-sm" title={showValues ? formatCurrency(payment.amount, payment.currency) : undefined}>
                      {showValues ? formatCurrencyCompact(payment.amount, payment.currency).display : '•••••'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--element-primary)] text-sm">{formatPaymentDate(payment.dueDate)}</span>
                      {renderDueDateInfo(payment)}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={getPaymentStatusVariant(payment.status)}>{getPaymentStatusLabel(payment.status)}</Badge>
                      {payment.isAsaasManaged && payment.asaasStatus && (
                        <Badge variant={getAsaasStatusVariant(payment.asaasStatus)} className="text-[10px]">
                          {getAsaasStatusLabel(payment.asaasStatus)}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="p-8 text-center">
            <div className="p-4 rounded-full bg-[var(--background-tertiary)] w-fit mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-[var(--element-disabled)]" />
            </div>
            <div className="text-[var(--element-primary)] font-medium">Nenhuma cobrança encontrada</div>
            <div className="text-[var(--element-disabled)] text-sm mt-1">
              {searchTerm || statusFilter !== 'all' ? 'Tente ajustar os filtros de busca.' : 'As cobranças aparecerão aqui quando criadas.'}
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
        <div className="text-[var(--element-secondary)]">
          {filteredPayments.length} cobrança(s) • Total:{' '}
          <strong className="text-[var(--element-primary)]" title={showValues ? totalFull : undefined}>
            {showValues ? totalDisplay : '•••••'}
          </strong>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-[var(--element-secondary)]">{currentPage} / {totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
