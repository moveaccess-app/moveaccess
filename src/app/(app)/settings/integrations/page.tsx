'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getIntegrations, updateIntegration, type Integration } from '@/mocks/settingsMock';

const INTEGRATION_ICONS: Record<string, string> = {
  stripe: '💳',
  pix: '🟢',
  twilio: '📱',
  sendgrid: '📧',
  nfe: '📄',
};

function getStatusInfo(status: Integration['status']) {
  const info = {
    connected: { label: 'Funcionando', variant: 'success' as const, color: 'text-[var(--status-positive)]' },
    disconnected: { label: 'Desconectado', variant: 'default' as const, color: 'text-[var(--element-secondary)]' },
    error: { label: 'Atenção', variant: 'destructive' as const, color: 'text-[var(--status-negative)]' },
    pending: { label: 'Configurando', variant: 'warning' as const, color: 'text-[var(--status-alert)]' },
  };
  return info[status];
}

// Card de integração simples
function IntegrationCard({ 
  integration, 
  onConnect, 
  onDisconnect 
}: { 
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const statusInfo = getStatusInfo(integration.status);
  const isConnected = integration.status === 'connected';
  const hasError = integration.status === 'error';

  return (
    <Card className={`p-4 ${hasError ? 'border-[var(--status-negative)]' : ''}`}>
      <div className="flex items-center gap-4">
        {/* Ícone */}
        <div className="text-3xl">
          {INTEGRATION_ICONS[integration.provider] || '🔌'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[var(--element-primary)]">{integration.name}</h3>
            <Badge variant={statusInfo.variant} className="text-xs">
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-[var(--element-secondary)]">
            {integration.description}
          </p>
        </div>

        {/* Ação */}
        <div className="flex-shrink-0">
          {isConnected ? (
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              Desconectar
            </Button>
          ) : (
            <Button size="sm" onClick={onConnect}>
              Conectar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Modal simples de conexão
function ConnectModal({
  integration,
  onClose,
  onSuccess,
}: {
  integration: Integration;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simular conexão
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    updateIntegration(integration.id, {
      status: 'connected',
      lastSyncAt: new Date(),
    }, 'staff_001');

    setIsConnecting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{INTEGRATION_ICONS[integration.provider] || '🔌'}</span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--element-primary)]">
                Conectar {integration.name}
              </h2>
              <p className="text-sm text-[var(--element-secondary)]">
                {integration.description}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--background-tertiary)] mb-6">
            <p className="text-sm text-[var(--element-secondary)]">
              Você será redirecionado para autenticar com {integration.name}. 
              Suas credenciais são gerenciadas diretamente pelo provedor.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? 'Conectando...' : 'Conectar'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(() => getIntegrations());
  const [connectingIntegration, setConnectingIntegration] = useState<Integration | null>(null);

  // Agrupar por tipo
  const paymentIntegrations = integrations.filter((i) => i.type === 'payment');
  const notificationIntegrations = integrations.filter((i) => i.type === 'notification');
  const otherIntegrations = integrations.filter((i) => !['payment', 'notification'].includes(i.type));

  // Verificar se há erros
  const hasErrors = integrations.some((i) => i.status === 'error');

  const handleDisconnect = (integration: Integration) => {
    if (confirm(`Deseja desconectar ${integration.name}?`)) {
      updateIntegration(integration.id, { status: 'disconnected' }, 'staff_001');
      setIntegrations(getIntegrations());
    }
  };

  const handleConnectSuccess = () => {
    setIntegrations(getIntegrations());
  };

  const renderSection = (title: string, items: Integration[]) => {
    if (items.length === 0) return null;
    
    return (
      <div>
        <h3 className="text-sm font-medium text-[var(--element-secondary)] mb-3">{title}</h3>
        <div className="space-y-3">
          {items.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={() => setConnectingIntegration(integration)}
              onDisconnect={() => handleDisconnect(integration)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Integrações" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">
              Configurações
            </Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Integrações</span>
          </div>

          {/* Alerta de erro (se houver) */}
          {hasErrors && (
            <Card className="p-4 border-[var(--status-alert)] bg-[var(--status-alert-background)]">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[var(--status-alert)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-[var(--status-alert)]">
                  Uma ou mais integrações precisam de atenção.
                </p>
              </div>
            </Card>
          )}

          {/* Descrição */}
          <p className="text-sm text-[var(--element-secondary)]">
            Conecte serviços externos para pagamentos, notificações e outras funcionalidades.
          </p>

          {/* Seções */}
          <div className="space-y-8">
            {renderSection('Pagamentos', paymentIntegrations)}
            {renderSection('Notificações', notificationIntegrations)}
            {renderSection('Outros Serviços', otherIntegrations)}
          </div>
        </div>
      </div>

      {/* Modal de conexão */}
      {connectingIntegration && (
        <ConnectModal
          integration={connectingIntegration}
          onClose={() => setConnectingIntegration(null)}
          onSuccess={handleConnectSuccess}
        />
      )}
    </div>
  );
}
