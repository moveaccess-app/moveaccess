'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  getUnitById,
  createUnit,
  updateUnit,
  type UnitStatus,
  type Unit,
} from '@/lib/settings';
import { getCurrentSession } from '@/lib/auth/authService';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  dayOfWeek: day,
  openTime: '06:00',
  closeTime: '22:00',
  isOpen: day !== 0, // Fechado domingo por padrão
}));

function formatCEP(value: string): string {
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

function formatPhone(value: string): string {
  return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
}

type FormData = Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>;

const EMPTY_FORM: FormData = {
  academyId: '',
  name: '',
  status: 'active' as UnitStatus,
  address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' },
  phone: '',
  email: '',
  operatingHours: DEFAULT_HOURS,
  accessConfig: { qrEnabled: true, qrToken: '', qrUrl: '', dailyLimitDefault: 1, requireOtpNewDevice: true, toleranceMinutes: 15 },
  updatedBy: '',
};

export default function UnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [formData, setFormData] = useState<FormData | null>(isNew ? EMPTY_FORM : null);
  const [loading, setLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Carregar dados da unidade (se não for nova)
  useEffect(() => {
    if (isNew) return;
    
    async function loadUnit() {
      try {
        const unit = await getUnitById(params.id as string);
        if (unit) {
          const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = unit;
          // Garantir que address e accessConfig tenham valores padrão
          setFormData({
            ...EMPTY_FORM,
            ...rest,
            address: {
              ...EMPTY_FORM.address,
              ...(rest.address || {}),
            },
            operatingHours: rest.operatingHours?.length ? rest.operatingHours : EMPTY_FORM.operatingHours,
            accessConfig: {
              ...EMPTY_FORM.accessConfig,
              ...(rest.accessConfig || {}),
            },
          });
        } else {
          router.push('/settings/units');
        }
      } catch (err) {
        console.error('[UnitDetailPage] Erro ao carregar:', err);
        setErrorMessage('Erro ao carregar unidade');
      } finally {
        setLoading(false);
      }
    }
    loadUnit();
  }, [isNew, params.id, router]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[var(--background-secondary)]">
        <Header title="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--element-secondary)]">Carregando unidade...</p>
        </div>
      </div>
    );
  }

  if (!formData) return null;

  const handleChange = (field: string, value: string | boolean) => {
    setHasChanges(true);
    setErrorMessage('');

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => prev && ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => prev && ({ ...prev, [field]: value }));
    }
  };

  const handleHoursToggle = (dayOfWeek: number) => {
    setHasChanges(true);
    setFormData((prev) => prev && ({
      ...prev,
      operatingHours: prev.operatingHours.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, isOpen: !h.isOpen } : h
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
      // Obter userId da sessão atual
      const session = await getCurrentSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        setErrorMessage('Sessão expirada. Faça login novamente.');
        return;
      }

      let result;
      if (isNew) {
        result = await createUnit(formData, userId);
      } else {
        result = await updateUnit(params.id as string, formData, userId);
      }

      if (result.success) {
        setHasChanges(false);
        // Sempre redireciona para a lista de unidades após salvar
        setTimeout(() => router.push('/settings/units'), 500);
      } else {
        setErrorMessage(result.error || 'Não foi possível salvar a unidade. Tente novamente.');
      }
    } catch (err) {
      console.error('[UnitDetailPage] Erro ao salvar:', err);
      setErrorMessage('Ocorreu um erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title={isNew ? 'Nova Unidade' : 'Editar Unidade'} />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">Configurações</Link>
            <span>/</span>
            <Link href="/settings/units" className="hover:text-[var(--status-info)]">Unidades</Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">{isNew ? 'Nova' : formData.name}</span>
          </div>

          {/* Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Dados básicos */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Informações</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Unidade</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Unidade Centro"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
                  >
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                    <option value="maintenance">Em Manutenção</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="unidade@academia.com"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Endereço */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Endereço</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.address.zipCode}
                    onChange={(e) => handleChange('address.zipCode', formatCEP(e.target.value))}
                    placeholder="00000-000"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleChange('address.street', e.target.value)}
                    placeholder="Rua, avenida..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.address.number}
                    onChange={(e) => handleChange('address.number', e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.address.complement || ''}
                    onChange={(e) => handleChange('address.complement', e.target.value)}
                    placeholder="Sala..."
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.address.neighborhood}
                    onChange={(e) => handleChange('address.neighborhood', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Horários */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Funcionamento</h2>
              <p className="text-xs text-[var(--element-secondary)]">Clique para alternar entre aberto/fechado</p>
            </div>
            <div className="p-4">
              <div className="flex gap-2 flex-wrap">
                {formData.operatingHours.map((h) => (
                  <button
                    key={h.dayOfWeek}
                    type="button"
                    onClick={() => handleHoursToggle(h.dayOfWeek)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      h.isOpen
                        ? 'bg-[var(--status-positive-background)] border-[var(--status-positive)] text-[var(--status-positive)]'
                        : 'bg-[var(--background-tertiary)] border-[var(--divider-primary)] text-[var(--element-disabled)]'
                    }`}
                  >
                    {DAYS_OF_WEEK[h.dayOfWeek]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--element-secondary)] mt-3">
                Horário padrão: 06:00 - 22:00
              </p>
            </div>
          </Card>

          {/* Botões */}
          <div className="flex justify-between gap-4">
            <Button type="button" variant="outline" onClick={() => router.push('/settings/units')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !hasChanges}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
