'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Calendar,
  CreditCard,
  Search,
  User,
  Repeat,
  Pause,
  XCircle,
  Clock,
  ArrowUpDown,
  TrendingUp,
} from 'lucide-react';
import {
  type Subscription,
  type SubscriptionStatus,
  type SubscriptionBillingCycle,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_VARIANTS,
  SUBSCRIPTION_BILLING_CYCLE_LABELS,
} from '@/lib/subscriptions/subscriptionService';
import { formatCurrency } from '@/lib/payments/paymentService';

// ─── Types ───────────────────────────────────────────────────────

type FilterStatus = 'all' | SubscriptionStatus;
type FilterCycle = 'all' | SubscriptionBillingCycle;
type SortField = 'student' | 'plan' | 'price' | 'status' | 'startedAt' | 'expiresAt';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativas' },
  { value: 'paused', label: 'Pausadas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'expired', label: 'Expiradas' },
];

const CYCLE_FILTERS: { value: FilterCycle; label: string }[] = [
  { value: 'all', label: 'Todos ciclos' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
  { value: 'custom', label: 'Personalizado' },
];

const ITEMS_PER_PAGE = 12;

// ─── Helpers ─────────────────────────────────────────────────────

function getStatusIcon(status: SubscriptionStatus) {
  switch (status) {
    case 'active':
      return <Repeat className="w-3.5 h-3.5" />;
    case 'paused':
      return <Pause className="w-3.5 h-3.5" />;
    case 'cancelled':
      return <XCircle className="w-3.5 h-3.5" />;
    case 'expired':
      return <Clock className="w-3.5 h-3.5" />;
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Stats ───────────────────────────────────────────────────────

interface SubscriptionStats {
  total: number;
  active: number;
  paused: number;
  cancelled: number;
  expired: number;
  mrr: number;
  averageTicket: number;
}

function computeStats(subscriptions: Subscription[]): SubscriptionStats {
  const active = subscriptions.filter((s) => s.status === 'active');
  const mrr = active.reduce((sum, s) => {
    if (s.billingCycle === 'yearly') return sum + s.price / 12;
    return sum + s.price;
  }, 0);

  return {
    total: subscriptions.length,
    active: active.length,
    paused: subscriptions.filter((s) => s.status === 'paused').length,
    cancelled: subscriptions.filter((s) => s.status === 'cancelled').length,
    expired: subscriptions.filter((s) => s.status === 'expired').length,
    mrr,
    averageTicket: active.length > 0 ? mrr / active.length : 0,
  };
}

// ─── Component ───────────────────────────────────────────────────

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  showValues?: boolean;
}

export function SubscriptionsList({ subscriptions, showValues = true }: SubscriptionsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [cycleFilter, setCycleFilter] = useState<FilterCycle>('all');
  const [sortBy, setSortBy] = useState<SortField>('student');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const resetPage = () => setCurrentPage(1);

  const stats = useMemo(() => computeStats(subscriptions), [subscriptions]);

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return subscriptions.filter((sub) => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (cycleFilter !== 'all' && sub.billingCycle !== cycleFilter) return false;

      if (search) {
        const haystack = [
          sub.student?.fullName,
          sub.student?.email,
          sub.student?.registrationId,
          sub.plan?.name,
          sub.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [subscriptions, statusFilter, cycleFilter, searchTerm]);

  const sorted = useMemo(() => {
    const copy = [...filtered];

    copy.sort((a, b) => {
      let cmp = 0;

      switch (sortBy) {
        case 'student':
          cmp = (a.student?.fullName || '').localeCompare(b.student?.fullName || '');
          break;
        case 'plan':
          cmp = (a.plan?.name || '').localeCompare(b.plan?.name || '');
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'startedAt':
          cmp = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
          break;
        case 'expiresAt':
          cmp = new Date(a.expiresAt || '9999').getTime() - new Date(b.expiresAt || '9999').getTime();
          break;
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return copy;
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    resetPage();
  };

  const SortableHeader = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th
      className={`p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] transition-colors select-none ${className}`}
      onClick={() => toggleSort(field)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortBy === field ? 'text-[var(--element-primary)]' : 'opacity-40'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-[var(--status-positive-background)]">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--status-positive)]" />
            </div>
            <p className="text-xs text-[var(--element-secondary)]">MRR Assinaturas</p>
          </div>
          <p className="text-lg font-bold text-[var(--element-primary)]">
            {showValues ? formatCurrency(stats.mrr) : '•••••'}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-[var(--status-info-background)]">
              <Repeat className="w-3.5 h-3.5 text-[var(--status-info)]" />
            </div>
            <p className="text-xs text-[var(--element-secondary)]">Ativas</p>
          </div>
          <p className="text-lg font-bold text-[var(--element-primary)]">{stats.active}</p>
          {stats.paused > 0 && (
            <p className="text-xs text-[var(--status-alert)]">{stats.paused} pausada(s)</p>
          )}
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-[var(--background-tertiary)]">
              <CreditCard className="w-3.5 h-3.5 text-[var(--element-secondary)]" />
            </div>
            <p className="text-xs text-[var(--element-secondary)]">Ticket Médio</p>
          </div>
          <p className="text-lg font-bold text-[var(--element-primary)]">
            {showValues ? formatCurrency(stats.averageTicket) : '•••••'}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-[var(--status-negative-background)]">
              <XCircle className="w-3.5 h-3.5 text-[var(--status-negative)]" />
            </div>
            <p className="text-xs text-[var(--element-secondary)]">Canceladas</p>
          </div>
          <p className="text-lg font-bold text-[var(--element-primary)]">{stats.cancelled}</p>
          {stats.expired > 0 && (
            <p className="text-xs text-[var(--element-disabled)]">{stats.expired} expirada(s)</p>
          )}
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--element-disabled)]" />
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
              placeholder="Buscar aluno, plano..."
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as FilterStatus); resetPage(); }}
            className="px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
          >
            {STATUS_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={cycleFilter}
            onChange={(e) => { setCycleFilter(e.target.value as FilterCycle); resetPage(); }}
            className="px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
          >
            {CYCLE_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      {sorted.length === 0 ? (
        <Card className="p-10 text-center">
          <Repeat className="w-8 h-8 mx-auto mb-3 text-[var(--element-disabled)]" />
          <p className="text-sm font-medium text-[var(--element-primary)]">Nenhuma assinatura encontrada</p>
          <p className="text-xs text-[var(--element-secondary)] mt-1">
            {subscriptions.length === 0
              ? 'As assinaturas aparecem aqui quando alunos são vinculados a planos.'
              : 'Tente ajustar os filtros.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-[var(--background-tertiary)]">
                <tr>
                  <SortableHeader field="student" className="text-left">Aluno</SortableHeader>
                  <SortableHeader field="plan" className="text-left">Plano</SortableHeader>
                  <SortableHeader field="price" className="text-right">Valor</SortableHeader>
                  <th className="p-3 font-medium text-[var(--element-secondary)] text-sm text-left">Ciclo</th>
                  <SortableHeader field="status" className="text-left">Status</SortableHeader>
                  <SortableHeader field="startedAt" className="text-left">Início</SortableHeader>
                  <SortableHeader field="expiresAt" className="text-left">Expira</SortableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider-primary)]">
                {paginated.map((sub) => {
                  const daysRemaining = getDaysRemaining(sub.expiresAt);
                  const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-[var(--background-tertiary)] transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-[var(--background-tertiary)]">
                            <User className="w-3.5 h-3.5 text-[var(--element-secondary)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--element-primary)] truncate">
                              {sub.student?.fullName || 'Aluno sem nome'}
                            </p>
                            <p className="text-xs text-[var(--element-disabled)] truncate">
                              {sub.student?.registrationId || sub.student?.email || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-[var(--element-primary)]">{sub.plan?.name || '—'}</p>
                      </td>
                      <td className="p-3 text-right">
                        <p className="text-sm font-medium text-[var(--element-primary)]">
                          {showValues ? formatCurrency(sub.price) : '•••••'}
                        </p>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {SUBSCRIPTION_BILLING_CYCLE_LABELS[sub.billingCycle] || sub.billingCycle}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={SUBSCRIPTION_STATUS_VARIANTS[sub.status]}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(sub.status)}
                            {SUBSCRIPTION_STATUS_LABELS[sub.status]}
                          </span>
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-sm text-[var(--element-primary)]">
                          <Calendar className="w-3.5 h-3.5 text-[var(--element-disabled)]" />
                          {formatDate(sub.startedAt)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-[var(--element-primary)]">
                          {formatDate(sub.expiresAt)}
                        </div>
                        {isExpiringSoon && (
                          <p className="text-xs text-[var(--status-alert)]">
                            {daysRemaining}d restante(s)
                          </p>
                        )}
                        {daysRemaining !== null && daysRemaining <= 0 && sub.status === 'active' && (
                          <p className="text-xs text-[var(--status-negative)]">Expirada</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--divider-primary)]">
              <p className="text-xs text-[var(--element-secondary)]">
                {sorted.length} assinatura(s) • Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
