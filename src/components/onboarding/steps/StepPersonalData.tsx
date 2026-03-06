'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';

interface StepPersonalDataProps {
  session: OnboardingSession;
  onNext: (data: OnboardingSession['collectedData']['personalData']) => void;
  onBack: () => void;
}

export function StepPersonalData({ session, onNext, onBack }: StepPersonalDataProps) {
  const [formData, setFormData] = useState({
    document: session.collectedData.personalData?.document || '',
    birthDate: session.collectedData.personalData?.birthDate || '',
    street: session.collectedData.personalData?.address?.street || '',
    number: session.collectedData.personalData?.address?.number || '',
    complement: session.collectedData.personalData?.address?.complement || '',
    neighborhood: session.collectedData.personalData?.address?.neighborhood || '',
    city: session.collectedData.personalData?.address?.city || '',
    state: session.collectedData.personalData?.address?.state || '',
    zipCode: session.collectedData.personalData?.address?.zipCode || '',
    emergencyName: session.collectedData.personalData?.emergencyContact?.name || '',
    emergencyPhone: session.collectedData.personalData?.emergencyContact?.phone || '',
    emergencyRelationship: session.collectedData.personalData?.emergencyContact?.relationship || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .trim();
    }
    return formData.document;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2').trim();
    }
    return formData.zipCode;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})/, '($1) ')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .trim();
    }
    return value;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.document.trim()) {
      newErrors.document = 'CPF é obrigatório';
    } else if (formData.document.replace(/\D/g, '').length !== 11) {
      newErrors.document = 'CPF inválido';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        document: formData.document,
        birthDate: formData.birthDate,
        address: formData.street ? {
          street: formData.street,
          number: formData.number,
          complement: formData.complement || undefined,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        } : undefined,
        emergencyContact: formData.emergencyName ? {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship,
        } : undefined,
      });
    }
  };

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 
    'SP', 'SE', 'TO'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Dados Pessoais
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Informações para cadastro e contrato.
        </p>
      </div>

      {/* Documentos */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Documentos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="document">CPF *</Label>
            <Input
              id="document"
              type="text"
              placeholder="000.000.000-00"
              value={formData.document}
              onChange={(e) => handleChange('document', formatCPF(e.target.value))}
              className={errors.document ? 'border-[var(--status-negative)]' : ''}
            />
            {errors.document && (
              <p className="text-xs text-[var(--status-negative)]">{errors.document}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de nascimento *</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              className={errors.birthDate ? 'border-[var(--status-negative)]' : ''}
            />
            {errors.birthDate && (
              <p className="text-xs text-[var(--status-negative)]">{errors.birthDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Endereço (opcional)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">CEP</Label>
            <Input
              id="zipCode"
              type="text"
              placeholder="00000-000"
              value={formData.zipCode}
              onChange={(e) => handleChange('zipCode', formatCEP(e.target.value))}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Rua</Label>
            <Input
              id="street"
              type="text"
              placeholder="Nome da rua"
              value={formData.street}
              onChange={(e) => handleChange('street', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              type="text"
              placeholder="123"
              value={formData.number}
              onChange={(e) => handleChange('number', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              type="text"
              placeholder="Apto 101"
              value={formData.complement}
              onChange={(e) => handleChange('complement', e.target.value)}
            />
          </div>
          
          <div className="space-y-2 col-span-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              type="text"
              placeholder="Centro"
              value={formData.neighborhood}
              onChange={(e) => handleChange('neighborhood', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              type="text"
              placeholder="São Paulo"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <select
              id="state"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
            >
              <option value="">Selecione</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contato de emergência */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Contato de emergência (opcional)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Nome</Label>
            <Input
              id="emergencyName"
              type="text"
              placeholder="Nome do contato"
              value={formData.emergencyName}
              onChange={(e) => handleChange('emergencyName', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Telefone</Label>
            <Input
              id="emergencyPhone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.emergencyPhone}
              onChange={(e) => handleChange('emergencyPhone', formatPhone(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergencyRelationship">Parentesco</Label>
            <Input
              id="emergencyRelationship"
              type="text"
              placeholder="Ex: Mãe, Pai, Cônjuge"
              value={formData.emergencyRelationship}
              onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          Voltar
        </Button>
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
}
