'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  getStaffUsers,
  getRoles,
  getUnits,
  createStaffUser,
  updateStaffUser,
  toggleStaffStatus,
  type StaffUser,
  type StaffStatus,
  type RoleId,
  type Role,
} from '@/lib/settings/teamService';
import type { Unit } from '@/lib/settings/settingsService';

type StaffSavePayload = Partial<StaffUser> & {
  password?: string;
};

const ROLE_LABELS: Record<RoleId, { label: string; description: string; color: string }> = {
  admin: { label: 'Administrador', description: 'Acesso total ao sistema', color: 'bg-purple-100 text-purple-800' },
  manager: { label: 'Gestor', description: 'Gerencia operações e equipe', color: 'bg-blue-100 text-blue-800' },
  receptionist: { label: 'Recepção', description: 'Atendimento e check-in', color: 'bg-green-100 text-green-800' },
  financial: { label: 'Financeiro', description: 'Cobranças e pagamentos', color: 'bg-yellow-100 text-yellow-800' },
  readonly: { label: 'Consulta', description: 'Apenas visualização', color: 'bg-gray-100 text-gray-800' },
};

const STATUS_LABELS: Record<StaffStatus, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  active: { label: 'Ativo', variant: 'success' },
  inactive: { label: 'Inativo', variant: 'default' },
  pending: { label: 'Pendente', variant: 'warning' },
};

function formatPhone(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

// Card de membro da equipe
function StaffCard({ 
  staff, 
  onEdit, 
  onToggleStatus 
}: { 
  staff: StaffUser; 
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const roleInfo = ROLE_LABELS[staff.roleId];
  const statusInfo = STATUS_LABELS[staff.status];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-lg font-medium text-[var(--element-secondary)]">
          {staff.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[var(--element-primary)] truncate">{staff.name}</h3>
            <Badge variant={statusInfo.variant} className="text-xs">
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-[var(--element-secondary)] truncate">{staff.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleStatus}
            className={staff.status === 'active' ? 'text-[var(--status-negative)]' : 'text-[var(--status-positive)]'}
          >
            {staff.status === 'active' ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Modal simples de edição
function StaffModal({
  staff,
  onSave,
  onClose,
}: {
  staff: StaffUser | null;
  onSave: (data: StaffSavePayload) => Promise<void>;
  onClose: () => void;
}) {
  const isNew = !staff;
  const [roles, setRoles] = useState<Role[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    password: '',
    phone: staff?.phone || '',
    roleId: staff?.roleId || 'receptionist' as RoleId,
    unitIds: staff?.unitIds || [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Carregar roles e units async
  useEffect(() => {
    async function loadModalData() {
      setIsLoadingData(true);
      try {
        const [rolesData, unitsData] = await Promise.all([
          getRoles(),
          getUnits(),
        ]);
        setRoles(rolesData);
        setUnits(unitsData);
      } catch (error) {
        console.error('[TeamModal] Erro ao carregar dados:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadModalData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    if (isNew && formData.password.length < 6) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b border-[var(--divider-primary)]">
          <h2 className="text-lg font-semibold text-[var(--element-primary)]">
            {isNew ? 'Adicionar à Equipe' : 'Editar Membro'}
          </h2>
        </div>

        {isLoadingData ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[var(--element-secondary)]">Carregando...</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@academia.com"
              required
            />
          </div>

          {isNew && (
            <div>
              <Label htmlFor="password">Senha inicial</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <Label htmlFor="role">Função</Label>
            <select
              id="role"
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value as RoleId })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {ROLE_LABELS[role.id]?.label || role.id} - {ROLE_LABELS[role.id]?.description || ''}
                </option>
              ))}
            </select>
          </div>

          {units.length > 1 && (
            <div>
              <Label>Unidades de Acesso</Label>
              <p className="text-xs text-[var(--element-secondary)] mb-2">
                Sem seleção = acesso a todas
              </p>
              <div className="space-y-2 max-h-32 overflow-auto">
                {units.map((unit) => (
                  <label key={unit.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.unitIds.includes(unit.id)}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          unitIds: e.target.checked
                            ? [...formData.unitIds, unit.id]
                            : formData.unitIds.filter((id) => id !== unit.id),
                        });
                      }}
                      className="rounded border-[var(--divider-primary)]"
                    />
                    <span className="text-sm text-[var(--element-primary)]">{unit.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
        )}
      </Card>
    </div>
  );
}

export default function TeamPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar staff list de forma assíncrona
  const loadStaffList = useCallback(async () => {
    try {
      const result = await getStaffUsers();
      setStaffList(result.data);
      if (result.error) {
        console.warn('[TeamPage] Aviso ao carregar equipe:', result.error);
      }
    } catch (error) {
      console.error('[TeamPage] Erro ao carregar equipe:', error);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await loadStaffList();
      setIsLoading(false);
    }
    init();
  }, [loadStaffList]);

  // Filtrar
  const filteredStaff = searchTerm
    ? staffList.filter((s) => {
        const term = searchTerm.toLowerCase();
        return s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term);
      })
    : staffList;

  const activeCount = staffList.filter((s) => s.status === 'active').length;

  const handleSave = async (data: StaffSavePayload) => {
    if (editingStaff) {
      const result = await updateStaffUser(editingStaff.id, data);
      if (result.error) {
        console.error('[TeamPage] Erro ao atualizar membro:', result.error);
        return;
      }
    } else {
      const result = await createStaffUser({
        name: data.name || '',
        email: data.email || '',
        password: data.password || '',
        phone: data.phone || undefined,
        roleId: data.roleId,
        unitIds: data.unitIds,
      });

      if (result.error) {
        console.error('[TeamPage] Erro ao criar membro:', result.error);
        return;
      }
    }

    await loadStaffList();
    setEditingStaff(null);
    setIsCreating(false);
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    const result = await toggleStaffStatus(staff.id, staff.status);
    if (result.error) {
      console.error('[TeamPage] Erro ao alterar status:', result.error);
      return;
    }
    await loadStaffList();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Equipe" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">
              Configurações
            </Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Equipe</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--element-secondary)]">
                {isLoading ? 'Carregando...' : `${activeCount} membro${activeCount !== 1 ? 's' : ''} ativo${activeCount !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Button onClick={() => setIsCreating(true)} disabled={isLoading}>
              Adicionar
            </Button>
          </div>

          {/* Busca */}
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />

          {/* Legenda de funções */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(ROLE_LABELS).map(([id, info]) => (
              <span key={id} className={`text-xs px-2 py-1 rounded-full ${info.color}`}>
                {info.label}
              </span>
            ))}
          </div>

          {/* Loading state */}
          {isLoading && (
            <Card className="p-8 text-center">
              <p className="text-[var(--element-secondary)]">Carregando equipe...</p>
            </Card>
          )}

          {/* Lista */}
          {!isLoading && (
            <div className="space-y-3">
              {filteredStaff.map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  onEdit={() => setEditingStaff(staff)}
                  onToggleStatus={() => handleToggleStatus(staff)}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredStaff.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-[var(--element-secondary)]">
                {searchTerm ? 'Nenhum resultado encontrado.' : 'Nenhum membro na equipe.'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal */}
      {(isCreating || editingStaff) && (
        <StaffModal
          staff={editingStaff}
          onSave={handleSave}
          onClose={() => {
            setEditingStaff(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}
