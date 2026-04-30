'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Input, Select, Button, Card, SkeletonTable, Badge } from '@/components/ui';
import { usersContent } from '@/data/usersContent';
import { 
  searchAndFilterUsers,
  type UserStatus, 
  type User,
} from '@/lib/users/usersServiceSupabase';
import { InviteGenerator } from '@/components/onboarding/InviteGenerator';

const ITEMS_PER_PAGE = 20;

function getUnitLabel(user: User): string {
  return user.unitName || 'Sem unidade';
}

type OperationalSummary = {
  label: string;
  detail: string;
  tone: User['operationalStatus']['access']['tone'];
};

const operationalBadgeToneClass: Record<OperationalSummary['tone'], string> = {
  success: 'border-[var(--status-positive)]/40 bg-transparent text-[var(--status-positive)]',
  warning: 'border-[var(--status-alert)]/50 bg-transparent text-[var(--element-primary)]',
  destructive: 'border-[var(--status-negative)]/45 bg-transparent text-[var(--status-negative)]',
  secondary: 'border-[var(--divider-primary)] bg-transparent text-[var(--element-secondary)]',
};

function getOperationalSummary(user: User): OperationalSummary {
  const { registration, financial, access } = user.operationalStatus;

  if (registration.tone === 'destructive') {
    return {
      label: registration.label,
      detail: 'Cadastro impede a operação',
      tone: registration.tone,
    };
  }

  if (access.tone === 'destructive') {
    return {
      label: access.label,
      detail: access.label === 'Bloqueado por financeiro' ? 'Acesso bloqueado por cobrança' : 'Acesso não liberado',
      tone: access.tone,
    };
  }

  if (financial.tone === 'destructive') {
    return {
      label: financial.label,
      detail: 'Financeiro precisa de ação',
      tone: financial.tone,
    };
  }

  if (registration.tone === 'warning') {
    return {
      label: registration.label,
      detail: 'Cadastro ainda não concluído',
      tone: registration.tone,
    };
  }

  if (financial.code !== 'current') {
    return {
      label: financial.label,
      detail: financial.code === 'no_charge' ? 'Sem cobrança registrada' : 'Cobrança em acompanhamento',
      tone: financial.tone === 'secondary' ? 'warning' : financial.tone,
    };
  }

  if (access.code !== 'released') {
    return {
      label: access.label,
      detail: 'Acesso ainda não liberado',
      tone: access.tone,
    };
  }

  return {
    label: 'Pronto para check-in',
    detail: 'Cadastro, cobrança e acesso ok',
    tone: 'success',
  };
}

function OperationalStatusCell({ user }: { user: User }) {
  const summary = getOperationalSummary(user);

  return (
    <div className="flex min-w-0 flex-col items-start gap-0.5">
      <Badge
        variant="outline"
        className={`w-fit max-w-full truncate px-2 py-0 text-[10px] font-medium leading-5 ${operationalBadgeToneClass[summary.tone]}`}
      >
        {summary.label}
      </Badge>
      <span className="max-w-[220px] truncate text-[11px] leading-4 text-[var(--element-secondary)]">
        {summary.detail}
      </span>
    </div>
  );
}

// ============================================
// COMPONENTE DE LINHA
// ============================================

interface UserRowProps {
  user: User;
  onClick: () => void;
}

