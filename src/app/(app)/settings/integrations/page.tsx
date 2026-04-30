'use client';

import { startTransition, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getAsaasConnectionState,
  testAsaasConnection,
  saveAsaasConfig,
  disconnectAsaas,
  type AsaasConnectionState,
  type AsaasEnvironment,
  type TestConnectionResult,
} from '@/lib/settings/integrationsService';
import { capture } from '@/lib/analytics';

// ============================================================================
// ICONS
// ============================================================================

const icons = {
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  alertCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  copy: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  eyeOff: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  loader: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  creditCard: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  link: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

// ============================================================================
// SKELETON
// ============================================================================

function PageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-48 bg-[var(--background-tertiary)] rounded" />
      <Card className="p-6 border border-[var(--divider-primary)]">
        <div className="h-6 w-32 bg-[var(--background-tertiary)] rounded mb-4" />
        <div className="h-20 bg-[var(--background-tertiary)] rounded mb-4" />
        <div className="h-10 w-32 bg-[var(--background-tertiary)] rounded" />
      </Card>
    </div>
  );
}

// ============================================================================
// WEBHOOK SECTION
// ============================================================================

function WebhookSection({ environment }: { environment: AsaasEnvironment }) {
  const [copied, setCopied] = useState(false);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/asaas/webhooks?environment=${environment}`
      : `/api/asaas/webhooks?environment=${environment}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = webhookUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border border-[var(--divider-primary)]">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-[var(--element-secondary)]">{icons.link}</div>
          <h3 className="font-medium text-[var(--element-primary)] text-sm">
            URL do Webhook
          </h3>
        </div>

        <p className="text-xs text-[var(--element-secondary)] mb-3">
          Cadastre esta URL no painel do Asaas em{' '}
          <strong>Configurações &gt; Integrações &gt; Notificações via webhooks</strong>{' '}
          para sincronização automática de pagamentos e assinaturas.
        </p>

        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 text-xs bg-[var(--background-tertiary)] rounded-lg text-[var(--element-primary)] font-mono truncate border border-[var(--divider-primary)]">
            {webhookUrl}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-shrink-0 gap-1.5"
          >
            {copied ? icons.check : icons.copy}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// CONNECT FORM
// ============================================================================

function AsaasConnectForm({
  initialEnvironment,
  initialApiKey,
  initialAccountName,
  existingAccountId,
  onSaved,
  onCancel,
}: {
  initialEnvironment?: AsaasEnvironment;
  initialApiKey?: string;
  initialAccountName?: string;
  existingAccountId?: string;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [environment, setEnvironment] = useState<AsaasEnvironment>(
    initialEnvironment || 'sandbox'
  );
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [accountName, setAccountName] = useState(initialAccountName || '');
  const [showKey, setShowKey] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    setSaveError(null);

    const result = await testAsaasConnection(apiKey.trim(), environment);
    setTestResult(result);
    setTesting(false);

    // Auto-fill account name if empty and test succeeded
    if (result.success && result.account?.name && !accountName) {
      setAccountName(result.account.name);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setSaveError(null);

    const result = await saveAsaasConfig(
      {
        environment,
        apiKey: apiKey.trim(),
        accountName: accountName.trim() || 'Conta Asaas',
        asaasAccountId: testResult?.account?.id,
        walletId: testResult?.account?.walletId,
      },
      existingAccountId
    );

    setSaving(false);

    if (result.success) {
      capture('asaas_connected', { environment });
      onSaved();
    } else {
      setSaveError(result.error || 'Erro ao salvar configuração');
    }
  };

  const isValid = apiKey.trim().length >= 10;
  const canSave = isValid && testResult?.success;

  return (
    <Card className="border border-[var(--divider-primary)]">
      <div className="p-6">
        <h3 className="font-semibold text-[var(--element-primary)] mb-1">
          {existingAccountId ? 'Editar conexão Asaas' : 'Conectar ao Asaas'}
        </h3>
        <p className="text-sm text-[var(--element-secondary)] mb-6">
          Insira sua API Key do Asaas para começar a cobrar seus alunos.
          Você encontra a chave em{' '}
          <strong>Minha Conta &gt; Integrações &gt; API</strong> no painel do Asaas.
        </p>

        {/* Environment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--element-primary)] mb-1.5">
            Ambiente
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEnvironment('sandbox')}
              className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                environment === 'sandbox'
                  ? 'border-[var(--status-info)] bg-[var(--status-info-background)] text-[var(--status-info)]'
                  : 'border-[var(--divider-primary)] text-[var(--element-secondary)] hover:border-[var(--element-disabled)]'
              }`}
            >
              Sandbox
              <span className="block text-xs font-normal mt-0.5 opacity-75">
                Para testes
              </span>
            </button>
            <button
              type="button"
              onClick={() => setEnvironment('production')}
              className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                environment === 'production'
                  ? 'border-[var(--status-positive)] bg-green-50 dark:bg-green-950/20 text-[var(--status-positive)]'
                  : 'border-[var(--divider-primary)] text-[var(--element-secondary)] hover:border-[var(--element-disabled)]'
              }`}
            >
              Produção
              <span className="block text-xs font-normal mt-0.5 opacity-75">
                Cobranças reais
              </span>
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--element-primary)] mb-1.5">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
                setSaveError(null);
              }}
              placeholder="$aact_..."
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-sm text-[var(--element-primary)] placeholder-[var(--element-disabled)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--status-info)] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--element-secondary)] hover:text-[var(--element-primary)] transition-colors"
            >
              {showKey ? icons.eyeOff : icons.eye}
            </button>
          </div>
        </div>

        {/* Account Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--element-primary)] mb-1.5">
            Nome da conta
            <span className="font-normal text-[var(--element-secondary)]"> (opcional)</span>
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Ex: Academia XPTO"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-sm text-[var(--element-primary)] placeholder-[var(--element-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--status-info)] focus:border-transparent"
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className={testResult.success ? 'text-[var(--status-positive)]' : 'text-[var(--status-negative)]'}>
                {testResult.success ? icons.check : icons.x}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {testResult.success ? 'Conexão validada com sucesso' : 'Falha na conexão'}
                </p>
                {testResult.success && testResult.account && (
                  <div className="mt-1 text-xs text-green-700 dark:text-green-300 space-y-0.5">
                    {testResult.account.name && (
                      <p>Conta: <strong>{testResult.account.name}</strong></p>
                    )}
                    <p>Ambiente: <strong>{environment === 'sandbox' ? 'Sandbox' : 'Produção'}</strong></p>
                  </div>
                )}
                {!testResult.success && testResult.error && (
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {testResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save Error */}
        {saveError && (
          <div className="p-3 rounded-lg mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{saveError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={testing || saving}>
              Cancelar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!isValid || testing || saving}
            className="gap-2"
          >
            {testing && icons.loader}
            {testing ? 'Testando...' : 'Testar conexão'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="gap-2"
          >
            {saving && icons.loader}
            {saving ? 'Salvando...' : existingAccountId ? 'Salvar alterações' : 'Conectar'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// CONNECTED CARD
// ============================================================================

function AsaasConnectedCard({
  state,
  onEdit,
  onDisconnect,
  disconnecting,
}: {
  state: AsaasConnectionState;
  onEdit: () => void;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  const account = state.account!;
  const envLabel = state.environment === 'production' ? 'Produção' : 'Sandbox';

  return (
    <Card className="border border-[var(--divider-primary)]">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-[var(--status-positive)]">
              {icons.creditCard}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--element-primary)]">
                  Asaas
                </h3>
                <Badge variant="success" className="text-xs">
                  Conectado
                </Badge>
              </div>
              <p className="text-xs text-[var(--element-secondary)] mt-0.5">
                Cobranças via PIX, boleto e cartão de crédito
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              disabled={disconnecting}
              className="text-[var(--status-negative)] hover:text-[var(--status-negative)]"
            >
              {disconnecting ? 'Desconectando...' : 'Desconectar'}
            </Button>
          </div>
        </div>

        {/* Details */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--divider-primary)]">
            <p className="text-xs text-[var(--element-secondary)] mb-0.5">Ambiente</p>
            <p className="text-sm font-medium text-[var(--element-primary)]">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  state.environment === 'production'
                    ? 'bg-[var(--status-positive)]'
                    : 'bg-[var(--status-info)]'
                }`}
              />
              {envLabel}
            </p>
          </div>
          {account.accountName && (
            <div className="p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--divider-primary)]">
              <p className="text-xs text-[var(--element-secondary)] mb-0.5">Conta</p>
              <p className="text-sm font-medium text-[var(--element-primary)] truncate">
                {account.accountName}
              </p>
            </div>
          )}
          <div className="p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--divider-primary)]">
            <p className="text-xs text-[var(--element-secondary)] mb-0.5">API Key</p>
            <p className="text-sm font-mono text-[var(--element-primary)]">
              ••••••••{account.apiKeyReference?.slice(-8) || ''}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// NOT CONFIGURED CARD
// ============================================================================

function AsaasNotConfiguredCard({ onConnect }: { onConnect: () => void }) {
  return (
    <Card className="border border-[var(--divider-primary)]">
      <div className="p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-xl bg-[var(--background-tertiary)] flex items-center justify-center text-[var(--element-secondary)] mb-4">
          {icons.creditCard}
        </div>
        <h3 className="text-lg font-semibold text-[var(--element-primary)] mb-1">
          Comece a cobrar seus alunos
        </h3>
        <p className="text-sm text-[var(--element-secondary)] max-w-md mx-auto mb-6">
          Conecte sua conta Asaas para habilitar cobranças automáticas via PIX,
          boleto bancário e cartão de crédito. A configuração leva menos de 2 minutos.
        </p>
        <Button onClick={onConnect} className="gap-2">
          {icons.creditCard}
          Configurar Asaas
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// ERROR CARD
// ============================================================================

function AsaasErrorCard({
  state,
  onEdit,
}: {
  state: AsaasConnectionState;
  onEdit: () => void;
}) {
  return (
    <Card className="border border-[var(--status-negative)]">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-[var(--status-negative)]">
            {icons.alertCircle}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[var(--element-primary)]">Asaas</h3>
              <Badge variant="destructive" className="text-xs">Requer atenção</Badge>
            </div>
            <p className="text-sm text-[var(--element-secondary)] mb-3">
              {!state.hasApiKey
                ? 'A API Key não está configurada. Configure-a para habilitar cobranças.'
                : 'A conexão com o Asaas apresenta problemas. Verifique sua configuração.'}
            </p>
            <Button size="sm" onClick={onEdit} className="gap-2">
              Corrigir configuração
              {icons.arrowRight}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// COMING SOON SECTION
// ============================================================================

function ComingSoonSection() {
  const items = [
    { name: 'Stripe', desc: 'Pagamentos internacionais', icon: '💳' },
    { name: 'Notificações', desc: 'WhatsApp e e-mail automáticos', icon: '📱' },
    { name: 'NF-e', desc: 'Emissão de notas fiscais', icon: '📄' },
  ];

  return (
    <div>
      <h3 className="text-xs font-medium text-[var(--element-disabled)] uppercase tracking-wider mb-3">
        Em breve
      </h3>
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="p-3 rounded-lg border border-dashed border-[var(--divider-primary)] opacity-60"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-[var(--element-secondary)]">
                  {item.name}
                </p>
                <p className="text-xs text-[var(--element-disabled)]">
                  {item.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<AsaasConnectionState | null>(null);
  const [mode, setMode] = useState<'view' | 'form'>('view');
  const [disconnecting, setDisconnecting] = useState(false);

  const loadState = useCallback(async () => {
    const state = await getAsaasConnectionState();
    setConnectionState(state);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getAsaasConnectionState().then((state) => {
      if (cancelled) {
        return;
      }

      startTransition(() => {
        setConnectionState(state);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDisconnect = async () => {
    if (!connectionState?.account) return;
    if (!confirm('Deseja desconectar o Asaas? Cobranças ativas não serão canceladas.')) return;

    setDisconnecting(true);
    setLoading(true);
    await disconnectAsaas(connectionState.account.id);
    setDisconnecting(false);
    setMode('view');
    await loadState();
  };

  const handleSaved = async () => {
    setMode('view');
    setLoading(true);
    await loadState();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Cobrança & Integrações" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">
              Configurações
            </Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Cobrança & Integrações</span>
          </div>

          {loading ? (
            <PageSkeleton />
          ) : (
            <>
              {/* Section: Cobrança */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[var(--element-secondary)]">{icons.creditCard}</div>
                  <h2 className="text-lg font-bold text-[var(--element-primary)]">
                    Cobrança
                  </h2>
                </div>

                {mode === 'form' ? (
                  <AsaasConnectForm
                    initialEnvironment={connectionState?.environment || undefined}
                    initialApiKey={connectionState?.account?.apiKeyReference || undefined}
                    initialAccountName={connectionState?.account?.accountName || undefined}
                    existingAccountId={connectionState?.account?.id}
                    onSaved={handleSaved}
                    onCancel={
                      connectionState?.status !== 'not_configured'
                        ? () => setMode('view')
                        : undefined
                    }
                  />
                ) : connectionState?.status === 'connected' ? (
                  <AsaasConnectedCard
                    state={connectionState}
                    onEdit={() => setMode('form')}
                    onDisconnect={handleDisconnect}
                    disconnecting={disconnecting}
                  />
                ) : connectionState?.status === 'error' ? (
                  <AsaasErrorCard
                    state={connectionState}
                    onEdit={() => setMode('form')}
                  />
                ) : (
                  <AsaasNotConfiguredCard onConnect={() => setMode('form')} />
                )}
              </div>

              {/* Section: Webhook (only if connected) */}
              {connectionState?.status === 'connected' && connectionState.environment && (
                <WebhookSection environment={connectionState.environment} />
              )}

              {/* Security note */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--background-primary)] border border-[var(--divider-primary)]">
                <div className="text-[var(--element-disabled)] flex-shrink-0 mt-0.5">
                  {icons.shield}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--element-primary)] mb-0.5">
                    Seus dados estão seguros
                  </p>
                  <p className="text-xs text-[var(--element-secondary)]">
                    Sua API Key é armazenada com segurança e nunca é compartilhada.
                    Toda comunicação com o Asaas é feita via HTTPS com validação de token.
                  </p>
                </div>
              </div>

              {/* Coming Soon */}
              <ComingSoonSection />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
