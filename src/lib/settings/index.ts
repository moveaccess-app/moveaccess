/**
 * Settings Module - Public API
 */

// Service (switch layer)
export * from './settingsService';
export * from './overviewService';
export * from './integrationsService';
export {
	getStaffUsers,
	getStaffUserById,
	getRoles,
	getUnits as getTeamUnits,
	createStaffUser,
	updateStaffUser,
	toggleStaffStatus,
	type StaffListResult,
	type StaffUser,
	type Role,
	type RoleId,
	type StaffStatus,
} from './teamService';

// Feature Flags
export { USE_SUPABASE_SETTINGS, DEBUG_SETTINGS } from './featureFlags';
