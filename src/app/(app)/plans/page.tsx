'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Input, Button, Card, Badge, SkeletonTable } from '@/components/ui';
import {
  formatPrice,
  formatPlanUpdatedAt,
  getBillingCycleLabel,
  getPlans,
  getPlanStatusLabel,
  type Plan,
  type PlanStatus,
  type PlanAccessRules,
} from '@/lib/plans/plansService';

function getAccessSummary(rules: PlanAccessRules): string {
  const parts: string[] = [];
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  if (rules.allowedUnits?.length) parts.push(`${rules.allowedUnits.length} unidade(s)`);
  if (rules.allowedDays?.length) {
    if (rules.allowedDays.length === 5 && [1,2,3,4,5].every(d => rules.allowedDays!.includes(d))) {
      parts.push('Seg–Sex');
    } else {
      parts.push(rules.allowedDays.map(d => days[d]).join(', '));
    }
  }
  if (rules.allowedHours?.start || rules.allowedHours?.end) {
    parts.push(`${rules.allowedHours.start || '00:00'}–${rules.allowedHours.end || '23:59'}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Livre';
}

interface PlanCardProps {
  plan: Plan;
  onClick: () => void;
}

function PlanCard({ plan, onClick }: PlanCardProps) {
  const statusVariant = {
    active: 'success' as const,
    inactive: 'warning' as const,
  };

  return (
    <Card
      className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-[var(--element-primary)] group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--element-primary)] transition-colors">
            {plan.name}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
            {plan.description || 'Sem descrição cadastrada.'}
          </p>
        </div>
        <Badge variant={statusVariant[plan.status]}>
          {getPlanStatusLabel(plan.status)}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-sm mb-4">
        <span className="text-[var(--text-tertiary)]">{getBillingCycleLabel(plan.billingCycle)}</span>
        <span className="text-[var(--text-tertiary)]">•</span>
        <span className="text-[var(--text-tertiary)]">Atualizado em {formatPlanUpdatedAt(plan.updatedAt)}</span>
      </div>

      <div className="flex items-end justify-between pt-4 border-t border-[var(--divider-primary)]">
        <div>
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Preço base</p>
          <p className="text-xl font-bold text-[var(--element-primary)]">{formatPrice(plan.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Acesso</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {getAccessSummary(plan.accessRules)}
          </p>
        </div>
      </div>
    </Card>
  );
}

interface PlanRowProps {
  plan: Plan;
  onClick: () => void;
}

function PlanRow({ plan, onClick }: PlanRowProps) {
  const statusVariant = {
    active: 'success' as const,
    inactive: 'warning' as const,
  };

  return (
    <tr
      className="border-b border-[var(--divider-primary)] hover:bg-[var(--background-secondary)] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="py-4 px-4">
        <div>
          <span className="font-medium text-[var(--text-primary)]">{plan.name}</span>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-1">
            {plan.description || 'Sem descrição cadastrada.'}
          </p>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge variant={statusVariant[plan.status]}>
          {getPlanStatusLabel(plan.status)}
        </Badge>
      </td>
      <td className="py-4 px-4 text-[var(--text-secondary)]">{getBillingCycleLabel(plan.billingCycle)}</td>
      <td className="py-4 px-4 font-medium text-[var(--element-primary)]">{formatPrice(plan.price)}</td>
      <td className="py-4 px-4 text-[var(--text-secondary)]">{formatPlanUpdatedAt(plan.updatedAt)}</td>
    </tr>
  );
}

type ViewMode = 'cards' | 'table';
type SortOption = 'updatedAt' | 'name' | 'price';

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    let active = true;

    async function loadPlans() {
      setLoading(true);
      const data = await getPlans();

      if (active) {
        setPlans(data);
        setLoading(false);
      }
    }

    void loadPlans();

    return () => {
      active = false;
    };
  }, []);

  const filteredPlans = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    let result = plans.filter((plan) => {
      const matchesSearch =
        !normalizedQuery ||
        plan.name.toLowerCase().includes(normalizedQuery) ||
        plan.description.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'pt-BR');
      }

      if (sortBy === 'price') {
        return a.price - b.price;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [plans, searchQuery, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((plan) => plan.status === 'active').length;
    const inactive = plans.filter((plan) => plan.status === 'inactive').length;
    const averagePrice = total > 0 ? plans.reduce((acc, plan) => acc + plan.price, 0) / total : 0;

    return { total, active, inactive, averagePrice };
  }, [plans]);

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Header title="Planos" />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Total de Planos</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Planos Ativos</p>
            <p className="text-2xl font-bold text-[var(--status-positive)]">{stats.active}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Planos Inativos</p>
            <p className="text-2xl font-bold text-[var(--status-warning)]">{stats.inactive}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Preço Médio</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatPrice(stats.averagePrice)}</p>
          </Card>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-1 gap-4 items-center w-full lg:w-auto flex-col md:flex-row">
              <div className="flex-1 w-full max-w-md">
                <Input
                  placeholder="Buscar planos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PlanStatus | 'all')}
                className="h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm w-full md:w-auto"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm w-full md:w-auto"
              >
                <option value="updatedAt">Atualização recente</option>
                <option value="name">Nome A-Z</option>
                <option value="price">Menor preço</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex border border-[var(--border-default)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-[var(--element-primary)] text-white'
                      : 'bg-[var(--background-primary)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[var(--element-primary)] text-white'
                      : 'bg-[var(--background-primary)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  Tabela
                </button>
              </div>

              <Button onClick={() => router.push('/plans/new')}>
                + Novo Plano
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : filteredPlans.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-[var(--element-tertiary)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="font-medium text-[var(--text-primary)] mb-1">Nenhum plano encontrado</p>
            <p className="text-sm text-[var(--text-tertiary)] mb-4 max-w-sm mx-auto">Crie seu primeiro plano para começar a vender e ativar alunos.</p>
            <Button onClick={() => router.push('/plans/new')}>+ Novo Plano</Button>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onClick={() => router.push(`/plans/${plan.id}`)} />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--background-secondary)]">
                <tr className="border-b border-[var(--divider-primary)]">
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Nome</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Ciclo</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Preço</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Atualizado em</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <PlanRow key={plan.id} plan={plan} onClick={() => router.push(`/plans/${plan.id}`)} />
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
