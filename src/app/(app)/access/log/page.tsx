'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  filterAccessHistory,
  formatAccessDateTime,
  formatCpfMasked,
  getAccessMethodLabel,
  getAccessStatusLabel,
  getDenialReasonMessage,
  mockUnits,
  type AccessAttempt,
  type AccessStatus,
  type AccessMethod,
} from '@/mocks/accessMock';

// Ícones inline
const icons = {
  back: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  filter: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
};

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS: { value: AccessStatus | ''; label: string }[] = [
  { value: '', label: 'Todos Status' },
  { value: 'allowed', label: 'Liberado' },
  { value: 'denied', label: 'Negado' },
];

const METHOD_OPTIONS: { value: AccessMethod | ''; label: string }[] = [
  { value: '', label: 'Todos Métodos' },
  { value: 'qr_code', label: 'QR Code' },
  { value: 'pin', label: 'PIN' },
  { value: 'manual', label: 'Manual' },
  { value: 'biometria', label: 'Biometria' },
];

export default function AccessLogPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccessStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<AccessMethod | ''>('');
  const [unitFilter, setUnitFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // Filter & paginate data
  const filteredData = useMemo(() => {
    return filterAccessHistory({
      status: statusFilter || undefined,
      method: methodFilter || undefined,
      unitId: unitFilter || undefined,
      search: search || undefined,
    });
  }, [search, statusFilter, methodFilter, unitFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, page]);

  // Reset page when filters change
  const handleFilterChange = useCallback(() => {
    setPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('');
    setMethodFilter('');
    setUnitFilter('');
    setPage(1);
  }, []);

  const hasActiveFilters = search || statusFilter || methodFilter || unitFilter;

  return (
    <div className="min-h-screen bg-[var(--background-primary)]">
      <Header title="Log de Acessos" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/access"
            className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            {icons.back}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--element-primary)]">
              Log de Acessos
            </h1>
            <p className="text-sm text-[var(--element-secondary)]">
              Histórico completo de tentativas de acesso
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--element-disabled)]">
                  {icons.search}
                </div>
                <Input
                  type="text"
                  placeholder="Buscar por nome ou CPF..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    handleFilterChange();
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  {icons.filter}
                  <span className="hidden sm:inline">Filtros</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-[var(--element-accent)]" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  title="Exportar CSV"
                >
                  {icons.download}
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="flex flex-wrap gap-3 pt-3 border-t border-[var(--divider-primary)]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as AccessStatus | '');
                    handleFilterChange();
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--divider-secondary)] bg-[var(--background-primary)] text-sm text-[var(--element-primary)]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) => {
                    setMethodFilter(e.target.value as AccessMethod | '');
                    handleFilterChange();
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--divider-secondary)] bg-[var(--background-primary)] text-sm text-[var(--element-primary)]"
                >
                  {METHOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={unitFilter}
                  onChange={(e) => {
                    setUnitFilter(e.target.value);
                    handleFilterChange();
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--divider-secondary)] bg-[var(--background-primary)] text-sm text-[var(--element-primary)]"
                >
                  <option value="">Todas Unidades</option>
                  {mockUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-[var(--element-secondary)]"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--element-secondary)]">
            {filteredData.length} registro(s) encontrado(s)
          </p>
        </div>

        {/* Table */}
        <Card className="overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--element-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--element-secondary)] uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--element-secondary)] uppercase tracking-wider hidden md:table-cell">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--element-secondary)] uppercase tracking-wider hidden lg:table-cell">
                    Unidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--element-secondary)] uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--element-secondary)] uppercase tracking-wider hidden sm:table-cell">
                    Data/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--element-secondary)] uppercase tracking-wider hidden xl:table-cell">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider-primary)]">
                {paginatedData.map((attempt) => (
                  <AccessLogRow key={attempt.id} attempt={attempt} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {paginatedData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--element-secondary)]">
                Nenhum registro encontrado.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  onClick={clearFilters}
                  className="mt-2 text-[var(--element-accent)]"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--element-secondary)]">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {icons.chevronLeft}
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <span className="hidden sm:inline mr-1">Próximo</span>
                {icons.chevronRight}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Row Component
function AccessLogRow({ attempt }: { attempt: AccessAttempt }) {
  const isAllowed = attempt.status === 'allowed';

  return (
    <tr className="hover:bg-[var(--background-secondary)] transition-colors">
      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded-full ${
              isAllowed
                ? 'bg-[var(--status-positive-background)] text-[var(--status-positive)]'
                : 'bg-[var(--status-negative-background)] text-[var(--status-negative)]'
            }`}
          >
            {isAllowed ? icons.check : icons.x}
          </div>
          <Badge variant={isAllowed ? 'default' : 'destructive'} className="text-xs">
            {getAccessStatusLabel(attempt.status)}
          </Badge>
        </div>
      </td>

      {/* User */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--element-primary)] truncate max-w-[200px]">
          {attempt.userName || '—'}
        </p>
      </td>

      {/* CPF */}
      <td className="px-4 py-3 hidden md:table-cell">
        <p className="text-sm text-[var(--element-secondary)]">
          {formatCpfMasked(attempt.userCpf || '')}
        </p>
      </td>

      {/* Unit */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <p className="text-sm text-[var(--element-secondary)] truncate max-w-[150px]">
          {attempt.unitName}
        </p>
      </td>

      {/* Method */}
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-xs">
          {getAccessMethodLabel(attempt.method)}
        </Badge>
      </td>

      {/* DateTime */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <p className="text-sm text-[var(--element-secondary)]">
          {formatAccessDateTime(attempt.timestamp)}
        </p>
      </td>

      {/* Reason */}
      <td className="px-4 py-3 hidden xl:table-cell">
        <p className="text-sm text-[var(--element-disabled)] truncate max-w-[200px]">
          {attempt.reason ? getDenialReasonMessage(attempt.reason) : '—'}
        </p>
      </td>
    </tr>
  );
}
