/**
 * Mock de Autenticação
 * Sistema de autenticação fake para demonstração
 * Preparado para futura integração com Supabase
 * 
 * === EQUIPE (Staff) ===
 * - admin@moveaccess.com / senha: Admin@123 → Administrador
 * - gerente@moveaccess.com / senha: Gerente@123 → Gerente
 * - recepcionista@moveaccess.com / senha: Recep@123 → Recepcionista
 * 
 * === ALUNOS (Students) ===
 * - CPF: 12345678900 ou Tel: 11987654321 / senha: Aluno@123 → João Silva
 * - CPF: 98765432100 ou Tel: 11999887766 / senha: Maria@123 → Maria Santos
 * - CPF: 11122233344 ou Tel: 11988776655 / senha: Pedro@123 → Pedro Oliveira (plano expirado)
 */

// ============================================
// TIPOS
// ============================================

export type UserType = "staff" | "student";
export type StaffRole = "admin" | "manager" | "receptionist";
export type PlanStatus = "active" | "expired" | "pending" | "suspended";

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
  avatar?: string;
  created_at: string;
}

export interface StaffUser extends BaseUser {
  user_type: "staff";
  role: StaffRole;
  permissions: string[];
}

export interface StudentUser extends BaseUser {
  user_type: "student";
  cpf: string;
  phone: string;
  plan_name?: string;
  plan_status?: PlanStatus;
  plan_expires_at?: string;
}

export type AuthUser = StaffUser | StudentUser;

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  expires_at: string;
}

export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

// ============================================
// MOCK DATA - EQUIPE
// ============================================

const MOCK_STAFF: Record<string, { password: string; user: StaffUser }> = {
  "admin@moveaccess.com": {
    password: "Admin@123",
    user: {
      id: "staff-001",
      name: "Administrador Move",
      email: "admin@moveaccess.com",
      user_type: "staff",
      role: "admin",
      permissions: ["*"],
      created_at: "2024-01-01T00:00:00Z",
    },
  },
  "gerente@moveaccess.com": {
    password: "Gerente@123",
    user: {
      id: "staff-002",
      name: "Carlos Gerente",
      email: "gerente@moveaccess.com",
      user_type: "staff",
      role: "manager",
      permissions: ["users.read", "users.write", "financial.read", "reports.read"],
      created_at: "2024-02-15T00:00:00Z",
    },
  },
  "recepcionista@moveaccess.com": {
    password: "Recep@123",
    user: {
      id: "staff-003",
      name: "Ana Recepção",
      email: "recepcionista@moveaccess.com",
      user_type: "staff",
      role: "receptionist",
      permissions: ["users.read", "access.read", "access.checkin"],
      created_at: "2024-03-10T00:00:00Z",
    },
  },
};

// ============================================
// MOCK DATA - ALUNOS
// ============================================

interface StudentCredentials {
  password: string;
  user: StudentUser;
}

const MOCK_STUDENTS: {
  byCpf: Record<string, StudentCredentials>;
  byPhone: Record<string, StudentCredentials>;
} = {
  byCpf: {},
  byPhone: {},
};

// Aluno 1 - João Silva
const joaoSilva: StudentCredentials = {
  password: "Aluno@123",
  user: {
    id: "student-001",
    name: "João Silva",
    email: "joao.silva@email.com",
    cpf: "12345678900",
    phone: "11987654321",
    user_type: "student",
    plan_name: "Plano Mensal",
    plan_status: "active",
    plan_expires_at: "2026-02-14T23:59:59Z",
    created_at: "2024-06-01T00:00:00Z",
  },
};

// Aluno 2 - Maria Santos
const mariaSantos: StudentCredentials = {
  password: "Maria@123",
  user: {
    id: "student-002",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    cpf: "98765432100",
    phone: "11999887766",
    user_type: "student",
    plan_name: "Plano Trimestral",
    plan_status: "active",
    plan_expires_at: "2026-04-01T23:59:59Z",
    created_at: "2024-07-15T00:00:00Z",
  },
};

// Aluno 3 - Pedro com plano expirado
const pedroOliveira: StudentCredentials = {
  password: "Pedro@123",
  user: {
    id: "student-003",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@email.com",
    cpf: "11122233344",
    phone: "11988776655",
    user_type: "student",
    plan_name: "Plano Mensal",
    plan_status: "expired",
    plan_expires_at: "2025-12-31T23:59:59Z",
    created_at: "2024-08-20T00:00:00Z",
  },
};

// Indexar alunos por CPF e telefone
[joaoSilva, mariaSantos, pedroOliveira].forEach((student) => {
  MOCK_STUDENTS.byCpf[student.user.cpf] = student;
  MOCK_STUDENTS.byPhone[student.user.phone] = student;
});

// ============================================
// CONTROLE DE TENTATIVAS (Bloqueio leve)
// ============================================

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const loginAttempts: Record<string, LoginAttempt> = {};

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60 * 1000; // 1 minuto

function checkRateLimit(identifier: string): { allowed: boolean; waitTime?: number } {
  const now = Date.now();
  const attempt = loginAttempts[identifier];

  if (!attempt) {
    return { allowed: true };
  }

  // Verificar se está bloqueado
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const waitTime = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { allowed: false, waitTime };
  }

  // Reset se passou tempo suficiente
  if (attempt.lockedUntil && now >= attempt.lockedUntil) {
    loginAttempts[identifier] = { count: 0, lastAttempt: now };
  }

  return { allowed: true };
}

