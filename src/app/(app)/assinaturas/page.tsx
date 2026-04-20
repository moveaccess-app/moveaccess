'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  formatPrice,
  formatSubscriptionDate,
  getBillingCycleLabel,
  getDaysRemaining,
  getSubscriptionStats,
  getSubscriptionStatusLabel,
  getSubscriptionStatusVariant,
  getSubscriptions,
  type Subscription,
  type SubscriptionStatus,
} from '@/lib/subscriptions/subscriptionService';

type ViewMode = 'table' | 'cards';
type SortOption = 'updatedAt' | 'student' | 'plan' | 'price' | 'expiresAt';

const STATUS_FILTERS: { value: SubscriptionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'paused', label: 'Pausadas' },
  { value: 'expired', label: 'Expiradas' },
  { value: 'cancelled', label: 'Canceladas' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'updatedAt', label: 'Atualizadas recentemente' },
  { value: 'student', label: 'Aluno' },
  { value: 'plan', label: 'Plano' },
  { value: 'price', label: 'Valor' },
  { value: 'expiresAt', label: 'Vencimento' },
];

export default function AssinaturasPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar assinaturas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const stats = useMemo(() => getSubscriptionStats(subscriptions), [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const result = subscriptions.filter((subscription) => {
      const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        subscription.student?.fullName,
        subscription.student?.document,
        subscription.student?.email,
        subscription.student?.registrationId,
        subscription.plan?.name,
        subscription.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    return result.sort((left, right) => {
      switch (sortBy) {
        case 'student':
          return (left.student?.fullName || '').localeCompare(right.student?.fullName || '');
        case 'plan':
          return (left.plan?.name || '').localeCompare(right.plan?.name || '');
        case 'price':
          return right.price - left.price;
        case 'expiresAt': {
          const leftValue = left.expiresAt ? new Date(left.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
          const rightValue = right.expiresAt ? new Date(right.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
          return leftValue - rightValue;
        }
        case 'updatedAt':
        default:
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }
    });
  }, [searchQuery, sortBy, statusFilter, subscriptions]);

  const renderExpirationBadge = (subscription: Subscription) => {
    if (subscription.status !== 'active' && subscription.status !== 'paused') {
      return null;
    }

    const daysRemaining = getDaysRemaining(subscription.expiresAt);

    if (daysRemaining === null || daysRemaining > 30) {
      return null;
    }

    if (daysRemaining < 0) {
      return <Badge variant="destructive">Vencida</Badge>;
    }

    return (
      <Badge variant={daysRemaining <= 7 ? 'destructive' : 'warning'}>
        {daysRemaining}d
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Assinaturas" />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-success)]">{stats.active}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Ativas</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-warning)]">{stats.paused}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Pausadas</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-error)]">{stats.expired}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Expiradas</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.cancelled}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Canceladas</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-brand)]">{formatPrice(stats.monthlyRevenue)}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Receita ativa</div>
          </Card>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[250px]">
                <Input
                  placeholder="Buscar por aluno, documento, email ou plano..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as SubscriptionStatus | 'all')}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 ${viewMode === 'table' ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'}`}
                  title="Visualização em tabela"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 ${viewMode === 'cards' ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'}`}
                  title="Visualização em cards"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              <Button variant="outline" onClick={loadSubscriptions}>
                Atualizar
              </Button>
              <Button onClick={() => router.push('/assinaturas/new')}>
                Nova Assinatura
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="p-4 mb-6 border border-[var(--color-error)] text-[var(--color-error)]">
            {error}
          </Card>
        )}

        <div className="text-sm text-[var(--color-text-secondary)] mb-4">
          {loading ? '\u00A0' : `${filteredSubscriptions.length} assinatura(s) encontrada(s)`}
        </div>

        {loading && <SkeletonTable rows={5} cols={5} />}

        {!loading && filteredSubscriptions.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Nenhuma assinatura encontrada
            </div>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Ajuste os filtros ou crie a primeira assinatura da sua academia.
            </p>
            <Button onClick={() => router.push('/assinaturas/new')}>Criar assinatura</Button>
          </Card>
        ) : null}

        {!loading && filteredSubscriptions.length > 0 && viewMode === 'table' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Aluno</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Plano</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Cobrança</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Início</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-primary)]">
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-[var(--color-bg-secondary)]">
                      <td className="px-4 py-4">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {subscription.student?.fullName || 'Aluno não encontrado'}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {subscription.student?.registrationId || subscription.student?.document || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {subscription.plan?.name || 'Plano não encontrado'}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {getBillingCycleLabel(subscription.billingCycle)} • {formatPrice(subscription.price)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getSubscriptionStatusVariant(subscription.status)}>
                            {getSubscriptionStatusLabel(subscription.status)}
                          </Badge>
                          {renderExpirationBadge(subscription)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[var(--color-text-primary)]">
                        {formatPrice(subscription.price)}
                      </td>
                      <td className="px-4 py-4 text-[var(--color-text-primary)]">
                        {formatSubscriptionDate(subscription.startedAt)}
                      </td>
                      <td className="px-4 py-4 text-[var(--color-text-primary)]">
                        {formatSubscriptionDate(subscription.expiresAt)}
                      </td>
                      <td className="px-4 py-4">
                        <Button variant="secondary" onClick={() => router.push(`/assinaturas/${subscription.id}`)}>
                          Ver detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!loading && filteredSubscriptions.length > 0 && viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {subscription.student?.fullName || 'Aluno não encontrado'}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {subscription.plan?.name || 'Plano não encontrado'}
                    </div>
                  </div>
                  <Badge variant={getSubscriptionStatusVariant(subscription.status)}>
                    {getSubscriptionStatusLabel(subscription.status)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--color-text-secondary)]">Cobrança</span>
                    <span className="text-[var(--color-text-primary)]">{formatPrice(subscription.price)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--color-text-secondary)]">Ciclo</span>
                    <span className="text-[var(--color-text-primary)]">{getBillingCycleLabel(subscription.billingCycle)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--color-text-secondary)]">Início</span>
                    <span className="text-[var(--color-text-primary)]">{formatSubscriptionDate(subscription.startedAt)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--color-text-secondary)]">Vencimento</span>
                    <span className="text-[var(--color-text-primary)]">{formatSubscriptionDate(subscription.expiresAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>{renderExpirationBadge(subscription)}</div>
                  <Button variant="secondary" onClick={() => router.push(`/assinaturas/${subscription.id}`)}>
                    Ver detalhes
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
