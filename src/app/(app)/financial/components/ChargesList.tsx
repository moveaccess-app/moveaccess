'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  mockCharges,
  CHARGE_STATUS_LABELS,
  CHARGE_STATUS_VARIANT,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatCompetence,
  getDaysOverdue,
  getDaysUntilDue,
  ChargeStatus,
  Charge,
} from '@/mocks/financialMock';

type FilterStatus = 'all' | ChargeStatus;
type SortField = 'dueDate' | 'value' | 'status';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Em Atraso' },
  { value: 'partial', label: 'Parcial' },
  { value: 'waived', label: 'Isento' },
  { value: 'cancelled', label: 'Cancelado' },
];

const ITEMS_PER_PAGE = 10;

export function ChargesList({ showValues = true }: { showValues?: boolean }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCharges = useMemo(() => {
    let result = [...mockCharges];

    // Filtro por status
    if (statusFilter !== 'all') {
      result = result.filter((charge) => charge.status === statusFilter);
    }

    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (charge) =>
          charge.userName.toLowerCase().includes(search) ||
          charge.planName.toLowerCase().includes(search) ||
          charge.id.toLowerCase().includes(search)
      );
    }

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'value':
          comparison = a.finalValue - b.finalValue;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredCharges.length / ITEMS_PER_PAGE);
  const paginatedCharges = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCharges.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCharges, currentPage]);

  // Reset página ao filtrar
  const handleFilterChange = (newFilter: FilterStatus) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleChargeClick = (charge: Charge) => {
    router.push(`/financial/cobranca/${charge.id}`);
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return (
        <svg className="w-3 h-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {sortOrder === 'asc' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

  const renderDueDateInfo = (charge: Charge) => {
    if (charge.status === 'paid' || charge.status === 'waived' || charge.status === 'cancelled') {
      return null;
    }

    if (charge.status === 'overdue') {
      const days = getDaysOverdue(charge.dueDate);
      return (
        <span className="text-xs text-[var(--status-negative)]">
          {days}d atraso
        </span>
      );
    }

    const days = getDaysUntilDue(charge.dueDate);
    if (days <= 7 && days >= 0) {
      return (
        <span className="text-xs text-[var(--status-alert)]">
          {days}d
        </span>
      );
    }

    return null;
  };

  // Totais
  const totalValue = filteredCharges.reduce((sum, c) => sum + c.finalValue, 0);
  const { display: totalDisplay, full: totalFull } = formatCurrencyCompact(totalValue);

  return (
    <div className="space-y-4">
      {/* Filtros e busca */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Linha 1: Busca + Dropdown de status (mobile friendly) */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por aluno, plano ou código..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
            {/* Select dropdown para mobile, botões para desktop */}
            <div className="sm:hidden">
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Linha 2: Botões de filtro (apenas desktop) */}
          <div className="hidden sm:flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleFilterChange(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabela de cobranças - com scroll horizontal */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[var(--background-tertiary)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm sticky left-0 bg-[var(--background-tertiary)] z-10">
                  Aluno
                </th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">
                  Plano
                </th>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm">
                  Competência
                </th>
                <th
                  className="text-right p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none"
                  onClick={() => toggleSort('value')}
                >
                  <span className="inline-flex items-center gap-1">
                    Valor {renderSortIcon('value')}
                  </span>
                </th>
                <th
                  className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none"
                  onClick={() => toggleSort('dueDate')}
                >
                  <span className="inline-flex items-center gap-1">
                    Vencimento {renderSortIcon('dueDate')}
                  </span>
                </th>
                <th
                  className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none"
                  onClick={() => toggleSort('status')}
                >
                  <span className="inline-flex items-center gap-1">
                    Status {renderSortIcon('status')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider-primary)]">
              {paginatedCharges.map((charge) => (
                <tr
                  key={charge.id}
                  onClick={() => handleChargeClick(charge)}
                  className="hover:bg-[var(--background-tertiary)] cursor-pointer transition-colors"
                >
                  <td className="p-3 sticky left-0 bg-[var(--background-primary)] z-10">
                    <div className="font-medium text-[var(--element-primary)] text-sm truncate max-w-[180px]">
                      {charge.userName}
                    </div>
                    <div className="text-xs text-[var(--element-disabled)]">
                      {charge.id}
                    </div>
                  </td>
                  <td className="p-3 text-[var(--element-secondary)] text-sm">
                    <span className="truncate max-w-[120px] block">{charge.planName}</span>
                  </td>
                  <td className="p-3 text-[var(--element-secondary)] text-sm">
                    {formatCompetence(charge.competence)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-medium text-[var(--element-primary)] text-sm" title={showValues ? formatCurrency(charge.finalValue) : undefined}>
                      {showValues ? formatCurrencyCompact(charge.finalValue).display : '•••••'}
                    </div>
                    {charge.baseValue !== charge.finalValue && showValues && (
                      <div className="text-xs text-[var(--element-disabled)] line-through">
                        {formatCurrencyCompact(charge.baseValue).display}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--element-primary)] text-sm">
                        {formatDate(charge.dueDate)}
                      </span>
                      {renderDueDateInfo(charge)}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={CHARGE_STATUS_VARIANT[charge.status]}>
                      {CHARGE_STATUS_LABELS[charge.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Estado vazio */}
        {filteredCharges.length === 0 && (
          <div className="p-8 text-center">
            <div className="p-4 rounded-full bg-[var(--background-tertiary)] w-fit mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--element-disabled)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="text-[var(--element-primary)] font-medium">
              Nenhuma cobrança encontrada
            </div>
            <div className="text-[var(--element-disabled)] text-sm mt-1">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'As cobranças aparecerão aqui quando criadas'}
            </div>
            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Rodapé: Resumo + Paginação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
        <div className="text-[var(--element-secondary)]">
          {filteredCharges.length} cobrança(s) • Total:{' '}
          <strong className="text-[var(--element-primary)]" title={showValues ? totalFull : undefined}>
            {showValues ? totalDisplay : '•••••'}
          </strong>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <span className="px-3 py-1 text-[var(--element-secondary)]">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
