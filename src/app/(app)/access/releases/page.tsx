'use client';

import { useState, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  findUserByIdentifier,
  manualAccessRelease,
  mockUnits,
  getUnitQRConfig,
  toggleUnitQR,
  regenerateUnitQR,
  formatCpf,
  getUserTypeLabel,
  type AccessUser,
  type QRConfig,
} from '@/mocks/accessMock';

// Ícones inline
const icons = {
  back: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  qr: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
  copy: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  toggle: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
  ),
};

type TabType = 'manual' | 'qr';

const TABS: { id: TabType; label: string }[] = [
  { id: 'manual', label: 'Liberação Manual' },
  { id: 'qr', label: 'Configuração QR' },
];

const RELEASE_REASONS = [
  'Primeiro acesso - cadastro incompleto',
  'Problema técnico no QR Code',
  'Usuário sem celular',
  'Visitante autorizado',
  'Cortesia/Promoção',
  'Outro (especificar)',
];

export default function AccessReleasesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('manual');

  return (
    <div className="min-h-screen bg-[var(--background-primary)]">
      <Header title="Liberações" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/access"
            className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            {icons.back}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--element-primary)]">
              Liberações
            </h1>
            <p className="text-sm text-[var(--element-secondary)]">
              Liberação manual e configuração de QR Code
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--divider-primary)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[var(--element-accent)]'
                  : 'text-[var(--element-secondary)] hover:text-[var(--element-primary)]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--element-accent)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'manual' ? <ManualReleaseSection /> : <QRConfigSection />}
      </main>
    </div>
  );
}

// ============================================================================
// MANUAL RELEASE SECTION
// ============================================================================

function ManualReleaseSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<AccessUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState(false);

  const handleSearch = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setNotFound(false);
      setFoundUser(null);
      setReleaseSuccess(false);

      // Simula delay de busca
      setTimeout(() => {
        const user = findUserByIdentifier(searchQuery);
        if (user) {
          setFoundUser(user);
        } else {
          setNotFound(true);
        }
        setIsLoading(false);
      }, 500);
    },
    [searchQuery]
  );

  const handleRelease = useCallback(() => {
    if (!foundUser) return;

    const reason =
      selectedReason === 'Outro (especificar)' ? customReason : selectedReason;
    if (!reason.trim()) {
      alert('Por favor, informe o motivo da liberação.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = manualAccessRelease(
        foundUser.id,
        mockUnits[0].id,
        'admin_001',
        reason
      );

      if (result.allowed) {
        setReleaseSuccess(true);
      }
      setIsLoading(false);
    }, 500);
  }, [foundUser, selectedReason, customReason]);

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setFoundUser(null);
    setNotFound(false);
    setSelectedReason('');
    setCustomReason('');
    setReleaseSuccess(false);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Search Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-4">
          Buscar Usuário
        </h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <Label htmlFor="search">CPF, E-mail ou Telefone</Label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--element-disabled)]">
                {icons.search}
              </div>
              <Input
                id="search"
                type="text"
                placeholder="Digite o CPF, e-mail ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!searchQuery.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </form>

        {/* Not Found */}
        {notFound && (
          <div className="mt-4 p-4 rounded-lg bg-[var(--status-negative-background)] text-[var(--status-negative)]">
            <p className="text-sm font-medium">Usuário não encontrado</p>
            <p className="text-xs mt-1">Verifique os dados e tente novamente.</p>
          </div>
        )}
      </Card>

      {/* User Card & Release Form */}
      <Card className="p-6">
        {!foundUser ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="p-4 rounded-full bg-[var(--background-tertiary)] text-[var(--element-disabled)] mb-4">
              {icons.user}
            </div>
            <p className="text-[var(--element-secondary)]">
              Busque um usuário para liberar acesso
            </p>
          </div>
        ) : releaseSuccess ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="p-4 rounded-full bg-[var(--status-positive-background)] text-[var(--status-positive)] mb-4">
              {icons.check}
            </div>
            <p className="text-xl font-bold text-[var(--status-positive)] mb-2">
              Acesso Liberado!
            </p>
            <p className="text-[var(--element-secondary)] mb-4">
              {foundUser.name} pode entrar na academia.
            </p>
            <Button variant="outline" onClick={handleReset}>
              Nova Liberação
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-[var(--background-tertiary)] text-[var(--element-primary)]">
                {icons.user}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[var(--element-primary)]">
                  {foundUser.name}
                </h3>
                <p className="text-sm text-[var(--element-secondary)]">
                  {formatCpf(foundUser.cpf)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{getUserTypeLabel(foundUser.type)}</Badge>
                  <Badge
                    variant={
                      foundUser.planStatus === 'active'
                        ? 'default'
                        : foundUser.planStatus === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {foundUser.planName || 'Sem plano'}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                {icons.x}
              </Button>
            </div>

            {/* Warning if plan is not active */}
            {foundUser.planStatus !== 'active' && (
              <div className="p-3 rounded-lg bg-[var(--status-alert-background)] text-[var(--status-alert)]">
                <p className="text-sm font-medium">
                  ⚠️ Plano {foundUser.planStatus === 'expired' ? 'expirado' : 'pendente'}
                </p>
                <p className="text-xs mt-1">
                  A liberação será registrada com esta informação.
                </p>
              </div>
            )}

            {/* Release Reason */}
            <div>
              <Label htmlFor="reason">Motivo da Liberação *</Label>
              <select
                id="reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--divider-secondary)] bg-[var(--background-primary)] text-sm text-[var(--element-primary)]"
              >
                <option value="">Selecione o motivo...</option>
                {RELEASE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Reason */}
            {selectedReason === 'Outro (especificar)' && (
              <div>
                <Label htmlFor="customReason">Especifique o motivo *</Label>
                <Input
                  id="customReason"
                  type="text"
                  placeholder="Descreva o motivo..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {/* Release Button */}
            <Button
              onClick={handleRelease}
              disabled={
                isLoading ||
                !selectedReason ||
                (selectedReason === 'Outro (especificar)' && !customReason.trim())
              }
              className="w-full"
            >
              {isLoading ? 'Liberando...' : 'Liberar Acesso'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// QR CONFIG SECTION
// ============================================================================

function QRConfigSection() {
  const [selectedUnitId, setSelectedUnitId] = useState(mockUnits[0].id);
  const [qrConfig, setQrConfig] = useState<QRConfig | null>(() =>
    getUnitQRConfig(mockUnits[0].id)
  );
  const [copied, setCopied] = useState(false);

  const handleUnitChange = useCallback((unitId: string) => {
    setSelectedUnitId(unitId);
    setQrConfig(getUnitQRConfig(unitId));
  }, []);

  const handleToggleQR = useCallback(() => {
    const newStatus = toggleUnitQR(selectedUnitId);
    setQrConfig((prev) => (prev ? { ...prev, qrEnabled: newStatus } : null));
  }, [selectedUnitId]);

  const handleRegenerateQR = useCallback(() => {
    const newToken = regenerateUnitQR(selectedUnitId);
    if (newToken) {
      setQrConfig((prev) =>
        prev ? { ...prev, qrToken: newToken, generatedAt: new Date() } : null
      );
    }
  }, [selectedUnitId]);

  const handleCopyToken = useCallback(() => {
    if (qrConfig?.qrToken) {
      navigator.clipboard.writeText(qrConfig.qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [qrConfig]);

  const handleDownloadQR = useCallback(() => {
    // Mock: Em produção geraria o QR Code e faria download
    alert('Funcionalidade de download será implementada com integração real.');
  }, []);

  const checkInUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/acesso/checkin?unit=${selectedUnitId}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Unit Selector */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-4">
          Selecione a Unidade
        </h2>

        <div className="space-y-3">
          {mockUnits.map((unit) => (
            <button
              key={unit.id}
              onClick={() => handleUnitChange(unit.id)}
              className={`w-full p-4 rounded-lg border transition-all text-left ${
                selectedUnitId === unit.id
                  ? 'border-[var(--element-accent)] bg-[var(--background-tertiary)]'
                  : 'border-[var(--divider-secondary)] hover:border-[var(--divider-primary)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--element-primary)]">
                    {unit.name}
                  </p>
                  <p className="text-sm text-[var(--element-secondary)]">
                    {unit.address}
                  </p>
                </div>
                <Badge variant={unit.qrEnabled ? 'default' : 'secondary'}>
                  {unit.qrEnabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* QR Config */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--element-primary)]">
            Configuração do QR Code
          </h2>
          <Badge variant={qrConfig?.qrEnabled ? 'default' : 'destructive'}>
            {qrConfig?.qrEnabled ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {qrConfig && (
          <div className="space-y-6">
            {/* QR Preview */}
            <div className="flex flex-col items-center p-6 rounded-lg bg-[var(--background-secondary)]">
              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center mb-4">
                {/* Mock QR Code visual */}
                <div className="w-24 h-24 border-4 border-black rounded relative">
                  <div className="absolute top-1 left-1 w-6 h-6 bg-black rounded-sm" />
                  <div className="absolute top-1 right-1 w-6 h-6 bg-black rounded-sm" />
                  <div className="absolute bottom-1 left-1 w-6 h-6 bg-black rounded-sm" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {icons.qr}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--element-secondary)] text-center">
                {qrConfig.unitName}
              </p>
            </div>

            {/* Token Info */}
            <div>
              <Label>Token do QR Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="text"
                  value={qrConfig.qrToken}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToken}
                  title="Copiar token"
                >
                  {copied ? icons.check : icons.copy}
                </Button>
              </div>
            </div>

            {/* Check-in URL */}
            <div>
              <Label>URL de Check-in</Label>
              <Input
                type="text"
                value={checkInUrl}
                readOnly
                className="mt-1 text-xs"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2"
              >
                {icons.download}
                Baixar QR
              </Button>
              <Button
                variant="outline"
                onClick={handleRegenerateQR}
                className="flex items-center justify-center gap-2"
              >
                {icons.refresh}
                Regenerar
              </Button>
            </div>

            {/* Toggle Active */}
            <Button
              variant={qrConfig.qrEnabled ? 'destructive' : 'default'}
              onClick={handleToggleQR}
              className="w-full"
            >
              {qrConfig.qrEnabled ? 'Desativar QR Code' : 'Ativar QR Code'}
            </Button>

            {!qrConfig.qrEnabled && (
              <p className="text-xs text-[var(--status-alert)] text-center">
                ⚠️ Com o QR Code desativado, usuários não poderão fazer check-in
                automático nesta unidade.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
