'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Label } from '@/components/ui';
import {
  buildWhatsAppInviteUrl,
  createInviteLink,
  getInviteUrl,
  type InviteLink,
} from '@/lib/invites/inviteLinksService';
import { getAcademy, getUnits, type Unit } from '@/lib/settings/settingsServiceSupabase';

// ============================================
// TIPOS
// ============================================

interface InviteGeneratorProps {
  onClose?: () => void;
  onInviteCreated?: (invite: InviteLink) => void;
}

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
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [expectedEmail, setExpectedEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState<InviteLink | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [emailSendStatus, setEmailSendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [academyName, setAcademyName] = useState<string>('a academia');

  const selectedUnitName = units.find((unit) => unit.id === selectedUnit)?.name || null;

  function buildDefaultMessage(invite: InviteLink): string {
    const inviteUrl = getInviteUrl(invite.token);
    const academyLabel = selectedUnitName || 'a academia';
    const greeting = recipientName.trim() ? `Oi, ${recipientName.trim()}!` : 'Oi!';

    return [
      greeting,
      '',
      `Seu convite de cadastro no MoveAccess para ${academyLabel} já está pronto.`,
      'Use o link abaixo para iniciar seu cadastro:',
      inviteUrl,
      '',
      'Esse convite é pessoal e fica vinculado ao e-mail informado na academia.',
    ].join('\n');
  }

  useEffect(() => {
    let cancelled = false;
    async function loadUnits() {
      setIsLoadingUnits(true);
      const [unitList, academy] = await Promise.all([getUnits(), getAcademy()]);
      if (!cancelled) {
        setUnits(unitList);
        if (unitList.length > 0) setSelectedUnit(unitList[0].id);
        if (academy?.tradeName) setAcademyName(academy.tradeName);
        setIsLoadingUnits(false);
      }
    }
    loadUnits();
    return () => { cancelled = true; };
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setEmailSendStatus('idle');

    const result = await createInviteLink({
      expectedEmail,
      unitId: selectedUnit || null,
      recipientName: recipientName.trim() || null,
      recipientPhone: recipientPhone.trim() || null,
      description: description.trim() || null,
    });

    setIsGenerating(false);

    if (!result.success || !result.invite) {
      setError(result.error || 'Erro ao gerar link de convite.');
      return;
    }

    setGeneratedInvite(result.invite);
    setShareMessage(buildDefaultMessage(result.invite));
    setStep('generated');
    onInviteCreated?.(result.invite);

    // Analytics
    const { capture } = await import('@/lib/analytics');
    capture('student_invited', {});

    // Fire-and-forget: send invite email
    triggerInviteEmail(result.invite);
  };

  const triggerInviteEmail = async (invite: InviteLink) => {
    if (!invite.expectedEmail) return;

    setEmailSendStatus('sending');
    try {
      const response = await fetch('/api/notifications/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId: invite.id,
          token: invite.token,
          academyId: invite.academyId,
          academyName,
          recipientEmail: invite.expectedEmail,
          recipientName: invite.recipientName,
          expiresAt: invite.expiresAt,
        }),
      });
      const data = await response.json();
      setEmailSendStatus(response.ok && data.ok ? 'sent' : 'failed');
    } catch {
      setEmailSendStatus('failed');
    }
  };

  const handleCopyLink = async () => {
    if (!generatedInvite) return;

    const url = getInviteUrl(generatedInvite.token);
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(shareMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!generatedInvite) return;

    const shareUrl = buildWhatsAppInviteUrl(generatedInvite.recipientPhone, shareMessage);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNewInvite = () => {
    setStep('config');
    setGeneratedInvite(null);
    setCopiedLink(false);
    setCopiedMessage(false);
    setRecipientName('');
    setExpectedEmail('');
    setRecipientPhone('');
    setDescription('');
    setShareMessage('');
    setEmailSendStatus('idle');
  };

  if (step === 'generated' && generatedInvite) {
    const url = getInviteUrl(generatedInvite.token);
    const unitName = units.find((unit) => unit.id === generatedInvite.unitId)?.name;

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
          {emailSendStatus === 'sending' && (
            <p className="text-xs text-[var(--text-tertiary)] flex items-center justify-center gap-1">
              <span className="w-3 h-3 border-2 border-[var(--element-primary)] border-t-transparent rounded-full animate-spin" />
              Enviando convite por e-mail...
            </p>
          )}
          {emailSendStatus === 'sent' && (
            <p className="text-xs text-[var(--status-positive)] flex items-center justify-center gap-1">
              <CheckIcon className="w-3 h-3" />
              E-mail de convite enviado
            </p>
          )}
          {emailSendStatus === 'failed' && (
            <p className="text-xs text-[var(--status-negative)]">
              Não foi possível enviar o e-mail. Use as opções abaixo para compartilhar.
            </p>
          )}
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
            <Button onClick={handleCopyLink} variant={copiedLink ? 'secondary' : 'default'}>
              {copiedLink ? (
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
            {unitName && (
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-tertiary)]">Unidade</span>
                <span className="text-right text-[var(--text-primary)]">{unitName}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-tertiary)]">E-mail vinculado</span>
              <span className="text-right text-[var(--text-primary)]">{generatedInvite.expectedEmail}</span>
            </div>
            {generatedInvite.recipientPhone && (
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-tertiary)]">WhatsApp</span>
                <span className="text-right text-[var(--text-primary)]">{generatedInvite.recipientPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Validade</span>
              <span className="text-[var(--text-primary)]">
                {new Date(generatedInvite.expiresAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {generatedInvite.description && (
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Descrição</span>
                <span className="text-[var(--text-primary)]">{generatedInvite.description}</span>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="shareMessage">Mensagem para compartilhar</Label>
          <textarea
            id="shareMessage"
            value={shareMessage}
            onChange={(event) => setShareMessage(event.target.value)}
            rows={7}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <p className="text-xs text-[var(--text-tertiary)]">
            A mensagem pode ser ajustada antes do envio. O link continua pessoal e vinculado ao e-mail informado.
          </p>
        </div>

        {/* Info */}
        <div className="p-4 bg-[var(--element-primary)]/5 rounded-lg">
          <p className="text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Como funciona:</strong> no primeiro acesso o convite fica claimado para essa pessoa.
            Depois disso, ela continua o cadastro por login real, sem depender do mesmo link para sempre.
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="secondary" onClick={handleCopyMessage}>
            {copiedMessage ? 'Mensagem copiada' : 'Copiar mensagem'}
          </Button>
          <Button variant="outline" onClick={handleOpenWhatsApp}>
            Compartilhar no WhatsApp
          </Button>
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
          O convite fica vinculado ao e-mail do convidado e o claim inicial passa a reservar o fluxo para essa pessoa.
        </p>
      </div>

      {/* Unidade */}
      {isLoadingUnits ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span className="w-4 h-4 border-2 border-[var(--element-primary)] border-t-transparent rounded-full animate-spin" />
          Carregando unidades...
        </div>
      ) : units.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="unit">Unidade</Label>
          <select
            id="unit"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recipientName">Nome do convidado (opcional)</Label>
          <Input
            id="recipientName"
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            placeholder="Ex: Ana Souza"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedEmail">E-mail do convidado *</Label>
          <Input
            id="expectedEmail"
            type="email"
            value={expectedEmail}
            onChange={(event) => setExpectedEmail(event.target.value)}
            placeholder="ana@email.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientPhone">WhatsApp (opcional)</Label>
        <Input
          id="recipientPhone"
          type="tel"
          value={recipientPhone}
          onChange={(event) => setRecipientPhone(event.target.value)}
          placeholder="11999999999"
        />
      </div>

      {/* Descrição opcional */}
      <div className="space-y-2">
        <Label htmlFor="description">Observação (opcional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Indicação do João, promoção de verão..."
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--status-negative)]">{error}</p>
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
            O claim inicial exige o e-mail vinculado ao convite
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--element-primary)] rounded-full mt-1.5 flex-shrink-0" />
            Depois do claim, o convidado continua por login real
          </li>
        </ul>
      </Card>

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Gerando...
            </span>
          ) : (
            'Gerar link'
          )}
        </Button>
      </div>
    </div>
  );
}
