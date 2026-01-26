'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  mockContracts,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_VARIANT,
  CONTRACT_ORIGIN_LABELS,
  getContractStats,
  searchContracts,
  sortContracts,
  formatContractValue,
  getDaysRemaining,
  type Contract,
  type ContractStatus,
} from '@/mocks/contractsMock';

type ViewMode = 'table' | 'cards';
type SortOption = 'date' | 'name' | 'status' | 'value' | 'endDate';

const STATUS_FILTERS: { value: ContractStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'pending_signature', label: 'Aguardando Assinatura' },
  { value: 'pending_payment', label: 'Aguardando Pagamento' },
  { value: 'pending_approval', label: 'Aguardando Aprovação' },
  { value: 'suspended', label: 'Suspensos' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'cancelled', label: 'Cancelados' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date', label: 'Mais Recentes' },
  { value: 'name', label: 'Nome do Cliente' },
  { value: 'status', label: 'Status' },
  { value: 'value', label: 'Valor' },
  { value: 'endDate', label: 'Vencimento' },
];

export default function AssinaturasPage() {
  const router = useRouter();
  
  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Estatísticas
  const stats = useMemo(() => getContractStats(), []);
  
  // Contratos filtrados e ordenados
  const filteredContracts = useMemo(() => {
    let result = searchQuery ? searchContracts(searchQuery) : [...mockContracts];
    
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    
    return sortContracts(result, sortBy);
  }, [searchQuery, statusFilter, sortBy]);
  
  // Handlers
  const handleViewContract = useCallback((id: string) => {
    router.push(`/assinaturas/${id}`);
  }, [router]);
  
  const handleNewContract = useCallback(() => {
    router.push('/assinaturas/new');
  }, [router]);
  
  // Formata data para exibição
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  
  // Renderiza badge de dias restantes
  const renderDaysRemaining = (contract: Contract) => {
    if (contract.status !== 'active') return null;
    
    const days = getDaysRemaining(contract.endDate);
    
    if (days < 0) return null;
    if (days <= 7) {
      return <Badge variant="destructive">{days}d</Badge>;
    }
    if (days <= 30) {
      return <Badge variant="warning">{days}d</Badge>;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Assinaturas" />
      
      <div className="flex-1 overflow-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.total}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-success)]">
              {stats.active}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Ativos</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-warning)]">
              {stats.pending}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Pendentes</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-error)]">
              {stats.suspended}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Suspensos</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-warning)]">
              {stats.requiresRenewal}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Renovação</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-brand)]">
              {formatContractValue(stats.totalMonthlyRevenue)}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Receita/mês</div>
          </Card>
        </div>
        
        {/* Toolbar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Busca e filtros */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[250px]">
                <Input
                  placeholder="Buscar por número, cliente, CPF ou plano..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-primary)] 
                         bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-primary)] 
                         bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Ações */}
            <div className="flex gap-2">
              {/* Toggle de visualização */}
              <div className="flex border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 ${viewMode === 'table' 
                    ? 'bg-[var(--color-brand)] text-white' 
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'}`}
                  title="Visualização em tabela"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 ${viewMode === 'cards' 
                    ? 'bg-[var(--color-brand)] text-white' 
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'}`}
                  title="Visualização em cards"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
              
              <Button onClick={handleNewContract}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nova Assinatura
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Resultados */}
        <div className="text-sm text-[var(--color-text-secondary)] mb-4">
          {filteredContracts.length} assinatura(s) encontrada(s)
        </div>
        
        {/* Visualização em Tabela */}
        {viewMode === 'table' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Assinatura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Vigência
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Valor/mês
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-primary)]">
                  {filteredContracts.map((contract) => (
                    <tr 
                      key={contract.id}
                      className="hover:bg-[var(--color-bg-tertiary)] cursor-pointer transition-colors"
                      onClick={() => handleViewContract(contract.id)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {contract.number}
                          </span>
                          {renderDaysRemaining(contract)}
                        </div>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {CONTRACT_ORIGIN_LABELS[contract.origin]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {contract.userName}
                        </div>
                        <div className="text-sm text-[var(--color-text-tertiary)]">
                          {contract.userDocument}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {contract.planSnapshot.planName}
                        </div>
                        <div className="text-sm text-[var(--color-text-tertiary)]">
                          {contract.planSnapshot.category}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={CONTRACT_STATUS_VARIANT[contract.status]}>
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-[var(--color-text-primary)]">
                          {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {formatContractValue(contract.financials.finalMonthlyValue)}
                        </div>
                        {contract.financials.discount && (
                          <div className="text-xs text-[var(--color-success)]">
                            {contract.financials.discount.type === 'percentage' 
                              ? `${contract.financials.discount.value}% desc.` 
                              : formatContractValue(contract.financials.discount.value) + ' desc.'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        
        {/* Visualização em Cards */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => (
              <Card
                key={contract.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewContract(contract.id)}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {contract.number}
                      </span>
                      {renderDaysRemaining(contract)}
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {CONTRACT_ORIGIN_LABELS[contract.origin]}
                    </span>
                  </div>
                  <Badge variant={CONTRACT_STATUS_VARIANT[contract.status]}>
                    {CONTRACT_STATUS_LABELS[contract.status]}
                  </Badge>
                </div>
                
                {/* Cliente */}
                <div className="mb-3">
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {contract.userName}
                  </div>
                  <div className="text-sm text-[var(--color-text-tertiary)]">
                    {contract.userDocument}
                  </div>
                </div>
                
                {/* Plano */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-light)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-[var(--color-text-primary)]">
                      {contract.planSnapshot.planName}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">
                      {contract.planSnapshot.category}
                    </div>
                  </div>
                </div>
                
                {/* Detalhes */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[var(--color-text-tertiary)]">Vigência</div>
                    <div className="text-[var(--color-text-primary)]">
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--color-text-tertiary)]">Valor/mês</div>
                    <div className="font-semibold text-[var(--color-text-primary)]">
                      {formatContractValue(contract.financials.finalMonthlyValue)}
                    </div>
                    {contract.financials.discount && (
                      <div className="text-xs text-[var(--color-success)]">
                        {contract.financials.discount.type === 'percentage' 
                          ? `${contract.financials.discount.value}% desc.` 
                          : formatContractValue(contract.financials.discount.value) + ' desc.'}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Flags */}
                {(contract.flags.hasOpenIssues || !contract.flags.hasAccessPermission) && contract.status === 'active' && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)]">
                    <div className="flex gap-2 flex-wrap">
                      {contract.flags.hasOpenIssues && (
                        <Badge variant="destructive">Pendências</Badge>
                      )}
                      {!contract.flags.hasAccessPermission && (
                        <Badge variant="warning">Sem Acesso</Badge>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {filteredContracts.length === 0 && (
          <Card className="p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-[var(--color-text-tertiary)] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              Nenhuma assinatura encontrada
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando a primeira assinatura'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={handleNewContract}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nova Assinatura
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