function recordAttempt(identifier: string, success: boolean): void {
  const now = Date.now();

  if (success) {
    delete loginAttempts[identifier];
    return;
  }

  const attempt = loginAttempts[identifier] || { count: 0, lastAttempt: now };
  attempt.count += 1;
  attempt.lastAttempt = now;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCK_DURATION_MS;
  }

  loginAttempts[identifier] = attempt;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  SESSION: "moveaccess_session",
  USER_TYPE: "moveaccess_user_type",
} as const;

// ============================================
// HELPERS
// ============================================

function normalizeIdentifier(value: string): string {
  return value.replace(/\D/g, "");
}

function generateToken(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function getExpirationDate(): string {
  const date = new Date();
  date.setHours(date.getHours() + 24); // 24 horas
  return date.toISOString();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// FUNÇÕES DE LOGIN
// ============================================

/**
 * Login da equipe (admin/funcionários)
 * @param email Email do funcionário
 * @param password Senha
 */
export async function loginStaff(email: string, password: string): Promise<LoginResult> {
  // Simular latência de rede
  await delay(800 + Math.random() * 400);

  const identifier = email.toLowerCase();

  // Rate limiting
  const rateCheck = checkRateLimit(identifier);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Muitas tentativas. Aguarde ${rateCheck.waitTime} segundos.`,
    };
  }

  const userData = MOCK_STAFF[identifier];

  // Erro genérico para não revelar se email existe
  if (!userData || userData.password !== password) {
    recordAttempt(identifier, false);
    return {
      success: false,
      error: "Usuário ou senha inválidos",
    };
  }

  // Login bem-sucedido
  recordAttempt(identifier, true);

  const session: AuthSession = {
    user: userData.user,
    access_token: generateToken(),
    expires_at: getExpirationDate(),
  };

  // Persistir sessão
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEYS.USER_TYPE, "staff");
  }

  return { success: true, session };
}

/**
 * Login do aluno
 * @param identifier CPF ou telefone (apenas números ou formatado)
 * @param password Senha
 */
export async function loginStudent(identifier: string, password: string): Promise<LoginResult> {
  // Simular latência de rede
  await delay(800 + Math.random() * 400);

  const normalized = normalizeIdentifier(identifier);

  // Rate limiting
  const rateCheck = checkRateLimit(normalized);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Muitas tentativas. Aguarde ${rateCheck.waitTime} segundos.`,
    };
  }

  // Buscar por CPF ou telefone
  const userData = MOCK_STUDENTS.byCpf[normalized] || MOCK_STUDENTS.byPhone[normalized];

  // Erro genérico
  if (!userData || userData.password !== password) {
    recordAttempt(normalized, false);
    return {
      success: false,
      error: "Usuário ou senha inválidos",
    };
  }

  // Login bem-sucedido
  recordAttempt(normalized, true);

  const session: AuthSession = {
    user: userData.user,
    access_token: generateToken(),
    expires_at: getExpirationDate(),
  };

  // Persistir sessão
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEYS.USER_TYPE, "student");
  }

  return { success: true, session };
}

// ============================================
// FUNÇÕES DE SESSÃO
// ============================================

/**
 * Obtém a sessão atual
 */
export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!stored) return null;

  try {
    const session: AuthSession = JSON.parse(stored);
    
    // Verificar expiração
    if (new Date(session.expires_at) < new Date()) {
      logout();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Obtém o usuário atual
 */
export function getCurrentUser(): AuthUser | null {
  const session = getSession();
  return session?.user || null;
}

/**
 * Obtém o tipo de usuário atual
 */
export function getCurrentUserType(): UserType | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.USER_TYPE) as UserType | null;
}

/**
 * Verifica se está autenticado
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Verifica se é staff
 */
export function isStaff(): boolean {
  const user = getCurrentUser();
  return user?.user_type === "staff";
}

/**
 * Verifica se é aluno
 */
export function isStudent(): boolean {
  const user = getCurrentUser();
  return user?.user_type === "student";
}

/**
 * Faz logout
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
  }
}

// ============================================
// EXPORTS PARA RETROCOMPATIBILIDADE
// ============================================

export type UserRole = "aluno" | "academia";

export interface AuthUserLegacy {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  role: "aluno" | "academia";
  planName?: string;
  planStatus?: "active" | "expired" | "pending";
}

/**
 * @deprecated Use loginStaff ou loginStudent
 */
export function mockLogin(
  email: string,
  password: string
): { success: boolean; user?: AuthUserLegacy; error?: string } {
  const userData = MOCK_STAFF[email.toLowerCase()];

  if (!userData) {
    return { success: false, error: "Email não encontrado" };
  }

  if (userData.password !== password) {
    return { success: false, error: "Senha incorreta" };
  }

  const legacyUser: AuthUserLegacy = {
    id: userData.user.id,
    email: userData.user.email,
    name: userData.user.name,
    role: "academia",
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("moveaccess_auth_user", JSON.stringify(legacyUser));
  }

  return { success: true, user: legacyUser };
}

/**
 * @deprecated Use logout
 */
export function mockLogout(): void {
  logout();
  if (typeof window !== "undefined") {
    localStorage.removeItem("moveaccess_auth_user");
  }
}

/**
 * Verifica se tem permissão para acessar rota
 */
export function hasAccess(allowedRoles: UserRole[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Mapear novos tipos para roles legadas
  if (user.user_type === "staff") {
    return allowedRoles.includes("academia");
  }
  if (user.user_type === "student") {
    return allowedRoles.includes("aluno");
  }
  
  return false;
}
