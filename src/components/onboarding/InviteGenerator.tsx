'use client';

import { useState } from 'react';
import { Button, Card, Input, Label } from '@/components/ui';
import { 
  Invite, 
  InviteDiscount, 
  createInvite, 
  getInviteUrl 
} from '@/mocks/inviteMock';

// ============================================
// TIPOS
// ============================================

interface InviteGeneratorProps {
  onClose?: () => void;
  onInviteCreated?: (invite: Invite) => void;
}

// Mock de unidades
const mockUnits = [
  { id: 'unit-1', name: 'Academia Move - Unidade Centro' },
  { id: 'unit-2', name: 'Academia Move - Unidade Norte' },
  { id: 'unit-3', name: 'Academia Move - Unidade Sul' },
];

// ============================================
// ICONS
// ============================================

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

// ============================================
// COMPONENTE
// ============================================

export function InviteGenerator({ onClose, onInviteCreated }: InviteGeneratorProps) {
  const [step, setStep] = useState<'config' | 'generated'>('config');
  const [selectedUnit, setSelectedUnit] = useState(mockUnits[0].id);
  const [enrollmentValue, setEnrollmentValue] = useState(100);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [generatedInvite, setGeneratedInvite] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);

  const finalValue = enrollmentValue - (enrollmentValue * discountPercent / 100);
  const hasDiscount = discountPercent > 0 && enrollmentValue > 0;

  const handleGenerate = () => {
    const unit = mockUnits.find(u => u.id === selectedUnit);
    if (!unit) return;

    let discount: InviteDiscount | undefined;
    if (hasDiscount) {
      discount = {
        type: 'percentage',
        value: discountPercent,
        appliesTo: 'enrollment',
        description: enrollmentValue === finalValue 
          ? 'Matrícula grátis' 
          : `${discountPercent}% de desconto na matrícula`,
      };
    }

    const invite = createInvite(
      unit.id,
      unit.name,
      'academy-1',
      'operator-current',
      discount
    );

    setGeneratedInvite(invite);
    setStep('generated');
    onInviteCreated?.(invite);
  };

  const handleCopy = async () => {
    if (!generatedInvite) return;
    
    const url = getInviteUrl(generatedInvite.token);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewInvite = () => {
    setStep('config');
    setGeneratedInvite(null);
    setCopied(false);
  };

  if (step === 'generated' && generatedInvite) {
    const url = getInviteUrl(generatedInvite.token);
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-[var(--status-positive)]/10 rounded-full flex items-center justify-center">
            <LinkIcon className="w-8 h-8 text-[var(--status-positive)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Link gerado com sucesso!
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Copie e envie para o futuro aluno
          </p>
        </div>

        {/* Link */}
        <div className="space-y-2">
          <Label>Link de cadastro</Label>
          <div className="flex gap-2">
            <Input
              value={url}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={handleCopy} variant={copied ? 'secondary' : 'default'}>
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <Card className="p-4 bg-[var(--background-secondary)] border-none">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Unidade</span>
              <span className="text-[var(--text-primary)]">{generatedInvite.unitName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Validade</span>
              <span className="text-[var(--text-primary)]">
                {new Date(generatedInvite.expiresAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {generatedInvite.discount && (
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Desconto</span>
                <span className="text-[var(--status-positive)]">
                  {generatedInvite.discount.description}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Info */}
        <div className="p-4 bg-[var(--element-primary)]/5 rounded-lg">
          <p className="text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">📱 Dica:</strong> Você pode enviar esse link via WhatsApp, 
            e-mail, SMS ou qualquer outro meio. Quando o usuário iniciar o cadastro, 
            você será notificado automaticamente.
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="outline" onClick={handleNewInvite}>
            Gerar novo link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Gerar link de cadastro
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          O aluno poderá se cadastrar sozinho usando este link.
        </p>
      </div>

      {/* Unidade */}
      <div className="space-y-2">
        <Label htmlFor="unit">Unidade</Label>
        <select
          id="unit"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
        >
          {mockUnits.map(unit => (
            <option key={unit.id} value={unit.id}>{unit.name}</option>
          ))}
        </select>
      </div>

      {/* Valor da matrícula */}
      <div className="space-y-2">
        <Label htmlFor="enrollment">Valor da matrícula</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">R$</span>
          <Input
            id="enrollment"
            type="number"
            min="0"
            step="10"
            value={enrollmentValue}
            onChange={(e) => setEnrollmentValue(Number(e.target.value))}
            className="pl-10"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Desconto (só aparece se matrícula > 0) */}
      {enrollmentValue > 0 && (
        <div className="space-y-2">
          <Label htmlFor="discount">Desconto (%)</Label>
          <Input
            id="discount"
            type="text"
            inputMode="numeric"
            value={discountPercent}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              const numValue = value ? Math.min(parseInt(value), 100) : 0;
              setDiscountPercent(numValue);
            }}
            placeholder="0"
          />
        </div>
      )}

      {/* Valor final */}
      {enrollmentValue > 0 && (
        <Card className="p-4 bg-[var(--background-secondary)] border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">Valor final da matrícula</p>
              {hasDiscount && (
                <p className="text-xs text-[var(--status-positive)] mt-0.5">
                  Economia de R$ {(enrollmentValue - finalValue).toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              R$ {finalValue.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="p-4 bg-[var(--background-secondary)] border-none">
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--element-primary)] rounded-full mt-1.5 flex-shrink-0" />
            O link terá validade de 7 dias
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--element-primary)] rounded-full mt-1.5 flex-shrink-0" />
            Você receberá um alerta quando o cadastro for iniciado
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--element-primary)] rounded-full mt-1.5 flex-shrink-0" />
            Um pré-cadastro será criado para acompanhamento
          </li>
        </ul>
      </Card>

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleGenerate}>
          Gerar link
        </Button>
      </div>
    </div>
  );
}
