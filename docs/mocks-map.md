# 📊 MoveAccess - Mapeamento de Mocks para Supabase

> **Documento de referência para migração de dados mock → Supabase**
> 
> Gerado automaticamente | Última atualização: Janeiro 2025

---

## 📁 Índice

1. [Visão Geral](#visão-geral)
2. [Arquivos de Mock](#arquivos-de-mock)
3. [Entidades e Tipos](#entidades-e-tipos)
4. [Mapeamento Tela → Dados](#mapeamento-tela--dados)
5. [Esquema Supabase Sugerido](#esquema-supabase-sugerido)
6. [Relacionamentos](#relacionamentos)

---

## Visão Geral

O MoveAccess utiliza **11 arquivos de mock** localizados em `/src/mocks/` que simulam dados de backend. Esses mocks precisam ser migrados para tabelas Supabase com autenticação integrada.

### Estatísticas

| Métrica | Valor |
|---------|-------|
| Arquivos de mock | 11 |
| Tipos/Interfaces | ~60+ |
| Enums | ~25+ |
| Funções helper | ~30+ |

---

## Arquivos de Mock

### 📂 `/src/mocks/`

| Arquivo | Linhas | Descrição | Principais Entidades |
|---------|--------|-----------|---------------------|
| `authMock.ts` | 521 | Autenticação staff/aluno | StaffUser, StudentUser, AuthSession |
| `usersMock.ts` | 850 | Gestão de usuários | User (completo), AccessInfo, PlanInfo |
| `accessMock.ts` | 810 | Controle de acesso | AccessAttempt, CheckInResult, AccessKPIs |
| `plansMock.ts` | 846 | Planos da academia | Plan, PlanPricing, AccessRules |
| `contractsMock.ts` | 1200 | Contratos | Contract, ContractFinancials, Signature |
| `contractTemplatesMock.ts` | 483 | Templates de contrato | ContractTemplate, TemplateVariable |
| `financialMock.ts` | 762 | Financeiro/Cobranças | Charge, ChargeAdjustment, FinancialSummary |
| `settingsMock.ts` | 1141 | Configurações | Academy, Unit, Role, StaffUser, Policies |
| `homeMock.ts` | 282 | Dashboard home | AccessHistoryEntry, PriorityAlert, HealthMetric |
| `inviteMock.ts` | 250 | Convites/Auto-cadastro | Invite, InviteDiscount |
| `onboardingMock.ts` | 345 | Fluxo de onboarding | OnboardingSession, OnboardingStepInfo |

### 📂 `/src/data/` (Conteúdo Estático)

| Arquivo | Descrição |
|---------|-----------|
| `accessContent.ts` | Labels e textos da tela de acesso |
| `usersContent.ts` | Labels e textos da tela de usuários |

---

## Entidades e Tipos

### 🔐 authMock.ts

```typescript
// ENUMS
type UserType = "staff" | "student"
type StaffRole = "admin" | "manager" | "receptionist"
type PlanStatus = "active" | "expired" | "pending" | "suspended"

// INTERFACES
interface BaseUser {
  id: string
  name: string
  email: string
  user_type: UserType
  avatar?: string
  created_at: string
}

interface StaffUser extends BaseUser {
  user_type: "staff"
  role: StaffRole
  permissions: string[]
}

interface StudentUser extends BaseUser {
  user_type: "student"
  cpf: string
  phone: string
  plan_name?: string
  plan_status?: PlanStatus
  plan_expires_at?: string
}

interface AuthSession {
  user: AuthUser
  access_token: string
  expires_at: string
}

interface LoginResult {
  success: boolean
  session?: AuthSession
  error?: string
}
```

**Funções exportadas:**
- `loginStaff(email, password)` → LoginResult
- `loginStudent(identifier, password)` → LoginResult
- `logout()` → void
- `getCurrentSession()` → AuthSession | null
- `getCurrentUser()` → AuthUser | null
- `isStaff(user)` → boolean
- `isStudent(user)` → boolean

---

### 👥 usersMock.ts

```typescript
// ENUMS
type UserStatus = 'active' | 'inactive' | 'blocked' | 'pending'
type ContractStatus = 'active' | 'cancelled' | 'finished'
type UserType = 'student' | 'personal' | 'visitor'
type RegistrationOrigin = 'reception' | 'app' | 'website' | 'import'
type StatusChangeSource = 'system' | 'manual'
type AccessMethod = 'qr_code' | 'biometry' | 'manual'
type DigitalCardStatus = 'generated' | 'pending' | 'expired'
type BillingType = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
type PaymentMethod = 'credit_card' | 'pix' | 'boleto' | 'cash'
type FinancialStatus = 'up_to_date' | 'overdue' | 'pending'
type DocumentStatus = 'ok' | 'pending' | 'expired' | 'rejected'

// INTERFACE PRINCIPAL
interface User {
  // Identidade
  id: string
  registrationId: string          // Matrícula: "ALU-2024-0001"
  fullName: string
  email: string
  phone: string
  document: string                // CPF formatado
  userType: UserType
  unitId: string
  unitName: string
  registrationOrigin: RegistrationOrigin
  createdAt: string

  // Status
  status: UserStatus
  statusReason?: string
  statusSince: string
  statusHistory: StatusHistoryEntry[]

  // Acesso
  access: {
    isAllowed: boolean
    lastCheckIn: CheckIn | null
    checkInsLast7Days: number
    checkInsLast30Days: number
    digitalCard: {
      status: DigitalCardStatus
      generatedAt?: string
      expiresAt?: string
    }
  }

  // Plano atual
  currentPlan: {
    id: string
    name: string
    startDate: string
    endDate: string
    billingType: BillingType
    autoRenewal: boolean
    nextDueDate: string
    currentValue: number
    discount?: PlanDiscount
  } | null

  // Contratos
  contracts: UserContract[]
  currentContractId?: string

  // Financeiro
  financial: {
    status: FinancialStatus
    daysOverdue: number
    lastPayment: Payment | null
    pendingBalance: number
    nextDueDate: string
    nextDueValue: number
  }

  // Documentos
  documents: UserDocument[]
}
```

**Funções exportadas:**
- `getUserById(id)` → User | undefined
- `getUsers()` → User[]
- `searchUsers(query)` → User[]
- `filterUsersByStatus(status)` → User[]

---

### 🚪 accessMock.ts

```typescript
// ENUMS
type UserType = 'student' | 'personal' | 'visitor'
type PlanStatus = 'active' | 'inactive' | 'expired' | 'blocked'
type AccessMethod = 'qr_code' | 'manual' | 'biometry' | 'card'
type AccessStatus = 'allowed' | 'denied' | 'pending'
type DenialReason = 
  | 'plan_expired'
  | 'financial_blocked'
  | 'inactive_user'
  | 'outside_schedule'
  | 'daily_limit_reached'
  | 'unit_not_allowed'
  | 'unknown'

// INTERFACES
interface AccessUser {
  id: string
  name: string
  type: UserType
  plan: string
  planStatus: PlanStatus
  lastAccess: string | null
}

interface AccessUnit {
  id: string
  name: string
  isOpen: boolean
  currentOccupancy: number
  maxCapacity: number
}

interface AccessAttempt {
  id: string
  userId: string
  userName: string
  userType: UserType
  unitId: string
  unitName: string
  method: AccessMethod
  status: AccessStatus
  denialReason?: DenialReason
  timestamp: string
  operatorId?: string
  operatorName?: string
  notes?: string
}

interface CheckInResult {
  success: boolean
  message: string
  user?: AccessUser
  attempt?: AccessAttempt
}

interface AccessKPIs {
  todayTotal: number
  todayAllowed: number
  todayDenied: number
  currentInside: number
  peakHour: string
  peakCount: number
}

interface QRConfig {
  unitId: string
  token: string
  expiresAt: string
  refreshInterval: number
}
```

**Funções exportadas:**
- `processCheckIn(userId, unitId, method)` → CheckInResult
- `getAccessHistory(filters)` → AccessAttempt[]
- `getAccessKPIs()` → AccessKPIs
- `generateQRConfig(unitId)` → QRConfig

---

### 📋 plansMock.ts

```typescript
// ENUMS
type PlanStatus = 'active' | 'inactive' | 'draft'
type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
type ChargeType = 'prepaid' | 'postpaid'
type UserTypeAllowed = 'student' | 'personal' | 'visitor' | 'all'

// INTERFACES
interface PlanPricing {
  cycle: BillingCycle
  price: number
  discount?: number
  discountLabel?: string
}

interface EnrollmentFee {
  enabled: boolean
  value: number
  description?: string
}

interface AccessRules {
  allowedDays: number[]           // 0-6 (dom-sab)
  startTime: string               // "06:00"
  endTime: string                 // "22:00"
  dailyLimit?: number
  allowMultiUnit: boolean
  allowedUnitIds?: string[]
}

interface ContractRules {
  minDurationMonths: number
  loyaltyMonths?: number
  cancellationFee?: number
  autoRenewal: boolean
  gracePeriodDays: number
}

interface OnboardingBehavior {
  requireContract: boolean
  requirePaymentUpfront: boolean
  autoActivateAccess: boolean
}

interface PlanFeature {
  id: string
  name: string
  included: boolean
  description?: string
}

interface Plan {
  id: string
  name: string
  description: string
  status: PlanStatus
  userTypeAllowed: UserTypeAllowed
  pricing: PlanPricing[]
  enrollmentFee: EnrollmentFee
  accessRules: AccessRules
  contractRules: ContractRules
  onboardingBehavior: OnboardingBehavior
  features: PlanFeature[]
  createdAt: string
  updatedAt: string
  updatedBy: string
}
```

**Funções exportadas:**
- `getPlans()` → Plan[]
- `getPlanById(id)` → Plan | undefined
- `getActivePlans()` → Plan[]
- `formatPrice(value)` → string

---

### 📄 contractsMock.ts

```typescript
// ENUMS
type ContractStatus = 
  | 'draft'
  | 'pending_signature'
  | 'active'
  | 'suspended'
  | 'cancelled'
  | 'expired'
  | 'finished'
  | 'renewed'
  | 'terminated'

type ContractOrigin = 'reception' | 'app' | 'website' | 'migration'
type SignatureMethod = 'digital' | 'manual' | 'none'
type ContractEventType = 
  | 'created'
  | 'signed'
  | 'activated'
  | 'suspended'
  | 'reactivated'
  | 'cancelled'
  | 'renewed'
  | 'finished'
  | 'payment'
  | 'note_added'

// INTERFACES
interface PlanSnapshot {
  planId: string
  planName: string
  pricing: PlanPricing
  accessRules: AccessRules
  features: string[]
}

interface ContractFinancials {
  totalValue: number
  paidValue: number
  pendingValue: number
  enrollmentFee: number
  enrollmentFeePaid: boolean
  discounts: {
    type: 'percentage' | 'fixed'
    value: number
    reason: string
    appliedTo: 'monthly' | 'enrollment' | 'total'
  }[]
}

interface ContractSignature {
  method: SignatureMethod
  signedAt?: string
  signedBy?: string
  ipAddress?: string
  documentHash?: string
}

interface ContractEvent {
  id: string
  type: ContractEventType
  description: string
  createdAt: string
  createdBy: string
  createdByName: string
  metadata?: Record<string, unknown>
}

interface ContractReferences {
  previousContractId?: string
  renewedToContractId?: string
  linkedSubscriptionId?: string
}

interface Contract {
  id: string
  number: string                  // "CTR-2024-00001"
  status: ContractStatus
  origin: ContractOrigin
  
  // Partes
  userId: string
  userName: string
  userDocument: string
  unitId: string
  unitName: string
  
  // Plano (snapshot)
  planSnapshot: PlanSnapshot
  
  // Datas
  createdAt: string
  startDate: string
  endDate: string
  cancelledAt?: string
  finishedAt?: string
  
  // Assinatura
  signature: ContractSignature
  
  // Financeiro
  financials: ContractFinancials
  
  // Timeline
  events: ContractEvent[]
  
  // Referências
  references: ContractReferences
  
  // Documento
  templateId?: string
  documentUrl?: string
  documentContent?: string
}
```

**Funções exportadas:**
- `getContracts()` → Contract[]
- `getContractById(id)` → Contract | undefined
- `getContractsByUser(userId)` → Contract[]
- `getContractsByStatus(status)` → Contract[]

---

### 📝 contractTemplatesMock.ts

```typescript
// ENUMS
type TemplateStatus = 'draft' | 'published' | 'archived'
type VariableType = 'text' | 'date' | 'number' | 'boolean' | 'select'
type VariableSource = 'user' | 'plan' | 'academy' | 'system' | 'manual'

// INTERFACES
interface TemplateVariable {
  id: string
  name: string                    // Ex: "{{usuario.nome}}"
  label: string                   // Ex: "Nome do Usuário"
  type: VariableType
  source: VariableSource
  required: boolean
  defaultValue?: string
  options?: string[]              // Para type: 'select'
}

interface LinkedPlan {
  planId: string
  planName: string
}

interface ContractTemplate {
  id: string
  name: string
  description: string
  status: TemplateStatus
  content: string                 // HTML/Markdown com variáveis
  variables: TemplateVariable[]
  linkedPlans: LinkedPlan[]
  version: number
  createdAt: string
  updatedAt: string
  updatedBy: string
  publishedAt?: string
}
```

**Funções exportadas:**
- `getTemplates()` → ContractTemplate[]
- `getTemplateById(id)` → ContractTemplate | undefined
- `getPublishedTemplates()` → ContractTemplate[]
- `renderTemplate(template, data)` → string

---

### 💰 financialMock.ts

```typescript
// ENUMS
type ChargeStatus = 
  | 'pending'
  | 'processing'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'
  | 'failed'

type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'boleto'
  | 'cash'
  | 'transfer'

type AdjustmentType = 'discount' | 'fee' | 'refund' | 'correction'
type UserFinancialStatus = 'up_to_date' | 'overdue' | 'pending' | 'blocked'

// INTERFACES
interface ChargeAdjustment {
  id: string
  type: AdjustmentType
  value: number
  reason: string
  createdAt: string
  createdBy: string
}

interface ChargeEvent {
  id: string
  type: 'created' | 'paid' | 'cancelled' | 'refunded' | 'failed' | 'reminder_sent'
  description: string
  createdAt: string
  metadata?: Record<string, unknown>
}

interface Charge {
  id: string
  number: string                  // "COB-2024-00001"
  userId: string
  userName: string
  userDocument: string
  
  // Referência
  contractId?: string
  subscriptionId?: string
  description: string
  
  // Valores
  originalValue: number
  adjustments: ChargeAdjustment[]
  finalValue: number
  paidValue: number
  
  // Datas
  dueDate: string
  paidAt?: string
  cancelledAt?: string
  
  // Pagamento
  status: ChargeStatus
  paymentMethod?: PaymentMethod
  paymentDetails?: {
    transactionId?: string
    gateway?: string
    cardLastDigits?: string
    pixCode?: string
    boletoUrl?: string
    boletoBarcode?: string
  }
  
  // Timeline
  events: ChargeEvent[]
  
  createdAt: string
  updatedAt: string
}

interface FinancialSummary {
  totalReceived: number
  totalPending: number
  totalOverdue: number
  totalCancelled: number
  countByStatus: Record<ChargeStatus, number>
  revenueByMonth: { month: string; value: number }[]
}
```

**Funções exportadas:**
- `getCharges(filters)` → Charge[]
- `getChargeById(id)` → Charge | undefined
- `getChargesByUser(userId)` → Charge[]
- `getFinancialSummary()` → FinancialSummary
- `markAsPaid(chargeId, method, details)` → Charge
- `cancelCharge(chargeId, reason)` → Charge

---

### ⚙️ settingsMock.ts

```typescript
// ENUMS
type UnitStatus = 'active' | 'inactive' | 'maintenance'
type StaffStatus = 'active' | 'inactive' | 'blocked'
type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending'
type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'access'
type RoleId = 'admin' | 'manager' | 'receptionist' | 'financial' | 'custom'

// PERMISSÕES GRANULARES
type ModuleId = 'access' | 'users' | 'plans' | 'subscriptions' | 'contracts' | 'financial' | 'settings'
type ModuleAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'configure'

// INTERFACES
interface Academy {
  id: string
  tradeName: string
  legalName: string
  cnpj: string
  email: string
  phone: string
  whatsapp?: string
  address: Address
  logoUrl?: string
  preferences: {
    language: string
    timezone: string
    currency: string
    dateFormat: string
  }
  createdAt: Date
  updatedAt: Date
  updatedBy: string
}

interface Unit {
  id: string
  name: string
  status: UnitStatus
  address: Address
  phone?: string
  email?: string
  operatingHours: OperatingHour[]
  accessConfig: {
    qrEnabled: boolean
    qrToken: string
    qrUrl: string
    dailyLimitDefault?: number
    requireOtpNewDevice: boolean
    toleranceMinutes: number
  }
  createdAt: Date
  updatedAt: Date
  updatedBy: string
}

interface Role {
  id: RoleId
  name: string
  description: string
  isSystem: boolean
  permissions: string[]
}

interface StaffUser {
  id: string
  name: string
  email: string
  phone?: string
  role: RoleId
  roleName: string
  unitIds: string[]
  status: StaffStatus
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface Policies {
  financial: {
    gracePeriodDays: number
    autoBlockDaysOverdue: number
    lateFeePercentage: number
    dailyInterestPercentage: number
    sendReminderDaysBefore: number[]
  }
  access: {
    maxDeniedAttemptsAlert: number
    allowMultipleCheckInsDay: boolean
    logAllAttempts: boolean
  }
  updatedAt: Date
  updatedBy: string
}

interface Integration {
  id: string
  type: 'payment' | 'notification' | 'accounting' | 'other'
  provider: string
  name: string
  description: string
  status: IntegrationStatus
  config: Record<string, string | undefined>
  lastSyncAt?: Date
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

interface AuditLog {
  id: string
  action: AuditAction
  module: ModuleId | 'auth'
  userId: string
  userName: string
  userRole: RoleId
  targetType?: string
  targetId?: string
  targetName?: string
  description: string
  changes?: FieldChange[]
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}
```

**Funções exportadas:**
- `getAcademy()` → Academy
- `updateAcademy(data)` → Academy
- `getUnits()` → Unit[]
- `getUnitById(id)` → Unit | undefined
- `getRoles()` → Role[]
- `getStaffUsers()` → StaffUser[]
- `getPolicies()` → Policies
- `updatePolicies(data)` → Policies
- `getIntegrations()` → Integration[]
- `getAuditLogs(filters)` → AuditLog[]

---

### 🏠 homeMock.ts

```typescript
// ENUMS
type AccessType = 'entry' | 'exit'
type AlertPriority = 'high' | 'medium' | 'low'
type AlertType = 'financial' | 'access' | 'contract' | 'system'
type HealthStatus = 'healthy' | 'warning' | 'critical'

// INTERFACES
interface AccessHistoryEntry {
  id: string
  userName: string
  userType: string
  accessType: AccessType
  timestamp: string
  unitName: string
  method: string
}

interface PriorityAlert {
  id: string
  type: AlertType
  priority: AlertPriority
  title: string
  description: string
  actionUrl?: string
  actionLabel?: string
  createdAt: string
}

interface HealthMetric {
  id: string
  name: string
  value: number
  target?: number
  unit: string
  status: HealthStatus
  trend?: 'up' | 'down' | 'stable'
}

interface QuickAction {
  id: string
  label: string
  icon: string
  href: string
  color?: string
}

interface HomeData {
  accessHistory: AccessHistoryEntry[]
  priorityAlerts: PriorityAlert[]
  healthMetrics: HealthMetric[]
  quickActions: QuickAction[]
  kpis: {
    totalUsers: number
    activeUsers: number
    todayCheckIns: number
    monthlyRevenue: number
    overdueCharges: number
    expiringContracts: number
  }
}
```

**Funções exportadas:**
- `getHomeData()` → HomeData
- `dismissAlert(alertId)` → void

---

### 📨 inviteMock.ts

```typescript
// ENUMS
type InviteStatus = 'pending' | 'started' | 'completed' | 'expired'

// INTERFACES
interface InviteDiscount {
  type: 'percentage' | 'fixed'
  value: number
  appliesTo: 'first_month' | 'all' | 'enrollment'
  description: string
}

interface Invite {
  id: string
  token: string                   // Token único para URL
  academyId: string
  unitId: string
  unitName: string
  status: InviteStatus
  discount?: InviteDiscount
  
  // Metadados
  createdAt: string
  createdBy: string
  expiresAt: string
  
  // Rastreamento
  openedAt?: string
  startedAt?: string
  completedAt?: string
  
  // Pré-cadastro
  preRegistration?: {
    name?: string
    email?: string
    phone?: string
    onboardingSessionId?: string
  }
  
  // Resultado
  userId?: string
}
```

**Constantes:**
- `INVITE_EXPIRATION_DAYS = 7`
- `DISCOUNT_OPTIONS: InviteDiscount[]`

**Funções exportadas:**
- `getInvites()` → Invite[]
- `getInviteByToken(token)` → Invite | undefined
- `createInvite(data)` → Invite
- `updateInviteStatus(token, status)` → Invite

---

### 🚀 onboardingMock.ts

```typescript
// ENUMS
type OnboardingStep = 
  | 'identification'
  | 'personal_data'
  | 'plan_selection'
  | 'contract'
  | 'payment'
  | 'activation'

type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned'
type StepStatus = 'pending' | 'current' | 'completed' | 'skipped'

// INTERFACES
interface OnboardingStepInfo {
  id: OnboardingStep
  order: number
  title: string
  description: string
  status: StepStatus
  completedAt?: string
  data?: Record<string, unknown>
}

interface OnboardingSession {
  id: string
  userId?: string
  status: OnboardingStatus
  currentStep: OnboardingStep
  steps: OnboardingStepInfo[]
  startedAt: string
  updatedAt: string
  completedAt?: string
  startedBy: 'academy' | 'user'
  academyId: string
  
  collectedData: {
    identification?: {
      fullName: string
      email: string
      phone: string
      userType: 'student' | 'personal'
    }
    personalData?: {
      document: string
      birthDate: string
      address?: Address
      emergencyContact?: EmergencyContact
    }
    planSelection?: {
      planId: string
      planName: string
      billingType: BillingCycle
      value: number
      startDate: string
    }
    contract?: {
      contractId: string
      contractNumber: string
      acceptedTerms: boolean
      signedAt?: string
      signatureMethod?: SignatureMethod
    }
    payment?: {
      paymentId: string
      method: PaymentMethod
      status: 'pending' | 'processing' | 'completed' | 'failed'
      value: number
      paidAt?: string
    }
    activation?: {
      accessCardGenerated: boolean
      qrCodeGenerated: boolean
      activatedAt?: string
    }
  }
}

interface AvailablePlan {
  id: string
  name: string
  description: string
  features: string[]
  prices: {
    monthly: number
    quarterly: number
    semiannual: number
    annual: number
  }
  isPopular?: boolean
}
```

**Constantes:**
- `ONBOARDING_STEPS: OnboardingStepInfo[]`
- `mockAvailablePlans: AvailablePlan[]`

**Funções exportadas:**
- `createOnboardingSession(unitId, startedBy)` → OnboardingSession
- `getOnboardingSession(id)` → OnboardingSession | undefined
- `updateOnboardingStep(sessionId, step, data)` → OnboardingSession
- `completeOnboarding(sessionId)` → OnboardingSession

---

## Mapeamento Tela → Dados

### 📊 Módulos do Sistema

| Módulo | Rota | Mock Principal | Tipos Utilizados |
|--------|------|----------------|------------------|
| **Home** | `/home` | homeMock | HomeData, AccessHistoryEntry, PriorityAlert |
| **Acesso** | `/access` | accessMock | AccessAttempt, AccessKPIs, CheckInResult |
| **Usuários** | `/users` | usersMock | User, UserStatus, AccessInfo |
| **Planos** | `/plans` | plansMock | Plan, PlanPricing, AccessRules |
| **Assinaturas** | `/assinaturas` | plansMock, usersMock | Plan, User |
| **Contratos** | `/contratos` | contractsMock, contractTemplatesMock | Contract, ContractTemplate |
| **Financeiro** | `/financial` | financialMock | Charge, FinancialSummary |
| **Configurações** | `/settings/*` | settingsMock | Academy, Unit, Role, Policies |

### 🔍 Consumo Detalhado por Página

```
/home
├── homeMock.getHomeData()
├── Tipos: HomeData, AccessHistoryEntry, PriorityAlert, HealthMetric
└── KPIs: totalUsers, activeUsers, todayCheckIns, monthlyRevenue

/(app)/access
├── accessMock.getAccessHistory()
├── accessMock.getAccessKPIs()
├── accessMock.processCheckIn()
└── Tipos: AccessAttempt, AccessUser, CheckInResult

/(app)/users
├── usersMock.getUsers()
├── usersMock.getUserById()
├── usersMock.searchUsers()
└── Tipos: User (completo com nested objects)

/(app)/users/[id]
├── usersMock.getUserById()
└── Tipos: User, AccessInfo, PlanInfo, FinancialInfo

/(app)/users/onboarding
├── onboardingMock.createOnboardingSession()
├── onboardingMock.updateOnboardingStep()
├── inviteMock.createInvite()
└── Tipos: OnboardingSession, Invite

/(app)/plans
├── plansMock.getPlans()
├── plansMock.getPlanById()
└── Tipos: Plan, PlanPricing, AccessRules, ContractRules

/(app)/assinaturas
├── usersMock.mockUsers
├── plansMock.mockPlans
└── Tipos: User, Plan

/(app)/contratos
├── contractsMock.getContracts()
├── contractsMock.getContractById()
├── contractTemplatesMock.getTemplates()
└── Tipos: Contract, ContractTemplate, TemplateVariable

/(app)/financial
├── financialMock.getCharges()
├── financialMock.getFinancialSummary()
├── financialMock.markAsPaid()
└── Tipos: Charge, FinancialSummary

/(app)/settings/academy
├── settingsMock.getAcademy()
├── settingsMock.updateAcademy()
└── Tipos: Academy

/(app)/settings/units
├── settingsMock.getUnits()
├── settingsMock.deleteUnit()
└── Tipos: Unit, UnitStatus

/(app)/settings/team
├── settingsMock.getStaffUsers()
├── settingsMock.getRoles()
└── Tipos: StaffUser, Role

/(app)/settings/policies
├── settingsMock.getPolicies()
├── settingsMock.updatePolicies()
└── Tipos: Policies

/(app)/settings/integrations
├── settingsMock.getIntegrations()
├── settingsMock.updateIntegration()
└── Tipos: Integration

/(app)/settings/audit
├── settingsMock.getAuditLogs()
└── Tipos: AuditLog

/login (Staff)
├── authMock.loginStaff()
└── Tipos: StaffUser, AuthSession

/aluno/login (Student)
├── authMock.loginStudent()
└── Tipos: StudentUser, AuthSession

/aluno (Dashboard)
├── authMock.getCurrentUser()
└── Tipos: StudentUser

/cadastro/[token]
├── inviteMock.getInviteByToken()
├── onboardingMock.*
└── Tipos: Invite, OnboardingSession

/(protected)/scanner
├── authMock.getCurrentUser()
├── accessMock.processCheckIn()
└── Tipos: AuthUser, CheckInResult
```

---

## Esquema Supabase Sugerido

### 🗄️ Tabelas Principais

```sql
-- AUTENTICAÇÃO (usa Supabase Auth)
-- auth.users gerenciado pelo Supabase

-- PERFIS DE USUÁRIO
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  user_type TEXT NOT NULL CHECK (user_type IN ('staff', 'student')),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cpf TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STAFF (extensão de profiles)
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'receptionist', 'financial')),
  permissions TEXT[],
  unit_ids UUID[]
);

-- STUDENT (extensão de profiles)
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  registration_id TEXT UNIQUE NOT NULL,
  birth_date DATE,
  address JSONB,
  emergency_contact JSONB,
  registration_origin TEXT,
  status TEXT DEFAULT 'pending',
  status_reason TEXT,
  status_since TIMESTAMPTZ DEFAULT NOW()
);

-- ACADEMIAS
CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address JSONB,
  logo_url TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UNIDADES
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  address JSONB,
  phone TEXT,
  email TEXT,
  operating_hours JSONB,
  access_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLANOS
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  user_type_allowed TEXT DEFAULT 'all',
  pricing JSONB NOT NULL,
  enrollment_fee JSONB,
  access_rules JSONB,
  contract_rules JSONB,
  onboarding_behavior JSONB,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRATOS
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  unit_id UUID REFERENCES units(id),
  plan_snapshot JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  origin TEXT,
  start_date DATE,
  end_date DATE,
  signature JSONB,
  financials JSONB,
  template_id UUID,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEMPLATES DE CONTRATO
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  content TEXT,
  variables JSONB,
  linked_plans JSONB,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- COBRANÇAS
CREATE TABLE charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  contract_id UUID REFERENCES contracts(id),
  description TEXT,
  original_value DECIMAL(10,2) NOT NULL,
  adjustments JSONB,
  final_value DECIMAL(10,2) NOT NULL,
  paid_value DECIMAL(10,2) DEFAULT 0,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TENTATIVAS DE ACESSO
CREATE TABLE access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  unit_id UUID REFERENCES units(id),
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  denial_reason TEXT,
  operator_id UUID REFERENCES profiles(id),
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- CONVITES
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  academy_id UUID REFERENCES academies(id),
  unit_id UUID REFERENCES units(id),
  status TEXT DEFAULT 'pending',
  discount JSONB,
  created_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  opened_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  pre_registration JSONB,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSÕES DE ONBOARDING
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'not_started',
  current_step TEXT,
  steps JSONB,
  started_by TEXT,
  academy_id UUID REFERENCES academies(id),
  collected_data JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- LOGS DE AUDITORIA
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  description TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- INTEGRAÇÕES
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'inactive',
  config JSONB,
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- POLÍTICAS
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) UNIQUE,
  financial JSONB,
  access JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);
```

### 🔗 Views Úteis

```sql
-- View de usuários com status de acesso
CREATE VIEW user_access_status AS
SELECT 
  p.id,
  p.name,
  sp.registration_id,
  sp.status,
  c.status as contract_status,
  ch.status as financial_status,
  (SELECT timestamp FROM access_attempts 
   WHERE user_id = p.id 
   ORDER BY timestamp DESC LIMIT 1) as last_access
FROM profiles p
JOIN student_profiles sp ON p.id = sp.id
LEFT JOIN contracts c ON c.user_id = p.id AND c.status = 'active'
LEFT JOIN charges ch ON ch.user_id = p.id AND ch.status = 'overdue';

-- View de KPIs do home
CREATE VIEW home_kpis AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'student') as total_users,
  (SELECT COUNT(*) FROM student_profiles WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM access_attempts WHERE timestamp::date = CURRENT_DATE) as today_check_ins,
  (SELECT COALESCE(SUM(paid_value), 0) FROM charges 
   WHERE paid_at >= date_trunc('month', CURRENT_DATE)) as monthly_revenue,
  (SELECT COUNT(*) FROM charges WHERE status = 'overdue') as overdue_charges;
```

---

## Relacionamentos

### 📊 Diagrama de Entidades

```
┌─────────────────────────────────────────────────────────────────┐
│                         AUTENTICAÇÃO                             │
├─────────────────────────────────────────────────────────────────┤
│  auth.users (Supabase) ──┬── profiles                           │
│                          ├── staff_profiles                     │
│                          └── student_profiles                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ESTRUTURA DA ACADEMIA                       │
├─────────────────────────────────────────────────────────────────┤
│  academies ──┬── units                                          │
│              ├── plans                                          │
│              ├── contract_templates                             │
│              ├── policies                                       │
│              └── integrations                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     JORNADA DO USUÁRIO                          │
├─────────────────────────────────────────────────────────────────┤
│  invites ─── onboarding_sessions ─── profiles ──┬── contracts  │
│                                                  ├── charges    │
│                                                  └── access_attempts
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        RELACIONAMENTOS                           │
├─────────────────────────────────────────────────────────────────┤
│  profiles 1:N contracts                                         │
│  profiles 1:N charges                                           │
│  profiles 1:N access_attempts                                   │
│  contracts N:1 plans (via snapshot)                             │
│  contracts N:1 contract_templates                               │
│  charges N:1 contracts                                          │
│  units N:1 academies                                            │
│  plans N:1 academies                                            │
│  invites N:1 units                                              │
│  onboarding_sessions N:1 profiles                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Próximos Passos

### ✅ Checklist de Migração

- [ ] Criar projeto Supabase
- [ ] Executar DDL das tabelas
- [ ] Configurar Row Level Security (RLS)
- [ ] Criar funções RPC para lógica complexa
- [ ] Migrar dados mock para seed inicial
- [ ] Substituir imports de mock por clients Supabase
- [ ] Implementar autenticação real
- [ ] Configurar storage para documentos/logos
- [ ] Configurar Edge Functions para webhooks

### 📝 Notas de Implementação

1. **Autenticação**: Usar Supabase Auth com custom claims para role
2. **RLS**: Habilitar em todas as tabelas, policies por academy_id
3. **Snapshots**: Manter JSONB para snapshots de plano em contratos
4. **Auditoria**: Triggers automáticos para popular audit_logs
5. **Soft Delete**: Considerar status 'deleted' vs exclusão real

---

> 📌 **Documento gerado para apoiar migração mock → Supabase**
> 
> Para dúvidas, consulte `/src/mocks/` e os componentes em `/src/app/`
