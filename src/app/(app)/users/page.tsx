'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { usersContent } from '@/data/usersContent';
import { mockUsers, filterUsersByStatus, searchUsers, formatDate, type UserStatus } from '@/mocks/usersMock';

const statusColors: Record<UserStatus, { bg: string; text: string }> = {
  active: { bg: 'var(--status-positive-background)', text: 'var(--status-positive)' },
  inactive: { bg: 'var(--status-alert-background)', text: 'var(--status-alert)' },
  pending: { bg: 'var(--status-info-background)', text: 'var(--status-info)' },
  suspended: { bg: 'var(--status-negative-background)', text: 'var(--status-negative)' },
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');

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

  return (
    <div>
      <Header title={usersContent.listTitle} />
      
      <div className="p-8">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder={usersContent.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--background-primary)',
              borderColor: 'var(--divider-primary)',
              color: 'var(--element-primary)',
            }}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--background-primary)',
              borderColor: 'var(--divider-primary)',
              color: 'var(--element-primary)',
            }}
          >
            <option value="all">{usersContent.allStatuses}</option>
            <option value="active">{usersContent.statusLabels.active}</option>
            <option value="inactive">{usersContent.statusLabels.inactive}</option>
            <option value="pending">{usersContent.statusLabels.pending}</option>
            <option value="suspended">{usersContent.statusLabels.suspended}</option>
          </select>
        </div>

        {/* Table */}
        <div
          className="rounded-lg overflow-hidden border"
          style={{
            backgroundColor: 'var(--background-primary)',
            borderColor: 'var(--divider-primary)',
          }}
        >
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--background-tertiary)' }}>
              <tr>
                <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--element-primary)' }}>
                  {usersContent.tableHeaders.name}
                </th>
                <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--element-primary)' }}>
                  {usersContent.tableHeaders.email}
                </th>
                <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--element-primary)' }}>
                  {usersContent.tableHeaders.status}
                </th>
                <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--element-primary)' }}>
                  {usersContent.tableHeaders.plan}
                </th>
                <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--element-primary)' }}>
                  {usersContent.tableHeaders.createdAt}
                </th>
                <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--element-primary)' }}>
                  {usersContent.tableHeaders.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--element-secondary)' }}>
                    {usersContent.noUsersFound}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t" style={{ borderColor: 'var(--divider-primary)' }}>
                    <td className="px-6 py-4" style={{ color: 'var(--element-primary)' }}>
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--element-secondary)' }}>
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: statusColors[user.status].bg,
                          color: statusColors[user.status].text,
                        }}
                      >
                        {usersContent.statusLabels[user.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--element-secondary)' }}>
                      {user.currentPlan?.name || '—'}
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--element-secondary)' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/users/${user.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'var(--status-info)' }}
                      >
                        {usersContent.viewDetails}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