function UserRow({ user, onClick }: UserRowProps) {
  const unitLabel = getUnitLabel(user);

  return (
    <tr
      onClick={onClick}
      className="border-b last:border-b-0 transition-colors hover:bg-[var(--background-secondary)] cursor-pointer"
      style={{ borderColor: 'var(--divider-primary)' }}
    >
      {/* Coluna 1: Usuário */}
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span 
            className="font-medium text-sm truncate max-w-[200px]" 
            style={{ color: 'var(--element-primary)' }}
            title={user.fullName}
          >
            {user.fullName}
          </span>
          <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
            {usersContent.userTypeLabels[user.userType]}
            <span className="mx-1">·</span>
            <span className="font-mono">{user.registrationId}</span>
          </span>
        </div>
      </td>

      {/* Coluna 2: Situação */}
      <td className="py-3 px-4">
        <OperationalStatusCell user={user} />
      </td>

      {/* Coluna 3: Plano / Contrato */}
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="text-sm" style={{ color: 'var(--element-primary)' }}>
            {user.currentPlan?.name || 'Sem plano'}
          </span>
          <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
            {user.currentPlan ? 'Plano vinculado' : 'Nenhum plano vinculado'}
          </span>
        </div>
      </td>

      {/* Coluna 4: Unidade */}
      <td className="py-3 px-4">
        <span className="text-sm" style={{ color: 'var(--element-primary)' }}>
          {unitLabel}
        </span>
      </td>
    </tr>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Estado para dados assíncronos
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar usuários do service
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchAndFilterUsers(searchQuery, statusFilter);
      setUsers(result.users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Recarregar quando filtros mudarem
  useEffect(() => {
    loadUsers();
    setVisibleCount(ITEMS_PER_PAGE);
  }, [loadUsers]);

  // Scroll infinito com Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < users.length) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, users.length));
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [visibleCount, users.length]);

  const visibleUsers = users.slice(0, visibleCount);

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const hasMore = visibleCount < users.length;

  return (
    <div>
      <Header title={usersContent.listTitle} />
      
      <div className="p-6">
        {/* Header com botões de ação */}
        <div className="mb-6 flex justify-between items-center">
          <div />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              🔗 Gerar link
            </Button>
            <Button onClick={() => router.push('/users/onboarding')}>
              + Novo cadastro
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4 flex gap-3">
          <Input
            type="text"
            placeholder={usersContent.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md"
          />
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
            className="w-40"
          >
            <option value="all">{usersContent.allStatuses}</option>
            <option value="active">{usersContent.statusLabels.active}</option>
            <option value="inactive">{usersContent.statusLabels.inactive}</option>
            <option value="pending">{usersContent.statusLabels.pending}</option>
            <option value="suspended">{usersContent.statusLabels.suspended}</option>
            <option value="blocked">{usersContent.statusLabels.blocked}</option>
          </Select>
        </div>

        {/* Contador simples */}
        <p className="mb-3 text-sm" style={{ color: 'var(--element-secondary)' }}>
          {loading ? '\u00A0' : `Mostrando ${visibleUsers.length} de ${users.length} ${users.length === 1 ? 'usuário' : 'usuários'}`}
        </p>

        {loading && <SkeletonTable rows={6} cols={4} />}

        {/* Tabela */}
        {!loading && <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--background-primary)',
            borderColor: 'var(--divider-primary)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--background-secondary)' }}>
                <th 
                  className="text-left py-2.5 px-4 text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--element-secondary)' }}
                >
                  Usuário
                </th>
                <th 
                  className="text-left py-2.5 px-4 text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--element-secondary)' }}
                >
                  Situação operacional
                </th>
                <th 
                  className="text-left py-2.5 px-4 text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--element-secondary)' }}
                >
                  Plano
                </th>
                <th 
                  className="text-left py-2.5 px-4 text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--element-secondary)' }}
                >
                  Unidade
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 ? (
                <tr>
                  <td 
                    colSpan={4} 
                    className="py-12 text-center text-sm"
                    style={{ color: 'var(--element-secondary)' }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-[var(--element-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <p className="font-medium text-[var(--text-primary)]">Nenhum aluno encontrado</p>
                      <p className="text-xs text-[var(--element-tertiary)] max-w-xs">Cadastre seu primeiro aluno pelo onboarding ou ajuste os filtros de busca.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onClick={() => handleUserClick(user.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>}

        {/* Trigger para scroll infinito */}
        {hasMore && (
          <div 
            ref={observerTarget}
            className="py-4 flex justify-center"
          >
            <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full"
                 style={{ borderColor: 'var(--element-secondary)', borderTopColor: 'transparent' }} />
          </div>
        )}
      </div>

      {/* Modal de geração de link */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <InviteGenerator onClose={() => setShowInviteModal(false)} />
          </Card>
        </div>
      )}
    </div>
  );
}
