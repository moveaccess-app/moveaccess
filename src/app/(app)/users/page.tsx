'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Input, Select, Button, Card } from '@/components/ui';
import { usersContent } from '@/data/usersContent';
import { 
  mockUsers, 
  filterUsersByStatus, 
  searchUsers, 
  type UserStatus, 
  type User,
} from '@/mocks/usersMock';
import { InviteGenerator } from '@/components/onboarding/InviteGenerator';

const ITEMS_PER_PAGE = 20;

// ============================================
// FUNÇÕES DE ESTADO COMPOSTO
// ============================================

type CompositeStatus = {
  label: string;
  severity: 'default' | 'warning' | 'error';
};

function getCompositeStatus(user: User): CompositeStatus {
  // Prioridade: estados críticos primeiro
  if (user.status === 'suspended') {
    return { label: 'Suspenso', severity: 'error' };
  }
  
  if (user.status === 'blocked') {
    return { label: 'Bloqueado', severity: 'error' };
  }
  
  if (user.status === 'pending') {
    return { label: 'Pendente', severity: 'warning' };
  }
  
  if (user.status === 'inactive') {
    return { label: 'Inativo', severity: 'warning' };
  }
  
  // Usuário ativo - verificar condições
  if (user.financial.status === 'overdue' && user.financial.daysOverdue > 30) {
    return { label: 'Ativo · Bloqueado (Financeiro)', severity: 'error' };
  }
  
  if (user.financial.status === 'overdue') {
    return { label: 'Ativo · Em atraso', severity: 'warning' };
  }
  
  const currentContract = user.contracts.find(c => c.id === user.currentContractId);
  if (currentContract?.status === 'expired' || currentContract?.status === 'cancelled') {
    return { label: 'Ativo · Bloqueado (Contrato)', severity: 'error' };
  }
  
  if (!user.access.isAllowed) {
    return { label: 'Ativo · Bloqueado', severity: 'error' };
  }
  
  return { label: 'Ativo · Em dia', severity: 'default' };
}

function getLastCheckInText(user: User): string {
  if (!user.access.lastCheckIn) return 'Nunca';
  
  const lastCheckIn = new Date(user.access.lastCheckIn.checkInAt);
  const now = new Date();
  const diffMs = now.getTime() - lastCheckIn.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return '7+ dias';
}

function hasActiveContract(user: User): boolean {
  if (!user.currentContractId) return false;
  const contract = user.contracts.find(c => c.id === user.currentContractId);
  return contract?.status === 'active';
}

// ============================================
// COMPONENTE DE LINHA
// ============================================

interface UserRowProps {
  user: User;
  onClick: () => void;
}

function UserRow({ user, onClick }: UserRowProps) {
  const compositeStatus = getCompositeStatus(user);
  const lastCheckIn = getLastCheckInText(user);
  const hasContract = hasActiveContract(user);

  // Cor do status baseada na severidade
  const statusColor = {
    default: 'var(--element-primary)',
    warning: 'var(--status-alert)',
    error: 'var(--status-negative)',
  }[compositeStatus.severity];

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
        <span className="text-sm" style={{ color: statusColor }}>
          {compositeStatus.label}
        </span>
      </td>

      {/* Coluna 3: Plano / Contrato */}
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="text-sm" style={{ color: 'var(--element-primary)' }}>
            {user.currentPlan?.name || '—'}
          </span>
          <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
            {hasContract ? 'Contrato vigente' : 'Sem contrato'}
          </span>
        </div>
      </td>

      {/* Coluna 4: Atividade */}
      <td className="py-3 px-4">
        <span className="text-sm" style={{ color: 'var(--element-primary)' }}>
          {lastCheckIn}
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

  const filteredUsers = useMemo(() => {
    let users = mockUsers;
    
    if (statusFilter !== 'all') {
      users = filterUsersByStatus(users, statusFilter);
    }
    
    if (searchQuery) {
      users = searchUsers(users, searchQuery);
    }
    
    return users;
  }, [searchQuery, statusFilter]);

  // Resetar contagem ao mudar filtros
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, statusFilter]);

  // Scroll infinito com Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredUsers.length) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredUsers.length));
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
  }, [visibleCount, filteredUsers.length]);

  const visibleUsers = useMemo(() => {
    return filteredUsers.slice(0, visibleCount);
  }, [filteredUsers, visibleCount]);

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const hasMore = visibleCount < filteredUsers.length;

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
          Mostrando {visibleUsers.length} de {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário' : 'usuários'}
        </p>

        {/* Tabela */}
        <div
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
                  Situação
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
                  Último acesso
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
                    {usersContent.noUsersFound}
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
        </div>

        {/* Trigger para scroll infinito */}
        {hasMore && (
          <div 
            ref={observerTarget}
            className="py-4 text-center text-sm"
            style={{ color: 'var(--element-secondary)' }}
          >
            Carregando mais usuários...
          </div>
        )}
      </div>

      {/* Modal de geração de link */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <InviteGenerator onClose={() => setShowInviteModal(false)} />
          </Card>
        </div>
      )}
    </div>
  );
}
