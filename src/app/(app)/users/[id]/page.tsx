import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { usersContent } from '@/data/usersContent';
import { getUserById, formatDate, type UserStatus, type ContractStatus } from '@/mocks/usersMock';

const statusColors: Record<UserStatus, { bg: string; text: string }> = {
  active: { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' },
  inactive: { bg: 'var(--status-alert-background)', text: 'var(--status-alert)' },
  pending: { bg: 'var(--status-info-background)', text: 'var(--status-info)' },
  suspended: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
};

const contractStatusColors: Record<ContractStatus, { bg: string; text: string }> = {
  active: { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' },
  expired: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
  pending: { bg: 'var(--status-info-background)', text: 'var(--status-info)' },
};

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
              className="mt-4 inline-block px-4 py-2 rounded-lg"
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

  return (
    <div>
      <Header
        title={usersContent.detailTitle}
        actions={
          <Link
            href="/users"
            className="px-4 py-2 rounded-lg border"
            style={{
              borderColor: 'var(--divider-primary)',
              color: 'var(--element-primary)',
            }}
          >
            ← Voltar
          </Link>
        }
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: 'var(--background-primary)',
              borderColor: 'var(--divider-primary)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--element-primary)' }}>
              {usersContent.detailSections.personalInfo}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                  {usersContent.fields.fullName}
                </label>
                <p className="mt-1" style={{ color: 'var(--element-primary)' }}>{user.fullName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                  {usersContent.fields.email}
                </label>
                <p className="mt-1" style={{ color: 'var(--element-primary)' }}>{user.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                  {usersContent.fields.phone}
                </label>
                <p className="mt-1" style={{ color: 'var(--element-primary)' }}>{user.phone}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                  {usersContent.fields.document}
                </label>
                <p className="mt-1" style={{ color: 'var(--element-primary)' }}>{user.document}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: 'var(--background-primary)',
              borderColor: 'var(--divider-primary)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--element-primary)' }}>
              {usersContent.detailSections.status}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                  {usersContent.fields.status}
                </label>
                <div className="mt-1">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: statusColors[user.status].bg,
                      color: statusColors[user.status].text,
                    }}
                  >
                    {usersContent.statusLabels[user.status]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Plan */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: 'var(--background-primary)',
              borderColor: 'var(--divider-primary)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--element-primary)' }}>
              {usersContent.detailSections.subscription}
            </h3>
            
            {user.currentPlan ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                    {usersContent.fields.currentPlan}
                  </label>
                  <p className="mt-1 font-semibold" style={{ color: 'var(--element-primary)' }}>
                    {user.currentPlan.name}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                    {usersContent.fields.planStartDate}
                  </label>
                  <p className="mt-1" style={{ color: 'var(--element-primary)' }}>
                    {formatDate(user.currentPlan.startDate)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                    {usersContent.fields.planEndDate}
                  </label>
                  <p className="mt-1" style={{ color: 'var(--element-primary)' }}>
                    {formatDate(user.currentPlan.endDate)}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--element-secondary)' }}>Nenhum plano ativo</p>
            )}
          </div>

          {/* Contract */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: 'var(--background-primary)',
              borderColor: 'var(--divider-primary)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--element-primary)' }}>
              {usersContent.detailSections.contract}
            </h3>
            
            {user.contract ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                    {usersContent.fields.contractNumber}
                  </label>
                  <p className="mt-1" style={{ color: 'var(--element-primary)' }}>{user.contract.number}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                    {usersContent.fields.contractStatus}
                  </label>
                  <div className="mt-1">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: contractStatusColors[user.contract.status].bg,
                        color: contractStatusColors[user.contract.status].text,
                      }}
                    >
                      {usersContent.contractStatusLabels[user.contract.status]}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--element-secondary)' }}>
                    {usersContent.fields.contractSignedAt}
                  </label>
                  <p className="mt-1" style={{ color: 'var(--element-primary)' }}>
                    {formatDate(user.contract.signedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--element-secondary)' }}>Nenhum contrato vinculado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
