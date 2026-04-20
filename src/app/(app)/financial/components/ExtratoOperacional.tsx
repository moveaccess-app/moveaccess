'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Repeat,
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
  getPaymentStatusLabel,
  getPaymentStatusVariant,
  type ChargeOrigin,
  type Payment,
  type PaymentStatus,
} from '@/lib/payments/paymentService';

// ─── Date helpers ────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMonthRange(offset = 0): { start: string; end: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return { start: toDateString(d), end: toDateString(end), label: label.charAt(0).toUpperCase() + label.slice(1) };
}

function buildQuickRanges() {
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(-1);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
  const last3Start = toDateString(new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1));

  return [
    { id: 'this-month', label: 'Este mês', start: thisMonth.start, end: thisMonth.end },
    { id: 'last-month', label: 'Mês anterior', start: lastMonth.start, end: lastMonth.end },
    { id: 'last-3', label: 'Últimos 3 meses', start: last3Start, end: toDateString(new Date()) },
  ] as const;
}

const QUICK_RANGES = buildQuickRanges();

// ─── Filters ─────────────────────────────────────────────────────

type FilterStatus = 'all' | PaymentStatus;
type FilterOrigin = 'all' | ChargeOrigin;
type FilterRecurrence = 'all' | 'recurring' | 'single';

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'paid', label: 'Pagos' },
  { value: 'failed', label: 'Falhos' },
  { value: 'refunded', label: 'Estornados' },
];

const ORIGIN_OPTIONS: { value: FilterOrigin; label: string }[] = [
  { value: 'all', label: 'Todas as origens' },
  { value: 'local', label: 'Manual' },
  { value: 'asaas', label: 'Asaas' },
  { value: 'recurring', label: 'Recorrente' },
];

const RECURRENCE_OPTIONS: { value: FilterRecurrence; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'recurring', label: 'Recorrentes' },
  { value: 'single', label: 'Avulsas' },
];

const ITEMS_PER_PAGE = 15;

// ─── Period summary ──────────────────────────────────────────────

interface PeriodSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  countTotal: number;
  countPaid: number;
  countPending: number;
  countOverdue: number;
  countRecurring: number;
  countAsaas: number;
}

function computePeriodSummary(payments: Payment[]): PeriodSummary {
  const now = new Date();
  let totalReceived = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let countPaid = 0;
  let countPending = 0;
  let countOverdue = 0;
  let countRecurring = 0;
  let countAsaas = 0;

  for (const p of payments) {
    if (p.status === 'paid') {
      totalReceived += p.amount;
      countPaid++;
    } else if (p.status === 'pending') {
      const dueDate = new Date(p.dueDate);
      if (dueDate < now) {
        totalOverdue += p.amount;
        countOverdue++;
      } else {
        totalPending += p.amount;
        countPending++;
      }
    }
    if (p.isRecurring) countRecurring++;
    if (p.isAsaasManaged) countAsaas++;
  }

  return {
    totalReceived,
    totalPending,
    totalOverdue,
    countTotal: payments.length,
    countPaid,
    countPending,
    countOverdue,
    countRecurring,
    countAsaas,
  };
}

// ─── Component ───────────────────────────────────────────────────

