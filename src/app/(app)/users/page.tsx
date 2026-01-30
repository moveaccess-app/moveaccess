'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Input, Select, Button, Card, Badge } from '@/components/ui';
import { usersContent } from '@/data/usersContent';
import { 
  searchAndFilterUsers,
  type UserStatus, 
  type User,
} from '@/lib/users';
import { InviteGenerator } from '@/components/onboarding/InviteGenerator';
import { listDrafts, archiveDraft, restoreDraft, type StudentDraftListItem, type DraftOrigin } from '@/lib/onboarding';

// Feature flag para usar Supabase Onboarding
const USE_SUPABASE_ONBOARDING = process.env.NEXT_PUBLIC_USE_SUPABASE_ONBOARDING === 'true';
const DEFAULT_ACADEMY_ID = 'a0000000-0000-0000-0000-000000000001';

const ITEMS_PER_PAGE = 20;

// Labels de origem
const ORIGIN_LABELS: Record<DraftOrigin, { label: string; icon: string }> = {
  staff: { label: 'Academia', icon: '🏢' },
  self_registration: { label: 'Auto-cadastro', icon: '👤' },
  invite_link: { label: 'Link convite', icon: '🔗' },
};

type DraftTab = 'active' | 'archived';

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
  
  // Estado para dados assíncronos
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para drafts (cadastros em andamento)
  const [drafts, setDrafts] = useState<StudentDraftListItem[]>([]);
  const [archivedDrafts, setArchivedDrafts] = useState<StudentDraftListItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [showDrafts, setShowDrafts] = useState(true);
  const [draftTab, setDraftTab] = useState<DraftTab>('active');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Carregar drafts do Supabase
  const loadDrafts = useCallback(async () => {
    if (!USE_SUPABASE_ONBOARDING) {
      setLoadingDrafts(false);
      return;
    }
    
    setLoadingDrafts(true);
    try {
      // Carregar drafts ativos e arquivados em paralelo
      const [activeResult, archivedResult] = await Promise.all([
        listDrafts(DEFAULT_ACADEMY_ID, { status: ['in_progress', 'completed'] }),
        listDrafts(DEFAULT_ACADEMY_ID, { status: ['archived'] }),
      ]);
      setDrafts(activeResult.data);
      setArchivedDrafts(archivedResult.data);
    } catch (error) {
      console.error('Erro ao carregar drafts:', error);
      setDrafts([]);
      setArchivedDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  // Arquivar draft
  const handleArchive = async (draftId: string) => {
    setActionLoading(draftId);
    try {
      const { error } = await archiveDraft(draftId);
      if (error) throw error;
      await loadDrafts(); // Recarrega a lista
    } catch (error) {
      console.error('Erro ao arquivar:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Restaurar draft arquivado
  const handleRestore = async (draftId: string) => {
    setActionLoading(draftId);
    try {
      const { error } = await restoreDraft(draftId);
      if (error) throw error;
      await loadDrafts(); // Recarrega a lista
    } catch (error) {
      console.error('Erro ao restaurar:', error);
    } finally {
      setActionLoading(null);
    }
  };

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

  // Carregar drafts na montagem
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

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

        {/* Seção de Cadastros em Andamento */}
        {USE_SUPABASE_ONBOARDING && (drafts.length > 0 || archivedDrafts.length > 0) && (
          <div className="mb-6">
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => setShowDrafts(!showDrafts)}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium" style={{ color: 'var(--element-primary)' }}>
                  📝 Cadastros em Andamento
                </h3>
                <Badge variant="warning">{drafts.length + archivedDrafts.length}</Badge>
              </div>
              <span 
                className="text-xs"
                style={{ color: 'var(--element-secondary)' }}
              >
                {showDrafts ? '▼ Ocultar' : '▶ Mostrar'}
              </span>
            </div>
            
            {showDrafts && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 mb-3">
                  <button
                    onClick={() => setDraftTab('active')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      draftTab === 'active' 
                        ? 'bg-[var(--accent-primary)] text-white' 
                        : 'bg-[var(--background-secondary)] text-[var(--element-secondary)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    Ativos ({drafts.length})
                  </button>
                  <button
                    onClick={() => setDraftTab('archived')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      draftTab === 'archived' 
                        ? 'bg-[var(--accent-primary)] text-white' 
                        : 'bg-[var(--background-secondary)] text-[var(--element-secondary)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    Arquivados ({archivedDrafts.length})
                  </button>
                </div>

                {/* Tabela de drafts */}
                {((draftTab === 'active' && drafts.length > 0) || (draftTab === 'archived' && archivedDrafts.length > 0)) && (
                  <div 
                    className="rounded-lg border overflow-hidden mb-4"
                    style={{
                      backgroundColor: 'var(--background-primary)',
                      borderColor: draftTab === 'active' ? 'var(--status-alert)' : 'var(--divider-primary)',
                    }}
                  >
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: 'var(--background-secondary)' }}>
                          <th className="text-left py-2 px-4 text-xs font-medium uppercase" style={{ color: 'var(--element-secondary)' }}>
                            Nome / Email
                          </th>
                          <th className="text-left py-2 px-4 text-xs font-medium uppercase" style={{ color: 'var(--element-secondary)' }}>
                            Origem
                          </th>
                          <th className="text-left py-2 px-4 text-xs font-medium uppercase" style={{ color: 'var(--element-secondary)' }}>
                            Etapa
                          </th>
                          <th className="text-left py-2 px-4 text-xs font-medium uppercase" style={{ color: 'var(--element-secondary)' }}>
                            Atualização
                          </th>
                          <th className="text-right py-2 px-4 text-xs font-medium uppercase" style={{ color: 'var(--element-secondary)' }}>
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(draftTab === 'active' ? drafts : archivedDrafts).map((draft) => {
                          const origin = ORIGIN_LABELS[draft.origin || 'staff'];
                          return (
                            <tr 
                              key={draft.id}
                              className="border-t"
                              style={{ borderColor: 'var(--divider-primary)' }}
                            >
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium" style={{ color: 'var(--element-primary)' }}>
                                    {draft.student_name || 'Sem nome'}
                                  </span>
                                  <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                                    {draft.student_email || 'Sem email'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span 
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                                  style={{ 
                                    backgroundColor: 'var(--background-secondary)',
                                    color: 'var(--element-secondary)'
                                  }}
                                >
                                  {origin.icon} {origin.label}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={draft.status === 'completed' ? 'success' : 'warning'}>
                                  {draft.current_step === 'identification' && 'Identificação'}
                                  {draft.current_step === 'personal_data' && 'Dados Pessoais'}
                                  {draft.current_step === 'plan_selection' && 'Plano'}
                                  {draft.current_step === 'contract' && 'Contrato'}
                                  {draft.current_step === 'payment' && 'Pagamento'}
                                  {draft.current_step === 'activation' && 'Ativação'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                                  {new Date(draft.updated_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {draftTab === 'active' ? (
                                    <>
                                      <Button 
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleArchive(draft.id)}
                                        disabled={actionLoading === draft.id}
                                      >
                                        {actionLoading === draft.id ? '...' : '📦 Arquivar'}
                                      </Button>
                                      <Button 
                                        size="sm"
                                        onClick={() => router.push(`/users/onboarding?draft=${draft.id}`)}
                                      >
                                        Continuar →
                                      </Button>
                                    </>
                                  ) : (
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRestore(draft.id)}
                                      disabled={actionLoading === draft.id}
                                    >
                                      {actionLoading === draft.id ? '...' : '↩️ Restaurar'}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Empty state para tab selecionada */}
                {draftTab === 'active' && drafts.length === 0 && (
                  <div className="text-center py-6 text-sm" style={{ color: 'var(--element-secondary)' }}>
                    Nenhum cadastro ativo no momento.
                  </div>
                )}
                {draftTab === 'archived' && archivedDrafts.length === 0 && (
                  <div className="text-center py-6 text-sm" style={{ color: 'var(--element-secondary)' }}>
                    Nenhum cadastro arquivado.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Loading drafts indicator */}
        {USE_SUPABASE_ONBOARDING && loadingDrafts && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <span className="text-sm" style={{ color: 'var(--element-secondary)' }}>
              Carregando cadastros em andamento...
            </span>
          </div>
        )}

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
          {loading ? 'Carregando...' : `Mostrando ${visibleUsers.length} de ${users.length} ${users.length === 1 ? 'usuário' : 'usuários'}`}
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
