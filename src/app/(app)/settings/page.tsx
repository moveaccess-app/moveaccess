'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  getAcademy,
  getUnits,
  type Academy,
  type Unit,
} from '@/lib/settings';
import { getStaffUsers, getIntegrations } from '@/mocks/settingsMock';

// Ícones SVG inline
const icons = {
  building: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  location: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  rules: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  plug: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  palette: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
};

// Seção de configuração
interface SettingsItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: { label: string; variant: 'warning' | 'destructive' };
}

function SettingsLink({ item }: { item: SettingsItem }) {
  return (
    <Link href={item.href}>
      <div className="flex items-center gap-4 p-4 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] hover:border-[var(--status-info)] hover:shadow-sm transition-all cursor-pointer group">
        <div className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--element-secondary)] group-hover:bg-[var(--status-info-background)] group-hover:text-[var(--status-info)] transition-colors">
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--element-primary)] group-hover:text-[var(--status-info)]">
              {item.title}
            </h3>
            {item.badge && (
              <Badge variant={item.badge.variant} className="text-xs">
                {item.badge.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--element-secondary)]">{item.description}</p>
        </div>
        <svg
          className="w-5 h-5 text-[var(--element-disabled)] group-hover:text-[var(--status-info)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function SettingsPage() {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Ainda usando mock para staff e integrations
  const staff = getStaffUsers();
  const integrations = getIntegrations();

  useEffect(() => {
    async function loadData() {
      try {
        const [academyData, unitsData] = await Promise.all([
          getAcademy(),
          getUnits(),
        ]);
        setAcademy(academyData);
        setUnits(unitsData);
      } catch (error) {
        console.error('[SettingsPage] Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const hasIntegrationIssue = integrations.some((i) => i.status === 'error');

  const settingsItems: SettingsItem[] = [
    {
      id: 'academy',
      title: 'Dados da Academia',
      description: academy ? `${academy.tradeName}` : 'Carregando...',
      href: '/settings/academy',
      icon: icons.building,
    },
    {
      id: 'units',
      title: 'Unidades',
      description: `${units.length} unidade${units.length !== 1 ? 's' : ''} cadastrada${units.length !== 1 ? 's' : ''}`,
      href: '/settings/units',
      icon: icons.location,
    },
    {
      id: 'team',
      title: 'Equipe',
      description: `${staff.filter((s) => s.status === 'active').length} membro${staff.filter((s) => s.status === 'active').length !== 1 ? 's' : ''} ativo${staff.filter((s) => s.status === 'active').length !== 1 ? 's' : ''}`,
      href: '/settings/team',
      icon: icons.users,
    },
    {
      id: 'policies',
      title: 'Regras de Negócio',
      description: 'Cobrança, inadimplência e acesso',
      href: '/settings/policies',
      icon: icons.rules,
    },
    {
      id: 'integrations',
      title: 'Integrações',
      description: 'Pagamentos e notificações',
      href: '/settings/integrations',
      icon: icons.plug,
      badge: hasIntegrationIssue ? { label: 'Atenção', variant: 'warning' } : undefined,
    },
    {
      id: 'audit',
      title: 'Atividades',
      description: 'Histórico de ações da equipe',
      href: '/settings/audit',
      icon: icons.clock,
    },
    {
      id: 'appearance',
      title: 'Aparência',
      description: 'Tema claro, escuro ou do sistema',
      href: '/settings/appearance',
      icon: icons.palette,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Configurações" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Cabeçalho da Academia */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--status-info-background)] flex items-center justify-center text-[var(--status-info)]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-[var(--element-primary)] truncate">
                  {loading ? 'Carregando...' : academy?.tradeName || 'Academia'}
                </h2>
                <p className="text-sm text-[var(--element-secondary)]">
                  {academy?.address?.city || ''}{academy?.address?.state ? `, ${academy.address.state}` : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Alerta de integração (se houver) */}
          {hasIntegrationIssue && (
            <Link href="/settings/integrations">
              <Card className="p-4 border-[var(--status-alert)] bg-[var(--status-alert-background)] cursor-pointer hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[var(--status-alert)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-[var(--status-alert)] font-medium">
                    Uma integração precisa de atenção
                  </p>
                  <svg className="w-4 h-4 text-[var(--status-alert)] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          )}

          {/* Lista de configurações */}
          <div className="space-y-3">
            {settingsItems.map((item) => (
              <SettingsLink key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
