'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card, Button, Badge } from '@/components/ui';
import {
  getAcademy,
  updateAcademy,
  type Academy,
  type AccessScannerMode,
} from '@/lib/settings';
import { getCurrentSession } from '@/lib/auth/authService';

type AccessControlState = NonNullable<Academy['preferences']['accessControl']>;
type AcademyPreferencesState = Academy['preferences'];

const DEFAULT_ACCESS_CONTROL: AccessControlState = {
  scannerMode: 'entry_only',
  blockSecondEntryWithoutExit: false,
};

const SCANNER_MODE_OPTIONS: Array<{
  value: AccessScannerMode;
  title: string;
  description: string;
  hint: string;
}> = [
  {
    value: 'entry_only',
    title: 'Somente entrada',
    description: 'Fluxo simples. Todo check-in liberado registra entrada.',
    hint: 'Indicado para academias que não controlam saída no scanner.',
  },
  {
    value: 'separate_entry_exit',
    title: 'Scanners separados de entrada e saída',
    description: 'Cada dispositivo opera em um fluxo fixo: entrada ou saída.',
    hint: 'Use um scanner na catraca de entrada e outro na saída.',
  },
  {
    value: 'single_entry_exit',
    title: 'Scanner único para entrada + saída',
    description: 'O mesmo scanner decide automaticamente se o aluno está entrando ou saindo.',
    hint: 'Ideal para recepção única ou portaria compartilhada.',
  },
];

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 rounded-xl border p-4 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} border-[var(--divider-primary)] bg-[var(--background-primary)]`}>
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`h-6 w-10 rounded-full transition-colors ${checked ? 'bg-[var(--status-info)]' : 'bg-[var(--element-disabled)]'}`}>
          <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--element-primary)]">{label}</p>
        <p className="text-xs text-[var(--element-secondary)] mt-1">{description}</p>
      </div>
    </label>
  );
}

export default function AccessSettingsPage() {
  const router = useRouter();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [accessControl, setAccessControl] = useState<AccessControlState>(DEFAULT_ACCESS_CONTROL);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getAcademy();
        const preferences: AcademyPreferencesState | undefined = data?.preferences as AcademyPreferencesState | undefined;
        setAcademy(data);
        setAccessControl({
          ...DEFAULT_ACCESS_CONTROL,
          ...(preferences?.accessControl || {}),
        });
      } catch (error) {
        console.error('[AccessSettingsPage] Erro ao carregar:', error);
        setErrorMessage('Não foi possível carregar as configurações de acesso.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const hasExitTracking = accessControl.scannerMode !== 'entry_only';

  const scannerShortcuts = useMemo(() => {
    if (accessControl.scannerMode === 'entry_only') {
      return [
        { label: 'Abrir scanner', href: '/scanner?flow=entry' },
      ];
    }

    if (accessControl.scannerMode === 'separate_entry_exit') {
      return [
        { label: 'Scanner de entrada', href: '/scanner?flow=entry' },
        { label: 'Scanner de saída', href: '/scanner?flow=exit' },
      ];
    }

    return [
      { label: 'Scanner automático', href: '/scanner?flow=auto' },
    ];
  }, [accessControl.scannerMode]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const session = await getCurrentSession();
      const userId = session?.user?.id;

      if (!userId) {
        setErrorMessage('Sessão expirada. Faça login novamente.');
        return;
      }

      const result = await updateAcademy(
        {
          preferences: {
            ...((academy?.preferences || {}) as AcademyPreferencesState),
            accessControl,
          },
        },
        userId,
      );

      if (!result.success) {
        setErrorMessage(result.error || 'Não foi possível salvar as configurações.');
        return;
      }

      setAcademy(result.academy || academy);
      setSuccessMessage('Configurações de acesso salvas com sucesso.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('[AccessSettingsPage] Erro ao salvar:', error);
      setErrorMessage('Ocorreu um erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Configurações de Acesso" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">Configurações</Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Acesso</span>
          </div>

          {successMessage && (
            <div className="rounded-xl border border-[var(--status-positive)] bg-[var(--status-positive-background)] px-4 py-3 text-sm text-[var(--status-positive)]">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-[var(--status-negative)] bg-[var(--status-negative-background)] px-4 py-3 text-sm text-[var(--status-negative)]">
              {errorMessage}
            </div>
          )}

          <Card className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--element-primary)]">Operação do scanner</h2>
                <p className="text-sm text-[var(--element-secondary)] mt-1">
                  Defina se a academia usa somente entrada, scanners separados ou um scanner único para entrada e saída.
                </p>
              </div>
              {!loading && (
                <Badge variant="outline">
                  {academy?.tradeName || 'Academia'}
                </Badge>
              )}
            </div>

            <div className="grid gap-3">
              {SCANNER_MODE_OPTIONS.map((option) => {
                const checked = accessControl.scannerMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAccessControl((prev) => ({
                      ...prev,
                      scannerMode: option.value,
                      blockSecondEntryWithoutExit:
                        option.value === 'entry_only' ? false : prev.blockSecondEntryWithoutExit,
                    }))}
                    className={`rounded-2xl border p-4 text-left transition-all ${checked ? 'border-[var(--status-info)] bg-[var(--status-info-background)]' : 'border-[var(--divider-primary)] bg-[var(--background-primary)] hover:border-[var(--status-info)]/50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--element-primary)]">{option.title}</p>
                        <p className="text-sm text-[var(--element-secondary)] mt-1">{option.description}</p>
                        <p className="text-xs text-[var(--element-disabled)] mt-2">{option.hint}</p>
                      </div>
                      {checked && <Badge>Selecionado</Badge>}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--element-primary)]">Regras de presença</h2>
              <p className="text-sm text-[var(--element-secondary)] mt-1">
                Controle como o sistema se comporta quando um aluno tenta entrar novamente sem que exista uma saída registrada.
              </p>
            </div>

            <Toggle
              checked={accessControl.blockSecondEntryWithoutExit}
              onChange={(value) => setAccessControl((prev) => ({ ...prev, blockSecondEntryWithoutExit: value }))}
              disabled={!hasExitTracking}
              label="Bloquear segunda entrada sem saída"
              description={
                hasExitTracking
                  ? 'Quando ativado, o aluno precisa ter uma saída registrada antes de realizar uma nova entrada.'
                  : 'Disponível somente quando a academia registra saída com scanner separado ou scanner automático.'
              }
            />
          </Card>

          <Card className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--element-primary)]">Atalhos do time</h2>
              <p className="text-sm text-[var(--element-secondary)] mt-1">
                Use estes atalhos para abrir rapidamente o scanner no modo correto para a operação configurada.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {scannerShortcuts.map((shortcut) => (
                <button
                  key={shortcut.href}
                  type="button"
                  onClick={() => router.push(shortcut.href)}
                  className="rounded-xl border border-[var(--divider-primary)] bg-[var(--background-primary)] px-4 py-3 text-left hover:border-[var(--status-info)] hover:bg-[var(--status-info-background)] transition-all"
                >
                  <p className="text-sm font-medium text-[var(--element-primary)]">{shortcut.label}</p>
                  <p className="text-xs text-[var(--element-secondary)] mt-1">{shortcut.href}</p>
                </button>
              ))}
            </div>
          </Card>

          <div className="sticky bottom-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/access')}>
              Ir para Acesso
            </Button>
            <Button type="button" onClick={handleSave} disabled={loading || isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar configurações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
