export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'blocked';
export type ContractStatus = 'active' | 'expired' | 'pending' | 'cancelled';
export type UserType = 'student' | 'personal' | 'guest' | 'employee';
export type RegistrationOrigin = 'academy' | 'app' | 'website' | 'migration';
export type StatusChangeSource = 'manual' | 'system' | 'automation';
export type AccessMethod = 'qr_code' | 'biometry' | 'card' | 'manual';
export type DigitalCardStatus = 'generated' | 'pending' | 'revoked';
export type BillingType = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'single';
export type PaymentMethod = 'credit_card' | 'debit' | 'pix' | 'boleto' | 'cash';
export type FinancialStatus = 'up_to_date' | 'overdue' | 'partial';
export type DocumentStatus = 'ok' | 'pending' | 'expired';

export interface StatusHistory {
  status: UserStatus;
  reason: string;
  changedAt: string;
  changedBy: StatusChangeSource;
  changedByName?: string;
}

export interface AccessLog {
  id: string;
  checkInAt: string;
  method: AccessMethod;
  location: string;
}

export interface AccessInfo {
  isAllowed: boolean;
  lastCheckIn: AccessLog | null;
  checkInsLast7Days: number;
  checkInsLast30Days: number;
  digitalCard: {
    status: DigitalCardStatus;
    generatedAt?: string;
    expiresAt?: string;
  };
}

export interface PlanInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  billingType: BillingType;
  autoRenewal: boolean;
  nextDueDate: string;
  currentValue: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason: string;
    validUntil?: string;
  };
}

export interface Contract {
  id: string;
  number: string;
  status: ContractStatus;
  signedAt: string;
  startDate: string;
  endDate: string;
  planName: string;
  value: number;
  documentUrl?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  value: number;
  method: PaymentMethod;
  description: string;
}

export interface FinancialInfo {
  status: FinancialStatus;
  daysOverdue: number;
  lastPayment: PaymentRecord | null;
  pendingBalance: number;
  nextDueDate: string;
  nextDueValue: number;
}

export interface UserDocument {
  id: string;
  type: 'contract' | 'identity' | 'proof_of_residence' | 'medical' | 'payment_proof' | 'other';
  name: string;
  status: DocumentStatus;
  uploadedAt: string;
  url?: string;
}

export interface User {
  id: string;
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  document: string;
  userType: UserType;
  unitId: string;
  unitName: string;
  registrationOrigin: RegistrationOrigin;
  createdAt: string;
  status: UserStatus;
  statusReason?: string;
  statusSince: string;
  statusHistory: StatusHistory[];
  access: AccessInfo;
  currentPlan: PlanInfo | null;
  contracts: Contract[];
  currentContractId?: string;
  financial: FinancialInfo;
  documents: UserDocument[];
}

export interface UsersListResult {
  users: User[];
  total: number;
}