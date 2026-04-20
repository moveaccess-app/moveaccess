import type {
  AuthSession,
  AuthUser,
  StaffRole,
  UserType,
} from './authService';

export interface CurrentUserSession {
  accessToken: string;
  expiresAt: string;
}

export interface CurrentUserProfile {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  avatarUrl?: string;
  createdAt: string;
  cpf?: string;
  phone?: string;
  planName?: string;
  planStatus?: string;
  planExpiresAt?: string;
  staffStatus?: string | null;
  studentStatus?: string | null;
}

export interface CurrentUserAuthorization {
  role: StaffRole | null;
  permissions: string[];
}

export interface CurrentUserTenancy {
  academyIds: string[];
  unitIds: string[];
  setupCompleted: boolean;
}

export interface CurrentUser {
  session: CurrentUserSession;
  profile: CurrentUserProfile;
  authorization: CurrentUserAuthorization;
  tenancy: CurrentUserTenancy;
}

type AuthUserWithOptionalFields = AuthUser & {
  role?: StaffRole;
  permissions?: string[];
  academy_ids?: string[];
  unit_ids?: string[];
  staff_status?: string | null;
  student_status?: string | null;
  setup_completed?: boolean;
};

export function mapSessionToCurrentUser(session: AuthSession | null): CurrentUser | null {
  if (!session?.user) {
    return null;
  }

  const user = session.user as AuthUserWithOptionalFields;
  const isStaff = user.user_type === 'staff';

  return {
    session: {
      accessToken: session.access_token,
      expiresAt: session.expires_at,
    },
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.user_type,
      avatarUrl: user.avatar,
      createdAt: user.created_at,
      cpf: user.user_type === 'student' ? user.cpf : undefined,
      phone: user.user_type === 'student' ? user.phone : undefined,
      planName: user.user_type === 'student' ? user.plan_name : undefined,
      planStatus: user.user_type === 'student' ? user.plan_status : undefined,
      planExpiresAt: user.user_type === 'student' ? user.plan_expires_at : undefined,
      staffStatus: user.staff_status ?? (isStaff ? 'active' : null),
      studentStatus: user.student_status ?? (user.user_type === 'student' ? 'active' : null),
    },
    authorization: {
      role: isStaff ? (user.role ?? null) : null,
      permissions: isStaff ? (user.permissions ?? []) : [],
    },
    tenancy: {
      academyIds: Array.isArray(user.academy_ids) ? user.academy_ids : [],
      unitIds: Array.isArray(user.unit_ids) ? user.unit_ids : [],
      setupCompleted: user.setup_completed ?? true,
    },
  };
}
