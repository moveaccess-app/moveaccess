export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type ContractStatus = 'active' | 'expired' | 'pending';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  document: string;
  status: UserStatus;
  createdAt: string;
  
  // Plan info
  currentPlan: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  
  // Contract info
  contract: {
    number: string;
    status: ContractStatus;
    signedAt: string;
  } | null;
}

// Mock data
export const mockUsers: User[] = [
  {
    id: '1',
    fullName: 'João Silva',
    email: 'joao.silva@example.com',
    phone: '(11) 98765-4321',
    document: '123.456.789-00',
    status: 'active',
    createdAt: '2024-01-15',
    currentPlan: {
      id: 'plan-1',
      name: 'Plano Premium',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
    },
    contract: {
      number: 'CTR-2024-001',
      status: 'active',
      signedAt: '2024-01-15',
    },
  },
  {
    id: '2',
    fullName: 'Maria Santos',
    email: 'maria.santos@example.com',
    phone: '(11) 97654-3210',
    document: '987.654.321-00',
    status: 'active',
    createdAt: '2024-02-20',
    currentPlan: {
      id: 'plan-2',
      name: 'Plano Básico',
      startDate: '2024-02-20',
      endDate: '2025-02-20',
    },
    contract: {
      number: 'CTR-2024-002',
      status: 'active',
      signedAt: '2024-02-20',
    },
  },
  {
    id: '3',
    fullName: 'Pedro Oliveira',
    email: 'pedro.oliveira@example.com',
    phone: '(11) 96543-2109',
    document: '456.789.123-00',
    status: 'pending',
    createdAt: '2024-03-10',
    currentPlan: null,
    contract: {
      number: 'CTR-2024-003',
      status: 'pending',
      signedAt: '2024-03-10',
    },
  },
  {
    id: '4',
    fullName: 'Ana Costa',
    email: 'ana.costa@example.com',
    phone: '(11) 95432-1098',
    document: '321.654.987-00',
    status: 'inactive',
    createdAt: '2023-11-05',
    currentPlan: {
      id: 'plan-1',
      name: 'Plano Premium',
      startDate: '2023-11-05',
      endDate: '2024-11-05',
    },
    contract: {
      number: 'CTR-2023-045',
      status: 'expired',
      signedAt: '2023-11-05',
    },
  },
  {
    id: '5',
    fullName: 'Carlos Mendes',
    email: 'carlos.mendes@example.com',
    phone: '(11) 94321-0987',
    document: '789.123.456-00',
    status: 'suspended',
    createdAt: '2024-01-25',
    currentPlan: {
      id: 'plan-2',
      name: 'Plano Básico',
      startDate: '2024-01-25',
      endDate: '2025-01-25',
    },
    contract: {
      number: 'CTR-2024-004',
      status: 'active',
      signedAt: '2024-01-25',
    },
  },
];

// Helper functions
export function getUserById(id: string): User | undefined {
  return mockUsers.find(user => user.id === id);
}

export function filterUsersByStatus(users: User[], status: UserStatus | 'all'): User[] {
  if (status === 'all') return users;
  return users.filter(user => user.status === status);
}

export function searchUsers(users: User[], query: string): User[] {
  const lowercaseQuery = query.toLowerCase();
  return users.filter(
    user =>
      user.fullName.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
  );
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
