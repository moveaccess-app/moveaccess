'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Input, Button, Card, Badge } from '@/components/ui';
import { 
  mockPlans, 
  searchPlans, 
  sortPlans,
  formatPrice,
  getLowestPrice,
  getPriceRange,
  type Plan,
  type PlanStatus,
  PLAN_STATUS_LABELS,
} from '@/mocks/plansMock';

// ============================================
// COMPONENTE DE CARD DE PLANO
// ============================================

interface PlanCardProps {
  plan: Plan;
  onClick: () => void;
}

function PlanCard({ plan, onClick }: PlanCardProps) {
  const statusVariant = {
    active: 'success' as const,
    inactive: 'warning' as const,
    draft: 'secondary' as const,
  };

  const lowestPrice = getLowestPrice(plan);

  return (
    <Card 
      className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-[var(--element-primary)] group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--element-primary)] transition-colors">
              {plan.name}
            </h3>
            {plan.onboardingBehavior.isPopular && (
              <Badge variant="default" className="text-xs">
                Popular
              </Badge>
            )}
            {plan.onboardingBehavior.isBestValue && (
              <Badge variant="secondary" className="text-xs">
                Melhor custo
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
            {plan.shortDescription || plan.description}
          </p>
        </div>
        <Badge variant={statusVariant[plan.status]}>
          {PLAN_STATUS_LABELS[plan.status]}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-sm mb-4">
        <span className="text-[var(--text-tertiary)]">{plan.category}</span>
        <span className="text-[var(--text-tertiary)]">•</span>
        <span className="text-[var(--text-tertiary)]">
          {plan.chargeType === 'recurring' ? 'Recorrente' : 'Avulso'}
        </span>
      </div>

      <div className="flex items-end justify-between pt-4 border-t border-[var(--divider-primary)]">
        <div>
          <p className="text-xs text-[var(--text-tertiary)] mb-1">A partir de</p>
          <p className="text-xl font-bold text-[var(--element-primary)]">
            {formatPrice(lowestPrice)}
            {plan.chargeType === 'recurring' && (
              <span className="text-sm font-normal text-[var(--text-tertiary)]">/mês</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Contratos ativos</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {plan.stats.activeContracts}
          </p>
        </div>
      </div>

      {plan.features.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--divider-primary)]">
          <div className="flex flex-wrap gap-1">
            {plan.features.slice(0, 4).map(feature => (
              <span 
                key={feature.id}
                className="text-xs px-2 py-1 bg-[var(--background-secondary)] text-[var(--text-secondary)] rounded"
              >
                {feature.name}
              </span>
            ))}
            {plan.features.length > 4 && (
              <span className="text-xs px-2 py-1 text-[var(--text-tertiary)]">
                +{plan.features.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================
// COMPONENTE DE LINHA DE TABELA
// ============================================

interface PlanRowProps {
  plan: Plan;
  onClick: () => void;
}

function PlanRow({ plan, onClick }: PlanRowProps) {
  const statusVariant = {
    active: 'success' as const,
    inactive: 'warning' as const,
    draft: 'secondary' as const,
  };

  return (
    <tr 
      className="border-b border-[var(--divider-primary)] hover:bg-[var(--background-secondary)] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text-primary)]">{plan.name}</span>
          {plan.onboardingBehavior.isPopular && (
            <Badge variant="default" className="text-xs">Popular</Badge>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-[var(--text-secondary)]">{plan.category}</span>
      </td>
      <td className="py-4 px-4">
        <Badge variant={statusVariant[plan.status]}>
          {PLAN_STATUS_LABELS[plan.status]}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <span className="font-medium text-[var(--element-primary)]">
          {getPriceRange(plan)}
        </span>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-[var(--text-primary)]">{plan.stats.activeContracts}</span>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-[var(--text-secondary)]">
          {formatPrice(plan.stats.totalRevenue)}
        </span>
      </td>
    </tr>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

type ViewMode = 'cards' | 'table';
type SortOption = 'name' | 'price' | 'contracts' | 'revenue';

export default function PlansPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('contracts');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Filtrar e ordenar planos
  const filteredPlans = useMemo(() => {
    let plans = searchQuery ? searchPlans(searchQuery) : [...mockPlans];
    
    if (statusFilter !== 'all') {
      plans = plans.filter(p => p.status === statusFilter);
    }
    
    return sortPlans(plans, sortBy);
  }, [searchQuery, statusFilter, sortBy]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const activePlans = mockPlans.filter(p => p.status === 'active');
    return {
      total: mockPlans.length,
      active: activePlans.length,
      totalContracts: mockPlans.reduce((acc, p) => acc + p.stats.activeContracts, 0),
      totalRevenue: mockPlans.reduce((acc, p) => acc + p.stats.totalRevenue, 0),
    };
  }, []);

  const handlePlanClick = (planId: string) => {
    router.push(`/plans/${planId}`);
  };

  const handleNewPlan = () => {
    router.push('/plans/new');
  };

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Header title="Planos" />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
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
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Contratos Ativos</p>
            <p className="text-2xl font-bold text-[var(--element-primary)]">{stats.totalContracts}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {formatPrice(stats.totalRevenue)}
            </p>
          </Card>
        </div>

        {/* Toolbar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-1 gap-4 items-center w-full lg:w-auto">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Buscar planos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PlanStatus | 'all')}
                className="h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="draft">Rascunhos</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
              >
                <option value="contracts">Mais contratos</option>
                <option value="revenue">Maior receita</option>
                <option value="name">Nome A-Z</option>
                <option value="price">Menor preço</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              {/* View Toggle */}
              <div className="flex border border-[var(--border-default)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-[var(--element-primary)] text-white' 
                      : 'bg-[var(--background-primary)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-[var(--element-primary)] text-white' 
                      : 'bg-[var(--background-primary)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>

              <Button onClick={handleNewPlan}>
                + Novo Plano
              </Button>
            </div>
          </div>
        </Card>

        {/* Content */}
        {filteredPlans.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-[var(--text-tertiary)] mb-2">Nenhum plano encontrado</p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Tente ajustar os filtros ou criar um novo plano
            </p>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map(plan => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                onClick={() => handlePlanClick(plan.id)} 
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--background-secondary)]">
                <tr className="border-b border-[var(--divider-primary)]">
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Nome</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Categoria</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-[var(--text-tertiary)]">Preço</th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-[var(--text-tertiary)]">Contratos</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-[var(--text-tertiary)]">Receita</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map(plan => (
                  <PlanRow 
                    key={plan.id} 
                    plan={plan} 
                    onClick={() => handlePlanClick(plan.id)} 
                  />
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
