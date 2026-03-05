/**
 * Settings Module - Public API
 */

// Service (switch layer)
export * from './settingsService';
export * from './overviewService';
export * from './teamService';

// Feature Flags
export { USE_SUPABASE_SETTINGS, DEBUG_SETTINGS } from './featureFlags';
