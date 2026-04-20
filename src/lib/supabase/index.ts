// Supabase client and types
export { createClient } from './client';
export { createServerSupabaseClient } from './server';
export { updateSession } from './middleware';
export { getActiveAcademyId } from './academyScope';
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './types';

// Data provider functions
export {
  // Auth
  loginStaff,
  loginStudent,
  getSession,
  getCurrentUser,
  logout,
  // Invites
  validateInvite,
  acceptInvite,
  // Profile
  updateProfile,
  // Academy
  getMyAcademies,
  getUnits,
  // Staff
  getStaffList,
  // Students
  getStudentList,
  getStudent,
  // Types
  type MyProfile,
  type StaffWithRole,
  type StudentWithStatus,
  type LoginResult,
  type InviteData,
} from './dataProvider';
