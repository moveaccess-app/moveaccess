'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import {
  getAccessLogs,
  getAccessUnits,
  formatAccessDateTime,
  formatCpfMasked,
  getAccessMethodLabel,
  getAccessStatusLabel,
  getDenialReasonMessage,
  type AccessAttempt,
  type AccessStatus,
  type AccessMethod,
  type AccessUnit,
} from '@/lib/access';

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS: { value: AccessStatus | ''; label: string }[] = [
  { value: '', label: 'Todos Status' },
  { value: 'allowed', label: 'Liberado' },
  { value: 'denied', label: 'Negado' },
];

const METHOD_OPTIONS: { value: AccessMethod | ''; label: string }[] = [
  { value: '', label: 'Todos Métodos' },
  { value: 'qr', label: 'QR' },
  { value: 'manual', label: 'Manual' },
  { value: 'scanner', label: 'Scanner' },
];

export default function AccessLogPage() {
  const [logs, setLogs] = useState<AccessAttempt[]>([]);
  const [units, setUnits] = useState<AccessUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccessStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<AccessMethod | ''>('');
  const [unitFilter, setUnitFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const [logsData, unitsData] = await Promise.all([
        getAccessLogs({
          status: statusFilter || undefined,
          method: methodFilter || undefined,
          unitId: unitFilter || undefined,
          search: search || undefined,
          limit: 500,
        }),
        getAccessUnits(),
      ]);

      setLogs(logsData);
      setUnits(unitsData);
      setIsLoading(false);
    }

    loadData();
  }, [search, statusFilter, methodFilter, unitFilter]);

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return logs.slice(start, start + ITEMS_PER_PAGE);
  }, [logs, page]);

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
            <ArrowLeft className="w-4 h-4" />
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
                  <Search className="w-4 h-4" />
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
                  <SlidersHorizontal className="w-4 h-4" />
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
                  <Download className="w-4 h-4" />
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
                  {units.map((unit) => (
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
            {isLoading ? '\u00A0' : `${logs.length} registro(s) encontrado(s)`}
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
          {!isLoading && paginatedData.length === 0 && (
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
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <span className="hidden sm:inline mr-1">Próximo</span>
                <ChevronRight className="w-4 h-4" />
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
  const eventLabel = attempt.eventType === 'entry' ? 'Entrada' : attempt.eventType === 'exit' ? 'Saída' : null;

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
            {isAllowed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getAccessMethodLabel(attempt.method)}
          </Badge>
          {eventLabel && <Badge className="text-xs">{eventLabel}</Badge>}
        </div>
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
