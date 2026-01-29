'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getUnits, deleteUnit, type Unit, type UnitStatus } from '@/lib/settings';

const STATUS_LABELS: Record<UnitStatus, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  active: { label: 'Ativa', variant: 'success' },
  inactive: { label: 'Inativa', variant: 'default' },
  maintenance: { label: 'Manutenção', variant: 'warning' },
};

function UnitCard({ unit, onEdit, onDelete }: { unit: Unit; onEdit: () => void; onDelete: () => void }) {
  const statusInfo = STATUS_LABELS[unit.status] || STATUS_LABELS.active;
  const todayHours = unit.operatingHours?.find((h) => h.dayOfWeek === new Date().getDay());
  const neighborhood = unit.address?.neighborhood || '';
  const city = unit.address?.city || '';
  const locationText = [neighborhood, city].filter(Boolean).join(', ') || 'Endereço não informado';

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {/* Ícone */}
        <div className="w-12 h-12 rounded-xl bg-[var(--background-tertiary)] flex items-center justify-center text-[var(--element-secondary)]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[var(--element-primary)] truncate">{unit.name}</h3>
            <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
          </div>
          <p className="text-sm text-[var(--element-secondary)] truncate">
            {locationText}
          </p>
          <p className="text-xs text-[var(--element-disabled)] mt-1">
            {todayHours?.isOpen ? `Hoje: ${todayHours.openTime} - ${todayHours.closeTime}` : 'Fechado hoje'}
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Editar
          </Button>
          {unit.status !== 'active' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="text-[var(--status-negative)]"
            >
              Remover
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function UnitsPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUnits();
      setUnits(data);
    } catch (err) {
      console.error('[UnitsPage] Erro ao carregar unidades:', err);
      setError('Erro ao carregar unidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Deseja remover esta unidade?')) {
      const result = await deleteUnit(id);
      if (result.success) {
        loadUnits(); // Recarrega a lista
      } else {
        alert('Erro ao remover unidade');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Unidades" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">
              Configurações
            </Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Unidades</span>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-[var(--element-secondary)]">Carregando unidades...</p>
            </Card>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-[var(--element-secondary)]">
                  {units.length} unidade{units.length !== 1 ? 's' : ''} cadastrada{units.length !== 1 ? 's' : ''}
                </p>
                <Button onClick={() => router.push('/settings/units/new')}>
                  Nova Unidade
                </Button>
              </div>

              {/* Lista */}
              <div className="space-y-3">
                {units.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    onEdit={() => router.push(`/settings/units/${unit.id}`)}
                    onDelete={() => handleDelete(unit.id)}
                  />
                ))}
              </div>

              {units.length === 0 && !loading && (
                <Card className="p-8 text-center">
                  <p className="text-[var(--element-secondary)] mb-4">Nenhuma unidade cadastrada.</p>
                  <Button onClick={() => router.push('/settings/units/new')}>
                    Adicionar Primeira Unidade
                  </Button>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
