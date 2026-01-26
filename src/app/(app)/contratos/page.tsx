'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  mockTemplates,
  TEMPLATE_STATUS_LABELS,
  TEMPLATE_STATUS_VARIANT,
  getTemplateStats,
  searchTemplates,
  formatDate,
  type TemplateStatus,
} from '@/mocks/contractTemplatesMock';

type ViewMode = 'table' | 'cards';
type SortOption = 'date' | 'name' | 'status' | 'version';

const STATUS_FILTERS: { value: TemplateStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Rascunhos' },
  { value: 'archived', label: 'Arquivados' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date', label: 'Mais Recentes' },
  { value: 'name', label: 'Nome' },
  { value: 'status', label: 'Status' },
  { value: 'version', label: 'Versão' },
];

export default function ContratosPage() {
  const router = useRouter();
  
  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Estatísticas
  const stats = useMemo(() => getTemplateStats(), []);
  
  // Templates filtrados e ordenados
  const filteredTemplates = useMemo(() => {
    let result = searchQuery ? searchTemplates(searchQuery) : [...mockTemplates];
    
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    
    // Ordenação
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'version':
          return b.currentVersion - a.currentVersion;
        case 'date':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    
    return result;
  }, [searchQuery, statusFilter, sortBy]);
  
  // Handlers
  const handleViewTemplate = useCallback((id: string) => {
    router.push(`/contratos/${id}`);
  }, [router]);

  const handleNewTemplate = useCallback(() => {
    router.push('/contratos/novo');
  }, [router]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Contratos (Templates)" />
      
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
              {stats.published}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Publicados</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-warning)]">
              {stats.draft}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Rascunhos</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-tertiary)]">
              {stats.archived}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Arquivados</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-brand)]">
              {stats.templatesWithPlans}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Com Planos</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.totalSignatures}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">Assinaturas</div>
          </Card>
        </div>
        
        {/* Toolbar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Busca e filtros */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[250px]">
                <Input
                  placeholder="Buscar por nome, código ou descrição..."
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
                onChange={(e) => setStatusFilter(e.target.value as TemplateStatus | 'all')}
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
              
              <Button onClick={handleNewTemplate}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Modelo
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Resultados */}
        <div className="text-sm text-[var(--color-text-secondary)] mb-4">
          {filteredTemplates.length} modelo(s) encontrado(s)
        </div>
        
        {/* Visualização em Tabela */}
        {viewMode === 'table' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Versão
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Planos
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Assinatura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Atualizado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-primary)]">
                  {filteredTemplates.map((template) => (
                    <tr 
                      key={template.id}
                      className="hover:bg-[var(--color-bg-tertiary)] cursor-pointer transition-colors"
                      onClick={() => handleViewTemplate(template.id)}
                    >
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-[var(--color-text-primary)]">
                          {template.code}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {template.name}
                        </div>
                        <div className="text-sm text-[var(--color-text-tertiary)] line-clamp-1">
                          {template.description}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={TEMPLATE_STATUS_VARIANT[template.status]}>
                          {TEMPLATE_STATUS_LABELS[template.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[var(--color-text-primary)]">v{template.currentVersion}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[var(--color-text-primary)]">
                          {template.linkedPlans.length}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {template.requiresSignature ? (
                          <svg className="w-5 h-5 mx-auto text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mx-auto text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-[var(--color-text-primary)]">
                          {formatDate(template.updatedAt)}
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                          {template.updatedBy}
                        </div>
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
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewTemplate(template.id)}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                      {template.code}
                    </span>
                    <div className="font-semibold text-[var(--color-text-primary)]">
                      {template.name}
                    </div>
                  </div>
                  <Badge variant={TEMPLATE_STATUS_VARIANT[template.status]}>
                    {TEMPLATE_STATUS_LABELS[template.status]}
                  </Badge>
                </div>
                
                {/* Descrição */}
                <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
                  {template.description}
                </p>
                
                {/* Info */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                  <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                    <div className="font-semibold text-[var(--color-text-primary)]">v{template.currentVersion}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">Versão</div>
                  </div>
                  <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                    <div className="font-semibold text-[var(--color-text-primary)]">{template.linkedPlans.length}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">Planos</div>
                  </div>
                  <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                    <div className="font-semibold text-[var(--color-text-primary)]">{template.signatures.length}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">Assinaturas</div>
                  </div>
                </div>
                
                {/* Planos vinculados */}
                {template.linkedPlans.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Planos vinculados:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.linkedPlans.slice(0, 3).map((lp) => (
                        <Badge key={lp.planId} variant="secondary">
                          {lp.planName}
                        </Badge>
                      ))}
                      {template.linkedPlans.length > 3 && (
                        <Badge variant="secondary">+{template.linkedPlans.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Footer */}
                <div className="pt-3 border-t border-[var(--color-border-primary)]">
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    Atualizado em {formatDate(template.updatedAt)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {filteredTemplates.length === 0 && (
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
              Nenhum modelo encontrado
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando o primeiro modelo de contrato'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={handleNewTemplate}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Modelo
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
