'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';

interface StepIdentificationProps {
  session: OnboardingSession;
  onNext: (data: OnboardingSession['collectedData']['identification']) => void;
  onBack?: () => void;
}

export function StepIdentification({ session, onNext, onBack }: StepIdentificationProps) {
  const [formData, setFormData] = useState({
    fullName: session.collectedData.identification?.fullName || '',
    email: session.collectedData.identification?.email || '',
    phone: session.collectedData.identification?.phone || '',
    userType: session.collectedData.identification?.userType || 'student',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})/, '($1) ')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .trim();
    }
    return formData.phone;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome é obrigatório';
    } else if (formData.fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Informe o nome completo';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone incompleto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        userType: formData.userType as 'student' | 'personal',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Identificação
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Vamos começar com as informações básicas do novo usuário.
        </p>
      </div>

      <div className="space-y-4">
        {/* Tipo de usuário */}
        <div className="space-y-2">
          <Label>Tipo de usuário</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="userType"
                value="student"
                checked={formData.userType === 'student'}
                onChange={(e) => handleChange('userType', e.target.value)}
                className="w-4 h-4 text-[var(--element-primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Aluno</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="userType"
                value="personal"
                checked={formData.userType === 'personal'}
                onChange={(e) => handleChange('userType', e.target.value)}
                className="w-4 h-4 text-[var(--element-primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Personal Trainer</span>
            </label>
          </div>
        </div>

        {/* Nome completo */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Ex: João da Silva"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={errors.fullName ? 'border-[var(--status-negative)]' : ''}
          />
          {errors.fullName && (
            <p className="text-xs text-[var(--status-negative)]">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Ex: joao@email.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={errors.email ? 'border-[var(--status-negative)]' : ''}
          />
          {errors.email && (
            <p className="text-xs text-[var(--status-negative)]">{errors.email}</p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={formData.phone}
            onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
            className={errors.phone ? 'border-[var(--status-negative)]' : ''}
          />
          {errors.phone && (
            <p className="text-xs text-[var(--status-negative)]">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={!onBack}
        >
          Cancelar
        </Button>
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
}
