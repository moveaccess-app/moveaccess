import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { usersContent } from '@/data/usersContent';
import {
  getUserById,
  formatDate,
  formatDateTime,
  formatCurrency,
  getCurrentContract,
  getDocumentStats,
  type UserStatus,
  type ContractStatus,
  type FinancialStatus,
  type DigitalCardStatus,
  type DocumentStatus,
  type UserType,
  type RegistrationOrigin,
  type AccessMethod,
  type BillingType,
  type PaymentMethod,
  type StatusChangeSource,
} from '@/mocks/usersMock';

// ============================================
// CORES DE STATUS
// ============================================

const statusColors: Record<UserStatus, { bg: string; text: string }> = {
  active: { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' },
  inactive: { bg: 'var(--status-alert-background)', text: 'var(--status-alert)' },
  pending: { bg: 'var(--status-info-background)', text: 'var(--status-info)' },
  suspended: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
  blocked: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
};

const contractStatusColors: Record<ContractStatus, { bg: string; text: string }> = {
  active: { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' },
  expired: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
  pending: { bg: 'var(--status-info-background)', text: 'var(--status-info)' },
  cancelled: { bg: 'var(--status-alert-background)', text: 'var(--status-alert)' },
};

const financialStatusColors: Record<FinancialStatus, { bg: string; text: string }> = {
  up_to_date: { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' },
  overdue: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
  partial: { bg: 'var(--status-alert-background)', text: 'var(--status-alert)' },
};

const digitalCardStatusColors: Record<DigitalCardStatus, { bg: string; text: string }> = {
  generated: { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' },
  pending: { bg: 'var(--status-info-background)', text: 'var(--status-info)' },
  revoked: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
};

const documentStatusColors: Record<DocumentStatus, { bg: string; text: string }> = {
  ok: { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' },
  pending: { bg: 'var(--status-info-background)', text: 'var(--status-info)' },
  expired: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function Badge({ 
  children, 
  variant = 'default',
  colors 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'outline';
  colors?: { bg: string; text: string };
}) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: colors?.bg || 'var(--background-secondary)',
        color: colors?.text || 'var(--element-secondary)',
        border: variant === 'outline' ? `1px solid ${colors?.text || 'var(--divider-primary)'}` : 'none',
      }}
    >
      {children}
    </span>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string | React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--divider-primary)' }}>
      <dt className="text-sm font-medium min-w-[140px]" style={{ color: 'var(--element-secondary)' }}>
        {label}
      </dt>
      <dd className="text-sm flex-1" style={{ color: 'var(--element-primary)' }}>
        {children || value || '-'}
      </dd>
    </div>
  );
}

function SectionCard({ title, children, headerAction }: { title: string; children: React.ReactNode; headerAction?: React.ReactNode }) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--background-primary)',
        borderColor: 'var(--divider-primary)',
      }}
    >
      <div 
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ 
          borderColor: 'var(--divider-primary)',
          backgroundColor: 'var(--background-secondary)',
        }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--element-primary)' }}>
          {title}
        </h3>
        {headerAction}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, status }: { label: string; value: string | number; subValue?: string; status?: 'positive' | 'negative' | 'warning' | 'info' }) {
  const statusColorMap = {
    positive: 'var(--status-positive)',
    negative: 'var(--status-negative)',
    warning: 'var(--status-alert)',
    info: 'var(--status-info)',
  };
  
  return (
    <div 
      className="p-4 rounded-lg border text-center"
      style={{ 
        backgroundColor: 'var(--background-secondary)',
        borderColor: 'var(--divider-primary)',
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--element-secondary)' }}>
        {label}
      </p>
      <p 
        className="text-2xl font-bold"
        style={{ color: status ? statusColorMap[status] : 'var(--element-primary)' }}
      >
        {value}
      </p>
      {subValue && (
        <p className="text-xs mt-1" style={{ color: 'var(--element-secondary)' }}>
          {subValue}
        </p>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const user = getUserById(id);

  if (!user) {
    return (
      <div>
        <Header title={usersContent.detailTitle} />
        <div className="p-8">
          <div
            className="rounded-lg p-8 text-center"
            style={{
              backgroundColor: 'var(--background-primary)',
              border: '1px solid var(--divider-primary)',
            }}
          >
            <p style={{ color: 'var(--element-secondary)' }}>Usuário não encontrado.</p>
            <Link
              href="/users"
              className="mt-4 inline-block px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 hover:shadow-md"
              style={{
                backgroundColor: 'var(--status-info)',
                color: 'var(--base-primary)',
              }}
            >
              Voltar para lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentContract = getCurrentContract(user);
  const docStats = getDocumentStats(user);
  const lastStatusChange = user.statusHistory[user.statusHistory.length - 1];

  return (
    <div>
      <Header
        title={usersContent.detailTitle}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/users"
              className="px-4 py-2 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-[var(--background-secondary)] hover:border-[var(--element-secondary)]"
              style={{
                borderColor: 'var(--divider-primary)',
                color: 'var(--element-primary)',
              }}
            >
              ← Voltar
            </Link>
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header Card com informações principais */}
        <div
          className="rounded-xl border p-6"
          style={{
            backgroundColor: 'var(--background-primary)',
            borderColor: 'var(--divider-primary)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Avatar e Nome */}
            <div className="flex items-center gap-4 flex-1">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ 
                  backgroundColor: 'var(--status-info-background)',
                  color: 'var(--status-info)',
                }}
              >
                {user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--element-primary)' }}>
                  {user.fullName}
                </h2>
                <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
                  {user.registrationId} • {usersContent.userTypeLabels[user.userType as UserType]}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge colors={statusColors[user.status]}>
                    {usersContent.statusLabels[user.status as UserStatus]}
                  </Badge>
                  <Badge colors={financialStatusColors[user.financial.status]}>
                    {usersContent.financialStatusLabels[user.financial.status as FinancialStatus]}
                  </Badge>
                  <Badge colors={user.access.isAllowed ? { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' } : { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' }}>
                    {user.access.isAllowed ? '✓ Acesso' : '✕ Bloqueado'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Stats rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard 
                label="Check-ins 7d"
                value={user.access.checkInsLast7Days}
                status={user.access.checkInsLast7Days > 0 ? 'positive' : 'warning'}
              />
              <StatCard 
                label="Check-ins 30d"
                value={user.access.checkInsLast30Days}
                status={user.access.checkInsLast30Days > 0 ? 'positive' : 'warning'}
              />
              <StatCard 
                label="Documentos"
                value={`${docStats.ok}/${docStats.total}`}
                status={docStats.pending > 0 ? 'warning' : 'positive'}
              />
              <StatCard 
                label="Contratos"
                value={user.contracts.length}
                subValue={currentContract ? 'Vigente' : 'Nenhum ativo'}
              />
            </div>
          </div>
        </div>

        {/* Grid de seções */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* A) Identidade e Vínculo */}
          <SectionCard title={usersContent.detailSections.identity}>
            <dl className="divide-y" style={{ borderColor: 'var(--divider-primary)' }}>
              <InfoRow label={usersContent.fields.registrationId} value={user.registrationId} />
              <InfoRow label={usersContent.fields.fullName} value={user.fullName} />
              <InfoRow label={usersContent.fields.email} value={user.email} />
              <InfoRow label={usersContent.fields.phone} value={user.phone} />
              <InfoRow label={usersContent.fields.document} value={user.document} />
              <InfoRow label={usersContent.fields.userType}>
                <Badge>{usersContent.userTypeLabels[user.userType as UserType]}</Badge>
              </InfoRow>
              <InfoRow label={usersContent.fields.unit} value={user.unitName} />
              <InfoRow label={usersContent.fields.registrationOrigin}>
                <Badge>{usersContent.registrationOriginLabels[user.registrationOrigin as RegistrationOrigin]}</Badge>
              </InfoRow>
              <InfoRow label={usersContent.fields.createdAt} value={formatDate(user.createdAt)} />
            </dl>
          </SectionCard>

          {/* B) Status do Usuário */}
          <SectionCard title={usersContent.detailSections.status}>
            <dl className="divide-y" style={{ borderColor: 'var(--divider-primary)' }}>
              <InfoRow label={usersContent.fields.status}>
                <Badge colors={statusColors[user.status]}>
                  {usersContent.statusLabels[user.status as UserStatus]}
                </Badge>
              </InfoRow>
              {user.statusReason && (
                <InfoRow label={usersContent.fields.statusReason} value={user.statusReason} />
              )}
              <InfoRow label={usersContent.fields.statusSince} value={formatDate(user.statusSince)} />
              {lastStatusChange && (
                <InfoRow label={usersContent.fields.lastChange}>
                  <div className="space-y-1">
                    <p>{formatDateTime(lastStatusChange.changedAt)}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {usersContent.statusChangeSourceLabels[lastStatusChange.changedBy as StatusChangeSource]}
                      </Badge>
                      {lastStatusChange.changedByName && (
                        <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                          por {lastStatusChange.changedByName}
                        </span>
                      )}
                    </div>
                  </div>
                </InfoRow>
              )}
            </dl>
            
            {/* Histórico de Status */}
            {user.statusHistory.length > 1 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--divider-primary)' }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--element-secondary)' }}>
                  Histórico de Alterações
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {[...user.statusHistory].reverse().map((history, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-3 text-xs p-2 rounded"
                      style={{ backgroundColor: 'var(--background-secondary)' }}
                    >
                      <Badge colors={statusColors[history.status]}>
                        {usersContent.statusLabels[history.status as UserStatus]}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ color: 'var(--element-primary)' }}>{history.reason}</p>
                        <p style={{ color: 'var(--element-secondary)' }}>
                          {formatDateTime(history.changedAt)} • {usersContent.statusChangeSourceLabels[history.changedBy as StatusChangeSource]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* C) Controle de Acesso */}
          <SectionCard title={usersContent.detailSections.access}>
            <dl className="divide-y" style={{ borderColor: 'var(--divider-primary)' }}>
              <InfoRow label={usersContent.fields.accessAllowed}>
                <Badge colors={user.access.isAllowed ? { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' } : { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' }}>
                  {user.access.isAllowed ? usersContent.yes : usersContent.no}
                </Badge>
              </InfoRow>
              <InfoRow label={usersContent.fields.lastCheckIn}>
                {user.access.lastCheckIn ? (
                  <div className="space-y-1">
                    <p>{formatDateTime(user.access.lastCheckIn.checkInAt)}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {usersContent.accessMethodLabels[user.access.lastCheckIn.method as AccessMethod]}
                      </Badge>
                      <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                        {user.access.lastCheckIn.location}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: 'var(--element-secondary)' }}>{usersContent.noCheckIns}</span>
                )}
              </InfoRow>
              <InfoRow label={usersContent.fields.checkIns7Days} value={String(user.access.checkInsLast7Days)} />
              <InfoRow label={usersContent.fields.checkIns30Days} value={String(user.access.checkInsLast30Days)} />
              <InfoRow label={usersContent.fields.digitalCard}>
                <Badge colors={digitalCardStatusColors[user.access.digitalCard.status]}>
                  {usersContent.digitalCardStatusLabels[user.access.digitalCard.status as DigitalCardStatus]}
                </Badge>
              </InfoRow>
              {user.access.digitalCard.expiresAt && (
                <InfoRow label={usersContent.fields.digitalCardExpiry} value={formatDate(user.access.digitalCard.expiresAt)} />
              )}
            </dl>
          </SectionCard>

          {/* D) Assinatura / Plano */}
          <SectionCard title={usersContent.detailSections.subscription}>
            {user.currentPlan ? (
              <dl className="divide-y" style={{ borderColor: 'var(--divider-primary)' }}>
                <InfoRow label={usersContent.fields.currentPlan}>
                  <span className="font-semibold" style={{ color: 'var(--element-primary)' }}>
                    {user.currentPlan.name}
                  </span>
                </InfoRow>
                <InfoRow label={usersContent.fields.planStartDate} value={formatDate(user.currentPlan.startDate)} />
                <InfoRow label={usersContent.fields.planEndDate} value={formatDate(user.currentPlan.endDate)} />
                <InfoRow label={usersContent.fields.billingType}>
                  <Badge>{usersContent.billingTypeLabels[user.currentPlan.billingType as BillingType]}</Badge>
                </InfoRow>
                <InfoRow label={usersContent.fields.autoRenewal}>
                  <Badge colors={user.currentPlan.autoRenewal ? { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' } : { bg: 'var(--background-secondary)', text: 'var(--element-secondary)' }}>
                    {user.currentPlan.autoRenewal ? usersContent.yes : usersContent.no}
                  </Badge>
                </InfoRow>
                <InfoRow label={usersContent.fields.nextDueDate} value={formatDate(user.currentPlan.nextDueDate)} />
                <InfoRow label={usersContent.fields.currentValue}>
                  <span className="font-semibold" style={{ color: 'var(--element-primary)' }}>
                    {formatCurrency(user.currentPlan.currentValue)}
                  </span>
                </InfoRow>
                {user.currentPlan.discount && (
                  <InfoRow label={usersContent.fields.discount}>
                    <div className="space-y-1">
                      <Badge colors={{ bg: 'var(--status-positive-background)', text: 'var(--status-positive)' }}>
                        {user.currentPlan.discount.type === 'percentage' 
                          ? `-${user.currentPlan.discount.value}%`
                          : formatCurrency(user.currentPlan.discount.value)
                        }
                      </Badge>
                      <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                        {user.currentPlan.discount.reason}
                        {user.currentPlan.discount.validUntil && ` (até ${formatDate(user.currentPlan.discount.validUntil)})`}
                      </p>
                    </div>
                  </InfoRow>
                )}
              </dl>
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--element-secondary)' }}>
                {usersContent.noPlan}
              </p>
            )}
          </SectionCard>

          {/* E) Contratos */}
          <SectionCard 
            title={usersContent.detailSections.contracts}
            headerAction={
              currentContract && (
                <Badge colors={{ bg: 'var(--status-positive-background)', text: 'var(--status-positive)' }}>
                  {usersContent.fields.currentContract}: {currentContract.number}
                </Badge>
              )
            }
          >
            {user.contracts.length > 0 ? (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--background-secondary)' }}>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--element-secondary)' }}>
                        {usersContent.fields.contractNumber}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--element-secondary)' }}>
                        {usersContent.fields.contractStatus}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--element-secondary)' }}>
                        {usersContent.fields.contractPlan}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--element-secondary)' }}>
                        Período
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--element-secondary)' }}>
                        {usersContent.fields.contractValue}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--divider-primary)' }}>
                    {user.contracts.map((contract) => (
                      <tr 
                        key={contract.id}
                        className="hover:bg-[var(--background-secondary)] transition-colors"
                        style={{
                          backgroundColor: contract.id === user.currentContractId ? 'var(--status-positive-background)' : 'transparent',
                        }}
                      >
                        <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--element-primary)' }}>
                          {contract.number}
                        </td>
                        <td className="px-5 py-3">
                          <Badge colors={contractStatusColors[contract.status]}>
                            {usersContent.contractStatusLabels[contract.status as ContractStatus]}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-sm" style={{ color: 'var(--element-primary)' }}>
                          {contract.planName}
                        </td>
                        <td className="px-5 py-3 text-sm" style={{ color: 'var(--element-secondary)' }}>
                          {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-medium" style={{ color: 'var(--element-primary)' }}>
                          {formatCurrency(contract.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--element-secondary)' }}>
                {usersContent.noContracts}
              </p>
            )}
          </SectionCard>

          {/* F) Situação Financeira */}
          <SectionCard title={usersContent.detailSections.financial}>
            <dl className="divide-y" style={{ borderColor: 'var(--divider-primary)' }}>
              <InfoRow label={usersContent.fields.financialStatus}>
                <Badge colors={financialStatusColors[user.financial.status]}>
                  {usersContent.financialStatusLabels[user.financial.status as FinancialStatus]}
                </Badge>
              </InfoRow>
              {user.financial.daysOverdue > 0 && (
                <InfoRow label={usersContent.fields.daysOverdue}>
                  <span className="font-semibold" style={{ color: 'var(--status-negative)' }}>
                    {user.financial.daysOverdue} dias
                  </span>
                </InfoRow>
              )}
              <InfoRow label={usersContent.fields.lastPayment}>
                {user.financial.lastPayment ? (
                  <div className="space-y-1">
                    <p>{formatDate(user.financial.lastPayment.date)}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: 'var(--element-primary)' }}>
                        {formatCurrency(user.financial.lastPayment.value)}
                      </span>
                      <Badge variant="outline">
                        {usersContent.paymentMethodLabels[user.financial.lastPayment.method as PaymentMethod]}
                      </Badge>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                      {user.financial.lastPayment.description}
                    </p>
                  </div>
                ) : (
                  <span style={{ color: 'var(--element-secondary)' }}>{usersContent.noPayments}</span>
                )}
              </InfoRow>
              {user.financial.pendingBalance > 0 && (
                <InfoRow label={usersContent.fields.pendingBalance}>
                  <span className="font-semibold" style={{ color: 'var(--status-negative)' }}>
                    {formatCurrency(user.financial.pendingBalance)}
                  </span>
                </InfoRow>
              )}
              {user.financial.nextDueDate !== '-' && user.financial.nextDueValue > 0 && (
                <InfoRow label={usersContent.fields.nextPayment}>
                  <div className="space-y-1">
                    <p>{formatDate(user.financial.nextDueDate)}</p>
                    <span className="font-semibold" style={{ color: 'var(--element-primary)' }}>
                      {formatCurrency(user.financial.nextDueValue)}
                    </span>
                  </div>
                </InfoRow>
              )}
            </dl>
          </SectionCard>

          {/* G) Documentos */}
          <SectionCard 
            title={usersContent.detailSections.documents}
            headerAction={
              <div className="flex items-center gap-2">
                {docStats.ok > 0 && (
                  <Badge colors={{ bg: 'var(--status-positive-background)', text: 'var(--status-positive)' }}>
                    {docStats.ok} OK
                  </Badge>
                )}
                {docStats.pending > 0 && (
                  <Badge colors={{ bg: 'var(--status-info-background)', text: 'var(--status-info)' }}>
                    {docStats.pending} Pendentes
                  </Badge>
                )}
                {docStats.expired > 0 && (
                  <Badge colors={{ bg: 'var(--status-negative-background)', text: 'var(--status-negative)' }}>
                    {docStats.expired} Expirados
                  </Badge>
                )}
              </div>
            }
          >
            {user.documents.length > 0 ? (
              <div className="space-y-2">
                {user.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--background-secondary)',
                      borderColor: 'var(--divider-primary)',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ 
                          backgroundColor: 'var(--background-primary)',
                          color: 'var(--element-secondary)',
                        }}
                      >
                        📄
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--element-primary)' }}>
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                            {usersContent.documentTypeLabels[doc.type]}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                            • {formatDate(doc.uploadedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge colors={documentStatusColors[doc.status]}>
                        {usersContent.documentStatusLabels[doc.status as DocumentStatus]}
                      </Badge>
                      {doc.url && (
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-[var(--background-primary)] transition-colors"
                          style={{ 
                            borderColor: 'var(--divider-primary)',
                            color: 'var(--element-secondary)',
                          }}
                        >
                          {usersContent.viewDocument}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--element-secondary)' }}>
                {usersContent.noDocuments}
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
