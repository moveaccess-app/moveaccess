'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { getAcademy, updateAcademy, type Academy } from '@/lib/settings';
import { getCurrentSession } from '@/lib/auth/authService';

type NestedAcademyField = 'address' | 'preferences';

// Máscaras simples
function formatCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

function formatPhone(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

function formatCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

const emptyAcademy: Academy = {
  id: '',
  tradeName: '',
  legalName: '',
  cnpj: '',
  email: '',
  phone: '',
  address: { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' },
  preferences: { language: 'pt-BR', timezone: 'America/Sao_Paulo', currency: 'BRL', dateFormat: 'DD/MM/YYYY' },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function AcademyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Academy>(emptyAcademy);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadAcademy() {
      try {
        const data = await getAcademy();
        if (data) {
          // Garantir que address e preferences tenham valores padrão
          setFormData({
            ...emptyAcademy,
            ...data,
            address: {
              ...emptyAcademy.address,
              ...(data.address || {}),
            },
            preferences: {
              ...emptyAcademy.preferences,
              ...(data.preferences || {}),
            },
          });
        }
      } catch (err) {
        console.error('[AcademyPage] Erro ao carregar:', err);
        setErrorMessage('Erro ao carregar dados da academia');
      } finally {
        setLoading(false);
      }
    }
    loadAcademy();
  }, []);

  const handleChange = (field: string, value: string) => {
    setHasChanges(true);
    setErrorMessage('');

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'address' || parent === 'preferences') {
        const nestedParent = parent as NestedAcademyField;

        setFormData((prev) => ({
          ...prev,
          [nestedParent]: {
            ...prev[nestedParent],
            [child]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      // Obter userId da sessão atual
      const session = await getCurrentSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        setErrorMessage('Sessão expirada. Faça login novamente.');
        setIsSaving(false);
        return;
      }

      const result = await updateAcademy(formData, userId);
      if (result.success) {
        setHasChanges(false);
        toast.success('Dados da academia salvos com sucesso.');
        setTimeout(() => router.push('/settings'), 500);
      } else {
        setErrorMessage(result.error || 'Não foi possível salvar os dados. Tente novamente.');
      }
    } catch (err) {
      console.error('[AcademyPage] Erro ao salvar:', err);
      setErrorMessage('Ocorreu um erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[var(--background-secondary)]">
        <Header title="Dados da Academia" />
        <div className="p-4 lg:p-6 max-w-3xl mx-auto w-full space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Dados da Academia" />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">
              Configurações
            </Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Dados da Academia</span>
          </div>

          {/* Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Identificação */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Identificação</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tradeName">Nome Fantasia</Label>
                  <Input
                    id="tradeName"
                    value={formData.tradeName}
                    onChange={(e) => handleChange('tradeName', e.target.value)}
                    placeholder="Como sua academia é conhecida"
                  />
                </div>
                <div>
                  <Label htmlFor="legalName">Razão Social</Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => handleChange('legalName', e.target.value)}
                    placeholder="Nome registrado"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contato@academia.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp || ''}
                    onChange={(e) => handleChange('whatsapp', formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Endereço */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Endereço Principal</h2>
              <p className="text-xs text-[var(--element-secondary)]">Usado como padrão para novas unidades</p>
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
                    placeholder="Sala, bloco..."
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.address.neighborhood}
                    onChange={(e) => handleChange('address.neighborhood', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Botão salvar */}
          {hasChanges && (
            <div className="sticky bottom-4 flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
