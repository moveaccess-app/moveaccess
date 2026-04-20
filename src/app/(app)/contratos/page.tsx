'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  getContractTemplates,
  TEMPLATE_STATUS_LABELS,
  type ContractTemplate,
  type ContractTemplateStatus,
} from '@/lib/contracts';

const STATUS_VARIANT: Record<ContractTemplateStatus, 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'outline'> = {
  draft: 'warning',
  published: 'success',
  archived: 'secondary',
};

const STATUS_FILTERS: { value: ContractTemplateStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Rascunhos' },
  { value: 'archived', label: 'Arquivados' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ContratosPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractTemplateStatus | 'all'>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getContractTemplates();
      setTemplates(data);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: templates.length,
      published: templates.filter((t) => t.status === 'published').length,
      draft: templates.filter((t) => t.status === 'draft').length,
      archived: templates.filter((t) => t.status === 'archived').length,
    };
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    return result;
  }, [templates, searchQuery, statusFilter]);

  const handleViewTemplate = useCallback(
    (id: string) => {
      router.push(`/contratos/${id}`);
    },
    [router]
  );

  const handleNewTemplate = useCallback(() => {
    router.push('/contratos/novo');
  }, [router]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Contratos" />

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-success)]">{stats.published}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Publicados</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-warning)]">{stats.draft}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Rascunhos</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-tertiary)]">{stats.archived}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Arquivados</div>
          </Card>
        </div>

        {/* Toolbar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[250px]">
                <Input
                  placeholder="Buscar por nome ou descrição..."
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContractTemplateStatus | 'all')}
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
            </div>

            <Button onClick={handleNewTemplate}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Modelo
            </Button>
          </div>
        </Card>

        {/* Results count */}
        <div className="text-sm text-[var(--color-text-secondary)] mb-4">
          {loading ? '\u00A0' : `${filteredTemplates.length} modelo(s) encontrado(s)`}
        </div>

        {/* Loading state */}
        {loading && <SkeletonTable rows={4} cols={4} />}

        {/* Table */}
        {!loading && filteredTemplates.length > 0 && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Versão
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Publicado em
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
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {template.name}
                        </div>
                        {template.description && (
                          <div className="text-sm text-[var(--color-text-tertiary)] line-clamp-1">
                            {template.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={STATUS_VARIANT[template.status]}>
                          {TEMPLATE_STATUS_LABELS[template.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[var(--color-text-primary)]">v{template.version}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {template.publishedAt ? formatDate(template.publishedAt) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {formatDate(template.updatedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredTemplates.length === 0 && (
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
              {searchQuery || statusFilter !== 'all'
                ? 'Nenhum modelo encontrado'
                : 'Crie seu primeiro contrato'}
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece a partir de um modelo pronto com variáveis dinâmicas que se adaptam automaticamente a cada aluno.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={handleNewTemplate}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar a partir de modelo pronto
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