function exportToCsv(payments: Payment[]) {
  const header = ['Vencimento', 'Aluno', 'Matrícula', 'Plano', 'Valor', 'Status', 'Origem', 'Tipo', 'Pago em', 'Referência'];

  const rows = payments.map((p) => [
    formatPaymentDate(p.dueDate),
    p.student?.fullName || '',
    p.student?.registrationId || '',
    p.subscription?.planName || '',
    String(p.amount).replace('.', ','),
    getPaymentStatusLabel(p.status),
    getChargeOriginLabel(p.chargeOrigin),
    p.isRecurring ? 'Recorrente' : 'Avulsa',
    p.paidAt ? formatPaymentDate(p.paidAt) : '',
    p.reference || '',
  ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `extrato_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExtratoOperacional({ payments, showValues = true }: { payments: Payment[]; showValues?: boolean }) {
  const router = useRouter();
  const currentMonth = getMonthRange(0);

  // Filters
  const [dateFrom, setDateFrom] = useState(currentMonth.start);
  const [dateTo, setDateTo] = useState(currentMonth.end);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [originFilter, setOriginFilter] = useState<FilterOrigin>('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState<FilterRecurrence>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const resetPage = () => setCurrentPage(1);

  const applyQuickRange = (range: typeof QUICK_RANGES[number]) => {
    setDateFrom(range.start);
    setDateTo(range.end);
    resetPage();
  };

  // Filter payments by period and criteria
  const filteredPayments = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return payments.filter((p) => {
      // Date range filter on due_date
      const dueDate = new Date(p.dueDate);
      if (from && dueDate < from) return false;
      if (to && dueDate > to) return false;

      // Status
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // Origin
      if (originFilter !== 'all' && p.chargeOrigin !== originFilter) return false;

      // Recurrence
      if (recurrenceFilter === 'recurring' && !p.isRecurring) return false;
      if (recurrenceFilter === 'single' && p.isRecurring) return false;

      // Search
      if (normalizedSearch) {
        const haystack = [
          p.student?.fullName,
          p.student?.registrationId,
          p.student?.document,
          p.subscription?.planName,
          p.reference,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [payments, dateFrom, dateTo, statusFilter, originFilter, recurrenceFilter, searchTerm]);

  // Sort by due_date DESC (most recent first)
  const sortedPayments = useMemo(
    () => [...filteredPayments].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()),
    [filteredPayments],
  );

  const summary = useMemo(() => computePeriodSummary(sortedPayments), [sortedPayments]);

  const totalPages = Math.max(1, Math.ceil(sortedPayments.length / ITEMS_PER_PAGE));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, sortedPayments]);

  const activeFilterCount = [
    statusFilter !== 'all',
    originFilter !== 'all',
    recurrenceFilter !== 'all',
    searchTerm.trim().length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('all');
    setOriginFilter('all');
    setRecurrenceFilter('all');
    setSearchTerm('');
    resetPage();
  };

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--element-primary)]">Período</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {QUICK_RANGES.map((range) => (
                  <Button
                    key={range.id}
                    variant={dateFrom === range.start && dateTo === range.end ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => applyQuickRange(range)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
              {sortedPayments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCsv(sortedPayments)}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
              className="px-3 py-1.5 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
            />
            <span className="text-xs text-[var(--element-disabled)]">até</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
              className="px-3 py-1.5 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Period summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Recebido"
          value={summary.totalReceived}
          count={summary.countPaid}
          variant="success"
          showValues={showValues}
        />
        <SummaryCard
          label="Pendente"
          value={summary.totalPending}
          count={summary.countPending}
          variant="warning"
          showValues={showValues}
        />
        <SummaryCard
          label="Vencido"
          value={summary.totalOverdue}
          count={summary.countOverdue}
          variant="destructive"
          showValues={showValues}
        />
        <Card className="p-3">
          <p className="text-xs text-[var(--element-secondary)] mb-1">Composição</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--element-secondary)]">Total</span>
              <span className="font-medium text-[var(--element-primary)]">{summary.countTotal}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--element-secondary)]">Recorrentes</span>
              <span className="font-medium text-[var(--element-primary)]">{summary.countRecurring}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--element-secondary)]">Via Asaas</span>
              <span className="font-medium text-[var(--element-primary)]">{summary.countAsaas}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar aluno, plano, documento..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
              className="flex-1 px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm placeholder:text-[var(--element-disabled)]"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as FilterStatus); resetPage(); }}
              className="px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={originFilter}
              onChange={(e) => { setOriginFilter(e.target.value as FilterOrigin); resetPage(); }}
              className="px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
            >
              {ORIGIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={recurrenceFilter}
              onChange={(e) => { setRecurrenceFilter(e.target.value as FilterRecurrence); resetPage(); }}
              className="px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
            >
              {RECURRENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--element-secondary)]">
                {activeFilterCount} filtro(s) aplicado(s)
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Extrato table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-[var(--background-tertiary)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">Vencimento</th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">Aluno</th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">Plano</th>
                <th className="text-right p-3 font-medium text-[var(--element-secondary)] text-sm">Valor</th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">Status</th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">Origem</th>
                <th className="text-center p-3 font-medium text-[var(--element-secondary)] text-sm">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider-primary)]">
              {paginatedPayments.map((payment) => {
                const overdueDays = payment.status === 'pending' ? getDaysOverdue(payment.dueDate) : 0;
                const isOverdue = overdueDays > 0;

                return (
                  <tr
                    key={payment.id}
                    onClick={() => router.push(`/financial/cobranca/${payment.id}`)}
                    className="hover:bg-[var(--background-tertiary)] cursor-pointer transition-colors"
                  >
                    {/* Vencimento */}
                    <td className="p-3">
                      <div className="text-sm text-[var(--element-primary)]">
                        {formatPaymentDate(payment.dueDate)}
                      </div>
                      {isOverdue && (
                        <span className="text-xs text-[var(--status-negative)]">{overdueDays}d atraso</span>
                      )}
                      {payment.status === 'paid' && payment.paidAt && (
                        <span className="text-xs text-[var(--status-positive)]">
                          Pago {formatPaymentDate(payment.paidAt)}
                        </span>
                      )}
                    </td>

                    {/* Aluno */}
                    <td className="p-3">
                      <div className="text-sm font-medium text-[var(--element-primary)] truncate max-w-[180px]">
                        {payment.student?.fullName || 'Aluno'}
                      </div>
                      <div className="text-xs text-[var(--element-disabled)]">
                        {payment.student?.registrationId || '—'}
                      </div>
                    </td>

                    {/* Plano */}
                    <td className="p-3 text-sm text-[var(--element-secondary)] truncate max-w-[140px]">
                      {payment.subscription?.planName || '—'}
                    </td>

                    {/* Valor */}
                    <td className="p-3 text-right">
                      <span className="text-sm font-medium text-[var(--element-primary)]">
                        {showValues ? formatCurrency(payment.amount, payment.currency) : '•••••'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant={isOverdue ? 'destructive' : getPaymentStatusVariant(payment.status)}>
                          {isOverdue ? 'Vencido' : getPaymentStatusLabel(payment.status)}
                        </Badge>
                        {payment.isAsaasManaged && payment.asaasStatus && (
                          <Badge variant={getAsaasStatusVariant(payment.asaasStatus)} className="text-[10px]">
                            {getAsaasStatusLabel(payment.asaasStatus)}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Origem */}
                    <td className="p-3">
                      <Badge variant={getChargeOriginVariant(payment.chargeOrigin)} className="text-[10px]">
                        {getChargeOriginLabel(payment.chargeOrigin)}
                      </Badge>
                    </td>

                    {/* Recorrência */}
                    <td className="p-3 text-center">
                      {payment.isRecurring ? (
                        <span className="text-xs text-[var(--status-info)]" title="Cobrança recorrente">
                          <Repeat className="w-4 h-4 mx-auto" />
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--element-disabled)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {sortedPayments.length === 0 && (
          <div className="p-10 text-center">
            <div className="p-4 rounded-full bg-[var(--background-tertiary)] w-fit mx-auto mb-4">
              <FileText className="w-8 h-8 text-[var(--element-disabled)]" />
            </div>
            <p className="font-medium text-[var(--element-primary)]">Nenhuma cobrança no período</p>
            <p className="text-sm text-[var(--element-disabled)] mt-1">
              {activeFilterCount > 0
                ? 'Tente ajustar os filtros ou o período.'
                : 'Ajuste o período para ver cobranças.'}
            </p>
          </div>
        )}
      </Card>

      {/* Footer — count + pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
        <div className="text-[var(--element-secondary)]">
          {sortedPayments.length} cobrança(s) no período
          {showValues && sortedPayments.length > 0 && (
            <>
              {' '}• Total:{' '}
              <strong className="text-[var(--element-primary)]">
                {formatCurrencyCompact(sortedPayments.reduce((s, p) => s + p.amount, 0)).display}
              </strong>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-[var(--element-secondary)]">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Summary card helper ─────────────────────────────────────────

function SummaryCard({
  label,
  value,
  count,
  variant,
  showValues,
}: {
  label: string;
  value: number;
  count: number;
  variant: 'success' | 'warning' | 'destructive';
  showValues: boolean;
}) {
  const colors = {
    success: { text: 'text-[var(--status-positive)]', bg: 'bg-[var(--status-positive-background)]' },
    warning: { text: 'text-[var(--status-alert)]', bg: 'bg-[var(--status-alert-background)]' },
    destructive: { text: 'text-[var(--status-negative)]', bg: 'bg-[var(--status-negative-background)]' },
  };

  const { display, full } = formatCurrencyCompact(value);

  return (
    <Card className="p-3">
      <p className="text-xs text-[var(--element-secondary)] mb-1">{label}</p>
      <p className={`text-lg font-bold ${colors[variant].text} truncate`} title={showValues ? full : undefined}>
        {showValues ? display : '•••••'}
      </p>
      <p className="text-xs text-[var(--element-disabled)] mt-0.5">
        {count} cobrança{count !== 1 ? 's' : ''}
      </p>
    </Card>
  );
}
